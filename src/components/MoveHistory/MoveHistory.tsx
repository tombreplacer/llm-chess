import React from 'react';
import type { MoveThought } from '../../types/chess';
import { Brain, Copy, Check, ScrollText } from 'lucide-react';

interface MoveHistoryProps {
  moveThoughts: MoveThought[];
  selectedMoveIndex: number | null;
  onSelectMove: (index: number | null) => void;
  pgn: string;
  fen: string;
}

const MoveLabel: React.FC<{ move: MoveThought }> = ({ move }) => {
  const san = move.san;
  const isCapture = san.includes('x') || Boolean(move.captured);
  const isCheck = san.includes('+');
  const isMate = san.includes('#');

  return (
    <span className="inline-flex items-center gap-1 font-semibold tracking-tight">
      <span
        className={
          isMate
            ? 'text-emerald-400 font-black'
            : isCapture
            ? 'text-amber-300 font-bold'
            : isCheck
            ? 'text-rose-400 font-bold'
            : 'text-slate-200'
        }
      >
        {san}
      </span>
      {isCapture && (
        <span title="Взятие фигуры (убита фигура)" className="text-[9px] text-rose-400 inline-flex items-center">
          ⚔️
        </span>
      )}
    </span>
  );
};

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  moveThoughts,
  selectedMoveIndex,
  onSelectMove,
  pgn,
  fen
}) => {
  const [copiedPgn, setCopiedPgn] = React.useState(false);
  const [copiedFen, setCopiedFen] = React.useState(false);

  const handleCopyPgn = () => {
    navigator.clipboard.writeText(pgn);
    setCopiedPgn(true);
    setTimeout(() => setCopiedPgn(false), 2000);
  };

  const handleCopyFen = () => {
    navigator.clipboard.writeText(fen);
    setCopiedFen(true);
    setTimeout(() => setCopiedFen(false), 2000);
  };

  const pairedMoves: { moveNumber: number; white?: MoveThought; black?: MoveThought }[] = [];
  for (let i = 0; i < moveThoughts.length; i += 2) {
    pairedMoves.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: moveThoughts[i],
      black: moveThoughts[i + 1]
    });
  }

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between pb-2 border-b">
        <div className="flex items-center gap-1.5">
          <ScrollText className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-white text-xs">История ходов</h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopyFen}
            title="Скопировать FEN"
            className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 flex items-center gap-1 transition-colors"
          >
            {copiedFen ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
            <span>FEN</span>
          </button>
          <button
            onClick={handleCopyPgn}
            title="Скопировать PGN"
            className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 flex items-center gap-1 transition-colors"
          >
            {copiedPgn ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
            <span>PGN</span>
          </button>
        </div>
      </div>

      {/* Список ходов в виде четкой 3-колоночной сетки */}
      <div className="flex-1 overflow-y-auto mt-1.5 max-h-[calc(100vh-180px)] custom-scrollbar pr-1">
        {pairedMoves.length === 0 ? (
          <div className="text-center text-[11px] text-slate-500 py-6 italic">
            Партия еще не началась.
          </div>
        ) : (
          <div className="space-y-0.5 text-xs font-mono">
            {pairedMoves.map(pair => {
              const whiteIdx = (pair.moveNumber - 1) * 2;
              const blackIdx = whiteIdx + 1;

              const isWhiteSelected = selectedMoveIndex === whiteIdx;
              const isBlackSelected = selectedMoveIndex === blackIdx;

              const isWhiteCapture = pair.white && (pair.white.san.includes('x') || Boolean(pair.white.captured));
              const isBlackCapture = pair.black && (pair.black.san.includes('x') || Boolean(pair.black.captured));

              return (
                <div
                  key={pair.moveNumber}
                  style={{ display: 'grid', gridTemplateColumns: '26px 1fr 1fr', gap: '4px' }}
                  className="items-center rounded hover:bg-slate-800/40 p-0.5"
                >
                  {/* Номер хода */}
                  <span className="text-slate-500 font-bold text-[11px] text-right pr-1">
                    {pair.moveNumber}.
                  </span>

                  {/* Ход белых */}
                  {pair.white ? (
                    <button
                      onClick={() => onSelectMove(isWhiteSelected ? null : whiteIdx)}
                      className={`flex items-center justify-between px-2 py-0.5 rounded text-left transition-colors border ${
                        isWhiteSelected
                          ? 'bg-cyan-600/30 text-cyan-300 border-cyan-500/50 font-bold shadow-sm'
                          : isWhiteCapture
                          ? 'bg-rose-950/30 border-rose-900/40 hover:bg-rose-950/60'
                          : 'border-transparent hover:bg-slate-800'
                      }`}
                    >
                      <MoveLabel move={pair.white} />
                      <div className="flex items-center gap-1">
                        {pair.white.retries && pair.white.retries.length > 0 && (
                          <span
                            title={`Нелегальных попыток: ${pair.white.retries.length}`}
                            className="text-[9px] text-rose-400 font-bold px-1 rounded bg-rose-950/80 border border-rose-800"
                          >
                            ⚠️{pair.white.retries.length}
                          </span>
                        )}
                        {pair.white.thoughtText && (
                          <span title="Есть мысли ИИ" className="inline-flex opacity-80 hover:opacity-100">
                            <Brain className="w-3 h-3 text-cyan-400" />
                          </span>
                        )}
                      </div>
                    </button>
                  ) : (
                    <div />
                  )}

                  {/* Ход черных */}
                  {pair.black ? (
                    <button
                      onClick={() => onSelectMove(isBlackSelected ? null : blackIdx)}
                      className={`flex items-center justify-between px-2 py-0.5 rounded text-left transition-colors border ${
                        isBlackSelected
                          ? 'bg-cyan-600/30 text-cyan-300 border-cyan-500/50 font-bold shadow-sm'
                          : isBlackCapture
                          ? 'bg-rose-950/30 border-rose-900/40 hover:bg-rose-950/60'
                          : 'border-transparent hover:bg-slate-800'
                      }`}
                    >
                      <MoveLabel move={pair.black} />
                      <div className="flex items-center gap-1">
                        {pair.black.retries && pair.black.retries.length > 0 && (
                          <span
                            title={`Нелегальных попыток: ${pair.black.retries.length}`}
                            className="text-[9px] text-rose-400 font-bold px-1 rounded bg-rose-950/80 border border-rose-800"
                          >
                            ⚠️{pair.black.retries.length}
                          </span>
                        )}
                        {pair.black.thoughtText && (
                          <span title="Есть мысли ИИ" className="inline-flex opacity-80 hover:opacity-100">
                            <Brain className="w-3 h-3 text-cyan-400" />
                          </span>
                        )}
                      </div>
                    </button>
                  ) : (
                    <div className="flex items-center px-2 py-0.5 text-slate-600 text-[10px] italic">
                      ...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedMoveIndex !== null && (
        <button
          onClick={() => onSelectMove(null)}
          className="mt-1.5 w-full py-1 text-[10px] text-cyan-400 hover:text-cyan-300 bg-slate-800/60 rounded text-center"
        >
          Вернуться к активному ходу ↺
        </button>
      )}
    </div>
  );
};
