import React, { useState } from 'react';
import { UserCheck, Settings, LogOut, Video, Sparkles, Volume2 } from 'lucide-react';
import AnswerInputBox from '../components/AnswerInputBox';
import DiffFeedbackDisplay from '../components/DiffFeedbackDisplay';

/**
 * ChallengeResolutionPage (US-92)
 * 
 * Tela de resolução de desafios com player de vídeo/áudio e campo de transcrição.
 */
export default function ChallengeResolutionPage({ currentUser, onNavigateToSettings, onLogout }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedAnswer, setSubmittedAnswer] = useState(null);

  // Exemplo de gabarito para simulação enquanto a API de validação (US-91) é desenvolvida
  const sampleSolution = "Hey guys, how is it going?";

  const handleAnswerSubmit = async (answerText) => {
    setIsSubmitting(true);

    // Simula tempo de resposta do servidor de avaliação
    setTimeout(() => {
      setSubmittedAnswer(answerText);
      setIsSubmitting(false);
    }, 600);
  };

  const handleReset = () => {
    setSubmittedAnswer(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Cabeçalho */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-10 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2 rounded-xl">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-base sm:text-lg leading-tight">Dictadle</h1>
            <p className="text-[11px] text-slate-500 font-medium">Desafio de Transcrição</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUser && (
            <span className="hidden md:inline-block text-xs text-slate-600 font-medium mr-2">
              Olá, <strong className="text-slate-800">{currentUser.username}</strong>
            </span>
          )}

          <button
            onClick={onNavigateToSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
            title="Ir para configurações"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Configurações</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
            title="Encerrar sessão"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 sm:py-8 space-y-6">
        {/* Banner Informativo do Desafio */}
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="font-medium">Ouça com atenção e digite exatamente o que os falantes disserem.</span>
          </div>
          <span className="hidden sm:inline-block font-mono text-[11px] text-slate-400">
            Nível: Iniciante
          </span>
        </div>

        {/* Zona 1: Placeholder do Player de Vídeo (US-107 / US-91) */}
        <div className="relative aspect-video w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-lg flex flex-col items-center justify-center text-center p-6 text-slate-400">
          <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
            <Video className="w-8 h-8" />
          </div>
          <h2 className="text-white text-base sm:text-lg font-bold">Player de Vídeo e Áudio</h2>
          <p className="text-xs text-slate-400 max-w-md mt-1">
            Esta área será integrada com a reprodução de mídia (US-107) e controles interativos de repetição de áudio.
          </p>
          <div className="mt-4 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-[11px] text-slate-300 font-mono">
            Gabarito da rodada: "{sampleSolution}"
          </div>
        </div>

        {/* Zona 2: Campo de Input de Respostas (US-92) */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Sua Resposta
          </h3>

          <AnswerInputBox
            onSubmit={handleAnswerSubmit}
            isSubmitting={isSubmitting}
            autoFocus={true}
            placeholder="Ouça o áudio e digite o que compreendeu... Pressione Enter para enviar."
          />

          {/* Zona 3: Feedback Visual da Avaliação (SCRUM-148) */}
          {submittedAnswer && (
            <DiffFeedbackDisplay
              attempt={submittedAnswer}
              expected={sampleSolution}
              onReset={handleReset}
            />
          )}
        </div>
      </main>
    </div>
  );
}
