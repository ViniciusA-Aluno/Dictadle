/**
 * Função utilitária para normalizar palavras (remover pontuação e caixa baixa)
 */
export const normalizeWord = (word) => {
  return word.replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, '').trim().toLowerCase();
};

/**
 * Algoritmo de comparação (diff) palavra a palavra
 * Suporta o Cenário 5 do BDD da US-92:
 * Tentativa: "Hey boys how going"
 * Gabarito: "Hey guys, how is it going?"
 * Acertos: "Hey", "how", "going" (verde)
 * Erro: "boys" (vermelho)
 * Omissão: "guys", "is", "it" (amarelo)
 */
export const computeWordDiff = (attempt = '', solution = '') => {
  const attemptTokens = attempt.trim().split(/\s+/).filter(Boolean);
  const solutionTokens = solution.trim().split(/\s+/).filter(Boolean);

  const normalizedSolution = solutionTokens.map(w => normalizeWord(w));
  const normalizedAttempt = attemptTokens.map(w => normalizeWord(w));

  const items = [];
  let sIdx = 0;

  for (let aIdx = 0; aIdx < attemptTokens.length; aIdx++) {
    const rawWord = attemptTokens[aIdx];
    const normWord = normalizedAttempt[aIdx];

    // Procura se essa palavra da tentativa existe nas posições subsequentes da solução
    const foundIdx = normalizedSolution.indexOf(normWord, sIdx);

    if (foundIdx !== -1) {
      // Palavras da solução puladas entre sIdx e foundIdx são omissões
      while (sIdx < foundIdx) {
        items.push({
          text: solutionTokens[sIdx],
          status: 'omission', // Amarelo
        });
        sIdx++;
      }
      // Palavra atual é um acerto
      items.push({
        text: rawWord,
        status: 'correct', // Verde
      });
      sIdx++;
    } else {
      // Palavra não encontrada no gabarito
      items.push({
        text: rawWord,
        status: 'error', // Vermelho
      });
    }
  }

  // Qualquer palavra restante na solução não coberta na tentativa é omissão
  while (sIdx < solutionTokens.length) {
    items.push({
      text: solutionTokens[sIdx],
      status: 'omission',
    });
    sIdx++;
  }

  return items;
};
