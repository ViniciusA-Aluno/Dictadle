/**
 * Suíte de Testes da Task SCRUM-195 — Acessibilidade e Suporte a Tecnologias Assistivas.
 * Valida os 4 cenários Gherkin:
 * - Cenário 1: Navegação sequencial por teclado, skip link, landmarks HTML5 e :focus-visible.
 * - Cenário 2: Anúncio sonoro automático via região aria-live="polite" / aria-atomic="true".
 * - Cenário 3: Controles semânticos nativos (<button>) sem <div role="button"> e com aria-label/aria-pressed.
 * - Cenário 4: Prevenção de armadilhas de foco (Esc fecha tooltip ativo) e aria-invalid/aria-describedby no input.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const readSrc = (rel) => fs.readFileSync(path.resolve(__dirname, '../src', rel), 'utf-8');

const videoPlayerSrc = readSrc('components/ChallengeVideoPlayer.jsx');
const playerControlsSrc = readSrc('components/PlayerControls.jsx');
const answerInputSrc = readSrc('components/AnswerInputBox.jsx');
const feedbackPanelSrc = readSrc('components/CorrectionFeedbackPanel.jsx');
const videoUnavailableSrc = readSrc('components/VideoUnavailableNotice.jsx');
const challengePageSrc = readSrc('pages/ChallengeResolutionPage.jsx');
const indexCssSrc = readSrc('index.css');

describe('SCRUM-195 - Acessibilidade e Suporte a Tecnologias Assistivas', () => {
  test('Cenário 1: Navegação sequencial por teclado, Skip Link, landmarks HTML5 e :focus-visible', () => {
    assert.ok(challengePageSrc.includes('href="#main-challenge-content"'));
    assert.ok(challengePageSrc.includes('id="main-challenge-content"'));
    assert.ok(challengePageSrc.includes('<nav aria-label="Navegação principal"'));
    assert.ok(challengePageSrc.includes('<header'));
    assert.ok(challengePageSrc.includes('<main'));
    assert.ok(indexCssSrc.includes(':focus-visible'));

    // Nenhum tabIndex positivo que quebre a ordem lógica de tabulação
    for (const src of [videoPlayerSrc, playerControlsSrc, answerInputSrc, feedbackPanelSrc, challengePageSrc]) {
      assert.strictEqual(/tabIndex=\{?[1-9]/.test(src), false);
    }
  });

  test('Cenário 2: Região dinâmica aria-live anuncia automaticamente acurácia e erros/omissões', () => {
    assert.ok(feedbackPanelSrc.includes('aria-live="polite"'));
    assert.ok(feedbackPanelSrc.includes('aria-atomic="true"'));
    assert.ok(feedbackPanelSrc.includes('liveAnnouncement'));
    assert.ok(feedbackPanelSrc.includes('Palavras incorretas:'));
    assert.ok(feedbackPanelSrc.includes('Palavras omitidas:'));
  });

  test('Cenário 3: Controles do player usam elementos semânticos HTML5 (<button>/<section>) sem <div role="button">', () => {
    assert.strictEqual(videoPlayerSrc.includes('role="button"'), false);
    assert.ok(videoPlayerSrc.includes('<section'));
    assert.ok(videoPlayerSrc.includes('<button'));
    assert.ok(videoPlayerSrc.includes('aria-pressed={isPlaying}'));
    assert.ok(playerControlsSrc.includes('<section'));
    assert.ok(playerControlsSrc.includes('aria-label={isPlaying ? \'Pausar clipe de áudio\' : \'Reproduzir clipe de áudio\'}'));
    assert.ok(playerControlsSrc.includes('aria-label="Voltar 5 segundos no áudio"'));
    assert.ok(playerControlsSrc.includes('aria-label="Reiniciar o clipe de áudio do início"'));
    assert.ok(videoUnavailableSrc.includes('<section'));
    assert.ok(videoUnavailableSrc.includes('role="alert"'));
  });

  test('Cenário 4: Prevenção de armadilhas de foco (Esc) e aria-invalid / aria-describedby no input', () => {
    assert.ok(feedbackPanelSrc.includes("e.key === 'Escape'"));
    assert.ok(answerInputSrc.includes('aria-invalid={Boolean(submitError)}'));
    assert.ok(answerInputSrc.includes('transcription-submit-error'));
    assert.ok(answerInputSrc.includes('<section'));
    assert.ok(answerInputSrc.includes('<label htmlFor="transcription-textarea"'));
  });
});
