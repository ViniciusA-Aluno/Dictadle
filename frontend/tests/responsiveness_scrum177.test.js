/**
 * Suíte de Testes da US SCRUM-177 / SCRUM-178 / SCRUM-179 / SCRUM-180 / SCRUM-181
 * Responsividade da Aplicação (Mobile-First, Breakpoints, Viewports e Ergonomia Touch).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const indexCssSource = fs.readFileSync(path.resolve(__dirname, '../src/index.css'), 'utf-8');
const challengeVideoPlayerSource = fs.readFileSync(path.resolve(__dirname, '../src/components/ChallengeVideoPlayer.jsx'), 'utf-8');
const playerControlsSource = fs.readFileSync(path.resolve(__dirname, '../src/components/PlayerControls.jsx'), 'utf-8');
const answerInputSource = fs.readFileSync(path.resolve(__dirname, '../src/components/AnswerInputBox.jsx'), 'utf-8');
const challengePageSource = fs.readFileSync(path.resolve(__dirname, '../src/pages/ChallengeResolutionPage.jsx'), 'utf-8');
const adminUsersPageSource = fs.readFileSync(path.resolve(__dirname, '../src/pages/AdminUsersPage.jsx'), 'utf-8');
const challengesManagerSource = fs.readFileSync(path.resolve(__dirname, '../src/components/ChallengesManager.jsx'), 'utf-8');
const editUserModalSource = fs.readFileSync(path.resolve(__dirname, '../src/components/EditUserModal.jsx'), 'utf-8');
const deleteUserModalSource = fs.readFileSync(path.resolve(__dirname, '../src/components/DeleteUserModal.jsx'), 'utf-8');
const loginPageSource = fs.readFileSync(path.resolve(__dirname, '../src/pages/LoginPage.jsx'), 'utf-8');

describe('SCRUM-177 - Responsividade da Aplicação (Mobile-First)', () => {
  test('SCRUM-178 / SCRUM-181: Prevenção de rolagem horizontal e suporte touch global no CSS', () => {
    assert.ok(indexCssSource.includes('overflow-x: hidden;'), 'index.css deve prevenir overflow-x horizontal');
    assert.ok(indexCssSource.includes('max-width: 100%;') || indexCssSource.includes('width: 100%;'), 'index.css deve conter largura fluida');
    assert.ok(indexCssSource.includes('-webkit-overflow-scrolling: touch;'), 'index.css deve ativar rolagem fluida touch');
  });

  test('SCRUM-179 / Cenário 1: Player de vídeo preserva proporção 16:9 (aspect-video) sem overflow', () => {
    assert.ok(challengeVideoPlayerSource.includes('aspect-video'), 'ChallengeVideoPlayer deve usar aspect-video');
    assert.ok(challengeVideoPlayerSource.includes('w-full'), 'ChallengeVideoPlayer deve ocupar 100% da largura útil');
    assert.ok(challengePageSource.includes('aspect-video'), 'Estado de loading e erro do clipe devem manter aspect-video');
  });

  test('SCRUM-179 / SCRUM-181: Ergonomia touch de controles de mídia com área mínima recomendada (44x44px)', () => {
    // Play / Pause button
    assert.ok(
      playerControlsSource.includes('min-w-[44px]') && playerControlsSource.includes('min-h-[44px]'),
      'Botão Play/Pause deve atender área mínima de toque de 44x44px'
    );
    // Retroceder e Replay
    assert.ok(
      playerControlsSource.includes('min-h-[44px]') && playerControlsSource.includes('Undo2'),
      'Botão Retroceder deve ter min-h de 44px'
    );
    assert.ok(
      playerControlsSource.includes('min-h-[44px]') && playerControlsSource.includes('RotateCcw'),
      'Botão Replay deve ter min-h de 44px'
    );
  });

  test('SCRUM-179 / Cenário 2: Campo de transcrição e botão de submissão confortáveis com teclado virtual', () => {
    // Submeter transcrição ocupa largura total no mobile para toque fácil
    assert.ok(
      answerInputSource.includes('w-full sm:w-auto'),
      'Botão de submissão deve se expandir em tela mobile'
    );
    assert.ok(
      answerInputSource.includes('min-h-[44px]'),
      'Botão de submissão deve possuir altura mínima touch de 44px'
    );
    // Rodapé se empilha em telas pequenas
    assert.ok(
      answerInputSource.includes('flex-col sm:flex-row'),
      'Rodapé do input deve empilhar em telas móveis'
    );
  });

  test('SCRUM-180 / Cenário 3: Modais e tabelas administrativas adaptados para telas móveis e tablets (< 768px)', () => {
    // Tabelas com overflow horizontal suave
    assert.ok(adminUsersPageSource.includes('overflow-x-auto'), 'Tabela de usuários deve ter overflow-x-auto');
    assert.ok(challengesManagerSource.includes('overflow-x-auto'), 'Tabela de desafios deve ter overflow-x-auto');

    // Modais com scroll interno controlado e limite de altura da viewport
    assert.ok(editUserModalSource.includes('max-h-[92vh]'), 'EditUserModal deve conter max-h para viewports curtas');
    assert.ok(editUserModalSource.includes('overflow-y-auto'), 'EditUserModal deve ter scroll interno suave');
    assert.ok(deleteUserModalSource.includes('max-h-[92vh]'), 'DeleteUserModal deve conter max-h para viewports curtas');
    assert.ok(deleteUserModalSource.includes('overflow-y-auto'), 'DeleteUserModal deve ter scroll interno suave');
  });

  test('SCRUM-178 / Cenário 4: Layout responsivo do cabeçalho, navegação e autenticação nos breakpoints', () => {
    // Header e padding fluido
    assert.ok(challengePageSource.includes('px-3.5 sm:px-6'), 'Cabeçalho deve usar padding adaptativo');
    assert.ok(challengePageSource.includes('min-w-[44px] min-h-[44px]'), 'Navegador de desafios deve ter botões touch de 44x44px');
    // Auth card adaptativo
    assert.ok(loginPageSource.includes('p-5 sm:p-8'), 'LoginPage deve compactar padding no mobile');
    assert.ok(loginPageSource.includes('p-3 sm:p-4'), 'LoginPage container deve evitar cortes laterais');
  });
});
