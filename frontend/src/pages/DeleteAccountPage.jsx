import React, { useState } from 'react';
import { authService, setAuthToken } from '../services/api';
import {
  Trash2,
  AlertTriangle,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';

export default function DeleteAccountPage({ currentUser, onBack, onAccountDeleted }) {
  const [confirmationText, setConfirmationText] = useState('');
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [hardDelete, setHardDelete] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Exigir a digitação do nome de usuário para evitar cliques acidentais
  const expectedText = currentUser?.username || 'EXCLUIR';
  const isConfirmed = confirmationText.trim() === expectedText && isAcknowledged;

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!isConfirmed) return;

    setError(null);
    setLoading(true);

    try {
      const userId = currentUser?.id;
      if (!userId) {
        throw new Error('Identificação do usuário não encontrada.');
      }

      await authService.deleteAccount(userId, hardDelete);

      // Limpa token da sessão
      setAuthToken(null);
      setSuccess(true);

      // Aguarda 2 segundos para o usuário ver o feedback e aciona a transição
      setTimeout(() => {
        if (onAccountDeleted) {
          onAccountDeleted();
        }
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          'Erro ao excluir a conta. Tente novamente mais tarde.'
      );
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-4">
          <div className="inline-flex bg-emerald-100 text-emerald-600 p-4 rounded-2xl">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Conta Excluída com Sucesso
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Sua conta foi desativada e a sessão encerrada. Redirecionando para a tela inicial...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full transition-all">
        {/* Cabeçalho */}
        <div className="text-center mb-6">
          <div className="inline-flex bg-rose-100 text-rose-600 p-3.5 rounded-2xl mb-3 shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Zona de Perigo: Excluir Conta
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Você está prestes a excluir a conta associada ao usuário{' '}
            <strong className="text-slate-700">{currentUser?.username}</strong> ({currentUser?.email}).
          </p>
        </div>

        {/* Banner de Aviso de Impacto */}
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>Atenção: Impacto da Ação</span>
          </div>
          <ul className="text-xs text-rose-700 space-y-1.5 list-disc list-inside">
            <li>Seu login será imediatamente revogado e bloqueado.</li>
            <li>Seu progresso nos desafios e estatísticas não estarão mais acessíveis.</li>
            <li>Sua pontuação de XP será removida dos rankings do Dictadle.</li>
          </ul>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulário de Confirmação */}
        <form onSubmit={handleDeleteAccount} className="space-y-5">
          {/* Confirmação de Ciência */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition">
            <input
              type="checkbox"
              checked={isAcknowledged}
              onChange={(e) => setIsAcknowledged(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
            />
            <span className="text-xs text-slate-700 leading-snug">
              Estou ciente de que esta ação desativará minha conta e suspenderá meu acesso permanentemente.
            </span>
          </label>

          {/* Opção de Hard Delete */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition">
            <input
              type="checkbox"
              checked={hardDelete}
              onChange={(e) => setHardDelete(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
            />
            <span className="text-xs text-slate-700 leading-snug">
              <strong className="font-semibold text-slate-800">Exclusão Permanente:</strong> Remover todos os registros definitivamente do banco de dados (Hard Delete).
            </span>
          </label>

          {/* Campo de confirmação textual */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Para confirmar, digite <span className="text-rose-600 font-mono font-bold lowercase">{expectedText}</span> abaixo:
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={expectedText}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition"
              required
            />
          </div>

          {/* Botões de Ação */}
          <div className="space-y-2 pt-2">
            <button
              type="submit"
              disabled={loading || !isConfirmed}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Excluindo Conta...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Confirmar e Excluir Minha Conta</span>
                </>
              )}
            </button>

            {onBack && (
              <button
                type="button"
                onClick={onBack}
                disabled={loading}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Cancelar e Voltar ao Painel</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
