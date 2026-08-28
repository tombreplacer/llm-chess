import type { LlmProvider, LMStudioModel, OpenRouterModel, PieceColor } from '../types/chess';
import { Chess } from 'chess.js';

export interface TokenMetrics {
  totalTokens: number;
  tokensPerSecond: number;
  durationMs: number;
  costUsd?: number;
  promptTokens?: number;
  completionTokens?: number;
}

export interface StreamCallbacks {
  onThinkingChunk: (chunk: string, fullThinking: string) => void;
  onContentChunk: (chunk: string, fullContent: string) => void;
  onThinkingFinished: () => void;
  onStatusUpdate: (statusText: string) => void;
  onTokenMetrics?: (metrics: TokenMetrics) => void;
}

export interface MoveParseResult {
  rawMove: string;
  thoughtText: string;
  contentText: string;
  comment?: string;
  isLegal: boolean;
  legalMove?: string;
  reason?: string;
}

export interface StreamMoveResult {
  fullThinking: string;
  fullContent: string;
  rawResponse: string;
  tokenCount?: number;
  tokensPerSecond?: number;
  durationMs?: number;
  costUsd?: number;
  promptTokens?: number;
  completionTokens?: number;
}

export interface StreamMoveOptions {
  provider?: LlmProvider;
  baseUrl?: string;
  apiKey?: string;
  modelId: string;
  modelPricing?: { prompt?: string | number; completion?: string | number };
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  callbacks: StreamCallbacks;
  abortSignal?: AbortSignal;
}

export const DEFAULT_MODEL_PRICING: Record<string, { prompt: number; completion: number }> = {
  'deepseek/deepseek-v4-flash-latest': { prompt: 0.0000001, completion: 0.0000002 },
  'deepseek-v4-flash-latest': { prompt: 0.0000001, completion: 0.0000002 },
  'deepseek/deepseek-r1': { prompt: 0.00000055, completion: 0.00000219 },
  'deepseek/deepseek-chat': { prompt: 0.00000014, completion: 0.00000028 },
  'anthropic/claude-3.7-sonnet': { prompt: 0.000003, completion: 0.000015 },
  'anthropic/claude-3.5-sonnet': { prompt: 0.000003, completion: 0.000015 },
  'openai/gpt-4o': { prompt: 0.0000025, completion: 0.00001 },
  'openai/gpt-4o-mini': { prompt: 0.00000015, completion: 0.0000006 },
  'google/gemini-2.0-flash-001': { prompt: 0.0000001, completion: 0.0000004 },
  'google/gemini-2.0-pro-exp-02-05:free': { prompt: 0, completion: 0 },
  'meta-llama/llama-3.3-70b-instruct': { prompt: 0.00000012, completion: 0.0000003 },
  'qwen/qwq-32b': { prompt: 0.00000015, completion: 0.0000006 },
  'qwen/qwen-2.5-72b-instruct': { prompt: 0.00000035, completion: 0.0000004 },
  'mistralai/mistral-large-2411': { prompt: 0.000002, completion: 0.000006 },
  'meta-llama/llama-3.2-3b-instruct:free': { prompt: 0, completion: 0 }
};

