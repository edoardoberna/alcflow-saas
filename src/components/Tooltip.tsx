'use client';

import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  example?: string;
  children?: React.ReactNode;
}

export default function Tooltip({ content, example, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative inline-flex items-center ml-1.5 align-middle">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setVisible(!visible);
        }}
        className="w-4 h-4 rounded-full bg-white/10 hover:bg-accent text-slate-300 hover:text-white flex items-center justify-center text-[10px] font-mono font-bold transition cursor-help border border-white/10"
        aria-label="Informazioni sul campo"
      >
        ?
      </button>

      {visible && (
        <div 
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[#0E131F] text-slate-200 border border-white/20 rounded-xl shadow-2xl z-50 text-xs normal-case tracking-normal backdrop-blur-md pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95"
        >
          <p className="leading-relaxed text-slate-200 text-[11px]">{content}</p>
          {example && (
            <div className="mt-2 pt-2 border-t border-white/10 font-mono text-[10px] text-accent-hi">
              <span className="text-slate-400 font-sans block mb-0.5">Esempio pratico:</span>
              {example}
            </div>
          )}
          {/* Triangolino freccia del tooltip */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[#0E131F]" />
        </div>
      )}
    </span>
  );
}