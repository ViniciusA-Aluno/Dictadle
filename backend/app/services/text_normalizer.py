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
from typing import List

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
        Exemplo: 'café' -> 'cafe', 'façade' -> 'facade', 'naïve' -> 'naive'.
        """
        if not text or not isinstance(text, str):
            return ""
        decomposed = unicodedata.normalize("NFKD", text)
        return "".join(c for c in decomposed if not unicodedata.combining(c))

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

        # 1. Tradução de apóstrofos curvos e tipográficos
        translated = text.translate(_APOSTROPHE_TRANSLATION)

        # 2. Remoção de diacríticos / acentos Unicode
        without_accents = cls.strip_accents(translated)

        # 3. Conversão para minúsculas
        lower_text = without_accents.lower()

        # 4. Remoção de pontuação cosmética e underscores
        cleaned = _NON_WORD_PATTERN.sub(" ", lower_text)
        cleaned = _UNDERSCORE_PATTERN.sub(" ", cleaned)

        # 5. Colapso de espaços e sanitização de extremidades dos tokens
        tokens = []
        for raw_token in _WHITESPACE_PATTERN.split(cleaned.strip()):
            # Remove apóstrofos isolados ou em bordas (ex.: "'quoted'" -> "quoted", "'" -> "")
            token = raw_token.strip("'")
            if token:
                tokens.append(token)

        return " ".join(tokens)

    @classmethod
    def tokenize(cls, text: str) -> List[str]:
        """
        Normaliza e retorna a lista ordenada de tokens (palavras) da transcrição.
        Retorna lista vazia caso o texto contenha apenas espaços ou pontuação.
        """
        normalized = cls.normalize(text)
        if not normalized:
            return []
        return normalized.split(" ")


# Funções de módulo para compatibilidade retroativa direta
def normalize_text(text: str) -> str:
    """Função utilitária que delega para TextNormalizer.normalize."""
    return TextNormalizer.normalize(text)


def tokenize(text: str) -> List[str]:
    """Função utilitária que delega para TextNormalizer.tokenize."""
    return TextNormalizer.tokenize(text)