export const POPULAR_OPENROUTER_MODELS: OpenRouterModel[] = [
  { id: 'deepseek/deepseek-v4-flash-latest', name: 'DeepSeek V4 Flash (Latest)', description: 'Новейшая сверхбыстрая модель DeepSeek V4 Flash', pricing: { prompt: '0.0000001', completion: '0.0000002' } },
  { id: 'deepseek-v4-flash-latest', name: 'DeepSeek V4 Flash Latest', description: 'Сверхбыстрая оптимизированная модель DeepSeek V4 Flash', pricing: { prompt: '0.0000001', completion: '0.0000002' } },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (Deep Thinking)', description: 'Топовая reasoning-модель с глубоким расчетом ходов', pricing: { prompt: '0.00000055', completion: '0.00000219' } },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 (Chat)', description: 'Быстрая, мощная и экономичная модель', pricing: { prompt: '0.00000014', completion: '0.00000028' } },
  { id: 'anthropic/claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', description: 'Флагман Anthropic с гибридным мышлением', pricing: { prompt: '0.000003', completion: '0.000015' } },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Выдающийся интеллект и гроссмейстерская точность', pricing: { prompt: '0.000003', completion: '0.000015' } },
  { id: 'openai/gpt-4o', name: 'GPT-4o (OpenAI)', description: 'Флагманская мультимодальная модель OpenAI', pricing: { prompt: '0.0000025', completion: '0.00001' } },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', description: 'Очень быстрая и дешевая модель для блица', pricing: { prompt: '0.00000015', completion: '0.0000006' } },
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', description: 'Сверхбыстрая модель нового поколения от Google', pricing: { prompt: '0.0000001', completion: '0.0000004' } },
  { id: 'google/gemini-2.0-pro-exp-02-05:free', name: 'Gemini 2.0 Pro (Free)', description: 'Экспериментальная мощная модель (бесплатно)', pricing: { prompt: '0', completion: '0' } },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct', description: 'Открытая модель мирового уровня', pricing: { prompt: '0.00000012', completion: '0.0000003' } },
  { id: 'qwen/qwq-32b', name: 'QwQ 32B (Qwen Reasoning)', description: 'Специализированная модель для сложного анализа', pricing: { prompt: '0.00000015', completion: '0.0000006' } },
  { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B Instruct', description: 'Мощнейшая модель от Alibaba Cloud', pricing: { prompt: '0.00000035', completion: '0.0000004' } },
  { id: 'mistralai/mistral-large-2411', name: 'Mistral Large 2411', description: 'Флагманская европейская модель Mistral AI', pricing: { prompt: '0.000002', completion: '0.000006' } },
  { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B (Free)', description: 'Легкая бесплатная модель для тестов', pricing: { prompt: '0', completion: '0' } }
];

export function getRefererUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.href || window.location.origin || 'http://localhost:5173/';
  }
  return 'http://localhost:5173/';
}

export class LMStudioClient {
  private defaultBaseUrl = 'http://localhost:1234/v1';

  public async fetchModels(baseUrl: string = this.defaultBaseUrl): Promise<LMStudioModel[]> {
    const cleanUrl = baseUrl.replace(/\/+$/, '');
    try {
      const response = await fetch(`${cleanUrl}/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`LM Studio fetchModels failed at ${cleanUrl}:`, msg);
      throw new Error(`Не удалось подключиться к LM Studio по адресу ${cleanUrl}. Убедитесь, что сервер запущен в LM Studio. (${msg})`);
    }
  }

  public async fetchOpenRouterModels(apiKey?: string): Promise<OpenRouterModel[]> {
    try {
      const headers: Record<string, string> = {};
      if (apiKey && apiKey.trim()) {
        headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      }

      const response = await fetch('https://openrouter.ai/api/v1/models', {
        method: 'GET',
        headers: Object.keys(headers).length > 0 ? headers : undefined
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data && Array.isArray(data.data)) {
        const fetchedList: OpenRouterModel[] = data.data.map((m: { id: string; name?: string; description?: string; context_length?: number; pricing?: { prompt?: string; completion?: string } }) => ({
          id: m.id,
          name: m.name || m.id,
          description: m.description || '',
          context_length: m.context_length,
          pricing: m.pricing
        }));

        // Объединяем с популярными пресетами, чтобы они были в начале списка
        const popularIds = new Set(POPULAR_OPENROUTER_MODELS.map(p => p.id));
        const customFetched = fetchedList.filter(m => !popularIds.has(m.id));
        return [...POPULAR_OPENROUTER_MODELS, ...customFetched];
      }
      return POPULAR_OPENROUTER_MODELS;
    } catch (err: unknown) {
      console.warn('OpenRouter models fetch failed, using popular presets:', err);
      return POPULAR_OPENROUTER_MODELS;
    }
  }

  public async streamMove(
    options: StreamMoveOptions
  ): Promise<StreamMoveResult> {
    const {
      provider = 'lmstudio',
      baseUrl = this.defaultBaseUrl,
      apiKey,
      modelId,
      modelPricing,
      systemPrompt,
      userPrompt,
      temperature = 0.6,
      maxTokens = -1,
      callbacks,
      abortSignal
    } = options;

    const isLocal = provider === 'lmstudio';
    const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
    const endpoint = isLocal ? `${cleanBaseUrl}/chat/completions` : 'https://openrouter.ai/api/v1/chat/completions';

    if (!isLocal && (!apiKey || !apiKey.trim())) {
      throw new Error('Для игры через OpenRouter укажите ваш API-ключ в окне Настроек (⚙️ -> вкладка OpenRouter).');
    }

    callbacks.onStatusUpdate(
      isLocal
        ? 'Отправка запроса в LM Studio...'
        : `Отправка запроса в OpenRouter (${modelId})...`
    );

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (!isLocal) {
      headers['Authorization'] = `Bearer ${apiKey?.trim() || ''}`;
      headers['HTTP-Referer'] = getRefererUrl();
      headers['X-Title'] = 'LLM Chess Arena';
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const body: Record<string, any> = {
      model: modelId,
      messages,
      temperature,
      stream: true,
      stream_options: { include_usage: true }
    };

    if (maxTokens && maxTokens > 0) {
      body.max_tokens = maxTokens;
    }

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: abortSignal
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Ошибка соединения с ${isLocal ? 'LM Studio' : 'OpenRouter'}: ${msg}`);
    }

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      let cleanErrMsg = errBody;
      try {
        const parsedErr = JSON.parse(errBody);
        if (parsedErr.error?.message) {
          cleanErrMsg = parsedErr.error.message;
        }
      } catch {}

      if (response.status === 401) {
        throw new Error('OpenRouter 401: Неверный или недействительный API-ключ. Проверьте ключ в Настройках ⚙️.');
      } else if (response.status === 402) {
        throw new Error(`OpenRouter 402: Недостаточно средств на балансе аккаунта для модели ${modelId}.`);
      } else if (response.status === 429) {
        throw new Error('OpenRouter 429: Превышен лимит запросов (Rate limit). Попробуйте снова через несколько секунд.');
      }

      throw new Error(`${isLocal ? 'LM Studio' : 'OpenRouter'} HTTP ${response.status}: ${response.statusText} — ${cleanErrMsg}`);
    }

