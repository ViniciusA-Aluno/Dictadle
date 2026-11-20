"""
Serviço de normalização textual e tokenização para avaliação de transcrições (SCRUM-93 / SCRUM-157).

Regras pedagógicas:
- Case-insensitivity: converte todo o texto para minúsculas.
- Uniformização de apóstrofos tipográficos curvos (’ ‘ ` ´ -> ').
- Remoção de sinais de pontuação cosméticos (.,!?;:-_"/()[]{} etc.), preservando
  apóstrofos internos em contrações da língua inglesa (ex.: "it's", "don't").
- Colapso de espaços múltiplos, tabulações e quebras de linha em separadores únicos.
"""
import re
from typing import List

# Mapeamento de apóstrofos tipográficos para apóstrofo ASCII padrão
_APOSTROPHE_TRANSLATION = str.maketrans({
    "\u2019": "'",  # ’
    "\u2018": "'",  # ‘
    "\u02bc": "'",  # ʼ
    "`": "'",
    "\u00b4": "'",  # ´
})

# Qualquer caractere que não seja letra/dígito Unicode, espaço ou apóstrofo é tratado como pontuação cosmética
_NON_WORD_PATTERN = re.compile(r"[^\w\s']+", flags=re.UNICODE)
# Underscores também são tratados como pontuação cosmética
_UNDERSCORE_PATTERN = re.compile(r"_+")
# Colapso de qualquer sequência de whitespace
_WHITESPACE_PATTERN = re.compile(r"\s+")


def normalize_text(text: str) -> str:
    """
    Normaliza uma string de transcrição para comparação justa:
    - Retorna string vazia se entrada for None ou não-string.
    - Uniformiza apóstrofos, converte para minúsculas, remove pontuação cosmética
      e colapsa espaços redundantes.
    """
    if not text or not isinstance(text, str):
        return ""

    cleaned = text.translate(_APOSTROPHE_TRANSLATION).lower()
    cleaned = _NON_WORD_PATTERN.sub(" ", cleaned)
    cleaned = _UNDERSCORE_PATTERN.sub(" ", cleaned)

    tokens = []
    for raw_token in _WHITESPACE_PATTERN.split(cleaned.strip()):
        # Remove apóstrofos isolados ou nas extremidades (ex.: "'hello'" -> "hello", "'" -> "")
        token = raw_token.strip("'")
        if token:
            tokens.append(token)

    return " ".join(tokens)


def tokenize(text: str) -> List[str]:
    """
    Normaliza e retorna a lista ordenada de tokens (palavras) da transcrição.
    Retorna lista vazia caso o texto contenha apenas espaços ou pontuação.
    """
    normalized = normalize_text(text)
    if not normalized:
        return []
    return normalized.split(" ")
