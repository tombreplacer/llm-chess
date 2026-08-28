import React, { useState } from 'react';
import { type CurrencyCode, type CurrencyInfo } from '../../types/chess';
import { CURRENCY_LIST } from '../../services/currencyService';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CurrencyComboboxProps {
  value: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
  disabled?: boolean;
}

export const CurrencyCombobox: React.FC<CurrencyComboboxProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCurrency: CurrencyInfo | undefined = CURRENCY_LIST.find(c => c.code === value);

  const filteredCurrencies = CURRENCY_LIST.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative w-full">
      {/* Кнопка-триггер выбора валюты */}
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 h-10 bg-slate-950/80 border-border text-left font-sans text-xs focus:ring-1 focus:ring-primary"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant="cyan" className="font-mono text-xs px-1.5 py-0 font-bold shrink-0">
            {selectedCurrency?.symbol || '$'}
          </Badge>
          <span className="font-semibold text-foreground truncate">
            {selectedCurrency ? `${selectedCurrency.code} — ${selectedCurrency.name}` : 'Выберите валюту...'}
          </span>
        </div>
        <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-2" />
      </Button>

      {/* Выпадающий список с поиском */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-64 animate-in fade-in-0 zoom-in-95">
            {/* Поле поиска */}
            <div className="p-2 border-b border-border/80 bg-slate-950/90 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-1" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Поиск валюты (RUB, USD, рубль, тенге, EUR...)"
                className="w-full bg-transparent border-none text-xs text-foreground placeholder:text-muted-foreground focus:outline-none font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-muted-foreground hover:text-white px-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Список валют */}
            <div className="flex-1 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
              {filteredCurrencies.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  Валюта не найдена
                </div>
              ) : (
                filteredCurrencies.map(curr => {
                  const isSelected = curr.code === value;
                  return (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => {
                        onChange(curr.code);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                        isSelected
                          ? 'bg-primary/20 text-primary font-bold border border-primary/40'
                          : 'hover:bg-slate-800 text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge
                          variant={isSelected ? 'cyan' : 'secondary'}
                          className="font-mono text-[11px] px-1.5 py-0 font-bold shrink-0"
                        >
                          {curr.symbol}
                        </Badge>
                        <div className="min-w-0">
                          <span className="font-bold text-foreground mr-1.5">{curr.code}</span>
                          <span className="text-muted-foreground text-[11px] truncate">{curr.name}</span>
                        </div>
                      </div>

                      {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-2" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
