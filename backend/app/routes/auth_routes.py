import re
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.user import User
from app.services.two_factor_service import TwoFactorService
from app.services.token_service import TokenService

from app.services.validators import (
    validate_email,
    validate_password_complexity,
    validate_username,
    validate_password_change,
    sanitize_pagination_params,
    EMAIL_REGEX
)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def get_authenticated_user():
    """
    Função utilitária para extrair e validar o usuário autenticado a partir do Bearer JWT.
    Retorna (user, None) em caso de sucesso, ou (None, (json_response, status_code)) em erro.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None, (jsonify({"error": "Token de autenticação não fornecido."}), 401)

    token = auth_header.split(" ", 1)[1]
    payload = TokenService.decode_token(token)
    if not payload or payload.get("type") != "access":
        return None, (jsonify({"error": "Token de autenticação inválido ou expirado."}), 401)

    user_id = payload.get("sub")
    user = db.session.get(User, user_id) if hasattr(db.session, "get") else User.query.get(user_id)
    if not user or not user.is_active:
        return None, (jsonify({"error": "Usuário não encontrado ou conta inativa."}), 401)

    return user, None

@auth_bp.route("/register", methods=["POST"])
def register():
    """
    Rota para cadastro de novos usuários (US-01).
    Garante perfil 'student' obrigatório, valida formato de e-mail e complexidade de senha.
    """
    data = request.get_json() or {}
    username = str(data.get("username", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    # Cenário 6: Submissão com campos obrigatórios vazios
    if not username or not email or not password:
        return jsonify({"error": "Campo obrigatório. Preencha nome de usuário, e-mail e senha."}), 400

    # Cenário 3: Validação de formato de e-mail inválido
    is_valid_email, email_err = validate_email(email)
    if not is_valid_email:
        return jsonify({"error": email_err}), 400

    # Cenário 4: Senha fora dos padrões de complexidade (mínimo 8 caracteres, ao menos uma letra e um número)
    is_valid_pass, pass_err = validate_password_complexity(password)
    if not is_valid_pass:
        return jsonify({"error": pass_err}), 400

    # Cenário 2: Tentativa de cadastro com e-mail já existente
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Este e-mail já está cadastrado."}), 409

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Este nome de usuário já está cadastrado."}), 409

    # Cenário 1 e 7: Criação com perfil forçado para 'student' (imune a autoatribuição de perfil privilegiado)
    user = User(username=username, email=email, role="student")
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "Cadastro realizado com sucesso",
        "user": user.to_dict()
    }), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Rota de login de usuários.
    Valida credenciais. Se o usuário tiver 2FA ativo, emite um token temporário.
    Caso contrário, emite o JWT final de acesso.
    """
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Informe e-mail e senha."}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({"error": "Credenciais inválidas."}), 401

    if not user.is_active:
        return jsonify({"error": "Esta conta foi desativada ou excluída."}), 403

    # Se a conta possuir 2FA habilitado, inicia o fluxo de segundo fator
    if user.is_2fa_enabled:
        temp_token = TokenService.generate_2fa_temp_token(user.id)
        return jsonify({
            "requires_2fa": True,
            "temp_token": temp_token,
            "message": "Autenticação em duas etapas necessária. Insira o código do autenticador."
        }), 200

    # Login direto sem 2FA
    access_token = TokenService.generate_access_token(user.id, user.role)
    return jsonify({
        "requires_2fa": False,
        "access_token": access_token,
        "user": user.to_dict(),
        "message": "Login realizado com sucesso!"
    }), 200

@auth_bp.route("/login/2fa", methods=["POST"])
def login_2fa():
    """
    Segunda etapa do login: recebe o código de 6 dígitos e o token temporário.
    Emite o JWT final após validação do TOTP.
    """
    data = request.get_json() or {}
    temp_token = data.get("temp_token")
    code = data.get("code")

    if not temp_token or not code:
        return jsonify({"error": "Token temporário e código de verificação são obrigatórios."}), 400

    payload = TokenService.decode_token(temp_token)
    if not payload or payload.get("type") != "2fa_temp":
        return jsonify({"error": "Sessão de verificação 2FA expirada ou inválida. Faça login novamente."}), 401

    user = db.session.get(User, payload.get("sub")) if hasattr(db.session, "get") else User.query.get(payload.get("sub"))
    if not user or not user.is_active:
        return jsonify({"error": "Usuário não encontrado ou conta inativa."}), 404

    # Validação do código TOTP com o segredo do usuário
    is_valid = TwoFactorService.verify_token(user.two_factor_secret, code)
    if not is_valid:
        return jsonify({"error": "Código de autenticação inválido ou expirado."}), 401

    access_token = TokenService.generate_access_token(user.id, user.role)
    return jsonify({
        "requires_2fa": False,
        "access_token": access_token,
        "user": user.to_dict(),
        "message": "Autenticação em duas etapas concluída com sucesso!"
    }), 200

