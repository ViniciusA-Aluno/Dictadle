import React, { useState, useEffect } from 'react';
import { authService, setAuthToken } from '../services/api';
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Shield,
  ShieldCheck,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  Save,
} from 'lucide-react';

export default function SettingsPage({
  currentUser,
  onBack,
  onUserUpdated,
  onNavigateToDeleteAccount,
}) {
  // Estado dos Dados Cadastrais
  const [username, setUsername] = useState(currentUser?.username || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(null);
  const [profileError, setProfileError] = useState(null);

  // Estado da Troca de Senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  // Cenário 1: Pré-carregar dados atualizados ao abrir a página
  useEffect(() => {
    const fetchLatestProfile = async () => {
      try {
        const response = await authService.getProfile();
        if (response.data?.user) {
          setUsername(response.data.user.username);
          setEmail(response.data.user.email);
          if (onUserUpdated) onUserUpdated(response.data.user);
        }
      } catch (err) {
        // Fallback para os dados já recebidos via props
      }
    };
    fetchLatestProfile();
  }, []);

  // Regras de validação da nova senha
  const hasMinLength = newPassword.length >= 8;
  const hasLetter = /[A-Za-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const isPasswordValid = hasMinLength && hasLetter && hasNumber;
  const isDifferentFromCurrent = currentPassword.length > 0 && newPassword !== currentPassword;
  const doPasswordsMatch = confirmNewPassword.length > 0 && newPassword === confirmNewPassword;

  // Submissão de Dados Cadastrais (Cenários 2 a 6)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setProfileError('Informe um e-mail válido');
      return;
    }

    setProfileLoading(true);

    try {
      const response = await authService.updateProfile(username, email);
      setProfileSuccess(response.data?.message || 'Dados atualizados com sucesso');
      if (onUserUpdated && response.data?.user) {
        onUserUpdated(response.data.user);
      }
    } catch (err) {
      setProfileError(
        err.response?.data?.error || 'Erro ao atualizar dados. Tente novamente.'
      );
    } finally {
      setProfileLoading(false);
    }
  };

  // Submissão de Troca de Senha (Cenários 7 a 11)
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    // Cenário 11: Nova senha idêntica à senha atual
    if (newPassword === currentPassword) {
      setPasswordError('A nova senha deve ser diferente da senha atual');
      return;
    }

    // Cenário 10: Requisitos mínimos de segurança
    if (!isPasswordValid) {
      setPasswordError(
        'A nova senha deve conter no mínimo 8 caracteres, incluindo pelo menos uma letra e um número.'
      );
      return;
    }

    // Cenário 9: Nova senha divergente da confirmação
    if (newPassword !== confirmNewPassword) {
      setPasswordError('A confirmação de senha não coincide com a nova senha');
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await authService.changePassword(currentPassword, newPassword);
      setPasswordSuccess(response.data?.message || 'Senha alterada com sucesso');
      
      // Cenário 7: Limpar campos após sucesso
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

      // Atualiza token JWT emitido pelo backend
      if (response.data?.access_token) {
        setAuthToken(response.data.access_token);
      }
    } catch (err) {
      setPasswordError(
        err.response?.data?.error || 'Erro ao alterar senha. Verifique os dados informados.'
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Cabeçalho */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-slate-800 text-lg">Configurações da Conta</h1>
            <p className="text-xs text-slate-500">Gerencie seus dados e preferências de segurança</p>
          </div>
        </div>

        <button
          onClick={onBack}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
        >
          Voltar
        </button>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        {/* SEÇÃO 1: DADOS CADASTRAIS */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <User className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-800">Dados Cadastrais</h2>
          </div>

          {profileSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Nome de Usuário
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="seu_usuario"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
            </div>

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
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {profileLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* SEÇÃO 2: ALTERAÇÃO DE SENHA */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <KeyRound className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-800">Alteração de Senha</h2>
          </div>

          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Senha Atual
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Nova Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>

              {/* Checklist de requisitos de segurança */}
              <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <p className="text-[11px] font-bold text-slate-600 mb-1">Requisitos mínimos da nova senha:</p>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className={hasMinLength ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                    {hasMinLength ? '✓' : '○'} Mínimo de 8 caracteres
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className={hasLetter ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                    {hasLetter ? '✓' : '○'} Ao menos uma letra
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className={hasNumber ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                    {hasNumber ? '✓' : '○'} Ao menos um número
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className={isDifferentFromCurrent ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                    {isDifferentFromCurrent ? '✓' : '○'} Diferente da senha atual
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  required
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition ${
                    confirmNewPassword && !doPasswordsMatch
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20'
                      : 'border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />
              </div>
              {confirmNewPassword && !doPasswordsMatch && (
                <span className="text-[11px] text-rose-600 mt-1 block">
                  A confirmação de senha não coincide com a nova senha
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {passwordLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Atualizando senha...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Alterar Senha</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* SEÇÃO 3: AUTENTICAÇÃO EM DUAS ETAPAS (2FA) - Movida de App.jsx */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-800">Autenticação em Duas Etapas (2FA)</h2>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentUser?.is_2fa_enabled ? (
                <div className="bg-emerald-100 text-emerald-700 p-2.5 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              ) : (
                <div className="bg-amber-100 text-amber-700 p-2.5 rounded-xl">
                  <Shield className="w-5 h-5" />
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-slate-700">Status da Verificação em 2FA</p>
                <p className="text-xs text-slate-500">
                  {currentUser?.is_2fa_enabled
                    ? 'Ativada e protegendo sua conta com app autenticador'
                    : 'Desativada. Apenas senha requerida para login'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SEÇÃO 4: ZONA DE PERIGO (EXCLUSÃO DE CONTA) - Movida de App.jsx */}
        <div className="bg-rose-50 p-6 rounded-3xl border border-rose-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 pb-2 border-b border-rose-100">
            <Trash2 className="w-5 h-5 text-rose-600" />
            <h2 className="text-base font-bold text-rose-900">Zona de Perigo</h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-800">Excluir ou Desativar Conta</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Esta ação encerrará o acesso aos desafios e dados cadastrais da sua conta.
              </p>
            </div>

            <button
              onClick={onNavigateToDeleteAccount}
              className="self-start sm:self-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition shadow-sm flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Gerenciar Exclusão</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
