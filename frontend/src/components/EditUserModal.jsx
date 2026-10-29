import React, { useState, useEffect } from 'react';
import { authService } from '../services/api';
import {
  X,
  Pencil,
  Shield,
  Mail,
  User,
  KeyRound,
  Activity,
  AlertCircle,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function EditUserModal({ user, isOpen, onClose, onSuccess, currentUser }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const [isActive, setIsActive] = useState(true);
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Preenche os dados quando o modal é aberto ou o usuário selecionado muda
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setRole(user.role || 'student');
      setIsActive(user.is_active ?? true);
      setNewPassword('');
      setError(null);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const isSelf = user.id === currentUser?.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validações básicas de formulário
    if (!username.trim()) {
      setError('O nome de usuário não pode ficar vazio.');
      return;
    }
    if (username.trim().length < 3) {
      setError('O nome de usuário deve conter pelo menos 3 caracteres.');
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email.trim())) {
      setError('Informe um endereço de e-mail válido.');
      return;
    }
    if (newPassword && newPassword.length < 8) {
      setError('A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (newPassword && (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword))) {
      setError('A nova senha deve conter pelo menos uma letra e um número.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        role,
        is_active: isActive,
      };

      if (newPassword.trim()) {
        payload.password = newPassword.trim();
      }

      const response = await authService.updateUser(user.id, payload);
      const updatedUser = response.data?.user || payload;

      if (onSuccess) {
        onSuccess(updatedUser, response.data?.message || 'Dados atualizados com sucesso!');
      }
      onClose();
    } catch (err) {
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Erro ao salvar alterações do usuário. Tente novamente.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabeçalho */}
        <div className="p-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 leading-tight">
                Editar Usuário
              </h3>
              <p className="text-xs text-slate-400">
                Alterando registro de #{user.id} ({user.username})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Alerta caso seja a própria conta logada */}
          {isSelf && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-800">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
              <span>
                <strong>Atenção:</strong> Você está editando o seu próprio perfil de administrador.
                Cuidado ao alterar o perfil de acesso ou status para não perder privilégios.
              </span>
            </div>
          )}

          {/* Erro de requisição */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Campo Nome de Usuário */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Nome de Usuário
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nome de usuário..."
                required
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-medium"
              />
            </div>
          </div>

          {/* Campo E-mail */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Endereço de E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@dictadle.com"
                required
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-medium"
              />
            </div>
          </div>

          {/* Linha Dupla: Perfil de Acesso & Status da Conta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Perfil */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>Perfil de Acesso</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                <option value="student">Estudante (Student)</option>
                <option value="admin">Administrador (Admin)</option>
              </select>
            </div>

            {/* Status de Atividade */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                <span>Status da Conta</span>
              </label>
              <select
                value={isActive ? 'true' : 'false'}
                onChange={(e) => setIsActive(e.target.value === 'true')}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                  isActive
                    ? 'border-emerald-200 bg-emerald-50/50 text-emerald-800'
                    : 'border-rose-200 bg-rose-50/50 text-rose-800'
                }`}
              >
                <option value="true">Ativo (Permitir Acesso)</option>
                <option value="false">Inativo / Desativado (Bloquear)</option>
              </select>
            </div>
          </div>

          {/* Redefinição Opcional de Senha */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              <span>Redefinir Senha (Opcional)</span>
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Preencha apenas se desejar atribuir uma nova senha para este usuário.
            </p>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Digite a nova senha (mínimo 8 caracteres)..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Botões de Ação */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-md shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
