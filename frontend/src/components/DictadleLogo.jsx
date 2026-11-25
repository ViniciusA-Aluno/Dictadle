import React from 'react';
import mascotSvg from '../assets/dictadle-mascote.svg';

/**
 * Componente oficial de Logotipo do Dictadle (SCRUM-163 / SCRUM-164)
 * Estilo minimalista, puzzle e gamificado com o mascote oficial.
 */
export default function DictadleLogo({
  size = 'md',
  showText = true,
  subtitle = null,
  className = '',
  textColor = 'text-slate-900',
  iconBg = 'bg-brand-600',
}) {
  const sizeMap = {
    sm: {
      container: 'w-7 h-7 rounded-lg p-0.5',
      title: 'text-sm font-bold',
      subtitle: 'text-[10px]',
      gap: 'gap-2',
    },
    md: {
      container: 'w-9 h-9 sm:w-10 sm:h-10 rounded-xl p-1',
      title: 'text-base sm:text-lg font-extrabold tracking-tight',
      subtitle: 'text-[11px]',
      gap: 'gap-2.5 sm:gap-3',
    },
    lg: {
      container: 'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl p-1.5 shadow-md',
      title: 'text-2xl sm:text-3xl font-extrabold tracking-tight',
      subtitle: 'text-xs sm:text-sm',
      gap: 'gap-3 sm:gap-4',
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center ${currentSize.gap} ${className}`}>
      {/* Símbolo / Mascote com estilo puzzle minimalista */}
      <div
        className={`${currentSize.container} ${iconBg} flex items-center justify-center shrink-0 shadow-sm border border-purple-200/50 transition-transform duration-200 hover:scale-105`}
        aria-hidden="true"
      >
        <img
          src={mascotSvg}
          alt="Mascote Dictadle"
          className="w-full h-full object-contain filter drop-shadow-xs"
        />
      </div>

      {/* Tipografia da Marca */}
      {showText && (
        <div className="flex flex-col justify-center">
          <h1 className={`${currentSize.title} ${textColor} leading-tight font-display`}>
            Dictadle
          </h1>
          {subtitle && (
            <p className={`${currentSize.subtitle} text-slate-500 font-medium leading-none mt-0.5`}>
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
