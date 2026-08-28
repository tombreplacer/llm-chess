import React from 'react';
import type { GameEvaluation } from '../../types/chess';

interface EvalBarProps {
  evaluation: GameEvaluation;
  isFlipped?: boolean;
}

export const EvalBar: React.FC<EvalBarProps> = ({ evaluation, isFlipped = false }) => {
  const { materialScore } = evaluation;

  const clampedScore = Math.max(-15, Math.min(15, materialScore));
  const whitePercent = 50 + (clampedScore / 15) * 45;
  const displayScore = materialScore > 0 ? `+${materialScore}` : materialScore < 0 ? `${materialScore}` : '0.0';

  return (
    <div className="flex flex-col items-center h-full py-0.5 shrink-0 select-none">
      <div
        className="relative w-3.5 sm:w-4 h-full min-h-[220px] max-h-[480px] bg-slate-950 rounded-full overflow-hidden border border-border/80 shadow-md flex flex-col justify-end"
        title={`Материальный перевес: ${displayScore} (Белые: ${whitePercent.toFixed(0)}%)`}
      >
        <div className="w-full bg-slate-950 flex-1" />
        <div
          className="w-full bg-slate-100 transition-all duration-500 ease-out shadow-[0_0_8px_rgba(255,255,255,0.6)]"
          style={{ height: `${isFlipped ? 100 - whitePercent : whitePercent}%` }}
        />
        <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-primary z-10 -translate-y-1/2 shadow-cyan-glow" />
      </div>

      <span
        className={`text-[9px] font-mono font-bold mt-1 px-1.5 py-0.5 rounded-md border shadow-sm ${
          materialScore > 0
            ? 'bg-slate-100 text-slate-950 border-white/80'
            : materialScore < 0
            ? 'bg-slate-950 text-slate-100 border-slate-700'
            : 'bg-slate-900 text-muted-foreground border-border'
        }`}
      >
        {displayScore}
      </span>
    </div>
  );
};
