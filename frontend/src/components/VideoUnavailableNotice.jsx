import React from 'react';
import { AlertTriangle, RefreshCw, Compass } from 'lucide-react';

/**
 * VideoUnavailableNotice (SCRUM-107 / Cenário 3.1)
 * 
 * Exibido quando a incorporação do vídeo é bloqueada pelo proprietário
 * no YouTube ou o vídeo torna-se privado/inexistente (erros 100, 101, 150 da Iframe API).
 */
export default function VideoUnavailableNotice({ onRetry, onNavigateToCatalog, errorCode }) {
  return (
    <div className="w-full aspect-video bg-slate-900 rounded-3xl border border-slate-800 shadow-lg flex flex-col items-center justify-center p-6 text-center text-slate-300">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <h3 className="text-white text-base sm:text-lg font-bold">
        Este vídeo não está disponível no momento
      </h3>

      <p className="text-xs sm:text-sm text-slate-400 max-w-md mt-1.5 leading-relaxed">
        A reprodução externa deste clipe foi restringida ou o vídeo tornou-se privado no YouTube. Nossos curadores foram notificados.
      </p>

      {errorCode && (
        <span className="mt-2 text-[11px] font-mono text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
          Código de erro YouTube: {errorCode}
        </span>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tentar novamente</span>
          </button>
        )}

        {onNavigateToCatalog && (
          <button
            type="button"
            onClick={onNavigateToCatalog}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Escolher outro desafio</span>
          </button>
        )}
      </div>
    </div>
  );
}
