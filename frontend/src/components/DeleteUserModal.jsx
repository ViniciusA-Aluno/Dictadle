import React, { useState, useEffect } from 'react';
import { authService } from '../services/api';
import {
  X,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  User,
  Mail,
  Shield,
} from 'lucide-react';

export default function DeleteUserModal({ user, isOpen, onClose, onSuccess, currentUser }) {
  const [hardDelete, setHardDelete] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setHardDelete(false);
      setConfirmationInput('');
      setError(null);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const isSelf = user.id === currentUser?.id;
  const isHardDeleteAllowed = !hardDelete || confirmationInput.trim().toLowerCase() === user.username.toLowerCase() || confirmationInput.trim().toLowerCase() === 'deletar';

  const handleDelete = async (e) => {
    e.preventDefault();
    if (isSelf) {
      setError('Você não pode excluir sua própria conta através da lista de gestão. Utilize a opção de configurações da sua conta.');
      return;
    }

    if (hardDelete && !isHardDeleteAllowed) {
      setError(`Digite "${user.username}" ou "deletar" para autorizar a exclusão definitiva.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await authService.deleteUser(user.id, hardDelete);
      const successMessage =
        response.data?.message ||
        (hardDelete
          ? 'Usuário excluído definitivamente do banco de dados.'
          : 'Usuário desativado com sucesso (Soft Delete).');

      if (onSuccess) {
        onSuccess(user.id, successMessage);
      }
      onClose();
    } catch (err) {
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Erro ao processar a exclusão do usuário.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabeçalho */}
        <div className="p-6 bg-rose-50/70 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-200">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 leading-tight">
                Excluir Usuário
              </h3>
              <p className="text-xs text-rose-600 font-semibold">
                Gestão Administrativa de Contas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-white/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário / Conteúdo */}
        <form onSubmit={handleDelete} className="p-6 space-y-4 text-xs">
          {/* Alerta de Auto-Exclusão Bloqueada */}
          {isSelf ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-[11px] uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Ação Bloqueada: Sua Própria Conta</span>
              </div>
              <p className="text-xs leading-relaxed">
                Para sua segurança, não é permitido excluir a própria conta de administrador diretamente pela listagem geral.
                Se você realmente deseja desativar sua conta, acesse a área de <strong>Configurações &gt; Zona de Perigo</strong>.
              </p>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                Usuário Selecionado para Exclusão:
              </p>
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {user.username} (ID #{user.id})
                </span>
                <span className="text-slate-500 font-normal">{user.email}</span>
              </div>
            </div>
          )}

          {/* Erro da API */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {!isSelf && (
            <>
              {/* Opções de Tipo de Exclusão */}
              <div className="space-y-2.5 pt-1">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Tipo de Operação
                </label>

                {/* Soft Delete */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                    !hardDelete
                      ? 'border-indigo-500 bg-indigo-50/30 ring-1 ring-indigo-500'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="delete_type"
                    checked={!hardDelete}
                    onChange={() => setHardDelete(false)}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">
                      Desativação de Conta (Soft Delete - Recomendado)
                    </span>
                    <span className="text-slate-500 text-[11px] block mt-0.5 leading-snug">
                      Bloqueia o login e revoga acessos imediatamente, mas preserva o histórico de desafios e dados para relatórios.
                    </span>
                  </div>
                </label>

                {/* Hard Delete */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                    hardDelete
                      ? 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-500'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="delete_type"
                    checked={hardDelete}
                    onChange={() => setHardDelete(true)}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="font-bold text-rose-700 block text-xs">
                      Exclusão Definitiva (Hard Delete - Irreversível)
                    </span>
                    <span className="text-slate-500 text-[11px] block mt-0.5 leading-snug">
                      Apaga permanentemente o registro do banco de dados (LGPD / conformidade de dados). Não poderá ser desfeito.
                    </span>
                  </div>
                </label>
              </div>

              {/* Confirmação textual se for Hard Delete */}
              {hardDelete && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 animate-in fade-in duration-150">
                  <label className="block text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                    Confirmação de Segurança:
                  </label>
                  <p className="text-[11px] text-rose-700">
                    Para confirmar a exclusão irreversível, digite o nome de usuário{' '}
                    <strong>{user.username}</strong> ou a palavra <strong>deletar</strong> abaixo:
                  </p>
                  <input
                    type="text"
                    value={confirmationInput}
                    onChange={(e) => setConfirmationInput(e.target.value)}
                    placeholder={`Digite ${user.username} ou deletar`}
                    className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-white text-xs outline-none focus:ring-2 focus:ring-rose-500 transition"
                    autoFocus
                  />
                </div>
              )}
            </>
          )}

          {/* Botões */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
            >
              Cancelar
            </button>

            {!isSelf && (
              <button
                type="submit"
                disabled={loading || (hardDelete && !isHardDeleteAllowed)}
                className={`px-5 py-2 font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-md disabled:opacity-40 disabled:cursor-not-allowed ${
                  hardDelete
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-100'
                    : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-100'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>
                      {hardDelete ? 'Confirmar Exclusão Definitiva' : 'Desativar Usuário'}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
