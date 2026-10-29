"""
Testes unitários isolados para regras de negócio e validações da US-04 (Configurações do Usuário).
Valida troca segura de senha, atualização de credenciais cadastrais e regras de integridade.
"""
import pytest
from app.services.validators import (
    validate_password_change,
    validate_email,
    validate_username
)
from app.models.user import User

# ==============================================================================
# 1. TESTES UNITÁRIOS DE ALTERAÇÃO DE SENHA (US-04 / Cenários 7, 8, 10 e 11)
# ==============================================================================

def test_validate_password_change_success():
    """Cenário 7: Troca de senha válida com senha atual correta e nova senha complexa."""
    is_valid, error = validate_password_change(
        current_password="SenhaAtual123",
        new_password="NovaSenhaSegura456",
        is_current_password_valid=True
    )
    assert is_valid is True
    assert error is None

def test_validate_password_change_incorrect_current_password():
    """Cenário 8: Rejeição quando a senha atual informada está incorreta."""
    is_valid, error = validate_password_change(
        current_password="SenhaErrada123",
        new_password="NovaSenhaSegura456",
        is_current_password_valid=False
    )
    assert is_valid is False
    assert error == "A senha atual está incorreta"

def test_validate_password_change_same_as_current():
    """Cenário 11: Rejeição quando a nova senha é idêntica à senha atual."""
    is_valid, error = validate_password_change(
        current_password="SenhaRepetida123",
        new_password="SenhaRepetida123",
        is_current_password_valid=True
    )
    assert is_valid is False
    assert error == "A nova senha deve ser diferente da senha atual"

@pytest.mark.parametrize("invalid_new_password", [
    "abc12",          # Menor que 8 caracteres
    "senhasemnumero", # Apenas letras
    "1234567890",     # Apenas números
    "",               # Vazia
])
def test_validate_password_change_weak_new_password(invalid_new_password):
    """Cenário 10: Rejeição quando a nova senha não atende aos requisitos mínimos de complexidade."""
    is_valid, error = validate_password_change(
        current_password="SenhaAtual123",
        new_password=invalid_new_password,
        is_current_password_valid=True
    )
    assert is_valid is False
    assert error is not None

@pytest.mark.parametrize("empty_field,current_pass,new_pass", [
    ("current_empty", "", "NovaSenha123"),
    ("new_empty", "SenhaAtual123", ""),
    ("both_empty", "", ""),
    ("current_none", None, "NovaSenha123"),
    ("new_none", "SenhaAtual123", None),
])
def test_validate_password_change_missing_fields(empty_field, current_pass, new_pass):
    """Valida rejeição quando qualquer um dos campos obrigatórios de senha não é fornecido."""
    is_valid, error = validate_password_change(
        current_password=current_pass,
        new_password=new_pass,
        is_current_password_valid=True
    )
    assert is_valid is False
    assert error == "Informe a senha atual e a nova senha."

# ==============================================================================
# 2. TESTES UNITÁRIOS DE ATUALIZAÇÃO CADASTRAL (US-04 / Cenários 2, 3 e 6)
# ==============================================================================

def test_validate_profile_valid_inputs():
    """Cenários 2 e 3: Validação de novos username e e-mail válidos para o perfil."""
    is_valid_email, err_email = validate_email("novo.email@dictadle.com")
    assert is_valid_email is True
    assert err_email is None

    is_valid_user, err_user = validate_username("novo_username_123")
    assert is_valid_user is True
    assert err_user is None

def test_validate_profile_invalid_email_format():
    """Cenário 6: Rejeição de e-mail com formato inválido durante atualização de perfil."""
    is_valid, error = validate_email("email_sem_formato_correto")
    assert is_valid is False
    assert "e-mail válido" in error.lower()

def test_user_password_update_and_verification_unit():
    """Garante que a alteração de senha no modelo substitui efetivamente o hash anterior."""
    user = User(username="aluno_alteracao", email="aluno@teste.com")
    user.set_password("SenhaAntiga123")
    assert user.check_password("SenhaAntiga123") is True

    # Aplica nova senha
    user.set_password("NovaSenhaSuper456")
    assert user.check_password("NovaSenhaSuper456") is True
    assert user.check_password("SenhaAntiga123") is False
