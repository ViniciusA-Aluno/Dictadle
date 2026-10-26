import React, { useState } from 'react';
import LoginPage from './pages/LoginPage';
import { setAuthToken } from './services/api';
import { UserCheck, LogOut, Shield, ShieldCheck } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

  const handleLoginSuccess = (user, token) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg">Dictadle</h1>
            <p className="text-xs text-slate-500">Sessão Autenticada</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sair</span>
        </button>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 py-12">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Olá, {currentUser.username}!</h2>
              <p className="text-xs text-slate-500">{currentUser.email}</p>
            </div>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-full uppercase tracking-wider">
              {currentUser.role}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentUser.is_2fa_enabled ? (
                <div className="bg-emerald-100 text-emerald-700 p-2.5 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              ) : (
                <div className="bg-amber-100 text-amber-700 p-2.5 rounded-xl">
                  <Shield className="w-5 h-5" />
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-slate-700">Verificação em Duas Etapas (2FA)</p>
                <p className="text-xs text-slate-500">
                  {currentUser.is_2fa_enabled ? 'Ativada e protegendo sua conta' : 'Desativada'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
