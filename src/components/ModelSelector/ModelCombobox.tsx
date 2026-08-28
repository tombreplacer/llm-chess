import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  Check,
  Sparkles,
  Server,
  Globe,
  PlusCircle,
  X
} from 'lucide-react';
import type { LlmProvider } from '../../types/chess';
import { Badge } from '@/components/ui/badge';

export interface ComboboxModelItem {
  id: string;
  name?: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
}

interface ModelComboboxProps {
  value: string;
  onChange: (modelId: string) => void;
  models: ComboboxModelItem[];
  provider: LlmProvider;
  placeholder?: string;
}

export const ModelCombobox: React.FC<ModelComboboxProps> = ({
  value,
  onChange,
  models,
  provider,
  placeholder = 'Выберите модель...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'reasoning' | 'free' | 'fast' | 'flagship'>('all');

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Фокус на поле поиска при открытии
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const selectedModel = useMemo(() => {
    return models.find(m => m.id === value);
  }, [models, value]);

  // Фильтрация моделей
  const filteredModels = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return models.filter(m => {
      // 1. Категория
      if (selectedCategory === 'reasoning') {
        const idLower = m.id.toLowerCase();
        const isReasoning =
          idLower.includes('r1') ||
          idLower.includes('qwq') ||
          idLower.includes('o1') ||
          idLower.includes('o3') ||
          idLower.includes('reason') ||
          idLower.includes('thinking') ||
          idLower.includes('sonnet');
        if (!isReasoning) return false;
      } else if (selectedCategory === 'free') {
        const isFree = m.id.toLowerCase().includes(':free') || m.id.toLowerCase().includes('free');
        if (!isFree) return false;
      } else if (selectedCategory === 'fast') {
        const idLower = m.id.toLowerCase();
        const isFast =
          idLower.includes('flash') ||
          idLower.includes('mini') ||
          idLower.includes('haiku') ||
          idLower.includes('turbo') ||
          idLower.includes('3b') ||
          idLower.includes('8b') ||
          idLower.includes('7b');
        if (!isFast) return false;
      } else if (selectedCategory === 'flagship') {
        const idLower = m.id.toLowerCase();
        const isFlagship =
          idLower.includes('gpt-4o') ||
          idLower.includes('claude-3.7') ||
          idLower.includes('claude-3.5') ||
          idLower.includes('mistral-large') ||
          idLower.includes('70b') ||
          idLower.includes('72b') ||
          idLower.includes('405b');
        if (!isFlagship) return false;
      }

      // 2. Поисковый запрос
      if (!query) return true;
      const matchId = m.id.toLowerCase().includes(query);
      const matchName = (m.name || '').toLowerCase().includes(query);
      const matchDesc = (m.description || '').toLowerCase().includes(query);
      return matchId || matchName || matchDesc;
    });
  }, [models, searchQuery, selectedCategory]);

  const handleSelect = (modelId: string) => {
    onChange(modelId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const isExactMatch = models.some(m => m.id.toLowerCase() === searchQuery.trim().toLowerCase());

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Кнопка-триггер выпадающего списка */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950/70 border text-left transition-all cursor-pointer shadow-sm ${
          isOpen
            ? 'border-primary shadow-cyan-glow ring-1 ring-primary/40'
            : 'border-border hover:border-slate-600 hover:bg-slate-900/80'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {provider === 'openrouter' ? (
            <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          ) : (
            <Server className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          )}

          <div className="min-w-0 flex-1 truncate">
            {selectedModel ? (
              <span className="text-white text-xs font-semibold truncate block font-mono">
                {selectedModel.name || selectedModel.id}
              </span>
            ) : value ? (
              <span className="text-white text-xs font-semibold truncate block font-mono">
                {value}
              </span>
            ) : (
              <span className="text-muted-foreground text-xs truncate block">{placeholder}</span>
            )}
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {/* Выпадающий список с поиском */}
      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 rounded-2xl border border-border bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[380px] animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Поле поиска и фильтры категорий */}
          <div className="p-2.5 border-b border-border/80 bg-slate-950/80 flex flex-col gap-2">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Фильтр: название, ID или ключевое слово..."
                className="w-full bg-slate-900/90 border border-border rounded-xl pl-8 pr-7 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 p-0.5 text-muted-foreground hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Фильтры категорий для OpenRouter */}
            {provider === 'openrouter' && (
              <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-0.5">
                {[
                  { id: 'all', label: 'Все' },
                  { id: 'reasoning', label: '🧠 Reasoning' },
                  { id: 'free', label: '🆓 Free' },
                  { id: 'fast', label: '⚡ Flash/Mini' },
                  { id: 'flagship', label: '👑 Флагманы' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id as any)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all shrink-0 cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                        : 'bg-slate-800/80 text-muted-foreground hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Список отфильтрованных моделей */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
            {filteredModels.length > 0 ? (
              filteredModels.map(m => {
                const isSelected = m.id === value;
                const isFree = m.id.toLowerCase().includes(':free');
                const isReasoning =
                  m.id.toLowerCase().includes('r1') ||
                  m.id.toLowerCase().includes('qwq') ||
                  m.id.toLowerCase().includes('sonnet');

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelect(m.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-primary/20 border border-primary/40 text-primary-foreground'
                        : 'hover:bg-slate-800/70 border border-transparent'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-xs text-white truncate">
                          {m.name && m.name !== m.id ? m.name : m.id}
                        </span>

                        {isFree && (
                          <Badge variant="emerald" className="text-[9px] py-0 px-1 font-mono">
                            FREE
                          </Badge>
                        )}

                        {isReasoning && (
                          <Badge variant="cyan" className="text-[9px] py-0 px-1 font-mono flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" /> CoT
                          </Badge>
                        )}
                      </div>

                      {m.name && m.name !== m.id && (
                        <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                          {m.id}
                        </p>
                      )}

                      {m.description && (
                        <p className="text-[10px] text-slate-400 truncate mt-0.5 opacity-80">
                          {m.description}
                        </p>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-primary shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="py-4 px-3 text-center text-muted-foreground text-xs">
                Модели по запросу «{searchQuery}» не найдены.
              </div>
            )}

            {/* Ввод произвольного кастомного ID модели */}
            {searchQuery.trim() && !isExactMatch && (
              <button
                type="button"
                onClick={() => handleSelect(searchQuery.trim())}
                className="w-full text-left p-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-600/80 text-indigo-200 transition-colors flex items-center gap-2 text-xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                <div className="truncate flex-1">
                  <span className="font-semibold block text-white">Использовать кастомный ID:</span>
                  <span className="font-mono text-[11px] text-indigo-300 truncate block">
                    «{searchQuery.trim()}»
                  </span>
                </div>
              </button>
            )}
          </div>

          {/* Футер списка */}
          <div className="p-2 border-t border-border/80 bg-slate-950/80 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
            <span>
              Показано: {filteredModels.length} из {models.length}
            </span>
            <span>{provider === 'openrouter' ? 'OpenRouter API' : 'LM Studio'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
