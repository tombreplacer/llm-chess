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
    <div className="w-full max-w-full bg-slate-900 border border-slate-800 rounded-xl p-2 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-1.5 box-border overflow-hidden">
      {/* Режимы */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 w-full sm:w-auto">
        <button
          onClick={() => onChangeMode('human_vs_llm')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-semibold transition-all ${
            gameMode === 'human_vs_llm'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Человек vs LLM</span>
        </button>

        <button
          onClick={() => onChangeMode('llm_vs_llm')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-semibold transition-all ${
            gameMode === 'llm_vs_llm'
              ? 'bg-cyan-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bot className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">LLM vs LLM</span>
        </button>
      </div>

      {/* Кнопки */}
      <div className="flex items-center justify-center gap-1 sm:gap-1.5 w-full sm:w-auto flex-wrap">
        {gameMode === 'llm_vs_llm' && (
          <button
            onClick={onToggleAutoPlay}
            disabled={isGameOver}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow ${
              isAutoPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isAutoPlaying ? <Pause className="w-3.5 h-3.5 shrink-0" /> : <Play className="w-3.5 h-3.5 shrink-0" />}
            <span>{isAutoPlaying ? 'Пауза' : 'Автоплей'}</span>
          </button>
        )}

        <button
          onClick={onStepMove}
          disabled={isThinking || isGameOver || isAutoPlaying}
          title="Сделать один ход LLM"
          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg border border-slate-700 transition-colors shadow shrink-0"
        >
          <SkipForward className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Ход</span>
        </button>

        <button
          onClick={onFlipBoard}
          title="Перевернуть доску"
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors shrink-0"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={toggleSound}
          title={isMuted ? 'Включить звук' : 'Выключить звук'}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors shrink-0"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
        </button>

        <button
          onClick={onResetGame}
          title="Новая партия"
          className="p-1.5 bg-slate-800 hover:bg-rose-900 text-slate-300 hover:text-rose-200 rounded-lg border border-slate-700 transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onOpenSettings}
          title="Настройки"
          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs rounded-lg border border-slate-700 transition-colors shadow shrink-0"
        >
          <Settings className="w-3.5 h-3.5 animate-spin-slow shrink-0" />
          <span className="hidden sm:inline">Настройки</span>
        </button>
      </div>
    </div>
  );
};
