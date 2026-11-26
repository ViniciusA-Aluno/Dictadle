"""
Suíte de Verificação Automatizada da Estrutura de Containerização e Deploy Local
(US-167 / SCRUM-167 / SCRUM-168 / SCRUM-169 / SCRUM-170 / SCRUM-171).

Valida os 5 Cenários de Aceite BDD da US-167:
- Cenário 1: Provisionamento dos serviços (db, backend, frontend) e migrações automáticas (flask db upgrade)
- Cenário 2: Comunicação integrada Frontend -> Nginx Proxy (/api/) -> Backend -> DB na rede dictadle-net
- Cenário 3: Validação automática de prontidão pelo Healthcheck (/api/health/ready -> 200 OK, ready: true)
- Cenário 4: Suporte a recarregamento de rotas SPA (React Router) via try_files no Nginx
- Cenário 5: Persistência dos dados via volume nomeado dictadle_postgres_data e restart: unless-stopped
"""
from pathlib import Path
from app.models.user import User
from app.models.challenge import Challenge
from app.extensions import db
from app.services.token_service import TokenService

PROJECT_ROOT = Path(__file__).resolve().parents[3]


class TestDockerDeploymentStructure:
    """Verifica a integridade dos artefatos de containerização e fluxo ponta a ponta do deploy local."""

    def test_scenario_1_dockerfiles_entrypoint_and_compose_services_exist(self):
        """
        Cenário 1: Provisionamento completo do ambiente local via Docker Compose.
        Verifica existência e instruções obrigatórias nos Dockerfiles, entrypoint e docker-compose.yml.
        """
        backend_dockerfile = PROJECT_ROOT / "backend" / "Dockerfile"
        backend_entrypoint = PROJECT_ROOT / "backend" / "entrypoint.sh"
        backend_dockerignore = PROJECT_ROOT / "backend" / ".dockerignore"
        frontend_dockerfile = PROJECT_ROOT / "frontend" / "Dockerfile"
        frontend_dockerignore = PROJECT_ROOT / "frontend" / ".dockerignore"
        compose_file = PROJECT_ROOT / "docker-compose.yml"
        env_example = PROJECT_ROOT / ".env.example"

        for artifact in (
            backend_dockerfile,
            backend_entrypoint,
            backend_dockerignore,
            frontend_dockerfile,
            frontend_dockerignore,
            compose_file,
            env_example,
        ):
            assert artifact.exists(), f"Artefato obrigatório ausente: {artifact}"

        entrypoint_content = backend_entrypoint.read_text(encoding="utf-8")
        assert "flask db upgrade" in entrypoint_content
        assert "flask seed-admin" in entrypoint_content

        backend_df_content = backend_dockerfile.read_text(encoding="utf-8")
        assert "gunicorn" in backend_df_content
        assert "/app/entrypoint.sh" in backend_df_content

        compose_content = compose_file.read_text(encoding="utf-8")
        assert "dictadle-db" in compose_content
        assert "dictadle-backend" in compose_content
        assert "dictadle-frontend" in compose_content
        assert "condition: service_healthy" in compose_content

    def test_scenario_2_and_4_nginx_reverse_proxy_and_spa_routing(self):
        """
        Cenários 2 e 4: Proxy reverso de '/api/' para o backend e suporte a rotas SPA (try_files) no Nginx.
        """
        nginx_conf = PROJECT_ROOT / "frontend" / "nginx.conf"
        assert nginx_conf.exists()
        content = nginx_conf.read_text(encoding="utf-8")

        # Cenário 2: Roteamento /api/ -> http://backend:5000/api/
        assert "location /api/" in content
        assert "proxy_pass http://backend:5000/api/;" in content

        # Cenário 4: Suporte a F5 em rotas SPA do React Router sem erro 404
        assert "try_files $uri $uri/ /index.html;" in content
        assert "location = /healthz" in content

        frontend_df = (PROJECT_ROOT / "frontend" / "Dockerfile").read_text(encoding="utf-8")
        assert "FROM node:20-alpine AS builder" in frontend_df
        assert "FROM nginx:1.27-alpine AS production" in frontend_df
        assert "VITE_API_URL=/api" in frontend_df

    def test_scenario_3_container_healthcheck_and_end_to_end_api_communication(self, app, client):
        """
        Cenários 2 e 3: Valida o endpoint de Readiness Gate (/api/health/ready) configurado no HEALTHCHECK
        do contêiner e o fluxo integrado de autenticação, consulta e submissão de desafio na API.
        """
        backend_df = (PROJECT_ROOT / "backend" / "Dockerfile").read_text(encoding="utf-8")
        compose_content = (PROJECT_ROOT / "docker-compose.yml").read_text(encoding="utf-8")

        assert "/api/health/ready" in backend_df
        assert "/api/health/ready" in compose_content

        # Probe real no endpoint de healthcheck do backend
        health_res = client.get("/api/health/ready")
        assert health_res.status_code == 200
        health_data = health_res.get_json()
        assert health_data["ready"] is True
        assert health_data["database"] == "connected"

        # Simulação ponta a ponta do fluxo consumido pelo frontend via /api/*
        student = User(username="deploy_student", email="deploy@dictadle.com", role="student", is_active=True)
        student.set_password("DeployPass123")
        challenge = Challenge(
            id=77,
            title="Local Deploy Verification Clip",
            video_url="https://youtu.be/dQw4w9WgXcQ",
            youtube_video_id="dQw4w9WgXcQ",
            start_time_seconds=10,
            end_time_seconds=22,
            difficulty="easy",
            accent="American",
            transcript_official="Docker containers are running smoothly",
            is_active=True,
        )
        db.session.add_all([student, challenge])
        db.session.commit()

        token = TokenService.generate_access_token(student.id, student.role)
        headers = {"Authorization": f"Bearer {token}"}

        play_res = client.get("/api/challenges/77/playback", headers=headers)
        assert play_res.status_code == 200
        assert play_res.get_json()["id"] == 77

        submit_res = client.post(
            "/api/challenges/77/submit",
            json={"submitted_transcript": "Docker containers are running smoothly"},
            headers=headers,
        )
        assert submit_res.status_code == 200
        assert submit_res.get_json()["accuracy_percentage"] == 100.0

    def test_scenario_5_persistent_volume_and_network_isolation(self):
        """
        Cenário 5: Garante a configuração do volume persistente do PostgreSQL e rede isolada bridge.
        """
        compose_content = (PROJECT_ROOT / "docker-compose.yml").read_text(encoding="utf-8")
        assert "dictadle_postgres_data:/var/lib/postgresql/data" in compose_content
        assert "restart: unless-stopped" in compose_content
        assert "dictadle-net:" in compose_content
        assert "driver: bridge" in compose_content
