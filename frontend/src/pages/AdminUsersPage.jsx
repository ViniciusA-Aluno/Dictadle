import React, { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';
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
} from 'lucide-react';

export default function AdminUsersPage({ currentUser, onNavigateToSettings, onLogout }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros e Paginação
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Debounce para busca textual suave
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Volta para a primeira página ao alterar o termo
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Carregamento de Usuários
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.getUsers({
        page,
        per_page: 10,
        search: debouncedSearch,
        role: roleFilter,
      });

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
    }
  }, [page, debouncedSearch, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Cenário 6: Bloqueio client-side caso um estudante chegue a esta tela
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Cabeçalho */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600 text-white p-2 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg">Dictadle</h1>
            <p className="text-xs text-slate-500">Painel Administrativo</p>
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
      <main className="max-w-6xl mx-auto w-full px-4 py-8 space-y-6">
        {/* Título e Contadores */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-600" />
              <span>Gestão de Usuários</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Acompanhe quem está utilizando o Dictadle e gerencie os perfis de acesso da plataforma.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs rounded-xl">
              {totalUsers} {totalUsers === 1 ? 'usuário encontrado' : 'usuários encontrados'}
            </span>
          </div>
        </div>

        {/* Barra de Ferramentas: Busca e Filtros (Cenários 3 e 4) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
          {/* Campo de Busca Textual */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
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
              className="w-full md:w-48 py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            >
              <option value="all">Todos os Perfis</option>
              <option value="student">Apenas Estudantes</option>
              <option value="admin">Apenas Administradores</option>
            </select>
          </div>
        </div>

        {/* Erro de Requisição */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Tabela de Usuários (Cenários 1, 2 e 5) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-xs">Carregando usuários cadastrados...</p>
            </div>
          ) : users.length === 0 ? (
            /* Estado Vazio (Cenário 5) */
            <div className="py-16 px-4 text-center space-y-3">
              <div className="inline-flex p-3.5 bg-slate-100 text-slate-400 rounded-2xl">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">Nenhum usuário encontrado</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Não encontramos nenhum registro correspondente ao termo pesquisado ou filtro aplicado.
              </p>
              {(searchTerm || roleFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setRoleFilter('all');
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Usuário</th>
                    <th className="py-3.5 px-6">E-mail</th>
                    <th className="py-3.5 px-6 text-center">Perfil</th>
                    <th className="py-3.5 px-6 text-center">Status</th>
                    <th className="py-3.5 px-6">Data de Cadastro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/80 transition group"
                    >
                      {/* Nome do Usuário */}
                      <td className="py-3.5 px-6 font-semibold text-slate-800 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold uppercase">
                          {u.username.substring(0, 2)}
                        </div>
                        <span>{u.username}</span>
                      </td>

                      {/* E-mail */}
                      <td className="py-3.5 px-6 text-slate-600">
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

                      {/* Data de Cadastro */}
                      <td className="py-3.5 px-6 text-slate-500 text-[11px]">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginação (Cenário 2) */}
          {!loading && users.length > 0 && (
            <div className="border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <p>
                Mostrando <span className="font-bold text-slate-700">{users.length}</span> de{' '}
                <span className="font-bold text-slate-700">{totalUsers}</span> usuários (Página{' '}
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
    </div>
  );
}
