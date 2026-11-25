import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Sparkles,
  Trophy,
  Headphones,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  LogIn,
  UserPlus,
  Flame,
} from 'lucide-react';
import DictadleLogo from '../components/DictadleLogo';
import mascotImg from '../assets/dictadle-mascote-sem-bg.png';

/**
 * LandingPage - Tela inicial pública de entrada do Dictadle
 * Apresenta a proposta de valor, o mascote e acesso direto a login e cadastro.
 */
export default function LandingPage({ currentUser }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      {/* Barra de Navegação Superior */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <DictadleLogo size="md" subtitle="Desafio Diário de Listening" />

        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser ? (
            <button
              onClick={() => navigate(currentUser.role === 'admin' ? '/admin' : '/challenge')}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition active:scale-95"
            >
              <span>Ir para Desafios</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-slate-700 hover:text-brand-600 hover:bg-brand-50 text-xs sm:text-sm font-bold rounded-xl transition"
                title="Entrar na sua conta"
              >
                <LogIn className="w-4 h-4" />
                <span>Entrar</span>
              </button>

              <button
                onClick={() => navigate('/register')}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm shadow-purple-200 hover:shadow-md transition active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>Cadastre-se</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-16 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Coluna da Esquerda: Chamada e Proposta de Valor */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-brand-50 border border-brand-200/60 rounded-full text-brand-700 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-brand-600 animate-pulse" />
              <span>O Wordle do Listening em Inglês</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.15] font-display">
              Domine o inglês da vida real com{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-purple-600 to-indigo-600">
                desafios diários de escuta
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Chega de áudios robóticos e lentos de cursos tradicionais. No <strong>Dictadle</strong>, você
              treina sua compreensão auditiva com clipes autênticos de 10 a 15 segundos. Digite o que ouve,
              receba correção inteligente em cores e suba de nível com XP!
            </p>

            {/* Botões de Ação Primários */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-purple-200 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Jogar Agora</span>
              </button>

              <button
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-sm rounded-xl shadow-xs transition"
              >
                <span>Criar Conta Gratuita</span>
              </button>
            </div>

            {/* Destaques / Benefícios Rápidos */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-200 text-left">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Clipes autênticos de 10-15s</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Feedback palavra por palavra</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Gamificação e Níveis XP</span>
              </div>
            </div>
          </div>

          {/* Coluna da Direita: Card de Demonstração & Mascote */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm sm:max-w-md">
              {/* Efeito Glow Roxo no Fundo */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-brand-500 to-indigo-500 rounded-3xl blur-lg opacity-30 animate-pulse" />

              {/* Card Estilizado de Demonstração */}
              <div className="relative bg-white rounded-3xl border border-slate-200/90 shadow-xl p-5 sm:p-6 space-y-4">
                {/* Header do Mock */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={mascotImg}
                      alt="Mascote Dictadle"
                      className="w-10 h-10 object-contain drop-shadow-sm"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Desafio Diário #42</p>
                      <p className="text-[10px] text-slate-400 font-medium">Sotaque Nativo • Velocidade Real</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-500" />
                    <span>+150 XP</span>
                  </span>
                </div>

                {/* Player Mock Preview */}
                <div className="aspect-video bg-slate-900 rounded-xl flex flex-col items-center justify-center text-white relative overflow-hidden group">
                  <div className="absolute inset-0 bg-radial from-brand-900/40 to-slate-950 opacity-90" />
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center shadow-lg shadow-purple-900/50">
                      <Headphones className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-semibold tracking-wide text-slate-300">
                      Clipe Real (0:12)
                    </span>
                  </div>
                </div>

                {/* Visual Feedback de Palavras (Estilo Puzzle / Wordle) */}
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Sua Transcrição:
                  </p>
                  <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-md font-bold">
                      I
                    </span>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-md font-bold">
                      declare
                    </span>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-md font-bold">
                      bankruptcy
                    </span>
                  </div>
                </div>

                {/* Barra de Precisão */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Precisão da Escuta:</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                    100% de Acerto! 🎯
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seção Como Funciona em 3 Passos */}
        <section className="mt-16 sm:mt-24 pt-12 border-t border-slate-200">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
              Como funciona o Dictadle
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Apenas 3 passos simples para transformar sua escuta em poucos minutos por dia
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="font-bold text-slate-800 text-base">Ouça o clipe autêntico</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Reproduza o trecho curto de 10 a 15 segundos quantas vezes precisar, prestando atenção nos
                sons e entonações reais.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="font-bold text-slate-800 text-base">Digite o que entendeu</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Escreva a sua transcrição na caixa de resposta. O corretor é tolerante com pontuação e
                letras maiúsculas.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="font-bold text-slate-800 text-base">Feedback e XP</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Veja na hora quais palavras acertou em verde, erros em vermelho e termos omitidos em âmbar,
                ganhando XP para subir de nível.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Rodapé Simples */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <DictadleLogo size="sm" showText={true} />
            <span className="text-slate-400">© 2026 Dictadle. Todos os direitos reservados.</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-brand-600 hover:text-brand-700 font-bold transition"
            >
              Fazer Login
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={() => navigate('/register')}
              className="text-slate-600 hover:text-slate-800 font-medium transition"
            >
              Criar Conta
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
