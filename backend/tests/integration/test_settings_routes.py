import pytest
from app.extensions import db
from app.models.user import User
from app.services.token_service import TokenService

@pytest.fixture
def auth_headers(sample_user):
    token = TokenService.generate_access_token(sample_user.id, sample_user.role)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def second_user(app):
    user = User(username="mariasilva", email="maria@example.com", role="student")
    user.set_password("SenhaMaria123")
    db.session.add(user)
    db.session.commit()
    return user

def test_get_profile_authenticated(client, sample_user, auth_headers):
    """Cenário 1: Acessar a rota com dados carregados."""
    res = client.get("/api/auth/me", headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()["user"]
    assert data["username"] == sample_user.username
    assert data["email"] == sample_user.email

def test_get_profile_unauthorized(client):
    """Cenário 12: Tentativa de acesso sem autenticação."""
    res = client.get("/api/auth/me")
    assert res.status_code == 401

def test_update_username_success(client, sample_user, auth_headers):
    """Cenário 2: Alteração de username com sucesso."""
    res = client.put("/api/auth/profile", headers=auth_headers, json={
        "username": "joao_novo",
        "email": sample_user.email
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["message"] == "Dados atualizados com sucesso"
    assert data["user"]["username"] == "joao_novo"

def test_update_email_success(client, sample_user, auth_headers):
    """Cenário 3: Alteração de e-mail com sucesso."""
    res = client.put("/api/auth/profile", headers=auth_headers, json={
        "username": sample_user.username,
        "email": "joao_novo_email@example.com"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["message"] == "Dados atualizados com sucesso"
    assert data["user"]["email"] == "joao_novo_email@example.com"

def test_update_username_conflict(client, sample_user, second_user, auth_headers):
    """Cenário 4: Tentativa de alteração para username já existente de outro usuário."""
    res = client.put("/api/auth/profile", headers=auth_headers, json={
        "username": second_user.username,
        "email": sample_user.email
    })
    assert res.status_code == 409
    assert "Este username já está em uso" in res.get_json()["error"]

def test_update_email_conflict(client, sample_user, second_user, auth_headers):
    """Cenário 5: Tentativa de alteração para e-mail já existente de outro usuário."""
    res = client.put("/api/auth/profile", headers=auth_headers, json={
        "username": sample_user.username,
        "email": second_user.email
    })
    assert res.status_code == 409
    assert "Este e-mail já está cadastrado" in res.get_json()["error"]

def test_update_email_invalid_format(client, sample_user, auth_headers):
    """Cenário 6: Validação de e-mail com formato inválido."""
    res = client.put("/api/auth/profile", headers=auth_headers, json={
        "username": sample_user.username,
        "email": "invalido_sem_arroba"
    })
    assert res.status_code == 400
    assert "Informe um e-mail válido" in res.get_json()["error"]

def test_change_password_success(client, sample_user, auth_headers):
    """Cenário 7: Alteração de senha com dados válidos."""
    res = client.put("/api/auth/change-password", headers=auth_headers, json={
        "current_password": "SenhaSegura123",
        "new_password": "NovaSenhaForte456"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["message"] == "Senha alterada com sucesso"
    assert "access_token" in data

    # Valida que o login funciona com a nova senha
    login_res = client.post("/api/auth/login", json={
        "email": sample_user.email,
        "password": "NovaSenhaForte456"
    })
    assert login_res.status_code == 200

def test_change_password_wrong_current(client, sample_user, auth_headers):
    """Cenário 8: Tentativa de alteração de senha com senha atual incorreta."""
    res = client.put("/api/auth/change-password", headers=auth_headers, json={
        "current_password": "SenhaErradaTotal",
        "new_password": "NovaSenhaForte456"
    })
    assert res.status_code == 400
    assert "A senha atual está incorreta" in res.get_json()["error"]

def test_change_password_weak_new_password(client, sample_user, auth_headers):
    """Cenário 10: Nova senha fora dos requisitos mínimos de segurança."""
    res = client.put("/api/auth/change-password", headers=auth_headers, json={
        "current_password": "SenhaSegura123",
        "new_password": "curta"
    })
    assert res.status_code == 400
    assert "mínimo 8 caracteres" in res.get_json()["error"]

def test_change_password_same_as_current(client, sample_user, auth_headers):
    """Cenário 11: Nova senha idêntica à senha atual."""
    res = client.put("/api/auth/change-password", headers=auth_headers, json={
        "current_password": "SenhaSegura123",
        "new_password": "SenhaSegura123"
    })
    assert res.status_code == 400
    assert "A nova senha deve ser diferente da senha atual" in res.get_json()["error"]
