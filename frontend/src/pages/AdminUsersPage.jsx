import React from 'react';
import { ShieldCheck, Settings, LogOut, Users, UserCheck } from 'lucide-react';

export default function AdminUsersPage({ currentUser, onNavigateToSettings, onLogout }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Cabeçalho */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg">Dictadle</h1>
            <p className="text-xs text-slate-500">Painel do Administrador</p>
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
              <h2 className="text-2xl font-bold text-slate-800">Painel Admin - Olá, {currentUser.username}!</h2>
              <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 font-bold text-[10px] rounded-full uppercase tracking-wider">
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
            <span>Minha Conta</span>
          </button>
        </div>

        {/* Card de Gestão de Usuários (Placeholder para próxima US) */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
          <div className="inline-flex bg-indigo-50 text-indigo-600 p-4 rounded-2xl">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Listagem e Gestão de Usuários</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              A listagem completa de alunos e administradores, busca avançada e gestão de permissões será implementada na próxima User Story.
            </p>
          </div>

          <div className="pt-2">
            <span className="inline-block px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
              Próxima Funcionalidade da Sprint
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
