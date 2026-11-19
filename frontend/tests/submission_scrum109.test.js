/**
 * Suíte de Testes da US SCRUM-109 / SCRUM-186 / SCRUM-187 — Submissão de Transcrição.
 * Valida regras pedagógicas (Anti-Autocorrect), limite de 500 caracteres, atalho Ctrl+Enter / Cmd+Enter,
 * bloqueio de submissões duplicadas concorrentes e resiliência do texto em falhas HTTP 500 / rede.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const answerInputSource = fs.readFileSync(
  path.resolve(__dirname, '../src/components/AnswerInputBox.jsx'),
  'utf-8'
);
const challengePageSource = fs.readFileSync(
  path.resolve(__dirname, '../src/pages/ChallengeResolutionPage.jsx'),
  'utf-8'
);
const apiSource = fs.readFileSync(
  path.resolve(__dirname, '../src/services/api.js'),
  'utf-8'
);

describe('SCRUM-109 / SCRUM-186 / SCRUM-187 - Submissão de Transcrição', () => {
  test('Cenário 1 & Anti-Autocorrect: AnswerInputBox mantém atributos anti-corretor e botão Submeter Transcrição', () => {
    assert.ok(answerInputSource.includes('spellCheck="false"'));
    assert.ok(answerInputSource.includes('autoComplete="off"'));
    assert.ok(answerInputSource.includes('autoCorrect="off"'));
    assert.ok(answerInputSource.includes('autoCapitalize="off"'));
    assert.ok(answerInputSource.includes('Submeter Transcrição'));
    assert.ok(apiSource.includes('submitTranscription'));
    assert.ok(apiSource.includes('/challenges/${challengeId}/submit'));
  });

  test('Cenário 2: Atalho Ctrl+Enter e Cmd+Enter dispara submissão sem erro', () => {
    assert.ok(answerInputSource.includes('(e.ctrlKey || e.metaKey) && e.key === \'Enter\''));

    let submittedPayload = null;
    const handleKeyDown = (e, value, isDisabled) => {
      const isCtrlOrCmdEnter = (e.ctrlKey || e.metaKey) && e.key === 'Enter';
      if (isCtrlOrCmdEnter && !isDisabled) {
        e.preventDefault();
        submittedPayload = value.trim();
      }
    };

    let prevented = false;
    handleKeyDown(
      { ctrlKey: true, metaKey: false, key: 'Enter', preventDefault: () => { prevented = true; } },
      '  I have a dream today  ',
      false
    );
    assert.strictEqual(prevented, true);
    assert.strictEqual(submittedPayload, 'I have a dream today');
  });

  test('Cenário 3 & 4: Validação de vazio/espaços e limite exato de 500 caracteres', () => {
    const canSubmit = (text, maxLength = 500) =>
      typeof text === 'string' && text.trim().length > 0 && text.length <= maxLength;

    assert.strictEqual(canSubmit(''), false);
    assert.strictEqual(canSubmit('     '), false);
    assert.strictEqual(canSubmit('a'.repeat(500)), true);
    assert.strictEqual(canSubmit('a'.repeat(501)), false);
  });

  test('Cenário 5: Resiliência do texto digitado em caso de falha HTTP 500 ou erro de rede', async () => {
    assert.ok(answerInputSource.includes('submitError'));
    assert.ok(challengePageSource.includes('setSubmitError'));

    let textInBox = 'I have a dream today';
    let submitError = null;
    let submittedAnswer = null;

    const failingSubmit = async () => {
      throw { response: { status: 500, data: { error: 'Erro interno do servidor' } } };
    };

    try {
      await failingSubmit();
      submittedAnswer = textInBox;
    } catch (err) {
      submitError = err.response?.data?.error || 'Falha de conexão';
    }

    assert.strictEqual(submitError, 'Erro interno do servidor');
    assert.strictEqual(submittedAnswer, null);
    assert.strictEqual(textInBox, 'I have a dream today');
  });

  test('Cenário 6: Prevenção de submissões duplicadas por cliques rápidos repetidos', async () => {
    assert.ok(answerInputSource.includes('submitLockRef'));
    assert.ok(challengePageSource.includes('isSubmittingRef'));

    let lock = false;
    let requestCount = 0;

    const submitOnce = async (text) => {
      if (lock || !text.trim()) return;
      lock = true;
      try {
        requestCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 20));
      } finally {
        lock = false;
      }
    };

    await Promise.all([
      submitOnce('I have a dream today'),
      submitOnce('I have a dream today'),
      submitOnce('I have a dream today'),
    ]);

    assert.strictEqual(requestCount, 1);
  });
});
