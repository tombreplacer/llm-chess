import React, { useState, useEffect } from 'react';
import type { 
  CurrencyCode, 
  CurrencySettings, 
  GrandmasterStyle, 
  LMStudioModel, 
  OpenRouterModel, 
  PlayerConfig, 
  TtsConfig 
} from '../../types/chess';
import { GRANDMASTER_PRESETS } from '../../services/prompts';
import { lmStudioService } from '../../services/lmStudioClient';
import { speechService } from '../../services/speechService';
import { fetchLiveExchangeRate, CURRENCIES, formatCost } from '../../services/currencyService';
import { ModelCombobox } from '../ModelSelector/ModelCombobox';
import { CurrencyCombobox } from '../CurrencySelector/CurrencyCombobox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Settings,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  Play,
  User,
  Bot,
  Sparkles,
  Globe,
  Key,
  Eye,
  EyeOff,
  ExternalLink,
  Cpu,
  Zap,
  Sliders,
  Coins,
  Wand2,
  TrendingUp,
  Info
} from 'lucide-react';

export const HUMAN_PERSONAS = [
  {
    name: 'Кожаный Мешок',
    avatar: '🥊',
    bio: 'Человек с железной волей, решивший доказать превосходство биологического разума над кремнием.'
  },
  {
    name: 'Агрессивный Любитель',
    avatar: '⚡',
    bio: 'Атакую любой ценой, жертвую фигуры за инициативу, ненавижу скучную позиционную возню.'
  },
  {
    name: 'Позиционный Зануда',
    avatar: '🛡️',
    bio: 'Сушу позицию, размениваю активные фигуры, методично жду зевка и тактической ошибки соперника.'
  },
  {
    name: 'Дворовый Батя',
    avatar: '🍺',
    bio: 'Играю на лавке под пивко, люблю вилки конями и неожиданные маты в 3 хода.'
  },
  {
    name: 'Гроссмейстер Блица',
    avatar: '👑',
    bio: 'Быстрый расчет вариантов, мгновенная реакция и непрерывное давление на часы.'
  }
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lmStudioBaseUrl: string;
  onUpdateBaseUrl: (url: string) => void;
  openRouterApiKey: string;
  onUpdateOpenRouterApiKey: (key: string) => void;
  openRouterModels: OpenRouterModel[];
  onSetOpenRouterModels: (models: OpenRouterModel[]) => void;
  whiteConfig: PlayerConfig;
  onUpdateWhiteConfig: (config: PlayerConfig) => void;
  blackConfig: PlayerConfig;
  onUpdateBlackConfig: (config: PlayerConfig) => void;
  currencySettings: CurrencySettings;
  onUpdateCurrencySettings: (settings: CurrencySettings) => void;
  maxRetries: number;
  onUpdateMaxRetries: (retries: number) => void;
  postMoveDelaySec: number;
  onUpdatePostMoveDelay: (delay: number) => void;
  availableModels: LMStudioModel[];
  onSetAvailableModels: (models: LMStudioModel[]) => void;
  ttsConfig: TtsConfig;
  onUpdateTtsConfig: (config: TtsConfig) => void;
  initialTab?: 'providers' | 'players' | 'currency' | 'tts' | 'game';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  lmStudioBaseUrl,
  onUpdateBaseUrl,
  openRouterApiKey,
  onUpdateOpenRouterApiKey,
  openRouterModels,
  onSetOpenRouterModels,
  whiteConfig,
  onUpdateWhiteConfig,
  blackConfig,
  onUpdateBlackConfig,
  currencySettings,
  onUpdateCurrencySettings,
  maxRetries,
  onUpdateMaxRetries,
  postMoveDelaySec,
  onUpdatePostMoveDelay,
  availableModels,
  onSetAvailableModels,
  ttsConfig,
  onUpdateTtsConfig,
  initialTab = 'providers'
}) => {
  const [activeTab, setActiveTab] = useState<'providers' | 'players' | 'currency' | 'tts' | 'game'>(initialTab);
  const [activeProviderTab, setActiveProviderTab] = useState<'lmstudio' | 'openrouter'>('lmstudio');
  const [urlInput, setUrlInput] = useState(lmStudioBaseUrl);
  const [apiKeyInput, setApiKeyInput] = useState(openRouterApiKey);
  const [showApiKey, setShowApiKey] = useState(false);

  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const [isOpenRouterLoading, setIsOpenRouterLoading] = useState(false);
  const [openRouterStatus, setOpenRouterStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [openRouterStatusMsg, setOpenRouterStatusMsg] = useState('');

  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [rateFetchMsg, setRateFetchMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [manualRateInput, setManualRateInput] = useState<string>(String(currencySettings?.exchangeRate || 92.5));

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (isOpen) {
      const voices = speechService.getVoices();
      setAvailableVoices(voices);
      setUrlInput(lmStudioBaseUrl);
      setApiKeyInput(openRouterApiKey);
      if (initialTab) {
        setActiveTab(initialTab);
      }
    }
  }, [isOpen, lmStudioBaseUrl, openRouterApiKey, initialTab]);

  const handleTestLmStudio = async () => {
    setIsLoadingModels(true);
    setConnectionStatus('idle');
    setStatusMessage('Подключение к LM Studio...');

    try {
      const models = await lmStudioService.fetchModels(urlInput);
      onUpdateBaseUrl(urlInput);
      onSetAvailableModels(models);
      setConnectionStatus('success');
      setStatusMessage(`Успешно! Найдено локальных моделей: ${models.length}`);

      if (models.length > 0) {
        if (whiteConfig.type === 'llm' && (whiteConfig.provider === 'lmstudio' || !whiteConfig.provider)) {
          if (!whiteConfig.modelId || whiteConfig.modelId === 'mock-ai') {
            onUpdateWhiteConfig({ ...whiteConfig, modelId: models[0].id });
          }
        }
        if (blackConfig.type === 'llm' && (blackConfig.provider === 'lmstudio' || !blackConfig.provider)) {
          if (!blackConfig.modelId || blackConfig.modelId === 'mock-ai') {
            onUpdateBlackConfig({ ...blackConfig, modelId: models[0].id });
          }
        }
      }
    } catch (err: unknown) {
      setConnectionStatus('error');
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage(msg || 'Не удалось подключиться. Проверьте LM Studio.');
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleTestOpenRouter = async () => {
    setIsOpenRouterLoading(true);
    setOpenRouterStatus('idle');
    setOpenRouterStatusMsg('Проверка OpenRouter и загрузка моделей...');

    try {
      const trimmedKey = apiKeyInput.trim();
      onUpdateOpenRouterApiKey(trimmedKey);
      const models = await lmStudioService.fetchOpenRouterModels(trimmedKey);
      onSetOpenRouterModels(models);
      setOpenRouterStatus('success');
      setOpenRouterStatusMsg(`Успешно! Загружено моделей OpenRouter: ${models.length}`);

      if (models.length > 0) {
        if (whiteConfig.type === 'llm' && whiteConfig.provider === 'openrouter') {
          if (!whiteConfig.modelId || whiteConfig.modelId === 'mock-ai') {
            onUpdateWhiteConfig({ ...whiteConfig, modelId: 'deepseek/deepseek-r1' });
          }
        }
        if (blackConfig.type === 'llm' && blackConfig.provider === 'openrouter') {
          if (!blackConfig.modelId || blackConfig.modelId === 'mock-ai') {
            onUpdateBlackConfig({ ...blackConfig, modelId: 'deepseek/deepseek-r1' });
          }
        }
      }
    } catch (err: unknown) {
      setOpenRouterStatus('error');
      const msg = err instanceof Error ? err.message : String(err);
      setOpenRouterStatusMsg(msg || 'Ошибка загрузки моделей OpenRouter.');
    } finally {
      setIsOpenRouterLoading(false);
    }
  };

  const handleTestTts = () => {
    speechService.speak(
      'Лошадью хожу, блядь, век воли не видать! Проверка связи.',
      ttsConfig,
      'nikolaich'
    );
  };

  const handleFetchRate = async () => {
    setIsFetchingRate(true);
    setRateFetchMsg(null);
    try {
      const rate = await fetchLiveExchangeRate(currencySettings.currency);
      if (rate && rate > 0) {
        const cleanRate = Number(rate.toFixed(4));
        onUpdateCurrencySettings({
          ...currencySettings,
          exchangeRate: cleanRate,
          lastUpdated: Date.now()
        });
        setManualRateInput(String(cleanRate));
        setRateFetchMsg({
          type: 'success',
          text: `Курс 1 USD = ${cleanRate} ${CURRENCIES[currencySettings.currency]?.symbol} успешно обновлен из открытого API!`
        });
      } else {
        setRateFetchMsg({
          type: 'error',
          text: 'Не удалось получить курс из сети. Укажите курс вручную.'
        });
      }
    } catch {
      setRateFetchMsg({
        type: 'error',
        text: 'Ошибка запроса к API курсов валют.'
      });
    } finally {
      setIsFetchingRate(false);
    }
  };

  const handleCurrencyChange = async (newCode: CurrencyCode) => {
    const defaultRate = CURRENCIES[newCode]?.defaultRate || 1.0;
    onUpdateCurrencySettings({
      currency: newCode,
      exchangeRate: defaultRate,
      lastUpdated: Date.now()
    });
    setManualRateInput(String(defaultRate));
    setRateFetchMsg(null);

    // Автоматический запрос курса при смене валюты (если не USD)
    if (newCode !== 'USD') {
      setIsFetchingRate(true);
      try {
        const rate = await fetchLiveExchangeRate(newCode);
        if (rate && rate > 0) {
          const cleanRate = Number(rate.toFixed(4));
          onUpdateCurrencySettings({
            currency: newCode,
            exchangeRate: cleanRate,
            lastUpdated: Date.now()
          });
          setManualRateInput(String(cleanRate));
          setRateFetchMsg({
            type: 'success',
            text: `Актуальный курс: 1 USD = ${cleanRate} ${CURRENCIES[newCode]?.symbol}`
          });
        }
      } catch {}
      setIsFetchingRate(false);
    }
  };

  const handleManualRateChange = (valStr: string) => {
    setManualRateInput(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num > 0) {
      onUpdateCurrencySettings({
        ...currencySettings,
        exchangeRate: num,
        lastUpdated: Date.now()
      });
    }
  };

  const renderPlayerSection = (
    config: PlayerConfig,
    onUpdate: (c: PlayerConfig) => void,
    isWhite: boolean
  ) => {
    const isHuman = config.type === 'human';
    const isLocal = (config.provider || 'lmstudio') === 'lmstudio';

    return (
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-border/80 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span
              className={`w-3.5 h-3.5 rounded-full border shadow-sm ${
                isWhite ? 'bg-slate-100 border-slate-300' : 'bg-slate-950 border-slate-700'
              }`}
            />
            <span className="font-bold text-foreground text-xs sm:text-sm">
              {isWhite ? 'Белые фигуры' : 'Черные фигуры'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant={isHuman ? 'default' : 'secondary'}
              size="sm"
              onClick={() => onUpdate({ ...config, type: 'human' })}
              className="h-7 text-[11px] gap-1 px-2.5"
            >
              <User className="w-3 h-3" />
              <span>Человек</span>
            </Button>

            <Button
              type="button"
              variant={!isHuman ? 'neon' : 'secondary'}
              size="sm"
              onClick={() => onUpdate({ ...config, type: 'llm' })}
              className="h-7 text-[11px] gap-1 px-2.5"
            >
              <Bot className="w-3 h-3" />
              <span>Нейросеть (LLM)</span>
            </Button>
          </div>
        </div>

        {isHuman ? (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-slate-300 font-medium text-xs">
                  Ваше имя / Никнейм:
                </label>
                <Input
                  type="text"
                  value={config.name || ''}
                  onChange={e => onUpdate({ ...config, name: e.target.value })}
                  placeholder="Например: Кожаный Мешок..."
                  className="bg-slate-950/80 font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium text-xs">
                  Аватар:
                </label>
                <div className="flex gap-1.5 items-center">
                  <Input
                    type="text"
                    value={config.avatar || '👤'}
                    onChange={e => onUpdate({ ...config, avatar: e.target.value })}
                    className="w-10 text-center px-1 font-sans text-sm"
                  />
                  <div className="flex gap-1 flex-wrap">
                    {['👤', '🥊', '⚡', '🛡️', '🍺', '👑'].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => onUpdate({ ...config, avatar: emoji })}
                        className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs transition-all cursor-pointer ${
                          (config.avatar || '👤') === emoji
                            ? 'bg-primary/20 border-primary text-primary font-bold scale-110 shadow-sm'
                            : 'bg-slate-950 border-border/80 hover:bg-slate-800'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-slate-300 font-medium text-xs">
                  Характер и стиль игры (Bio для LLM):
                </label>
                <span className="text-[10px] text-primary font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Учитывается нейросетью
                </span>
              </div>
              <textarea
                value={config.bio || ''}
                onChange={e => onUpdate({ ...config, bio: e.target.value })}
                rows={2}
                placeholder="Опишите свой стиль: например, агрессивный атакующий игрок, люблю тактику, часто зеваю в цейтноте..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-xs transition-colors resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <span className="block text-muted-foreground text-[11px] font-medium">
                Быстрые шаблоны личности:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {HUMAN_PERSONAS.map(p => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() =>
                      onUpdate({
                        ...config,
                        name: p.name,
                        avatar: p.avatar,
                        bio: p.bio
                      })
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-border text-[11px] text-slate-300 hover:text-white transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    <span>{p.avatar}</span>
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5 text-xs">
            {/* Переключатель провайдера LM Studio / OpenRouter */}
            <div className="space-y-1">
              <label className="text-muted-foreground font-medium text-xs block">
                Провайдер нейросети:
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-border">
                <Button
                  type="button"
                  variant={isLocal ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    const fallbackModel = availableModels[0]?.id || 'mock-ai';
                    onUpdate({
                      ...config,
                      provider: 'lmstudio',
                      modelId: config.modelId.includes('/') ? fallbackModel : config.modelId
                    });
                  }}
                  className="h-8 gap-1.5 text-xs"
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>LM Studio (Локально)</span>
                </Button>

                <Button
                  type="button"
                  variant={!isLocal ? 'neon' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    onUpdate({
                      ...config,
                      provider: 'openrouter',
                      modelId:
                        config.modelId === 'mock-ai' || !config.modelId.includes('/')
                          ? 'deepseek/deepseek-r1'
                          : config.modelId
                    });
                  }}
                  className="h-8 gap-1.5 text-xs"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>OpenRouter (Облако)</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Выбор модели с поиском и фильтрами */}
              <div className="space-y-1">
                <label className="text-muted-foreground font-medium text-xs block">
                  {isLocal ? 'Модель LM Studio:' : 'Модель OpenRouter:'}
                </label>
                <ModelCombobox
                  value={config.modelId}
                  onChange={newModelId => onUpdate({ ...config, modelId: newModelId })}
                  provider={config.provider || 'lmstudio'}
                  models={
                    isLocal
                      ? [
                          {
                            id: 'mock-ai',
                            name: '⚡ Встроенный Демо-ИИ (без сервера)',
                            description: 'Быстрая эмуляция для тестов без сервера'
                          },
                          ...availableModels.map(m => ({ id: m.id, name: m.id }))
                        ]
                      : openRouterModels
                  }
                  placeholder={isLocal ? 'Выберите локальную модель...' : 'Поиск модели OpenRouter...'}
                />
              </div>

              {/* Стиль гроссмейстера */}
              <div className="space-y-1">
                <label className="text-muted-foreground font-medium text-xs block">
                  Стиль гроссмейстера:
                </label>
                <select
                  value={config.style}
                  onChange={e => {
                    const style = e.target.value as GrandmasterStyle;
                    const preset = GRANDMASTER_PRESETS[style];
                    onUpdate({
                      ...config,
                      style,
                      name: preset.name,
                      temperature: preset.temperature
                    });
                  }}
                  className="w-full h-9 px-3 rounded-xl bg-slate-950 border border-border text-foreground text-xs focus:outline-none focus:border-primary"
                >
                  {Object.values(GRANDMASTER_PRESETS).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.avatar} {p.name} ({p.title.split('—')[0]})
                    </option>
                  ))}
                </select>
              </div>

              {/* Быстрый выбор топовых моделей OpenRouter */}
              {!isLocal && (
                <div className="col-span-full space-y-1">
                  <span className="block text-muted-foreground text-[11px]">
                    Популярные модели OpenRouter:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { id: 'deepseek/deepseek-r1', label: '🧠 DeepSeek R1' },
                      { id: 'deepseek/deepseek-chat', label: '⚡ DeepSeek V3' },
                      { id: 'anthropic/claude-3.7-sonnet', label: '🌟 Claude 3.7' },
                      { id: 'openai/gpt-4o', label: '🤖 GPT-4o' },
                      { id: 'google/gemini-2.0-flash-001', label: '⚡ Gemini 2.0' },
                      { id: 'qwen/qwq-32b', label: '🎯 QwQ 32B' },
                      { id: 'meta-llama/llama-3.2-3b-instruct:free', label: '🆓 Llama Free' }
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => onUpdate({ ...config, modelId: m.id })}
                        className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono transition-all cursor-pointer ${
                          config.modelId === m.id
                            ? 'bg-primary/20 border-primary text-primary font-bold shadow-sm'
                            : 'bg-slate-950 border-border text-muted-foreground hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Температура */}
              <div className="col-span-full space-y-2">
                <div className="flex justify-between text-muted-foreground text-xs">
                  <span>Температура рассуждений (Креативность):</span>
                  <span className="font-mono text-foreground font-bold">{config.temperature}</span>
                </div>
                <Slider
                  min={0.1}
                  max={1.2}
                  step={0.05}
                  value={[config.temperature]}
                  onValueChange={vals => onUpdate({ ...config, temperature: vals[0] })}
                />
              </div>

              {/* Лимит токенов (Max Tokens) */}
              <div className="col-span-full space-y-1.5">
                <div className="flex justify-between text-muted-foreground text-xs">
                  <span>Лимит токенов генерации (Max Tokens):</span>
                  <span className="font-mono text-primary font-bold">
                    {config.maxTokens === -1 || config.maxTokens === 0 || !config.maxTokens
                      ? '♾️ Безлимит (Максимум модели)'
                      : `${config.maxTokens} токенов`}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    { val: 1024, label: '1 024' },
                    { val: 2048, label: '2 048' },
                    { val: 4096, label: '4 096 (CoT)' },
                    { val: 8192, label: '8 192 (DeepSeek R1)' },
                    { val: 16384, label: '16 384' },
                    { val: -1, label: '♾️ Безлимит' }
                  ].map(item => {
                    const isSelected =
                      (item.val === -1 &&
                        (config.maxTokens === -1 || config.maxTokens === 0 || !config.maxTokens)) ||
                      config.maxTokens === item.val;

                    return (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => onUpdate({ ...config, maxTokens: item.val })}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary/20 border-primary text-primary font-bold shadow-sm'
                            : 'bg-slate-950 border-border text-muted-foreground hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Для моделей с рассуждениями (DeepSeek R1, QwQ) рекомендуется 4K+ или Безлимит.
                </p>
              </div>

              {/* Кастомный промпт */}
              <div className="col-span-full space-y-1">
                <label className="text-muted-foreground text-xs block">
                  Дополнительные инструкции для LLM (необязательно):
                </label>
                <textarea
                  value={config.systemPromptCustom || ''}
                  onChange={e => onUpdate({ ...config, systemPromptCustom: e.target.value })}
                  rows={2}
                  placeholder="Например: Стремись к атаке на короля, отвечай дерзко и с сарказмом..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-xs transition-colors resize-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-slate-900 border-border shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border/80 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20 text-primary border border-primary/30 shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-extrabold text-foreground">
                Параметры Нейросетей и Игроков
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                LM Studio, OpenRouter, стили гроссмейстеров, Web Speech TTS и партия
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="px-4 sm:px-5 pt-3 shrink-0 border-b border-border/60 bg-slate-950/30">
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid grid-cols-5 w-full h-9 bg-slate-950 border border-border">
              <TabsTrigger value="providers" className="text-xs gap-1.5 px-1 sm:px-2">
                <Cpu className="w-3.5 h-3.5 hidden sm:inline" />
                <span>Провайдеры</span>
              </TabsTrigger>
              <TabsTrigger value="players" className="text-xs gap-1.5 px-1 sm:px-2">
                <User className="w-3.5 h-3.5 hidden sm:inline" />
                <span>Персоны</span>
              </TabsTrigger>
              <TabsTrigger value="currency" className="text-xs gap-1.5 px-1 sm:px-2">
                <Coins className="w-3.5 h-3.5 hidden sm:inline text-amber-400" />
                <span>Валюта</span>
              </TabsTrigger>
              <TabsTrigger value="tts" className="text-xs gap-1.5 px-1 sm:px-2">
                <Volume2 className="w-3.5 h-3.5 hidden sm:inline" />
                <span>Озвучка</span>
              </TabsTrigger>
              <TabsTrigger value="game" className="text-xs gap-1.5 px-1 sm:px-2">
                <Sliders className="w-3.5 h-3.5 hidden sm:inline" />
                <span>Движок</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Scrollable Content Body */}
        <ScrollArea className="flex-1 p-4 sm:p-5 overflow-y-auto custom-scrollbar">
          {activeTab === 'providers' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                    <Cpu className="w-4 h-4 text-primary" />
                    <span>Подключение к AI-провайдерам</span>
                  </div>
                </div>

                {/* Вкладки выбора LM Studio / OpenRouter */}
                <div className="flex gap-2 border-b border-border pb-3">
                  <Button
                    type="button"
                    variant={activeProviderTab === 'lmstudio' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setActiveProviderTab('lmstudio')}
                    className="gap-2 text-xs"
                  >
                    <Server className="w-3.5 h-3.5" />
                    <span>LM Studio (Локально)</span>
                  </Button>

                  <Button
                    type="button"
                    variant={activeProviderTab === 'openrouter' ? 'neon' : 'secondary'}
                    size="sm"
                    onClick={() => setActiveProviderTab('openrouter')}
                    className="gap-2 text-xs"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>OpenRouter (Облако / API)</span>
                    <Badge variant="cyan" className="text-[9px] py-0 px-1 font-bold">
                      NEW
                    </Badge>
                  </Button>
                </div>

                {/* Вкладка LM Studio */}
                {activeProviderTab === 'lmstudio' && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={urlInput}
                        onChange={e => setUrlInput(e.target.value)}
                        placeholder="http://localhost:1234/v1"
                        className="flex-1"
                      />
                      <Button
                        onClick={handleTestLmStudio}
                        disabled={isLoadingModels}
                        className="shrink-0 gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingModels ? 'animate-spin' : ''}`} />
                        <span>{isLoadingModels ? 'Проверка...' : 'Обновить'}</span>
                      </Button>
                    </div>

                    {connectionStatus !== 'idle' && (
                      <div
                        className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                          connectionStatus === 'success'
                            ? 'bg-emerald-950/60 border border-emerald-800/80 text-emerald-300'
                            : 'bg-rose-950/60 border border-rose-800/80 text-rose-300'
                        }`}
                      >
                        {connectionStatus === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span>{statusMessage}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Вкладка OpenRouter */}
                {activeProviderTab === 'openrouter' && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs text-slate-300 font-medium flex items-center gap-1">
                          <Key className="w-3.5 h-3.5 text-primary" />
                          <span>OpenRouter API Key:</span>
                        </label>
                        <a
                          href="https://openrouter.ai/keys"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-primary hover:underline flex items-center gap-1"
                        >
                          <span>Получить API-ключ</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            type={showApiKey ? 'text' : 'password'}
                            value={apiKeyInput}
                            onChange={e => {
                              setApiKeyInput(e.target.value);
                              onUpdateOpenRouterApiKey(e.target.value.trim());
                            }}
                            placeholder="sk-or-v1-..."
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(prev => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white cursor-pointer"
                          >
                            {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        <Button
                          onClick={handleTestOpenRouter}
                          disabled={isOpenRouterLoading}
                          variant="neon"
                          className="shrink-0 gap-1.5"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isOpenRouterLoading ? 'animate-spin' : ''}`} />
                          <span>{isOpenRouterLoading ? 'Загрузка...' : 'Проверить'}</span>
                        </Button>
                      </div>
                    </div>

                    <div className="text-[11px] text-muted-foreground bg-slate-900/60 p-2.5 rounded-xl border border-border flex items-start gap-2">
                      <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        OpenRouter открывает доступ к DeepSeek R1, Claude 3.7, GPT-4o, Gemini 2.0 и бесплатным моделям (Free tier).
                      </span>
                    </div>

                    {openRouterStatus !== 'idle' && (
                      <div
                        className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                          openRouterStatus === 'success'
                            ? 'bg-emerald-950/60 border border-emerald-800/80 text-emerald-300'
                            : 'bg-rose-950/60 border border-rose-800/80 text-rose-300'
                        }`}
                      >
                        {openRouterStatus === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span>{openRouterStatusMsg}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'players' && (
            <div className="space-y-4">
              {renderPlayerSection(whiteConfig, onUpdateWhiteConfig, true)}
              {renderPlayerSection(blackConfig, onUpdateBlackConfig, false)}
            </div>
          )}

          {activeTab === 'currency' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span>Валюта отображения и Курс обмена</span>
                  </div>
                  <Badge variant="cyan" className="font-mono text-xs">
                    Базовый биллинг: USD ($)
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Выбор валюты */}
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-medium text-xs block">
                      Валюта для цен и истории:
                    </label>
                    <CurrencyCombobox
                      value={currencySettings.currency}
                      onChange={handleCurrencyChange}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      В этой валюте отображается стоимость ходов и баланс сессии.
                    </p>
                  </div>

                  {/* Курс к USD + Волшебная палочка */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <label className="text-slate-300 font-medium">
                        Курс к Доллару (1 USD =):
                      </label>
                      {currencySettings.lastUpdated && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          обновлен: {new Date(currencySettings.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input
                          type="number"
                          step="0.0001"
                          min="0.0001"
                          value={manualRateInput}
                          onChange={e => handleManualRateChange(e.target.value)}
                          disabled={currencySettings.currency === 'USD'}
                          className="bg-slate-900 font-mono pr-10 text-xs"
                          placeholder="92.50"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground font-mono pointer-events-none">
                          {CURRENCIES[currencySettings.currency]?.symbol || '$'}
                        </span>
                      </div>

                      <Button
                        type="button"
                        variant="neon"
                        onClick={handleFetchRate}
                        disabled={isFetchingRate || currencySettings.currency === 'USD'}
                        title="Запросить актуальный курс из открытого API (Open Exchange Rates / ExchangeRate-API)"
                        className="h-9 px-3 text-xs gap-1.5 shrink-0"
                      >
                        {isFetchingRate ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Wand2 className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden sm:inline">
                          {isFetchingRate ? 'Загрузка...' : 'Курс API'}
                        </span>
                      </Button>
                    </div>

                    <p className="text-[10px] text-muted-foreground">
                      Можно ввести вручную или нажать волшебную палочку 🪄 для запроса курса из сети.
                    </p>
                  </div>
                </div>

                {/* Сообщение о результате запроса курса */}
                {rateFetchMsg && (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                      rateFetchMsg.type === 'success'
                        ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300'
                        : 'bg-rose-950/40 border border-rose-800/60 text-rose-300'
                    }`}
                  >
                    {rateFetchMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{rateFetchMsg.text}</span>
                  </div>
                )}
              </div>

              {/* Интерактивный калькулятор и превью стоимости ходов */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-border space-y-3">
                <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Примерная стоимость ходов популярных моделей в {CURRENCIES[currencySettings.currency]?.name}:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-border flex items-center justify-between">
                    <div>
                      <div className="font-bold text-foreground">DeepSeek R1 (Reasoning)</div>
                      <div className="text-[10px] text-muted-foreground font-sans">~500 токенов рассуждений ($0.0011)</div>
                    </div>
                    <Badge variant="emerald" className="font-bold">
                      {formatCost(0.0011, currencySettings.currency, currencySettings.exchangeRate)}
                    </Badge>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-border flex items-center justify-between">
                    <div>
                      <div className="font-bold text-foreground">DeepSeek V3 (Chat)</div>
                      <div className="text-[10px] text-muted-foreground font-sans">~300 токенов ($0.000084)</div>
                    </div>
                    <Badge variant="emerald" className="font-bold">
                      {formatCost(0.000084, currencySettings.currency, currencySettings.exchangeRate)}
                    </Badge>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-border flex items-center justify-between">
                    <div>
                      <div className="font-bold text-foreground">Claude 3.7 Sonnet</div>
                      <div className="text-[10px] text-muted-foreground font-sans">~400 токенов CoT ($0.006)</div>
                    </div>
                    <Badge variant="emerald" className="font-bold">
                      {formatCost(0.006, currencySettings.currency, currencySettings.exchangeRate)}
                    </Badge>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-border flex items-center justify-between">
                    <div>
                      <div className="font-bold text-foreground">LM Studio (Локально)</div>
                      <div className="text-[10px] text-muted-foreground font-sans">На вашем железе</div>
                    </div>
                    <Badge variant="cyan" className="font-bold">
                      0.00 {CURRENCIES[currencySettings.currency]?.symbol} (Бесплатно)
                    </Badge>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/50 border border-border/60 text-[11px] text-muted-foreground flex items-start gap-2">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    Все расчеты внутри движка производятся строго в долларах США ($) по официальным тарифам OpenRouter и пересчитываются в выбранную валюту ({CURRENCIES[currencySettings.currency]?.symbol}) в реальном времени.
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tts' && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-border space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {ttsConfig.enabled ? (
                    <Volume2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <span className="text-foreground font-bold text-sm block">
                      Озвучка реплик (Web Speech TTS)
                    </span>
                    <span className="text-muted-foreground text-xs">
                      Гроссмейстеры зачитывают свои реплики и трэшток вслух
                    </span>
                  </div>
                </div>

                <Switch
                  checked={ttsConfig.enabled}
                  onCheckedChange={checked => onUpdateTtsConfig({ ...ttsConfig, enabled: checked })}
                />
              </div>

              {ttsConfig.enabled && (
                <div className="space-y-3.5 pt-3 border-t border-border text-xs">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-slate-300 font-medium">Системный голос:</label>
                      <Button
                        type="button"
                        variant="neon"
                        size="sm"
                        onClick={handleTestTts}
                        className="h-7 text-xs gap-1"
                      >
                        <Play className="w-3 h-3" />
                        <span>Тест голоса</span>
                      </Button>
                    </div>
                    <select
                      value={ttsConfig.voiceURI}
                      onChange={e => onUpdateTtsConfig({ ...ttsConfig, voiceURI: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl bg-slate-900 border border-border text-foreground text-xs focus:outline-none focus:border-primary"
                    >
                      <option value="">По умолчанию (системный голос браузера)</option>
                      {availableVoices.map(v => (
                        <option key={v.voiceURI} value={v.voiceURI}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Скорость речи:</span>
                        <span className="font-mono text-foreground font-bold">{ttsConfig.rate}x</span>
                      </div>
                      <Slider
                        min={0.5}
                        max={1.5}
                        step={0.1}
                        value={[ttsConfig.rate]}
                        onValueChange={vals => onUpdateTtsConfig({ ...ttsConfig, rate: vals[0] })}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Высота тона:</span>
                        <span className="font-mono text-foreground font-bold">{ttsConfig.pitch}</span>
                      </div>
                      <Slider
                        min={0.5}
                        max={1.5}
                        step={0.1}
                        value={[ttsConfig.pitch]}
                        onValueChange={vals => onUpdateTtsConfig({ ...ttsConfig, pitch: vals[0] })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'game' && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-border space-y-4 text-xs">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                <span>Параметры движка и партии</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-slate-300 font-medium">
                    <span>Пауза после хода (чтение мыслей):</span>
                    <span className="font-mono text-primary font-bold">
                      {postMoveDelaySec === 0 ? 'Без паузы' : `${postMoveDelaySec} сек`}
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={10}
                    step={1}
                    value={[postMoveDelaySec]}
                    onValueChange={vals => onUpdatePostMoveDelay(vals[0])}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Дает время прочитать мысли гроссмейстера перед следующим ходом.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium block">
                    Лимит попыток на исправление нелегального хода:
                  </label>
                  <select
                    value={maxRetries}
                    onChange={e => onUpdateMaxRetries(parseInt(e.target.value))}
                    className="w-full h-9 px-3 rounded-xl bg-slate-900 border border-border text-foreground text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="1">1 попытка (без повторов)</option>
                    <option value="2">2 попытки</option>
                    <option value="3">3 попытки (рекомендуется)</option>
                    <option value="5">5 попыток</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-border/80 bg-slate-950/60 shrink-0 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            ✓ Все настройки сохраняются автоматически в браузере
          </span>
          <Button onClick={onClose} variant="default" className="w-full sm:w-auto">
            Готово
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
