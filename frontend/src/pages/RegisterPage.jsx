import React, { useState } from 'react';
import { authService } from '../services/api';
import { User, Mail, Lock, CheckCircle2, AlertCircle, Loader2, ArrowLeft, UserPlus } from 'lucide-react';

export default function RegisterPage({ onNavigateToLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Regras de validação em tempo real
  const hasMinLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const isPasswordValid = hasMinLength && hasLetter && hasNumber;
  const doPasswordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const newFieldErrors = {};

    // Cenário 6: Submissão com campos obrigatórios vazios
    if (!username.trim()) newFieldErrors.username = 'Campo obrigatório';
    if (!email.trim()) newFieldErrors.email = 'Campo obrigatório';
    if (!password) newFieldErrors.password = 'Campo obrigatório';
    if (!confirmPassword) newFieldErrors.confirmPassword = 'Campo obrigatório';

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Cenário 3: Validação de formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFieldErrors(prev => ({ ...prev, email: 'Informe um e-mail válido' }));
      setError('Informe um e-mail válido');
      return;
    }

    // Cenário 4: Complexidade de senha
    if (!isPasswordValid) {
      setError('A senha deve conter no mínimo 8 caracteres, incluindo pelo menos uma letra e um número.');
      return;
    }

    // Cenário 5: Divergência entre senha e confirmação de senha
    if (password !== confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: 'As senhas não coincidem' }));
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      // Cenário 1 e 7: Criação com perfil Estudante
      const response = await authService.register(username.trim(), email.trim(), password);
      setSuccessMessage(response.data?.message || 'Cadastro realizado com sucesso');

      // Cenário 1: Redirecionamento para a tela de login
      setTimeout(() => {
        if (onNavigateToLogin) {
          onNavigateToLogin(true, 'Cadastro realizado com sucesso! Faça login para começar.');
        }
      }, 1500);
    } catch (err) {
      // Cenário 2: E-mail já existente ou erro de validação do backend
      const errorMsg = err.response?.data?.error || 'Erro ao realizar cadastro. Tente novamente.';
      setError(errorMsg);
      if (errorMsg.includes('e-mail')) {
        setFieldErrors(prev => ({ ...prev, email: errorMsg }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full transition-all">
        {/* Cabeçalho */}
        <div className="text-center mb-6">
          <div className="inline-flex bg-indigo-600 text-white p-3.5 rounded-2xl mb-3 shadow-md">
            <UserPlus className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Criar Conta no Dictadle</h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Cadastre-se para começar a treinar seu listening com clipes reais e subir de nível.
          </p>
        </div>

        {/* Mensagem de Sucesso (Cenário 1) */}
        {successMessage && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            <div>
              <p className="font-bold">{successMessage}</p>
              <p className="text-emerald-600 text-[11px] mt-0.5">Redirecionando para a tela de login...</p>
            </div>
          </div>
        )}

        {/* Mensagem de Erro Geral */}
        {error && !successMessage && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-fadeIn">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo: Nome de Usuário */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Nome de Usuário
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (fieldErrors.username) setFieldErrors(prev => ({ ...prev, username: null }));
                }}
                placeholder="seu_usuario"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition ${
                  fieldErrors.username
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/30'
                    : 'border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
              />
            </div>
            {fieldErrors.username && (
              <span className="text-[11px] text-rose-600 mt-1 block">{fieldErrors.username}</span>
            )}
          </div>

          {/* Campo: E-mail */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: null }));
                }}
                placeholder="seu.email@exemplo.com"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition ${
                  fieldErrors.email
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/30'
                    : 'border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
              />
            </div>
            {fieldErrors.email && (
              <span className="text-[11px] text-rose-600 mt-1 block">{fieldErrors.email}</span>
            )}
          </div>

          {/* Campo: Senha */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: null }));
                }}
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition ${
                  fieldErrors.password
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/30'
                    : 'border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
              />
            </div>
            {fieldErrors.password && (
              <span className="text-[11px] text-rose-600 mt-1 block">{fieldErrors.password}</span>
            )}

            {/* Checklist de requisitos de senha (Cenário 4) */}
            <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="text-[11px] font-bold text-slate-600 mb-1">Requisitos mínimos de senha:</p>
              <div className="flex items-center gap-2 text-[11px]">
                <span className={hasMinLength ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                  {hasMinLength ? '✓' : '○'} Mínimo de 8 caracteres
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className={hasLetter ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                  {hasLetter ? '✓' : '○'} Pelo menos uma letra
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className={hasNumber ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                  {hasNumber ? '✓' : '○'} Pelo menos um número
                </span>
              </div>
            </div>
          </div>

          {/* Campo: Confirmação de Senha */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Confirmação de Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: null }));
                }}
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition ${
                  fieldErrors.confirmPassword || (confirmPassword.length > 0 && !doPasswordsMatch)
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/30'
                    : 'border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
              />
            </div>
            {fieldErrors.confirmPassword && (
              <span className="text-[11px] text-rose-600 mt-1 block">{fieldErrors.confirmPassword}</span>
            )}
            {confirmPassword.length > 0 && !doPasswordsMatch && !fieldErrors.confirmPassword && (
              <span className="text-[11px] text-rose-600 mt-1 block">As senhas não coincidem</span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || Boolean(successMessage)}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Criando conta...</span>
              </>
            ) : (
              <span>Cadastrar</span>
            )}
          </button>
        </form>

        {/* Alternar para tela de Login */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={() => onNavigateToLogin && onNavigateToLogin(false)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Já possui uma conta? Entre aqui</span>
          </button>
        </div>
      </div>
    </div>
  );
}
