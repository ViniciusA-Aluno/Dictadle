import pytest
from app.models.challenge import Challenge

class TestChallengeModel:
    """Testes unitários para a entidade Challenge (SCRUM-91)."""

    def test_challenge_initialization_and_auto_extract_id(self):
        """Verifica se o youtube_video_id é extraído automaticamente da video_url caso não seja passado."""
        challenge = Challenge(
            title="Clipe Friends",
            video_url="https://youtu.be/dQw4w9WgXcQ",
            start_time_seconds=10,
            end_time_seconds=22,
            transcript_official="Never gonna give you up"
        )
        assert challenge.youtube_video_id == "dQw4w9WgXcQ"
        assert challenge.difficulty == "medium"
        assert challenge.accent == "American"
        assert challenge.is_active is True
        assert challenge.duration == 12

    def test_embed_url_generation(self):
        """Validação da propriedade embed_url com parâmetros restritos de player."""
        challenge = Challenge(
            title="Clipe Teste",
            video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            youtube_video_id="dQw4w9WgXcQ",
            start_time_seconds=45,
            end_time_seconds=57,
            transcript_official="Transcrição confidencial"
        )
        assert challenge.embed_url == "https://www.youtube.com/embed/dQw4w9WgXcQ?start=45&end=57&rel=0&controls=0"

    def test_to_playback_dict_anti_cheat(self):
        """
        REGRA ANTI-CHEAT (US-91 / Cenário 1):
        Garante que to_playback_dict() omite estritamente transcript_official.
        """
        challenge = Challenge(
            id=20,
            title="The Office - Cold Open",
            video_url="https://youtu.be/dQw4w9WgXcQ",
            youtube_video_id="dQw4w9WgXcQ",
            start_time_seconds=45,
            end_time_seconds=57,
            difficulty="hard",
            accent="British",
            transcript_official="That's what she said"
        )

        data = challenge.to_playback_dict()
        assert data["id"] == 20
        assert data["title"] == "The Office - Cold Open"
        assert data["youtube_video_id"] == "dQw4w9WgXcQ"
        assert data["start_time_seconds"] == 45
        assert data["end_time_seconds"] == 57
        assert data["duration"] == 12
        assert data["difficulty"] == "hard"
        assert data["accent"] == "British"
        assert "transcript_official" not in data
        assert "transcript" not in data

    def test_to_admin_dict_contains_transcript(self):
        """Visão administrativa deve incluir o gabarito oficial para conferência."""
        challenge = Challenge(
            id=1,
            title="Desafio Admin",
            video_url="https://youtu.be/dQw4w9WgXcQ",
            youtube_video_id="dQw4w9WgXcQ",
            start_time_seconds=10,
            end_time_seconds=25,
            transcript_official="Gabarito oficial do clipe"
        )
        data = challenge.to_admin_dict()
        assert data["transcript_official"] == "Gabarito oficial do clipe"
        assert data["video_url"] == "https://youtu.be/dQw4w9WgXcQ"
        assert data["is_active"] is True
