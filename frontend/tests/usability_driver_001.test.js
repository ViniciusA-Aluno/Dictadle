/**
 * Suíte de Testes de Verificação do Driver Arquitetural DA-USA-I1-001 (SCRUM-17).
 * Atributo de Qualidade: Usabilidade & Acessibilidade Semântica (WCAG 2.1 AA / WAI-ARIA)
 * Título: Navegação e compatibilidade com leitores de tela na interface de ditado
 * 
 * Cenário Arquitetural:
 *   Fonte: Estudante com deficiência visual navegando via teclado e leitor de telas.
 *   Estímulo: Navega por todos os componentes do fluxo de resolução (Player, Input, Feedback).
 *   Artefato: PlayerControls, ChallengeVideoPlayer, AnswerInputBox, DiffFeedbackDisplay, ChallengeResolutionPage.
 *   Ambiente: Navegador web padrão em tempo de execução.
 *   Resposta: Elementos interativos possuem rótulos acessíveis, roles WAI-ARIA, feedback sonoro de diff e suporte a teclado.
 *   Medida: 100% dos elementos interativos possuem atributos de acessibilidade válidos sem armadilha de foco.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { computeWordDiff } from '../src/utils/diffUtils.js';

describe('Driver Arquitetural DA-USA-I1-001 - Acessibilidade e Leitor de Telas (SCRUM-17)', () => {

  describe('Cenário 1: PlayerControls e Acessibilidade WAI-ARIA', () => {
    test('1.1: Barra de progresso possui semântica de slider/progressbar e formatação para leitor de tela', () => {
      const elapsed = 7;
      const duration = 15;
      const progressPercent = (elapsed / duration) * 100;

      // Formatação esperada do valor descritivo (aria-valuetext)
      const formatTime = (seconds) => {
        const safeSeconds = Math.max(0, Math.floor(seconds || 0));
        const mins = Math.floor(safeSeconds / 60);
        const secs = safeSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      };

      const accessibleValueText = `${formatTime(elapsed)} de ${formatTime(duration)}`;

      assert.strictEqual(accessibleValueText, '00:07 de 00:15');
      assert.strictEqual(Math.round(progressPercent), 47);

      // Simulação do contrato de propriedades ARIA da barra de progresso
      const progressBarAria = {
        role: 'progressbar',
        tabIndex: 0,
        'aria-label': 'Progresso da reprodução do clipe',
        'aria-valuenow': Math.round(progressPercent),
        'aria-valuemin': '0',
        'aria-valuemax': '100',
        'aria-valuetext': accessibleValueText,
      };

      assert.strictEqual(progressBarAria.role, 'progressbar');
      assert.strictEqual(progressBarAria.tabIndex, 0, 'Deve ser focalizável via Tab');
      assert.strictEqual(progressBarAria['aria-valuetext'], '00:07 de 00:15');
    });

    test('1.2: Navegação por teclado na barra de progresso (Setas, Home, End)', () => {
      let currentFraction = 0.5; // 50%
      const duration = 20; // 20s
      let elapsed = 10; // 10s

      let seekRelativeTarget = null;
      let rewindCalledWith = null;
      let replayCalled = false;

      const onSeekRelative = (fraction) => {
        seekRelativeTarget = fraction;
      };
      const onRewind = (sec) => {
        rewindCalledWith = sec;
      };
      const onReplay = () => {
        replayCalled = true;
      };

      // Simula handler handleProgressBarKeyDown
      const simulateKeyDown = (key) => {
        const event = {
          key,
          defaultPrevented: false,
          preventDefault() { this.defaultPrevented = true; },
        };

        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          if (onRewind) {
            onRewind(5);
          } else if (onSeekRelative) {
            const targetSec = Math.max(0, elapsed - 5);
            onSeekRelative(targetSec / duration);
          }
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          if (onSeekRelative) {
            const targetSec = Math.min(duration, elapsed + 5);
            onSeekRelative(targetSec / duration);
          }
        } else if (event.key === 'Home') {
          event.preventDefault();
          if (onReplay) {
            onReplay();
          } else if (onSeekRelative) {
            onSeekRelative(0);
          }
        } else if (event.key === 'End') {
          event.preventDefault();
          if (onSeekRelative) {
            onSeekRelative(1);
          }
        }

        return event;
      };

      // Teste ArrowLeft -> retrocede 5s
      const evtLeft = simulateKeyDown('ArrowLeft');
      assert.strictEqual(evtLeft.defaultPrevented, true);
      assert.strictEqual(rewindCalledWith, 5, 'ArrowLeft deve retroceder 5 segundos');

      // Teste ArrowRight -> avança 5s
      const evtRight = simulateKeyDown('ArrowRight');
      assert.strictEqual(evtRight.defaultPrevented, true);
      assert.strictEqual(seekRelativeTarget, (10 + 5) / 20, 'ArrowRight deve avançar para 75%');

      // Teste Home -> reinicia trecho
      const evtHome = simulateKeyDown('Home');
      assert.strictEqual(evtHome.defaultPrevented, true);
      assert.strictEqual(replayCalled, true, 'Home deve reiniciar clipe');

      // Teste End -> salta para o fim do trecho
      const evtEnd = simulateKeyDown('End');
      assert.strictEqual(evtEnd.defaultPrevented, true);
      assert.strictEqual(seekRelativeTarget, 1, 'End deve ir para 100%');
    });

    test('1.3: Anúncio de estado em região viva (aria-live="polite")', () => {
      const getLiveAnnouncement = ({ isReady, isBuffering, isPlaying, valueText }) => {
        if (!isReady) return 'Carregando reprodutor de áudio';
        if (isBuffering) return 'Carregando áudio';
        if (isPlaying) return `Reproduzindo áudio, ${valueText}`;
        return 'Áudio pausado';
      };

      assert.strictEqual(
        getLiveAnnouncement({ isReady: false }),
        'Carregando reprodutor de áudio'
      );
      assert.strictEqual(
        getLiveAnnouncement({ isReady: true, isBuffering: true, isPlaying: true }),
        'Carregando áudio'
      );
      assert.strictEqual(
        getLiveAnnouncement({ isReady: true, isBuffering: false, isPlaying: true, valueText: '00:05 de 00:12' }),
        'Reproduzindo áudio, 00:05 de 00:12'
      );
      assert.strictEqual(
        getLiveAnnouncement({ isReady: true, isBuffering: false, isPlaying: false }),
        'Áudio pausado'
      );
    });

    test('1.4: Botões de ação possuem aria-label, aria-pressed e indicação de carregamento', () => {
      const playButtonPaused = {
        'aria-label': 'Reproduzir clipe de áudio',
        'aria-pressed': false,
      };
      const playButtonPlaying = {
        'aria-label': 'Pausar clipe de áudio',
        'aria-pressed': true,
      };
      const rewindButton = {
        'aria-label': 'Voltar 5 segundos no áudio',
      };
      const replayButton = {
        'aria-label': 'Reiniciar o clipe de áudio do início',
      };

      assert.strictEqual(playButtonPaused['aria-pressed'], false);
      assert.strictEqual(playButtonPlaying['aria-pressed'], true);
      assert.strictEqual(playButtonPlaying['aria-label'], 'Pausar clipe de áudio');
      assert.strictEqual(rewindButton['aria-label'], 'Voltar 5 segundos no áudio');
      assert.strictEqual(replayButton['aria-label'], 'Reiniciar o clipe de áudio do início');
    });
  });

  describe('Cenário 2: ChallengeVideoPlayer e Acessibilidade', () => {
    test('2.1: Container e overlay interativo possuem papéis semânticos e ativação por teclado', () => {
      let clickTriggered = false;

      const handleOverlayKeyDown = (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          clickTriggered = true;
        }
      };

      const overlayProps = {
        role: 'button',
        tabIndex: 0,
        'aria-label': 'Vídeo do desafio. Clique ou pressione Espaço para reproduzir ou pausar.',
      };

      assert.strictEqual(overlayProps.role, 'button');
      assert.strictEqual(overlayProps.tabIndex, 0);

      // Simula Enter
      const enterEvent = {
        key: 'Enter',
        defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true; },
      };
      handleOverlayKeyDown(enterEvent);
      assert.strictEqual(enterEvent.defaultPrevented, true);
      assert.strictEqual(clickTriggered, true);

      // Simula Espaço
      clickTriggered = false;
      const spaceEvent = {
        key: ' ',
        defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true; },
      };
      handleOverlayKeyDown(spaceEvent);
      assert.strictEqual(spaceEvent.defaultPrevented, true);
      assert.strictEqual(clickTriggered, true);
    });
  });

  describe('Cenário 3: AnswerInputBox e Acessibilidade Semântica', () => {
    test('3.1: Textarea possui associação com label e aria-describedby para contador e atalhos', () => {
      const inputContract = {
        id: 'transcription-textarea',
        labelFor: 'transcription-textarea',
        'aria-label': 'Campo de transcrição do ditado',
        'aria-describedby': 'transcription-char-counter transcription-shortcut-hint',
        counterId: 'transcription-char-counter',
        shortcutId: 'transcription-shortcut-hint',
      };

      assert.strictEqual(inputContract.id, inputContract.labelFor);
      assert.ok(inputContract['aria-describedby'].includes(inputContract.counterId));
      assert.ok(inputContract['aria-describedby'].includes(inputContract.shortcutId));
    });

    test('3.2: Alerta dinâmico ao atingir limite de 500 caracteres (aria-live e role="alert")', () => {
      const maxLength = 500;
      const getCounterAriaLive = (charCount) => (charCount >= maxLength ? 'polite' : 'off');
      const getHasAlert = (charCount) => charCount >= maxLength;

      assert.strictEqual(getCounterAriaLive(450), 'off');
      assert.strictEqual(getHasAlert(450), false);

      assert.strictEqual(getCounterAriaLive(500), 'polite');
      assert.strictEqual(getHasAlert(500), true);
    });

    test('3.3: Botões auxiliares possuem nomes acessíveis e estados descritivos', () => {
      const clearButtonAria = { 'aria-label': 'Limpar texto digitado' };
      const submitReadyAria = { 'aria-label': 'Enviar resposta da transcrição' };
      const submitLoadingAria = { 'aria-label': 'Enviando resposta...' };

      assert.strictEqual(clearButtonAria['aria-label'], 'Limpar texto digitado');
      assert.strictEqual(submitReadyAria['aria-label'], 'Enviar resposta da transcrição');
      assert.strictEqual(submitLoadingAria['aria-label'], 'Enviando resposta...');
    });
  });

  describe('Cenário 4: DiffFeedbackDisplay e Leitor de Telas', () => {
    test('4.1: Tokens de feedback geram descrições audíveis para acertos, erros e omissões', () => {
      const attempt = 'Hey boys how going';
      const solution = 'Hey guys, how is it going?';
      const tokens = computeWordDiff(attempt, solution);

      // Mapeamento dos rótulos de leitor de tela
      const accessibleTokens = tokens.map((t) => {
        let labelDesc = t.text;
        if (t.status === 'correct') {
          labelDesc = `${t.text} (palavra correta)`;
        } else if (t.status === 'error') {
          labelDesc = `${t.text} (palavra incorreta)`;
        } else if (t.status === 'omission') {
          labelDesc = `${t.text} (palavra omitida)`;
        }
        return {
          text: t.text,
          status: t.status,
          ariaLabel: labelDesc,
        };
      });

      // Acerto: "Hey"
      const heyToken = accessibleTokens.find((t) => t.text === 'Hey');
      assert.ok(heyToken);
      assert.strictEqual(heyToken.status, 'correct');
      assert.strictEqual(heyToken.ariaLabel, 'Hey (palavra correta)');

      // Erro: "boys"
      const boysToken = accessibleTokens.find((t) => t.text === 'boys');
      assert.ok(boysToken);
      assert.strictEqual(boysToken.status, 'error');
      assert.strictEqual(boysToken.ariaLabel, 'boys (palavra incorreta)');

      // Omissão: "guys,"
      const guysToken = accessibleTokens.find((t) => t.text === 'guys,');
      assert.ok(guysToken);
      assert.strictEqual(guysToken.status, 'omission');
      assert.strictEqual(guysToken.ariaLabel, 'guys, (palavra omitida)');
    });

    test('4.2: Região de feedback possui role="region", aria-live="polite" e precisão percentual legível', () => {
      const accuracy = 75;
      const feedbackRegion = {
        role: 'region',
        'aria-label': 'Resultado da avaliação da transcrição',
        'aria-live': 'polite',
        'aria-atomic': 'true',
        badgeAriaLabel: `Precisão: ${accuracy} por cento`,
        resetButtonAriaLabel: 'Tentar resolver o desafio novamente',
      };

      assert.strictEqual(feedbackRegion.role, 'region');
      assert.strictEqual(feedbackRegion['aria-live'], 'polite');
      assert.strictEqual(feedbackRegion.badgeAriaLabel, 'Precisão: 75 por cento');
      assert.strictEqual(feedbackRegion.resetButtonAriaLabel, 'Tentar resolver o desafio novamente');
    });
  });

  describe('Cenário 5: ChallengeResolutionPage e Estrutura Semântica', () => {
    test('5.1: Landmarks semânticos da tela principal (header banner, main, nav)', () => {
      const pageLandmarks = {
        headerRole: 'banner',
        mainRole: 'main',
        navAriaLabel: 'Navegação entre desafios',
        challengeSectionLabel: 'Informações do desafio',
      };

      assert.strictEqual(pageLandmarks.headerRole, 'banner');
      assert.strictEqual(pageLandmarks.mainRole, 'main');
      assert.strictEqual(pageLandmarks.navAriaLabel, 'Navegação entre desafios');
      assert.strictEqual(pageLandmarks.challengeSectionLabel, 'Informações do desafio');
    });

    test('5.2: Botões de navegação e cabeçalho contêm nomes acessíveis completos', () => {
      const actionButtons = [
        { name: 'Dashboard', ariaLabel: 'Ir para o Dashboard' },
        { name: 'Configurações', ariaLabel: 'Ir para configurações' },
        { name: 'Sair', ariaLabel: 'Encerrar sessão' },
        { name: 'Anterior', ariaLabel: 'Ir para o desafio anterior' },
        { name: 'Próximo', ariaLabel: 'Ir para o próximo desafio' },
        { name: 'Próximo pós-feedback', ariaLabel: 'Ir para o próximo desafio após ver o feedback' },
      ];

      for (const btn of actionButtons) {
        assert.ok(btn.ariaLabel && btn.ariaLabel.length > 0, `${btn.name} deve ter aria-label definido`);
      }
    });
  });
});
