import React, { useState, useEffect, useRef } from 'react';
import type { MoveThought, PieceColor, RetryLog } from '../../types/chess';
import { ChevronDown, ChevronRight, Brain, AlertTriangle, Clock, CheckCircle2, RotateCw, FastForward } from 'lucide-react';

interface ThinkingSpoilerProps {
  isLive?: boolean;
  thoughtStream?: string;
  contentStream?: string;
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
}

export const ThinkingSpoiler: React.FC<ThinkingSpoilerProps> = ({
  isLive = false,
  thoughtStream = '',
  contentStream = '',
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
  onSkipPause
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

  return (
    <div className="thinking-card flex flex-col h-full">
      {/* Шапка карточки игрока */}
      <div className="flex items-center justify-between pb-3 border-b">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl drop-shadow">{avatar}</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm leading-tight">{playerName}</h3>
              <span className={isWhiteColor ? 'badge-color-white' : 'badge-color-black'}>
                {colorName}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {isLive ? (statusText || 'Ожидание...') : `Ход #${savedThought?.turnNumber || 1} • ${savedThought?.san}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLive && isStreaming && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 text-xs font-semibold animate-pulse">
              <Brain className="w-3.5 h-3.5 animate-spin" />
              <span>{isThinkingActive ? 'Мыслит...' : 'Ход'}</span>
            </div>
          )}

          {isLive && isInspectingPause && inspectCountdown !== null && (
            <button
              onClick={onSkipPause}
              title="Пропустить паузу и сделать следующий ход"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-semibold hover:bg-amber-900/80 transition-colors cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              <span>Пауза: {inspectCountdown.toFixed(1)}s</span>
              <FastForward className="w-3 h-3 ml-0.5 opacity-80" />
            </button>
          )}

          {currentAttempt > 1 && isLive && !isInspectingPause && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-400 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Попытка {currentAttempt}</span>
            </div>
          )}

          {savedThought && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-850 px-2.5 py-1 rounded-lg border border-slate-700">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{durationSec}s</span>
            </div>
          )}
        </div>
      </div>

      {/* Кнопка Спойлера мыслей */}
      <div className="mt-3 flex-1 flex flex-col min-h-0">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="thinking-btn w-full flex items-center justify-between group"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Brain className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              {isThinkingActive
                ? '🧠 Поток сознания LLM (в реальном времени)...'
                : isInspectingPause
                ? `🧠 Изучение рассуждений (${rawThoughtText.length} симв.)...`
                : `🧠 Рассуждения (${rawThoughtText.length} симв.)`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-slate-200">
            <span className="text-[11px] font-mono">{isOpen ? 'Свернуть' : 'Развернуть'}</span>
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        </button>

        {isOpen && (
          <div className="thinking-body mt-2 flex-1 max-h-[calc(100vh-290px)] min-h-[150px] overflow-y-auto custom-scrollbar transition-all">
            {rawThoughtText ? (
              <div className="whitespace-pre-wrap font-mono text-slate-200 text-xs leading-relaxed">
                {rawThoughtText}
              </div>
            ) : (
              <div className="text-slate-500 italic flex items-center gap-2 py-8 justify-center">
                <Brain className="w-4 h-4 animate-pulse text-slate-600" />
                <span>Генерация размышлений еще не началась...</span>
              </div>
            )}
            <div ref={streamEndRef} />
          </div>
        )}
      </div>

      {/* Лог повторных попыток при нелегальных ходах */}
      {retries.length > 0 && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/50 text-rose-300 text-xs">
          <div className="flex items-center gap-1.5 font-bold mb-1 text-rose-400">
            <AlertTriangle className="w-4 h-4" />
            <span>Попытки исправления нелегального хода ({retries.length}):</span>
          </div>
          <div className="space-y-1">
            {retries.map((r, idx) => (
              <div key={idx} className="font-mono text-[11px] bg-rose-950/80 p-1.5 rounded border border-rose-900/40">
                Попытка #{r.attempt}: {r.errorReason}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Реплика оппоненту (Трэшток / Диалог) */}
      {displayComment && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 text-xs flex items-start gap-2 shadow-sm animate-in fade-in duration-200">
          <span className="text-base leading-none">💬</span>
          <div className="flex-1">
            <span className="text-[9px] uppercase font-bold text-cyan-400 block tracking-wider">
              Реплика сопернику:
            </span>
            <p className="italic font-medium text-slate-100 mt-0.5 text-xs leading-snug">
              «{displayComment}»
            </p>
          </div>
        </div>
      )}

      {/* Итоговый выбранный ход */}
      {(displayMove || savedThought?.san) && (
        <div className="mt-2.5 flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-300 font-medium">Выбранный ход:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-600 text-white font-mono font-extrabold text-xs rounded-lg shadow tracking-wider">
              {savedThought?.san || displayMove}
            </span>
          </div>
        </div>
      )}

      {/* Кнопка «Пробовать еще раз» */}
      {onRetry && !isStreaming && !isInspectingPause && (
        <button
          onClick={onRetry}
          className="mt-2.5 w-full flex items-center justify-center gap-2 py-2 px-3 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all shadow"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>🔄 Пробовать еще раз (Пересчитать ход)</span>
        </button>
      )}
    </div>
  );
};
