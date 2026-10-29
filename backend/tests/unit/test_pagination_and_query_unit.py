"""
Testes unitários para regras de paginação e normalização de consultas da US-05 (Listagem de Usuários).
Valida isoladamente o serviço de sanitização contra entradas inválidas, tipos incorretos e overflow.
"""
import pytest
from app.services.validators import sanitize_pagination_params

# ==============================================================================
# TESTES UNITÁRIOS DE SANITIZAÇÃO DE PAGINAÇÃO (US-05 / Cenário 2)
# ==============================================================================

def test_sanitize_pagination_defaults():
    """Valida valores padrão da paginação (página 1, 10 registros)."""
    page, per_page = sanitize_pagination_params(page=1, per_page=10)
    assert page == 1
    assert per_page == 10

def test_sanitize_pagination_custom_valid_values():
    """Valida valores válidos customizados informados pelo cliente."""
    page, per_page = sanitize_pagination_params(page=3, per_page=25)
    assert page == 3
    assert per_page == 25

@pytest.mark.parametrize("invalid_page", [
    0,
    -1,
    -99,
    "0",
    "-5",
    "pagina_invalida",
    "",
    None,
    [],
    {},
])
def test_sanitize_pagination_invalid_page_fallback(invalid_page):
    """Garante que qualquer página zero, negativa ou não numérica faça fallback seguro para 1."""
    page, per_page = sanitize_pagination_params(page=invalid_page, per_page=10)
    assert page == 1
    assert per_page == 10

@pytest.mark.parametrize("invalid_per_page", [
    0,
    -1,
    -10,
    "0",
    "-20",
    "tamanho_invalido",
    "",
    None,
])
def test_sanitize_pagination_invalid_per_page_fallback(invalid_per_page):
    """Garante que tamanhos por página nulos ou negativos façam fallback para o padrão (10)."""
    page, per_page = sanitize_pagination_params(page=1, per_page=invalid_per_page, default_per_page=10)
    assert page == 1
    assert per_page == 10

def test_sanitize_pagination_max_limit_clamping():
    """Garante proteção contra sobrecarga de memória limitando ao teto máximo (100)."""
    page, per_page = sanitize_pagination_params(page=1, per_page=1000, max_per_page=100)
    assert page == 1
    assert per_page == 100

def test_sanitize_pagination_string_numeric_conversion():
    """Garante que strings numéricas vindas de query params HTTP sejam convertidas corretamente."""
    page, per_page = sanitize_pagination_params(page="4", per_page="15")
    assert page == 4
    assert per_page == 15
    assert isinstance(page, int)
    assert isinstance(per_page, int)
