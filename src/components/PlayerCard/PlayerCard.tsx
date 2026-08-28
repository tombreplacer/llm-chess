import React from 'react';
import type { PieceColor, PieceTheme, PlayerConfig } from '../../types/chess';
import { GRANDMASTER_PRESETS } from '../../services/prompts';
import { ChessPieceSvg } from '../ChessBoard/ChessPieces';
import { Bot, User, Brain, MessageSquare } from 'lucide-react';
import type { PieceSymbol } from 'chess.js';
import { Badge } from '@/components/ui/badge';

interface PlayerCardProps {
  color: PieceColor;
  config: PlayerConfig;
  pieceTheme?: PieceTheme;
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
  pieceTheme = 'cburnett',
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
      className={`relative flex flex-col justify-between px-3 py-2 rounded-2xl border backdrop-blur-xl transition-all duration-200 gap-1.5 w-full max-w-full overflow-hidden ${
        isCurrentTurn
          ? 'bg-slate-900/95 border-primary shadow-cyan-glow ring-1 ring-primary/40'
          : 'bg-slate-900/60 border-border/80 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between gap-2 min-w-0 w-full">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="relative shrink-0">
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-base sm:text-lg shadow-inner border ${
                isWhite
                  ? 'bg-slate-100 border-white/80 text-slate-900'
                  : 'bg-slate-950 border-slate-700 text-white'
              }`}
            >
              {config.type === 'human' ? (config.avatar || '👤') : preset.avatar}
            </div>

            <div
              className={`absolute -bottom-1 -right-1 p-0.5 rounded-full text-white text-[8px] sm:text-[9px] shadow ${
                config.type === 'human' ? 'bg-indigo-600' : 'bg-primary'
              }`}
            >
              {config.type === 'human' ? <User className="w-2 h-2" /> : <Bot className="w-2 h-2" />}
            </div>
          </div>

          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
              <h4 className="font-bold text-foreground text-xs sm:text-sm tracking-wide truncate max-w-[130px] sm:max-w-[200px]">
                {config.type === 'human' ? (config.name || 'Человек') : preset.name}
              </h4>
              <Badge variant={isWhite ? 'white' : 'black'} className="shrink-0">
                {isWhite ? 'Белые' : 'Черные'}
              </Badge>
              {config.type === 'llm' && (
                <Badge
                  variant={totalErrors > 0 ? 'rose' : 'secondary'}
                  className="font-mono text-[9px] py-0 px-1 shrink-0"
                  title={`Всего нелегальных ходов/ошибок: ${totalErrors}`}
                >
                  {totalErrors > 0 ? `⚠️ ${totalErrors}` : '0 ош.'}
                </Badge>
              )}
            </div>

            <p
              className="text-[10px] text-muted-foreground font-medium truncate max-w-full"
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
                    <ChessPieceSvg type={p} color={isWhite ? 'b' : 'w'} theme={pieceTheme} />
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
            <Badge variant="cyan" className="gap-1 animate-pulse font-semibold">
              <Brain className="w-3 h-3 animate-spin shrink-0" />
              <span className="hidden sm:inline">Думает...</span>
            </Badge>
          )}

          {!isThinking && isCurrentTurn && (
            <Badge variant="amber" className="animate-pulse">
              Ход
            </Badge>
          )}
        </div>
      </div>

      {/* Речевой бабл последней реплики игрока */}
      {lastComment && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/80 border border-border text-slate-200 text-[11px] font-sans italic shadow-inner w-full max-w-full overflow-hidden">
          <MessageSquare className="w-3 h-3 text-primary shrink-0 not-italic" />
          <span className="truncate min-w-0">«{lastComment}»</span>
        </div>
      )}
    </div>
  );
};
