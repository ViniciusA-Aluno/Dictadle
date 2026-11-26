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

    def test_scrum196_prefix_and_suffix_trimming_pure_omission_and_mathematical_fidelity(self):
        """
        SCRUM-196 Cenário 2: Garante fidelidade matemática idêntica quando a diferença ocorre
        apenas no meio de um prefixo e sufixo idênticos (omissão pura, inserção pura e substituição).
        """
        # Omissão pura no meio ("very" omitido)
        res_omission = evaluate_transcription(
            submitted_text="this is a important test today",
            official_transcript="this is a very important test today",
        )
        assert res_omission["words_total"] == 7
        assert res_omission["words_correct"] == 6
        assert res_omission["edit_distance"] == 1
        assert res_omission["accuracy_percentage"] == 85.71
        assert {"word": None, "expected": "very", "status": "missing"} in res_omission["diff"]

    @pytest.mark.parametrize(
        "word_count",
        [5, 20, 60],
    )
    def test_scrum196_benchmark_short_medium_long_sentences_under_50ms(self, word_count):
        """
        SCRUM-196 Cenários 1 e 3: Valida que sentenças curtas (5 palavras), médias (20 palavras)
        e longas (60 palavras / ~480 caracteres) são processadas em menos de 50ms.
        """
        official_words = [f"word{i}" for i in range(1, word_count + 1)]
        submitted_words = list(official_words)
        # Introduz variações no início, meio e fim para exercitar a matriz de alinhamento completa
        submitted_words[0] = "wrongstart"
        if word_count >= 10:
            submitted_words[word_count // 2] = "wrongmiddle"
        submitted_words[-1] = "wrongend"

        official_text = " ".join(official_words)
        submitted_text = " ".join(submitted_words)

        result = evaluate_transcription(submitted_text, official_text)
        assert result["execution_time_ms"] < 50.0
        assert result["words_total"] == word_count
        expected_correct = word_count - (3 if word_count >= 10 else 2)
        assert result["words_correct"] == expected_correct

    def test_scrum196_max_500_chars_worst_case_completely_different_under_50ms(self):
        """
        SCRUM-196 Cenário 3: Mesmo no pior caso quadrático (500 caracteres sem nenhum prefixo
        ou sufixo comum), o tempo de execução do algoritmo deve permanecer < 50ms.
        """
        official_500 = ("alpha bravo charlie delta echo foxtrot golf hotel india juliet " * 10)[:500]
        submitted_500 = ("kilo lima mike november oscar papa quebec romeo sierra tango " * 10)[:500]

        result = evaluate_transcription(submitted_500, official_500)
        assert result["execution_time_ms"] < 50.0
        assert result["accuracy_percentage"] == 0.0
