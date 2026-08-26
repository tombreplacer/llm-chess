import React from 'react';
import type { PieceColor, PlayerConfig } from '../../types/chess';
import { GRANDMASTER_PRESETS } from '../../services/prompts';
import { ChessPieceSvg } from '../ChessBoard/ChessPieces';
import { Bot, User, Brain, MessageSquare } from 'lucide-react';
import type { PieceSymbol } from 'chess.js';

interface PlayerCardProps {
  color: PieceColor;
  config: PlayerConfig;
  isCurrentTurn: boolean;
  isThinking: boolean;
  capturedPieces: PieceSymbol[];
  materialScore: number;
  lastComment?: string;
  totalErrors?: number;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  color,
  config,
  isCurrentTurn,
  isThinking,
  capturedPieces,
  materialScore,
  lastComment,
  totalErrors = 0
}) => {
  const isWhite = color === 'w';
  const preset = GRANDMASTER_PRESETS[config.style] || GRANDMASTER_PRESETS.kasparov;
  const myAdvantage = isWhite ? materialScore : -materialScore;

  return (
    <div
      className={`relative flex flex-col justify-between px-3 py-1.5 rounded-xl border backdrop-blur-xl transition-all duration-200 gap-1 ${
        isCurrentTurn
          ? 'bg-slate-850 border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/40'
          : 'bg-slate-900 border-slate-800 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg shadow-inner border ${
                isWhite
                  ? 'bg-slate-100 border-white/60 text-slate-900'
                  : 'bg-slate-950 border-slate-700 text-white'
              }`}
            >
              {config.type === 'human' ? '👤' : preset.avatar}
            </div>

            <div
              className={`absolute -bottom-1 -right-1 p-0.5 rounded-full text-white text-[9px] ${
                config.type === 'human' ? 'bg-indigo-600' : 'bg-cyan-600'
              }`}
            >
              {config.type === 'human' ? <User className="w-2 h-2" /> : <Bot className="w-2 h-2" />}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-white text-xs tracking-wide">
                {config.type === 'human' ? config.name : preset.name}
              </h4>
              <span className={isWhite ? 'badge-color-white' : 'badge-color-black'}>
                {isWhite ? 'Белые' : 'Черные'}
              </span>
              {config.type === 'llm' && (
                <span
                  title={`Всего нелегальных ходов/ошибок за партию: ${totalErrors}`}
                  className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                    totalErrors > 0
                      ? 'bg-rose-950/80 border border-rose-700 text-rose-300'
                      : 'bg-slate-800/60 border border-slate-700/60 text-slate-400'
                  }`}
                >
                  {totalErrors > 0 ? `⚠️ ${totalErrors} ${totalErrors === 1 ? 'ошибка' : totalErrors < 5 ? 'ошибки' : 'ошибок'}` : '0 ошибок'}
                </span>
              )}
            </div>

            <p className="text-[10px] text-slate-400 font-medium">
              {config.type === 'human' ? 'Человек' : (config.modelId || 'LM Studio AI')}
            </p>

            {capturedPieces.length > 0 && (
              <div className="flex items-center gap-0.5 mt-0.5">
                {capturedPieces.map((p, idx) => (
                  <div key={idx} className="w-3.5 h-3.5 opacity-85">
                    <ChessPieceSvg type={p} color={isWhite ? 'b' : 'w'} />
                  </div>
                ))}
                {myAdvantage > 0 && (
                  <span className="text-[9px] font-bold text-emerald-400 ml-1 font-mono">
                    +{myAdvantage}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          {isThinking && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-cyan-950 border border-cyan-500/50 rounded-full text-cyan-400 text-[10px] font-semibold animate-pulse">
              <Brain className="w-3 h-3 animate-spin" />
              <span>Думает...</span>
            </div>
          )}

          {!isThinking && isCurrentTurn && (
            <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-300 text-[10px] font-medium animate-pulse">
              Ход
            </span>
          )}
        </div>
      </div>

      {/* Речевой бабл последней реплики игрока */}
      {lastComment && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950/80 border border-slate-700/60 text-slate-200 text-[11px] font-sans italic shadow-inner animate-in fade-in slide-in-from-top-1 duration-200">
          <MessageSquare className="w-3 h-3 text-cyan-400 shrink-0 not-italic" />
          <span className="truncate">«{lastComment}»</span>
        </div>
      )}
    </div>
  );
};
