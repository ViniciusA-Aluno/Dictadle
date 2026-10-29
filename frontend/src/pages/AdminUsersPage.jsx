import React, { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';
import EditUserModal from '../components/EditUserModal';
import DeleteUserModal from '../components/DeleteUserModal';
import {
  ShieldCheck,
  Settings,
  LogOut,
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  RefreshCw,
  Eye,
  Shield,
  KeyRound,
  Activity,
  UserCheck,
  UserX,
  Pencil,
  Trash2,
  AlertCircle,
} from 'lucide-react';

export default function AdminUsersPage({ currentUser, onNavigateToSettings, onLogout }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Filtros e Paginação
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Modais de Ação
  const [selectedUser, setSelectedUser] = useState(null); // Modal de Detalhes
  const [userToEdit, setUserToEdit] = useState(null); // Modal de Edição
  const [userToDelete, setUserToDelete] = useState(null); // Modal de Exclusão

  // Debounce para busca textual suave
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Carregamento de Usuários
  const fetchUsers = useCallback(async (isSilentRefresh = false) => {
    if (isSilentRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const params = {
        page,
        per_page: perPage,
        search: debouncedSearch || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      };

      const response = await authService.getUsers(params);
      const data = response.data;
      setUsers(data.users || []);
      setTotalPages(data.pages || 1);
      setTotalUsers(data.total || 0);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Acesso negado: apenas administradores podem visualizar esta página.');
      } else {
        setError('Erro ao carregar a lista de usuários. Tente novamente.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, perPage, debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Manipulador de sucesso após edição
  const handleEditSuccess = (updatedUser, msg) => {
    setToastMessage({ type: 'success', text: msg || 'Usuário atualizado com sucesso!' });
    fetchUsers(true);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Manipulador de sucesso após exclusão
  const handleDeleteSuccess = (userId, msg) => {
    setToastMessage({ type: 'success', text: msg || 'Ação de exclusão concluída com sucesso!' });
    fetchUsers(true);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Bloqueio client-side caso um estudante chegue a esta tela
  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-4">
          <div className="inline-flex p-3 bg-rose-100 text-rose-600 rounded-2xl">
            <XCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Acesso Restrito</h2>
          <p className="text-xs text-slate-500">
            Esta área é restrita para administradores da plataforma.
          </p>
          <button
            onClick={onNavigateToSettings}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
          >
            Voltar ao Meu Perfil
          </button>
        </div>
      </div>
    );
  }

  // Estatísticas rápidas da listagem atual
  const activeCount = users.filter((u) => u.is_active).length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Cabeçalho */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600 text-white p-2 rounded-xl shadow-md shadow-purple-200">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-slate-800 text-lg leading-none">Dictadle</h1>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-black rounded-full uppercase tracking-wider">
                Admin
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Painel de Controle e Gestão</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Configurações</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-semibold rounded-xl transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6 flex-1">
        {/* Toast Notificação de Feedback */}
        {toastMessage && (
          <div
            className={`p-4 rounded-2xl border text-xs flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <span className="font-medium">{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Título e Ações Rápidas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-600" />
              <span>Gestão de Usuários</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Visualize, edite e gerencie o ciclo de vida dos usuários cadastrados na plataforma.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchUsers(true)}
              disabled={loading || refreshing}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-xl shadow-sm hover:shadow transition disabled:opacity-50"
              title="Recarregar dados"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
              <span>{refreshing ? 'Atualizando...' : 'Atualizar'}</span>
            </button>
          </div>
        </div>

        {/* Cards de Resumo e Métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Encontrado</p>
              <p className="text-xl font-black text-slate-800">{totalUsers}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ativos na Página</p>
              <p className="text-xl font-black text-slate-800">{activeCount}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Admins na Página</p>
              <p className="text-xl font-black text-slate-800">{adminCount}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Páginas Totais</p>
              <p className="text-xl font-black text-slate-800">{totalPages}</p>
            </div>
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
          {/* Campo de Busca Textual */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome de usuário ou e-mail..."
              className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition"
                title="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtro por Perfil (Role) */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-44 py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            >
              <option value="all">Todos os Perfis</option>
              <option value="student">Apenas Estudantes</option>
              <option value="admin">Apenas Administradores</option>
            </select>
          </div>

          {/* Filtro por Status (Ativo / Inativo) */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-40 py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Apenas Ativos</option>
              <option value="inactive">Apenas Inativos</option>
            </select>
          </div>

          {/* Seletor de Registros por Página */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="w-full md:w-28 py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            >
              <option value={10}>10 por pág.</option>
              <option value={20}>20 por pág.</option>
              <option value={50}>50 por pág.</option>
            </select>
          </div>
        </div>

        {/* Mensagem de Erro Geral */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => fetchUsers()}
              className="text-xs font-bold underline hover:text-rose-900"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Tabela de Usuários */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-xs font-medium">Carregando usuários cadastrados...</p>
            </div>
          ) : users.length === 0 ? (
            /* Estado Vazio */
            <div className="py-20 px-4 text-center space-y-3">
              <div className="inline-flex p-3.5 bg-slate-100 text-slate-400 rounded-2xl">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">Nenhum usuário encontrado</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Não localizamos nenhum usuário que atenda aos critérios da pesquisa ou filtros informados.
              </p>
              {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setRoleFilter('all');
                    setStatusFilter('all');
                  }}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
                >
                  Limpar Todos os Filtros
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">ID</th>
                    <th className="py-3.5 px-6">Usuário</th>
                    <th className="py-3.5 px-6">E-mail</th>
                    <th className="py-3.5 px-6 text-center">Perfil</th>
                    <th className="py-3.5 px-6 text-center">Status</th>
                    <th className="py-3.5 px-6 text-center">2FA</th>
                    <th className="py-3.5 px-6">Data de Cadastro</th>
                    <th className="py-3.5 px-6 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {users.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-slate-50/80 transition group ${
                          isSelf ? 'bg-indigo-50/30' : ''
                        }`}
                      >
                        {/* ID */}
                        <td className="py-3.5 px-6 font-mono text-[11px] text-slate-400">
                          #{u.id}
                        </td>

                        {/* Nome do Usuário */}
                        <td className="py-3.5 px-6 font-semibold text-slate-800">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold uppercase flex-shrink-0">
                              {u.username ? u.username.substring(0, 2) : 'US'}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold">{u.username}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 text-[9px] font-extrabold rounded-md uppercase">
                                  Você
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* E-mail */}
                        <td className="py-3.5 px-6 text-slate-600 font-normal">
                          {u.email}
                        </td>

                        {/* Perfil */}
                        <td className="py-3.5 px-6 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              u.role === 'admin'
                                ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                            }`}
                          >
                            {u.role === 'admin' ? 'Administrador' : 'Estudante'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-6 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              u.is_active
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                            <span>{u.is_active ? 'Ativo' : 'Inativo'}</span>
                          </span>
                        </td>

                        {/* 2FA */}
                        <td className="py-3.5 px-6 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.is_2fa_enabled
                                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                : 'bg-slate-50 text-slate-400 border border-slate-100'
                            }`}
                          >
                            <KeyRound className="w-3 h-3" />
                            <span>{u.is_2fa_enabled ? 'Ativo' : 'Desativado'}</span>
                          </span>
                        </td>

                        {/* Data de Cadastro */}
                        <td className="py-3.5 px-6 text-slate-500 text-[11px] whitespace-nowrap">
                          {u.created_at
                            ? new Date(u.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </td>

                        {/* Ações: Visualização, Edição e Exclusão */}
                        <td className="py-3.5 px-6 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Ver Detalhes */}
                            <button
                              onClick={() => setSelectedUser(u)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                              title="Visualizar detalhes do usuário"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Editar Usuário */}
                            <button
                              onClick={() => setUserToEdit(u)}
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition"
                              title="Editar dados do usuário"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {/* Excluir Usuário */}
                            <button
                              onClick={() => setUserToDelete(u)}
                              className={`p-1.5 rounded-lg transition ${
                                isSelf
                                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-600'
                              }`}
                              title={
                                isSelf
                                  ? 'Você não pode excluir sua própria conta pela lista'
                                  : 'Excluir ou desativar usuário'
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginação */}
          {!loading && users.length > 0 && (
            <div className="border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <p>
                Mostrando <span className="font-bold text-slate-700">{users.length}</span> de{' '}
                <span className="font-bold text-slate-700">{totalUsers}</span> usuários cadastrados (Página{' '}
                <span className="font-bold text-slate-700">{page}</span> de{' '}
                <span className="font-bold text-slate-700">{totalPages}</span>)
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1 disabled:opacity-40 disabled:hover:bg-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>

                <div className="px-2 font-bold text-slate-600">
                  {page} / {totalPages}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1 disabled:opacity-40 disabled:hover:bg-white"
                >
                  <span>Próxima</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Detalhes do Usuário */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Cabeçalho do Modal */}
            <div className="p-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm uppercase shadow-sm shadow-indigo-200">
                  {selectedUser.username ? selectedUser.username.substring(0, 2) : 'US'}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 leading-tight">
                    {selectedUser.username}
                  </h3>
                  <p className="text-xs text-slate-400">Identificador #{selectedUser.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Corpo do Modal */}
            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  E-mail
                </span>
                <span className="font-bold text-slate-800">{selectedUser.email}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  Perfil de Acesso
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    selectedUser.role === 'admin'
                      ? 'bg-purple-50 text-purple-700 border border-purple-100'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                  }`}
                >
                  {selectedUser.role === 'admin' ? 'Administrador' : 'Estudante'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-slate-400" />
                  Status da Conta
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedUser.is_active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'bg-rose-50 text-rose-700 border border-rose-100'
                  }`}
                >
                  {selectedUser.is_active ? 'Conta Ativa' : 'Conta Inativa / Desativada'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  Verificação em 2 Etapas
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedUser.is_2fa_enabled
                      ? 'bg-blue-50 text-blue-700 border border-blue-100'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {selectedUser.is_2fa_enabled ? 'Habilitado (TOTP)' : 'Não configurado'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Data de Registro
                </span>
                <span className="font-semibold text-slate-700">
                  {selectedUser.created_at
                    ? new Date(selectedUser.created_at).toLocaleString('pt-BR')
                    : '—'}
                </span>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  const target = selectedUser;
                  setSelectedUser(null);
                  setUserToEdit(target);
                }}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Editar este Usuário</span>
              </button>

              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Usuário */}
      <EditUserModal
        user={userToEdit}
        isOpen={Boolean(userToEdit)}
        onClose={() => setUserToEdit(null)}
        onSuccess={handleEditSuccess}
        currentUser={currentUser}
      />

      {/* Modal de Exclusão / Desativação de Usuário */}
      <DeleteUserModal
        user={userToDelete}
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        onSuccess={handleDeleteSuccess}
        currentUser={currentUser}
      />
    </div>
  );
}
