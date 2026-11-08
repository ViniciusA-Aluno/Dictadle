import pytest
from app.extensions import db
from app.models.user import User
from app.services.token_service import TokenService

def test_delete_user_unauthorized_anonymous_blocked_scrum_152(client, sample_user):
    """
    Critério de Correção SCRUM-152 (BDD / Gherkin):
    Dado que um cliente anônimo dispara uma requisição DELETE para "/api/users/<id>" sem cabeçalho Authorization
    Quando o servidor processa a requisição
    Então deve retornar o código HTTP 401 Unauthorized
    E o usuário deve permanecer ativo na base de dados
    """
    user_id = sample_user.id

    res = client.delete(f"/api/users/{user_id}")
    assert res.status_code == 401
    data = res.get_json()
    assert "Token de autenticação não fornecido." in data["error"]

    # Confirmação no banco: usuário NÃO pode ter sido desativado nem excluído
    user_in_db = db.session.get(User, user_id)
    assert user_in_db is not None
    assert user_in_db.is_active is True

def test_delete_user_unauthorized_invalid_token_scrum_152(client, sample_user):
    """Bloqueio de exclusão quando o token for inválido, malformado ou expirado."""
    user_id = sample_user.id

    res = client.delete(
        f"/api/users/{user_id}",
        headers={"Authorization": "Bearer token_falso_ou_expirado"}
    )
    assert res.status_code == 401
    assert "Token de autenticação inválido ou expirado." in res.get_json()["error"]

    user_in_db = db.session.get(User, user_id)
    assert user_in_db is not None
    assert user_in_db.is_active is True

def test_delete_account_unauthorized_anonymous_blocked_scrum_152(client):
    """Requisição anônima para /api/auth/account deve ser recusada com 401."""
    res = client.delete("/api/auth/account")
    assert res.status_code == 401
    assert "Token de autenticação não fornecido." in res.get_json()["error"]

def test_delete_user_success_soft_delete(client, sample_user):
    """Verifica exclusão lógica padrão: usuário autenticado exclui sua própria conta."""
    user_id = sample_user.id
    token = TokenService.generate_access_token(user_id, sample_user.role)

    res = client.delete(
        f"/api/users/{user_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.get_json()
    assert "excluída com sucesso" in data["message"]
    assert data["is_active"] is False

    # Confirmação no banco
    user_in_db = db.session.get(User, user_id)
    assert user_in_db is not None
    assert user_in_db.is_active is False

    # Tentativa de login após exclusão lógica deve falhar com 403
    login_res = client.post("/api/auth/login", json={
        "email": sample_user.email,
        "password": "SenhaSegura123"
    })
    assert login_res.status_code == 403
    assert "desativada ou excluída" in login_res.get_json()["error"]

def test_delete_user_auth_prefix_endpoint(client, sample_user):
    """Verifica que o endpoint sob /api/auth/users/<id> também responde corretamente para usuário autenticado."""
    token = TokenService.generate_access_token(sample_user.id, sample_user.role)

    res = client.delete(
        f"/api/auth/users/{sample_user.id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    assert "excluída com sucesso" in res.get_json()["message"]

def test_delete_user_hard_delete(client, app):
    """Verifica que parâmetro hard=true remove o registro definitivamente do banco de dados quando autenticado."""
    with app.app_context():
        user = User(username="temp_user", email="temp@example.com")
        user.set_password("Senha123")
        db.session.add(user)
        db.session.commit()
        user_id = user.id

    token = TokenService.generate_access_token(user_id, "student")

    res = client.delete(
        f"/api/users/{user_id}?hard=true",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200

    # Confirma remoção física
    with app.app_context():
        assert db.session.get(User, user_id) is None

def test_delete_user_not_found(client, app):
    """Verifica erro 404 quando o usuário solicitado não existe, com token de admin autenticado."""
    with app.app_context():
        admin = User(username="admin_not_found_test", email="admin_nf@example.com", role="admin")
        admin.set_password("Admin123")
        db.session.add(admin)
        db.session.commit()
        admin_id = admin.id

    admin_token = TokenService.generate_access_token(admin_id, "admin")

    res = client.delete(
        "/api/users/999999",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 404
    assert "não encontrado" in res.get_json()["error"]

def test_delete_user_with_token_authorization(client, sample_user):
    """Usuário autenticado consegue excluir a própria conta usando Bearer token."""
    token = TokenService.generate_access_token(sample_user.id, sample_user.role)

    res = client.delete(
        f"/api/users/{sample_user.id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    assert "excluída com sucesso" in res.get_json()["message"]

def test_delete_user_forbidden_for_other_user(client, app, sample_user):
    """Usuário comum não pode excluir a conta de outro usuário."""
    with app.app_context():
        other_user = User(username="other", email="other@example.com", role="student")
        other_user.set_password("Senha123")
        db.session.add(other_user)
        db.session.commit()
        other_user_id = other_user.id

    token_sample_user = TokenService.generate_access_token(sample_user.id, sample_user.role)

    # sample_user tentando deletar other_user
    res = client.delete(
        f"/api/users/{other_user_id}",
        headers={"Authorization": f"Bearer {token_sample_user}"}
    )
    assert res.status_code == 403
    assert "não autorizado" in res.get_json()["error"]

def test_delete_user_allowed_for_admin(client, app, sample_user):
    """Administrador pode excluir qualquer conta."""
    with app.app_context():
        admin = User(username="admin_user", email="admin@example.com", role="admin")
        admin.set_password("Admin123")
        db.session.add(admin)
        db.session.commit()
        admin_id = admin.id

    admin_token = TokenService.generate_access_token(admin_id, "admin")

    res = client.delete(
        f"/api/users/{sample_user.id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 200

def test_delete_account_me_endpoint(client, sample_user):
    """Endpoint /api/auth/account deduz o usuário pelo Bearer token e realiza a exclusão."""
    token = TokenService.generate_access_token(sample_user.id, sample_user.role)

    res = client.delete(
        "/api/auth/account",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    assert res.get_json()["user_id"] == sample_user.id
