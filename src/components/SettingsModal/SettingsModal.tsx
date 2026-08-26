import React, { useState } from 'react';
import type { GrandmasterStyle, LMStudioModel, PlayerConfig } from '../../types/chess';
import { GRANDMASTER_PRESETS } from '../../services/prompts';
import { lmStudioService } from '../../services/lmStudioClient';
import { Settings, Server, RefreshCw, CheckCircle2, AlertCircle, X } from 'lucide-react';

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
  onSetAvailableModels
}) => {
  const [urlInput, setUrlInput] = useState(lmStudioBaseUrl);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

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
      const msg = err instanceof Error ? err.message : String(err);
      setConnectionStatus('error');
      setStatusMessage(msg);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const grandmasterKeys = Object.keys(GRANDMASTER_PRESETS) as GrandmasterStyle[];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg">Настройки LM Studio и Гроссмейстеров</h2>
              <p className="text-xs text-slate-400">Конфигурация нейросетей, промптов и параметров генерации</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
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

          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-100 shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                <h3 className="font-bold text-white text-sm">Белые (White Player)</h3>
              </div>
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => onUpdateWhiteConfig({ ...whiteConfig, type: 'human' })}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                    whiteConfig.type === 'human' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Человек
                </button>
                <button
                  onClick={() => onUpdateWhiteConfig({ ...whiteConfig, type: 'llm' })}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                    whiteConfig.type === 'llm' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Нейросеть (LLM)
                </button>
              </div>
            </div>

            {whiteConfig.type === 'llm' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Модель в LM Studio:</label>
                  <select
                    value={whiteConfig.modelId}
                    onChange={e => onUpdateWhiteConfig({ ...whiteConfig, modelId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="mock-ai">🎭 Mock AI (Встроенная демо-модель)</option>
                    {availableModels.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Гроссмейстерский стиль:</label>
                  <select
                    value={whiteConfig.style}
                    onChange={e =>
                      onUpdateWhiteConfig({ ...whiteConfig, style: e.target.value as GrandmasterStyle })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                  >
                    {grandmasterKeys.map(key => {
                      const p = GRANDMASTER_PRESETS[key];
                      return (
                        <option key={key} value={key}>
                          {p.avatar} {p.name} ({p.title.split('—')[0]})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="col-span-full">
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Температура рассуждений (Креативность/Точность):</span>
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

          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-950 border border-slate-600 shadow-[0_0_8px_rgba(0,0,0,0.8)]" />
                <h3 className="font-bold text-white text-sm">Черные (Black Player)</h3>
              </div>
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => onUpdateBlackConfig({ ...blackConfig, type: 'human' })}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                    blackConfig.type === 'human' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Человек
                </button>
                <button
                  onClick={() => onUpdateBlackConfig({ ...blackConfig, type: 'llm' })}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                    blackConfig.type === 'llm' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Нейросеть (LLM)
                </button>
              </div>
            </div>

            {blackConfig.type === 'llm' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Модель в LM Studio:</label>
                  <select
                    value={blackConfig.modelId}
                    onChange={e => onUpdateBlackConfig({ ...blackConfig, modelId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="mock-ai">🎭 Mock AI (Встроенная демо-модель)</option>
                    {availableModels.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Гроссмейстерский стиль:</label>
                  <select
                    value={blackConfig.style}
                    onChange={e =>
                      onUpdateBlackConfig({ ...blackConfig, style: e.target.value as GrandmasterStyle })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                  >
                    {grandmasterKeys.map(key => {
                      const p = GRANDMASTER_PRESETS[key];
                      return (
                        <option key={key} value={key}>
                          {p.avatar} {p.name} ({p.title.split('—')[0]})
                        </option>
                      );
                    })}
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

        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-cyan-900/40"
          >
            Сохранить и закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
