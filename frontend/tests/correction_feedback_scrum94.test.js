/**
 * Suíte de Testes da US SCRUM-94 / SCRUM-189 / SCRUM-190 — Feedback Visual de Correção.
 * Valida convenção cromática (verde, vermelho, âmbar), banner 100%, tooltips interativos,
 * layout responsivo em 2 colunas (grid-cols-1 md:grid-cols-2) e garantia Zero-Cheat no frontend.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const panelSource = fs.readFileSync(
  path.resolve(__dirname, '../src/components/CorrectionFeedbackPanel.jsx'),
  'utf-8'
);
const challengePageSource = fs.readFileSync(
  path.resolve(__dirname, '../src/pages/ChallengeResolutionPage.jsx'),
  'utf-8'
);

describe('SCRUM-94 / SCRUM-189 / SCRUM-190 - CorrectionFeedbackPanel e Zero-Cheat UI', () => {
  test('Cenário 1 & 3 & 4: Convenção cromática (verde, vermelho, âmbar) e seções Sua Transcrição / Gabarito Oficial', () => {
    assert.ok(panelSource.includes('bg-green-100 text-green-700'));
    assert.ok(panelSource.includes('bg-red-100 text-red-700'));
    assert.ok(panelSource.includes('bg-amber-100 text-amber-700'));
    assert.ok(panelSource.includes('Sua Transcrição'));
    assert.ok(panelSource.includes('Gabarito Oficial'));
    assert.ok(panelSource.includes('role="tooltip"'));
    assert.ok(panelSource.includes('activeTooltipIndex'));
  });

  test('Cenário 2: Banner de congratulações com ícone de sucesso para submissão 100% perfeita', () => {
    assert.ok(panelSource.includes('showPerfectBanner'));
    assert.ok(panelSource.includes('Transcrição 100% perfeita'));
    assert.ok(panelSource.includes('Award'));
  });

  test('Cenário 5: Garantia de não divulgação prévia de gabarito fixo em ChallengeResolutionPage', () => {
    assert.strictEqual(challengePageSource.includes('sampleSolution'), false);
    assert.strictEqual(challengePageSource.includes('Hey guys, how is it going?'), false);
    assert.ok(challengePageSource.includes('CorrectionFeedbackPanel'));
  });

  test('Cenário 6: Layout responsivo em 2 colunas no desktop e empilhado verticalmente no mobile (< 768px)', () => {
    assert.ok(panelSource.includes('grid grid-cols-1 md:grid-cols-2'));
    assert.ok(panelSource.includes('min-w-0'));
    assert.ok(panelSource.includes('break-words'));
  });
});
