import { useEffect, useRef } from 'react';

/**
 * useMediaKeyboardShortcuts Hook (SCRUM-20 / Driver Arquitetural DA-USA-I1-003)
 * 
 * Atributo de Qualidade: Usabilidade
 * Objetivo: Controle de mídia via atalhos de teclado sem interromper o foco na digitação.
 * 
 * Atalhos Suportados:
 * - Ctrl + Espaço (ou Alt + Espaço): Alterna Play / Pause.
 * - Ctrl + Seta Esquerda (ou Alt + Seta Esquerda): Retrocede 5 segundos no recorte.
 * - Ctrl + Seta Abaixo (ou Alt + Home): Reinicia o clipe do início (Replay).
 * 
 * Garantia Arquitetural (Cenário de Usabilidade):
 * Ao capturar os atalhos, previne ações padrão do navegador (como inserção de espaços
 * ou rolagem de tela) e preserva rigorosamente a posição do cursor (selectionStart,
 * selectionEnd) e o foco ativo (0 perdas de foco no textarea/input de transcrição).
 */
export function useMediaKeyboardShortcuts({
  onTogglePlay,
  onRewind,
  onReplay,
  enabled = true,
  targetInputRef = null,
}) {
  const onTogglePlayRef = useRef(onTogglePlay);
  const onRewindRef = useRef(onRewind);
  const onReplayRef = useRef(onReplay);

  useEffect(() => {
    onTogglePlayRef.current = onTogglePlay;
    onRewindRef.current = onRewind;
    onReplayRef.current = onReplay;
  }, [onTogglePlay, onRewind, onReplay]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      const isAlt = event.altKey;

      const isSpace = event.code === 'Space' || event.key === ' ';
      const isArrowLeft = event.code === 'ArrowLeft' || event.key === 'ArrowLeft';
      const isArrowDown = event.code === 'ArrowDown' || event.key === 'ArrowDown';
      const isHome = event.code === 'Home' || event.key === 'Home';

      // Identifica o atalho correspondente
      const matchesPlayPause = (isCtrlOrCmd || isAlt) && isSpace;
      const matchesRewind = (isCtrlOrCmd || isAlt) && isArrowLeft;
      const matchesReplay = ((isCtrlOrCmd || isAlt) && isArrowDown) || (isAlt && isHome);

      if (!matchesPlayPause && !matchesRewind && !matchesReplay) {
        return;
      }

      // Intercepta para impedir efeito colateral no documento ou digitação indevida de caractere
      event.preventDefault();
      event.stopPropagation();

      // Captura o elemento ativo antes da execução
      const activeEl = document.activeElement;
      let selectionStart = null;
      let selectionEnd = null;

      if (
        activeEl &&
        (activeEl.tagName === 'TEXTAREA' ||
          (activeEl.tagName === 'INPUT' && activeEl.type === 'text'))
      ) {
        selectionStart = activeEl.selectionStart;
        selectionEnd = activeEl.selectionEnd;
      }

      // Executa a ação da mídia
      if (matchesPlayPause && typeof onTogglePlayRef.current === 'function') {
        onTogglePlayRef.current();
      } else if (matchesRewind && typeof onRewindRef.current === 'function') {
        onRewindRef.current(5);
      } else if (matchesReplay && typeof onReplayRef.current === 'function') {
        onReplayRef.current();
      }

      // Garantia do Driver DA-USA-I1-003: Restaura e preserva o foco e a posição do cursor
      const targetElement =
        activeEl || (targetInputRef && targetInputRef.current);

      if (targetElement && typeof targetElement.focus === 'function') {
        // Usa requestAnimationFrame para assegurar que nenhuma alteração de DOM roubou o foco
        requestAnimationFrame(() => {
          targetElement.focus();
          if (
            selectionStart !== null &&
            selectionEnd !== null &&
            typeof targetElement.setSelectionRange === 'function'
          ) {
            targetElement.setSelectionRange(selectionStart, selectionEnd);
          }
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled, targetInputRef]);
}
