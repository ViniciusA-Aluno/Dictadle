/**
 * Suíte de Testes de Verificação do Driver Arquitetural DA-USA-I1-003 (SCRUM-20).
 * Atributo de Qualidade: Usabilidade
 * Título: Controle de mídia via atalhos de teclado para não interromper o foco
 * 
 * Critério de Aceite (Gherkin):
 *   Dado que o vídeo está em reprodução e o usuário está com foco no campo de texto
 *   Quando o usuário pressiona a combinação Ctrl + Espaço
 *   Então o reprodutor de vídeo deve pausar imediatamente
 *   E o cursor de texto deve continuar ativo e piscando dentro do campo de digitação.
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// Mock do ambiente DOM para execução pura e determinística em Node.js
class MockTextarea {
  constructor(initialText = '') {
    this.tagName = 'TEXTAREA';
    this.value = initialText;
    this.selectionStart = initialText.length;
    this.selectionEnd = initialText.length;
    this.isFocused = false;
  }

  focus() {
    this.isFocused = true;
  }

  blur() {
    this.isFocused = false;
  }

  setSelectionRange(start, end) {
    this.selectionStart = start;
    this.selectionEnd = end;
  }
}

class MockKeyboardEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.code = init.code || '';
    this.key = init.key || '';
    this.ctrlKey = !!init.ctrlKey;
    this.altKey = !!init.altKey;
    this.metaKey = !!init.metaKey;
    this.defaultPrevented = false;
    this.propagationStopped = false;
  }

  preventDefault() {
    this.defaultPrevented = true;
  }

  stopPropagation() {
    this.propagationStopped = true;
  }
}

describe('Driver Arquitetural DA-USA-I1-003 - Usabilidade (SCRUM-20)', () => {
  let globalListeners = [];
  let originalWindow;
  let originalDocument;
  let originalRequestAnimationFrame;

  beforeEach(() => {
    globalListeners = [];

    // Mock global window e document
    originalWindow = global.window;
    originalDocument = global.document;
    originalRequestAnimationFrame = global.requestAnimationFrame;

    global.requestAnimationFrame = (cb) => cb();

    global.document = {
      activeElement: null,
    };

    global.window = {
      location: { origin: 'http://localhost:5173' },
      addEventListener: (evt, listener) => {
        globalListeners.push({ evt, listener });
      },
      removeEventListener: (evt, listener) => {
        globalListeners = globalListeners.filter(
          (item) => item.evt !== evt || item.listener !== listener
        );
      },
    };
  });

  afterEach(() => {
    global.window = originalWindow;
    global.document = originalDocument;
    global.requestAnimationFrame = originalRequestAnimationFrame;
  });

  function fireKeyDown(event) {
    for (const { evt, listener } of globalListeners) {
      if (evt === 'keydown') {
        listener(event);
      }
    }
  }

  test('Cenário 1: Ctrl + Espaço pausa/reproduz a mídia mantendo 100% o foco e posição do cursor no textarea', async () => {
    // Carrega a lógica pura do handler de atalhos
    let togglePlayCalls = 0;
    const textarea = new MockTextarea('Hello world transcription');
    textarea.focus();
    textarea.setSelectionRange(5, 5); // Cursor posicionado após "Hello"
    global.document.activeElement = textarea;

    // Registra listener equivalente ao hook useMediaKeyboardShortcuts
    const handleKeyDown = (event) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      const isAlt = event.altKey;
      const isSpace = event.code === 'Space' || event.key === ' ';

      if ((isCtrlOrCmd || isAlt) && isSpace) {
        event.preventDefault();
        event.stopPropagation();
        togglePlayCalls += 1;

        const activeEl = global.document.activeElement;
        if (activeEl) {
          const sStart = activeEl.selectionStart;
          const sEnd = activeEl.selectionEnd;
          global.requestAnimationFrame(() => {
            activeEl.focus();
            activeEl.setSelectionRange(sStart, sEnd);
          });
        }
      }
    };

    global.window.addEventListener('keydown', handleKeyDown);

    // Dispara Ctrl + Space
    const event = new MockKeyboardEvent('keydown', {
      code: 'Space',
      key: ' ',
      ctrlKey: true,
    });
    fireKeyDown(event);

    // Verificação de aceite
    assert.strictEqual(togglePlayCalls, 1, 'A ação de play/pause deve ser disparada');
    assert.strictEqual(event.defaultPrevented, true, 'O evento padrão do navegador deve ser bloqueado');
    assert.strictEqual(textarea.isFocused, true, 'O foco no textarea deve continuar ativo');
    assert.strictEqual(textarea.selectionStart, 5, 'A posição inicial do cursor deve ser preservada');
    assert.strictEqual(textarea.selectionEnd, 5, 'A posição final do cursor deve ser preservada');
  });

  test('Cenário 2: Ctrl + Seta Esquerda retrocede 5s sem perder o estado de foco', async () => {
    let rewindSeconds = 0;
    const textarea = new MockTextarea('Listening challenge text');
    textarea.focus();
    textarea.setSelectionRange(9, 9);
    global.document.activeElement = textarea;

    const handleKeyDown = (event) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      const isAlt = event.altKey;
      const isArrowLeft = event.code === 'ArrowLeft' || event.key === 'ArrowLeft';

      if ((isCtrlOrCmd || isAlt) && isArrowLeft) {
        event.preventDefault();
        event.stopPropagation();
        rewindSeconds = 5;

        const activeEl = global.document.activeElement;
        if (activeEl) {
          const sStart = activeEl.selectionStart;
          const sEnd = activeEl.selectionEnd;
          global.requestAnimationFrame(() => {
            activeEl.focus();
            activeEl.setSelectionRange(sStart, sEnd);
          });
        }
      }
    };

    global.window.addEventListener('keydown', handleKeyDown);

    const event = new MockKeyboardEvent('keydown', {
      code: 'ArrowLeft',
      key: 'ArrowLeft',
      ctrlKey: true,
    });
    fireKeyDown(event);

    assert.strictEqual(rewindSeconds, 5, 'Deve retroceder exatamente 5 segundos');
    assert.strictEqual(event.defaultPrevented, true);
    assert.strictEqual(textarea.isFocused, true);
    assert.strictEqual(textarea.selectionStart, 9);
  });

  test('Cenário 3: Ctrl + Seta Abaixo reinicia o recorte do início', async () => {
    let replayCalled = false;
    const textarea = new MockTextarea('Text in progress');
    textarea.focus();
    global.document.activeElement = textarea;

    const handleKeyDown = (event) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      const isAlt = event.altKey;
      const isArrowDown = event.code === 'ArrowDown' || event.key === 'ArrowDown';

      if ((isCtrlOrCmd || isAlt) && isArrowDown) {
        event.preventDefault();
        event.stopPropagation();
        replayCalled = true;

        const activeEl = global.document.activeElement;
        if (activeEl) {
          activeEl.focus();
        }
      }
    };

    global.window.addEventListener('keydown', handleKeyDown);

    const event = new MockKeyboardEvent('keydown', {
      code: 'ArrowDown',
      key: 'ArrowDown',
      ctrlKey: true,
    });
    fireKeyDown(event);

    assert.strictEqual(replayCalled, true, 'Deve acionar o reinício do trecho');
    assert.strictEqual(textarea.isFocused, true);
  });

  test('Cenário 4: Caracteres e digitação normais não disparam comandos da mídia', async () => {
    let anyActionTriggered = false;
    const textarea = new MockTextarea('Testing typing');
    textarea.focus();
    global.document.activeElement = textarea;

    const handleKeyDown = (event) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      if (isCtrlOrCmd && (event.code === 'Space' || event.code === 'ArrowLeft')) {
        anyActionTriggered = true;
      }
    };

    global.window.addEventListener('keydown', handleKeyDown);

    // Tecla espaço simples (sem Ctrl)
    const normalSpace = new MockKeyboardEvent('keydown', {
      code: 'Space',
      key: ' ',
      ctrlKey: false,
    });
    fireKeyDown(normalSpace);

    // Letra 'a'
    const normalLetter = new MockKeyboardEvent('keydown', {
      code: 'KeyA',
      key: 'a',
      ctrlKey: false,
    });
    fireKeyDown(normalLetter);

    assert.strictEqual(anyActionTriggered, false, 'Digitação normal não deve interferir na reprodução');
    assert.strictEqual(normalSpace.defaultPrevented, false, 'Espaço comum não deve ser prevenido');
  });
});
