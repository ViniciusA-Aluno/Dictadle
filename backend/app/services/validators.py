"""
Serviço de validações e regras de negócio de entrada para o Dictadle.
Centraliza as checagens de formato, complexidade de credenciais e sanitização
para permitir testes unitários isolados e reutilização em múltiplos controladores.
"""
import re
from typing import Tuple, Optional, Any

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def validate_email(email: Optional[str]) -> Tuple[bool, Optional[str]]:
    """
    Valida se o e-mail foi fornecido e segue um formato válido.
    Retorna (True, None) se válido ou (False, mensagem_de_erro) se inválido.
    """
    if email is None or not isinstance(email, str):
        return False, "Informe um e-mail válido."
    
    clean_email = email.strip()
    if not clean_email:
        return False, "Informe um e-mail válido."
    
    if not EMAIL_REGEX.match(clean_email):
        return False, "Informe um e-mail válido."
        
    return True, None

def validate_password_complexity(password: Optional[str]) -> Tuple[bool, Optional[str]]:
    """
    Valida os requisitos mínimos de segurança de senha:
    - Mínimo de 8 caracteres
    - Pelo menos uma letra
    - Pelo menos um número
    """
    if password is None or not isinstance(password, str):
        return False, "A senha deve conter no mínimo 8 caracteres, incluindo pelo menos uma letra e um número."
        
    if len(password) < 8 or not re.search(r"[A-Za-z]", password) or not re.search(r"\d", password):
        return False, "A senha deve conter no mínimo 8 caracteres, incluindo pelo menos uma letra e um número."
        
    return True, None

def validate_username(username: Optional[str], min_length: int = 3) -> Tuple[bool, Optional[str]]:
    """
    Valida se o username foi fornecido e atende ao tamanho mínimo.
    """
    if username is None or not isinstance(username, str):
        return False, "Preencha o nome de usuário."
        
    clean_username = username.strip()
    if not clean_username:
        return False, "Preencha o nome de usuário."
        
    if len(clean_username) < min_length:
        return False, f"O nome de usuário deve conter no mínimo {min_length} caracteres."
        
    return True, None

def validate_password_change(
    current_password: Optional[str],
    new_password: Optional[str],
    is_current_password_valid: bool
) -> Tuple[bool, Optional[str]]:
    """
    Valida as regras de negócio para alteração de senha (US-04):
    1. Preenchimento obrigatório de senha atual e nova senha.
    2. Validação da senha atual informada.
    3. Nova senha não pode ser idêntica à senha atual.
    4. Nova senha deve atender aos critérios de complexidade.
    """
    if not current_password or not new_password:
        return False, "Informe a senha atual e a nova senha."
        
    if not is_current_password_valid:
        return False, "A senha atual está incorreta"
        
    if current_password == new_password:
        return False, "A nova senha deve ser diferente da senha atual"
        
    is_complex, err = validate_password_complexity(new_password)
    if not is_complex:
        return False, err
        
    return True, None

def sanitize_pagination_params(
    page: Any,
    per_page: Any,
    default_per_page: int = 10,
    max_per_page: int = 100
) -> Tuple[int, int]:
    """
    Higieniza e normaliza parâmetros de paginação (US-05).
    Garante que valores nulos, strings inválidas ou inteiros negativos retornem valores seguros.
    """
    # Trata página
    try:
        clean_page = int(page)
        if clean_page < 1:
            clean_page = 1
    except (ValueError, TypeError):
        clean_page = 1

    # Trata registros por página
    try:
        clean_per_page = int(per_page)
        if clean_per_page < 1:
            clean_per_page = default_per_page
        elif clean_per_page > max_per_page:
            clean_per_page = max_per_page
    except (ValueError, TypeError):
        clean_per_page = default_per_page

    return clean_page, clean_per_page
