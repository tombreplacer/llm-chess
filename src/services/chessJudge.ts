import { ChessEngineService } from './chessEngine';
import { lmStudioService } from './lmStudioClient';
import type { StreamCallbacks } from './lmStudioClient';
import { buildSystemPrompt, buildUserMovePrompt, GRANDMASTER_PRESETS } from './prompts';
import type { MoveThought, PieceColor, PlayerConfig, RetryLog } from '../types/chess';
import { sounds } from './soundEffects';

export interface ExecuteMoveParams {
  chessEngine: ChessEngineService;
  color: PieceColor;
  playerConfig: PlayerConfig;
  opponentConfig?: PlayerConfig;
  lastOpponentComment?: string;
  lmStudioBaseUrl: string;
  openRouterApiKey?: string;
  maxRetries?: number;
  callbacks: StreamCallbacks;
  abortSignal?: AbortSignal;
}

export interface MoveExecutionResult {
  success: boolean;
  thought: MoveThought;
  error?: string;
}

export class ChessJudge {
  public async executeLlmTurn(params: ExecuteMoveParams): Promise<MoveExecutionResult> {
    const {
      chessEngine,
      color,
      playerConfig,
      opponentConfig,
      lastOpponentComment,
      lmStudioBaseUrl,
      openRouterApiKey,
      maxRetries = 3,
      callbacks,
      abortSignal
    } = params;

    const startTime = Date.now();
    const fenBefore = chessEngine.getFen();
    const moveNumber = chessEngine.getMoveNumber();
    const historyLength = chessEngine.getHistory().length;
    const turnNumber = Math.floor(historyLength / 2) + 1;

    const preset = GRANDMASTER_PRESETS[playerConfig.style] || GRANDMASTER_PRESETS.kasparov;
    const systemPrompt = buildSystemPrompt(playerConfig.style, playerConfig.systemPromptCustom, opponentConfig);

    const retries: RetryLog[] = [];
    let currentAttempt = 1;
    let lastErrorReason: string | undefined = undefined;

    let finalThinking = '';
    let finalContent = '';
    let chosenLegalMoveSan = '';
    let chosenComment: string | undefined = undefined;
    let rawMoveFound = '';

    while (currentAttempt <= maxRetries) {
      if (abortSignal?.aborted) {
        throw new Error('Ход прерван пользователем.');
      }

      callbacks.onStatusUpdate(
        currentAttempt === 1
          ? `Думает ${preset.name} (${color === 'w' ? 'Белые' : 'Черные'})...`
          : `⚠️ Попытка ${currentAttempt}/${maxRetries}: исправление нелегального хода...`
      );

      const userPrompt = buildUserMovePrompt(
        chessEngine.getChess(),
        color,
        lastErrorReason,
        opponentConfig,
        lastOpponentComment
      );

      let fullThinking = '';
      let fullContent = '';
      let rawResponse = '';

      try {
        if (playerConfig.modelId === 'mock-ai' || !playerConfig.modelId) {
          const result = await lmStudioService.simulateMockMove(
            chessEngine.getChess(),
            color,
            preset.name,
            callbacks,
            abortSignal
          );
          fullThinking = result.fullThinking;
          fullContent = result.fullContent;
          rawResponse = result.rawResponse;
        } else {
          const result = await lmStudioService.streamMove({
            provider: playerConfig.provider || 'lmstudio',
            baseUrl: lmStudioBaseUrl,
            apiKey: openRouterApiKey,
            modelId: playerConfig.modelId,
            systemPrompt,
            userPrompt,
            temperature: playerConfig.temperature,
            maxTokens: playerConfig.maxTokens,
            callbacks,
            abortSignal
          });
          fullThinking = result.fullThinking;
          fullContent = result.fullContent;
          rawResponse = result.rawResponse;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (abortSignal?.aborted) throw err;
        
        callbacks.onStatusUpdate(`Ошибка генерации: ${msg}`);
        retries.push({
          attempt: currentAttempt,
          rawResponse: '',
          errorReason: `Ошибка API: ${msg}`,
          timestamp: Date.now()
        });

        if (currentAttempt >= maxRetries) {
          throw new Error(`Превышено число попыток. Ошибка LM Studio: ${msg}`);
        }
        currentAttempt++;
        continue;
      }

      finalThinking = fullThinking;
      finalContent = fullContent;

      const parseResult = lmStudioService.parseAndValidateMove(
        chessEngine.getChess(),
        fullThinking,
        fullContent,
        rawResponse
      );

      if (parseResult.isLegal && parseResult.legalMove) {
        chosenLegalMoveSan = parseResult.legalMove;
        chosenComment = parseResult.comment;
        rawMoveFound = parseResult.rawMove;
        break;
      } else {
        sounds.playRetry();
        lastErrorReason = chessEngine.explainIllegalMove(parseResult.rawMove);
        
        retries.push({
          attempt: currentAttempt,
          rawResponse,
          errorReason: lastErrorReason,
          timestamp: Date.now()
        });

        callbacks.onStatusUpdate(`🚨 Нелегальный ход: "${parseResult.rawMove || 'не найден'}". Повтор запроса...`);
        
        currentAttempt++;
        if (currentAttempt <= maxRetries) {
          await new Promise(r => setTimeout(r, 600));
        }
      }
    }

    if (!chosenLegalMoveSan) {
      const fallbackMoves = chessEngine.getLegalMovesSan();
      if (fallbackMoves.length > 0) {
        chosenLegalMoveSan = fallbackMoves[0];
        rawMoveFound = chosenLegalMoveSan;
        lastErrorReason = `Модель превысила лимит попыток (${maxRetries}). Арбитр назначил вынужденный ход: ${chosenLegalMoveSan}`;
      } else {
        throw new Error('Нет доступных ходов на доске.');
      }
    }

    const moveResult = chessEngine.makeMove(chosenLegalMoveSan);
    if (!moveResult) {
      throw new Error(`Критическая ошибка: невозможно применить ход ${chosenLegalMoveSan}`);
    }

    if (moveResult.captured) {
      sounds.playCapture();
    } else {
      sounds.playMove();
    }

    if (chessEngine.isCheck()) {
      setTimeout(() => sounds.playCheck(), 100);
    }

    const durationMs = Date.now() - startTime;
    const fenAfter = chessEngine.getFen();

    const thought: MoveThought = {
      moveNumber,
      turnNumber,
      color,
      san: moveResult.san,
      uci: `${moveResult.from}${moveResult.to}${moveResult.promotion || ''}`,
      from: moveResult.from,
      to: moveResult.to,
      promotion: moveResult.promotion,
      fenBefore,
      fenAfter,
      thoughtText: finalThinking,
      comment: chosenComment,
      finalMoveRaw: rawMoveFound || finalContent,
      durationMs,
      retries,
      timestamp: Date.now(),
      captured: moveResult.captured
    };

    return {
      success: true,
      thought
    };
  }
}

export const chessJudge = new ChessJudge();
