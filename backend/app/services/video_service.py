"""
Serviço utilitário para validação, extração de identificadores e geração de URLs de incorporação
do YouTube para a plataforma Dictadle (SCRUM-144 / US-91).
Em conformidade com a política de Zero Hosting (não armazena nem baixa arquivos de mídia).
"""
import re
from typing import Optional, Tuple
from urllib.parse import urlparse, parse_qs

# Expressão regular para validar o ID padrão de exatamente 11 caracteres do YouTube
YOUTUBE_ID_REGEX = re.compile(r"^[a-zA-Z0-9_-]{11}$")

# Padrões conhecidos de URLs do YouTube garantindo que o ID termine na barra, interrogação, hash ou fim da string
YOUTUBE_URL_PATTERNS = [
    # youtu.be/<id>
    re.compile(r"(?:https?://)?(?:www\.)?youtu\.be/([a-zA-Z0-9_-]{11})(?:[?&#/]|$)"),
    # youtube.com/watch?.*v=<id>
    re.compile(r"(?:https?://)?(?:www\.)?youtube\.com/watch\?(?:[^&]*&)*v=([a-zA-Z0-9_-]{11})(?:[&#]|$)"),
    # youtube.com/embed/<id>
    re.compile(r"(?:https?://)?(?:www\.)?youtube\.com/embed/([a-zA-Z0-9_-]{11})(?:[?&#/]|$)"),
    # youtube.com/shorts/<id>
    re.compile(r"(?:https?://)?(?:www\.)?youtube\.com/shorts/([a-zA-Z0-9_-]{11})(?:[?&#/]|$)"),
    # youtube.com/v/<id>
    re.compile(r"(?:https?://)?(?:www\.)?youtube\.com/v/([a-zA-Z0-9_-]{11})(?:[?&#/]|$)"),
]

class VideoService:
    @staticmethod
    def extract_youtube_video_id(url_or_id: Optional[str]) -> Optional[str]:
        """
        Extrai e valida o ID de 11 caracteres do YouTube a partir de uma URL ou string de ID.
        Suporta links padrão (watch?v=), encurtados (youtu.be), embed, shorts e parâmetros extras.
        Retorna o ID sanitizado ou None caso a entrada seja inválida.
        """
        if not url_or_id or not isinstance(url_or_id, str):
            return None

        clean_input = url_or_id.strip()
        if not clean_input:
            return None

        # Se já for um ID direto de exatamente 11 caracteres
        if YOUTUBE_ID_REGEX.match(clean_input):
            return clean_input

        # Tentativa via Regex dos padrões conhecidos com limites seguros
        for pattern in YOUTUBE_URL_PATTERNS:
            match = pattern.search(clean_input)
            if match:
                candidate_id = match.group(1)
                if YOUTUBE_ID_REGEX.match(candidate_id):
                    return candidate_id

        # Fallback utilizando urllib.parse para análise estruturada de hostname/query
        try:
            parsed = urlparse(clean_input)
            hostname = (parsed.hostname or "").lower()
            if "youtube.com" in hostname or "youtu.be" in hostname:
                query_params = parse_qs(parsed.query)
                if "v" in query_params:
                    candidate_id = query_params["v"][0]
                    if YOUTUBE_ID_REGEX.match(candidate_id):
                        return candidate_id

                path_parts = [p for p in parsed.path.split("/") if p]
                if path_parts:
                    candidate_id = path_parts[-1]
                    if YOUTUBE_ID_REGEX.match(candidate_id):
                        return candidate_id
        except Exception:
            return None

        return None

    @staticmethod
    def validate_video_url(url_or_id: Optional[str]) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Valida se a entrada representa uma referência válida do YouTube.
        Retorna (is_valid, video_id, error_message).
        """
        video_id = VideoService.extract_youtube_video_id(url_or_id)
        if not video_id:
            return False, None, "URL do YouTube inválida ou ID do vídeo não encontrado."
        return True, video_id, None

    @staticmethod
    def build_embed_url(
        video_id: str,
        start_time_seconds: int,
        end_time_seconds: int,
        controls: int = 0,
        rel: int = 0
    ) -> str:
        """
        Gera a URL de incorporação (embed) compatível com a API de IFrame do YouTube,
        delimitando estritamente os segundos inicial e final do clipe.
        """
        start = max(0, int(start_time_seconds))
        end = max(start, int(end_time_seconds))
        return f"https://www.youtube.com/embed/{video_id}?start={start}&end={end}&rel={rel}&controls={controls}"
