from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.user import User
from app.services.two_factor_service import TwoFactorService
from app.services.token_service import TokenService

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/register", methods=["POST"])
def register():
    """Rota para cadastro de novos usuários."""
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    role = data.get("role", "student")

    if not username or not email or not password:
        return jsonify({"error": "Preencha username, email e senha."}), 400

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({"error": "Nome de usuário ou e-mail já cadastrado."}), 409

    user = User(username=username, email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "Usuário registrado com sucesso!",
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

    user = User.query.get(payload.get("sub"))
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

    user = User.query.get(user_id)
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

    user = User.query.get(user_id)
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
