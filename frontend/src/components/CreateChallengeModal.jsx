import React, { useState, useEffect } from 'react';
import { challengeService } from '../services/api';
import {
  X,
  Film,
  Video,
  Clock,
  Sparkles,
  Globe,
  FileCheck,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';

/**
 * Utilitário para extrair o ID de vídeo do YouTube a partir de URLs comuns.
 * Suporta formatos:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export const extractYoutubeVideoId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  return match ? match[1] : null;
};

/**
 * Componente CreateChallengeModal (SCRUM-131 / US-87)
 * 
 * Formulário modal em React para inserção e validação dos dados de um novo Desafio
 * de Transcrição no Dictadle.
 *
 * Campos gerenciados:
 * - title: Título descritivo do desafio (máx 150 caracteres)
 * - video_url: URL válida de vídeo no YouTube
 * - start_time_seconds: Segundo inicial do trecho
 * - end_time_seconds: Segundo final do trecho (duração entre 5s e 30s)
 * - difficulty: Nível pedagógico ('easy', 'medium', 'hard')
 * - accent: Sotaque em inglês do áudio (ex: 'American', 'British', etc.)
 * - transcript_official: Transcrição oficial para avaliação via distância de Levenshtein
 */
export default function CreateChallengeModal({
  isOpen,
  onClose,
  onSubmit,
  onSuccess,
  loading = false,
  error = null,
}) {
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [accent, setAccent] = useState('American');
  const [customAccent, setCustomAccent] = useState('');
  const [transcriptOfficial, setTranscriptOfficial] = useState('');

  // Estados locais de validação, requisição e feedback
  const [internalLoading, setInternalLoading] = useState(false);
  const [clientError, setClientError] = useState(null);
  const [serverError, setServerError] = useState(null);
  const [youtubeVideoId, setYoutubeVideoId] = useState(null);

  // Redefine o formulário ao abrir ou fechar
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setVideoUrl('');
      setStartTime('');
      setEndTime('');
      setDifficulty('medium');
      setAccent('American');
      setCustomAccent('');
      setTranscriptOfficial('');
      setClientError(null);
      setServerError(null);
      setInternalLoading(false);
      setYoutubeVideoId(null);
    }
  }, [isOpen]);

  // Atualiza o ID do vídeo do YouTube conforme a URL é digitada
  useEffect(() => {
    if (!videoUrl.trim()) {
      setYoutubeVideoId(null);
    } else {
      const extractedId = extractYoutubeVideoId(videoUrl);
      setYoutubeVideoId(extractedId);
    }
  }, [videoUrl]);

  if (!isOpen) return null;

  // Cálculo e validação em tempo real da duração do clipe
  const numStart = startTime === '' ? null : Number(startTime);
  const numEnd = endTime === '' ? null : Number(endTime);
  const hasTimes = numStart !== null && numEnd !== null && !isNaN(numStart) && !isNaN(numEnd);
  const duration = hasTimes ? numEnd - numStart : null;

  let durationStatus = null;
  if (hasTimes) {
    if (numStart < 0) {
      durationStatus = { type: 'error', message: 'O tempo inicial não pode ser negativo.' };
    } else if (numEnd <= numStart) {
      durationStatus = { type: 'error', message: 'O tempo final deve ser maior que o tempo inicial.' };
    } else if (duration < 5) {
      durationStatus = { type: 'error', message: `Duração de ${duration}s muito curta. Mínimo permitido: 5 segundos.` };
    } else if (duration > 30) {
      durationStatus = { type: 'error', message: `Duração de ${duration}s muito longa. Máximo permitido: 30 segundos.` };
    } else {
      durationStatus = {
        type: 'success',
        message: `Duração: ${duration}s (Ideal para ditado: recomendado entre 10s e 15s).`,
      };
    }
  }

  const effectiveAccent = accent === 'Other' ? customAccent.trim() : accent;
  const effectiveLoading = loading || internalLoading;
  const activeError = clientError || serverError || error;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setClientError(null);
    setServerError(null);

    // Validação 1: Título
    if (!title.trim()) {
      setClientError('Informe o título do desafio.');
      return;
    }
    if (title.trim().length > 150) {
      setClientError('O título deve ter no máximo 150 caracteres.');
      return;
    }

    // Validação 2: URL do YouTube
    if (!videoUrl.trim()) {
      setClientError('Informe a URL do vídeo no YouTube.');
      return;
    }
    const detectedId = extractYoutubeVideoId(videoUrl);
    if (!detectedId) {
      setClientError('A URL informada não é um link válido do YouTube.');
      return;
    }

    // Validação 3: Tempos e Duração
    if (startTime === '' || endTime === '') {
      setClientError('Informe os segundos de início e término do trecho do vídeo.');
      return;
    }
    if (isNaN(numStart) || isNaN(numEnd)) {
      setClientError('Os tempos de início e fim devem ser números inteiros em segundos.');
      return;
    }
    if (numStart < 0) {
      setClientError('O tempo inicial não pode ser negativo.');
      return;
    }
    if (numEnd <= numStart) {
      setClientError('O tempo final deve ser maior que o tempo inicial.');
      return;
    }
    if (duration < 5 || duration > 30) {
      setClientError('O trecho do desafio deve ter entre 5 e 30 segundos de duração.');
      return;
    }

    // Validação 4: Sotaque
    if (!effectiveAccent) {
      setClientError('Informe o sotaque em inglês do áudio.');
      return;
    }
    if (effectiveAccent.length > 50) {
      setClientError('O sotaque deve ter no máximo 50 caracteres.');
      return;
    }

    // Validação 5: Transcrição Oficial
    if (!transcriptOfficial.trim()) {
      setClientError('Informe a transcrição oficial em inglês (gabarito do desafio).');
      return;
    }

    const payload = {
      title: title.trim(),
      video_url: videoUrl.trim(),
      start_time_seconds: Math.floor(numStart),
      end_time_seconds: Math.floor(numEnd),
      difficulty,
      accent: effectiveAccent,
      transcript_official: transcriptOfficial.trim(),
    };

    setInternalLoading(true);

    try {
      let createdChallenge;
      let successMessage;

      if (onSubmit) {
        const res = await onSubmit(payload);
        createdChallenge = res?.data?.challenge || res?.challenge || payload;
        successMessage = res?.data?.message || res?.message || 'Desafio cadastrado com sucesso!';
      } else {
        const response = await challengeService.createChallenge(payload);
        createdChallenge = response.data?.challenge || payload;
        successMessage = response.data?.message || 'Desafio cadastrado com sucesso!';
      }

      if (onSuccess) {
        onSuccess(createdChallenge, successMessage);
      }
      onClose();
    } catch (err) {
      let errMsg = 'Erro ao cadastrar desafio. Tente novamente.';
      if (err.response) {
        if (err.response.status === 403) {
          errMsg = 'Acesso restrito: apenas administradores podem criar desafios.';
        } else if (err.response.status === 401) {
          errMsg = 'Sua sessão expirou ou é inválida. Faça login novamente como administrador.';
        } else if (err.response.data?.error) {
          errMsg = err.response.data.error;
        } else if (err.response.data?.message) {
          errMsg = err.response.data.message;
        }
      } else if (err.message) {
        errMsg = err.message;
      }
      setServerError(errMsg);
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabeçalho do Modal */}
        <div className="p-5 sm:p-6 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-800 leading-tight">
                  Criar Novo Desafio
                </h3>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full">
                  US-87
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cadastre um trecho do YouTube e seu gabarito oficial para os alunos transcreverem.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={effectiveLoading}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition disabled:opacity-50"
            title="Fechar formulário"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo do Formulário com Rolagem Suave */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Alertas de Erro (Client-Side ou Server-Side) */}
          {activeError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-800 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
              <div className="flex-1 font-medium leading-relaxed">
                {activeError}
              </div>
            </div>
          )}

          {/* Campo 1: Título do Desafio */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="challenge-title"
                className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider"
              >
                Título do Desafio <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[11px] font-medium ${
                  title.length > 150 ? 'text-rose-600 font-bold' : 'text-slate-400'
                }`}
              >
                {title.length}/150
              </span>
            </div>
            <div className="relative">
              <Film className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="challenge-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={150}
                placeholder="Ex: Friends - Joey Doesn't Share Food (Season 10)"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition text-slate-800 placeholder:text-slate-400"
                disabled={effectiveLoading}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Dê um nome intuitivo para facilitar a identificação do desafio no catálogo.
            </p>
          </div>

          {/* Campo 2: URL do Vídeo no YouTube */}
          <div>
            <label
              htmlFor="challenge-video-url"
              className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              URL do Vídeo no YouTube <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Video className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="challenge-video-url"
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition text-slate-800 placeholder:text-slate-400"
                disabled={effectiveLoading}
              />
            </div>

            {/* Preview do Vídeo do YouTube quando reconhecido */}
            {youtubeVideoId ? (
              <div className="mt-2.5 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={`https://img.youtube.com/vi/${youtubeVideoId}/mqdefault.jpg`}
                    alt="Thumbnail do Vídeo"
                    className="w-16 h-10 object-cover rounded-lg border border-emerald-200 shadow-xs shrink-0"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Vídeo do YouTube detectado</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 font-mono truncate">
                      ID: {youtubeVideoId}
                    </p>
                  </div>
                </div>
                <a
                  href={`https://www.youtube.com/watch?v=${youtubeVideoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition shrink-0"
                >
                  <span>Abrir</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : videoUrl.trim() ? (
              <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>Link do YouTube não reconhecido. Certifique-se de usar o link completo ou encurtado (youtu.be).</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">
                Insira o link padrão do YouTube (ex: https://www.youtube.com/watch?v=... ou https://youtu.be/...).
              </p>
            )}
          </div>

          {/* Campo 3: Intervalo de Tempo (start_time e end_time) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Recorte Temporal do Trecho (em segundos) <span className="text-rose-500">*</span></span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Recomendado: 10s - 15s</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="challenge-start-time"
                  className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                >
                  Início do Trecho (start_time_seconds)
                </label>
                <div className="relative">
                  <input
                    id="challenge-start-time"
                    type="number"
                    min="0"
                    step="1"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition text-slate-800"
                    disabled={effectiveLoading}
                  />
                  <span className="absolute right-3 top-2.5 text-[11px] font-medium text-slate-400">
                    seg
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="challenge-end-time"
                  className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                >
                  Fim do Trecho (end_time_seconds)
                </label>
                <div className="relative">
                  <input
                    id="challenge-end-time"
                    type="number"
                    min="1"
                    step="1"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="15"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition text-slate-800"
                    disabled={effectiveLoading}
                  />
                  <span className="absolute right-3 top-2.5 text-[11px] font-medium text-slate-400">
                    seg
                  </span>
                </div>
              </div>
            </div>

            {/* Badge Dinâmico de Duração */}
            {durationStatus ? (
              <div
                className={`p-2.5 rounded-xl text-[11px] font-medium flex items-center gap-2 border ${
                  durationStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {durationStatus.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                )}
                <span>{durationStatus.message}</span>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400">
                O áudio exibido para o aluno tocará exatamente entre o segundo inicial e final (limite de 5s a 30s).
              </p>
            )}
          </div>

          {/* Campo 4: Dificuldade e Sotaque */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dificuldade */}
            <div>
              <label
                htmlFor="challenge-difficulty"
                className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Nível de Dificuldade <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Sparkles className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <select
                  id="challenge-difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition text-slate-800 appearance-none font-medium cursor-pointer"
                  disabled={effectiveLoading}
                >
                  <option value="easy">Fácil (Fala clara e vocabulário simples)</option>
                  <option value="medium">Médio (Velocidade natural e cotidiano)</option>
                  <option value="hard">Difícil (Fala rápida, gírias ou sotaque forte)</option>
                </select>
              </div>
            </div>

            {/* Sotaque */}
            <div>
              <label
                htmlFor="challenge-accent"
                className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Sotaque Predominante <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <select
                  id="challenge-accent"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition text-slate-800 appearance-none font-medium cursor-pointer"
                  disabled={effectiveLoading}
                >
                  <option value="American">Americano (EUA)</option>
                  <option value="British">Britânico (Reino Unido)</option>
                  <option value="Australian">Australiano</option>
                  <option value="Canadian">Canadense</option>
                  <option value="Irish">Irlandês</option>
                  <option value="Other">Outro (especificar)</option>
                </select>
              </div>

              {accent === 'Other' && (
                <input
                  type="text"
                  value={customAccent}
                  onChange={(e) => setCustomAccent(e.target.value)}
                  placeholder="Ex: Escocês, Sul-Africano, etc."
                  maxLength={50}
                  className="mt-2 w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition text-slate-800 text-xs"
                  disabled={effectiveLoading}
                />
              )}
            </div>
          </div>

          {/* Campo 5: Transcrição Oficial (Gabarito Oficial) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="challenge-transcript"
                className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider"
              >
                Transcrição Oficial (Gabarito) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                <span>Base para o algoritmo de Levenshtein</span>
              </span>
            </div>
            <div className="relative">
              <textarea
                id="challenge-transcript"
                rows={4}
                value={transcriptOfficial}
                onChange={(e) => setTranscriptOfficial(e.target.value)}
                placeholder="Ex: I'm not in danger, Skyler. I am the danger. A guy opens his door and gets shot, and you think that of me? No. I am the one who knocks!"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition text-slate-800 placeholder:text-slate-400 font-normal leading-relaxed resize-y"
                disabled={effectiveLoading}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Escreva o texto exato falado no áudio em inglês. A acurácia do aluno será calculada comparando a transcrição digitada com este gabarito.
            </p>
          </div>

          {/* Rodapé e Botões de Ação */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={effectiveLoading}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={effectiveLoading || (durationStatus && durationStatus.type === 'error')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-100 flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {effectiveLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cadastrando...</span>
                </>
              ) : (
                <>
                  <Film className="w-4 h-4" />
                  <span>Criar Desafio</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
