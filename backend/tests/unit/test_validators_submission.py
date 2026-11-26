"""
Testes unitários para validação de submissão de transcrição e modelo UserAttempt (SCRUM-109 / SCRUM-187).
"""
from datetime import datetime, timezone
from app.models.user_attempt import UserAttempt
from app.services.validators import validate_submission_payload


class TestValidateSubmissionPayload:
    def test_valid_submission_applies_strip(self):
        is_valid, err, clean, status = validate_submission_payload(
            {"submitted_transcript": "  I have a dream today  "}
        )
        assert is_valid is True
        assert err is None
        assert clean == "I have a dream today"
        assert status == 200

    def test_valid_submission_accepts_transcript_fallback_key(self):
        is_valid, err, clean, status = validate_submission_payload(
            {"transcript": "Hello world"}
        )
        assert is_valid is True
        assert err is None
        assert clean == "Hello world"
        assert status == 200

    def test_exact_500_characters_is_accepted(self):
        text_500 = "a" * 500
        is_valid, err, clean, status = validate_submission_payload(
            {"submitted_transcript": text_500}
        )
        assert is_valid is True
        assert err is None
        assert len(clean) == 500
        assert status == 200

    def test_501_characters_is_rejected_with_422(self):
        text_501 = "a" * 501
        is_valid, err, clean, status = validate_submission_payload(
            {"submitted_transcript": text_501}
        )
        assert is_valid is False
        assert "500" in err
        assert clean is None
        assert status == 422

    def test_empty_or_whitespace_only_is_rejected_with_400(self):
        for bad in ["", "     ", "\n\t  "]:
            is_valid, err, clean, status = validate_submission_payload(
                {"submitted_transcript": bad}
            )
            assert is_valid is False
            assert clean is None
            assert status == 400

    def test_missing_or_non_string_or_non_dict_is_rejected_with_400(self):
        for payload in [None, "raw string", {}, {"submitted_transcript": None}, {"submitted_transcript": 12345}]:
            is_valid, err, clean, status = validate_submission_payload(payload)
            assert is_valid is False
            assert clean is None
            assert status == 400


class TestUserAttemptModel:
    def test_user_attempt_to_dict_serialization(self):
        now = datetime(2026, 11, 19, 20, 0, 0, tzinfo=timezone.utc)
        attempt = UserAttempt(
            id=7,
            user_id=2,
            challenge_id=20,
            submitted_transcript="Stay calm everyone",
            accuracy_percentage=None,
            created_at=now,
        )
        data = attempt.to_dict()
        assert data["id"] == 7
        assert data["user_id"] == 2
        assert data["challenge_id"] == 20
        assert data["submitted_transcript"] == "Stay calm everyone"
        assert data["accuracy_percentage"] is None
        assert data["created_at"] == now.isoformat()
