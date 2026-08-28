import React from 'react';
import type { GameMode } from '../../types/chess';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Volume2,
  VolumeX,
  Settings,
  ArrowUpDown,
  Bot,
  User
} from 'lucide-react';
import { sounds } from '../../services/soundEffects';
import { Button } from '@/components/ui/button';

interface GameControlsProps {
  gameMode: GameMode;
  onChangeMode: (mode: GameMode) => void;
  isAutoPlaying: boolean;
  onToggleAutoPlay: () => void;
  onStepMove: () => void;
  onResetGame: () => void;
  onFlipBoard: () => void;
  onOpenSettings: () => void;
  isThinking: boolean;
  isGameOver: boolean;
}

export const GameControls: React.FC<GameControlsProps> = ({
  gameMode,
  onChangeMode,
  isAutoPlaying,
  onToggleAutoPlay,
  onStepMove,
  onResetGame,
  onFlipBoard,
  onOpenSettings,
  isThinking,
  isGameOver
}) => {
  const [isMuted, setIsMuted] = React.useState(sounds.getIsMuted());

  const toggleSound = () => {
    const nextMute = sounds.toggleMute();
    setIsMuted(nextMute);
  };

  return (
    <div className="w-full max-w-full bg-slate-900/90 border border-border/80 rounded-2xl p-1.5 sm:p-2 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-1.5 overflow-hidden backdrop-blur-xl">
      {/* Переключатель режимов */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-border/80 w-full sm:w-auto">
        <Button
          type="button"
          size="sm"
          variant={gameMode === 'human_vs_llm' ? 'default' : 'ghost'}
          onClick={() => onChangeMode('human_vs_llm')}
          className="flex-1 sm:flex-initial h-7 sm:h-8 text-xs gap-1.5 px-2.5"
        >
          <User className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Человек vs LLM</span>
        </Button>

        <Button
          type="button"
          size="sm"
          variant={gameMode === 'llm_vs_llm' ? 'neon' : 'ghost'}
          onClick={() => onChangeMode('llm_vs_llm')}
          className="flex-1 sm:flex-initial h-7 sm:h-8 text-xs gap-1.5 px-2.5"
        >
          <Bot className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">LLM vs LLM</span>
        </Button>
      </div>

      {/* Кнопки управления */}
      <div className="flex items-center justify-center gap-1 sm:gap-1.5 w-full sm:w-auto flex-wrap">
        {gameMode === 'llm_vs_llm' && (
          <Button
            type="button"
            size="sm"
            variant={isAutoPlaying ? 'amber' : 'emerald'}
            onClick={onToggleAutoPlay}
            disabled={isGameOver}
            className="h-7 sm:h-8 text-xs gap-1 px-2.5"
          >
            {isAutoPlaying ? <Pause className="w-3.5 h-3.5 shrink-0" /> : <Play className="w-3.5 h-3.5 shrink-0" />}
            <span>{isAutoPlaying ? 'Пауза' : 'Автоплей'}</span>
          </Button>
        )}

        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={onStepMove}
          disabled={isThinking || isGameOver || isAutoPlaying}
          title="Сделать один ход LLM"
          className="h-7 sm:h-8 text-xs gap-1 px-2.5 hover:border-primary/50"
        >
          <SkipForward className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>Ход</span>
        </Button>

        <Button
          type="button"
          size="icon-sm"
          variant="secondary"
          onClick={onFlipBoard}
          title="Перевернуть доску"
          className="hover:text-primary"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
        </Button>

        <Button
          type="button"
          size="icon-sm"
          variant="secondary"
          onClick={toggleSound}
          title={isMuted ? 'Включить звук' : 'Выключить звук'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-muted-foreground" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
        </Button>

        <Button
          type="button"
          size="icon-sm"
          variant="secondary"
          onClick={onResetGame}
          title="Новая партия"
          className="hover:bg-rose-950/80 hover:text-rose-300 hover:border-rose-700/60"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>

        <Button
          type="button"
          size="sm"
          variant="neon"
          onClick={onOpenSettings}
          title="Настройки"
          className="h-7 sm:h-8 text-xs gap-1 px-2.5"
        >
          <Settings className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Настройки</span>
        </Button>
      </div>
    </div>
  );
};
