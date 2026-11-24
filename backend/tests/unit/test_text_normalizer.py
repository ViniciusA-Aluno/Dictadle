"""
Bateria de testes unitários parametrizados para o utilitário TextNormalizer
(SCRUM-110 / SCRUM-184 + SCRUM-93 / SCRUM-157 / SCRUM-161).

Cobre integralmente os critérios de aceite BDD da US-110:
- Cenário 1: Insensibilidade a caixa (case-insensitivity)
- Cenário 2: Supressão de pontuações variadas (.,!?;:-_"/ etc.)
- Cenário 3: Colapso de múltiplos espaços, quebras de linha e tabulações
- Cenário 4: Entradas contendo apenas pontuação, símbolos, espaços ou tipos inválidos
- Cenário 5: Uniformização de aspas e apóstrofos tipográficos curvos (’ ‘ ʼ ` ´)
- Normalização Unicode NFKD (remoção de diacríticos em empréstimos linguísticos)
"""
import pytest
from app.services.text_normalizer import TextNormalizer, normalize_text, tokenize
from app.services.correction_service import evaluate_transcription


class TestTextNormalizer:
    """Suíte parametrizada de testes unitários para TextNormalizer."""

    @pytest.mark.parametrize(
        "raw,expected",
        [
            # Cenário 1: Case-insensitivity
            ("Hello World", "hello world"),
            ("hello world", "hello world"),
            ("HELLO WORLD", "hello world"),
            ("THE QUICK BROWN FOX", "the quick brown fox"),
            ("The Quick Brown Fox", "the quick brown fox"),
            # Cenário 2: Supressão de pontuação cosmética variada
            ("Stay calm! Everyone, stay calm.", "stay calm everyone stay calm"),
            ("Wait! Are you sure, sir?", "wait are you sure sir"),
            ("Yes, I DO!", "yes i do"),
            ("word1. word2, word3! word4? word5; word6: word7", "word1 word2 word3 word4 word5 word6 word7"),
            ("hyphen-separated and_underscored/slashed", "hyphen separated and underscored slashed"),
            ("(parentheses) [brackets] {braces} \"double quotes\"", "parentheses brackets braces double quotes"),
            # Cenário 3: Colapso de múltiplos espaços, tabulações e quebras de linha
            ("see    you \n\n  tomorrow", "see you tomorrow"),
            ("see    you \n\n\t  tomorrow", "see you tomorrow"),
            ("   leading and   trailing   \r\n\t  spaces   ", "leading and trailing spaces"),
            # Cenário 4: Apenas pontuação, símbolos, espaços ou entradas nulas/inválidas
            ("!?,... ---", ""),
            ("... ??? !!! ;;; ::: --- ___ ///", ""),
            ("''' \"\"\" ‘‘‘ ’’’", ""),
            ("   ", ""),
            ("\n\t\r", ""),
            ("", ""),
            (None, ""),
            (12345, ""),
            (["not", "a", "string"], ""),
            # Cenário 5: Aspas e apóstrofos tipográficos curvos e contrações da língua inglesa
            ("  It’s   a \n wonderful   world!  ", "it's a wonderful world"),
            ("it's", "it's"),
            ("it’s", "it's"),
            ("it‘s", "it's"),
            ("itʼs", "it's"),
            ("it`s", "it's"),
            ("it´s", "it's"),
            ("don‘t stop — never_give/up: now;", "don't stop never give up now"),
            ("I'm sure they're going to rock 'n' roll at 5 o'clock!", "i'm sure they're going to rock n roll at 5 o'clock"),
            ("'quoted' word", "quoted word"),
            ("“Smart” «quotes» ‘around’ words", "smart quotes around words"),
            # Normalização Unicode (NFKD) - diacríticos e empréstimos linguísticos
            ("Let's meet at the café!", "let's meet at the cafe"),
            ("A naïve façade in the résumé", "a naive facade in the resume"),
            ("Jalapeño and fiancé", "jalapeno and fiance"),
        ],
    )
    def test_normalize_text_cases(self, raw, expected):
        assert TextNormalizer.normalize(raw) == expected
        assert normalize_text(raw) == expected

    @pytest.mark.parametrize(
        "raw,expected_stripped",
        [
            ("café", "cafe"),
            ("CAFÉ", "CAFE"),
            ("façade", "facade"),
            ("naïve", "naive"),
            ("résumé", "resume"),
            ("jalapeño", "jalapeno"),
            ("plain ascii", "plain ascii"),
            ("", ""),
            (None, ""),
            (999, ""),
        ],
    )
    def test_strip_accents_nfkd(self, raw, expected_stripped):
        assert TextNormalizer.strip_accents(raw) == expected_stripped

    @pytest.mark.parametrize(
        "raw,expected_tokens",
        [
            (
                "see    you \n\n  tomorrow",
                ["see", "you", "tomorrow"],
            ),
            (
                "  It’s   a \n wonderful   world!  ",
                ["it's", "a", "wonderful", "world"],
            ),
            (
                "Wait! Are you sure, sir?",
                ["wait", "are", "you", "sure", "sir"],
            ),
            (
                "THE QUICK BROWN FOX",
                ["the", "quick", "brown", "fox"],
            ),
            (
                "!?,... --- '''",
                [],
            ),
            (
                "   \n\t  ",
                [],
            ),
            (
                None,
                [],
            ),
        ],
    )
    def test_tokenize_parameterized(self, raw, expected_tokens):
        assert TextNormalizer.tokenize(raw) == expected_tokens
        assert tokenize(raw) == expected_tokens

    @pytest.mark.parametrize(
        "official,submitted",
        [
            # Cenário 1: Maiúsculas vs minúsculas
            ("the quick brown fox", "THE QUICK BROWN FOX"),
            # Cenário 2: Com pontuação vs sem pontuação
            ("Wait! Are you sure, sir?", "Wait are you sure sir"),
            # Cenário 3: Espaços múltiplos e quebras de linha
            ("see you tomorrow", "see    you \n\n  tomorrow"),
            # Cenário 5: Apóstrofo ASCII vs apóstrofo curvo mobile
            ("It's a wonderful world.", "it’s a wonderful world"),
            # Normalização Unicode NFKD
            ("Meet me at the café", "meet me at the cafe!"),
        ],
    )
    def test_convergence_to_100_percent_accuracy(self, official, submitted):
        """Garante que variações puramente cosméticas convergem para 100% de acurácia."""
        result = evaluate_transcription(submitted, official)
        assert result["accuracy_percentage"] == 100.0
        assert result["edit_distance"] == 0
        assert result["words_correct"] == result["words_total"]
        assert result["normalized_submitted"] == result["normalized_expected"]

    def test_scenario_4_punctuation_only_yields_zero_accuracy_without_exception(self):
        """Cenário 4: Submissão composta unicamente por pontuação/símbolos retorna 0% sem crash."""
        result = evaluate_transcription("!?,... ---", "the quick brown fox")
        assert result["submitted_tokens"] == []
        assert result["normalized_submitted"] == ""
        assert result["accuracy_percentage"] == 0.0
        assert result["words_correct"] == 0
        assert result["words_total"] == 4
