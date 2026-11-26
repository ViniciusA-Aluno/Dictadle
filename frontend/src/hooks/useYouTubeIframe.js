import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useYouTubeIframe Hook (SCRUM-149 / US-107)
 * 
 * Gerencia o ciclo de vida da YouTube IFrame Player API oficial (window.YT),
 * a inicialização segura do player e a contenção temporal estrita [startTime, endTime].
 * 
 * Regras implementadas:
 * - Carregamento assíncrono idempotente do script https://www.youtube.com/iframe_api
 * - Controles nativos ocultos (controls: 0, rel: 0, modestbranding: 1, disablekb: 1)
 * - Monitoramento em alta precisão (50ms): impede que o player reproduza além de endTime
 * - Ao atingir endTime, retorna automaticamente para startTime e pausa
 * - Tratamento de erros de incorporação (erros 100, 101, 150)
 */
export function useYouTubeIframe({
  videoId,
  startTime = 0,
  endTime = 0,
  containerId,
  autoPlay = false,
  onPlaybackEnd,
}) {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(startTime);
  const [errorCode, setErrorCode] = useState(null);

  const playerRef = useRef(null);
  const loopTimerRef = useRef(null);
  const isPlayingRef = useRef(false);
  const duration = Math.max(0, endTime - startTime);

  // Mantém refs atualizadas para evitar closures obsoletas no loop de monitoramento
  const startTimeRef = useRef(startTime);
  const endTimeRef = useRef(endTime);
  const onPlaybackEndRef = useRef(onPlaybackEnd);

  useEffect(() => {
    startTimeRef.current = startTime;
    endTimeRef.current = endTime;
    onPlaybackEndRef.current = onPlaybackEnd;
  }, [startTime, endTime, onPlaybackEnd]);

  // Carregamento do script da YouTube IFrame API e controle de troca de vídeo
  useEffect(() => {
    if (!videoId || !containerId) return;

    let isSubscribed = true;

    const suppressSubtitles = (target) => {
      try {
        if (typeof target.unloadModule === 'function') {
          target.unloadModule('captions');
          target.unloadModule('cc');
        }
        if (typeof target.setOption === 'function') {
          target.setOption('captions', 'track', {});
          target.setOption('cc', 'track', {});
        }
      } catch (e) {
        // Módulo de legendas pode não estar carregado
      }
    };

    // Otimização: se o player já estiver inicializado, apenas carrega o novo clipe sem destruir o iframe
    if (playerRef.current && isReady && typeof playerRef.current.cueVideoById === 'function') {
      try {
        playerRef.current.pauseVideo();
        playerRef.current.cueVideoById({
          videoId,
          startSeconds: Math.floor(startTime),
          endSeconds: Math.ceil(endTime),
        });
        playerRef.current.seekTo(startTime, true);
        setCurrentTime(startTime);
        setIsPlaying(false);
        isPlayingRef.current = false;
        setIsBuffering(false);
        setErrorCode(null);
        suppressSubtitles(playerRef.current);
        return;
      } catch (err) {
        console.warn('Erro ao atualizar clipe no player existente, reinicializando:', err);
      }
    }

    let initTimer = null;
    let fallbackReadyTimer = null;

    const initPlayer = () => {
      if (!isSubscribed || !window.YT || !window.YT.Player) return;

      const containerEl = document.getElementById(containerId);
      if (!containerEl) {
        initTimer = setTimeout(initPlayer, 40);
        return;
      }

      // Destrói instância anterior se existir
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.warn('Erro ao destruir player anterior:', e);
        }
        playerRef.current = null;
      }

      setIsReady(false);
      setIsPlaying(false);
      setIsBuffering(false);
      setErrorCode(null);
      setCurrentTime(startTimeRef.current);

      try {
        const player = new window.YT.Player(containerId, {
          videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            start: Math.floor(startTimeRef.current),
            end: Math.ceil(endTimeRef.current),
            enablejsapi: 1,
            controls: 0,
            rel: 0,
            disablekb: 1,
            modestbranding: 1,
            iv_load_policy: 3,
            cc_load_policy: 0,
            fs: 0,
            autoplay: autoPlay ? 1 : 0,
            playsinline: 1,
          },
          events: {
            onReady: (event) => {
              if (!isSubscribed) return;
              if (fallbackReadyTimer) clearTimeout(fallbackReadyTimer);
              playerRef.current = event.target;
              try {
                suppressSubtitles(event.target);
                event.target.seekTo(startTimeRef.current, true);
                if (autoPlay) {
                  event.target.playVideo();
                } else {
                  event.target.pauseVideo();
                }
              } catch (err) {
                console.warn('Erro ao configurar tempo inicial:', err);
              }
              setIsBuffering(false);
              setIsPlaying(false);
              setIsReady(true);
            },
            onStateChange: (event) => {
              if (!isSubscribed) return;
              const state = event.data;
              // Qualquer emissão de evento de estado comprova que o player está ativo e pronto
              setIsReady(true);
              if (fallbackReadyTimer) clearTimeout(fallbackReadyTimer);

              // window.YT.PlayerState: -1 (UNSTARTED), 0 (ENDED), 1 (PLAYING), 2 (PAUSED), 3 (BUFFERING), 5 (CUED)
              if (state === window.YT.PlayerState.PLAYING) {
                suppressSubtitles(event.target);
                setIsPlaying(true);
                isPlayingRef.current = true;
                setIsBuffering(false);
              } else if (state === window.YT.PlayerState.BUFFERING) {
                setIsBuffering(true);
              } else if (state === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
                isPlayingRef.current = false;
                setIsBuffering(false);
              } else if (state === window.YT.PlayerState.ENDED) {
                setIsPlaying(false);
                isPlayingRef.current = false;
                setIsBuffering(false);
                handleReachEnd();
              } else if (state === 5 || state === -1) {
                // CUED ou UNSTARTED: clipe pronto e posicionado no início
                setIsPlaying(false);
                isPlayingRef.current = false;
                setIsBuffering(false);
              }
            },
            onError: (event) => {
              if (!isSubscribed) return;
              if (fallbackReadyTimer) clearTimeout(fallbackReadyTimer);
              console.error('YouTube Player Error:', event.data);
              setErrorCode(event.data);
              setIsPlaying(false);
              isPlayingRef.current = false;
            },
          },
        });

        playerRef.current = player;

        // Fallback de segurança contra atraso de postMessage em localhost
        fallbackReadyTimer = setTimeout(() => {
          if (!isSubscribed) return;
          if (playerRef.current) {
            setIsReady(true);
          }
        }, 1500);
      } catch (err) {
        console.error('Erro ao instanciar YouTube Player:', err);
      }
    };

    // Polling resiliente com debounce para React 18 StrictMode
    const checkAndInit = () => {
      if (!isSubscribed) return;

      const containerEl = document.getElementById(containerId);
      if (!containerEl) {
        initTimer = setTimeout(checkAndInit, 40);
        return;
      }

      if (window.YT && typeof window.YT.Player === 'function') {
        initPlayer();
      } else {
        const existingScript = document.getElementById('youtube-iframe-api-script');
        if (!existingScript) {
          const tag = document.createElement('script');
          tag.id = 'youtube-iframe-api-script';
          tag.src = 'https://www.youtube.com/iframe_api';
          document.head.appendChild(tag);
        }
        initTimer = setTimeout(checkAndInit, 40);
      }
    };

    // Atraso de 50ms para acomodar double-mount do React 18
    initTimer = setTimeout(checkAndInit, 50);

    return () => {
      isSubscribed = false;
      if (initTimer) {
        clearTimeout(initTimer);
        initTimer = null;
      }
      if (fallbackReadyTimer) {
        clearTimeout(fallbackReadyTimer);
        fallbackReadyTimer = null;
      }
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore
        }
        playerRef.current = null;
      }
    };
  }, [videoId, containerId]);

  // Função disparada ao atingir o limite final do trecho
  const handleReachEnd = useCallback(() => {
    if (!playerRef.current) return;
    try {
      playerRef.current.pauseVideo();
      playerRef.current.seekTo(startTimeRef.current, true);
    } catch (e) {
      // ignore
    }
    setCurrentTime(startTimeRef.current);
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (typeof onPlaybackEndRef.current === 'function') {
      onPlaybackEndRef.current();
    }
  }, []);

  // Loop de monitoramento de alta precisão (50ms) para contenção do intervalo
  useEffect(() => {
    if (!isPlaying) {
      if (loopTimerRef.current) {
        clearInterval(loopTimerRef.current);
        loopTimerRef.current = null;
      }
      return;
    }

    loopTimerRef.current = setInterval(() => {
      if (!playerRef.current || !isPlayingRef.current) return;

      try {
        const time = playerRef.current.getCurrentTime();
        if (typeof time === 'number' && !isNaN(time)) {
          // Se ultrapassou o limite do recorte (com tolerância máxima de 100ms)
          if (time >= endTimeRef.current - 0.05) {
            handleReachEnd();
          } else {
            setCurrentTime(time);
          }
        }
      } catch (err) {
        // Player pode estar em transição
      }
    }, 50);

    return () => {
      if (loopTimerRef.current) {
        clearInterval(loopTimerRef.current);
        loopTimerRef.current = null;
      }
    };
  }, [isPlaying, handleReachEnd]);

  // Ações de controle
  const playVideo = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      try {
        // Se estiver além do fim ou no início, reposiciona antes do play
        const curr = playerRef.current.getCurrentTime();
        if (curr >= endTimeRef.current || curr < startTimeRef.current) {
          playerRef.current.seekTo(startTimeRef.current, true);
        }
        playerRef.current.playVideo();
      } catch (err) {
        console.warn('Erro ao dar play no vídeo:', err);
      }
    }
  }, []);

  const pauseVideo = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
      try {
        playerRef.current.pauseVideo();
      } catch (err) {
        console.warn('Erro ao pausar o vídeo:', err);
      }
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) {
      pauseVideo();
    } else {
      playVideo();
    }
  }, [pauseVideo, playVideo]);

  const replay = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      try {
        playerRef.current.seekTo(startTimeRef.current, true);
        playerRef.current.playVideo();
        setCurrentTime(startTimeRef.current);
      } catch (err) {
        console.warn('Erro ao reiniciar clipe:', err);
      }
    }
  }, []);

  const rewind = useCallback((seconds = 5) => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      try {
        const curr = playerRef.current.getCurrentTime() || startTimeRef.current;
        const target = Math.max(startTimeRef.current, curr - seconds);
        playerRef.current.seekTo(target, true);
        setCurrentTime(target);
      } catch (err) {
        console.warn('Erro ao retroceder clipe:', err);
      }
    }
  }, []);

  const seekRelative = useCallback((fraction) => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      try {
        const clampedFraction = Math.max(0, Math.min(1, fraction));
        const target = startTimeRef.current + clampedFraction * (endTimeRef.current - startTimeRef.current);
        playerRef.current.seekTo(target, true);
        setCurrentTime(target);
      } catch (err) {
        console.warn('Erro ao avançar/retroceder na barra:', err);
      }
    }
  }, []);

  // Progresso relativo normalizado entre 0% e 100% dentro do trecho
  const elapsed = Math.max(0, currentTime - startTime);
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (elapsed / duration) * 100)) : 0;

  return {
    isReady,
    isPlaying,
    isBuffering,
    currentTime,
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
  };
}
