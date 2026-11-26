/**
 * Suíte de Testes da US SCRUM-93 / SCRUM-160 / SCRUM-161 — Integração Frontend da Correção.
 * Valida consumo do payload de correção (diff, accuracy_percentage, words_correct, words_total)
 * e suporte aos status 'correct', 'incorrect' e 'missing' em DiffFeedbackDisplay.jsx.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const diffDisplaySource = fs.readFileSync(
  path.resolve(__dirname, '../src/components/DiffFeedbackDisplay.jsx'),
  'utf-8'
);
const challengePageSource = fs.readFileSync(
  path.resolve(__dirname, '../src/pages/ChallengeResolutionPage.jsx'),
  'utf-8'
);

describe('SCRUM-93 / SCRUM-160 / SCRUM-161 - Exibição de Correção do Backend', () => {
  test('DiffFeedbackDisplay suporta status backend (correct, incorrect, missing) e props de acurácia', () => {
    assert.ok(diffDisplaySource.includes("token.status === 'incorrect'"));
    assert.ok(diffDisplaySource.includes("token.status === 'missing'"));
    assert.ok(diffDisplaySource.includes('accuracyPercentage'));
    assert.ok(diffDisplaySource.includes('wordsCorrect'));
    assert.ok(diffDisplaySource.includes('wordsTotal'));
  });

  test('ChallengeResolutionPage armazena correctionResult do /submit e repassa para DiffFeedbackDisplay', () => {
    assert.ok(challengePageSource.includes('correctionResult'));
    assert.ok(challengePageSource.includes('accuracy_percentage'));
    assert.ok(challengePageSource.includes('tokens={correctionResult?.diff || null}'));
    assert.ok(challengePageSource.includes('accuracyPercentage={correctionResult?.accuracy_percentage ?? null}'));
  });

  test('Contrato de renderização de tokens backend calcula contagens e precisão corretamente', () => {
    const backendResponse = {
      accuracy_percentage: 66.67,
      words_total: 6,
      words_correct: 4,
      edit_distance: 2,
      diff: [
        { word: 'i', expected: 'i', status: 'correct' },
        { word: 'like', expected: 'love', status: 'incorrect' },
        { word: 'learning', expected: 'learning', status: 'correct' },
        { word: 'english', expected: 'english', status: 'correct' },
        { word: null, expected: 'every', status: 'missing' },
        { word: 'day', expected: 'day', status: 'correct' },
      ],
    };

    const correctTokens = backendResponse.diff.filter((t) => t.status === 'correct');
    const incorrectTokens = backendResponse.diff.filter((t) => t.status === 'incorrect');
    const missingTokens = backendResponse.diff.filter((t) => t.status === 'missing');

    assert.strictEqual(correctTokens.length, 4);
    assert.strictEqual(incorrectTokens.length, 1);
    assert.strictEqual(incorrectTokens[0].expected, 'love');
    assert.strictEqual(missingTokens.length, 1);
    assert.strictEqual(missingTokens[0].expected, 'every');
    assert.strictEqual(backendResponse.accuracy_percentage, 66.67);
  });
});
