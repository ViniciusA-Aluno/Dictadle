import pytest
from app.services.validators import validate_challenge_payload

class TestChallengePayloadValidation:
    """Testes unitários para a validação de payload na criação de desafios (SCRUM-129)."""

    def test_valid_challenge_payload(self):
        payload = {
            "title": "Friends - Joey's Pizza",
            "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "start_time_seconds": 10,
            "end_time_seconds": 22,
            "difficulty": "medium",
            "accent": "American",
            "transcript_official": "Joey doesn't share food!"
        }
        is_valid, err, clean = validate_challenge_payload(payload)
        assert is_valid is True
        assert err is None
        assert clean["youtube_video_id"] == "dQw4w9WgXcQ"
        assert clean["duration"] if "duration" in clean else (clean["end_time_seconds"] - clean["start_time_seconds"]) == 12

    def test_valid_payload_with_alternative_field_names(self):
        payload = {
            "title": "Short Clip",
            "video_url": "https://youtu.be/dQw4w9WgXcQ",
            "start_time": 0,
            "end_time": 15,
            "transcript": "Hello world"
        }
        is_valid, err, clean = validate_challenge_payload(payload)
        assert is_valid is True
        assert clean["start_time_seconds"] == 0
        assert clean["end_time_seconds"] == 15
        assert clean["difficulty"] == "medium"
        assert clean["accent"] == "American"

    def test_missing_or_empty_title(self):
        payload = {
            "title": "   ",
            "video_url": "https://youtu.be/dQw4w9WgXcQ",
            "start_time": 10,
            "end_time": 20,
            "transcript": "Test"
        }
        is_valid, err, clean = validate_challenge_payload(payload)
        assert is_valid is False
        assert "título" in err.lower()

    def test_invalid_youtube_url(self):
        payload = {
            "title": "Invalid Video",
            "video_url": "https://vimeo.com/123456",
            "start_time": 10,
            "end_time": 20,
            "transcript": "Test"
        }
        is_valid, err, clean = validate_challenge_payload(payload)
        assert is_valid is False
        assert "youtube" in err.lower()

    def test_negative_start_time(self):
        payload = {
            "title": "Clip",
            "video_url": "https://youtu.be/dQw4w9WgXcQ",
            "start_time": -5,
            "end_time": 10,
            "transcript": "Test"
        }
        is_valid, err, clean = validate_challenge_payload(payload)
        assert is_valid is False
        assert "negativo" in err.lower()

    def test_end_time_smaller_than_start_time(self):
        payload = {
            "title": "Clip",
            "video_url": "https://youtu.be/dQw4w9WgXcQ",
            "start_time": 25,
            "end_time": 10,
            "transcript": "Test"
        }
        is_valid, err, clean = validate_challenge_payload(payload)
        assert is_valid is False
        assert "maior" in err.lower()

    def test_duration_too_short_less_than_5_seconds(self):
        payload = {
            "title": "Too short",
            "video_url": "https://youtu.be/dQw4w9WgXcQ",
            "start_time": 10,
            "end_time": 13,
            "transcript": "Test"
        }
        is_valid, err, clean = validate_challenge_payload(payload)
        assert is_valid is False
        assert "mínimo 5" in err.lower()

    def test_duration_too_long_greater_than_30_seconds(self):
        payload = {
            "title": "Too long",
            "video_url": "https://youtu.be/dQw4w9WgXcQ",
            "start_time": 10,
            "end_time": 60,
            "transcript": "Test"
        }
        is_valid, err, clean = validate_challenge_payload(payload)
        assert is_valid is False
        assert "máximo 30" in err.lower()

    def test_invalid_difficulty(self):
        payload = {
            "title": "Difficulty test",
            "video_url": "https://youtu.be/dQw4w9WgXcQ",
            "start_time": 10,
            "end_time": 20,
            "difficulty": "insane",
            "transcript": "Test"
        }
        is_valid, err, clean = validate_challenge_payload(payload)
        assert is_valid is False
        assert "dificuldade" in err.lower()

    def test_missing_transcript(self):
        payload = {
            "title": "No transcript",
            "video_url": "https://youtu.be/dQw4w9WgXcQ",
            "start_time": 10,
            "end_time": 20,
            "transcript": ""
        }
        is_valid, err, clean = validate_challenge_payload(payload)
        assert is_valid is False
        assert "transcrição" in err.lower()


from app.services.validators import validate_challenge_update_payload

class TestChallengeUpdatePayloadValidation:
    """Testes unitários para a validação de atualização de desafios (SCRUM-88 / US-88)."""

    def test_valid_update_duration_between_10_and_15_seconds(self):
        payload = {
            "start_time_seconds": 12,
            "end_time_seconds": 24,
            "title": "Novo Título",
            "transcript_official": "Novo gabarito oficial válido"
        }
        is_valid, err, clean, code = validate_challenge_update_payload(payload)
        assert is_valid is True
        assert err is None
        assert code == 200
        assert clean["start_time_seconds"] == 12
        assert clean["end_time_seconds"] == 24
        assert clean["title"] == "Novo Título"

    def test_update_reject_duration_less_than_10_seconds(self):
        payload = {
            "start_time_seconds": 20,
            "end_time_seconds": 28  # Duração 8 segundos
        }
        is_valid, err, clean, code = validate_challenge_update_payload(payload)
        assert is_valid is False
        assert code == 422
        assert "no mínimo 10 segundos" in err

    def test_update_reject_duration_greater_than_15_seconds(self):
        payload = {
            "start_time_seconds": 10,
            "end_time_seconds": 26  # Duração 16 segundos
        }
        is_valid, err, clean, code = validate_challenge_update_payload(payload)
        assert is_valid is False
        assert code == 422
        assert "no máximo 15 segundos" in err

    def test_update_reject_empty_transcript_or_greater_than_500(self):
        # Vazio
        is_valid, err, clean, code = validate_challenge_update_payload({"transcript_official": "   "})
        assert is_valid is False
        assert code == 422

        # Maior que 500 caracteres
        is_valid, err, clean, code = validate_challenge_update_payload({"transcript_official": "x" * 501})
        assert is_valid is False
        assert code == 422
        assert "500 caracteres" in err

    def test_update_invalid_json_type(self):
        is_valid, err, clean, code = validate_challenge_update_payload("not a dict")
        assert is_valid is False
        assert code == 400
