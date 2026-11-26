import pytest
from app.extensions import db
from app.models.challenge import Challenge
from app.models.user import User
from app.services.token_service import TokenService

@pytest.fixture
def admin_headers(app):
    with app.app_context():
        user = User(username="admin_list_user", email="admin_list@dictadle.com", role="admin")
        user.set_password("AdminPass123")
        db.session.add(user)
        db.session.commit()
        token = TokenService.generate_access_token(user.id, user.role)
        return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def student_headers(app):
    with app.app_context():
        student = User(username="student_list_user", email="student_list@dictadle.com", role="student")
        student.set_password("StudentPass123")
        db.session.add(student)
        db.session.commit()
        token = TokenService.generate_access_token(student.id, student.role)
        return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def sample_challenges(app):
    with app.app_context():
        c1 = Challenge(
            title="Friends - The One With The Embryos",
            video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            youtube_video_id="dQw4w9WgXcQ",
            start_time_seconds=10,
            end_time_seconds=22,
            difficulty="easy",
            accent="American",
            transcript_official="That's not even a word!",
            is_active=True
        )
        c2 = Challenge(
            title="Sherlock - Study in Pink Deduction",
            video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            youtube_video_id="dQw4w9WgXcQ",
            start_time_seconds=30,
            end_time_seconds=45,
            difficulty="hard",
            accent="British",
            transcript_official="Dear God, what is it like in your funny little brains?",
            is_active=True
        )
        c3 = Challenge(
            title="The Office - Fire Drill Scene",
            video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            youtube_video_id="dQw4w9WgXcQ",
            start_time_seconds=5,
            end_time_seconds=20,
            difficulty="medium",
            accent="American",
            transcript_official="Stay calm! Everybody stay calm!",
            is_active=False
        )
        db.session.add_all([c1, c2, c3])
        db.session.commit()
        return [c1.id, c2.id, c3.id]

class TestListChallengesRoute:
    """Testes de integração para GET /api/challenges (SCRUM-137 / US-90)."""

    def test_list_challenges_success_as_admin(self, client, admin_headers, sample_challenges):
        """Admin lista os desafios cadastrados com sucesso recebendo metadados completos."""
        res = client.get("/api/challenges", headers=admin_headers)
        assert res.status_code == 200
        data = res.get_json()
        assert "challenges" in data
        assert data["total"] >= 3
        assert data["page"] == 1
        assert data["per_page"] == 10
        assert "pages" in data

        # Verifica campos do to_admin_dict()
        first = data["challenges"][0]
        assert "id" in first
        assert "title" in first
        assert "video_url" in first
        assert "youtube_video_id" in first
        assert "start_time_seconds" in first
        assert "end_time_seconds" in first
        assert "duration" in first
        assert "difficulty" in first
        assert "accent" in first
        assert "transcript_official" in first
        assert "is_active" in first
        assert "created_at" in first

    def test_list_challenges_pagination(self, client, admin_headers, sample_challenges):
        """Paginação com parâmetros page e per_page."""
        res_p1 = client.get("/api/challenges?page=1&per_page=2", headers=admin_headers)
        assert res_p1.status_code == 200
        d1 = res_p1.get_json()
        assert len(d1["challenges"]) == 2
        assert d1["page"] == 1
        assert d1["per_page"] == 2
        assert d1["has_next"] is True
        assert d1["has_prev"] is False

        res_p2 = client.get("/api/challenges?page=2&per_page=2", headers=admin_headers)
        assert res_p2.status_code == 200
        d2 = res_p2.get_json()
        assert len(d2["challenges"]) >= 1
        assert d2["page"] == 2
        assert d2["has_prev"] is True

    def test_list_challenges_search_by_title(self, client, admin_headers, sample_challenges):
        """Filtro de busca textual por título (case-insensitive)."""
        res = client.get("/api/challenges?search=sherlock", headers=admin_headers)
        assert res.status_code == 200
        data = res.get_json()
        assert data["total"] == 1
        assert "Sherlock" in data["challenges"][0]["title"]

    def test_list_challenges_filter_by_difficulty(self, client, admin_headers, sample_challenges):
        """Filtro por nível de dificuldade."""
        res_easy = client.get("/api/challenges?difficulty=easy", headers=admin_headers)
        assert res_easy.status_code == 200
        for c in res_easy.get_json()["challenges"]:
            assert c["difficulty"] == "easy"

        res_hard = client.get("/api/challenges?difficulty=hard", headers=admin_headers)
        assert res_hard.status_code == 200
        for c in res_hard.get_json()["challenges"]:
            assert c["difficulty"] == "hard"

    def test_list_challenges_filter_by_accent(self, client, admin_headers, sample_challenges):
        """Filtro por sotaque."""
        res_british = client.get("/api/challenges?accent=British", headers=admin_headers)
        assert res_british.status_code == 200
        for c in res_british.get_json()["challenges"]:
            assert "British" in c["accent"]

    def test_list_challenges_filter_by_status(self, client, admin_headers, sample_challenges):
        """Filtro por status ativo / inativo."""
        res_active = client.get("/api/challenges?status=active", headers=admin_headers)
        assert res_active.status_code == 200
        for c in res_active.get_json()["challenges"]:
            assert c["is_active"] is True

        res_inactive = client.get("/api/challenges?status=inactive", headers=admin_headers)
        assert res_inactive.status_code == 200
        for c in res_inactive.get_json()["challenges"]:
            assert c["is_active"] is False

    def test_list_challenges_empty_search(self, client, admin_headers, sample_challenges):
        """Busca sem resultados retorna lista vazia e total 0."""
        res = client.get("/api/challenges?search=inexistente_termo_xyz_999", headers=admin_headers)
        assert res.status_code == 200
        data = res.get_json()
        assert data["challenges"] == []
        assert data["total"] == 0

    def test_list_challenges_sanitizes_bad_pagination_inputs(self, client, admin_headers, sample_challenges):
        """Higienização de parâmetros de paginação inválidos."""
        res = client.get("/api/challenges?page=-5&per_page=99999", headers=admin_headers)
        assert res.status_code == 200
        data = res.get_json()
        assert data["page"] == 1
        assert data["per_page"] <= 100

    def test_list_challenges_unauthorized(self, client):
        """Requisição sem token de autenticação retorna 401."""
        res = client.get("/api/challenges")
        assert res.status_code == 401

    def test_list_challenges_forbidden_for_student(self, client, student_headers, sample_challenges):
        """Estudante tentando acessar rota administrativa de listagem recebe 403."""
        res = client.get("/api/challenges", headers=student_headers)
        assert res.status_code == 403
        assert "Acesso restrito para administradores" in res.get_json()["error"]
