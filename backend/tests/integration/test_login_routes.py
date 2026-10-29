import pytest
from app.extensions import db
from app.models.user import User
from app.services.two_factor_service import TwoFactorService

def test_login_success_without_2fa(client, sample_user):
    res = client.post("/api/auth/login", json={
        "email": "joao@example.com",
        "password": "SenhaSegura123"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["requires_2fa"] is False
    assert "access_token" in data
    assert data["user"]["email"] == "joao@example.com"

def test_login_invalid_password(client, sample_user):
    res = client.post("/api/auth/login", json={
        "email": "joao@example.com",
        "password": "SenhaIncorreta"
    })
    assert res.status_code == 401
    data = res.get_json()
    assert "error" in data

def test_login_inactive_user(client, app):
    with app.app_context():
        inactive_user = User(username="inativo", email="inativo@teste.com", is_active=False)
        inactive_user.set_password("Senha123")
        db.session.add(inactive_user)
        db.session.commit()

    res = client.post("/api/auth/login", json={
        "email": "inativo@teste.com",
        "password": "Senha123"
    })
    assert res.status_code == 403
    assert "desativada" in res.get_json()["error"]

def test_login_with_2fa_flow_success(client, app):
    secret = TwoFactorService.generate_secret()
    
    with app.app_context():
        user_2fa = User(username="mariasilva", email="maria@example.com")
        user_2fa.set_password("SenhaMaria123")
        user_2fa.enable_2fa(secret)
        db.session.add(user_2fa)
        db.session.commit()

    # 1. Primeira etapa: login deve solicitar 2FA e retornar temp_token
    res_step1 = client.post("/api/auth/login", json={
        "email": "maria@example.com",
        "password": "SenhaMaria123"
    })
    assert res_step1.status_code == 200
    data_step1 = res_step1.get_json()
    assert data_step1["requires_2fa"] is True
    assert "temp_token" in data_step1

    temp_token = data_step1["temp_token"]

    # 2. Segunda etapa com código errado: deve ser rejeitado
    res_wrong_code = client.post("/api/auth/login/2fa", json={
        "temp_token": temp_token,
        "code": "000000"
    })
    assert res_wrong_code.status_code == 401

    # 3. Segunda etapa com código válido: emite o access_token final
    valid_code = TwoFactorService.generate_current_token(secret)
    res_step2 = client.post("/api/auth/login/2fa", json={
        "temp_token": temp_token,
        "code": valid_code
    })
    assert res_step2.status_code == 200
    data_step2 = res_step2.get_json()
    assert data_step2["requires_2fa"] is False
    assert "access_token" in data_step2
    assert data_step2["user"]["username"] == "mariasilva"
