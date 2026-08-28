import React from 'react';
import type { PostGameSpeech, GameStatus } from '../../types/chess';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Skull, Handshake, Volume2, RotateCcw, MessageSquare, Sparkles } from 'lucide-react';

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
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-slate-900 border-border shadow-2xl">
        {/* Шапка модального окна */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border/80 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl shadow-lg text-white shrink-0 ${
                isCheckmate
                  ? 'bg-amber-500 shadow-amber-glow text-slate-950'
                  : 'bg-primary shadow-cyan-glow text-white'
              }`}
            >
              {isCheckmate ? <Trophy className="w-6 h-6 animate-bounce" /> : <Handshake className="w-6 h-6" />}
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black tracking-tight text-foreground">
                {title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {subtitle}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Тело: Список послематчевых речей */}
        <ScrollArea className="flex-1 p-4 sm:p-5 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Послематчевые речи участников:</span>
              </h3>
              {isGeneratingSpeech && (
                <span className="text-[11px] text-primary font-mono flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-3 h-3 animate-spin" />
                  <span>Генерация речи...</span>
                </span>
              )}
            </div>

            {speeches.length === 0 && isGeneratingSpeech && (
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-border flex flex-col items-center justify-center gap-2 text-center text-muted-foreground">
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
                      ? 'bg-amber-950/25 border-amber-500/40 shadow-amber-glow'
                      : isLoser
                      ? 'bg-rose-950/25 border-rose-500/40 shadow-rose-glow'
                      : 'bg-slate-950/60 border-cyan-500/40 shadow-cyan-glow'
                  }`}
                >
                  {/* Заголовок карточки спикера */}
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-border/60">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-2xl drop-shadow shrink-0">{speech.avatar}</span>
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <h4 className="font-bold text-foreground text-sm truncate">{speech.speakerName}</h4>
                        <Badge variant={speech.color === 'w' ? 'white' : 'black'} className="shrink-0">
                          {speech.color === 'w' ? 'Белые' : 'Черные'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge
                        variant={isWinner ? 'amber' : isLoser ? 'rose' : 'cyan'}
                        className="gap-1 font-bold"
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
                      </Badge>

                      <Button
                        type="button"
                        size="icon-sm"
                        variant="secondary"
                        onClick={() => onReplaySpeech(speech)}
                        title="Озвучить речь голосом (TTS)"
                        className="text-primary hover:text-white"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Текст последнего слова */}
                  <div className="relative pl-3 border-l-2 border-primary/60 my-1">
                    <p className="text-xs sm:text-sm text-foreground font-sans leading-relaxed italic">
                      «{speech.speechText}»
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Футер с кнопками */}
        <DialogFooter className="p-3.5 bg-slate-950/80 border-t border-border/80 flex items-center justify-between gap-2 shrink-0">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="text-xs"
          >
            Смотреть доску
          </Button>

          <Button
            type="button"
            variant="default"
            onClick={onNewGame}
            className="text-xs gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Новая партия</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
