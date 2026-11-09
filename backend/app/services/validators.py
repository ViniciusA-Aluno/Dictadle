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

def validate_challenge_payload(data: Any) -> Tuple[bool, Optional[str], Optional[dict]]:
    """
    Valida as regras de negócio para cadastro de Desafio de Transcrição (SCRUM-129 / US-87):
    - Título obrigatório (máx 150 caracteres).
    - URL do vídeo obrigatória e formato válido do YouTube.
    - Intervalo de tempo: start_time >= 0, end_time > start_time e duração entre 5s e 30s.
    - Nível de dificuldade: 'easy', 'medium' ou 'hard'.
    - Transcrição oficial (gabarito) obrigatória.
    """
    from app.services.video_service import VideoService

    if not isinstance(data, dict):
        return False, "Corpo da requisição deve ser um objeto JSON.", None

    title = data.get("title")
    if not title or not isinstance(title, str) or not title.strip():
        return False, "O título do desafio é obrigatório.", None
    clean_title = title.strip()
    if len(clean_title) > 150:
        return False, "O título deve ter no máximo 150 caracteres.", None

    video_url = data.get("video_url")
    if not video_url or not isinstance(video_url, str) or not video_url.strip():
        return False, "A URL do vídeo é obrigatória.", None
    clean_video_url = video_url.strip()

    is_valid_url, video_id, url_err = VideoService.validate_video_url(clean_video_url)
    if not is_valid_url:
        return False, url_err or "URL do YouTube inválida ou ID do vídeo não encontrado.", None

    # Suporta start_time_seconds ou start_time
    raw_start = data.get("start_time_seconds", data.get("start_time"))
    raw_end = data.get("end_time_seconds", data.get("end_time"))

    if raw_start is None:
        return False, "O segundo de início do trecho (start_time) é obrigatório.", None
    if raw_end is None:
        return False, "O segundo de fim do trecho (end_time) é obrigatório.", None

    try:
        start_time = int(raw_start)
        end_time = int(raw_end)
    except (ValueError, TypeError):
        return False, "Os tempos de início e fim devem ser números inteiros em segundos.", None

    if start_time < 0:
        return False, "O tempo inicial não pode ser negativo.", None

    if end_time <= start_time:
        return False, "O tempo final deve ser maior que o tempo inicial.", None

    duration = end_time - start_time
    if duration < 5:
        return False, "O trecho do desafio deve ter no mínimo 5 segundos.", None
    if duration > 30:
        return False, "O trecho do desafio deve ter no máximo 30 segundos (clipes curtos recomendados de 10 a 15 segundos).", None

    difficulty = (data.get("difficulty") or "medium").strip().lower()
    if difficulty not in ("easy", "medium", "hard"):
        return False, "Nível de dificuldade inválido. Escolha entre: easy, medium ou hard.", None

    accent = (data.get("accent") or "American").strip()
    if len(accent) > 50:
        return False, "O sotaque deve ter no máximo 50 caracteres.", None

    # Suporta transcript_official ou transcript
    transcript = data.get("transcript_official", data.get("transcript"))
    if not transcript or not isinstance(transcript, str) or not transcript.strip():
        return False, "A transcrição oficial (gabarito) é obrigatória.", None
    clean_transcript = transcript.strip()

    return True, None, {
        "title": clean_title,
        "video_url": clean_video_url,
        "youtube_video_id": video_id,
        "start_time_seconds": start_time,
        "end_time_seconds": end_time,
        "difficulty": difficulty,
        "accent": accent,
        "transcript_official": clean_transcript
    }
