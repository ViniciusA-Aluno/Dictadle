import React from 'react';
import { UserCheck, Settings, LogOut, Headphones, Flame, Trophy, Sparkles } from 'lucide-react';

export default function StudentDashboard({ currentUser, onNavigateToSettings, onLogout }) {
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

        {/* Card dos Desafios (Em Breve) */}
        <div className="bg-gradient-to-br from-indigo-50 to-slate-50 p-8 rounded-3xl border border-indigo-100 text-center space-y-3">
          <div className="inline-flex bg-indigo-600 text-white p-3.5 rounded-2xl shadow-md">
            <Headphones className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Desafios de Transcrição</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Em breve você poderá praticar listening com clipes curtos de filmes, séries e entrevistas do YouTube, receber correção inteligente palavra por palavra e acumular XP!
          </p>
          <div className="pt-2">
            <span className="inline-block px-3 py-1 bg-white border border-indigo-200 text-indigo-700 text-xs font-bold rounded-full shadow-xs">
              Disponível na próxima Release
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
