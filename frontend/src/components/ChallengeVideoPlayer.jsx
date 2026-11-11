import React, { useState } from 'react';
import { useYouTubeIframe } from '../hooks/useYouTubeIframe';
import PlayerControls from './PlayerControls';
import VideoUnavailableNotice from './VideoUnavailableNotice';
import { Loader2, Video, Play } from 'lucide-react';

/**
 * ChallengeVideoPlayer Component (US-107 / SCRUM-149 / SCRUM-150 / SCRUM-17 / DA-USA-I1-001)
 * 
 * Componente principal de reprodução de mídia para os desafios de transcrição.
 * Integra a IFrame Player API oficial do YouTube, contenção temporal estrita,
 * controles visuais personalizados e fallback amigável em caso de indisponibilidade de mídia.
 * Implementa acessibilidade semântica WAI-ARIA com suporte a leitores de tela e navegação por teclado.
 */
export default function ChallengeVideoPlayer({
  videoId,
  startTime = 0,
  endTime = 0,
  title = "Trecho do Desafio",
  onPlaybackEnd,
  onNavigateToCatalog,
  playerControlsRef = null,
}) {
  // Gera um ID único e aleatório para cada montagem, evitando colisões no registro interno do YouTube
  const [containerId] = useState(
    () => `yt-player-slot-${Math.random().toString(36).substring(2, 9)}`
  );

  const {
    isReady,
    isPlaying,
    isBuffering,
    elapsed,
    duration,
    progressPercent,
    errorCode,
    playVideo,
    pauseVideo,
    togglePlay,
    replay,
    rewind,
    seekRelative,
  } = useYouTubeIframe({
    videoId,
    startTime,
    endTime,
    containerId,
    autoPlay: false,
    onPlaybackEnd,
  });

  // Disponibiliza as ações de controle para ref externa (ex.: atalhos de teclado)
  if (playerControlsRef) {
    playerControlsRef.current = {
      playVideo,
      pauseVideo,
      togglePlay,
      replay,
      rewind,
      seekRelative,
      isPlaying,
      isReady,
    };
  }

  // Se o vídeo foi bloqueado pelo YouTube (erros 100, 101, 150)
  if (errorCode) {
    return (
      <VideoUnavailableNotice
        errorCode={errorCode}
        onRetry={replay}
        onNavigateToCatalog={onNavigateToCatalog}
      />
    );
  }

  return (
    <div
      role="region"
      aria-label={`Reprodutor de vídeo: ${title}`}
      className="w-full space-y-3"
    >
      {/* Container de Reprodução de Vídeo (16:9) */}
      <div className="relative aspect-video w-full bg-black rounded-3xl overflow-hidden border border-slate-800 shadow-xl group">
        {/* Slot onde a YouTube API monta o iframe */}
        <div id={containerId} className="w-full h-full pointer-events-none" />

        {/* Overlay enquanto a API do YouTube está carregando */}
        {!isReady && (
          <div
            className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-slate-400 gap-3 z-10"
            aria-live="polite"
          >
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-xs font-medium">Carregando reprodutor oficial...</p>
          </div>
        )}

        {/* Camada interativa superior e botão de Play centralizado quando o clipe está pausado */}
        <div
          role="button"
          tabIndex={0}
          className="absolute inset-0 z-10 cursor-pointer flex items-center justify-center transition-all bg-black/10 hover:bg-black/20 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-inset"
          onClick={togglePlay}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              togglePlay();
            }
          }}
          title={isPlaying ? 'Clique para pausar' : 'Clique para reproduzir (Ctrl + Espaço)'}
          aria-label={isPlaying ? 'Pausar vídeo do desafio' : 'Reproduzir vídeo do desafio'}
        >
          {!isPlaying && isReady && (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-600/90 hover:bg-indigo-600 text-white flex items-center justify-center shadow-2xl backdrop-blur-xs border-2 border-white/30 transition-all transform group-hover:scale-110 active:scale-95 animate-in fade-in zoom-in-95 duration-200">
              <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1 text-white drop-shadow-md" />
            </div>
          )}
        </div>
      </div>

      {/* Controles Customizados Dictadle (SCRUM-150 / DA-USA-I1-001) */}
      <PlayerControls
        isPlaying={isPlaying}
        isBuffering={isBuffering}
        isReady={isReady}
        elapsed={elapsed}
        duration={duration}
        progressPercent={progressPercent}
        onTogglePlay={togglePlay}
        onReplay={replay}
        onRewind={rewind}
        onSeekRelative={seekRelative}
      />
    </div>
  );
}
