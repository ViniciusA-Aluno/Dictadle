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

    def test_scenario_3_reject_duration_less_than_5_seconds(self, client, auth_headers, sample_challenge):
        """
        Cenário 3 BDD (SCRUM-88 / SCRUM-192):
        Rejeição de atualização que resulte em corte inferior a 5 segundos (30s a 34s = 4 segundos).
        Retorna status 422 Unprocessable Entity e mensagem apropriada.
        """
        payload = {
            "start_time_seconds": 30,
            "end_time_seconds": 34
        }

        res = client.put(f"/api/challenges/{sample_challenge}", json=payload, headers=auth_headers)
        assert res.status_code == 422

        data = res.get_json()
        assert "A duração do clipe deve ser de no mínimo 5 segundos" in data["error"]

        # Garante que os dados originais no banco não foram alterados
        c_db = db.session.get(Challenge, sample_challenge)
        assert c_db.start_time_seconds == 10
        assert c_db.end_time_seconds == 22

    def test_scenario_4_reject_duration_greater_than_30_seconds(self, client, auth_headers, sample_challenge):
        """
        Cenário 4 BDD (SCRUM-88 / SCRUM-192):
        Rejeição de atualização que resulte em corte superior a 30 segundos (0s a 35s = 35 segundos).
        Retorna status 422 Unprocessable Entity e aborta a persistência.
        """
        payload = {
            "start_time_seconds": 0,
            "end_time_seconds": 35
        }

        res = client.put(f"/api/challenges/{sample_challenge}", json=payload, headers=auth_headers)
        assert res.status_code == 422

        data = res.get_json()
        assert "A duração do clipe deve ser de no máximo 30 segundos" in data["error"]

    def test_scrum192_regression_edit_challenge_with_5_to_9s_or_16_to_30s_duration(
        self, client, auth_headers
    ):
        """
        Teste de Regressão (SCRUM-192):
        Dado que sou um administrador autenticado e existe um desafio cadastrado com duração de 20s (ou 7s)
        Quando eu enviar uma requisição PUT para /api/challenges/<id> alterando apenas title ou is_active
        (ou enviando o payload completo do modal mantendo a duração entre 5s e 30s)
        Então o servidor deve retornar HTTP 200 OK e persistir a alteração no banco de dados.
        """
        # 1. Cria desafio válido com 20s de duração via POST /api/challenges
        create_res = client.post(
            "/api/challenges",
            json={
                "title": "Desafio de 20 Segundos",
                "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "start_time_seconds": 10,
                "end_time_seconds": 30,
                "difficulty": "medium",
                "accent": "American",
                "transcript_official": "Twenty seconds clip transcript official.",
            },
            headers=auth_headers,
        )
        assert create_res.status_code == 201
        cid_20s = create_res.get_json()["challenge"]["id"]

        # 2. Atualização parcial alterando apenas title e is_active (sem enviar start/end_time_seconds)
        put_partial = client.put(
            f"/api/challenges/{cid_20s}",
            json={"title": "Novo título 20s", "is_active": False},
            headers=auth_headers,
        )
        assert put_partial.status_code == 200
        updated_data = put_partial.get_json()["challenge"]
        assert updated_data["title"] == "Novo título 20s"
        assert updated_data["is_active"] is False
        assert updated_data["duration"] == 20

        # 3. Atualização completa (como enviada pelo EditChallengeModal) com duração de 7s (entre 5s e 9s)
        put_full_7s = client.put(
            f"/api/challenges/{cid_20s}",
            json={
                "title": "Desafio Ajustado para 7s",
                "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "start_time_seconds": 5,
                "end_time_seconds": 12,
                "difficulty": "easy",
                "accent": "British",
                "transcript_official": "Seven seconds clip transcript.",
                "is_active": True,
            },
            headers=auth_headers,
        )
        assert put_full_7s.status_code == 200
        data_7s = put_full_7s.get_json()["challenge"]
        assert data_7s["title"] == "Desafio Ajustado para 7s"
        assert data_7s["duration"] == 7
        assert data_7s["is_active"] is True

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
