"""
Serviço de alinhamento visual comparativo de palavras (SCRUM-94 / SCRUM-188).

Constrói o payload estruturado para o painel comparativo de correção (CorrectionFeedbackPanel),
separando os tokens digitados pelo estudante ('student_tokens') e os tokens do gabarito
oficial ('official_tokens' com realce de termos omitidos), além do indicador 'is_perfect'.
"""
from typing import Dict, List
from app.services.correction_service import evaluate_transcription


class WordDiffService:
    @staticmethod
    def build_feedback(submitted_text: str, official_transcript: str) -> Dict:
        """
        Avalia a transcrição usando o motor Levenshtein por palavras e estrutura
        o diagnóstico visual completo para exibição lado a lado no frontend.
        """
        evaluation = evaluate_transcription(submitted_text, official_transcript)
        raw_diff: List[Dict] = evaluation["diff"]

        comparison: List[Dict] = []
        student_tokens: List[Dict] = []
        official_tokens: List[Dict] = []

        for item in raw_diff:
            status = item["status"]
            word = item.get("word")
            expected = item.get("expected")
            is_extra = status == "incorrect" and expected is None

            entry = {
                "word": word,
                "expected": expected,
                "status": status,
                "is_extra": is_extra,
            }
            comparison.append(entry)

            # Coluna "Sua Transcrição": apenas termos digitados pelo estudante
            if word is not None:
                student_tokens.append({
                    "word": word,
                    "expected": expected,
                    "status": status,
                    "is_extra": is_extra,
                })

            # Coluna "Gabarito Oficial": todos os termos do gabarito com destaque de omissões
            if expected is not None:
                official_tokens.append({
                    "word": expected,
                    "submitted": word,
                    "status": status,
                })

        is_perfect = (
            evaluation["words_total"] > 0
            and evaluation["accuracy_percentage"] == 100.0
            and evaluation["edit_distance"] == 0
        )

        return {
            "accuracy_percentage": evaluation["accuracy_percentage"],
            "words_total": evaluation["words_total"],
            "words_correct": evaluation["words_correct"],
            "edit_distance": evaluation["edit_distance"],
            "is_perfect": is_perfect,
            "normalized_submitted": evaluation["normalized_submitted"],
            "normalized_expected": evaluation["normalized_expected"],
            "submitted_tokens": evaluation["submitted_tokens"],
            "expected_tokens": evaluation["expected_tokens"],
            "diff": raw_diff,
            "comparison": comparison,
            "student_tokens": student_tokens,
            "official_tokens": official_tokens,
        }
