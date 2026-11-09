import pytest
from app.extensions import db
from app.models.user import User
from app.services.token_service import TokenService

def test_session_restore_success_active_user(client, sample_user):
    """
    Cenário 1 BDD (SCRUM-153):
    Dado que um usuário autenticado possui um token JWT válido
    Quando o frontend realiza GET /api/auth/me na inicialização
    Então o backend deve retornar status 200 OK
    E retornar os dados cadastrais completos do usuário para restauração de sessão
    """
    token = TokenService.generate_access_token(sample_user.id, sample_user.role)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200

    data = response.get_json()
    assert "user" in data
    user_data = data["user"]
    assert user_data["id"] == sample_user.id
    assert user_data["username"] == sample_user.username
    assert user_data["email"] == sample_user.email
    assert user_data["role"] == sample_user.role
    assert user_data["is_active"] is True
    # Assegura que senhas ou segredos não vazam na reidratação de sessão
    assert "password_hash" not in user_data
    assert "two_factor_secret" not in user_data

def test_session_restore_admin_success(client, app):
    """
    Cenário 2 BDD (SCRUM-153):
    Valida a restauração de sessão para um perfil de administrador.
    """
    with app.app_context():
        admin = User(username="admin_dictadle", email="admin@dictadle.com", role="admin")
        admin.set_password("AdminPass123")
        db.session.add(admin)
        db.session.commit()
        admin_id = admin.id

    token = TokenService.generate_access_token(admin_id, "admin")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.get_json()
    assert data["user"]["role"] == "admin"
    assert data["user"]["username"] == "admin_dictadle"

def test_session_restore_missing_token_401(client):
    """
    Cenário 4 BDD (SCRUM-153):
    Tentativa de validar sessão sem token salvo no localStorage / sem cabeçalho Authorization.
    """
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    data = response.get_json()
    assert "error" in data
    assert "Token de autenticação não fornecido." in data["error"]

def test_session_restore_invalid_token_401(client):
    """
    Cenário 3 BDD (SCRUM-153):
    Token corrompido ou com assinatura adulterada deve retornar 401 e instruir limpeza da sessão.
    """
    headers = {"Authorization": "Bearer token.completamente.falso"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 401
    data = response.get_json()
    assert "Token de autenticação inválido ou expirado." in data["error"]

def test_session_restore_expired_token_401(client, sample_user):
    """
    Cenário 3 BDD (SCRUM-153):
    Token que já passou do tempo de expiração deve ser rejeitado com 401.
    """
    # Gera um token já expirado (expirou há 10 minutos)
    expired_token = TokenService.generate_access_token(sample_user.id, sample_user.role, expires_in_minutes=-10)
    headers = {"Authorization": f"Bearer {expired_token}"}

    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 401
    data = response.get_json()
    assert "Token de autenticação inválido ou expirado." in data["error"]

def test_session_restore_temp_2fa_token_rejected_401(client, sample_user):
    """
    Token temporário gerado para desafio 2FA (tipo '2fa_temp') não pode restaurar sessão de perfil.
    """
    temp_token = TokenService.generate_2fa_temp_token(sample_user.id)
    headers = {"Authorization": f"Bearer {temp_token}"}

    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 401
    data = response.get_json()
    assert "Token de autenticação inválido ou expirado." in data["error"]

def test_session_restore_deactivated_user_rejected_401(client, sample_user):
    """
    Usuário com conta inativa / desativada não deve ter sua sessão restaurada, mesmo com token válido.
    """
    sample_user.deactivate()
    db.session.commit()

    token = TokenService.generate_access_token(sample_user.id, sample_user.role)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 401
    data = response.get_json()
    assert "Usuário não encontrado ou conta inativa." in data["error"]

def test_session_restore_nonexistent_user_rejected_401(client):
    """
    Token contendo ID de usuário inexistente no banco.
    """
    token = TokenService.generate_access_token(999999, "student")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 401
    data = response.get_json()
    assert "Usuário não encontrado ou conta inativa." in data["error"]
