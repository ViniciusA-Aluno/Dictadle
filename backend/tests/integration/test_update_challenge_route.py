import pytest
from app.extensions import db
from app.models.challenge import Challenge
from app.models.user import User
from app.services.token_service import TokenService

@pytest.fixture
def auth_headers(app):
    with app.app_context():
        user = User(username="admin_user_edit", email="admin_edit@dictadle.com", role="admin")
        user.set_password("Admin12345")
        db.session.add(user)
        db.session.commit()
        token = TokenService.generate_access_token(user.id, user.role)
        return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def student_headers(app):
    with app.app_context():
        student = User(username="student_user_edit", email="student_edit@dictadle.com", role="student")
        student.set_password("Student12345")
        db.session.add(student)
        db.session.commit()
        token = TokenService.generate_access_token(student.id, student.role)
        return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def sample_challenge(app):
    with app.app_context():
        challenge = Challenge(
            title="Desafio Original para Edição",
            video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            youtube_video_id="dQw4w9WgXcQ",
            start_time_seconds=10,
            end_time_seconds=22,
            difficulty="medium",
            accent="American",
            transcript_official="Transcrição inicial original.",
            is_active=True
        )
        db.session.add(challenge)
        db.session.commit()
        return challenge.id

class TestUpdateChallengeRoute:
    """Testes de integração para os endpoints GET e PUT /api/challenges/:id (SCRUM-88 / SCRUM-134)."""

    def test_scenario_1_update_title_and_transcript_success(self, client, auth_headers, sample_challenge):
        """
        Cenário 1 BDD (SCRUM-88):
        Edição bem-sucedida do gabarito oficial e título (Caminho feliz primário).
        Retorna 200 OK, persiste os novos dados e atualiza o timestamp 'updated_at'.
        """
        payload = {
            "title": "Casual greetings among friends",
            "transcript_official": "Hey guys, how is it going?"
        }

        res = client.put(f"/api/challenges/{sample_challenge}", json=payload, headers=auth_headers)
        assert res.status_code == 200

        data = res.get_json()
        assert "Desafio atualizado com sucesso" in data["message"]
        challenge_data = data["challenge"]
        assert challenge_data["id"] == sample_challenge
        assert challenge_data["title"] == "Casual greetings among friends"
        assert challenge_data["transcript_official"] == "Hey guys, how is it going?"
        assert challenge_data["updated_at"] is not None

        # Validação direta na base de dados
        c_db = db.session.get(Challenge, sample_challenge)
        assert c_db.title == "Casual greetings among friends"
        assert c_db.transcript_official == "Hey guys, how is it going?"
        assert c_db.updated_at is not None

    def test_scenario_2_update_times_within_10_to_15_seconds(self, client, auth_headers, sample_challenge):
        """
        Cenário 2 BDD (SCRUM-88):
        Ajuste dos tempos de início e fim mantendo a janela pedagógica de 10 a 15 segundos.
        (15s a 28s = 13 segundos de duração).
        """
        payload = {
            "start_time_seconds": 15,
            "end_time_seconds": 28
        }

        res = client.put(f"/api/challenges/{sample_challenge}", json=payload, headers=auth_headers)
        assert res.status_code == 200

        data = res.get_json()["challenge"]
        assert data["start_time_seconds"] == 15
        assert data["end_time_seconds"] == 28
        assert data["duration"] == 13
        assert "start=15&end=28" in data["embed_url"]

    def test_scenario_3_reject_duration_less_than_10_seconds(self, client, auth_headers, sample_challenge):
        """
        Cenário 3 BDD (SCRUM-88):
        Rejeição de atualização que resulte em corte inferior a 10 segundos (30s a 36s = 6 segundos).
        Retorna status 422 Unprocessable Entity e mensagem pedagógica apropriada.
        """
        payload = {
            "start_time_seconds": 30,
            "end_time_seconds": 36
        }

        res = client.put(f"/api/challenges/{sample_challenge}", json=payload, headers=auth_headers)
        assert res.status_code == 422

        data = res.get_json()
        assert "A duração do clipe deve ser de no mínimo 10 segundos" in data["error"]

        # Garante que os dados originais no banco não foram alterados
        c_db = db.session.get(Challenge, sample_challenge)
        assert c_db.start_time_seconds == 10
        assert c_db.end_time_seconds == 22

    def test_scenario_4_reject_duration_greater_than_15_seconds(self, client, auth_headers, sample_challenge):
        """
        Cenário 4 BDD (SCRUM-88):
        Rejeição de atualização que resulte em corte superior a 15 segundos (0s a 20s = 20 segundos).
        Retorna status 422 Unprocessable Entity e aborta a persistência.
        """
        payload = {
            "start_time_seconds": 0,
            "end_time_seconds": 20
        }

        res = client.put(f"/api/challenges/{sample_challenge}", json=payload, headers=auth_headers)
        assert res.status_code == 422

        data = res.get_json()
        assert "A duração do clipe deve ser de no máximo 15 segundos" in data["error"]

    def test_scenario_5_edit_nonexistent_challenge_returns_404(self, client, auth_headers):
        """
        Cenário 5 BDD (SCRUM-88):
        Tentativa de acessar ou enviar PUT para o id 9999 que não existe retorna 404 Not Found.
        """
        payload = {"title": "Título Inexistente"}
        res = client.put("/api/challenges/9999", json=payload, headers=auth_headers)
        assert res.status_code == 404
        assert "Desafio não encontrado" in res.get_json()["error"]

        # GET para id inexistente também deve retornar 404
        res_get = client.get("/api/challenges/9999", headers=auth_headers)
        assert res_get.status_code == 404

    def test_scenario_6_student_forbidden_from_editing(self, client, student_headers, sample_challenge):
        """
        Cenário 6 BDD (SCRUM-88):
        Bloqueio de edição por usuário com perfil de estudante (retorna 403 Forbidden).
        Nenhuma coluna da tabela 'challenges' deve ser alterada.
        """
        payload = {
            "title": "Tentativa Hacker de Edição por Estudante"
        }

        res = client.put(f"/api/challenges/{sample_challenge}", json=payload, headers=student_headers)
        assert res.status_code == 403
        assert "Acesso restrito para administradores" in res.get_json()["error"]

        c_db = db.session.get(Challenge, sample_challenge)
        assert c_db.title != "Tentativa Hacker de Edição por Estudante"

    def test_get_challenge_by_id_success_as_admin(self, client, auth_headers, sample_challenge):
        """Endpoint GET /api/challenges/:id retorna os dados completos para preenchimento do formulário."""
        res = client.get(f"/api/challenges/{sample_challenge}", headers=auth_headers)
        assert res.status_code == 200

        data = res.get_json()["challenge"]
        assert data["id"] == sample_challenge
        assert data["transcript_official"] == "Transcrição inicial original."
        assert data["video_url"] == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        assert "updated_at" in data

    def test_get_challenge_by_id_forbidden_as_student(self, client, student_headers, sample_challenge):
        """Estudante não pode carregar a visão administrativa de edição (Anti-Cheat)."""
        res = client.get(f"/api/challenges/{sample_challenge}", headers=student_headers)
        assert res.status_code == 403

    def test_update_unauthorized_without_token_returns_401(self, client, sample_challenge):
        """Requisições sem token de autenticação são rejeitadas com 401."""
        res = client.put(f"/api/challenges/{sample_challenge}", json={"title": "Sem Auth"})
        assert res.status_code == 401

    def test_update_transcript_empty_or_too_long_returns_422(self, client, auth_headers, sample_challenge):
        """Gabarito oficial não pode ser esvaziado nem exceder 500 caracteres."""
        # Gabarito vazio
        res_empty = client.put(f"/api/challenges/{sample_challenge}", json={"transcript_official": "   "}, headers=auth_headers)
        assert res_empty.status_code == 422

        # Gabarito com mais de 500 caracteres
        res_long = client.put(f"/api/challenges/{sample_challenge}", json={"transcript_official": "a" * 501}, headers=auth_headers)
        assert res_long.status_code == 422
        assert "500 caracteres" in res_long.get_json()["error"]
