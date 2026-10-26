import pytest
from app.models.user import User

def test_user_password_hashing():
    user = User(username="teste", email="teste@teste.com")
    user.set_password("Senha123")
    
    assert user.password_hash != "Senha123"
    assert user.check_password("Senha123") is True
    assert user.check_password("SenhaErrada") is False

def test_user_defaults_and_activation():
    user = User(username="teste2", email="teste2@teste.com")
    assert user.role == "student"
    assert user.is_active is True
    assert user.is_2fa_enabled is False
    assert user.two_factor_secret is None

def test_user_2fa_lifecycle():
    user = User(username="teste_2fa", email="2fa@teste.com")
    fake_secret = "JBSWY3DPEHPK3PXP"
    
    user.enable_2fa(fake_secret)
    assert user.is_2fa_enabled is True
    assert user.two_factor_secret == fake_secret

    user.disable_2fa()
    assert user.is_2fa_enabled is False
    assert user.two_factor_secret is None

def test_user_to_dict():
    user = User(username="carlos", email="carlos@teste.com", role="admin")
    data = user.to_dict()
    
    assert data["username"] == "carlos"
    assert data["email"] == "carlos@teste.com"
    assert data["role"] == "admin"
    assert "password_hash" not in data
    assert "two_factor_secret" not in data
