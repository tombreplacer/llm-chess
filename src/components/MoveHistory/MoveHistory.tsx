import React from 'react';
import type { CurrencyCode, MoveThought } from '../../types/chess';
import { formatCost } from '../../services/currencyService';
import { Brain, Copy, Check, ScrollText, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MoveHistoryProps {
  moveThoughts: MoveThought[];
  selectedMoveIndex: number | null;
  onSelectMove: (index: number | null) => void;
  pgn: string;
  fen: string;
  currency?: CurrencyCode;
  exchangeRate?: number;
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
            : 'text-foreground'
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
  fen,
  currency = 'RUB',
  exchangeRate = 92.5
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

  const totalSessionCostUsd = moveThoughts.reduce((sum, t) => sum + (t.costUsd || 0), 0);
  const formattedSessionCost = formatCost(totalSessionCostUsd, currency, exchangeRate);

  const pairedMoves: { moveNumber: number; white?: MoveThought; black?: MoveThought }[] = [];
  for (let i = 0; i < moveThoughts.length; i += 2) {
    pairedMoves.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: moveThoughts[i],
      black: moveThoughts[i + 1]
    });
  }

  return (
    <div className="w-full bg-slate-900/90 border border-border/80 rounded-2xl p-3.5 shadow-xl flex flex-col h-full backdrop-blur-xl">
      <div className="flex items-center justify-between pb-2.5 border-b border-border/80 gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <ScrollText className="w-4 h-4 text-primary shrink-0" />
          <h3 className="font-bold text-foreground text-xs sm:text-sm">История ходов</h3>
          <Badge variant="secondary" className="font-mono text-[10px] py-0 px-1.5">
            {moveThoughts.length}
          </Badge>

          {totalSessionCostUsd > 0 && (
            <Badge
              variant="emerald"
              className="gap-1 font-mono text-[10px] py-0 px-1.5 font-bold shrink-0 shadow-sm"
              title={`Всего израсходовано за текущую сессию: ${formattedSessionCost} (в пересчете из $${totalSessionCostUsd.toFixed(5)})`}
            >
              <Coins className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
              <span>{formattedSessionCost}</span>
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleCopyFen}
            title="Скопировать FEN"
            className="h-6 px-2 text-[10px] font-mono gap-1"
          >
            {copiedFen ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
            <span>FEN</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleCopyPgn}
            title="Скопировать PGN"
            className="h-6 px-2 text-[10px] font-mono gap-1"
          >
            {copiedPgn ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
            <span>PGN</span>
          </Button>
        </div>
      </div>

      {/* Список ходов в виде четкой 3-колоночной сетки */}
      <div className="flex-1 overflow-y-auto mt-2 max-h-[calc(100vh-180px)] custom-scrollbar pr-1">
        {pairedMoves.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-8 italic">
            Партия еще не началась.
          </div>
        ) : (
          <div className="space-y-1 text-xs font-mono">
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
                  className="grid grid-cols-[28px_1fr_1fr] gap-1 items-center rounded-xl hover:bg-slate-800/40 p-0.5 transition-colors"
                >
                  {/* Номер хода */}
                  <span className="text-muted-foreground font-bold text-[11px] text-right pr-1 select-none">
                    {pair.moveNumber}.
                  </span>

                  {/* Ход белых */}
                  {pair.white ? (
                    <button
                      type="button"
                      onClick={() => onSelectMove(isWhiteSelected ? null : whiteIdx)}
                      className={`flex items-center justify-between px-2 py-1 rounded-lg text-left transition-all border cursor-pointer ${
                        isWhiteSelected
                          ? 'bg-primary/20 text-primary border-primary font-bold shadow-cyan-glow'
                          : isWhiteCapture
                          ? 'bg-rose-950/30 border-rose-900/50 hover:bg-rose-950/50'
                          : 'bg-slate-950/40 border-border/40 hover:bg-slate-800 hover:border-border'
                      }`}
                    >
                      <MoveLabel move={pair.white} />
                      <div className="flex items-center gap-1">
                        {pair.white.costUsd !== undefined && pair.white.costUsd > 0 && (
                          <span
                            title={`Стоимость хода: ${formatCost(pair.white.costUsd, currency, exchangeRate)}`}
                            className="text-[9px] text-emerald-400/90 font-mono font-medium hidden sm:inline"
                          >
                            {formatCost(pair.white.costUsd, currency, exchangeRate)}
                          </span>
                        )}
                        {pair.white.retries && pair.white.retries.length > 0 && (
                          <Badge variant="rose" className="text-[9px] py-0 px-1 font-bold">
                            ⚠️{pair.white.retries.length}
                          </Badge>
                        )}
                        {pair.white.thoughtText && (
                          <span title="Есть мысли ИИ" className="inline-flex opacity-80 hover:opacity-100">
                            <Brain className="w-3 h-3 text-primary" />
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
                      type="button"
                      onClick={() => onSelectMove(isBlackSelected ? null : blackIdx)}
                      className={`flex items-center justify-between px-2 py-1 rounded-lg text-left transition-all border cursor-pointer ${
                        isBlackSelected
                          ? 'bg-primary/20 text-primary border-primary font-bold shadow-cyan-glow'
                          : isBlackCapture
                          ? 'bg-rose-950/30 border-rose-900/50 hover:bg-rose-950/50'
                          : 'bg-slate-950/40 border-border/40 hover:bg-slate-800 hover:border-border'
                      }`}
                    >
                      <MoveLabel move={pair.black} />
                      <div className="flex items-center gap-1">
                        {pair.black.costUsd !== undefined && pair.black.costUsd > 0 && (
                          <span
                            title={`Стоимость хода: ${formatCost(pair.black.costUsd, currency, exchangeRate)}`}
                            className="text-[9px] text-emerald-400/90 font-mono font-medium hidden sm:inline"
                          >
                            {formatCost(pair.black.costUsd, currency, exchangeRate)}
                          </span>
                        )}
                        {pair.black.retries && pair.black.retries.length > 0 && (
                          <Badge variant="rose" className="text-[9px] py-0 px-1 font-bold">
                            ⚠️{pair.black.retries.length}
                          </Badge>
                        )}
                        {pair.black.thoughtText && (
                          <span title="Есть мысли ИИ" className="inline-flex opacity-80 hover:opacity-100">
                            <Brain className="w-3 h-3 text-primary" />
                          </span>
                        )}
                      </div>
                    </button>
                  ) : (
                    <div className="flex items-center px-2 py-1 text-muted-foreground text-[10px] italic">
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
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onSelectMove(null)}
          className="mt-2 w-full text-xs text-primary hover:text-white"
        >
          Вернуться к активному ходу ↺
        </Button>
      )}
    </div>
  );
};
