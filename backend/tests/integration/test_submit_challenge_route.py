"""
Testes de integração para o endpoint POST /api/challenges/<id>/submit (SCRUM-109 / SCRUM-185 / SCRUM-187).
"""
import pytest
from app.extensions import db
from app.models.challenge import Challenge
from app.models.user_attempt import UserAttempt
from app.services.token_service import TokenService


@pytest.fixture
def student_headers(sample_user):
    token = TokenService.generate_access_token(sample_user.id, sample_user.role)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def active_challenge(app):
    challenge = Challenge(
        id=20,
        title="Speech Practice",
        video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        youtube_video_id="dQw4w9WgXcQ",
        start_time_seconds=10,
        end_time_seconds=22,
        difficulty="medium",
        accent="American",
        transcript_official="I have a dream today",
        is_active=True,
    )
    db.session.add(challenge)
    db.session.commit()
    return challenge


@pytest.fixture
def inactive_challenge(app):
    challenge = Challenge(
        id=21,
        title="Inactive Clip",
        video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        youtube_video_id="dQw4w9WgXcQ",
        start_time_seconds=5,
        end_time_seconds=17,
        difficulty="easy",
        accent="British",
        transcript_official="Good morning everyone",
        is_active=False,
    )
    db.session.add(challenge)
    db.session.commit()
    return challenge


class TestSubmitChallengeRoute:
    def test_submit_valid_transcription_persists_attempt_and_reveals_official_transcript(
        self, client, student_headers, sample_user, active_challenge
    ):
        res = client.post(
            f"/api/challenges/{active_challenge.id}/submit",
            json={"submitted_transcript": "  I have a dream today  "},
            headers=student_headers,
        )
        assert res.status_code == 201
        payload = res.get_json()
        assert payload["attempt"]["user_id"] == sample_user.id
        assert payload["attempt"]["challenge_id"] == active_challenge.id
        assert payload["attempt"]["submitted_transcript"] == "I have a dream today"
        assert payload["transcript_official"] == "I have a dream today"

        saved = UserAttempt.query.filter_by(
            user_id=sample_user.id, challenge_id=active_challenge.id
        ).first()
        assert saved is not None
        assert saved.submitted_transcript == "I have a dream today"

    def test_submit_exact_500_chars_succeeds(self, client, student_headers, active_challenge):
        long_text = "x" * 500
        res = client.post(
            f"/api/challenges/{active_challenge.id}/submit",
            json={"submitted_transcript": long_text},
            headers=student_headers,
        )
        assert res.status_code == 201
        assert len(res.get_json()["attempt"]["submitted_transcript"]) == 500

    def test_submit_over_500_chars_returns_422(self, client, student_headers, active_challenge):
        too_long = "x" * 501
        res = client.post(
            f"/api/challenges/{active_challenge.id}/submit",
            json={"submitted_transcript": too_long},
            headers=student_headers,
        )
        assert res.status_code == 422
        assert "500" in res.get_json()["error"]
        assert UserAttempt.query.count() == 0

    def test_submit_empty_or_whitespace_returns_400(self, client, student_headers, active_challenge):
        for bad in ["", "     "]:
            res = client.post(
                f"/api/challenges/{active_challenge.id}/submit",
                json={"submitted_transcript": bad},
                headers=student_headers,
            )
            assert res.status_code == 400
            assert UserAttempt.query.count() == 0

    def test_submit_without_auth_returns_401(self, client, active_challenge):
        res = client.post(
            f"/api/challenges/{active_challenge.id}/submit",
            json={"submitted_transcript": "I have a dream today"},
        )
        assert res.status_code == 401

    def test_submit_nonexistent_or_inactive_challenge_returns_404(
        self, client, student_headers, inactive_challenge
    ):
        res_missing = client.post(
            "/api/challenges/9999/submit",
            json={"submitted_transcript": "Hello"},
            headers=student_headers,
        )
        assert res_missing.status_code == 404

        res_inactive = client.post(
            f"/api/challenges/{inactive_challenge.id}/submit",
            json={"submitted_transcript": "Good morning"},
            headers=student_headers,
        )
        assert res_inactive.status_code == 404
