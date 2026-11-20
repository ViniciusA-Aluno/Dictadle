"""
Testes unitários parametrizados para o serviço text_normalizer (SCRUM-93 / SCRUM-157 / SCRUM-161).
"""
import pytest
from app.services.text_normalizer import normalize_text, tokenize


class TestTextNormalizer:
    @pytest.mark.parametrize(
        "raw,expected",
        [
            ("Hello World", "hello world"),
            ("THE QUICK BROWN FOX", "the quick brown fox"),
            ("Stay calm! Everyone, stay calm.", "stay calm everyone stay calm"),
            ("  It’s   a \n wonderful   world!  ", "it's a wonderful world"),
            ("see    you \n\n\t  tomorrow", "see you tomorrow"),
            ("Wait! Are you sure, sir?", "wait are you sure sir"),
            ("don‘t stop — never_give/up: now;", "don't stop never give up now"),
            ("'quoted' word", "quoted word"),
            ("!?,... ---", ""),
            ("   ", ""),
            ("", ""),
            (None, ""),
        ],
    )
    def test_normalize_text_cases(self, raw, expected):
        assert normalize_text(raw) == expected

    def test_tokenize_splits_clean_words(self):
        assert tokenize("  It’s   a \n wonderful   world!  ") == [
            "it's",
            "a",
            "wonderful",
            "world",
        ]

    def test_tokenize_punctuation_only_returns_empty_list(self):
        assert tokenize("!?,... --- '''") == []
