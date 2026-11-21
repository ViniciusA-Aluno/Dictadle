import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Award,
  BookOpen,
  FileText,
} from 'lucide-react';

/**
 * CorrectionFeedbackPanel Component (US-94 / SCRUM-189)
 *
 * Exibe o diagnóstico visual comparativo da transcrição em 2 colunas responsivas:
 * - Coluna 1 ("Sua Transcrição"): palavras corretas em verde (bg-green-100 text-green-700)
 *   e incorretas/excedentes em vermelho (bg-red-100 text-red-700 line-through) com tooltip
 *   interativo (hover no desktop e toque/clique no mobile) indicando o termo esperado.
 * - Coluna 2 ("Gabarito Oficial"): transcrição oficial completa e chips do gabarito
 *   destacando termos omitidos em âmbar (bg-amber-100 text-amber-700 border-dashed).
 * - Banner de congratulações com ícone de sucesso quando a submissão é 100% perfeita.
 * - Layout adaptável: grid-cols-1 md:grid-cols-2 sem corte lateral em mobile (< 768px).
 */
export default function CorrectionFeedbackPanel({
  tokens = null,
  studentTokens = null,
  officialTokens = null,
  transcriptOfficial = '',
  accuracyPercentage = null,
  wordsCorrect = null,
  wordsTotal = null,
  isPerfect = false,
  onReset,
}) {
  const [activeTooltipIndex, setActiveTooltipIndex] = useState(null);

  const safeDiff = Array.isArray(tokens) ? tokens : [];

  // Deriva studentTokens e officialTokens do diff se não vierem separados
  const resolvedStudentTokens =
    Array.isArray(studentTokens) && studentTokens.length > 0
      ? studentTokens
      : safeDiff
          .filter((t) => t.word !== null && t.word !== undefined)
          .map((t) => ({
            word: t.word ?? t.text ?? '',
            expected: t.expected ?? null,
            status: t.status,
            is_extra: t.is_extra ?? (t.status === 'incorrect' && !t.expected),
          }));

  const resolvedOfficialTokens =
    Array.isArray(officialTokens) && officialTokens.length > 0
      ? officialTokens
      : safeDiff
          .filter((t) => t.expected !== null && t.expected !== undefined)
          .map((t) => ({
            word: t.expected,
            submitted: t.word ?? null,
            status: t.status,
          }));

  const finalTotal = wordsTotal !== null ? wordsTotal : resolvedOfficialTokens.length;
  const finalCorrect =
    wordsCorrect !== null
      ? wordsCorrect
      : resolvedOfficialTokens.filter((t) => t.status === 'correct').length;

  const accuracy =
    accuracyPercentage !== null
      ? accuracyPercentage
      : finalTotal > 0
      ? Math.round((finalCorrect / finalTotal) * 100)
      : 0;

  const showPerfectBanner =
    isPerfect ||
    (finalTotal > 0 &&
      accuracy === 100 &&
      resolvedStudentTokens.every((t) => t.status === 'correct') &&
      resolvedOfficialTokens.every((t) => t.status === 'correct'));

  const toggleTooltip = (idx) => {
    setActiveTooltipIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section
      className="w-full bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4 transition-all"
      role="region"
      aria-label="Resultado da avaliação da transcrição"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Cabeçalho do Painel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2 flex-wrap">
            <span>Feedback Visual da Correção</span>
            <span
              className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700"
              aria-label={`Precisão: ${accuracy} por cento`}
            >
              {accuracy}% de precisão
            </span>
            {finalTotal > 0 && (
              <span className="text-xs text-slate-500 font-medium">
                ({finalCorrect}/{finalTotal} palavras)
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare sua transcrição com o gabarito oficial; toque ou passe o mouse nos termos em vermelho para ver a correção
          </p>
        </div>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            aria-label="Tentar resolver o desafio novamente"
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Tentar Novamente</span>
          </button>
        )}
      </div>

      {/* Banner de Congratulações para Submissão 100% Perfeita (Cenário 2) */}
      {showPerfectBanner && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl bg-green-100 border border-green-300 px-4 py-3 text-green-800"
        >
          <Award className="w-5 h-5 shrink-0 text-green-700" aria-hidden="true" />
          <div className="text-xs sm:text-sm font-semibold">
            Parabéns! Transcrição 100% perfeita — você acertou todas as palavras do áudio!
          </div>
        </div>
      )}

      {/* Grid Comparativo Responsivo: 1 coluna no mobile, 2 colunas lado a lado no desktop (Cenário 6) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Coluna 1: Sua Transcrição */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
            <FileText className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
            <h4>Sua Transcrição</h4>
          </div>

          <div
            className="flex flex-wrap gap-2 items-center min-h-[48px]"
            role="group"
            aria-label="Palavras da sua transcrição"
          >
            {resolvedStudentTokens.length === 0 ? (
              <span className="text-xs text-slate-400 italic">
                Nenhuma palavra válida identificada na submissão.
              </span>
            ) : (
              resolvedStudentTokens.map((token, idx) => {
                if (token.status === 'correct') {
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs sm:text-sm font-semibold bg-green-100 text-green-700 border border-green-300 break-words"
                      title="Palavra correta"
                      aria-label={`${token.word} (palavra correta)`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{token.word}</span>
                    </span>
                  );
                }

                const tooltipMessage = token.expected
                  ? `Esperado: "${token.expected}"`
                  : 'Palavra excedente (não consta no gabarito)';
                const isTooltipOpen = activeTooltipIndex === idx;

                return (
                  <span key={idx} className="relative inline-flex">
                    <button
                      type="button"
                      onClick={() => toggleTooltip(idx)}
                      onMouseEnter={() => setActiveTooltipIndex(idx)}
                      onMouseLeave={() => setActiveTooltipIndex(null)}
                      onFocus={() => setActiveTooltipIndex(idx)}
                      onBlur={() => setActiveTooltipIndex(null)}
                      title={tooltipMessage}
                      aria-label={`${token.word} (${tooltipMessage})`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs sm:text-sm font-semibold bg-red-100 text-red-700 border border-red-300 line-through decoration-red-500 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400 break-words"
                    >
                      <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{token.word}</span>
                    </button>

                    {isTooltipOpen && (
                      <span
                        role="tooltip"
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white shadow-md pointer-events-none"
                      >
                        {tooltipMessage}
                      </span>
                    )}
                  </span>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna 2: Gabarito Oficial */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <h4>Gabarito Oficial</h4>
          </div>

          {transcriptOfficial && (
            <p className="text-sm text-slate-800 font-medium leading-relaxed bg-white rounded-lg border border-slate-200 px-3 py-2 break-words">
              {transcriptOfficial}
            </p>
          )}

          <div
            className="flex flex-wrap gap-2 items-center"
            role="group"
            aria-label="Palavras do gabarito oficial com omissões destacadas"
          >
            {resolvedOfficialTokens.map((token, idx) => {
              if (token.status === 'missing') {
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs sm:text-sm font-semibold bg-amber-100 text-amber-700 border border-amber-300 border-dashed break-words"
                    title={`Palavra omitida: "${token.word}"`}
                    aria-label={`${token.word} (palavra omitida)`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{token.word}</span>
                  </span>
                );
              }

              if (token.status === 'correct') {
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-100/70 text-green-700 border border-green-200 break-words"
                    aria-label={`${token.word} (acertada)`}
                  >
                    {token.word}
                  </span>
                );
              }

              return (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-200/80 text-slate-700 border border-slate-300 break-words"
                  title={`Substituída por "${token.submitted}"`}
                  aria-label={`${token.word} (esperada no lugar de ${token.submitted})`}
                >
                  {token.word}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legenda Cromática */}
      <div
        className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600 pt-1"
        aria-hidden="true"
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
          <span>Correta</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span>Incorreta / Excedente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Omitida no gabarito</span>
        </div>
      </div>
    </section>
  );
}
