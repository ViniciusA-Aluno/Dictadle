import React, { useState, useRef, useEffect } from 'react';
import { Send, Eraser, Loader2, AlertCircle } from 'lucide-react';

/**
 * AnswerInputBox Component (US-92 / SCRUM-146 / SCRUM-147 / SCRUM-17 / DA-USA-I1-001)
 * 
 * Regras implementadas:
 * - Acessibilidade semântica WAI-ARIA com label oculta, aria-label e aria-describedby.
 * - Limite de 500 caracteres com contador dinâmico e destaque visual de alerta (X / 500).
 * - Bloqueio de inserção de caracteres adicionais ao atingir 500 caracteres.
 * - Desativação de corretores automáticos (spellCheck=false, autoComplete=off, autoCorrect=off).
 * - Atalho de teclado: tecla Enter submete imediatamente (Shift+Enter permite quebra de linha).
 * - Botão de submissão desabilitado para respostas vazias ou apenas espaços (trim().length === 0).
 * - Estado disabled e indicador de loading durante a submissão.
 * - Foco automático inicial e botão rápido de "Limpar texto" acessível para leitores de tela.
 */
export default function AnswerInputBox({
  onSubmit,
  isSubmitting = false,
  disabled = false,
  submitError = null,
  maxLength = 500,
  placeholder = "Digite aqui a transcrição do áudio que você ouviu...",
  autoFocus = true,
  inputRef = null,
}) {
  const [value, setValue] = useState('');
  const internalRef = useRef(null);
  const submitLockRef = useRef(false);
  const textareaRef = inputRef || internalRef;

  // Auto-foco ao montar o componente
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Libera a trava síncrona quando isSubmitting retorna para false
  useEffect(() => {
    if (!isSubmitting) {
      submitLockRef.current = false;
    }
  }, [isSubmitting]);

  const charCount = value.length;
  const isLimitReached = charCount >= maxLength;
  const isEmptyOrWhitespace = value.trim().length === 0;
  const isSubmitDisabled = isSubmitting || disabled || isEmptyOrWhitespace;

  const handleChange = (e) => {
    const nextVal = e.target.value;
    if (nextVal.length <= maxLength) {
      setValue(nextVal);
    }
  };

  const handleKeyDown = (e) => {
    // Suporte a Ctrl+Enter / Cmd+Enter (SCRUM-109) e Enter sem Shift (US-92)
    const isCtrlOrCmdEnter = (e.ctrlKey || e.metaKey) && e.key === 'Enter';
    const isPlainEnter = e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey;

    if (isCtrlOrCmdEnter || isPlainEnter) {
      e.preventDefault();
      if (!isSubmitDisabled) {
        handleSubmit();
      }
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (isSubmitDisabled || submitLockRef.current) return;

    const cleanValue = value.trim();
    if (!cleanValue) return;

    submitLockRef.current = true;
    if (onSubmit) {
      Promise.resolve(onSubmit(cleanValue)).finally(() => {
        if (!isSubmitting) {
          submitLockRef.current = false;
        }
      });
    } else {
      submitLockRef.current = false;
    }
  };

  const handleClear = () => {
    if (isSubmitting || disabled) return;
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-2xl border-2 border-indigo-200/90 shadow-md p-4 transition-all focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-100/70">
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 h-full gap-3 justify-between">
        {/* Cabeçalho de Destaque da Área de Resposta */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-100/80 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span>Sua Resposta</span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Ouça o áudio e digite exatamente o que você escutar
          </span>
        </div>
        {/* Rótulo Acessível para Leitores de Tela (WCAG 2.1) */}
        <label htmlFor="transcription-textarea" className="sr-only">
          Campo de transcrição do ditado
        </label>

        {/* Campo de Texto que preenche a altura disponível */}
        <div className="relative flex-1 flex flex-col min-h-[140px]">
          <textarea
            id="transcription-textarea"
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting || disabled}
            maxLength={maxLength}
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            rows={4}
            placeholder={placeholder}
            aria-label="Campo de transcrição do ditado"
            aria-describedby="transcription-char-counter transcription-shortcut-hint"
            className={`w-full flex-1 resize-none text-slate-800 placeholder-slate-400 text-sm sm:text-base outline-none bg-transparent transition-opacity leading-relaxed ${
              isSubmitting || disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          />
        </div>

        {/* Rodapé do Input: Contador e Ações (SCRUM-179: Mobile-First e Teclado Virtual) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-100 pt-3 gap-3 shrink-0 mt-auto">
          {/* Lado Esquerdo: Botão Limpar e Contador de Caracteres */}
          <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
            {value.length > 0 && !isSubmitting && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1 min-h-[44px] text-xs text-slate-400 hover:text-slate-600 font-medium transition py-1.5 px-2.5 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                title="Limpar texto"
                aria-label="Limpar texto digitado"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
              <span
                id="transcription-char-counter"
                aria-live={isLimitReached ? 'polite' : 'off'}
                className={`text-xs font-mono font-semibold transition-colors ${
                  isLimitReached
                    ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md'
                    : charCount > maxLength * 0.9
                    ? 'text-amber-600'
                    : 'text-slate-400'
                }`}
              >
                {charCount} / {maxLength} caracteres
              </span>
              {isLimitReached && (
                <span className="flex items-center gap-1 text-[11px] text-rose-600 font-medium hidden sm:inline-flex" role="alert">
                  <AlertCircle className="w-3 h-3" />
                  Limite atingido
                </span>
              )}
            </div>
          </div>

          {/* Lado Direito: Dica de atalho e Botão Enviar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <span id="transcription-shortcut-hint" className="hidden md:inline-block text-[11px] text-slate-400">
              Pressione <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-600 font-mono text-[10px]">Ctrl+Enter</kbd> para enviar
            </span>

            <button
              type="submit"
              disabled={isSubmitDisabled}
              aria-label={isSubmitting ? 'Enviando resposta...' : 'Enviar resposta da transcrição'}
              className={`flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                isSubmitDisabled
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-indigo-200'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submeter Transcrição</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Alerta de erro de submissão preservando o texto digitado (SCRUM-109 Cenário 5) */}
        {submitError && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700 font-medium"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}
      </form>
    </div>
  );
}
