import pytest
from app.extensions import db
from app.models.challenge import Challenge
from app.models.user import User
from app.services.token_service import TokenService

@pytest.fixture
def auth_headers(app):
    with app.app_context():
        user = User(username="admin_user", email="admin@dictadle.com", role="admin")
        user.set_password("Admin12345")
        db.session.add(user)
        db.session.commit()
        token = TokenService.generate_access_token(user.id, user.role)
        return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def student_headers(app):
    with app.app_context():
        student = User(username="student_user", email="student@dictadle.com", role="student")
        student.set_password("Student12345")
        db.session.add(student)
        db.session.commit()
        token = TokenService.generate_access_token(student.id, student.role)
        return {"Authorization": f"Bearer {token}"}

class TestCreateChallengeRoute:
    """Testes de integração para POST /api/challenges (SCRUM-129 e SCRUM-130)."""

    def test_create_challenge_success_as_admin(self, client, auth_headers):
        payload = {
            "title": "Friends - Central Perk Coffee",
            "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "start_time_seconds": 15,
            "end_time_seconds": 27,
            "difficulty": "medium",
            "accent": "American",
            "transcript_official": "Could I BE drinking any more coffee?"
        }

        res = client.post("/api/challenges", json=payload, headers=auth_headers)
        assert res.status_code == 201
        data = res.get_json()
        assert "Desafio cadastrado com sucesso" in data["message"]
        challenge_data = data["challenge"]
        assert challenge_data["title"] == "Friends - Central Perk Coffee"
        assert challenge_data["youtube_video_id"] == "dQw4w9WgXcQ"
        assert challenge_data["duration"] == 12
        assert challenge_data["transcript_official"] == "Could I BE drinking any more coffee?"

        # Verifica persistência real no banco
        challenge = Challenge.query.filter_by(title="Friends - Central Perk Coffee").first()
        assert challenge is not None
        assert challenge.start_time_seconds == 15
        assert challenge.end_time_seconds == 27
        assert challenge.is_active is True

    def test_create_challenge_forbidden_for_student_role(self, client, student_headers):
        """
        SCRUM-130: Proteção de rota no backend.
        Estudantes não possuem permissão de curadoria e devem receber 403 Forbidden.
        """
        payload = {
            "title": "Student Attempt",
            "video_url": "https://youtu.be/dQw4w9WgXcQ",
            "start_time_seconds": 10,
            "end_time_seconds": 22,
            "transcript_official": "Student transcript"
        }
        res = client.post("/api/challenges", json=payload, headers=student_headers)
        assert res.status_code == 403
        data = res.get_json()
        assert "Acesso restrito para administradores" in data["error"]

    def test_create_challenge_unauthenticated_fails_401(self, client):
        """SCRUM-130: Requisição sem token JWT deve ser rejeitada com 401."""
        payload = {
            "title": "Unauthenticated Challenge",
            "video_url": "https://youtu.be/dQw4w9WgXcQ",
            "start_time_seconds": 10,
            "end_time_seconds": 22,
            "transcript_official": "Test"
        }
        res = client.post("/api/challenges", json=payload)
        assert res.status_code == 401

    def test_create_challenge_missing_required_fields(self, client, auth_headers):
        payload = {
            "title": "Missing Video URL"
        }
        res = client.post("/api/challenges", json=payload, headers=auth_headers)
        assert res.status_code == 400
        assert "error" in res.get_json()

    def test_create_challenge_invalid_youtube_url(self, client, auth_headers):
        payload = {
            "title": "Invalid URL Video",
            "video_url": "https://dailymotion.com/video/x12345",
            "start_time_seconds": 10,
            "end_time_seconds": 22,
            "transcript_official": "Some transcript"
        }
        res = client.post("/api/challenges", json=payload, headers=auth_headers)
        assert res.status_code == 400
        assert "youtube" in res.get_json()["error"].lower()

    def test_create_challenge_invalid_duration(self, client, auth_headers):
        # Duração de apenas 2 segundos (mínimo exigido: 5s)
        payload = {
            "title": "Too Short",
            "video_url": "https://youtu.be/dQw4w9WgXcQ",
            "start_time_seconds": 10,
            "end_time_seconds": 12,
            "transcript_official": "Short"
        }
        res = client.post("/api/challenges", json=payload, headers=auth_headers)
        assert res.status_code == 400
        assert "mínimo 5" in res.get_json()["error"].lower()