@auth_bp.route("/2fa/setup", methods=["POST"])
def setup_2fa():
    """Gera um novo segredo Base32 e URI para o usuário configurar no app autenticador."""
    data = request.get_json() or {}
    user_id = data.get("user_id")

    user = db.session.get(User, user_id) if hasattr(db.session, "get") else User.query.get(user_id)
    if not user:
        return jsonify({"error": "Usuário não encontrado."}), 404

    secret = TwoFactorService.generate_secret()
    uri = TwoFactorService.get_provisioning_uri(user.email, secret)

    # Salva temporariamente o secret gerado no usuário
    user.two_factor_secret = secret
    db.session.commit()

    return jsonify({
        "secret": secret,
        "provisioning_uri": uri,
        "message": "Segredo 2FA gerado. Escaneie no autenticador e confirme com um código."
    }), 200

@auth_bp.route("/2fa/confirm-setup", methods=["POST"])
def confirm_setup_2fa():
    """Confirma a ativação do 2FA validando o primeiro código fornecido pelo usuário."""
    data = request.get_json() or {}
    user_id = data.get("user_id")
    code = data.get("code")

    user = db.session.get(User, user_id) if hasattr(db.session, "get") else User.query.get(user_id)
    if not user or not user.two_factor_secret:
        return jsonify({"error": "Configuração de 2FA não iniciada."}), 400

    if not TwoFactorService.verify_token(user.two_factor_secret, code):
        return jsonify({"error": "Código inválido. Tente novamente."}), 400

    user.is_2fa_enabled = True
    db.session.commit()

    return jsonify({
        "message": "Autenticação em dois fatores ativada com sucesso!",
        "is_2fa_enabled": True
    }), 200

# ==========================================
# ENDPOINTS DA US-04: CONFIGURAÇÕES DO USUÁRIO
# ==========================================

@auth_bp.route("/me", methods=["GET"])
def get_me():
    """
    Cenário 1 e 12: Retorna os dados do usuário autenticado para pré-carregamento.
    """
    user, error_response = get_authenticated_user()
    if error_response:
        return error_response

    return jsonify({"user": user.to_dict()}), 200

@auth_bp.route("/profile", methods=["PUT"])
def update_profile():
    """
    Cenários 2 a 6 e 12: Atualização de username e e-mail com checagem de unicidade e formato.
    """
    user, error_response = get_authenticated_user()
    if error_response:
        return error_response

    data = request.get_json() or {}
    new_username = str(data.get("username", "")).strip()
    new_email = str(data.get("email", "")).strip().lower()

    if not new_username or not new_email:
        return jsonify({"error": "Preencha nome de usuário e e-mail."}), 400

    # Cenário 6: Validação de e-mail com formato inválido
    is_valid_email, _ = validate_email(new_email)
    if not is_valid_email:
        return jsonify({"error": "Informe um e-mail válido"}), 400

    # Cenário 4: Tentativa de alteração para username já existente (de outro usuário)
    if new_username != user.username:
        conflict_user = User.query.filter(User.username == new_username, User.id != user.id).first()
        if conflict_user:
            return jsonify({"error": "Este username já está em uso"}), 409

    # Cenário 5: Tentativa de alteração para e-mail já existente (de outro usuário)
    if new_email != user.email:
        conflict_email = User.query.filter(User.email == new_email, User.id != user.id).first()
        if conflict_email:
            return jsonify({"error": "Este e-mail já está cadastrado"}), 409

    user.username = new_username
    user.email = new_email
    db.session.commit()

    return jsonify({
        "message": "Dados atualizados com sucesso",
        "user": user.to_dict()
    }), 200

