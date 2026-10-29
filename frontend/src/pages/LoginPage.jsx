import React, { useState } from 'react';
import { authService, setAuthToken } from '../services/api';
import {
  Lock,
  Mail,
  ShieldCheck,
  ArrowLeft,
  KeyRound,
  AlertCircle,
  Loader2,
  CheckCircle2,
  UserPlus,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function LoginPage({ onLoginSuccess, onNavigateToRegister, initialSuccessMessage }) {
  // Estados de navegação entre etapas: 'credentials' ou '2fa'
  const [step, setStep] = useState('credentials');

  // Campos do formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [tempToken, setTempToken] = useState('');

  // Estados visuais
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successNotice, setSuccessNotice] = useState(initialSuccessMessage || null);

  // Etapa 1: Validação de e-mail e senha
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);
    setLoading(true);

    try {
      const response = await authService.login(email, password);
      const data = response.data;

      if (data.requires_2fa) {
        // Transição suave para o desafio de 2FA
        setTempToken(data.temp_token);
        setStep('2fa');
      } else {
        // Login direto concluído
        setAuthToken(data.access_token);
        if (onLoginSuccess) {
          onLoginSuccess(data.user, data.access_token);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao realizar login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  // Etapa 2: Validação do código TOTP de 6 dígitos
  const handleTwoFactorSubmit = async (e) => {
    e.preventDefault();
    if (twoFactorCode.length !== 6) {
      setError('O código de autenticação deve possuir exatamente 6 dígitos.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await authService.login2FA(tempToken, twoFactorCode);
      const data = response.data;

      setAuthToken(data.access_token);
      if (onLoginSuccess) {
        onLoginSuccess(data.user, data.access_token);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Código 2FA incorreto ou expirado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setStep('credentials');
    setTwoFactorCode('');
    setTempToken('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full transition-all">
        {/* Cabeçalho */}
        <div className="text-center mb-6">
          <div className="inline-flex bg-indigo-600 text-white p-3.5 rounded-2xl mb-3 shadow-md">
            {step === 'credentials' ? (
              <KeyRound className="w-8 h-8" />
            ) : (
              <ShieldCheck className="w-8 h-8 text-emerald-300" />
            )}
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            {step === 'credentials' ? 'Acessar Dictadle' : 'Verificação em Duas Etapas'}
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            {step === 'credentials'
              ? 'Informe seu e-mail e senha cadastrados para entrar'
              : 'Esta conta possui proteção 2FA. Digite o código de 6 dígitos gerado pelo seu app autenticador.'}
          </p>
        </div>

        {/* Mensagem de Sucesso (ex.: após cadastro) */}
        {successNotice && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Mensagem de Erro */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-fadeIn">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulário: Etapa 1 (E-mail e Senha) */}
        {step === 'credentials' && (
          <>
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition p-0.5 focus:outline-none"
                    title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <span>Entrar</span>
                )}
              </button>
            </form>

            {/* Alternar para tela de Cadastro */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => onNavigateToRegister && onNavigateToRegister()}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1.5 transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Ainda não tem conta? Cadastre-se</span>
              </button>
            </div>
          </>
        )}

        {/* Formulário: Etapa 2 (Desafio de Código 2FA) */}
        {step === '2fa' && (
          <form onSubmit={handleTwoFactorSubmit} className="space-y-5 animate-fadeIn">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-center">
                Código de Autenticação (6 dígitos)
              </label>
              <input
                type="text"
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                autoFocus
                className="w-full text-center tracking-[0.5em] text-2xl font-mono font-bold py-3 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                required
              />
            </div>

            <div className="space-y-2">
              <button
                type="submit"
                disabled={loading || twoFactorCode.length !== 6}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validando Código...</span>
                  </>
                ) : (
                  <span>Confirmar e Entrar</span>
                )}
              </button>

              <button
                type="button"
                onClick={handleBackToCredentials}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar para as credenciais</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
