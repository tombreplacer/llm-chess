import React from 'react';
import type { PostGameSpeech, GameStatus } from '../../types/chess';
import { Trophy, Skull, Handshake, Volume2, RotateCcw, X, MessageSquare, Sparkles } from 'lucide-react';

interface GameOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameStatus: GameStatus;
  winnerColor: 'w' | 'b' | null;
  speeches: PostGameSpeech[];
  isGeneratingSpeech: boolean;
  onReplaySpeech: (speech: PostGameSpeech) => void;
  onNewGame: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  onClose,
  gameStatus,
  winnerColor,
  speeches,
  isGeneratingSpeech,
  onReplaySpeech,
  onNewGame
}) => {
  if (!isOpen) return null;

  const isCheckmate = gameStatus === 'checkmate';
  const isDraw =
    gameStatus === 'stalemate' ||
    gameStatus === 'draw_50_moves' ||
    gameStatus === 'draw_repetition' ||
    gameStatus === 'draw_insufficient_material' ||
    gameStatus === 'draw_agreement';

  const title = isCheckmate
    ? winnerColor === 'w'
      ? '🏆 Победа Белых (Шах и мат!)'
      : '🏆 Победа Черных (Шах и мат!)'
    : isDraw
    ? '🤝 Боевая Ничья!'
    : 'Партия окончена';

  const subtitle =
    gameStatus === 'checkmate'
      ? 'Король повержен. Партия завершилась безоговорочным матом.'
      : gameStatus === 'stalemate'
      ? 'Пат! У короля нет легальных ходов, но он не находится под шахом.'
      : gameStatus === 'draw_50_moves'
      ? 'Ничья по правилу 50 ходов без взятий и движения пешек.'
      : gameStatus === 'draw_repetition'
      ? 'Ничья из-за троекратного повторения позиции.'
      : gameStatus === 'draw_insufficient_material'
      ? 'Ничья: на доске недостаточно материала для мата.'
      : 'Партия завершена.';

  return (
    <div className="modal-overlay">
      <div
        className="modal-dialog max-w-xl border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ width: 'min(94vw, 560px)' }}
      >
        {/* Шапка модального окна */}
        <div className="modal-header bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl shadow-lg text-white ${
                isCheckmate
                  ? 'bg-gradient-to-br from-amber-500 to-amber-700 shadow-amber-500/30'
                  : 'bg-gradient-to-br from-cyan-600 to-indigo-700 shadow-cyan-500/30'
              }`}
            >
              {isCheckmate ? <Trophy className="w-6 h-6 animate-bounce" /> : <Handshake className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">{title}</h2>
              <p className="text-xs text-slate-400 font-sans">{subtitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            title="Закрыть и смотреть доску"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Тело модального окна: Список послематчевых речей */}
        <div className="modal-body p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>Послематчевые речи участников:</span>
            </h3>
            {isGeneratingSpeech && (
              <span className="text-[11px] text-cyan-400 font-mono flex items-center gap-1 animate-pulse">
                <Sparkles className="w-3 h-3 animate-spin" />
                <span>Генерация речи...</span>
              </span>
            )}
          </div>

          {speeches.length === 0 && isGeneratingSpeech && (
            <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center gap-2 text-center text-slate-400">
              <span className="text-3xl animate-bounce">🧠</span>
              <p className="text-xs font-medium">Гроссмейстер формулирует последнее слово...</p>
            </div>
          )}

          {speeches.map((speech, index) => {
            const isWinner = speech.outcome === 'win';
            const isLoser = speech.outcome === 'loss';

            return (
              <div
                key={index}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isWinner
                    ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.12)]'
                    : isLoser
                    ? 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.12)]'
                    : 'bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border-cyan-500/40'
                }`}
              >
                {/* Заголовок карточки спикера */}
                <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl drop-shadow">{speech.avatar}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">{speech.speakerName}</h4>
                        <span
                          className={
                            speech.color === 'w' ? 'badge-color-white' : 'badge-color-black'
                          }
                        >
                          {speech.color === 'w' ? 'Белые' : 'Черные'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1 ${
                        isWinner
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : isLoser
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      }`}
                    >
                      {isWinner ? (
                        <>
                          <Trophy className="w-3 h-3 text-amber-400" />
                          <span>ПОБЕДИТЕЛЬ</span>
                        </>
                      ) : isLoser ? (
                        <>
                          <Skull className="w-3 h-3 text-rose-400" />
                          <span>ПОРАЖЕНИЕ</span>
                        </>
                      ) : (
                        <>
                          <Handshake className="w-3 h-3 text-cyan-400" />
                          <span>НИЧЬЯ</span>
                        </>
                      )}
                    </span>

                    <button
                      onClick={() => onReplaySpeech(speech)}
                      title="Озвучить речь голосом (TTS)"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-700/40 text-cyan-300 border border-slate-700 transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Текст последнего слова */}
                <div className="relative pl-3 border-l-2 border-cyan-500/60 my-1">
                  <p className="text-xs sm:text-sm text-slate-100 font-sans leading-relaxed italic">
                    «{speech.speechText}»
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Футер с кнопками */}
        <div className="modal-footer p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
          >
            Смотреть доску
          </button>

          <button
            onClick={onNewGame}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-900/40 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Новая партия</span>
          </button>
        </div>
      </div>
    </div>
  );
};
