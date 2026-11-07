import pytest
from app.extensions import db
from app.models.challenge import Challenge
from app.services.token_service import TokenService

@pytest.fixture
def auth_headers(sample_user):
    """Gera o cabeçalho Authorization Bearer com token de estudante válido."""
    token = TokenService.generate_access_token(sample_user.id, sample_user.role)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def challenge_20(app):
    """Cria e persiste o desafio id 20 conforme especificado no Cenário 1 dos critérios de aceite."""
    challenge = Challenge(
        id=20,
        title="The Office - Fire Drill",
        video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        youtube_video_id="dQw4w9WgXcQ",
        start_time_seconds=45,
        end_time_seconds=57,
        difficulty="medium",
        accent="American",
        transcript_official="Stay calm! Everyone stay calm!",
        is_active=True
    )
    db.session.add(challenge)
    db.session.commit()
    return challenge

class TestChallengePlaybackRoutes:
    """Suíte de testes de integração BDD para a rota de playback de desafios (SCRUM-145 / US-91)."""

    def test_scenario_1_get_playback_success_and_anti_cheat(self, client, auth_headers, challenge_20):
        """
        Cenário 1: Obtenção bem-sucedida dos metadados de reprodução sem exposição do gabarito (Caminho feliz primário).
        Dado que existe um desafio cadastrado com id 20, início em 45s e fim em 57s
        Quando um estudante autenticado realiza uma requisição GET /api/challenges/20/playback
        Então o sistema retorna status 200 OK
        E o JSON contém youtube_video_id, start_time_seconds: 45, end_time_seconds: 57 e duration: 12
        E o JSON de resposta não contém o campo transcript_official.
        """
        res = client.get("/api/challenges/20/playback", headers=auth_headers)
        assert res.status_code == 200

        data = res.get_json()
        assert data["id"] == 20
        assert data["youtube_video_id"] == "dQw4w9WgXcQ"
        assert data["start_time_seconds"] == 45
        assert data["end_time_seconds"] == 57
        assert data["duration"] == 12
        assert data["difficulty"] == "medium"
        assert data["accent"] == "American"
        assert "embed_url" in data
        assert "dQw4w9WgXcQ" in data["embed_url"]

        # REGRA ANTI-CHEAT
        assert "transcript_official" not in data
        assert "transcript" not in data
        assert "gabarito" not in data

    def test_scenario_2_short_url_embed_compatibility(self, client, auth_headers, app):
        """
        Cenário 2: Normalização correta de diferentes formatos de URL do YouTube (Caminho feliz alternativo).
        Dado que um desafio foi cadastrado utilizando um link encurtado https://youtu.be/dQw4w9WgXcQ
        Quando a API de reprodução processa os dados desse desafio
        Então o parser extrai corretamente o youtube_video_id igual a "dQw4w9WgXcQ"
        E gera a URL de incorporação compatível com a API de IFrame do YouTube.
        """
        challenge = Challenge(
            id=35,
            title="Friends - Pivot",
            video_url="https://youtu.be/dQw4w9WgXcQ",
            start_time_seconds=10,
            end_time_seconds=24,
            transcript_official="Pivot! Pivot! Pivot!",
            is_active=True
        )
        db.session.add(challenge)
        db.session.commit()

        res = client.get(f"/api/challenges/{challenge.id}/playback", headers=auth_headers)
        assert res.status_code == 200

        data = res.get_json()
        assert data["youtube_video_id"] == "dQw4w9WgXcQ"
        expected_embed = "https://www.youtube.com/embed/dQw4w9WgXcQ?start=10&end=24&rel=0&controls=0"
        assert data["embed_url"] == expected_embed

    def test_scenario_3_challenge_not_found(self, client, auth_headers):
        """
        Cenário 3: Solicitação de reprodução para um desafio inexistente.
        Dado que o estudante solicita os dados de mídia para o desafio id 8888 que não consta no banco
        Quando o endpoint processa a requisição
        Então o sistema retorna status 404 Not Found
        E retorna a mensagem "Desafio não encontrado".
        """
        res = client.get("/api/challenges/8888/playback", headers=auth_headers)
        assert res.status_code == 404

        data = res.get_json()
        assert data["error"] == "Desafio não encontrado"

    def test_scenario_4_unauthorized_without_jwt(self, client, challenge_20):
        """
        Cenário 4: Bloqueio de acesso à API de reprodução por usuário não autenticado.
        Dado que um visitante sem token JWT válido tenta acessar GET /api/challenges/20/playback
        Quando o middleware de autenticação intercepta a chamada
        Então o sistema retorna status 401 Unauthorized.
        """
        res = client.get("/api/challenges/20/playback")
        assert res.status_code == 401
        assert "Token de autenticação não fornecido." in res.get_json()["error"]

    def test_unauthorized_with_invalid_token(self, client, challenge_20):
        """Bloqueio de requisição com token JWT forjado ou expirado."""
        headers = {"Authorization": "Bearer token_invalido_qualquer"}
        res = client.get("/api/challenges/20/playback", headers=headers)
        assert res.status_code == 401
        assert "Token de autenticação inválido ou expirado." in res.get_json()["error"]

    def test_inactive_challenge_returns_404(self, client, auth_headers, app):
        """Desafio desativado (soft-deleted) não deve ser servido para reprodução."""
        inactive_challenge = Challenge(
            id=99,
            title="Desafio Inativo",
            video_url="https://youtu.be/dQw4w9WgXcQ",
            youtube_video_id="dQw4w9WgXcQ",
            start_time_seconds=0,
            end_time_seconds=15,
            transcript_official="Inativo",
            is_active=False
        )
        db.session.add(inactive_challenge)
        db.session.commit()

        res = client.get("/api/challenges/99/playback", headers=auth_headers)
        assert res.status_code == 404
        assert res.get_json()["error"] == "Desafio não encontrado"

    def test_daily_challenge_playback_success(self, client, auth_headers, challenge_20):
        """Verifica o endpoint GET /api/challenges/daily/playback."""
        res = client.get("/api/challenges/daily/playback", headers=auth_headers)
        assert res.status_code == 200
        data = res.get_json()
        assert data["id"] == challenge_20.id
        assert data["youtube_video_id"] == "dQw4w9WgXcQ"
        assert "transcript_official" not in data

    def test_corrupted_challenge_media_returns_422(self, client, auth_headers, app):
        """Desafio com youtube_video_id nulo/corrompido retorna 422 Unprocessable Entity."""
        corrupted = Challenge(
            id=50,
            title="Desafio Corrompido",
            video_url="corrompido",
            start_time_seconds=0,
            end_time_seconds=15,
            transcript_official="Corrompido",
            is_active=True
        )
        corrupted.youtube_video_id = ""
        db.session.add(corrupted)
        db.session.commit()

        res = client.get("/api/challenges/50/playback", headers=auth_headers)
        assert res.status_code == 422
        assert "Mídia do desafio corrompida ou inválida" in res.get_json()["error"]
