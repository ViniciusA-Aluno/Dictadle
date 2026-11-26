"""
Motor de correção de transcrições otimizado para baixa latência (< 50ms)
via Distância de Levenshtein a nível de palavras (SCRUM-93 / SCRUM-158 / SCRUM-196).

Otimizações de desempenho implementadas (SCRUM-196):
1. Normalização e tokenização em passada única O(N) com cache LRU (TextNormalizer.normalize_and_tokenize).
2. Fast-paths lineares O(N) para correspondência exata e entradas vazias (evitando alocação de matriz).
3. Poda de prefixo e sufixo comum (Prefix/Suffix Trimming) em O(N), restringindo a matriz
   de programação dinâmica estritamente ao núcleo divergente de palavras.
4. Telemetria de tempo de execução em milissegundos (execution_time_ms < 50ms).
"""
import time
from typing import Dict, List, Tuple
from app.services.text_normalizer import TextNormalizer


def levenshtein_word_diff(
    submitted_tokens: List[str],
    expected_tokens: List[str],
) -> Tuple[List[Dict], int]:
    """
    Executa alinhamento ótimo de Distância de Levenshtein a nível de palavras com
    fast-paths lineares e poda de prefixo/sufixo comum (SCRUM-196).

    Retorna (diff_list, edit_distance).
    """
    n = len(expected_tokens)
    m = len(submitted_tokens)

    # Fast-path 1: Ambos vazios
    if n == 0 and m == 0:
        return [], 0

    # Fast-path 2: Gabarito vazio
    if n == 0:
        return [
            {"word": w, "expected": None, "status": "incorrect"}
            for w in submitted_tokens
        ], m

    # Fast-path 3: Submissão vazia (todas omitidas)
    if m == 0:
        return [
            {"word": None, "expected": w, "status": "missing"}
            for w in expected_tokens
        ], n

    # Fast-path 4: Correspondência 100% exata em O(N) sem alocar matriz DP
    if submitted_tokens == expected_tokens:
        return [
            {"word": w, "expected": w, "status": "correct"}
            for w in expected_tokens
        ], 0

    # Fast-path 5: Poda de prefixo e sufixo idênticos (reduz drasticamente o núcleo N x M)
    prefix_len = 0
    min_len = n if n < m else m
    while (
        prefix_len < min_len
        and expected_tokens[prefix_len] == submitted_tokens[prefix_len]
    ):
        prefix_len += 1

    suffix_len = 0
    max_suffix = min_len - prefix_len
    while (
        suffix_len < max_suffix
        and expected_tokens[n - 1 - suffix_len] == submitted_tokens[m - 1 - suffix_len]
    ):
        suffix_len += 1

    prefix_diff = [
        {"word": expected_tokens[k], "expected": expected_tokens[k], "status": "correct"}
        for k in range(prefix_len)
    ]
    suffix_diff = [
        {
            "word": expected_tokens[n - suffix_len + k],
            "expected": expected_tokens[n - suffix_len + k],
            "status": "correct",
        }
        for k in range(suffix_len)
    ]

    exp_core = expected_tokens[prefix_len : n - suffix_len]
    sub_core = submitted_tokens[prefix_len : m - suffix_len]
    cn = len(exp_core)
    cm = len(sub_core)

    # Se um dos núcleos ficou vazio após a poda, o restante são apenas inserções ou omissões
    if cn == 0:
        mid_diff = [
            {"word": w, "expected": None, "status": "incorrect"}
            for w in sub_core
        ]
        return prefix_diff + mid_diff + suffix_diff, cm

    if cm == 0:
        mid_diff = [
            {"word": None, "expected": w, "status": "missing"}
            for w in exp_core
        ]
        return prefix_diff + mid_diff + suffix_diff, cn

    # Matriz de programação dinâmica restrita apenas ao núcleo divergente (cn x cm)
    dp = [[0] * (cm + 1) for _ in range(cn + 1)]
    for i in range(cn + 1):
        dp[i][0] = i
    first_row = dp[0]
    for j in range(cm + 1):
        first_row[j] = j

    for i in range(1, cn + 1):
        exp_word = exp_core[i - 1]
        curr_row = dp[i]
        prev_row = dp[i - 1]
        for j in range(1, cm + 1):
            if exp_word == sub_core[j - 1]:
                curr_row[j] = prev_row[j - 1]
            else:
                sub_cost = prev_row[j - 1]
                del_cost = prev_row[j]
                ins_cost = curr_row[j - 1]
                best = sub_cost if sub_cost <= del_cost else del_cost
                if ins_cost < best:
                    best = ins_cost
                curr_row[j] = 1 + best

    # Backtracking no núcleo divergente
    diff_reversed: List[Dict] = []
    i, j = cn, cm
    while i > 0 or j > 0:
        if (
            i > 0
            and j > 0
            and exp_core[i - 1] == sub_core[j - 1]
            and dp[i][j] == dp[i - 1][j - 1]
        ):
            diff_reversed.append({
                "word": sub_core[j - 1],
                "expected": exp_core[i - 1],
                "status": "correct",
            })
            i -= 1
            j -= 1
        elif i > 0 and j > 0 and dp[i][j] == dp[i - 1][j - 1] + 1:
            diff_reversed.append({
                "word": sub_core[j - 1],
                "expected": exp_core[i - 1],
                "status": "incorrect",
            })
            i -= 1
            j -= 1
        elif i > 0 and dp[i][j] == dp[i - 1][j] + 1:
            diff_reversed.append({
                "word": None,
                "expected": exp_core[i - 1],
                "status": "missing",
            })
            i -= 1
        else:
            diff_reversed.append({
                "word": sub_core[j - 1],
                "expected": None,
                "status": "incorrect",
            })
            j -= 1

    diff_reversed.reverse()
    return prefix_diff + diff_reversed + suffix_diff, dp[cn][cm]


def evaluate_transcription(submitted_text: str, official_transcript: str) -> Dict:
    """
    Normaliza, tokeniza em passada única e avalia a transcrição submetida contra o
    gabarito oficial com garantia de latência < 50ms (SCRUM-110 / SCRUM-196).
    """
    start_ns = time.perf_counter_ns()

    normalized_expected, expected_tokens = TextNormalizer.normalize_and_tokenize(
        official_transcript
    )
    normalized_submitted, submitted_tokens = TextNormalizer.normalize_and_tokenize(
        submitted_text
    )

    diff, edit_distance = levenshtein_word_diff(submitted_tokens, expected_tokens)

    words_total = len(expected_tokens)
    words_correct = sum(1 for item in diff if item["status"] == "correct")
    accuracy_percentage = (
        round((words_correct / words_total) * 100, 2) if words_total > 0 else 0.0
    )

    execution_time_ms = round((time.perf_counter_ns() - start_ns) / 1_000_000.0, 4)

    return {
        "accuracy_percentage": accuracy_percentage,
        "words_total": words_total,
        "words_correct": words_correct,
        "edit_distance": edit_distance,
        "execution_time_ms": execution_time_ms,
        "normalized_submitted": normalized_submitted,
        "normalized_expected": normalized_expected,
        "submitted_tokens": submitted_tokens,
        "expected_tokens": expected_tokens,
        "diff": diff,
    }