    if (!response.body) {
      throw new Error(`Ответ сервера ${isLocal ? 'LM Studio' : 'OpenRouter'} не содержит потока данных (empty body).`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    let fullThinking = '';
    let fullContent = '';
    let rawResponse = '';
    let isInsideThinkTag = false;
    let thinkingFinishedEmitted = false;
    let buffer = '';

    const streamStartTime = Date.now();
    let tokenChunksCount = 0;
    let explicitPromptTokens: number | null = null;
    let explicitCompletionTokens: number | null = null;
    let explicitCostUsd: number | null = null;

    const estimatedPromptTokens = Math.max(150, Math.round((systemPrompt.length + userPrompt.length) / 3.2));
    
    const pricingFallback = DEFAULT_MODEL_PRICING[modelId] || { prompt: 0, completion: 0 };
    const pricePrompt = Number(modelPricing?.prompt ?? pricingFallback.prompt ?? 0);
    const priceCompletion = Number(modelPricing?.completion ?? pricingFallback.completion ?? 0);

    const calculateCurrentCost = (promptTok: number, compTok: number) => {
      if (isLocal) return 0;
      if (explicitCostUsd !== null) return explicitCostUsd;
      return (promptTok * pricePrompt) + (compTok * priceCompletion);
    };

    const emitTokenMetrics = () => {
      const durationMs = Date.now() - streamStartTime;
      const durationSec = durationMs / 1000;
      const currentPromptTokens = explicitPromptTokens ?? estimatedPromptTokens;
      const currentCompletionTokens =
        explicitCompletionTokens !== null
          ? explicitCompletionTokens
          : Math.max(tokenChunksCount, Math.round(rawResponse.length / 2.8));
      
      const speed = durationSec > 0.05 ? +(currentCompletionTokens / durationSec).toFixed(1) : 0;
      const currentCostUsd = calculateCurrentCost(currentPromptTokens, currentCompletionTokens);

      callbacks.onTokenMetrics?.({
        totalTokens: currentCompletionTokens,
        tokensPerSecond: speed,
        durationMs,
        costUsd: currentCostUsd,
        promptTokens: currentPromptTokens,
        completionTokens: currentCompletionTokens
      });
    };

    callbacks.onStatusUpdate('Генерация рассуждений...');

    try {
      while (true) {
        if (abortSignal?.aborted) {
          reader.cancel();
          throw new Error('Запрос отменен пользователем.');
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;
          if (trimmed === 'data: [DONE]') continue;

          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6);
            try {
              const parsed = JSON.parse(jsonStr);

              if (parsed.usage) {
                if (typeof parsed.usage.prompt_tokens === 'number') {
                  explicitPromptTokens = parsed.usage.prompt_tokens;
                }
                if (typeof parsed.usage.completion_tokens === 'number') {
                  explicitCompletionTokens = parsed.usage.completion_tokens;
                }
                if (typeof parsed.usage.cost === 'number') {
                  explicitCostUsd = parsed.usage.cost;
                }
                emitTokenMetrics();
              }

              const choice = parsed.choices?.[0];
              if (!choice) continue;

              const delta = choice.delta || {};
              
              const reasoningChunk = delta.reasoning_content || delta.reasoning || '';
              if (reasoningChunk) {
                fullThinking += reasoningChunk;
                rawResponse += reasoningChunk;
                tokenChunksCount++;
                callbacks.onThinkingChunk(reasoningChunk, fullThinking);
                emitTokenMetrics();
                continue;
              }

              const contentChunk = delta.content || '';
              if (contentChunk) {
                rawResponse += contentChunk;
                tokenChunksCount++;
                emitTokenMetrics();
                let chunkText = contentChunk;

                if (!isInsideThinkTag && (chunkText.includes('<think>') || chunkText.includes('<thought>'))) {
                  isInsideThinkTag = true;
                  chunkText = chunkText.replace(/<think>|<thought>/g, '');
                }

                if (isInsideThinkTag && (chunkText.includes('</think>') || chunkText.includes('</thought>'))) {
                  const parts = chunkText.split(/<\/think>|<\/thought>/);
                  const thinkPart = parts[0];
                  const afterThinkPart = parts.slice(1).join('');

                  fullThinking += thinkPart;
                  callbacks.onThinkingChunk(thinkPart, fullThinking);

                  isInsideThinkTag = false;
                  if (!thinkingFinishedEmitted) {
                    thinkingFinishedEmitted = true;
                    callbacks.onThinkingFinished();
                    callbacks.onStatusUpdate('Формирование реплики и финального хода...');
                  }

                  if (afterThinkPart) {
                    fullContent += afterThinkPart;
                    callbacks.onContentChunk(afterThinkPart, fullContent);
                  }
                  continue;
                }

                if (isInsideThinkTag) {
                  fullThinking += chunkText;
                  callbacks.onThinkingChunk(chunkText, fullThinking);
                } else {
                  if (!thinkingFinishedEmitted && fullThinking.length > 0) {
                    thinkingFinishedEmitted = true;
                    callbacks.onThinkingFinished();
                    callbacks.onStatusUpdate('Формирование реплики и финального хода...');
                  }
                  fullContent += chunkText;
                  callbacks.onContentChunk(chunkText, fullContent);
                }
              }
            } catch {
              // ignore json parse errors in stream
            }
          }
        }
      }
    } finally {
      if (!thinkingFinishedEmitted) {
        callbacks.onThinkingFinished();
      }
    }

