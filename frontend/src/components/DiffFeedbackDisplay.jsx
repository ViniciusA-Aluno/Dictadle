import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import { normalizeWord, computeWordDiff } from '../utils/diffUtils.js';

export { normalizeWord, computeWordDiff };

/**
 * DiffFeedbackDisplay Component (US-92 / SCRUM-148)
 */
export default function DiffFeedbackDisplay({
  tokens = null,
  attempt = '',
  expected = '',
  onReset,
}) {
  // Se os tokens não forem fornecidos prontos pelo backend, calculamos localmente
  const diffTokens = tokens || (attempt && expected ? computeWordDiff(attempt, expected) : []);

  const totalWords = diffTokens.length;
  const correctCount = diffTokens.filter(t => t.status === 'correct').length;
  const accuracy = totalWords > 0 ? Math.round((correctCount / totalWords) * 100) : 0;

  return (
    <div
      className="w-full bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 animate-fadeIn"
      role="region"
      aria-label="Resultado da avaliação da transcrição"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Cabeçalho do Feedback */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
            <span>Resultado da Transcrição</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700"
              aria-label={`Precisão: ${accuracy} por cento`}
            >
              {accuracy}% de precisão
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare o que você digitou com o gabarito do áudio
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

      {/* Container de Tokens Destacados */}
      <div
        className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap gap-2 items-center min-h-[60px]"
        role="group"
        aria-label="Detalhamento palavra por palavra"
      >
        {diffTokens.map((token, index) => {
          if (token.status === 'correct') {
            return (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs sm:text-sm font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs"
                title="Palavra correta"
                aria-label={`${token.text} (palavra correta)`}
              >
                {token.text}
              </span>
            );
          }

          if (token.status === 'error') {
            return (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs sm:text-sm font-semibold bg-rose-100 text-rose-800 border border-rose-300 line-through decoration-rose-500 shadow-xs"
                title="Palavra incorreta"
                aria-label={`${token.text} (palavra incorreta)`}
              >
                {token.text}
              </span>
            );
          }

          if (token.status === 'omission') {
            return (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs sm:text-sm font-semibold bg-amber-100 text-amber-800 border border-amber-300 border-dashed shadow-xs"
                title="Palavra omitida"
                aria-label={`${token.text} (palavra omitida)`}
              >
                +{token.text}
              </span>
            );
          }

          return (
            <span
              key={index}
              className="text-xs sm:text-sm text-slate-700"
              aria-label={token.text}
            >
              {token.text}
            </span>
          );
        })}
      </div>

      {/* Legenda Explicativa */}
      <div
        className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600 pt-1"
        aria-hidden="true"
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Acerto</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>Erro</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Omissão</span>
        </div>
      </div>
    </div>
  );
}
