"""
Testes unitários para WordDiffService (SCRUM-94 / SCRUM-188 / SCRUM-190).
Valida os Cenários 1, 2, 3 e 4 da US-94: palavras corretas, incorretas, omitidas e excedentes.
"""
from app.services.word_diff import WordDiffService


class TestWordDiffService:
    def test_scenario_1_comparative_correct_and_incorrect_tokens(self):
        result = WordDiffService.build_feedback(
            submitted_text="I like learning spanish",
            official_transcript="I love learning english",
        )
        assert result["is_perfect"] is False
        assert result["words_total"] == 4
        assert result["words_correct"] == 2
        assert result["accuracy_percentage"] == 50.0

        assert result["student_tokens"] == [
            {"word": "i", "expected": "i", "status": "correct", "is_extra": False},
            {"word": "like", "expected": "love", "status": "incorrect", "is_extra": False},
            {"word": "learning", "expected": "learning", "status": "correct", "is_extra": False},
            {"word": "spanish", "expected": "english", "status": "incorrect", "is_extra": False},
        ]

    def test_scenario_2_perfect_submission_sets_is_perfect_true(self):
        result = WordDiffService.build_feedback(
            submitted_text="never give up on dreams",
            official_transcript="never give up on dreams",
        )
        assert result["is_perfect"] is True
        assert result["accuracy_percentage"] == 100.0
        assert all(t["status"] == "correct" for t in result["student_tokens"])
        assert all(t["status"] == "correct" for t in result["official_tokens"])

    def test_scenario_3_omitted_word_highlighted_in_official_tokens(self):
        result = WordDiffService.build_feedback(
            submitted_text="she sells shells",
            official_transcript="she sells sea shells",
        )
        assert result["is_perfect"] is False
        assert result["words_total"] == 4
        assert result["words_correct"] == 3
        assert result["accuracy_percentage"] == 75.0

        missing_in_official = [t for t in result["official_tokens"] if t["status"] == "missing"]
        assert missing_in_official == [{"word": "sea", "submitted": None, "status": "missing"}]
        assert len(result["student_tokens"]) == 3

    def test_scenario_4_extra_words_marked_as_incorrect_and_is_extra(self):
        result = WordDiffService.build_feedback(
            submitted_text="open the big blue door",
            official_transcript="open the door",
        )
        assert result["is_perfect"] is False
        extras = [t for t in result["student_tokens"] if t["is_extra"] is True]
        assert [e["word"] for e in extras] == ["big", "blue"]
        assert all(e["status"] == "incorrect" for e in extras)