    const finalDurationMs = Date.now() - streamStartTime;
    const finalPromptTokens = explicitPromptTokens ?? estimatedPromptTokens;
    const finalCompletionTokens =
      explicitCompletionTokens !== null
        ? explicitCompletionTokens
        : Math.max(tokenChunksCount, Math.round(rawResponse.length / 2.8));
    const finalSpeed = finalDurationMs > 50 ? +((finalCompletionTokens / (finalDurationMs / 1000)).toFixed(1)) : 0;
    const finalCostUsd = calculateCurrentCost(finalPromptTokens, finalCompletionTokens);

    return {
      fullThinking,
      fullContent,
      rawResponse,
      tokenCount: finalCompletionTokens,
      tokensPerSecond: finalSpeed,
      durationMs: finalDurationMs,
      costUsd: finalCostUsd,
      promptTokens: finalPromptTokens,
      completionTokens: finalCompletionTokens
    };
  }

  public parseAndValidateMove(
    chess: Chess,
    fullThinking: string,
    fullContent: string,
    rawResponse: string
  ): MoveParseResult {
    const textToSearch = `${fullContent}\n${rawResponse}\n${fullThinking}`;
    const legalVerbose = chess.moves({ verbose: true });
    const legalSan = chess.moves();
    const legalUci = legalVerbose.map(m => `${m.from}${m.to}${m.promotion || ''}`);

    let extractedMove = '';
    let extractedComment: string | undefined = undefined;

    // Извлечение реплики из тега <comment>...</comment>
    const commentMatch = textToSearch.match(/<comment>\s*([\s\S]*?)\s*<\/comment>/i);
    if (commentMatch && commentMatch[1]) {
      extractedComment = commentMatch[1].trim().replace(/^["'`]|["'`]$/g, '');
    }

    // Извлечение хода из тега <move>...</move>
    const moveTagMatch = textToSearch.match(/<move>\s*([^<\n\r]+?)\s*<\/move>/i);
    if (moveTagMatch && moveTagMatch[1]) {
      extractedMove = moveTagMatch[1].trim();
    }

    if (!extractedMove) {
      const jsonMatch = textToSearch.match(/"move"\s*:\s*"([^"\n\r]+)"/i);
      if (jsonMatch && jsonMatch[1]) {
        extractedMove = jsonMatch[1].trim();
      }
    }

    if (!extractedMove) {
      const lineMatch = textToSearch.match(/(?:MOVE|ХОД|Play|Move)\s*:\s*`?([a-zA-Z0-9+#=\-]{2,7})`?/i);
      if (lineMatch && lineMatch[1]) {
        extractedMove = lineMatch[1].trim();
      }
    }

    if (!extractedMove) {
      // Ищем среди отдельных слов контента, очищенного от тегов think и comment
      const cleanContent = fullContent
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/<comment>[\s\S]*?<\/comment>/gi, '');
      const words = cleanContent.replace(/[.,;!?"`()]/g, ' ').split(/\s+/).filter(Boolean);
      for (let i = words.length - 1; i >= 0; i--) {
        const w = words[i];
        if (legalSan.includes(w) || legalUci.includes(w.toLowerCase())) {
          extractedMove = w;
          break;
        }
      }
    }

    if (extractedMove) {
      const cleaned = extractedMove.replace(/[`*]/g, '').trim();

      if (legalSan.includes(cleaned)) {
        return {
          rawMove: extractedMove,
          thoughtText: fullThinking,
          contentText: fullContent,
          comment: extractedComment,
          isLegal: true,
          legalMove: cleaned
        };
      }

      const uciIdx = legalUci.indexOf(cleaned.toLowerCase());
      if (uciIdx !== -1) {
        return {
          rawMove: extractedMove,
          thoughtText: fullThinking,
          contentText: fullContent,
          comment: extractedComment,
          isLegal: true,
          legalMove: legalSan[uciIdx]
        };
      }

      try {
        const testChess = new Chess(chess.fen());
        const validMove = testChess.move(cleaned);
        if (validMove) {
          return {
            rawMove: extractedMove,
            thoughtText: fullThinking,
            contentText: fullContent,
            comment: extractedComment,
            isLegal: true,
            legalMove: validMove.san
          };
        }
      } catch {
        // illegal
      }

      return {
        rawMove: extractedMove,
        thoughtText: fullThinking,
        contentText: fullContent,
        comment: extractedComment,
        isLegal: false,
        reason: `Предложенный ход "${extractedMove}" не является легальным в текущей позиции!`
      };
    }

    return {
      rawMove: '',
      thoughtText: fullThinking,
      contentText: fullContent,
      comment: extractedComment,
      isLegal: false,
      reason: 'Модель не указала конкретный ход в формате <move>ХОД</move> или среди доступных легальных ходов.'
    };
  }

  public async simulateMockMove(
    chess: Chess,
    color: PieceColor,
    styleName: string,
    callbacks: StreamCallbacks,
    abortSignal?: AbortSignal
  ): Promise<StreamMoveResult> {
    const legalMoves = chess.moves({ verbose: true });
    if (legalMoves.length === 0) {
      throw new Error('Нет доступных легальных ходов (пат или мат).');
    }

    const captures = legalMoves.filter(m => m.captured);
    const checks = legalMoves.filter(m => {
      const c = new Chess(chess.fen());
      c.move(m);
      return c.inCheck();
    });

    let chosenMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    if (captures.length > 0 && Math.random() > 0.4) {
      chosenMove = captures[Math.floor(Math.random() * captures.length)];
    } else if (checks.length > 0 && Math.random() > 0.5) {
      chosenMove = checks[Math.floor(Math.random() * checks.length)];
    }

    const thoughtSteps = [
      `1. Оценка позиции: ${color === 'w' ? 'Белые' : 'Черные'} проводят глубокий тактический аудит доски в стиле «${styleName}».\n`,
      `2. Анализ угроз: Проверяем безопасность короля на ${color === 'w' ? 'e1' : 'e8'}, считаем форсированные взятия и шахи.\n`,
      `3. Поиск кандидатов: Рассматриваем ${legalMoves.slice(0, 3).map(m => m.san).join(', ')}...\n`,
      `4. Расчет вариантов: Ход ${chosenMove.san} (${chosenMove.from}->${chosenMove.to}) создает мощное давление, развивая фигуру и захватывая инициативу.\n`,
      `5. Решение: Форсируем развитие, играем ${chosenMove.san}!`
    ];

    let fullThinking = '';
    callbacks.onStatusUpdate('Генерация гроссмейстерских рассуждений...');

    for (const step of thoughtSteps) {
      if (abortSignal?.aborted) throw new Error('Симуляция прервана.');
      for (const char of step) {
        if (abortSignal?.aborted) throw new Error('Симуляция прервана.');
        fullThinking += char;
        callbacks.onThinkingChunk(char, fullThinking);
        await new Promise(r => setTimeout(r, 8));
      }
    }

    callbacks.onThinkingFinished();
    callbacks.onStatusUpdate('Формирование реплики...');

    const mockComment = styleName.includes('Николаич')
      ? 'Лошадью хожу, блядь! Держи штаны крепче!'
      : styleName.includes('Карпов')
      ? 'Позиция зажимается. Скоро кончится воздух.'
      : styleName.includes('Таль')
      ? 'В хаосе рождается красота! Защищайся!'
      : styleName.includes('Токсичный')
      ? 'Зевок века! Спасибо за подарок, чемпион.'
      : 'Ход сделан строго по теории.';

    const finalContent = `<comment>${mockComment}</comment>\n<move>${chosenMove.san}</move>`;
    callbacks.onContentChunk(finalContent, finalContent);

    const totalEstimatedTokens = Math.round((fullThinking.length + finalContent.length) / 3);
    const mockDurationMs = 1200;
    const mockSpeed = 42.0;

    callbacks.onTokenMetrics?.({
      totalTokens: totalEstimatedTokens,
      tokensPerSecond: mockSpeed,
      durationMs: mockDurationMs
    });

    return {
      fullThinking,
      fullContent: finalContent,
      rawResponse: `<think>\n${fullThinking}\n</think>\n${finalContent}`,
      tokenCount: totalEstimatedTokens,
      tokensPerSecond: mockSpeed,
      durationMs: mockDurationMs
    };
  }

  public async generateGameOverSpeech(options: {
    provider?: LlmProvider;
    baseUrl?: string;
    apiKey?: string;
    modelId: string;
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    abortSignal?: AbortSignal;
  }): Promise<string> {
    const {
      provider = 'lmstudio',
      baseUrl = this.defaultBaseUrl,
      apiKey,
      modelId,
      systemPrompt,
      userPrompt,
      temperature = 0.7,
      abortSignal
    } = options;

    const isLocal = provider === 'lmstudio';
    const endpoint = isLocal
      ? `${baseUrl.replace(/\/+$/, '')}/chat/completions`
      : 'https://openrouter.ai/api/v1/chat/completions';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (!isLocal) {
      if (!apiKey) {
        throw new Error('Для генерации речи через OpenRouter требуется API-ключ.');
      }
      headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      headers['HTTP-Referer'] = getRefererUrl();
      headers['X-Title'] = 'LLM Chess Arena';
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const body: Record<string, any> = {
      model: modelId,
      messages,
      temperature,
      max_tokens: 1024,
      stream: false
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: abortSignal
    });

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status}: ${err}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';

    // Очищаем от возможных <think> и тегов
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    content = content.replace(/<comment>([\s\S]*?)<\/comment>/gi, '$1').trim();
    content = content.replace(/<move>[\s\S]*?<\/move>/gi, '').trim();
    content = content.replace(/^["'«]|["'»]$/g, '').trim();

    return content;
  }
}

export const lmStudioService = new LMStudioClient();
