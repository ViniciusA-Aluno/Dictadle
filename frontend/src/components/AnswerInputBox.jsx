import React, { useState, useRef, useEffect } from 'react';
import { Send, Eraser, Loader2, AlertCircle } from 'lucide-react';

/**
 * AnswerInputBox Component (US-92 / SCRUM-146, SCRUM-147)
 * 
 * Regras implementadas:
 * - Limite de 500 caracteres com contador dinâmico e destaque visual de alerta (X / 500).
 * - Bloqueio de inserção de caracteres adicionais ao atingir 500 caracteres.
 * - Desativação de corretores automáticos (spellCheck=false, autoComplete=off, autoCorrect=off).
 * - Atalho de teclado: tecla Enter submete imediatamente (Shift+Enter permite quebra de linha).
 * - Botão de submissão desabilitado para respostas vazias ou apenas espaços (trim().length === 0).
 * - Estado disabled e indicador de loading durante a submissão.
 * - Foco automático inicial e botão rápido de "Limpar texto".
 */
export default function AnswerInputBox({
  onSubmit,
  isSubmitting = false,
  disabled = false,
  maxLength = 500,
  placeholder = "Digite aqui a transcrição do áudio que você ouviu...",
  autoFocus = true,
}) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  // Auto-foco ao montar o componente
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

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
    // Enter sem Shift dispara submissão
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isSubmitDisabled) {
        handleSubmit();
      }
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (isSubmitDisabled) return;

    if (onSubmit) {
      onSubmit(value);
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
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-4 transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Campo de Texto */}
        <div className="relative">
          <textarea
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
            rows={3}
            placeholder={placeholder}
            className={`w-full resize-none text-slate-800 placeholder-slate-400 text-sm sm:text-base outline-none bg-transparent transition-opacity leading-relaxed ${
              isSubmitting || disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          />
        </div>

        {/* Rodapé do Input: Contador e Ações */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 gap-2">
          {/* Lado Esquerdo: Botão Limpar e Contador de Caracteres */}
          <div className="flex items-center gap-3">
            {value.length > 0 && !isSubmitting && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 font-medium transition py-1 px-1.5 rounded-md hover:bg-slate-100"
                title="Limpar texto"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpar</span>
              </button>
            )}

            <div className="flex items-center gap-1.5">
              <span
                className={`text-xs font-mono font-semibold transition-colors ${
                  isLimitReached
                    ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md'
                    : charCount > maxLength * 0.9
                    ? 'text-amber-600'
                    : 'text-slate-400'
                }`}
              >
                {charCount} / {maxLength}
              </span>
              {isLimitReached && (
                <span className="flex items-center gap-1 text-[11px] text-rose-600 font-medium hidden sm:inline-flex">
                  <AlertCircle className="w-3 h-3" />
                  Limite atingido
                </span>
              )}
            </div>
          </div>

          {/* Lado Direito: Dica de atalho e Botão Enviar */}
          <div className="flex items-center gap-2">
            <span className="hidden md:inline-block text-[11px] text-slate-400">
              Pressione <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-600 font-mono text-[10px]">Enter ↵</kbd>
            </span>

            <button
              type="submit"
              disabled={isSubmitDisabled}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm ${
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
                  <span>Enviar Resposta</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
