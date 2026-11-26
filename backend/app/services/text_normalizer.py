"""
Módulo utilitário TextNormalizer para avaliação justa e padronizada de transcrições
(SCRUM-110 / SCRUM-182).

Regras pedagógicas:
- Case-insensitivity: converte todo o texto para minúsculas.
- Normalização Unicode (NFKD): sanitiza caracteres com diacríticos e acentuações
  (ex.: 'café' -> 'cafe', 'façade' -> 'facade', 'naïve' -> 'naive').
- Uniformização de apóstrofos e aspas tipográficas curvos (’ ‘ ʼ ` ´ -> ').
- Remoção de sinais de pontuação cosméticos (.,!?;:-_"/()[]{} etc.), preservando
  apóstrofos internos em contrações da língua inglesa (ex.: "it's", "don't", "o'clock").
- Colapso de múltiplos espaços, tabulações e quebras de linha em separadores únicos.
- Retorno resiliente de string vazia / lista vazia para entradas nulas ou contendo
  apenas símbolos e pontuação.
"""
import re
import unicodedata
from functools import lru_cache
from typing import List, Tuple

# Mapeamento de variações de apóstrofos e aspas para apóstrofo ASCII neutro
_APOSTROPHE_TRANSLATION = str.maketrans({
    "\u2019": "'",  # ’ (right single quotation mark)
    "\u2018": "'",  # ‘ (left single quotation mark)
    "\u02bc": "'",  # ʼ (modifier letter apostrophe)
    "`": "'",       # backtick
    "\u00b4": "'",  # ´ (acute accent)
    "\u201c": '"',  # “
    "\u201d": '"',  # ”
    "\u00ab": '"',  # «
    "\u00bb": '"',  # »
})

# Qualquer caractere que não seja letra/dígito Unicode, espaço ou apóstrofo é tratado como pontuação
_NON_WORD_PATTERN = re.compile(r"[^\w\s']+", flags=re.UNICODE)
# Underscores também são tratados como pontuação cosmética
_UNDERSCORE_PATTERN = re.compile(r"_+")
# Colapso de qualquer sequência de whitespace (\s cobrindo espaços, \t, \n, \r)
_WHITESPACE_PATTERN = re.compile(r"\s+")


class TextNormalizer:
    """
    Utilitário estático para normalização textual e tokenização em conformidade
    com as diretrizes pedagógicas da plataforma Dictadle.
    """

    @staticmethod
    def strip_accents(text: str) -> str:
        """
        Remove diacríticos e acentuações mantendo os caracteres base (NFKD).
        Inclui fast-path O(1) para strings puramente ASCII (SCRUM-196).
        Exemplo: 'café' -> 'cafe', 'façade' -> 'facade', 'naïve' -> 'naive'.
        """
        if not text or not isinstance(text, str):
            return ""
        if text.isascii():
            return text
        decomposed = unicodedata.normalize("NFKD", text)
        return "".join(c for c in decomposed if not unicodedata.combining(c))

    @classmethod
    @lru_cache(maxsize=512)
    def _cached_normalize_and_tokenize(cls, text: str) -> Tuple[str, Tuple[str, ...]]:
        """
        Executa a sanitização e tokenização em passada única com cache LRU (SCRUM-196),
        evitando reprocessamento redundante de gabaritos oficiais e strings repetidas.
        """
        translated = text.translate(_APOSTROPHE_TRANSLATION)
        without_accents = translated if translated.isascii() else cls.strip_accents(translated)
        lower_text = without_accents.lower()

        cleaned = _NON_WORD_PATTERN.sub(" ", lower_text)
        cleaned = _UNDERSCORE_PATTERN.sub(" ", cleaned).strip()
        if not cleaned:
            return "", ()

        tokens = []
        for raw_token in _WHITESPACE_PATTERN.split(cleaned):
            token = raw_token.strip("'")
            if token:
                tokens.append(token)

        if not tokens:
            return "", ()
        return " ".join(tokens), tuple(tokens)

    @classmethod
    def normalize_and_tokenize(cls, text: str) -> Tuple[str, List[str]]:
        """
        Normaliza e tokeniza em passada única O(N), retornando (normalized_str, tokens_list).
        """
        if not text or not isinstance(text, str):
            return "", []
        norm_str, tok_tuple = cls._cached_normalize_and_tokenize(text)
        return norm_str, list(tok_tuple)

    @classmethod
    def normalize(cls, text: str) -> str:
        """
        Normaliza uma string de transcrição para comparação justa:
        - Retorna string vazia se entrada for None ou não-string.
        - Uniformiza apóstrofos, remove acentos (NFKD), converte para minúsculas,
          remove pontuações cosméticas e colapsa espaços redundantes.
        """
        if not text or not isinstance(text, str):
            return ""
        norm_str, _ = cls._cached_normalize_and_tokenize(text)
        return norm_str

    @classmethod
    def tokenize(cls, text: str) -> List[str]:
        """
        Normaliza e retorna a lista ordenada de tokens (palavras) da transcrição.
        Retorna lista vazia caso o texto contenha apenas espaços ou pontuação.
        """
        if not text or not isinstance(text, str):
            return []
        _, tok_tuple = cls._cached_normalize_and_tokenize(text)
        return list(tok_tuple)


# Funções de módulo para compatibilidade retroativa direta
def normalize_text(text: str) -> str:
    """Função utilitária que delega para TextNormalizer.normalize."""
    return TextNormalizer.normalize(text)


def tokenize(text: str) -> List[str]:
    """Função utilitária que delega para TextNormalizer.tokenize."""
    return TextNormalizer.tokenize(text)
