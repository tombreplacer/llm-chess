import React, { useState, useEffect } from 'react';
import type { GrandmasterStyle, LMStudioModel, OpenRouterModel, PlayerConfig, TtsConfig } from '../../types/chess';
import { GRANDMASTER_PRESETS } from '../../services/prompts';
import { lmStudioService } from '../../services/lmStudioClient';
import { speechService } from '../../services/speechService';
import { ModelCombobox } from '../ModelSelector/ModelCombobox';
import {
  Settings,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
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
  Zap
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
    bio: '30 лет опыта игры на лавочке во дворе под пиво. Не знаю теории, но конем хожу так, что мало не покажется.'
  },
  {
    name: 'Новичок в цейтноте',
    avatar: '🐣',
    bio: 'Быстро паникую, легко попадаюсь в связки и вилки, но искренне верю в победу и борюсь до конца.'
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
  maxRetries: number;
  onUpdateMaxRetries: (retries: number) => void;
  postMoveDelaySec: number;
  onUpdatePostMoveDelay: (delay: number) => void;
  availableModels: LMStudioModel[];
  onSetAvailableModels: (models: LMStudioModel[]) => void;
  ttsConfig: TtsConfig;
  onUpdateTtsConfig: (config: TtsConfig) => void;
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
  maxRetries,
  onUpdateMaxRetries,
  postMoveDelaySec,
  onUpdatePostMoveDelay,
  availableModels,
  onSetAvailableModels,
  ttsConfig,
  onUpdateTtsConfig
}) => {
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

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (isOpen) {
      const voices = speechService.getVoices();
      setAvailableVoices(voices);
      setUrlInput(lmStudioBaseUrl);
      setApiKeyInput(openRouterApiKey);
    }
  }, [isOpen, lmStudioBaseUrl, openRouterApiKey]);

  if (!isOpen) return null;

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

  const renderPlayerSection = (
    config: PlayerConfig,
    onUpdate: (c: PlayerConfig) => void,
    isWhite: boolean
  ) => {
    const isHuman = config.type === 'human';
    const isLocal = (config.provider || 'lmstudio') === 'lmstudio';

    return (
      <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full border shadow ${
                isWhite ? 'bg-slate-100 border-slate-300' : 'bg-slate-950 border-slate-700'
              }`}
            />
            <span className="font-bold text-white text-sm">
              {isWhite ? 'Игрок за Белых' : 'Игрок за Черных'}
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
            {isHuman ? (
              <User className="w-3.5 h-3.5 text-indigo-400" />
            ) : (
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>{isHuman ? 'Человек' : 'Нейросеть (LLM)'}</span>
          </span>
        </div>

        {isHuman ? (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-medium mb-1">
                  Ваше имя / Никнейм:
                </label>
                <input
                  type="text"
                  value={config.name || ''}
                  onChange={e => onUpdate({ ...config, name: e.target.value })}
                  placeholder="Например: Кожаный Мешок, Александр..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Аватар:
                </label>
                <div className="flex gap-1.5 items-center">
                  <input
                    type="text"
                    value={config.avatar || '👤'}
                    onChange={e => onUpdate({ ...config, avatar: e.target.value })}
                    className="w-10 text-center px-1.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-base focus:outline-none focus:border-cyan-500"
                  />
                  <div className="flex gap-1 flex-wrap">
                    {['👤', '🥊', '⚡', '🛡️', '🍺', '👑'].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => onUpdate({ ...config, avatar: emoji })}
                        className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs transition-all ${
                          (config.avatar || '👤') === emoji
                            ? 'bg-cyan-600/40 border-cyan-400 scale-110 shadow-sm text-sm'
                            : 'bg-slate-900 border-slate-700/80 hover:bg-slate-800'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-300 font-medium">
                  Характер и стиль игры (Bio для LLM):
                </label>
                <span className="text-[10px] text-cyan-400 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Учитывается нейросетью
                </span>
              </div>
              <textarea
                value={config.bio || ''}
                onChange={e => onUpdate({ ...config, bio: e.target.value })}
                rows={2}
                placeholder="Опишите свой стиль: например, агрессивный атакующий игрок, люблю тактику, часто зеваю в цейтноте..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs transition-colors resize-none"
              />
            </div>

            <div>
              <span className="block text-slate-400 text-[11px] mb-1.5 font-medium">
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
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-700/70 hover:border-cyan-500/50 text-[11px] text-slate-300 hover:text-white transition-all flex items-center gap-1 shadow-sm"
                  >
                    <span>{p.avatar}</span>
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            {/* Переключатель провайдера LM Studio / OpenRouter */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Провайдер нейросети:
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-700/80">
                <button
                  type="button"
                  onClick={() => {
                    const fallbackModel = availableModels[0]?.id || 'mock-ai';
                    onUpdate({
                      ...config,
                      provider: 'lmstudio',
                      modelId: config.modelId.includes('/') ? fallbackModel : config.modelId
                    });
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    isLocal
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>LM Studio (Локально)</span>
                </button>

                <button
                  type="button"
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
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    !isLocal
                      ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>OpenRouter (Облако)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Выбор модели с поиском и фильтрами */}
              <div>
                <label className="block text-slate-400 mb-1">
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
              <div>
                <label className="block text-slate-400 mb-1">Стиль гроссмейстера:</label>
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
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
                <div className="col-span-full">
                  <span className="block text-slate-400 text-[11px] mb-1">
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
                        className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono transition-all ${
                          config.modelId === m.id
                            ? 'bg-cyan-600/40 border-cyan-400 text-cyan-200 shadow-sm'
                            : 'bg-slate-900 border-slate-750 text-slate-400 hover:text-white hover:bg-slate-850'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Температура */}
              <div className="col-span-full">
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Температура рассуждений:</span>
                  <span className="font-mono text-white font-bold">{config.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.2"
                  step="0.05"
                  value={config.temperature}
                  onChange={e =>
                    onUpdate({ ...config, temperature: parseFloat(e.target.value) })
                  }
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Лимит токенов (Max Tokens) */}
              <div className="col-span-full">
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Лимит токенов генерации (Max Tokens):</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {config.maxTokens === -1 || config.maxTokens === 0 || !config.maxTokens
                      ? '♾️ Безлимит (Максимум модели)'
                      : `${config.maxTokens} токенов`}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-1">
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
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all ${
                          isSelected
                            ? 'bg-cyan-600/40 border-cyan-400 text-cyan-200 font-bold shadow-sm'
                            : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-white hover:bg-slate-850'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-500">
                  Для моделей с рассуждениями (DeepSeek R1, QwQ) рекомендуется 4K+ или Безлимит, чтобы мысли не обрезались на полуслове.
                </p>
              </div>

              {/* Кастомный промпт */}
              <div className="col-span-full">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-400">
                    Дополнительные инструкции для LLM (необязательно):
                  </label>
                </div>
                <textarea
                  value={config.systemPromptCustom || ''}
                  onChange={e => onUpdate({ ...config, systemPromptCustom: e.target.value })}
                  rows={2}
                  placeholder="Например: Стремись к атаке на короля, отвечай дерзко и с сарказмом..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs transition-colors resize-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        {/* Modal Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">Настройки Нейросетей и Игроков</h2>
              <p className="text-xs text-slate-400">LM Studio, OpenRouter, стили гроссмейстеров и TTS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="modal-body custom-scrollbar">
          {/* Секция выбора провайдера подключения: LM Studio или OpenRouter */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Подключение к AI-провайдерам</span>
              </div>
            </div>

            {/* Вкладки выбора LM Studio / OpenRouter */}
            <div className="flex gap-2 border-b border-slate-700/60 pb-3">
              <button
                type="button"
                onClick={() => setActiveProviderTab('lmstudio')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeProviderTab === 'lmstudio'
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950'
                    : 'bg-slate-900 border border-slate-700/80 text-slate-400 hover:text-white'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>LM Studio (Локально)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveProviderTab('openrouter')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeProviderTab === 'openrouter'
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-indigo-950'
                    : 'bg-slate-900 border border-slate-700/80 text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>OpenRouter (Облако / API)</span>
                <span className="px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 text-[9px] font-bold">
                  NEW
                </span>
              </button>
            </div>

            {/* Вкладка LM Studio */}
            {activeProviderTab === 'lmstudio' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder="http://localhost:1234/v1"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <button
                    onClick={handleTestLmStudio}
                    disabled={isLoadingModels}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-900/30"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingModels ? 'animate-spin' : ''}`} />
                    <span>{isLoadingModels ? 'Проверка...' : 'Обновить модели'}</span>
                  </button>
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
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-slate-300 font-medium flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-cyan-400" />
                      <span>OpenRouter API Key:</span>
                    </label>
                    <a
                      href="https://openrouter.ai/keys"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline underline-offset-2"
                    >
                      <span>Получить API-ключ</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKeyInput}
                        onChange={e => {
                          setApiKeyInput(e.target.value);
                          onUpdateOpenRouterApiKey(e.target.value.trim());
                        }}
                        placeholder="sk-or-v1-..."
                        className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(prev => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <button
                      onClick={handleTestOpenRouter}
                      disabled={isOpenRouterLoading}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:bg-slate-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-950/40"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isOpenRouterLoading ? 'animate-spin' : ''}`} />
                      <span>{isOpenRouterLoading ? 'Загрузка...' : 'Проверить и обновить'}</span>
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-start gap-2">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    OpenRouter открывает доступ к DeepSeek R1, Claude 3.7, GPT-4o, Gemini 2.0 и бесплатным моделям (Free tier). Ключ сохраняется в вашем браузере.
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

          {/* Игрок 1 (Белые) */}
          {renderPlayerSection(whiteConfig, onUpdateWhiteConfig, true)}

          {/* Игрок 2 (Черные) */}
          {renderPlayerSection(blackConfig, onUpdateBlackConfig, false)}

          {/* Секция: Озвучка реплик (TTS) */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {ttsConfig.enabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
                <div>
                  <span className="text-white font-semibold text-sm block">Озвучка реплик (Web Speech TTS)</span>
                  <span className="text-slate-400 text-xs">
                    Гроссмейстеры зачитывают свои реплики и трэшток вслух
                  </span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={ttsConfig.enabled}
                  onChange={e => onUpdateTtsConfig({ ...ttsConfig, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {ttsConfig.enabled && (
              <div className="space-y-3 pt-2 border-t border-slate-700/50 text-xs">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-300 font-medium">Системный голос:</label>
                    <button
                      type="button"
                      onClick={handleTestTts}
                      className="px-2.5 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 rounded-lg flex items-center gap-1 font-semibold transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      <span>Тест голоса</span>
                    </button>
                  </div>
                  <select
                    value={ttsConfig.voiceURI}
                    onChange={e => onUpdateTtsConfig({ ...ttsConfig, voiceURI: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  >
                    <option value="">По умолчанию (системный голос браузера)</option>
                    {availableVoices.map(v => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Скорость речи:</span>
                      <span className="font-mono text-white font-bold">{ttsConfig.rate}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.1"
                      value={ttsConfig.rate}
                      onChange={e =>
                        onUpdateTtsConfig({ ...ttsConfig, rate: parseFloat(e.target.value) })
                      }
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Высота тона:</span>
                      <span className="font-mono text-white font-bold">{ttsConfig.pitch}</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.1"
                      value={ttsConfig.pitch}
                      onChange={e =>
                        onUpdateTtsConfig({ ...ttsConfig, pitch: parseFloat(e.target.value) })
                      }
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Дополнительные параметры партии */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-4">
            <h3 className="font-bold text-white text-sm">Параметры партии и повторов</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span>Пауза после хода (изучение мыслей):</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {postMoveDelaySec === 0 ? 'Без паузы' : `${postMoveDelaySec} сек`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={postMoveDelaySec}
                  onChange={e => onUpdatePostMoveDelay(parseInt(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Дает время прочитать мысли гроссмейстера перед ответным ходом
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Лимит попыток на исправление нелегального хода:
                </label>
                <select
                  value={maxRetries}
                  onChange={e => onUpdateMaxRetries(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                >
                  <option value="1">1 попытка (без повторов)</option>
                  <option value="2">2 попытки</option>
                  <option value="3">3 попытки (рекомендуется)</option>
                  <option value="5">5 попыток</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <span className="text-[11px] text-slate-400">
            ✓ Все настройки сохраняются автоматически в браузере
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-cyan-900/40 cursor-pointer"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
