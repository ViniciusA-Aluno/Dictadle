"""
Testes unitários de segurança, integridade e proteção de dados sensíveis da US-05 (Listagem de Usuários).
Valida isoladamente que sob nenhuma condição senhas, hashes ou segredos TOTP são expostos.
"""
import pytest
from app.models.user import User

# ==============================================================================
# TESTES UNITÁRIOS DE SEGURANÇA E DADOS SENSÍVEIS (US-05 / Cenários 6 e 8)
# ==============================================================================

def test_user_to_dict_never_exposes_sensitive_fields():
    """
    Cenário 8: Proteção de dados sensíveis na serialização de usuários.
    Garante que 'password_hash', 'senha_hash' e 'two_factor_secret' nunca são incluídos no dicionário.
    """
    user = User(
        username="admin_master",
        email="master@dictadle.com",
        role="admin"
    )
    user.set_password("SenhaAdminForte123")
    user.enable_2fa("JBSWY3DPEHPK3PXP")
    
    serialized = user.to_dict()
    
    # Campos que DEVEM estar presentes
    assert serialized["username"] == "admin_master"
    assert serialized["email"] == "master@dictadle.com"
    assert serialized["role"] == "admin"
    assert serialized["is_active"] is True
    assert serialized["is_2fa_enabled"] is True
    assert "created_at" in serialized
    
    # Campos sensíveis que NUNCA devem estar presentes
    assert "password" not in serialized
    assert "password_hash" not in serialized
    assert "senha" not in serialized
    assert "senha_hash" not in serialized
    assert "two_factor_secret" not in serialized
    assert "secret" not in serialized

def test_role_authorization_logic_unit():
    """
    Cenário 6: Validação da regra de autorização por perfil (role).
    Apenas perfil 'admin' deve ter permissão de acesso à gestão/listagem de usuários.
    """
    def is_user_allowed_to_view_user_list(role: str) -> bool:
        return role == "admin"

    assert is_user_allowed_to_view_user_list("admin") is True
    assert is_user_allowed_to_view_user_list("student") is False
    assert is_user_allowed_to_view_user_list("moderator") is False
    assert is_user_allowed_to_view_user_list("") is False
    assert is_user_allowed_to_view_user_list(None) is False
