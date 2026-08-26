import React, { useState, useEffect } from 'react';
import type { GrandmasterStyle, LMStudioModel, PlayerConfig, TtsConfig } from '../../types/chess';
import { GRANDMASTER_PRESETS } from '../../services/prompts';
import { lmStudioService } from '../../services/lmStudioClient';
import { speechService } from '../../services/speechService';
import { Settings, Server, RefreshCw, CheckCircle2, AlertCircle, X, Volume2, VolumeX, Play } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lmStudioBaseUrl: string;
  onUpdateBaseUrl: (url: string) => void;
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
  const [urlInput, setUrlInput] = useState(lmStudioBaseUrl);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (isOpen) {
      const voices = speechService.getVoices();
      setAvailableVoices(voices);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsLoadingModels(true);
    setConnectionStatus('idle');
    setStatusMessage('Подключение к LM Studio...');

    try {
      const models = await lmStudioService.fetchModels(urlInput);
      onUpdateBaseUrl(urlInput);
      onSetAvailableModels(models);
      setConnectionStatus('success');
      setStatusMessage(`Успешно! Найдено моделей: ${models.length}`);

      if (models.length > 0) {
        if (!whiteConfig.modelId || whiteConfig.modelId === 'mock-ai') {
          onUpdateWhiteConfig({ ...whiteConfig, modelId: models[0].id });
        }
        if (!blackConfig.modelId || blackConfig.modelId === 'mock-ai') {
          onUpdateBlackConfig({ ...blackConfig, modelId: models[0].id });
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

  const handleTestTts = () => {
    speechService.speak(
      'Лошадью хожу, блядь, век воли не видать! Проверка связи.',
      ttsConfig,
      'nikolaich'
    );
  };

  return (
    <div 
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      className="modal-overlay"
    >
      <div className="modal-dialog">
        {/* Modal Header (Fixed top) */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">Настройки LM Studio и Гроссмейстеров</h2>
              <p className="text-xs text-slate-400">Конфигурация нейросетей, промптов, пауз и озвучки TTS</p>
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
          {/* Сервер LM Studio */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>Сервер LM Studio (Local OpenAI Endpoint)</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="http://localhost:1234/v1"
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <button
                onClick={handleTestConnection}
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

          {/* Игрок 1 (Белые) */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-100 border border-slate-300 shadow" />
                <span className="font-bold text-white text-sm">Игрок за Белых</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {whiteConfig.type === 'human' ? 'Человек' : 'Нейросеть (LLM)'}
              </span>
            </div>

            {whiteConfig.type === 'llm' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Модель LM Studio:</label>
                  <select
                    value={whiteConfig.modelId}
                    onChange={e => onUpdateWhiteConfig({ ...whiteConfig, modelId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  >
                    <option value="mock-ai">⚡ Встроенный Демо-ИИ (без сервера)</option>
                    {availableModels.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Стиль гроссмейстера:</label>
                  <select
                    value={whiteConfig.style}
                    onChange={e => {
                      const style = e.target.value as GrandmasterStyle;
                      const preset = GRANDMASTER_PRESETS[style];
                      onUpdateWhiteConfig({
                        ...whiteConfig,
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

                <div className="col-span-full">
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Температура рассуждений:</span>
                    <span className="font-mono text-white font-bold">{whiteConfig.temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.2"
                    step="0.05"
                    value={whiteConfig.temperature}
                    onChange={e =>
                      onUpdateWhiteConfig({ ...whiteConfig, temperature: parseFloat(e.target.value) })
                    }
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Игрок 2 (Черные) */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-950 border border-slate-700 shadow" />
                <span className="font-bold text-white text-sm">Игрок за Черных</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {blackConfig.type === 'human' ? 'Человек' : 'Нейросеть (LLM)'}
              </span>
            </div>

            {blackConfig.type === 'llm' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Модель LM Studio:</label>
                  <select
                    value={blackConfig.modelId}
                    onChange={e => onUpdateBlackConfig({ ...blackConfig, modelId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  >
                    <option value="mock-ai">⚡ Встроенный Демо-ИИ (без сервера)</option>
                    {availableModels.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Стиль гроссмейстера:</label>
                  <select
                    value={blackConfig.style}
                    onChange={e => {
                      const style = e.target.value as GrandmasterStyle;
                      const preset = GRANDMASTER_PRESETS[style];
                      onUpdateBlackConfig({
                        ...blackConfig,
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

                <div className="col-span-full">
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Температура рассуждений:</span>
                    <span className="font-mono text-white font-bold">{blackConfig.temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.2"
                    step="0.05"
                    value={blackConfig.temperature}
                    onChange={e =>
                      onUpdateBlackConfig({ ...blackConfig, temperature: parseFloat(e.target.value) })
                    }
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

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
                    <option value="">Автовыбор (Рекомендуемый русский/системный)</option>
                    {availableVoices.map(v => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Скорость (Rate):</span>
                      <span className="font-mono text-white font-bold">{ttsConfig.rate}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.05"
                      value={ttsConfig.rate}
                      onChange={e =>
                        onUpdateTtsConfig({ ...ttsConfig, rate: parseFloat(e.target.value) })
                      }
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Тон (Pitch):</span>
                      <span className="font-mono text-white font-bold">{ttsConfig.pitch}</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.05"
                      value={ttsConfig.pitch}
                      onChange={e =>
                        onUpdateTtsConfig({ ...ttsConfig, pitch: parseFloat(e.target.value) })
                      }
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Громкость:</span>
                      <span className="font-mono text-white font-bold">
                        {Math.round(ttsConfig.volume * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={ttsConfig.volume}
                      onChange={e =>
                        onUpdateTtsConfig({ ...ttsConfig, volume: parseFloat(e.target.value) })
                      }
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Пауза после хода */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between text-xs">
            <div>
              <span className="text-white font-semibold block">Пауза после хода LLM (для анализа мыслей):</span>
              <span className="text-slate-400">
                Время, в течение которого спойлер мыслей открыт перед передачей следующего хода
              </span>
            </div>
            <select
              value={postMoveDelaySec}
              onChange={e => onUpdatePostMoveDelay(parseFloat(e.target.value))}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
            >
              <option value="0">0 сек (Мгновенно)</option>
              <option value="1">1 сек</option>
              <option value="2">2 сек</option>
              <option value="3">3 сек (Рекомендуется)</option>
              <option value="5">5 сек</option>
              <option value="8">8 сек</option>
              <option value="10">10 сек</option>
              <option value="999">Без авто-перехода (Ручной клик)</option>
            </select>
          </div>

          {/* Лимит ретраев */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between text-xs">
            <div>
              <span className="text-white font-semibold block">Лимит повторных попыток (Retry Limit):</span>
              <span className="text-slate-400">
                Количество попыток исправления при галлюцинации нелегального хода
              </span>
            </div>
            <select
              value={maxRetries}
              onChange={e => onUpdateMaxRetries(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
            >
              <option value="1">1 попытка</option>
              <option value="2">2 попытки</option>
              <option value="3">3 попытки (рекомендуется)</option>
              <option value="5">5 попыток</option>
            </select>
          </div>
        </div>

        {/* Modal Footer (Sticky Bottom) */}
        <div className="modal-footer">
          <span className="text-[11px] text-slate-400">
            ✓ Все изменения сохраняются автоматически
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-cyan-900/40 cursor-pointer"
          >
            Сохранить и закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
