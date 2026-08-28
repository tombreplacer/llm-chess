import React, { useState, useEffect, useRef } from 'react';
import type { MoveThought, PieceColor, RetryLog } from '../../types/chess';
import {
  ChevronDown,
  ChevronRight,
  Brain,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RotateCw,
  FastForward,
  Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ThinkingSpoilerProps {
  isLive?: boolean;
  thoughtStream?: string;
  contentStream?: string;
  tokenCount?: number;
  tokensPerSecond?: number;
  isThinkingActive?: boolean;
  isStreaming?: boolean;
  activeColor?: PieceColor;
  statusText?: string;
  currentAttempt?: number;
  savedThought?: MoveThought | null;
  playerName?: string;
  avatar?: string;
  onRetry?: () => void;
  isInspectingPause?: boolean;
  inspectCountdown?: number | null;
  onSkipPause?: () => void;
  totalPlayerErrors?: number;
}

export const ThinkingSpoiler: React.FC<ThinkingSpoilerProps> = ({
  isLive = false,
  thoughtStream = '',
  contentStream = '',
  tokenCount = 0,
  tokensPerSecond = 0,
  isThinkingActive = false,
  isStreaming = false,
  activeColor = 'w',
  statusText = '',
  currentAttempt = 1,
  savedThought = null,
  playerName = 'LLM Grandmaster',
  avatar = '🤖',
  onRetry,
  isInspectingPause = false,
  inspectCountdown = null,
  onSkipPause,
  totalPlayerErrors
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const streamEndRef = useRef<HTMLDivElement>(null);

  // В живом режиме держим спойлер открытым для непрерывного чтения мыслей без морганий
  useEffect(() => {
    if (isLive) {
      setIsOpen(true);
    } else if (savedThought) {
      setIsOpen(true);
    }
  }, [isLive, savedThought?.timestamp]);

  useEffect(() => {
    if (isLive && isOpen && streamEndRef.current) {
      streamEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [thoughtStream, isOpen, isLive]);

  const rawThoughtText = isLive ? thoughtStream : (savedThought?.thoughtText || '');
  const rawContentText = isLive ? contentStream : (savedThought?.finalMoveRaw || '');
  const durationSec = isLive ? null : ((savedThought?.durationMs || 0) / 1000).toFixed(1);
  const retries: RetryLog[] = isLive ? [] : (savedThought?.retries || []);

  const isWhiteColor = (isLive ? activeColor : savedThought?.color) === 'w';
  const colorName = isWhiteColor ? 'Белые' : 'Черные';

  const commentMatch = rawContentText.match(/<comment>\s*([\s\S]*?)\s*<\/comment>/i);
  const displayComment = commentMatch ? commentMatch[1].trim() : (savedThought?.comment || '');

  const moveMatch = rawContentText.match(/<move>\s*([^<]+?)\s*<\/move>/i) || rawContentText.match(/"move"\s*:\s*"([^"]+)"/i);
  const displayMove = moveMatch 
    ? moveMatch[1].trim() 
    : (savedThought?.san || (rawContentText.length > 0 && rawContentText.length <= 8 && !rawContentText.includes('\n') ? rawContentText.trim() : ''));

  const liveTokenDisplay = tokenCount || Math.round((rawThoughtText.length + rawContentText.length) / 2.8);
  const savedTokenDisplay = savedThought?.tokenCount || Math.round(((savedThought?.thoughtText.length || 0) + (savedThought?.finalMoveRaw.length || 0)) / 2.8);
  const savedSpeedDisplay = savedThought?.tokensPerSecond || (savedThought?.durationMs && savedThought.durationMs > 0 && savedTokenDisplay ? +((savedTokenDisplay / (savedThought.durationMs / 1000)).toFixed(1)) : 0);

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-border/80 rounded-2xl p-3.5 shadow-xl backdrop-blur-xl">
      {/* Шапка карточки игрока */}
      <div className="flex items-center justify-between pb-3 border-b border-border/80 gap-2 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-2xl drop-shadow shrink-0">{avatar}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-foreground text-xs sm:text-sm leading-tight truncate">{playerName}</h3>
              <Badge variant={isWhiteColor ? 'white' : 'black'} className="shrink-0">
                {colorName}
              </Badge>
              {totalPlayerErrors !== undefined && (
                <Badge
                  variant={totalPlayerErrors > 0 ? 'rose' : 'secondary'}
                  className="font-mono text-[9px] py-0 px-1 shrink-0"
                  title={`Всего нелегальных попыток/ошибок за партию: ${totalPlayerErrors}`}
                >
                  {totalPlayerErrors > 0 ? `⚠️ ${totalPlayerErrors} ош.` : '0 ош.'}
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground font-mono truncate">
              {isLive ? (statusText || 'Ожидание...') : `Ход #${savedThought?.turnNumber || 1} • ${savedThought?.san}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {/* Живой счетчик скорости и токенов во время генерации */}
          {isLive && isStreaming && (
            <Badge variant="cyan" className="gap-1 font-mono animate-pulse shadow-cyan-glow">
              <Zap className="w-3 h-3 text-primary animate-bounce shrink-0" />
              <span>{liveTokenDisplay} tok</span>
              <span className="text-primary/60">•</span>
              <span className="text-emerald-400 font-bold">
                {tokensPerSecond > 0 ? `${tokensPerSecond.toFixed(1)} t/s` : 'генерация...'}
              </span>
            </Badge>
          )}

          {isLive && isInspectingPause && inspectCountdown !== null && (
            <Button
              type="button"
              variant="amber"
              size="sm"
              onClick={onSkipPause}
              title="Пропустить паузу и сделать следующий ход"
              className="h-7 text-xs gap-1 px-2.5"
            >
              <Clock className="w-3.5 h-3.5 animate-pulse text-slate-950" />
              <span>Пауза: {inspectCountdown.toFixed(1)}s</span>
              <FastForward className="w-3 h-3 ml-0.5 opacity-80" />
            </Button>
          )}

          {currentAttempt > 1 && isLive && !isInspectingPause && (
            <Badge variant="rose" className="gap-1 animate-pulse font-mono">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>Попытка {currentAttempt}</span>
            </Badge>
          )}

          {savedThought && savedThought.retries.length > 0 && (
            <Badge variant="rose" className="gap-1 font-mono">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>{savedThought.retries.length} ош.</span>
            </Badge>
          )}

          {/* Сохраненный ход: отображение скорости, токенов и времени */}
          {savedThought && (
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <Badge variant="cyan" className="gap-1">
                <Zap className="w-3 h-3 text-primary shrink-0" />
                <span>{savedTokenDisplay} tok</span>
                {savedSpeedDisplay > 0 && (
                  <>
                    <span className="text-primary/60">•</span>
                    <span className="text-emerald-400 font-bold">{savedSpeedDisplay} t/s</span>
                  </>
                )}
              </Badge>

              <Badge variant="secondary" className="gap-1 text-muted-foreground">
                <Clock className="w-3 h-3 shrink-0" />
                <span>{durationSec}s</span>
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Кнопка Спойлера мыслей */}
      <div className="mt-3 flex-1 flex flex-col min-h-0">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-border/80 hover:border-primary/50 transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Brain className="w-4 h-4 text-primary shrink-0" />
            <span>
              {isThinkingActive
                ? `🧠 Поток сознания (${liveTokenDisplay} tok • ${tokensPerSecond > 0 ? `${tokensPerSecond.toFixed(1)} t/s` : 'расчет...'})...`
                : isInspectingPause
                ? `🧠 Рассуждения (${savedTokenDisplay || liveTokenDisplay} tok • ${durationSec || '0'}s)`
                : `🧠 Рассуждения (${savedTokenDisplay} tok ${savedSpeedDisplay > 0 ? `• ${savedSpeedDisplay} t/s` : ''})`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-foreground">
            <span className="text-[11px] font-mono">{isOpen ? 'Свернуть' : 'Развернуть'}</span>
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        </button>

        {isOpen && (
          <div className="mt-2 flex-1 max-h-[calc(100vh-290px)] min-h-[140px] overflow-y-auto p-3 rounded-xl bg-slate-950/80 border border-border custom-scrollbar transition-all font-mono text-xs leading-relaxed">
            {rawThoughtText ? (
              <div className="whitespace-pre-wrap text-slate-200">
                {rawThoughtText}
              </div>
            ) : (
              <div className="text-muted-foreground italic flex items-center gap-2 py-8 justify-center">
                <Brain className="w-4 h-4 animate-pulse text-muted-foreground" />
                <span>Генерация размышлений еще не началась...</span>
              </div>
            )}
            <div ref={streamEndRef} />
          </div>
        )}
      </div>

      {/* Лог повторных попыток при нелегальных ходах */}
      {retries.length > 0 && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
          <div className="flex items-center gap-1.5 font-bold mb-1 text-rose-400">
            <AlertTriangle className="w-4 h-4" />
            <span>Попытки исправления нелегального хода ({retries.length}):</span>
          </div>
          <div className="space-y-1">
            {retries.map((r, idx) => (
              <div key={idx} className="font-mono text-[11px] bg-rose-950/70 p-1.5 rounded-lg border border-rose-900/40">
                Попытка #{r.attempt}: {r.errorReason}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Реплика оппоненту (Трэшток / Диалог) */}
      {displayComment && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 text-xs flex items-start gap-2 shadow-cyan-glow animate-in fade-in duration-200">
          <span className="text-base leading-none shrink-0">💬</span>
          <div className="flex-1 min-w-0">
            <span className="text-[9px] uppercase font-bold text-primary block tracking-wider">
              Реплика сопернику:
            </span>
            <p className="italic font-medium text-slate-100 mt-0.5 text-xs leading-snug break-words">
              «{displayComment}»
            </p>
          </div>
        </div>
      )}

      {/* Итоговый выбранный ход */}
      {(displayMove || savedThought?.san) && (
        <div className="mt-2.5 flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 shadow-emerald-glow">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs text-emerald-300 font-medium">Выбранный ход:</span>
          </div>
          <Badge variant="emerald" className="text-xs px-3 py-1 font-mono font-black tracking-wider">
            {savedThought?.san || displayMove}
          </Badge>
        </div>
      )}

      {/* Кнопка «Пробовать еще раз» */}
      {onRetry && !isStreaming && !isInspectingPause && (
        <Button
          type="button"
          variant="amber"
          size="sm"
          onClick={onRetry}
          className="mt-2.5 w-full gap-2 text-xs"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Пересчитать ход (Новая генерация)</span>
        </Button>
      )}
    </div>
  );
};
