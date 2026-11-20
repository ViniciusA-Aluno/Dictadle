"""
Motor de correção de transcrições via Distância de Levenshtein a nível de palavras
(SCRUM-93 / SCRUM-158).

Compara os tokens normalizados da tentativa do estudante contra os tokens do gabarito
oficial, encontrando o alinhamento ótimo de custo mínimo (programação dinâmica + backtracking)
para classificar cada palavra como:
- 'correct': palavra coincide exatamente após normalização
- 'incorrect': palavra substituída (com 'expected' indicando o termo esperado) ou excedente ('expected': None)
- 'missing': palavra do gabarito omitida pelo estudante ('word': None)

Calcula a acurácia determinística:
    accuracy_percentage = round((words_correct / words_total) * 100, 2)
"""
from typing import Dict, List, Tuple
from app.services.text_normalizer import tokenize


def levenshtein_word_diff(
    submitted_tokens: List[str],
    expected_tokens: List[str],
) -> Tuple[List[Dict], int]:
    """
    Executa Distância de Levenshtein a nível de palavras (O(N * M)) com backtracking
    para produzir o alinhamento mínimo ótimo entre expected_tokens e submitted_tokens.

    Retorna (diff_list, edit_distance).
    """
    n = len(expected_tokens)
    m = len(submitted_tokens)

    # Matriz de programação dinâmica: dp[i][j] = custo mínimo entre expected[:i] e submitted[:j]
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        dp[i][0] = i
    for j in range(m + 1):
        dp[0][j] = j

    for i in range(1, n + 1):
        exp_word = expected_tokens[i - 1]
        for j in range(1, m + 1):
            if exp_word == submitted_tokens[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(
                    dp[i - 1][j - 1],  # substituição
                    dp[i - 1][j],      # deleção (palavra omitida do gabarito)
                    dp[i][j - 1],      # inserção (palavra extra do aluno)
                )

    # Backtracking para reconstruir o alinhamento ótimo
    diff_reversed: List[Dict] = []
    i, j = n, m
    while i > 0 or j > 0:
        if (
            i > 0
            and j > 0
            and expected_tokens[i - 1] == submitted_tokens[j - 1]
            and dp[i][j] == dp[i - 1][j - 1]
        ):
            diff_reversed.append({
                "word": submitted_tokens[j - 1],
                "expected": expected_tokens[i - 1],
                "status": "correct",
            })
            i -= 1
            j -= 1
        elif i > 0 and j > 0 and dp[i][j] == dp[i - 1][j - 1] + 1:
            diff_reversed.append({
                "word": submitted_tokens[j - 1],
                "expected": expected_tokens[i - 1],
                "status": "incorrect",
            })
            i -= 1
            j -= 1
        elif i > 0 and dp[i][j] == dp[i - 1][j] + 1:
            diff_reversed.append({
                "word": None,
                "expected": expected_tokens[i - 1],
                "status": "missing",
            })
            i -= 1
        else:
            diff_reversed.append({
                "word": submitted_tokens[j - 1],
                "expected": None,
                "status": "incorrect",
            })
            j -= 1

    diff_reversed.reverse()
    return diff_reversed, dp[n][m]


def evaluate_transcription(submitted_text: str, official_transcript: str) -> Dict:
    """
    Normaliza, tokeniza e avalia a transcrição submetida contra o gabarito oficial.

    Retorna dicionário contendo:
    - accuracy_percentage (float arredondado em 2 casas decimais)
    - words_total (int)
    - words_correct (int)
    - edit_distance (int — distância de Levenshtein em palavras)
    - diff (list[dict])
    """
    expected_tokens = tokenize(official_transcript)
    submitted_tokens = tokenize(submitted_text)

    diff, edit_distance = levenshtein_word_diff(submitted_tokens, expected_tokens)

    words_total = len(expected_tokens)
    words_correct = sum(1 for item in diff if item["status"] == "correct")
    accuracy_percentage = (
        round((words_correct / words_total) * 100, 2) if words_total > 0 else 0.0
    )

    return {
        "accuracy_percentage": accuracy_percentage,
        "words_total": words_total,
        "words_correct": words_correct,
        "edit_distance": edit_distance,
        "diff": diff,
    }