@auth_bp.route("/change-password", methods=["PUT"])
def change_password():
    """
    Cenários 7 a 12: Alteração de senha com validação de senha atual, complexidade e invalidação de sessão.
    """
    user, error_response = get_authenticated_user()
    if error_response:
        return error_response

    data = request.get_json() or {}
    current_password = str(data.get("current_password", ""))
    new_password = str(data.get("new_password", ""))

    if not current_password or not new_password:
        return jsonify({"error": "Informe a senha atual e a nova senha."}), 400

    # Cenários 8, 10 e 11: Validação via serviço de validação
    is_valid_change, change_err = validate_password_change(
        current_password,
        new_password,
        is_current_password_valid=user.check_password(current_password)
    )
    if not is_valid_change:
        return jsonify({"error": change_err}), 400

    if user.check_password(new_password):
        return jsonify({"error": "A nova senha deve ser diferente da senha atual"}), 400

    # Cenário 7: Atualiza a senha com o novo hash
    user.set_password(new_password)
    db.session.commit()

    # Reemite token JWT para renovação de sessão (invalida implicitamente tokens velhos se houver verificação)
    new_access_token = TokenService.generate_access_token(user.id, user.role)

    return jsonify({
        "message": "Senha alterada com sucesso",
        "access_token": new_access_token,
        "user": user.to_dict()
    }), 200

# ==========================================
# ENDPOINTS DA US-05: GESTÃO E LISTAGEM DE USUÁRIOS (ADMIN)
# ==========================================

