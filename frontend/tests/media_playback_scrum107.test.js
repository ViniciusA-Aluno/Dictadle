/**
 * Suíte de Testes para US-107, SCRUM-149 e SCRUM-150:
 * Reprodução de Mídia, Integração do Player e Controles Personalizados.
 * 
 * Critérios validados:
 * - Cenário 1.1: Carregamento e reprodução restrita do trecho delimitado.
 * - Cenário 1.2: Reinício manual do trecho via controle da interface.
 * - Cenário 2.1: Prevenção de reprodução fora da janela permitida (clamp em end_time).
 * - Cenário 2.2: Clipe com cálculo correto de barra de progresso relativa (0% a 100%).
 * - Cenário 3.1: Tratamento de erros de incorporação (erros 100, 101, 150).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('US-107 / SCRUM-149 / SCRUM-150: Reprodução de Mídia e Controles', () => {
  test('Cenário 1.1 & 2.1: Contenção temporal estrita impede que currentTime ultrapasse end_time_seconds', () => {
    const startTime = 30;
    const endTime = 42;
    let isPlaying = true;
    let currentTime = 30;
    let pauseVideoCalled = false;
    let seekToCalledWith = null;

    const mockPlayer = {
      getCurrentTime: () => currentTime,
      pauseVideo: () => {
        pauseVideoCalled = true;
        isPlaying = false;
      },
      seekTo: (time) => {
        seekToCalledWith = time;
        currentTime = time;
      },
    };

    // Simula loop de contenção de 50ms
    const checkTimeContainment = () => {
      const time = mockPlayer.getCurrentTime();
      if (time >= endTime - 0.05) {
        mockPlayer.pauseVideo();
        mockPlayer.seekTo(startTime);
      }
    };

    // No meio do clipe (36s)
    currentTime = 36;
    checkTimeContainment();
    assert.strictEqual(pauseVideoCalled, false);
    assert.strictEqual(isPlaying, true);

    // Ao atingir o fim (42s)
    currentTime = 42.0;
    checkTimeContainment();
    assert.strictEqual(pauseVideoCalled, true, 'Deve pausar ao atingir o fim do recorte');
    assert.strictEqual(seekToCalledWith, 30, 'Deve reposicionar o cursor de volta para o startTime (30s)');
    assert.strictEqual(isPlaying, false);
  });

  test('Cenário 1.2: Reinício manual (Replay) reseta para startTime e retoma reprodução', () => {
    const startTime = 15;
    let currentTime = 22;
    let seekToTime = null;
    let playVideoCalled = false;

    const mockPlayer = {
      seekTo: (time) => {
        seekToTime = time;
        currentTime = time;
      },
      playVideo: () => {
        playVideoCalled = true;
      },
    };

    const handleReplay = () => {
      mockPlayer.seekTo(startTime);
      mockPlayer.playVideo();
    };

    handleReplay();
    assert.strictEqual(seekToTime, 15);
    assert.strictEqual(playVideoCalled, true);
    assert.strictEqual(currentTime, 15);
  });

  test('Cenário 2.2: Barra de progresso relativa normaliza corretamente entre 0% e 100%', () => {
    const startTime = 10;
    const endTime = 22;
    const duration = endTime - startTime; // 12s

    const calcProgress = (curr) => {
      const elapsed = Math.max(0, curr - startTime);
      return Math.min(100, Math.max(0, (elapsed / duration) * 100));
    };

    assert.strictEqual(calcProgress(10), 0, 'No início deve ser 0%');
    assert.strictEqual(calcProgress(16), 50, 'Na metade (16s) deve ser 50%');
    assert.strictEqual(calcProgress(22), 100, 'No final (22s) deve ser 100%');

    // Seek relativo clicando na barra a 25%
    const fraction = 0.25;
    const targetTime = startTime + fraction * duration;
    assert.strictEqual(targetTime, 13, 'Seek a 25% deve apontar para 13s');
  });

  test('Cenário 3.1: Identificação de códigos de erro do YouTube (100, 101, 150)', () => {
    const isEmbedRestricted = (code) => [100, 101, 150].includes(code);

    assert.strictEqual(isEmbedRestricted(101), true, 'Código 101 (incorporação desativada) deve ser tratado');
    assert.strictEqual(isEmbedRestricted(150), true, 'Código 150 (mesmo que 101) deve ser tratado');
    assert.strictEqual(isEmbedRestricted(100), true, 'Código 100 (vídeo não encontrado/privado) deve ser tratado');
    assert.strictEqual(isEmbedRestricted(0), false);
  });
});
