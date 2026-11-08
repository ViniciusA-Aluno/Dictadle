import React, { useState } from 'react';
import { UserCheck, Settings, LogOut, Headphones, Flame, Trophy, Sparkles, Play, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { challengeService } from '../services/api';

export default function StudentDashboard({ currentUser, onNavigateToSettings, onLogout }) {
  const [playbackData, setPlaybackData] = useState(null);
  const [isLoadingPlayback, setIsLoadingPlayback] = useState(false);
  const [playbackError, setPlaybackError] = useState(null);

  const handleLoadPlayback = async () => {
    setIsLoadingPlayback(true);
    setPlaybackError(null);
    try {
      // Tenta buscar o desafio diário ou recorre ao desafio padrão (id 20)
      let res;
      try {
        res = await challengeService.getDailyPlayback();
      } catch (err) {
        res = await challengeService.getPlayback(20);
      }
      setPlaybackData(res.data);
    } catch (err) {
      const msg = err.response?.data?.error || 'Não foi possível carregar a sessão de reprodução.';
      setPlaybackError(msg);
    } finally {
      setIsLoadingPlayback(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Cabeçalho */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg">Dictadle</h1>
            <p className="text-xs text-slate-500">Área do Estudante</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configurações</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-4xl mx-auto w-full px-4 py-8 space-y-6">
        {/* Card de Boas-Vindas */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-800">Olá, {currentUser.username}!</h2>
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[10px] rounded-full uppercase tracking-wider">
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{currentUser.email}</p>
          </div>

          <button
            onClick={onNavigateToSettings}
            className="self-start sm:self-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-sm"
          >
            <Settings className="w-4 h-4" />
            <span>Configurar Conta</span>
          </button>
        </div>

        {/* Métricas de Gamificação (Preview) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Nível Atual</p>
              <p className="text-lg font-black text-slate-800">Nível 1</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Experiência (XP)</p>
              <p className="text-lg font-black text-slate-800">0 XP</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Ofensiva</p>
              <p className="text-lg font-black text-slate-800">0 dias</p>
            </div>
          </div>
        </div>

        {/* Card dos Desafios de Transcrição e Player Embed (US-91 / Release 2) */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Desafio de Transcrição Diário</h3>
                <p className="text-xs text-slate-500">
                  Pratique listening reproduzindo o clipe de 10 a 15 segundos sem expor o gabarito.
                </p>
              </div>
            </div>

            <button
              onClick={handleLoadPlayback}
              disabled={isLoadingPlayback}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-sm self-start sm:self-auto cursor-pointer"
            >
              {isLoadingPlayback ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Carregando mídia...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>{playbackData ? 'Recarregar Clipe' : 'Iniciar Sessão de Reprodução'}</span>
                </>
              )}
            </button>
          </div>

          {playbackError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{playbackError}</span>
            </div>
          )}

          {playbackData && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{playbackData.title}</h4>
                  <p className="text-xs text-slate-500">
                    Recorte de vídeo: <span className="font-semibold text-slate-700">{playbackData.start_time_seconds}s</span> a <span className="font-semibold text-slate-700">{playbackData.end_time_seconds}s</span> ({playbackData.duration}s de áudio)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[11px] font-bold rounded-lg uppercase">
                    {playbackData.difficulty}
                  </span>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-lg">
                    {playbackData.accent}
                  </span>
                </div>
              </div>

              {/* Player IFrame Oficial com parâmetros seguros */}
              <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-sm">
                <iframe
                  src={playbackData.embed_url}
                  title={playbackData.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 p-3 rounded-xl text-xs font-medium border border-emerald-100">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>
                  <strong>Anti-Cheat Ativo:</strong> Metadados de reprodução entregues via API oficial do YouTube. O gabarito oficial permanece protegido no servidor.
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
