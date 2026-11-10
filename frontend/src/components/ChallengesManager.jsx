import React, { useState, useEffect, useCallback } from 'react';
import { challengeService } from '../services/api';
import {
  Film,
  Search,
  Filter,
  PlusCircle,
  RefreshCw,
  ExternalLink,
  Eye,
  Globe,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  X,
  FileCheck,
  AlertCircle,
  Video,
  ChevronLeft,
  ChevronRight,
  Layers,
  HelpCircle,
} from 'lucide-react';

/**
 * Componente ChallengesManager (SCRUM-138 / US-90)
 *
 * Gerencia a listagem de desafios em tabela e cards no painel administrativo,
 * com busca textual por título, filtros por dificuldade, sotaque e status,
 * além de modal para consulta do gabarito oficial.
 */
export default function ChallengesManager({
  onOpenCreateChallenge,
  refreshTrigger = 0,
}) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filtros e Paginação
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [accentFilter, setAccentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalChallenges, setTotalChallenges] = useState(0);

  // Modal de Detalhes do Desafio
  const [selectedChallenge, setSelectedChallenge] = useState(null);

  // Debounce para busca textual no título
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Carregamento de Desafios da API
  const fetchChallenges = useCallback(
    async (isSilentRefresh = false) => {
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
          difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
          accent: accentFilter !== 'all' ? accentFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        };

        const response = await challengeService.getChallenges(params);
        const data = response.data;
        setChallenges(data.challenges || []);
        setTotalPages(data.pages || 1);
        setTotalChallenges(data.total || 0);
      } catch (err) {
        if (err.response?.status === 403) {
          setError('Acesso negado: apenas administradores podem visualizar os desafios.');
        } else {
          setError('Erro ao carregar a lista de desafios. Verifique a conexão com o servidor.');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, perPage, debouncedSearch, difficultyFilter, accentFilter, statusFilter]
  );

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges, refreshTrigger]);

  // Formatação de segundos para MM:SS
  const formatSeconds = (sec) => {
    if (sec === null || sec === undefined) return '00:00';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Badges de Dificuldade
  const renderDifficultyBadge = (diff) => {
    switch (diff) {
      case 'easy':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Fácil
          </span>
        );
      case 'hard':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Difícil
          </span>
        );
      case 'medium':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Médio
          </span>
        );
    }
  };

  // Contagens para os cards de resumo
  const activeCount = challenges.filter((c) => c.is_active).length;
  const easyCount = challenges.filter((c) => c.difficulty === 'easy').length;
  const mediumCount = challenges.filter((c) => c.difficulty === 'medium').length;
  const hardCount = challenges.filter((c) => c.difficulty === 'hard').length;

  return (
    <div className="space-y-6">
      {/* Título e Ações Principais */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Film className="w-6 h-6 text-indigo-600" />
            <span>Gestão de Desafios</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Consulte, gerencie e audite os trechos de áudio e gabaritos oficiais cadastrados para os alunos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCreateChallenge}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition"
            title="Cadastrar novo desafio"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Novo Desafio</span>
          </button>

          <button
            onClick={() => fetchChallenges(true)}
            disabled={loading || refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-xl shadow-sm hover:shadow transition disabled:opacity-50"
            title="Recarregar dados"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : 'text-slate-500'}`}
            />
            <span>{refreshing ? 'Atualizando...' : 'Atualizar'}</span>
          </button>
        </div>
      </div>

      {/* Cards de Resumo e Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total de Desafios</p>
            <p className="text-xl font-black text-slate-800">{totalChallenges}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Desafios Ativos</p>
            <p className="text-xl font-black text-slate-800">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Fácil / Médio / Difícil</p>
            <p className="text-xs font-black text-slate-800">
              {easyCount} <span className="text-slate-400 font-normal">/</span> {mediumCount}{' '}
              <span className="text-slate-400 font-normal">/</span> {hardCount}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
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
            placeholder="Buscar por título do desafio..."
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

        {/* Filtro por Dificuldade */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={difficultyFilter}
            onChange={(e) => {
              setDifficultyFilter(e.target.value);
              setPage(1);
            }}
            className="w-full md:w-40 py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition cursor-pointer"
          >
            <option value="all">Todas as Dificuldades</option>
            <option value="easy">Fácil</option>
            <option value="medium">Médio</option>
            <option value="hard">Difícil</option>
          </select>
        </div>

        {/* Filtro por Sotaque */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={accentFilter}
            onChange={(e) => {
              setAccentFilter(e.target.value);
              setPage(1);
            }}
            className="w-full md:w-40 py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition cursor-pointer"
          >
            <option value="all">Todos os Sotaques</option>
            <option value="American">Americano</option>
            <option value="British">Britânico</option>
            <option value="Australian">Australiano</option>
            <option value="Canadian">Canadense</option>
            <option value="Irish">Irlandês</option>
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
            className="w-full md:w-36 py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition cursor-pointer"
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
            className="w-full md:w-28 py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition cursor-pointer"
          >
            <option value={5}>5 por pág.</option>
            <option value={10}>10 por pág.</option>
            <option value={20}>20 por pág.</option>
            <option value={50}>50 por pág.</option>
          </select>
        </div>
      </div>

      {/* Erro de Requisição */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Tabela de Desafios */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Vídeo</th>
                <th className="py-3.5 px-4">Título do Desafio</th>
                <th className="py-3.5 px-4">Dificuldade</th>
                <th className="py-3.5 px-4">Sotaque</th>
                <th className="py-3.5 px-4">Recorte & Duração</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {challenges.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60 transition">
                  {/* Thumbnail do YouTube */}
                  <td className="py-3 px-4">
                    <div className="relative w-16 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 group">
                      {c.youtube_video_id ? (
                        <img
                          src={`https://img.youtube.com/vi/${c.youtube_video_id}/mqdefault.jpg`}
                          alt={c.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Video className="w-4 h-4" />
                        </div>
                      )}
                      <a
                        href={c.video_url || `https://www.youtube.com/watch?v=${c.youtube_video_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition"
                        title="Abrir no YouTube"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </td>

                  {/* Título do Desafio */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-extrabold text-slate-800 text-xs line-clamp-1">
                        {c.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                        ID: #{c.id} • YT: {c.youtube_video_id || 'N/A'}
                      </span>
                    </div>
                  </td>

                  {/* Dificuldade */}
                  <td className="py-3 px-4">
                    {renderDifficultyBadge(c.difficulty)}
                  </td>

                  {/* Sotaque */}
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-700 bg-slate-100">
                      <Globe className="w-3 h-3 text-slate-500" />
                      <span>{c.accent || 'American'}</span>
                    </span>
                  </td>

                  {/* Recorte & Duração */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-500" />
                        <span>{c.duration || (c.end_time_seconds - c.start_time_seconds)}s</span>
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        {formatSeconds(c.start_time_seconds)} - {formatSeconds(c.end_time_seconds)}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    {c.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Inativo
                      </span>
                    )}
                  </td>

                  {/* Ações */}
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedChallenge(c)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="Ver gabarito e detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalhes do Desafio / Visualização de Gabarito */}
      {selectedChallenge && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Cabeçalho */}
            <div className="p-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 leading-tight">
                    Detalhes do Desafio
                  </h3>
                  <p className="text-xs text-slate-400">
                    Registro #{selectedChallenge.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedChallenge(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-6 space-y-4 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Título
                </span>
                <p className="text-sm font-extrabold text-slate-800">
                  {selectedChallenge.title}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Dificuldade
                  </span>
                  <div>{renderDifficultyBadge(selectedChallenge.difficulty)}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Sotaque
                  </span>
                  <p className="font-bold text-slate-700">
                    {selectedChallenge.accent}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Recorte
                  </span>
                  <p className="font-bold text-slate-700">
                    {formatSeconds(selectedChallenge.start_time_seconds)} - {formatSeconds(selectedChallenge.end_time_seconds)} ({selectedChallenge.duration || (selectedChallenge.end_time_seconds - selectedChallenge.start_time_seconds)}s)
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Status
                  </span>
                  <p className="font-bold text-slate-700">
                    {selectedChallenge.is_active ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  URL no YouTube
                </span>
                <a
                  href={selectedChallenge.video_url || `https://www.youtube.com/watch?v=${selectedChallenge.youtube_video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 font-mono text-xs flex items-center gap-1 break-all"
                >
                  <span>{selectedChallenge.video_url || `https://www.youtube.com/watch?v=${selectedChallenge.youtube_video_id}`}</span>
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                </a>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Transcrição Oficial (Gabarito)
                  </span>
                  <span className="text-[10px] text-indigo-600 font-medium flex items-center gap-1">
                    <FileCheck className="w-3 h-3" />
                    <span>Algoritmo de Levenshtein</span>
                  </span>
                </div>
                <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-slate-800 font-medium leading-relaxed">
                  {selectedChallenge.transcript_official || 'Sem gabarito registrado.'}
                </div>
              </div>
            </div>

            {/* Rodapé */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedChallenge(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
