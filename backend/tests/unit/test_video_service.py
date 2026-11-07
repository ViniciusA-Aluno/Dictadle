import pytest
from app.services.video_service import VideoService

class TestVideoService:
    """Suíte de testes unitários para o VideoService (SCRUM-144 / US-91)."""

    def test_extract_from_short_url_scenario_2(self):
        """Cenário 2: Normalização correta de link encurtado youtu.be."""
        url = "https://youtu.be/dQw4w9WgXcQ"
        video_id = VideoService.extract_youtube_video_id(url)
        assert video_id == "dQw4w9WgXcQ"

        embed_url = VideoService.build_embed_url(video_id, 45, 57)
        assert embed_url == "https://www.youtube.com/embed/dQw4w9WgXcQ?start=45&end=57&rel=0&controls=0"

    def test_extract_from_standard_watch_url(self):
        """Extração a partir de URL padrão youtube.com/watch?v=..."""
        url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        assert VideoService.extract_youtube_video_id(url) == "dQw4w9WgXcQ"

    def test_extract_from_watch_url_with_additional_params(self):
        """Extração com query params extras como timestamp e feature."""
        url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=45s&feature=shared"
        assert VideoService.extract_youtube_video_id(url) == "dQw4w9WgXcQ"

    def test_extract_from_embed_url(self):
        """Extração a partir de URL de embed já existente."""
        url = "https://www.youtube.com/embed/dQw4w9WgXcQ?start=10&end=25"
        assert VideoService.extract_youtube_video_id(url) == "dQw4w9WgXcQ"

    def test_extract_from_shorts_url(self):
        """Extração a partir de URL do YouTube Shorts."""
        url = "https://www.youtube.com/shorts/dQw4w9WgXcQ"
        assert VideoService.extract_youtube_video_id(url) == "dQw4w9WgXcQ"

    def test_extract_from_raw_valid_video_id(self):
        """Extração quando fornecido diretamente o ID válido de 11 caracteres."""
        raw_id = "dQw4w9WgXcQ"
        assert VideoService.extract_youtube_video_id(raw_id) == "dQw4w9WgXcQ"

    def test_extract_with_whitespace(self):
        """Sanitização de espaços em branco antes e depois da URL."""
        url = "   https://youtu.be/dQw4w9WgXcQ   "
        assert VideoService.extract_youtube_video_id(url) == "dQw4w9WgXcQ"

    @pytest.mark.parametrize("invalid_input", [
        None,
        "",
        "   ",
        12345,
        {},
        [],
        "https://vimeo.com/12345678901",
        "https://google.com/search?q=video",
        "dQw4w9WgXc",          # 10 caracteres (inválido)
        "dQw4w9WgXcQQ",        # 12 caracteres (inválido)
        "https://youtube.com/watch?v=curto",
        "https://youtu.be/id_muito_longo_demais_para_youtube"
    ])
    def test_extract_invalid_inputs(self, invalid_input):
        """Rejeição de entradas inválidas ou não suportadas."""
        assert VideoService.extract_youtube_video_id(invalid_input) is None

    def test_validate_video_url_success(self):
        """Validação bem-sucedida com validate_video_url."""
        is_valid, video_id, error = VideoService.validate_video_url("https://youtu.be/dQw4w9WgXcQ")
        assert is_valid is True
        assert video_id == "dQw4w9WgXcQ"
        assert error is None

    def test_validate_video_url_failure(self):
        """Validação com erro para URL inválida com validate_video_url."""
        is_valid, video_id, error = VideoService.validate_video_url("https://invalido.com/video")
        assert is_valid is False
        assert video_id is None
        assert "URL do YouTube inválida ou ID do vídeo não encontrado." in error

    def test_build_embed_url_custom_params(self):
        """Geração de embed_url com parâmetros customizados."""
        embed = VideoService.build_embed_url("dQw4w9WgXcQ", 15, 30, controls=1, rel=1)
        assert embed == "https://www.youtube.com/embed/dQw4w9WgXcQ?start=15&end=30&rel=1&controls=1"

    def test_build_embed_url_clamped_time(self):
        """Garantia de que start_time negativo é ajustado para zero e end_time >= start."""
        embed = VideoService.build_embed_url("dQw4w9WgXcQ", -10, -5)
        assert "start=0" in embed
        assert "end=0" in embed
