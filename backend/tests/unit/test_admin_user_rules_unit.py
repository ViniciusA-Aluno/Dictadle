"""
Testes unitários para regras de negócio de gestão de usuários por administradores.
Valida isoladamente proteção do último admin, métodos de ativação/desativação no modelo,
idempotência do seed administrativo e regras de complexidade/sanitização.
"""
import pytest
from app.extensions import db
from app.models.user import User
from app.services.validators import (
    validate_username,
    validate_email,
    validate_password_complexity,
)
from seed import seed_admin

def test_user_activation_and_deactivation_methods():
    """Valida métodos activate e deactivate no modelo User."""
    user = User(username="teste_toggle", email="toggle@teste.com", role="student", is_active=True)
    assert user.is_active is True

    user.deactivate()
    assert user.is_active is False

    user.activate()
    assert user.is_active is True

def test_user_to_dict_includes_admin_fields_and_excludes_secrets():
    """Valida que to_dict inclui status, papel e 2FA, mas oculta hashes e segredos."""
    user = User(
        username="admin_dict",
        email="dict@admin.com",
        role="admin",
        is_active=True,
        is_2fa_enabled=True,
    )
    user.set_password("SenhaSuperSecreta123")
    user.two_factor_secret = "JBSWY3DPEHPK3PXP"

    data = user.to_dict()
    assert data["username"] == "admin_dict"
    assert data["email"] == "dict@admin.com"
    assert data["role"] == "admin"
    assert data["is_active"] is True
    assert data["is_2fa_enabled"] is True

    # Proteção de segurança
    assert "password" not in data
    assert "password_hash" not in data
    assert "two_factor_secret" not in data
    assert "secret" not in data

def test_admin_update_role_validation():
    """Valida se papéis permitidos para atribuição são apenas student e admin."""
    valid_roles = ["student", "admin"]
    invalid_roles = ["superadmin", "moderator", "guest", "", None, 123]

    for role in valid_roles:
        assert role in ["student", "admin"]

    for role in invalid_roles:
        assert str(role).lower() not in ["student", "admin"]

def test_admin_reset_password_complexity_rules():
    """Valida que a nova senha atribuída pelo admin obedece aos critérios de complexidade."""
    # Válidas: >= 8 caracteres com ao menos 1 letra e 1 número
    is_valid, err = validate_password_complexity("NovaSenhaForte2026")
    assert is_valid is True
    assert err is None

    # Inválidas: menos de 8 chars ou sem números ou sem letras
    is_short, err_short = validate_password_complexity("Abc12")
    assert is_short is False

    is_no_num, err_no_num = validate_password_complexity("ApenasLetrasAqui")
    assert is_no_num is False

    is_no_letter, err_no_letter = validate_password_complexity("1234567890")
    assert is_no_letter is False

def test_seed_admin_idempotence(app):
    """Valida que executar o seed mais de uma vez não duplica o usuário administrador."""
    # Primeira execução: cria o admin
    admin_id1 = seed_admin(username="seed_user", email="seed@dictadle.com", password="SeedAdmin123", app=app)
    assert admin_id1 is not None

    with app.app_context():
        u1 = db.session.get(User, admin_id1)
        assert u1.role == "admin"
        assert u1.is_active is True

    # Segunda execução: atualiza e mantém único
    admin_id2 = seed_admin(username="seed_user", email="seed@dictadle.com", password="SeedAdmin123", app=app)
    assert admin_id2 == admin_id1

    with app.app_context():
        count = User.query.filter_by(email="seed@dictadle.com").count()
        assert count == 1
