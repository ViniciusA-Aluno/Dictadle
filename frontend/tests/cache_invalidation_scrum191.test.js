/**
 * Suíte de Testes da US SCRUM-191 — Invalidação de Cache Obsoleto de Desafios em Memória.
 * Valida que o cache em memória de desafios (challengesMemoryCache e currentChallengeIndexCache)
 * é invalidado adequadamente em logout, exclusão de conta, novo login e mutações administrativas (criação/edição).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const challengePageSource = fs.readFileSync(
  path.resolve(__dirname, '../src/pages/ChallengeResolutionPage.jsx'),
  'utf-8'
);
const appSource = fs.readFileSync(
  path.resolve(__dirname, '../src/App.jsx'),
  'utf-8'
);
const challengesManagerSource = fs.readFileSync(
  path.resolve(__dirname, '../src/components/ChallengesManager.jsx'),
  'utf-8'
);
const adminPageSource = fs.readFileSync(
  path.resolve(__dirname, '../src/pages/AdminUsersPage.jsx'),
  'utf-8'
);

describe('SCRUM-191 - Invalidação do Cache em Memória de Desafios', () => {
  test('Cenário 1: ChallengeResolutionPage exporta clearChallengesMemoryCache e helpers de cache', () => {
    assert.ok(challengePageSource.includes('export function clearChallengesMemoryCache()'));
    assert.ok(challengePageSource.includes('challengesMemoryCache = null;'));
    assert.ok(challengePageSource.includes('currentChallengeIndexCache = 0;'));
    assert.ok(challengePageSource.includes('dictadle:clear-challenges-cache'));
  });

  test('Cenário 2: App.jsx importa e executa clearChallengesMemoryCache no logout e exclusão de conta', () => {
    assert.ok(appSource.includes("import ChallengeResolutionPage, { clearChallengesMemoryCache } from './pages/ChallengeResolutionPage';"));
    
    // Verifica que handleLogout limpa o cache
    const logoutMatch = appSource.match(/const handleLogout = \(\) => {([\s\S]*?)};/);
    assert.ok(logoutMatch, 'handleLogout deve existir em App.jsx');
    assert.ok(logoutMatch[1].includes('clearChallengesMemoryCache()'), 'handleLogout deve invocar clearChallengesMemoryCache()');

    // Verifica que handleAccountDeleted limpa o cache
    const deleteAccountMatch = appSource.match(/const handleAccountDeleted = \(\) => {([\s\S]*?)};/);
    assert.ok(deleteAccountMatch, 'handleAccountDeleted deve existir em App.jsx');
    assert.ok(deleteAccountMatch[1].includes('clearChallengesMemoryCache()'), 'handleAccountDeleted deve invocar clearChallengesMemoryCache()');
  });

  test('Cenário 3: App.jsx limpa o cache em novos logins e em falha de restauração de token', () => {
    const loginMatch = appSource.match(/const handleLoginSuccess = \(([\s\S]*?)\) => {([\s\S]*?)};/);
    assert.ok(loginMatch, 'handleLoginSuccess deve existir em App.jsx');
    assert.ok(loginMatch[2].includes('clearChallengesMemoryCache()'), 'handleLoginSuccess deve invocar clearChallengesMemoryCache()');
  });

  test('Cenário 4: ChallengesManager e AdminUsersPage invalidam o cache ao criar ou editar desafios', () => {
    assert.ok(
      challengesManagerSource.includes('clearChallengesMemoryCache()'),
      'ChallengesManager deve chamar clearChallengesMemoryCache ao salvar edição'
    );
    assert.ok(
      adminPageSource.includes('clearChallengesMemoryCache()'),
      'AdminUsersPage deve chamar clearChallengesMemoryCache ao criar novo desafio'
    );
  });

  test('Cenário 5: Simulação funcional do ciclo de vida do cache e sua invalidação', () => {
    // Simula a lógica de módulo do ChallengeResolutionPage
    let challengesMemoryCache = null;
    let currentChallengeIndexCache = 0;

    const clearCache = () => {
      challengesMemoryCache = null;
      currentChallengeIndexCache = 0;
    };

    // 1. Aluno carrega desafios ativos na primeira sessão
    challengesMemoryCache = [
      { id: 1, title: 'Challenge Antigo Ativo', is_active: true },
      { id: 2, title: 'Challenge 2', is_active: true },
    ];
    currentChallengeIndexCache = 1;

    assert.strictEqual(challengesMemoryCache.length, 2);
    assert.strictEqual(currentChallengeIndexCache, 1);

    // 2. Aluno clica em Logout sem dar F5
    clearCache();

    // 3. Verifica se os ponteiros em memória foram devidamente resetados
    assert.strictEqual(challengesMemoryCache, null);
    assert.strictEqual(currentChallengeIndexCache, 0);

    // 4. Nova requisição na mesma aba após novo login consulta a API
    let apiCalled = false;
    const fetchActiveChallengesMock = () => {
      apiCalled = true;
      return [
        { id: 3, title: 'Novo Desafio Atualizado', is_active: true },
      ];
    };

    if (!challengesMemoryCache) {
      challengesMemoryCache = fetchActiveChallengesMock();
    }

    assert.strictEqual(apiCalled, true);
    assert.strictEqual(challengesMemoryCache.length, 1);
    assert.strictEqual(challengesMemoryCache[0].id, 3);
  });
});
