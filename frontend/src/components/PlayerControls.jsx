import React from 'react';
import { Play, Pause, RotateCcw, Undo2, Loader2, Volume2 } from 'lucide-react';

/**
 * Formata segundos numerais no padrão mm:ss (ex.: 3 -> "00:03", 65 -> "01:05")
 */
function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * PlayerControls Component (SCRUM-150 / US-107 / SCRUM-20 / SCRUM-17 / DA-USA-I1-001)
 * 
 * Barra de controles interativos personalizados para reprodução de recorte:
 * - Controles e barra de progresso alinhados em uma única linha horizontal
 * - Botão Play / Pause com feedback de carregamento e estado ARIA dinâmico
 * - Botão Replay (Reiniciar Trecho) com rótulo acessível
 * - Botão Retroceder 5 segundos (-5s) com rótulo acessível
 * - Barra de progresso interativa WAI-ARIA com navegação por teclado e aria-valuetext
 * - Região de anúncio em tempo real para tecnologias assistivas (aria-live)
 * - Dicas sutis dos atalhos de teclado
 */
export default function PlayerControls({
  isPlaying = false,
  isBuffering = false,
  isReady = false,
  elapsed = 0,
  duration = 0,
  progressPercent = 0,
  onTogglePlay,
  onReplay,
  onRewind,
  onSeekRelative,
}) {
  const handleProgressBarClick = (e) => {
    if (!onSeekRelative || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    onSeekRelative(fraction);
  };

  const handleProgressBarKeyDown = (e) => {
    if (duration <= 0) return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (onRewind) {
        onRewind(5);
      } else if (onSeekRelative) {
        const targetSec = Math.max(0, elapsed - 5);
        onSeekRelative(targetSec / duration);
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (onSeekRelative) {
        const targetSec = Math.min(duration, elapsed + 5);
        onSeekRelative(targetSec / duration);
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      if (onReplay) {
        onReplay();
      } else if (onSeekRelative) {
        onSeekRelative(0);
      }
    } else if (e.key === 'End') {
      e.preventDefault();
      if (onSeekRelative) {
        onSeekRelative(1);
      }
    }
  };

  const accessibleValueText = `${formatTime(elapsed)} de ${formatTime(duration)}`;

  return (
    <div
      role="region"
      aria-label="Controles de reprodução de áudio do desafio"
      className="w-full bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-2.5 sm:px-4 sm:py-3 text-white shadow-xl transition-all"
    >
      {/* Região viva oculta para leitores de tela anunciarem o estado da mídia (DA-USA-I1-001) */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {!isReady
          ? 'Carregando reprodutor de áudio'
          : isBuffering
          ? 'Carregando áudio'
          : isPlaying
          ? `Reproduzindo áudio, ${accessibleValueText}`
          : 'Áudio pausado'}
      </div>

      {/* Linha Única: Controles de Reprodução lado a lado com a Barra de Progresso */}
      <div className="flex items-center gap-2 sm:gap-3 w-full">
        {/* Botão Play / Pause Principal */}
        <button
          type="button"
          onClick={onTogglePlay}
          disabled={!isReady}
          className="flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold transition shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900 shrink-0"
          title={isPlaying ? 'Pausar clipe (Ctrl + Espaço)' : 'Reproduzir clipe (Ctrl + Espaço)'}
          aria-label={isPlaying ? 'Pausar clipe de áudio' : 'Reproduzir clipe de áudio'}
          aria-pressed={isPlaying}
        >
          {isBuffering && isPlaying ? (
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>

        {/* Botão Retroceder 5 segundos */}
        <button
          type="button"
          onClick={() => onRewind && onRewind(5)}
          disabled={!isReady}
          className="flex items-center justify-center gap-1 min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-50 text-slate-200 text-xs font-semibold border border-slate-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900 shrink-0"
          title="Voltar 5 segundos (Ctrl + Seta Esquerda)"
          aria-label="Voltar 5 segundos no áudio"
        >
          <Undo2 className="w-4 h-4 text-indigo-400" />
          <span>-5s</span>
        </button>

        {/* Botão Reiniciar Trecho (Replay) */}
        <button
          type="button"
          onClick={onReplay}
          disabled={!isReady}
          className="flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-50 text-slate-200 text-xs font-semibold border border-slate-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900 shrink-0"
          title="Reiniciar o recorte do início (Ctrl + Seta Abaixo)"
          aria-label="Reiniciar o clipe de áudio do início"
        >
          <RotateCcw className="w-4 h-4 text-indigo-400" />
          <span className="hidden sm:inline">Reiniciar</span>
        </button>

        {/* Barra de Progresso Relativa ao Trecho em linha (flex-1) */}
        <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3">
          <div
            role="progressbar"
            tabIndex={0}
            aria-label="Progresso da reprodução do clipe"
            aria-valuenow={Math.round(progressPercent)}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuetext={accessibleValueText}
            onClick={handleProgressBarClick}
            onKeyDown={handleProgressBarKeyDown}
            className="group relative w-full h-2.5 sm:h-3 bg-slate-800 hover:h-3.5 rounded-full overflow-hidden cursor-pointer transition-all border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            title="Clique ou use setas do teclado para navegar no trecho de áudio"
          >
            {/* Faixa de progresso preenchida */}
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-75 relative"
              style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
            >
              {/* Marcador do cursor na ponta */}
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Marcadores de Tempo Relativo */}
          <div className="shrink-0 text-[11px] font-mono text-slate-400 whitespace-nowrap" aria-hidden="true">
            <span className="text-indigo-300 font-semibold">{formatTime(elapsed)}</span>
            <span className="text-slate-500"> / {formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Dicas de Atalhos Sutis (sem ícone de command) */}
      <div
        className="mt-2 text-[10px] sm:text-[11px] text-slate-500 flex flex-wrap items-center justify-end gap-1.5 font-normal tracking-wide"
        aria-label="Atalhos: Ctrl mais Espaço para Play/Pause, Ctrl mais Seta Esquerda para voltar 5 segundos"
      >
        <span className="text-slate-500">Atalhos:</span>
        <span className="text-slate-400">Ctrl+Espaço <span className="text-slate-600">(Play/Pause)</span></span>
        <span className="text-slate-700" aria-hidden="true">•</span>
        <span className="text-slate-400">Ctrl+← <span className="text-slate-600">(-5s)</span></span>
        <span className="text-slate-700 hidden sm:inline" aria-hidden="true">•</span>
        <span className="text-slate-400 hidden sm:inline">Ctrl+↓ <span className="text-slate-600">(Reiniciar)</span></span>
      </div>
    </div>
  );
}
