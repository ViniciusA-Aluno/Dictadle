"""
Suíte de Testes de Verificação do Driver Arquitetural DA-DIS-DEV-002 (SCRUM-22).
Atributo de Qualidade: Disponibilidade — Disponibilidade contínua durante atualizações.

Critério de Aceite (BDD):
  Dado que existem usuários reproduzindo vídeos e enviando respostas
  Quando a pipeline de deploy aplica uma nova versão em produção
  Então nenhuma requisição do usuário deve retornar erro 502 ou 503 decorrente do processo de atualização.
"""

from unittest.mock import patch
from sqlalchemy.exc import OperationalError
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.challenge import Challenge
from app.services.token_service import TokenService
from app.services.deployment_service import BlueGreenLoadBalancer


def _build_environment_instance(db_uri, slot, version, ready=True):
    """Cria uma instância isolada (Blue ou Green) conectada ao mesmo banco compartilhado de produção/teste."""
    return create_app(
        "testing",
        config_overrides={
            "SQLALCHEMY_DATABASE_URI": db_uri,
            "DEPLOYMENT_SLOT": slot,
            "APP_VERSION": version,
            "INSTANCE_READY": ready,
        },
    )


class TestAvailabilityDriver002:
    """Verificação automatizada do Driver DA-DIS-DEV-002 (Blue/Green Deploy & Zero-Downtime)."""

    def test_health_and_readiness_endpoints_online(self, client):
        """
        Verifica se os probes /api/health e /api/health/ready reportam integridade total (200 OK),
        conectividade com o banco e cabeçalhos de rastreamento do slot de deploy.
        """
        for endpoint in ("/api/health", "/api/health/ready"):
            res = client.get(endpoint)
            assert res.status_code == 200
            data = res.get_json()
            assert data["status"] == "ok"
            assert data["ready"] is True
            assert data["database"] == "connected"
            assert data["slot"] == "blue"
            assert "version" in data
            assert res.headers.get("X-Deployment-Slot") == "blue"
            assert res.headers.get("X-App-Version") == data["version"]

    def test_readiness_probe_returns_503_when_warming_up_or_db_unavailable(self, app, client):
        """
        Garante que uma instância ainda em aquecimento (INSTANCE_READY=False) ou sem conexão com o
        banco retorne 503 no Readiness Probe para que o Load Balancer não envie tráfego prematuramente.
        """
        app.config["INSTANCE_READY"] = False
        res_warming = client.get("/api/health/ready")
        assert res_warming.status_code == 503
        data_warming = res_warming.get_json()
        assert data_warming["ready"] is False
        assert data_warming["status"] == "warming_up"

        app.config["INSTANCE_READY"] = True
        with patch("app.services.deployment_service.db.session.execute") as mock_exec:
            mock_exec.side_effect = OperationalError("SELECT 1", {}, Exception("DB connection refused"))
            res_db_fail = client.get("/api/health/ready")
            assert res_db_fail.status_code == 503
            data_db_fail = res_db_fail.get_json()
            assert data_db_fail["ready"] is False
            assert data_db_fail["database"] == "disconnected"

    def test_bdd_zero_502_503_errors_during_blue_green_deployment_under_active_load(self, tmp_path):
        """
        Cenário BDD Principal (DA-DIS-DEV-002 / SCRUM-22):
        Dado que existem usuários reproduzindo vídeos e enviando respostas
        Quando a pipeline de deploy aplica uma nova versão em produção (Blue v2.0.0 -> Green v2.1.0)
        Então nenhuma requisição do usuário deve retornar erro 502 ou 503 decorrente do processo de atualização
        E 100% das sessões ativas são preservadas sem queda de conexão.
        """
        shared_db_path = tmp_path / "dictadle_prod_sim.sqlite"
        shared_db_uri = f"sqlite:///{shared_db_path}"

        blue_app = _build_environment_instance(shared_db_uri, slot="blue", version="2.0.0", ready=True)
        with blue_app.app_context():
            db.create_all()
            student = User(username="estudante_pico", email="pico@dictadle.com", role="student", is_active=True)
            student.set_password("SenhaForte123")
            challenge = Challenge(
                id=20,
                title="BBC News - Listening Challenge",
                video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                youtube_video_id="dQw4w9WgXcQ",
                start_time_seconds=15,
                end_time_seconds=30,
                difficulty="medium",
                accent="British",
                transcript_official="Breaking news from London today",
                is_active=True,
            )
            db.session.add_all([student, challenge])
            db.session.commit()
            token = TokenService.generate_access_token(student.id, student.role)

        auth_headers = {"Authorization": f"Bearer {token}"}
        lb = BlueGreenLoadBalancer(initial_app=blue_app, initial_slot="blue")

        responses_log = []

        # Fase 1: Usuários ativos reproduzindo vídeos e validando sessão antes do deploy (Slot Blue v2.0.0)
        for _ in range(15):
            r_play = lb.request("GET", "/api/challenges/20/playback", headers=auth_headers)
            r_daily = lb.request("GET", "/api/challenges/daily/playback", headers=auth_headers)
            r_session = lb.request("GET", "/api/auth/me", headers=auth_headers)
            responses_log.extend([r_play, r_daily, r_session])

        # Fase 2: Pipeline de CI/CD inicia deploy da nova versão (Green v2.1.0) inicialmente em warm-up
        green_app = _build_environment_instance(shared_db_uri, slot="green", version="2.1.0", ready=False)
        lb.register_standby("green", green_app)

        # Tentativa de cutover enquanto Green ainda está aquecendo deve ser retida pelo Readiness Gate
        switched_early, _ = lb.cutover_to("green")
        assert switched_early is False
        assert lb.active_slot == "blue"

        # Usuários continuam utilizando a plataforma durante o provisionamento do Green sem erros 502/503
        for _ in range(15):
            r_play = lb.request("GET", "/api/challenges/20/playback", headers=auth_headers)
            r_session = lb.request("GET", "/api/auth/me", headers=auth_headers)
            responses_log.extend([r_play, r_session])

        # Fase 3: Green conclui inicialização, reporta integridade total e o Load Balancer migra o tráfego
        green_app.config["INSTANCE_READY"] = True
        switched_ready, readiness_payload = lb.cutover_to("green")
        assert switched_ready is True
        assert readiness_payload["version"] == "2.1.0"
        assert lb.active_slot == "green"

        # Fase 4: Usuários ativos seguem reproduzindo vídeos na nova versão sem perder a sessão
        for _ in range(15):
            r_play = lb.request("GET", "/api/challenges/20/playback", headers=auth_headers)
            r_daily = lb.request("GET", "/api/challenges/daily/playback", headers=auth_headers)
            r_session = lb.request("GET", "/api/auth/me", headers=auth_headers)
            responses_log.extend([r_play, r_daily, r_session])

        # Verificação das Medidas de Resposta do Driver DA-DIS-DEV-002:
        # 1. Nenhuma requisição de usuário retornou 502 ou 503
        errors_502_503 = [r.status_code for r in responses_log if r.status_code in (502, 503)]
        assert len(errors_502_503) == 0

        # 2. 100% de sucesso (200 OK) em todas as 120 requisições contínuas durante o ciclo de deploy
        assert len(responses_log) == 120
        assert all(r.status_code == 200 for r in responses_log)

        # 3. Comprovação da transição transparente de versão de Blue (2.0.0) para Green (2.1.0)
        assert responses_log[0].headers.get("X-Deployment-Slot") == "blue"
        assert responses_log[0].headers.get("X-App-Version") == "2.0.0"
        assert responses_log[-1].headers.get("X-Deployment-Slot") == "green"
        assert responses_log[-1].headers.get("X-App-Version") == "2.1.0"

    def test_load_balancer_rejects_unregistered_slot(self, app):
        """Garante segurança caso a pipeline tente comutar para um slot inexistente."""
        lb = BlueGreenLoadBalancer(initial_app=app, initial_slot="blue")
        switched, payload = lb.cutover_to("canary_inexistente")
        assert switched is False
        assert "não registrado" in payload["error"]
        assert lb.active_slot == "blue"
        assert len(lb.cutover_history) == 1
        assert lb.cutover_history[0]["switched"] is False