@auth_bp.route("/users", methods=["GET"])
def list_users():
    """
    US-05: Listagem de usuários paginada (10 por página), com busca e filtro por role e status.
    Acesso restrito para usuários com perfil 'admin'.
    """
    user, error_response = get_authenticated_user()
    if error_response:
        return error_response

    # Bloqueio para perfil que não seja Administrador
    if user.role != "admin":
        return jsonify({"error": "Acesso restrito para administradores."}), 403

    page_raw = request.args.get("page", 1)
    per_page_raw = request.args.get("per_page", 10)
    page, per_page = sanitize_pagination_params(page_raw, per_page_raw, default_per_page=10)
    search = request.args.get("search", "", type=str).strip()
    role = request.args.get("role", "", type=str).strip().lower()
    status = request.args.get("status", "", type=str).strip().lower()

    query = User.query

    # Filtrar por termo de busca em username ou email
    if search:
        search_pattern = f"%{search}%"
        query = query.filter((User.username.ilike(search_pattern)) | (User.email.ilike(search_pattern)))

    # Filtrar por perfil de acesso
    if role and role != "all":
        query = query.filter(User.role == role)

    # Filtrar por status ativo/inativo
    if status == "active":
        query = query.filter(User.is_active.is_(True))
    elif status in ("inactive", "disabled"):
        query = query.filter(User.is_active.is_(False))

    query = query.order_by(User.created_at.desc(), User.id.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    # Proteção de dados sensíveis (sem senha_hash nem segredo 2FA)
    users_data = [u.to_dict() for u in pagination.items]

    return jsonify({
        "users": users_data,
        "total": pagination.total,
        "page": pagination.page,
        "per_page": pagination.per_page,
        "pages": pagination.pages,
        "has_prev": pagination.has_prev,
        "has_next": pagination.has_next
    }), 200

@auth_bp.route("/users/<int:user_id>", methods=["GET"])
def get_user_by_id(user_id):
    """
    Retorna os dados de um usuário específico para visualização ou edição.
    Acesso permitido para administradores ou para o próprio usuário autenticado.
    """
    user, error_response = get_authenticated_user()
    if error_response:
        return error_response

    if user.role != "admin" and user.id != user_id:
        return jsonify({"error": "Acesso restrito para administradores."}), 403

    target_user = db.session.get(User, user_id) if hasattr(db.session, "get") else User.query.get(user_id)
    if not target_user:
        return jsonify({"error": "Usuário não encontrado."}), 404

    return jsonify({"user": target_user.to_dict()}), 200

@auth_bp.route("/users/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    """
    Permite ao Administrador atualizar os dados de qualquer usuário:
    username, email, role, is_active e redefinição opcional de senha.
    Protege contra desativação ou rebaixamento do último administrador ativo.
    """
    user, error_response = get_authenticated_user()
    if error_response:
        return error_response

    if user.role != "admin":
        return jsonify({"error": "Acesso restrito para administradores."}), 403

    target_user = db.session.get(User, user_id) if hasattr(db.session, "get") else User.query.get(user_id)
    if not target_user:
        return jsonify({"error": "Usuário não encontrado."}), 404

    data = request.get_json() or {}

    # 1. Atualização do Nome de Usuário
    if "username" in data:
        new_username = str(data.get("username", "")).strip()
        is_valid_u, user_err = validate_username(new_username)
        if not is_valid_u:
            return jsonify({"error": user_err}), 400

        if new_username != target_user.username:
            conflict = User.query.filter(User.username == new_username, User.id != user_id).first()
            if conflict:
                return jsonify({"error": "Este username já está em uso"}), 409
            target_user.username = new_username

    # 2. Atualização do E-mail
    if "email" in data:
        new_email = str(data.get("email", "")).strip().lower()
        is_valid_e, email_err = validate_email(new_email)
        if not is_valid_e:
            return jsonify({"error": email_err}), 400

        if new_email != target_user.email:
            conflict = User.query.filter(User.email == new_email, User.id != user_id).first()
            if conflict:
                return jsonify({"error": "Este e-mail já está cadastrado"}), 409
            target_user.email = new_email

    # 3. Atualização do Perfil (Role)
    if "role" in data:
        new_role = str(data.get("role", "")).strip().lower()
        if new_role not in ["student", "admin"]:
            return jsonify({"error": "Perfil inválido. Deve ser 'student' ou 'admin'."}), 400

        # Protege rebaixamento do último administrador ativo
        if target_user.role == "admin" and new_role != "admin" and target_user.is_active:
            active_admins = User.query.filter(User.role == "admin", User.is_active.is_(True)).count()
            if active_admins <= 1:
                return jsonify({"error": "Não é possível alterar o perfil do único administrador ativo do sistema."}), 400

        target_user.role = new_role

    # 4. Atualização de Status (is_active)
    if "is_active" in data:
        new_is_active = bool(data.get("is_active"))
        # Protege desativação do último administrador ativo
        if target_user.role == "admin" and target_user.is_active and not new_is_active:
            active_admins = User.query.filter(User.role == "admin", User.is_active.is_(True)).count()
            if active_admins <= 1:
                return jsonify({"error": "Não é possível desativar o único administrador ativo do sistema."}), 400

        target_user.is_active = new_is_active

    # 5. Redefinição opcional de Senha por Admin
    if "password" in data and data.get("password"):
        new_pass = str(data.get("password", ""))
        is_valid_p, pass_err = validate_password_complexity(new_pass)
        if not is_valid_p:
            return jsonify({"error": pass_err}), 400
        target_user.set_password(new_pass)

    db.session.commit()

    return jsonify({
        "message": "Dados do usuário atualizados com sucesso.",
        "user": target_user.to_dict()
    }), 200

# ==========================================
# ENDPOINTS DE EXCLUSÃO DE CONTA
# ==========================================

@auth_bp.route("/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    """
    Rota para exclusão de conta de usuário.
    Realiza soft delete (is_active = False) por padrão, ou hard delete se ?hard=true for passado.
    Valida token de autenticação caso o header Authorization seja fornecido.
    Protege contra a exclusão do último administrador ativo.
    """
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        payload = TokenService.decode_token(token)
        if not payload or payload.get("type") != "access":
            return jsonify({"error": "Token de autenticação inválido ou expirado."}), 401

        token_user_id = payload.get("sub")
        role = payload.get("role")
        if token_user_id != user_id and role != "admin":
            return jsonify({"error": "Acesso não autorizado para excluir este usuário."}), 403

    user = db.session.get(User, user_id) if hasattr(db.session, "get") else User.query.get(user_id)
    if not user:
        return jsonify({"error": "Usuário não encontrado."}), 404

    # Proteção: Impede a exclusão do único administrador ativo
    if user.role == "admin" and user.is_active:
        active_admins = User.query.filter(User.role == "admin", User.is_active.is_(True)).count()
        if active_admins <= 1:
            return jsonify({"error": "Não é possível excluir o único administrador ativo do sistema."}), 400

    data = request.get_json(silent=True) or {}
    hard_delete = request.args.get("hard", "false").lower() in ("true", "1") or data.get("hard_delete", False)

    if hard_delete:
        db.session.delete(user)
    else:
        user.deactivate()

    db.session.commit()

    return jsonify({
        "message": "Conta de usuário excluída com sucesso!",
        "user_id": user_id,
        "is_active": False if not hard_delete else None
    }), 200

@auth_bp.route("/account", methods=["DELETE"])
def delete_account():
    """
    Rota para o usuário logado excluir a própria conta via Bearer token ou identificação no payload.
    """
    auth_header = request.headers.get("Authorization")
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        payload = TokenService.decode_token(token)
        if not payload or payload.get("type") != "access":
            return jsonify({"error": "Token de autenticação inválido ou expirado."}), 401
        user_id = payload.get("sub")

    if not user_id:
        return jsonify({"error": "Identificação do usuário é obrigatória."}), 400

    return delete_user(user_id)
