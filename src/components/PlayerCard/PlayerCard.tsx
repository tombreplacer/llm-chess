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
      className={`relative flex flex-col justify-between px-2.5 py-1.5 rounded-xl border backdrop-blur-xl transition-all duration-200 gap-1 w-full max-w-full overflow-hidden box-border ${
        isCurrentTurn
          ? 'bg-slate-850 border-cyan-500/70 shadow-[0_0_16px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/40'
          : 'bg-slate-900 border-slate-800 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between gap-2 min-w-0 w-full">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="relative shrink-0">
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-base sm:text-lg shadow-inner border ${
                isWhite
                  ? 'bg-slate-100 border-white/60 text-slate-900'
                  : 'bg-slate-950 border-slate-700 text-white'
              }`}
            >
              {config.type === 'human' ? (config.avatar || '👤') : preset.avatar}
            </div>

            <div
              className={`absolute -bottom-1 -right-1 p-0.5 rounded-full text-white text-[8px] sm:text-[9px] ${
                config.type === 'human' ? 'bg-indigo-600' : 'bg-cyan-600'
              }`}
            >
              {config.type === 'human' ? <User className="w-2 h-2" /> : <Bot className="w-2 h-2" />}
            </div>
          </div>

          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
              <h4 className="font-bold text-white text-xs tracking-wide truncate max-w-[130px] sm:max-w-[200px]">
                {config.type === 'human' ? (config.name || 'Человек') : preset.name}
              </h4>
              <span className={`${isWhite ? 'badge-color-white' : 'badge-color-black'} shrink-0`}>
                {isWhite ? 'Белые' : 'Черные'}
              </span>
              {config.type === 'llm' && (
                <span
                  title={`Всего нелегальных ходов/ошибок за партию: ${totalErrors}`}
                  className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold shrink-0 ${
                    totalErrors > 0
                      ? 'bg-rose-950/80 border border-rose-700 text-rose-300'
                      : 'bg-slate-800/60 border border-slate-700/60 text-slate-400'
                  }`}
                >
                  {totalErrors > 0 ? `⚠️ ${totalErrors}` : '0 ош.'}
                </span>
              )}
            </div>

            <p
              className="text-[10px] text-slate-400 font-medium truncate max-w-full"
              title={
                config.type === 'human'
                  ? (config.bio || 'Человек')
                  : `${config.provider === 'openrouter' ? 'OpenRouter: ' : 'LM Studio: '}${config.modelId || 'mock-ai'}`
              }
            >
              {config.type === 'human'
                ? (config.bio || 'Игрок')
                : (config.provider === 'openrouter' ? `🌐 ${config.modelId}` : `🖥️ ${config.modelId || 'LM Studio AI'}`)}
            </p>

            {capturedPieces.length > 0 && (
              <div className="flex items-center gap-0.5 mt-0.5 flex-wrap">
                {capturedPieces.map((p, idx) => (
                  <div key={idx} className="w-3.5 h-3.5 opacity-85 shrink-0">
                    <ChessPieceSvg type={p} color={isWhite ? 'b' : 'w'} />
                  </div>
                ))}
                {myAdvantage > 0 && (
                  <span className="text-[9px] font-bold text-emerald-400 ml-1 font-mono shrink-0">
                    +{myAdvantage}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          {isThinking && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-cyan-950 border border-cyan-500/50 rounded-full text-cyan-400 text-[10px] font-semibold animate-pulse">
              <Brain className="w-3 h-3 animate-spin shrink-0" />
              <span className="hidden sm:inline">Думает...</span>
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
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950/80 border border-slate-700/60 text-slate-200 text-[11px] font-sans italic shadow-inner w-full max-w-full overflow-hidden box-border">
          <MessageSquare className="w-3 h-3 text-cyan-400 shrink-0 not-italic" />
          <span className="truncate min-w-0">«{lastComment}»</span>
        </div>
      )}
    </div>
  );
};
