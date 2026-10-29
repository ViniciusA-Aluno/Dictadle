"""
Testes unitários isolados para regras de negócio e validações da US-01 (Cadastro de Usuários).
Testa puramente funções de validação sem necessidade de servidor Flask ou banco de dados.
"""
import pytest
from app.services.validators import (
    validate_email,
    validate_password_complexity,
    validate_username
)
from app.models.user import User

# ==============================================================================
# 1. TESTES UNITÁRIOS DE VALIDAÇÃO DE FORMATO DE E-MAIL (US-01 / Cenário 3)
# ==============================================================================

@pytest.mark.parametrize("valid_email", [
    "estudante@dictadle.com",
    "usuario.novo@gmail.com",
    "dev+filter@dominio.org",
    "aluno_123@escola.edu.br",
    "primeiro.ultimo-sobrenome@sub.empresa.co",
])
def test_validate_email_valid_formats(valid_email):
    """Valida formatos válidos aceitos pelo sistema."""
    is_valid, error = validate_email(valid_email)
    assert is_valid is True
    assert error is None

@pytest.mark.parametrize("invalid_email", [
    "",
    "   ",
    None,
    12345,
    "email_sem_arroba.com",
    "@semusuario.com",
    "usuario@",
    "usuario@dominio",
    "usuario @dominio.com",
    "usuario@ dominio.com",
    "usuario@dominio .com",
])
def test_validate_email_invalid_formats(invalid_email):
    """Valida que formatos inválidos ou corrompidos são rejeitados com mensagem amigável."""
    is_valid, error = validate_email(invalid_email)
    assert is_valid is False
    assert error == "Informe um e-mail válido."

# ==============================================================================
# 2. TESTES UNITÁRIOS DE COMPLEXIDADE DE SENHA (US-01 / Cenário 4)
# ==============================================================================

@pytest.mark.parametrize("valid_password", [
    "Senha123",            # Exatamente 8 caracteres com letras e números
    "minhaSenh4Forte",     # Letras maiúsculas, minúsculas e números
    "dictadle2026!",       # Letras, números e caracteres especiais
    "12345678aA",          # Inicia com dígitos e termina com letras
])
def test_validate_password_complexity_success(valid_password):
    """Valida senhas que atendem a todos os requisitos mínimos de complexidade."""
    is_valid, error = validate_password_complexity(valid_password)
    assert is_valid is True
    assert error is None

@pytest.mark.parametrize("short_password", [
    "Abc1",
    "1234567",
    "a1b2c3",
    "Pass1",
])
def test_validate_password_complexity_short(short_password):
    """Valida que senhas com menos de 8 caracteres são rejeitadas."""
    is_valid, error = validate_password_complexity(short_password)
    assert is_valid is False
    assert "no mínimo 8 caracteres" in error

def test_validate_password_complexity_only_letters():
    """Valida que senhas contendo apenas letras (sem números) são rejeitadas."""
    is_valid, error = validate_password_complexity("Senhasemnumero")
    assert is_valid is False
    assert "incluindo pelo menos uma letra e um número" in error

def test_validate_password_complexity_only_numbers():
    """Valida que senhas contendo apenas dígitos numéricos são rejeitadas."""
    is_valid, error = validate_password_complexity("1234567890")
    assert is_valid is False
    assert "incluindo pelo menos uma letra e um número" in error

@pytest.mark.parametrize("empty_or_none", [
    "",
    None,
    12345678,
])
def test_validate_password_complexity_empty_or_invalid_type(empty_or_none):
    """Valida tratamento seguro contra senhas vazias ou tipos incorretos."""
    is_valid, error = validate_password_complexity(empty_or_none)
    assert is_valid is False
    assert error is not None

# ==============================================================================
# 3. TESTES UNITÁRIOS DE NOME DE USUÁRIO (US-01 / Cenários 1 e 6)
# ==============================================================================

@pytest.mark.parametrize("valid_user", [
    "marcos",
    "aluno_01",
    "carlos.souza",
    "ana",
])
def test_validate_username_valid(valid_user):
    """Valida usernames corretos e formatados."""
    is_valid, error = validate_username(valid_user)
    assert is_valid is True
    assert error is None

@pytest.mark.parametrize("invalid_user", [
    "",
    "   ",
    None,
    "ab", # Menor que 3 caracteres
    "x",
])
def test_validate_username_invalid(invalid_user):
    """Valida que usernames vazios ou com menos de 3 caracteres são rejeitados."""
    is_valid, error = validate_username(invalid_user)
    assert is_valid is False
    assert error is not None

# ==============================================================================
# 4. TESTE UNITÁRIO DE SEGURANÇA DE PERFIL NO MODELO (US-01 / Cenário 7)
# ==============================================================================

def test_user_registration_default_role_is_student():
    """Garante que a entidade criada para cadastro receba por padrão 'student'."""
    user = User(username="alunoteste", email="aluno@teste.com")
    assert user.role == "student"
    assert user.is_active is True
