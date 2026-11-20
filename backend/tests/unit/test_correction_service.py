"""
Testes unitários parametrizados para o motor de correção com Distância de Levenshtein
a nível de palavras (SCRUM-93 / SCRUM-158 / SCRUM-161).
"""
import pytest
from app.services.correction_service import evaluate_transcription, levenshtein_word_diff


class TestCorrectionService:
    def test_scenario_1_perfect_match_ignoring_case_and_punctuation(self):
        result = evaluate_transcription(
            submitted_text="stay calm everyone stay calm",
            official_transcript="Stay calm! Everyone, stay calm.",
        )
        assert result["accuracy_percentage"] == 100.0
        assert result["words_total"] == 5
        assert result["words_correct"] == 5
        assert result["edit_distance"] == 0
        assert all(tok["status"] == "correct" for tok in result["diff"])

    def test_scenario_2_partial_match_with_incorrect_and_missing(self):
        result = evaluate_transcription(
            submitted_text="I like learning english day",
            official_transcript="I love learning english every day",
        )
        assert result["words_total"] == 6
        assert result["words_correct"] == 4
        assert result["accuracy_percentage"] == 66.67
        assert result["edit_distance"] == 2

        statuses = [(t["word"], t["expected"], t["status"]) for t in result["diff"]]
        assert ("i", "i", "correct") in statuses
        assert ("like", "love", "incorrect") in statuses
        assert ("learning", "learning", "correct") in statuses
        assert ("english", "english", "correct") in statuses
        assert (None, "every", "missing") in statuses
        assert ("day", "day", "correct") in statuses

    def test_scenario_3_curly_apostrophes_and_newlines(self):
        result = evaluate_transcription(
            submitted_text="  It’s   a \n wonderful   world!  ",
            official_transcript="It's a wonderful world",
        )
        assert result["accuracy_percentage"] == 100.0
        assert result["words_correct"] == 4
        assert result["words_total"] == 4
        assert result["edit_distance"] == 0

    def test_extra_inserted_words_marked_as_incorrect(self):
        result = evaluate_transcription(
            submitted_text="open the big blue door",
            official_transcript="open the door",
        )
        assert result["words_total"] == 3
        assert result["words_correct"] == 3
        assert result["edit_distance"] == 2
        extras = [t for t in result["diff"] if t["status"] == "incorrect" and t["expected"] is None]
        assert [e["word"] for e in extras] == ["big", "blue"]

    def test_punctuation_only_submission_returns_zero_without_error(self):
        result = evaluate_transcription(
            submitted_text="!?,... ---",
            official_transcript="never give up",
        )
        assert result["accuracy_percentage"] == 0.0
        assert result["words_correct"] == 0
        assert result["words_total"] == 3
        assert result["edit_distance"] == 3
        assert all(t["status"] == "missing" for t in result["diff"])

    def test_empty_official_transcript_returns_zero_safely(self):
        diff, dist = levenshtein_word_diff([], [])
        assert diff == []
        assert dist == 0
        result = evaluate_transcription("hello", "")
        assert result["accuracy_percentage"] == 0.0
        assert result["words_total"] == 0
