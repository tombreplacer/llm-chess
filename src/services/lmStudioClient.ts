import type { LlmProvider, LMStudioModel, OpenRouterModel, PieceColor } from '../types/chess';
import { Chess } from 'chess.js';

export interface StreamCallbacks {
  onThinkingChunk: (chunk: string, fullThinking: string) => void;
  onContentChunk: (chunk: string, fullContent: string) => void;
  onThinkingFinished: () => void;
  onStatusUpdate: (statusText: string) => void;
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

export interface StreamMoveOptions {
  provider?: LlmProvider;
  baseUrl?: string;
  apiKey?: string;
  modelId: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  callbacks: StreamCallbacks;
  abortSignal?: AbortSignal;
}

export const POPULAR_OPENROUTER_MODELS: OpenRouterModel[] = [
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (Deep Thinking)', description: 'Топовая reasoning-модель с глубоким расчетом ходов' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 (Chat)', description: 'Быстрая, мощная и экономичная модель' },
  { id: 'anthropic/claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', description: 'Флагман Anthropic с гибридным мышлением' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Выдающийся интеллект и гроссмейстерская точность' },
  { id: 'openai/gpt-4o', name: 'GPT-4o (OpenAI)', description: 'Флагманская мультимодальная модель OpenAI' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', description: 'Очень быстрая и дешевая модель для блица' },
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', description: 'Сверхбыстрая модель нового поколения от Google' },
  { id: 'google/gemini-2.0-pro-exp-02-05:free', name: 'Gemini 2.0 Pro (Free)', description: 'Экспериментальная мощная модель (бесплатно)' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct', description: 'Открытая модель мирового уровня' },
  { id: 'qwen/qwq-32b', name: 'QwQ 32B (Qwen Reasoning)', description: 'Специализированная модель для сложного анализа' },
  { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B Instruct', description: 'Мощнейшая модель от Alibaba Cloud' },
  { id: 'mistralai/mistral-large-2411', name: 'Mistral Large 2411', description: 'Флагманская европейская модель Mistral AI' },
  { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B (Free)', description: 'Легкая бесплатная модель для тестов' }
];

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
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://llm-chess-arena.local',
        'X-Title': 'LLM Chess Arena'
      };
      if (apiKey && apiKey.trim()) {
        headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      }

      const response = await fetch('https://openrouter.ai/api/v1/models', {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data && Array.isArray(data.data)) {
        return data.data.map((m: { id: string; name?: string; description?: string; context_length?: number; pricing?: { prompt?: string; completion?: string } }) => ({
          id: m.id,
          name: m.name || m.id,
          description: m.description || '',
          context_length: m.context_length,
          pricing: m.pricing
        }));
      }
      return POPULAR_OPENROUTER_MODELS;
    } catch (err: unknown) {
      console.warn('OpenRouter models fetch failed, using popular presets:', err);
      return POPULAR_OPENROUTER_MODELS;
    }
  }

  public async streamMove(
    options: StreamMoveOptions
  ): Promise<{ fullThinking: string; fullContent: string; rawResponse: string }> {
    const {
      provider = 'lmstudio',
      baseUrl = this.defaultBaseUrl,
      apiKey,
      modelId,
      systemPrompt,
      userPrompt,
      temperature = 0.5,
      maxTokens = 2048,
      callbacks,
      abortSignal
    } = options;

    const isLocal = provider === 'lmstudio';
    const cleanUrl = baseUrl.replace(/\/+$/, '');
    const endpoint = isLocal ? `${cleanUrl}/chat/completions` : 'https://openrouter.ai/api/v1/chat/completions';

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
      headers['HTTP-Referer'] = 'https://llm-chess-arena.local';
      headers['X-Title'] = 'LLM Chess Arena';
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const body = {
      model: modelId,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true
    };

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
              const choice = parsed.choices?.[0];
              if (!choice) continue;

              const delta = choice.delta || {};
              
              // 1. Нативный reasoning_content (DeepSeek R1 / Gemma QAT / QwQ)
              const reasoningChunk = delta.reasoning_content || delta.reasoning || '';
              if (reasoningChunk) {
                fullThinking += reasoningChunk;
                rawResponse += reasoningChunk;
                callbacks.onThinkingChunk(reasoningChunk, fullThinking);
                continue;
              }

              // 2. Обычный контент
              const contentChunk = delta.content || '';
              if (contentChunk) {
                rawResponse += contentChunk;
                let chunkText = contentChunk;

                // Проверяем начало <think> или <thought>
                if (!isInsideThinkTag && (chunkText.includes('<think>') || chunkText.includes('<thought>'))) {
                  isInsideThinkTag = true;
                  chunkText = chunkText.replace(/<think>|<thought>/g, '');
                }

                // Проверяем конец </think> или </thought>
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

    return { fullThinking, fullContent, rawResponse };
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
  ): Promise<{ fullThinking: string; fullContent: string; rawResponse: string }> {
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

    return {
      fullThinking,
      fullContent: finalContent,
      rawResponse: `<think>\n${fullThinking}\n</think>\n${finalContent}`
    };
  }
}

export const lmStudioService = new LMStudioClient();
