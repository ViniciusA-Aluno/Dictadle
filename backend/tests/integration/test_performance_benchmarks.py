"""
Suíte de Testes de Desempenho e Latência - Plano de Qualidade Dictadle (Item Q-07).
Atributo de Qualidade: Desempenho
Métrica: Tempo de resposta no percentil 95 (p95) das principais operações <= 2s

Valida as principais operações sob requisições sucessivas:
1. GET /api/challenges/active (Listagem de desafios ativos para estudantes)
2. GET /api/challenges/playback/daily (Desafio diário de reprodução com contenção)
3. GET /api/challenges/<id>/playback (Metadados de reprodução anti-cheat)
4. GET /api/challenges (Listagem administrativa paginada com autenticação)
"""

import time
import math
import pytest
from app.extensions import db
from app.models.challenge import Challenge
from app.models.user import User
from app.services.token_service import TokenService

def calculate_percentile(data, percentile):
    """Calcula o percentil especificado de uma lista de tempos em segundos."""
    if not data:
        return 0.0
    sorted_data = sorted(data)
    k = (len(sorted_data) - 1) * (percentile / 100.0)
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return sorted_data[int(k)]
    d0 = sorted_data[int(f)] * (c - k)
    d1 = sorted_data[int(c)] * (k - f)
    return d0 + d1

@pytest.fixture
def student_auth_headers(sample_user):
    token = TokenService.generate_access_token(sample_user.id, sample_user.role)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def admin_auth_headers(app):
    admin = User(username="admin_bench", email="admin_bench@example.com", role="admin")
    admin.set_password("AdminSeguro123")
    db.session.add(admin)
    db.session.commit()
    token = TokenService.generate_access_token(admin.id, admin.role)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def seed_challenges(app):
    challenges = []
    for i in range(1, 15):
        c = Challenge(
            title=f"Benchmark Challenge {i}",
            video_url=f"https://www.youtube.com/watch?v=mock_{i}",
            youtube_video_id=f"mock_{i}",
            start_time_seconds=10,
            end_time_seconds=22,
            difficulty="easy" if i % 2 == 0 else "medium",
            accent="American" if i % 2 == 0 else "British",
            transcript_official=f"Official transcription text for challenge {i}.",
            is_active=True
        )
        challenges.append(c)
    db.session.add_all(challenges)
    db.session.commit()
    return challenges

class TestPerformanceBenchmarksQ07:
    """Valida o cumprimento da meta Q-07 (Tempo de resposta p95 <= 2s)."""

    def test_q07_benchmark_active_challenges_p95(self, client, student_auth_headers, seed_challenges):
        """Mede o tempo de resposta do endpoint GET /api/challenges/active."""
        iterations = 50
        latencies = []

        for _ in range(iterations):
            start = time.perf_counter()
            res = client.get("/api/challenges/active", headers=student_auth_headers)
            elapsed = time.perf_counter() - start
            latencies.append(elapsed)
            assert res.status_code == 200

        p95 = calculate_percentile(latencies, 95)
        avg = sum(latencies) / len(latencies)

        # Meta Q-07: p95 <= 2.0s
        assert p95 < 2.0, f"Tempo de resposta p95 ({p95:.4f}s) excedeu o limite de 2s"
        assert avg < 0.5, f"Tempo médio ({avg:.4f}s) deve ser inferior a 500ms"

    def test_q07_benchmark_daily_playback_p95(self, client, student_auth_headers, seed_challenges):
        """Mede o tempo de resposta do endpoint GET /api/challenges/daily/playback."""
        iterations = 50
        latencies = []

        for _ in range(iterations):
            start = time.perf_counter()
            res = client.get("/api/challenges/daily/playback", headers=student_auth_headers)
            elapsed = time.perf_counter() - start
            latencies.append(elapsed)
            assert res.status_code == 200

        p95 = calculate_percentile(latencies, 95)
        assert p95 < 2.0, f"Tempo de resposta p95 ({p95:.4f}s) excedeu o limite de 2s"

    def test_q07_benchmark_single_challenge_playback_p95(self, client, student_auth_headers, seed_challenges):
        """Mede o tempo de resposta do endpoint GET /api/challenges/<id>/playback."""
        challenge_id = seed_challenges[0].id
        iterations = 50
        latencies = []

        for _ in range(iterations):
            start = time.perf_counter()
            res = client.get(f"/api/challenges/{challenge_id}/playback", headers=student_auth_headers)
            elapsed = time.perf_counter() - start
            latencies.append(elapsed)
            assert res.status_code == 200

        p95 = calculate_percentile(latencies, 95)
        assert p95 < 2.0, f"Tempo de resposta p95 ({p95:.4f}s) excedeu o limite de 2s"

    def test_q07_benchmark_admin_challenge_list_p95(self, client, admin_auth_headers, seed_challenges):
        """Mede o tempo de resposta da listagem administrativa GET /api/challenges."""
        iterations = 50
        latencies = []

        for _ in range(iterations):
            start = time.perf_counter()
            res = client.get("/api/challenges?page=1&per_page=10", headers=admin_auth_headers)
            elapsed = time.perf_counter() - start
            latencies.append(elapsed)
            assert res.status_code == 200

        p95 = calculate_percentile(latencies, 95)
        assert p95 < 2.0, f"Tempo de resposta p95 ({p95:.4f}s) excedeu o limite de 2s"
