import React, { useState, useEffect } from 'react';
import { challengeService } from '../services/api';
import {
  X,
  Pencil,
  Video,
  Clock,
  Sparkles,
  Globe,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  HelpCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { extractYoutubeVideoId } from './CreateChallengeModal';

/**
 * Componente EditChallengeModal (SCRUM-88 / SCRUM-135 / SCRUM-136)
 *
 * Modal para edição dos dados cadastrais e pedagógicos de um desafio existente.
 * Valida estritamente a janela pedagógica de 10 a 15 segundos, limites de caracteres
 * e integra pré-visualização de áudio/vídeo do YouTube.
 */
export default function EditChallengeModal({
  isOpen,
  challenge,
  onClose,
  onSuccess,
}) {
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [accent, setAccent] = useState('American');
  const [customAccent, setCustomAccent] = useState('');
  const [transcriptOfficial, setTranscriptOfficial] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Estados locais de validação, requisição e preview
  const [loading, setLoading] = useState(false);
  const [clientError, setClientError] = useState(null);
  const [serverError, setServerError] = useState(null);
  const [youtubeVideoId, setYoutubeVideoId] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Popula os campos do formulário sempre que o desafio a ser editado mudar
  useEffect(() => {
    if (isOpen && challenge) {
      setTitle(challenge.title || '');
      setVideoUrl(challenge.video_url || '');
      setStartTime(challenge.start_time_seconds !== undefined ? String(challenge.start_time_seconds) : '');
      setEndTime(challenge.end_time_seconds !== undefined ? String(challenge.end_time_seconds) : '');
      setDifficulty(challenge.difficulty || 'medium');
      
      const standardAccents = ['American', 'British', 'Australian', 'Canadian', 'Irish'];
      if (standardAccents.includes(challenge.accent)) {
        setAccent(challenge.accent);
        setCustomAccent('');
      } else if (challenge.accent) {
        setAccent('Other');
        setCustomAccent(challenge.accent);
      } else {
        setAccent('American');
        setCustomAccent('');
      }

      setTranscriptOfficial(challenge.transcript_official || '');
      setIsActive(challenge.is_active !== undefined ? challenge.is_active : true);
      setClientError(null);
      setServerError(null);
      setLoading(false);
      setShowPreview(false);

      const detectedId = challenge.youtube_video_id || extractYoutubeVideoId(challenge.video_url || '');
      setYoutubeVideoId(detectedId);
    }
  }, [isOpen, challenge]);

  // Atualiza dinamicamente o ID do YouTube caso a URL seja modificada
  useEffect(() => {
    if (!videoUrl.trim()) {
      setYoutubeVideoId(null);
    } else {
      const extractedId = extractYoutubeVideoId(videoUrl);
      setYoutubeVideoId(extractedId);
    }
  }, [videoUrl]);

  if (!isOpen || !challenge) return null;

  // Cálculo e validação em tempo real da duração (Regra pedagógica estrita de 10 a 15 segundos)
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
    } else if (duration < 10) {
      durationStatus = {
        type: 'error',
        message: `A duração do clipe deve ser de no mínimo 10 segundos (atual: ${duration}s).`,
      };
    } else if (duration > 15) {
      durationStatus = {
        type: 'error',
        message: `A duração do clipe deve ser de no máximo 15 segundos (atual: ${duration}s).`,
      };
    } else {
      durationStatus = {
        type: 'success',
        message: `Duração ideal de ${duration}s (dentro da janela recomendada de 10 a 15 segundos).`,
      };
    }
  }

  const effectiveAccent = accent === 'Other' ? customAccent.trim() : accent;
  const activeError = clientError || serverError;

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

    // Validação 3: Tempos e Duração (Janela de 10s a 15s)
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
    if (duration < 10) {
      setClientError('A duração do clipe deve ser de no mínimo 10 segundos.');
      return;
    }
    if (duration > 15) {
      setClientError('A duração do clipe deve ser de no máximo 15 segundos.');
      return;
    }

    // Validação 4: Sotaque
    if (!effectiveAccent) {
      setClientError('Informe o sotaque predominante.');
      return;
    }
    if (effectiveAccent.length > 50) {
      setClientError('O sotaque deve ter no máximo 50 caracteres.');
      return;
    }

    // Validação 5: Gabarito Oficial (limite de 500 caracteres)
    if (!transcriptOfficial.trim()) {
      setClientError('A transcrição oficial (gabarito) é obrigatória.');
      return;
    }
    if (transcriptOfficial.trim().length > 500) {
      setClientError('O gabarito oficial deve ter no máximo 500 caracteres.');
      return;
    }

    const payload = {
      title: title.trim(),
      video_url: videoUrl.trim(),
      start_time_seconds: numStart,
      end_time_seconds: numEnd,
      difficulty,
      accent: effectiveAccent,
      transcript_official: transcriptOfficial.trim(),
      is_active: isActive,
    };

    setLoading(true);
    try {
      const response = await challengeService.updateChallenge(challenge.id, payload);
      if (onSuccess) {
        onSuccess(response.data?.challenge || payload);
      }
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        'Erro ao atualizar o desafio. Verifique os dados e tente novamente.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const previewEmbedUrl =
    youtubeVideoId && hasTimes && numEnd > numStart
      ? `https://www.youtube.com/embed/${youtubeVideoId}?start=${numStart}&end=${numEnd}&rel=0&controls=1&autoplay=1`
      : null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="p-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 leading-tight">
                Editar Desafio
              </h3>
              <p className="text-xs text-slate-400">
                Ajustando registro #{challenge.id} • Janela pedagógica: 10s a 15s
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
            title="Cancelar e fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Alerta de Erro */}
          {activeError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1">
                <p className="font-bold text-xs">Não foi possível salvar as alterações</p>
                <p className="text-[11px] text-rose-600 mt-0.5">{activeError}</p>
              </div>
            </div>
          )}

          {/* Campo 1: Título */}
          <div>
            <label
              htmlFor="edit-challenge-title"
              className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Título do Desafio <span className="text-rose-500">*</span>
            </label>
            <input
              id="edit-challenge-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Casual greetings among friends"
              maxLength={150}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition text-slate-800 placeholder:text-slate-400 font-medium"
              disabled={loading}
            />
          </div>

          {/* Campo 2: URL do YouTube */}
          <div>
            <label
              htmlFor="edit-challenge-url"
              className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              URL do Vídeo no YouTube <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Video className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="edit-challenge-url"
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition text-slate-800 placeholder:text-slate-400 font-medium font-mono text-[11px]"
                disabled={loading}
              />
            </div>
          </div>

          {/* Campo 3: Recorte Temporal (start_time e end_time) */}
          <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Recorte Temporal (Janela de 10 a 15 segundos)</span>
              </span>
              {previewEmbedUrl && (
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{showPreview ? 'Ocultar Player' : 'Testar Trecho'}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="edit-start-time"
                  className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                >
                  Segundo Inicial (Start)
                </label>
                <input
                  id="edit-start-time"
                  type="number"
                  min="0"
                  step="1"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="Ex: 15"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition text-slate-800 font-bold"
                  disabled={loading}
                />
              </div>

              <div>
                <label
                  htmlFor="edit-end-time"
                  className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                >
                  Segundo Final (End)
                </label>
                <input
                  id="edit-end-time"
                  type="number"
                  min="0"
                  step="1"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="Ex: 28"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition text-slate-800 font-bold"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Status da Duração com feedback visual */}
            {durationStatus && (
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
            )}

            {/* Player Embed de Teste Integrado (Cenário 2) */}
            {showPreview && previewEmbedUrl && (
              <div className="mt-3 rounded-2xl overflow-hidden border border-slate-200 bg-black aspect-video relative shadow-inner animate-in fade-in duration-200">
                <iframe
                  title="Preview do Trecho"
                  src={previewEmbedUrl}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>

          {/* Campo 4: Dificuldade e Sotaque */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="edit-challenge-difficulty"
                className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Nível de Dificuldade <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Sparkles className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <select
                  id="edit-challenge-difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition text-slate-800 appearance-none font-medium cursor-pointer"
                  disabled={loading}
                >
                  <option value="easy">Fácil (Fala clara e vocabulário simples)</option>
                  <option value="medium">Médio (Velocidade natural e cotidiano)</option>
                  <option value="hard">Difícil (Fala rápida, gírias ou sotaque forte)</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="edit-challenge-accent"
                className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Sotaque Predominante <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <select
                  id="edit-challenge-accent"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition text-slate-800 appearance-none font-medium cursor-pointer"
                  disabled={loading}
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
                  disabled={loading}
                />
              )}
            </div>
          </div>

          {/* Campo 5: Transcrição Oficial (Gabarito Oficial com limite de 500 caracteres) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="edit-challenge-transcript"
                className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider"
              >
                Transcrição Oficial (Gabarito) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">
                {transcriptOfficial.length}/500 caracteres
              </span>
            </div>
            <textarea
              id="edit-challenge-transcript"
              rows={4}
              value={transcriptOfficial}
              onChange={(e) => setTranscriptOfficial(e.target.value)}
              placeholder="Digite o texto exato falado no áudio em inglês..."
              maxLength={500}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition text-slate-800 placeholder:text-slate-400 font-normal leading-relaxed resize-y"
              disabled={loading}
            />
          </div>

          {/* Campo 6: Status Ativo / Inativo */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <span className="font-bold text-slate-700 block text-xs">Disponibilidade do Desafio</span>
              <span className="text-[11px] text-slate-400">
                Desafios ativos ficam imediatamente disponíveis para resolução pelos alunos.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
                disabled={loading}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Rodapé e Botões de Ação */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || (durationStatus && durationStatus.type === 'error')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-100 flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
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
