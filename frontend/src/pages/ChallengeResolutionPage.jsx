import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  LogOut,
  Sparkles,
  Volume2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Compass,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import AnswerInputBox from '../components/AnswerInputBox';
import DiffFeedbackDisplay from '../components/DiffFeedbackDisplay';
import ChallengeVideoPlayer from '../components/ChallengeVideoPlayer';
import { challengeService } from '../services/api';
import { useMediaKeyboardShortcuts } from '../hooks/useMediaKeyboardShortcuts';

// Cache em memória para transições instantâneas entre rotas (evita recarregamento ao voltar de Configurações)
let challengesMemoryCache = null;
let currentChallengeIndexCache = 0;

/**
 * ChallengeResolutionPage (US-92 / US-107 / SCRUM-149 / SCRUM-150 / SCRUM-20)
 * 
 * Tela principal de prática do estudante com integração do YouTube Embed Player,
 * contenção estrita do recorte de áudio, controles customizados, navegação entre desafios e atalhos (Driver 003).
 */
export default function ChallengeResolutionPage({ currentUser, onNavigateToSettings, onLogout }) {
  const navigate = useNavigate();

  const [challengesList, setChallengesList] = useState(challengesMemoryCache || []);
  const [currentIndex, setCurrentIndex] = useState(currentChallengeIndexCache || 0);
  const [challenge, setChallenge] = useState(
    challengesMemoryCache ? challengesMemoryCache[currentChallengeIndexCache] || challengesMemoryCache[0] : null
  );
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(!challengesMemoryCache);
  const [challengeError, setChallengeError] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedAnswer, setSubmittedAnswer] = useState(null);

  const playerControlsRef = useRef(null);
  const answerTextareaRef = useRef(null);

  // Simulação de solução enquanto a validação com IA (US-91) é integrada
  const sampleSolution = "Hey guys, how is it going?";

  // Carrega lista de desafios ativos para permitir navegação fluida
  const loadChallengeData = async () => {
    if (!challengesMemoryCache) {
      setIsLoadingChallenge(true);
    }
    setChallengeError(null);
    try {
      let list = [];
      try {
        const activeRes = await challengeService.getActiveChallenges();
        list = activeRes.data?.challenges || [];
      } catch (e) {
        // Fallback
      }

      if (list.length > 0) {
        challengesMemoryCache = list;
        setChallengesList(list);
        setChallenge((prev) => prev || list[0]);
      } else {
        const res = await challengeService.getDailyPlayback();
        const singleList = [res.data];
        challengesMemoryCache = singleList;
        setChallenge((prev) => prev || res.data);
        setChallengesList(singleList);
      }
    } catch (err) {
      if (!challengesMemoryCache) {
        try {
          const fallbackRes = await challengeService.getPlayback(20);
          const singleList = [fallbackRes.data];
          challengesMemoryCache = singleList;
          setChallenge(fallbackRes.data);
          setChallengesList(singleList);
        } catch (fallbackErr) {
          const msg = err.response?.data?.error || 'Não foi possível carregar o desafio no momento.';
          setChallengeError(msg);
        }
      }
    } finally {
      setIsLoadingChallenge(false);
    }
  };

  useEffect(() => {
    loadChallengeData();
  }, []);

  const handleSelectChallenge = (index) => {
    if (index >= 0 && index < challengesList.length) {
      currentChallengeIndexCache = index;
      setCurrentIndex(index);
      setChallenge(challengesList[index]);
      setSubmittedAnswer(null);
    }
  };

  const handleNextChallenge = () => {
    if (challengesList.length > 0) {
      const nextIndex = (currentIndex + 1) % challengesList.length;
      handleSelectChallenge(nextIndex);
    }
  };

  const handlePrevChallenge = () => {
    if (challengesList.length > 0) {
      const prevIndex = (currentIndex - 1 + challengesList.length) % challengesList.length;
      handleSelectChallenge(prevIndex);
    }
  };

  // Driver DA-USA-I1-003 (SCRUM-20): Listener global de atalhos de teclado sem perda de foco
  useMediaKeyboardShortcuts({
    onTogglePlay: () => playerControlsRef.current?.togglePlay?.(),
    onRewind: (sec) => playerControlsRef.current?.rewind?.(sec),
    onReplay: () => playerControlsRef.current?.replay?.(),
    enabled: !!challenge,
    targetInputRef: answerTextareaRef,
  });

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
      {/* Cabeçalho Superior */}
      <header
        role="banner"
        className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-10 shadow-xs"
      >
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2 rounded-xl" aria-hidden="true">
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
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title="Ir para o Dashboard"
            aria-label="Ir para o Dashboard"
          >
            <Compass className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <button
            onClick={onNavigateToSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title="Ir para configurações"
            aria-label="Ir para configurações"
          >
            <Settings className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Configurações</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-rose-500"
            title="Encerrar sessão"
            aria-label="Encerrar sessão"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main
        role="main"
        className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 sm:py-8 space-y-6"
      >
        {/* Banner Informativo do Desafio com Metadados e Navegação */}
        <section
          aria-label="Informações do desafio"
          className="flex flex-col sm:flex-row sm:items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200 text-xs text-slate-600 gap-3 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" aria-hidden="true" />
            <span className="font-medium">
              {challenge ? challenge.title : 'Ouça com atenção e digite exatamente o que os falantes disserem.'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {challenge && (
              <div
                className="flex items-center gap-2 font-mono text-[11px]"
                aria-label={`Dificuldade ${challenge.difficulty}, Sotaque ${challenge.accent}, Duração ${challenge.duration} segundos`}
              >
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold rounded-md uppercase">
                  {challenge.difficulty}
                </span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded-md">
                  {challenge.accent}
                </span>
                <span className="text-slate-400">
                  {challenge.duration}s
                </span>
              </div>
            )}

            {/* Navegador entre Desafios */}
            {challengesList.length > 1 && (
              <nav
                aria-label="Navegação entre desafios"
                className="flex items-center gap-1.5 border-l border-slate-200 pl-3"
              >
                <span
                  className="text-[11px] font-semibold text-slate-500"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {currentIndex + 1} de {challengesList.length}
                </span>
                <button
                  type="button"
                  onClick={handlePrevChallenge}
                  className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  title="Desafio anterior"
                  aria-label="Ir para o desafio anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={handleNextChallenge}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  title="Próximo desafio"
                  aria-label="Ir para o próximo desafio"
                >
                  <span>Próximo</span>
                  <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </nav>
            )}
          </div>
        </section>

        {/* Zona 1: Player de Vídeo e Áudio Oficial (US-107 / SCRUM-149 / SCRUM-150) */}
        {isLoadingChallenge ? (
          <div
            role="status"
            aria-live="polite"
            className="aspect-video w-full bg-slate-900 rounded-3xl border border-slate-800 flex flex-col items-center justify-center text-slate-400 gap-3"
          >
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" aria-hidden="true" />
            <p className="text-xs font-medium">Buscando clipe do desafio...</p>
          </div>
        ) : challengeError ? (
          <div
            role="alert"
            className="aspect-video w-full bg-slate-900 rounded-3xl border border-slate-800 flex flex-col items-center justify-center text-center p-6 text-slate-300"
          >
            <AlertCircle className="w-10 h-10 text-rose-500 mb-3" aria-hidden="true" />
            <h3 className="text-white font-bold text-base">Falha ao carregar clipe</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">{challengeError}</p>
            <button
              onClick={loadChallengeData}
              aria-label="Tentar carregar o clipe novamente"
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Tentar novamente</span>
            </button>
          </div>
        ) : challenge ? (
          <ChallengeVideoPlayer
            videoId={challenge.youtube_video_id}
            startTime={challenge.start_time_seconds}
            endTime={challenge.end_time_seconds}
            title={challenge.title}
            playerControlsRef={playerControlsRef}
            onNavigateToCatalog={() => navigate('/dashboard')}
          />
        ) : null}

        {/* Zona 2: Campo de Input de Respostas (US-92 / SCRUM-20) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sua Transcrição
            </h3>
            <span className="text-[11px] text-slate-400 hidden sm:inline" aria-hidden="true">
              Dica: Use <kbd className="px-1 py-0.5 bg-slate-200/80 rounded font-mono text-[10px]">Ctrl+Espaço</kbd> para pausar o vídeo sem sair do texto
            </span>
          </div>

          <AnswerInputBox
            onSubmit={handleAnswerSubmit}
            isSubmitting={isSubmitting}
            autoFocus={true}
            inputRef={answerTextareaRef}
            placeholder="Ouça o áudio e digite o que compreendeu... Pressione Enter para enviar."
          />

          {/* Zona 3: Feedback Visual da Avaliação (SCRUM-148) */}
          {submittedAnswer && (
            <div className="space-y-3">
              <DiffFeedbackDisplay
                attempt={submittedAnswer}
                expected={sampleSolution}
                onReset={handleReset}
              />

              {challengesList.length > 1 && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleNextChallenge}
                    aria-label="Ir para o próximo desafio após ver o feedback"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <span>Ir para o Próximo Desafio</span>
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
