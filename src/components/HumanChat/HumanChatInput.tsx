import React from 'react';
import type { GrandmasterStyle } from '../../types/chess';
import { MessageSquare, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface HumanChatInputProps {
  value: string;
  onChange: (val: string) => void;
  opponentName: string;
  opponentStyle?: GrandmasterStyle;
  disabled?: boolean;
  isMobileOpen: boolean;
  onToggleMobile: (open: boolean) => void;
}

export const HumanChatInput: React.FC<HumanChatInputProps> = ({
  value,
  onChange,
  opponentName,
  opponentStyle,
  disabled = false,
  isMobileOpen,
  onToggleMobile
}) => {
  // Набор быстрых тематических фраз под соперника
  const getQuickPhrases = (): string[] => {
    const common = [
      '😎 Ну держись!',
      '🥊 Лови вилку!',
      '🤔 Красивый ход...',
      '⚡ Ты зеваешь?',
      '💀 Сдавайся!',
      '👑 Шах и мат близко!'
    ];

    if (opponentStyle === 'nikolaich') {
      return ['🍺 Николаич, наливай!', '🐴 Лошадью хожу!', '🍺 Лавка не спасет!', ...common];
    } else if (opponentStyle === 'tal') {
      return ['🔥 Готов к твоим жертвам!', '💥 В твоем хаосе порядок!', ...common];
    } else if (opponentStyle === 'kasparov') {
      return ['⚡ Напор не пройдет!', '🛡️ Защита железная!', ...common];
    } else if (opponentStyle === 'karpov') {
      return ['🐍 Удав не сожмет позицию!', '⏳ Играем до конца!', ...common];
    } else if (opponentStyle === 'troll') {
      return ['😈 Сам ты зевок!', '🤫 Посмотрим, кто кого!', ...common];
    }

    return common;
  };

  const quickPhrases = getQuickPhrases();

  return (
    <div className="w-full">
      {/* ДЕСКТОПНЫЙ ВИД (>= 1024px) */}
      <div className="hidden lg:flex flex-col gap-1.5 w-full bg-slate-900/90 border border-border/80 rounded-2xl p-2.5 shadow-md backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-primary font-bold text-xs shrink-0">
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="truncate max-w-[120px]">Чат с {opponentName}:</span>
          </div>

          <div className="relative flex-1 flex items-center">
            <Input
              type="text"
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder="Напишите реплику модели (отправится вместе с ходом)..."
              maxLength={140}
              disabled={disabled}
              className="pr-7 font-sans text-xs h-8 bg-slate-950/80"
            />
            {value.trim() && (
              <button
                type="button"
                onClick={() => onChange('')}
                title="Очистить"
                className="absolute right-2 p-0.5 rounded text-muted-foreground hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Быстрые плашки */}
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5">
          <span className="text-[10px] text-muted-foreground font-mono shrink-0">Быстро:</span>
          {quickPhrases.map((phrase, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(phrase)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-sans font-medium transition-all shrink-0 border cursor-pointer ${
                value === phrase
                  ? 'bg-primary text-primary-foreground border-primary font-bold shadow-cyan-glow'
                  : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 border-border hover:border-slate-600'
              }`}
            >
              {phrase}
            </button>
          ))}

          {value.trim() && (
            <span className="ml-auto text-[10px] text-emerald-400 font-mono flex items-center gap-1 shrink-0 animate-pulse font-semibold">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Отправится с ходом</span>
            </span>
          )}
        </div>
      </div>

      {/* МОБИЛЬНЫЙ ВИД (< 1024px): Кнопка-триггер + Drawer */}
      <div className="lg:hidden w-full">
        <button
          type="button"
          onClick={() => onToggleMobile(true)}
          className={`w-full py-2 px-3 rounded-xl border flex items-center justify-between transition-all text-xs font-semibold shadow cursor-pointer ${
            value.trim()
              ? 'bg-primary/15 border-primary text-primary shadow-cyan-glow ring-1 ring-primary/30'
              : 'bg-slate-900/90 border-border text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
            <MessageSquare
              className={`w-3.5 h-3.5 shrink-0 ${
                value.trim() ? 'text-primary animate-bounce' : 'text-muted-foreground'
              }`}
            />
            <span className="truncate">
              {value.trim() ? `Реплика: «${value}»` : `💬 Написать реплику для ${opponentName}`}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0 pl-2">
            {value.trim() ? (
              <Badge variant="cyan" className="font-mono text-[9px] py-0 px-1.5 font-bold">
                готово
              </Badge>
            ) : (
              <span className="text-[10px] text-primary font-mono font-medium">
                Открыть ✏️
              </span>
            )}
          </div>
        </button>

        {/* Мобильная модалка / Drawer ввода сообщения */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-150">
            <div
              className="w-full max-w-lg bg-slate-900 border border-border rounded-2xl p-4 shadow-2xl space-y-3 animate-in slide-in-from-bottom-4 duration-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Реплика для {opponentName}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleMobile(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] text-muted-foreground">
                  Сообщение прикрепится к вашему следующему ходу на доске и будет отправлено модели:
                </p>
                <textarea
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  placeholder="Введите текст реплики или трэштока..."
                  rows={2}
                  maxLength={140}
                  autoFocus
                  className="w-full bg-slate-950 border border-border rounded-xl p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-sans resize-none"
                />
              </div>

              {/* Быстрые фразы */}
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                  Быстрые фразы:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar pr-1">
                  {quickPhrases.map((phrase, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onChange(phrase)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border cursor-pointer ${
                        value === phrase
                          ? 'bg-primary text-primary-foreground border-primary font-bold shadow-cyan-glow'
                          : 'bg-slate-950 text-slate-200 border-border hover:bg-slate-800'
                      }`}
                    >
                      {phrase}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onChange('')}
                  disabled={!value.trim()}
                  className="text-xs"
                >
                  Очистить
                </Button>

                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => onToggleMobile(false)}
                  className="text-xs"
                >
                  {value.trim() ? 'Сохранить (отправить с ходом) ✓' : 'Закрыть'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
