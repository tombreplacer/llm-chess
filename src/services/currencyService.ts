import type { CurrencyCode, CurrencyInfo } from '../types/chess';

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  RUB: {
    code: 'RUB',
    name: 'Российский рубль',
    symbol: '₽',
    defaultRate: 92.5
  },
  USD: {
    code: 'USD',
    name: 'Доллар США',
    symbol: '$',
    defaultRate: 1.0
  },
  EUR: {
    code: 'EUR',
    name: 'Евро',
    symbol: '€',
    defaultRate: 0.92
  },
  KZT: {
    code: 'KZT',
    name: 'Казахстанский тенге',
    symbol: '₸',
    defaultRate: 460.0
  },
  BYN: {
    code: 'BYN',
    name: 'Белорусский рубль',
    symbol: 'Br',
    defaultRate: 3.25
  },
  TRY: {
    code: 'TRY',
    name: 'Турецкая лира',
    symbol: '₺',
    defaultRate: 34.0
  },
  CNY: {
    code: 'CNY',
    name: 'Китайский юань',
    symbol: '¥',
    defaultRate: 7.25
  },
  GBP: {
    code: 'GBP',
    name: 'Британский фунт',
    symbol: '£',
    defaultRate: 0.79
  },
  UAH: {
    code: 'UAH',
    name: 'Украинская гривна',
    symbol: '₴',
    defaultRate: 41.2
  },
  GEL: {
    code: 'GEL',
    name: 'Грузинский лари',
    symbol: '₾',
    defaultRate: 2.75
  },
  AED: {
    code: 'AED',
    name: 'Дирхам ОАЭ',
    symbol: 'AED',
    defaultRate: 3.67
  },
  JPY: {
    code: 'JPY',
    name: 'Японская иена',
    symbol: '¥',
    defaultRate: 155.0
  },
  THB: {
    code: 'THB',
    name: 'Тайский бат',
    symbol: '฿',
    defaultRate: 36.5
  },
  BRL: {
    code: 'BRL',
    name: 'Бразильский реал',
    symbol: 'R$',
    defaultRate: 5.45
  },
  INR: {
    code: 'INR',
    name: 'Индийская рупия',
    symbol: '₹',
    defaultRate: 84.0
  }
};

export const CURRENCY_LIST = Object.values(CURRENCIES);

export async function fetchLiveExchangeRate(targetCurrency: CurrencyCode): Promise<number | null> {
  if (targetCurrency === 'USD') return 1.0;

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data?.rates && typeof data.rates[targetCurrency] === 'number') {
      return Number(data.rates[targetCurrency]);
    }
  } catch (err) {
    console.warn('Основной API курсов валют недоступен, пробуем резервный:', err);
  }

  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data?.rates && typeof data.rates[targetCurrency] === 'number') {
      return Number(data.rates[targetCurrency]);
    }
  } catch (err) {
    console.error('Резервный API курсов также недоступен:', err);
  }

  return null;
}

export function formatCost(
  costUsd: number | undefined | null,
  currency: CurrencyCode = 'RUB',
  exchangeRate: number = 92.5,
  options?: { showZeroAsFree?: boolean; prefix?: string }
): string {
  if (costUsd === undefined || costUsd === null) return '';

  const info = CURRENCIES[currency] || CURRENCIES.RUB;
  const rate = exchangeRate > 0 ? exchangeRate : info.defaultRate;

  if (costUsd === 0) {
    if (options?.showZeroAsFree) return 'Бесплатно (LM Studio)';
    return `0.00 ${info.symbol}`;
  }

  const converted = costUsd * rate;
  const prefix = options?.prefix || '';

  // Для очень маленьких сумм (микро-копейки)
  if (converted < 0.0001) {
    return `${prefix}<0.0001 ${info.symbol}`;
  }
  if (converted < 0.01) {
    return `${prefix}${converted.toFixed(4)} ${info.symbol}`;
  }
  if (converted < 1) {
    return `${prefix}${converted.toFixed(3)} ${info.symbol}`;
  }
  return `${prefix}${converted.toFixed(2)} ${info.symbol}`;
}
