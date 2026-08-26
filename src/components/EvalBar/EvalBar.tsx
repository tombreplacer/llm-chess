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
    <div className="flex flex-col items-center h-full py-0.5">
      <div className="relative w-3.5 h-full min-h-[240px] max-h-[480px] bg-slate-900 rounded-full overflow-hidden border border-slate-700 shadow-md flex flex-col justify-end">
        <div className="w-full bg-slate-950 flex-1" />
        <div
          className="w-full bg-slate-100 transition-all duration-500 ease-out shadow-[0_0_6px_rgba(255,255,255,0.4)]"
          style={{ height: `${isFlipped ? 100 - whitePercent : whitePercent}%` }}
        />
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-cyan-500 z-10 -translate-y-1/2" />
      </div>

      <span className="text-[9px] font-mono font-bold text-slate-400 mt-1 px-1 py-0.5 rounded bg-slate-850 border border-slate-800">
        {displayScore}
      </span>
    </div>
  );
};
