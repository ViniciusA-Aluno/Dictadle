"""
Testes de integração para o endpoint POST /api/challenges/<id>/submit
(SCRUM-109 / SCRUM-185 / SCRUM-187 + SCRUM-93 / SCRUM-159 / SCRUM-161).
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
        title="The Office - Fire Drill",
        video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        youtube_video_id="dQw4w9WgXcQ",
        start_time_seconds=10,
        end_time_seconds=22,
        difficulty="medium",
        accent="American",
        transcript_official="Stay calm! Everyone, stay calm.",
        is_active=True,
    )
    db.session.add(challenge)
    db.session.commit()
    return challenge


@pytest.fixture
def partial_challenge(app):
    challenge = Challenge(
        id=22,
        title="Daily Practice",
        video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        youtube_video_id="dQw4w9WgXcQ",
        start_time_seconds=0,
        end_time_seconds=12,
        difficulty="easy",
        accent="American",
        transcript_official="I love learning english every day",
        is_active=True,
    )
    db.session.add(challenge)
    db.session.commit()
    return challenge


@pytest.fixture
def apostrophe_challenge(app):
    challenge = Challenge(
        id=23,
        title="Wonderful World",
        video_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        youtube_video_id="dQw4w9WgXcQ",
        start_time_seconds=0,
        end_time_seconds=12,
        difficulty="easy",
        accent="American",
        transcript_official="It's a wonderful world",
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
    def test_scenario_1_perfect_accuracy_ignoring_case_and_punctuation(
        self, client, student_headers, sample_user, active_challenge
    ):
        res = client.post(
            f"/api/challenges/{active_challenge.id}/submit",
            json={"submitted_transcript": "  stay calm everyone stay calm  "},
            headers=student_headers,
        )
        assert res.status_code == 200
        payload = res.get_json()
        assert payload["accuracy_percentage"] == 100.0
        assert payload["words_total"] == 5
        assert payload["words_correct"] == 5
        assert payload["edit_distance"] == 0
        assert all(t["status"] == "correct" for t in payload["diff"])
        assert payload["transcript_official"] == "Stay calm! Everyone, stay calm."
        assert payload["attempt"]["user_id"] == sample_user.id
        assert payload["attempt"]["challenge_id"] == active_challenge.id
        assert payload["attempt"]["submitted_transcript"] == "stay calm everyone stay calm"
        assert payload["attempt"]["accuracy_percentage"] == 100.0

        saved = UserAttempt.query.filter_by(
            user_id=sample_user.id, challenge_id=active_challenge.id
        ).first()
        assert saved is not None
        assert saved.accuracy_percentage == 100.0

    def test_scenario_2_partial_accuracy_with_incorrect_and_missing(
        self, client, student_headers, sample_user, partial_challenge
    ):
        res = client.post(
            f"/api/challenges/{partial_challenge.id}/submit",
            json={"submitted_transcript": "I like learning english day"},
            headers=student_headers,
        )
        assert res.status_code == 200
        payload = res.get_json()
        assert payload["accuracy_percentage"] == 66.67
        assert payload["words_total"] == 6
        assert payload["words_correct"] == 4
        assert payload["transcript_official"] == "I love learning english every day"

        incorrect = [t for t in payload["diff"] if t["status"] == "incorrect"]
        missing = [t for t in payload["diff"] if t["status"] == "missing"]
        assert incorrect == [{"word": "like", "expected": "love", "status": "incorrect"}]
        assert missing == [{"word": None, "expected": "every", "status": "missing"}]

    def test_scenario_3_curly_apostrophes_and_newlines_give_100_percent(
        self, client, student_headers, apostrophe_challenge
    ):
        res = client.post(
            f"/api/challenges/{apostrophe_challenge.id}/submit",
            json={"submitted_transcript": "  It’s   a \n wonderful   world!  "},
            headers=student_headers,
        )
        assert res.status_code == 200
        payload = res.get_json()
        assert payload["accuracy_percentage"] == 100.0
        assert payload["words_correct"] == 4
        assert payload["words_total"] == 4

    def test_submit_exact_500_chars_succeeds(self, client, student_headers, active_challenge):
        long_text = "x" * 500
        res = client.post(
            f"/api/challenges/{active_challenge.id}/submit",
            json={"submitted_transcript": long_text},
            headers=student_headers,
        )
        assert res.status_code == 200
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

    def test_scenario_4_empty_or_whitespace_returns_400(self, client, student_headers, active_challenge):
        for bad in ["", "     "]:
            res = client.post(
                f"/api/challenges/{active_challenge.id}/submit",
                json={"submitted_transcript": bad},
                headers=student_headers,
            )
            assert res.status_code == 400
            assert UserAttempt.query.count() == 0

    def test_scenario_5_nonexistent_or_inactive_challenge_returns_404(
        self, client, student_headers, inactive_challenge
    ):
        res_missing = client.post(
            "/api/challenges/9999/submit",
            json={"submitted_transcript": "Hello"},
            headers=student_headers,
        )
        assert res_missing.status_code == 404
        assert res_missing.get_json()["error"] == "Desafio não encontrado"

        res_inactive = client.post(
            f"/api/challenges/{inactive_challenge.id}/submit",
            json={"submitted_transcript": "Good morning"},
            headers=student_headers,
        )
        assert res_inactive.status_code == 404

    def test_scenario_6_without_auth_returns_401(self, client, active_challenge):
        res = client.post(
            f"/api/challenges/{active_challenge.id}/submit",
            json={"submitted_transcript": "Stay calm everyone stay calm"},
        )
        assert res.status_code == 401

    def test_scrum94_scenario_5_zero_cheat_transcript_only_exposed_after_submit(
        self, client, student_headers, partial_challenge
    ):
        # Antes da submissão: /active e /playback não expõem transcript_official
        res_active = client.get("/api/challenges/active", headers=student_headers)
        assert res_active.status_code == 200
        for item in res_active.get_json()["challenges"]:
            assert "transcript_official" not in item

        res_play = client.get(
            f"/api/challenges/{partial_challenge.id}/playback",
            headers=student_headers,
        )
        assert res_play.status_code == 200
        assert "transcript_official" not in res_play.get_json()

        # Após submissão: libera transcript_official e payload comparativo estruturado
        res_submit = client.post(
            f"/api/challenges/{partial_challenge.id}/submit",
            json={"submitted_transcript": "I like learning english day"},
            headers=student_headers,
        )
        assert res_submit.status_code == 200
        payload = res_submit.get_json()
        assert payload["transcript_official"] == "I love learning english every day"
        assert payload["is_perfect"] is False
        assert isinstance(payload["comparison"], list)
        assert isinstance(payload["student_tokens"], list)
        assert isinstance(payload["official_tokens"], list)
        assert any(
            t["word"] == "every" and t["status"] == "missing"
            for t in payload["official_tokens"]
        )
