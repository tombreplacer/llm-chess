import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';
import type { Square, PieceSymbol } from 'chess.js';
import confetti from 'canvas-confetti';
import type {
  ActiveThinkingState,
  GameEvaluation,
  GameMode,
  GameStatus,
  LMStudioModel,
  OpenRouterModel,
  MoveThought,
  PieceColor,
  PlayerConfig,
  TtsConfig
} from './types/chess';
import { ChessEngineService } from './services/chessEngine';
import { chessJudge } from './services/chessJudge';
import { lmStudioService, POPULAR_OPENROUTER_MODELS } from './services/lmStudioClient';
import { speechService } from './services/speechService';
import { GRANDMASTER_PRESETS } from './services/prompts';
import { sounds } from './services/soundEffects';

import { ChessBoard } from './components/ChessBoard/ChessBoard';
import { ThinkingSpoiler } from './components/Thinking/ThinkingSpoiler';
import { PlayerCard } from './components/PlayerCard/PlayerCard';
import { EvalBar } from './components/EvalBar/EvalBar';
import { MoveHistory } from './components/MoveHistory/MoveHistory';
import { GameControls } from './components/GameControls/GameControls';
import { SettingsModal } from './components/SettingsModal/SettingsModal';
import { GameOverModal } from './components/GameOverModal/GameOverModal';
import { HumanChatInput } from './components/HumanChat/HumanChatInput';
import { buildGameOverSpeechPrompt, getMockGameOverSpeech } from './services/prompts';
import type { PostGameSpeech } from './types/chess';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Swords, Trophy, Settings } from 'lucide-react';

interface SavedGameState {
  fen: string;
  pgn: string;
  moveThoughts: MoveThought[];
  lastMove: { from: Square; to: Square } | null;
  gameStatus: GameStatus;
  winnerColor: 'w' | 'b' | null;
  postGameSpeeches: PostGameSpeech[];
  humanComment: string;
  statusText: string;
}

export const App: React.FC = () => {
  const getSavedGame = (): SavedGameState | null => {
    try {
      const data = localStorage.getItem('llm_chess_arena_game_v1');
      if (data) return JSON.parse(data);
    } catch {}
    return null;
  };

  const getSavedSettings = () => {
    try {
      const data = localStorage.getItem('llm_chess_arena_settings_v1');
      if (data) return JSON.parse(data);
    } catch {}
    return null;
  };

  const initialGame = getSavedGame();
  const initialSettings = getSavedSettings();

  const initChessEngine = () => {
    const engine = new ChessEngineService();
    if (initialGame?.pgn) {
      try {
        engine.loadPgn(initialGame.pgn);
      } catch {}
    }
    if (initialGame?.fen && engine.getFen() !== initialGame.fen) {
      engine.reset(initialGame.fen);
    }
    return engine;
  };

  const engineRef = useRef<ChessEngineService>(initChessEngine());
  const [chessState, setChessState] = useState<Chess>(() => new Chess(engineRef.current.getFen()));
  const [fen, setFen] = useState<string>(() => engineRef.current.getFen());
  const [pgn, setPgn] = useState<string>(() => engineRef.current.getPgn());
  const [evaluation, setEvaluation] = useState<GameEvaluation>(() => engineRef.current.getEvaluation());
  const [gameStatus, setGameStatus] = useState<GameStatus>(() => initialGame?.gameStatus || 'playing');
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(() => initialGame?.lastMove || null);

  const [gameMode, setGameMode] = useState<GameMode>(() => initialSettings?.gameMode || 'human_vs_llm');
  const [boardOrientation, setBoardOrientation] = useState<PieceColor>(() => initialSettings?.boardOrientation || 'w');
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);

  const [lmStudioBaseUrl, setLmStudioBaseUrl] = useState<string>(() => initialSettings?.lmStudioBaseUrl || 'http://localhost:1234/v1');
  const [openRouterApiKey, setOpenRouterApiKey] = useState<string>(() => initialSettings?.openRouterApiKey || '');
  const [availableModels, setAvailableModels] = useState<LMStudioModel[]>([]);
  const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>(POPULAR_OPENROUTER_MODELS);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<'providers' | 'players' | 'tts' | 'game'>('providers');
  const [mobileTab, setMobileTab] = useState<'board' | 'thinking' | 'history'>('board');
  const [humanComment, setHumanComment] = useState<string>(() => initialGame?.humanComment || '');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState<boolean>(false);
  const [maxRetries, setMaxRetries] = useState<number>(() => initialSettings?.maxRetries ?? 3);
  const [postMoveDelaySec, setPostMoveDelaySec] = useState<number>(() => initialSettings?.postMoveDelaySec ?? 3);

  const handleOpenSettings = (tab: 'providers' | 'players' | 'tts' | 'game' = 'providers') => {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  };

  const [isInspectingPause, setIsInspectingPause] = useState<boolean>(false);
  const [inspectCountdown, setInspectCountdown] = useState<number | null>(null);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pauseIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSkipPause = useCallback(() => {
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    if (pauseIntervalRef.current) clearInterval(pauseIntervalRef.current);
    setIsInspectingPause(false);
    setInspectCountdown(null);
  }, []);

  const [whiteConfig, setWhiteConfig] = useState<PlayerConfig>(() => ({
    type: 'human',
    name: 'Кожаный Мешок',
    avatar: '🥊',
    bio: 'Человек с железной волей, решивший доказать превосходство биологического разума над кремнием.',
    provider: 'lmstudio',
    modelId: 'mock-ai',
    style: 'kasparov',
    temperature: 0.6,
    maxTokens: 2048,
    systemPromptCustom: '',
    ...(initialSettings?.whiteConfig || {})
  }));

  const [blackConfig, setBlackConfig] = useState<PlayerConfig>(() => ({
    type: 'llm',
    provider: 'lmstudio',
    name: 'Гарри Каспаров',
    avatar: '⚡',
    bio: '13-й чемпион мира по шахматам. Агрессивный, динамичный атакующий стиль.',
    modelId: 'mock-ai',
    style: 'kasparov',
    temperature: 0.6,
    maxTokens: 2048,
    systemPromptCustom: '',
    ...(initialSettings?.blackConfig || {})
  }));

  const [ttsConfig, setTtsConfig] = useState<TtsConfig>(() => ({
    enabled: true,
    voiceURI: '',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    ...(initialSettings?.ttsConfig || {})
  }));

  // Автосохранение всех настроек в localStorage
  useEffect(() => {
    try {
      const toSave = {
        gameMode,
        boardOrientation,
        lmStudioBaseUrl,
        openRouterApiKey,
        maxRetries,
        postMoveDelaySec,
        whiteConfig,
        blackConfig,
        ttsConfig
      };
      localStorage.setItem('llm_chess_arena_settings_v1', JSON.stringify(toSave));
    } catch {}
  }, [gameMode, boardOrientation, lmStudioBaseUrl, openRouterApiKey, maxRetries, postMoveDelaySec, whiteConfig, blackConfig, ttsConfig]);

  const [moveThoughts, setMoveThoughts] = useState<MoveThought[]>(() => initialGame?.moveThoughts || []);
  const [selectedMoveIndex, setSelectedMoveIndex] = useState<number | null>(null);

  const [activeThinking, setActiveThinking] = useState<ActiveThinkingState>({
    color: 'w',
    thoughtStream: '',
    contentStream: '',
    tokenCount: 0,
    tokensPerSecond: 0,
    isThinking: false,
    isStreaming: false,
    startTime: 0,
    currentAttempt: 1
  });
  const [statusText, setStatusText] = useState<string>(
    () => initialGame?.statusText || (initialGame?.moveThoughts?.length ? 'Партия восстановлена из памяти' : 'Ожидание первого хода...')
  );

  const abortControllerRef = useRef<AbortController | null>(null);
  const autoPlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [postGameSpeeches, setPostGameSpeeches] = useState<PostGameSpeech[]>(() => initialGame?.postGameSpeeches || []);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);
  const [isGeneratingGameOverSpeech, setIsGeneratingGameOverSpeech] = useState<boolean>(false);
  const [winnerColor, setWinnerColor] = useState<'w' | 'b' | null>(() => initialGame?.winnerColor || null);
  const hasTriggeredSpeechRef = useRef<boolean>(Boolean(initialGame?.postGameSpeeches?.length));

  // Автосохранение всего состояния партии в localStorage
  useEffect(() => {
    try {
      if (moveThoughts.length > 0 || fen !== 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
        const gameState: SavedGameState = {
          fen,
          pgn,
          moveThoughts,
          lastMove,
          gameStatus,
          winnerColor,
          postGameSpeeches,
          humanComment,
          statusText
        };
        localStorage.setItem('llm_chess_arena_game_v1', JSON.stringify(gameState));
      }
    } catch (err) {
      console.error('Ошибка автосохранения игры:', err);
    }
  }, [fen, pgn, moveThoughts, lastMove, gameStatus, winnerColor, postGameSpeeches, humanComment, statusText]);

  // Сохранение при закрытии/перезагрузке (F5 / beforeunload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        const engine = engineRef.current;
        const currentFen = engine.getFen();
        if (moveThoughts.length > 0 || currentFen !== 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
          const gameState: SavedGameState = {
            fen: currentFen,
            pgn: engine.getPgn(),
            moveThoughts,
            lastMove,
            gameStatus,
            winnerColor,
            postGameSpeeches,
            humanComment,
            statusText
          };
          localStorage.setItem('llm_chess_arena_game_v1', JSON.stringify(gameState));
        }
      } catch {}
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [moveThoughts, lastMove, gameStatus, winnerColor, postGameSpeeches, humanComment, statusText]);

  const triggerGameOverSpeeches = useCallback(
    async (status: GameStatus) => {
      if (hasTriggeredSpeechRef.current) return;
      hasTriggeredSpeechRef.current = true;

      const engine = engineRef.current;
      const isCheckmate = status === 'checkmate';
      const isDraw = !isCheckmate && engine.isGameOver();

      let winner: 'w' | 'b' | null = null;
      if (isCheckmate) {
        winner = engine.getTurn() === 'w' ? 'b' : 'w';
        setWinnerColor(winner);
      } else {
        setWinnerColor(null);
      }

      const participants: {
        color: PieceColor;
        config: PlayerConfig;
        oppConfig: PlayerConfig;
        outcome: 'win' | 'loss' | 'draw';
      }[] = [];

      if (whiteConfig.type === 'llm') {
        const outcome = isDraw ? 'draw' : winner === 'w' ? 'win' : 'loss';
        participants.push({ color: 'w', config: whiteConfig, oppConfig: blackConfig, outcome });
      }

      if (blackConfig.type === 'llm') {
        const outcome = isDraw ? 'draw' : winner === 'b' ? 'win' : 'loss';
        participants.push({ color: 'b', config: blackConfig, oppConfig: whiteConfig, outcome });
      }

      if (participants.length === 0) return;

      setIsGameOverModalOpen(true);
      setIsGeneratingGameOverSpeech(true);
      setPostGameSpeeches([]);

      const reasonText = isCheckmate
        ? 'Шах и мат'
        : status === 'stalemate'
        ? 'Пат'
        : status === 'draw_50_moves'
        ? 'Правило 50 ходов'
        : status === 'draw_repetition'
        ? 'Троекратное повторение'
        : status === 'draw_insufficient_material'
        ? 'Недостаточно материала для мата'
        : 'Ничья';

      for (const p of participants) {
        const preset = GRANDMASTER_PRESETS[p.config.style] || GRANDMASTER_PRESETS.kasparov;
        const oppPreset = GRANDMASTER_PRESETS[p.oppConfig.style];
        const oppName =
          p.oppConfig.type === 'human'
            ? p.oppConfig.name || 'Человек'
            : oppPreset?.name || p.oppConfig.name;

        let speechText = '';

        if (p.config.modelId === 'mock-ai' || !p.config.modelId) {
          speechText = getMockGameOverSpeech(p.config.style, p.outcome, oppName);
        } else {
          try {
            const { systemPrompt, userPrompt } = buildGameOverSpeechPrompt(
              p.config,
              p.oppConfig,
              p.outcome,
              engine.getPgn(),
              reasonText
            );

            speechText = await lmStudioService.generateGameOverSpeech({
              provider: p.config.provider || 'lmstudio',
              baseUrl: lmStudioBaseUrl,
              apiKey: openRouterApiKey,
              modelId: p.config.modelId,
              systemPrompt,
              userPrompt,
              temperature: 0.85
            });

            if (!speechText) {
              speechText = getMockGameOverSpeech(p.config.style, p.outcome, oppName);
            }
          } catch (err) {
            console.warn('Ошибка генерации финальной речи через API, используется fallback:', err);
            speechText = getMockGameOverSpeech(p.config.style, p.outcome, oppName);
          }
        }

        const speechObj: PostGameSpeech = {
          speakerName: preset.name,
          avatar: preset.avatar,
          color: p.color,
          outcome: p.outcome,
          style: p.config.style,
          speechText,
          timestamp: Date.now()
        };

        setPostGameSpeeches(prev => [...prev, speechObj]);
        speechService.speak(speechText, ttsConfig, p.config.style);
      }

      setIsGeneratingGameOverSpeech(false);
    },
    [whiteConfig, blackConfig, lmStudioBaseUrl, openRouterApiKey, ttsConfig]
  );

  const syncGameState = useCallback(() => {
    const engine = engineRef.current;
    const newChess = new Chess(engine.getFen());
    setChessState(newChess);
    setFen(engine.getFen());
    setPgn(engine.getPgn());
    setEvaluation(engine.getEvaluation());

    const status = engine.getGameStatus();
    setGameStatus(status);

    if (engine.isGameOver()) {
      if (status === 'checkmate') {
        sounds.playVictory();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }
      setTimeout(() => {
        triggerGameOverSpeeches(status);
      }, 600);
    }
  }, [triggerGameOverSpeeches]);

  useEffect(() => {
    lmStudioService
      .fetchModels(lmStudioBaseUrl)
      .then(models => {
        if (models && models.length > 0) {
          setAvailableModels(models);
          setBlackConfig(prev => (prev.modelId === 'mock-ai' && prev.provider !== 'openrouter' ? { ...prev, modelId: models[0].id } : prev));
        }
      })
      .catch(() => {
        console.log('LM Studio не обнаружен, используется встроенный демо-режим.');
      });
  }, [lmStudioBaseUrl]);

  useEffect(() => {
    if (openRouterApiKey) {
      lmStudioService
        .fetchOpenRouterModels(openRouterApiKey)
        .then(models => {
          if (models && models.length > 0) {
            setOpenRouterModels(models);
          }
        })
        .catch(console.error);
    }
  }, [openRouterApiKey]);

  const triggerLlmMove = useCallback(
    async (turnColor: PieceColor) => {
      const engine = engineRef.current;
      if (engine.isGameOver()) return;

      const playerConfig = turnColor === 'w' ? whiteConfig : blackConfig;
      const opponentConfig = turnColor === 'w' ? blackConfig : whiteConfig;
      if (playerConfig.type !== 'llm') return;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setActiveThinking({
        color: turnColor,
        thoughtStream: '',
        contentStream: '',
        tokenCount: 0,
        tokensPerSecond: 0,
        isThinking: true,
        isStreaming: true,
        startTime: Date.now(),
        currentAttempt: 1
      });

      const lastOpponentThought = [...moveThoughts].reverse().find(t => t.color !== turnColor && t.comment);
      const lastOpponentComment = lastOpponentThought?.comment;

      try {
        const result = await chessJudge.executeLlmTurn({
          chessEngine: engine,
          color: turnColor,
          playerConfig,
          opponentConfig,
          lastOpponentComment,
          lmStudioBaseUrl,
          openRouterApiKey,
          maxRetries,
          callbacks: {
            onThinkingChunk: (_chunk, fullThinking) => {
              setActiveThinking(prev => ({
                ...prev,
                thoughtStream: fullThinking,
                isThinking: true
              }));
            },
            onContentChunk: (_chunk, fullContent) => {
              setActiveThinking(prev => ({
                ...prev,
                contentStream: fullContent
              }));
            },
            onTokenMetrics: ({ totalTokens, tokensPerSecond }) => {
              setActiveThinking(prev => ({
                ...prev,
                tokenCount: totalTokens,
                tokensPerSecond
              }));
            },
            onThinkingFinished: () => {
              setActiveThinking(prev => ({
                ...prev,
                isThinking: false
              }));
            },
            onStatusUpdate: text => {
              setStatusText(text);
            }
          },
          abortSignal: abortControllerRef.current.signal
        });

        if (result.success && result.thought) {
          const nextThoughts = [...moveThoughts, result.thought];
          const nextLastMove = { from: result.thought.from, to: result.thought.to };
          setMoveThoughts(nextThoughts);
          setLastMove(nextLastMove);

          // Мгновенная синхронная запись в localStorage
          try {
            const gameState: SavedGameState = {
              fen: engine.getFen(),
              pgn: engine.getPgn(),
              moveThoughts: nextThoughts,
              lastMove: nextLastMove,
              gameStatus: engine.getGameStatus(),
              winnerColor,
              postGameSpeeches,
              humanComment,
              statusText: `Ход ${result.thought.san} (${playerConfig.name})`
            };
            localStorage.setItem('llm_chess_arena_game_v1', JSON.stringify(gameState));
          } catch (err) {
            console.error('Ошибка сохранения хода LLM:', err);
          }

          syncGameState();

          if (result.thought.comment) {
            speechService.speak(result.thought.comment, ttsConfig, playerConfig.style);
          }

          setActiveThinking(prev => ({
            ...prev,
            isStreaming: false,
            isThinking: false
          }));

          if (postMoveDelaySec > 0 && !engine.isGameOver()) {
            setIsInspectingPause(true);
            setInspectCountdown(postMoveDelaySec);

            const startTime = Date.now();
            const durationMs = postMoveDelaySec * 1000;

            if (pauseIntervalRef.current) clearInterval(pauseIntervalRef.current);
            pauseIntervalRef.current = setInterval(() => {
              const elapsed = Date.now() - startTime;
              const remaining = Math.max(0, (durationMs - elapsed) / 1000);
              setInspectCountdown(remaining);
              if (remaining <= 0) {
                if (pauseIntervalRef.current) clearInterval(pauseIntervalRef.current);
              }
            }, 100);

            if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
            pauseTimerRef.current = setTimeout(() => {
              if (pauseIntervalRef.current) clearInterval(pauseIntervalRef.current);
              setIsInspectingPause(false);
              setInspectCountdown(null);
            }, durationMs);
          }
        } else {
          setActiveThinking(prev => ({
            ...prev,
            isStreaming: false,
            isThinking: false
          }));
          setStatusText(`Ошибка: ${result.error || 'Не удалось получить ход'}`);
        }
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') {
          console.log('Ход LLM был отменен.');
        } else {
          console.error('Ошибка выполнения хода LLM:', err);
          setStatusText('Критическая ошибка хода.');
        }
        setActiveThinking(prev => ({
          ...prev,
          isStreaming: false,
          isThinking: false
        }));
      }
    },
    [whiteConfig, blackConfig, moveThoughts, lmStudioBaseUrl, openRouterApiKey, maxRetries, ttsConfig, syncGameState, postMoveDelaySec, winnerColor, postGameSpeeches, humanComment]
  );

  const handleHumanMove = useCallback(
    (move: { from: Square; to: Square; promotion?: PieceSymbol }) => {
      const engine = engineRef.current;
      const turnColor = engine.getTurn();
      const fenBefore = engine.getFen();

      const madeMove = engine.makeMove({ from: move.from, to: move.to, promotion: move.promotion });
      if (!madeMove) return;

      sounds.playMove();

      const newHistory = engine.getHistory();
      const lastSan = newHistory[newHistory.length - 1];
      const fenAfter = engine.getFen();
      const uci = `${move.from}${move.to}${move.promotion || ''}`;

      const currentTurnNumber = Math.floor((newHistory.length - 1) / 2) + 1;

      const humanThought: MoveThought = {
        moveNumber: currentTurnNumber,
        turnNumber: currentTurnNumber,
        color: turnColor,
        san: lastSan,
        uci,
        from: move.from,
        to: move.to,
        promotion: move.promotion,
        fenBefore,
        fenAfter,
        thoughtText: humanComment.trim() ? `Реплика человека: «${humanComment.trim()}»` : 'Ход сделан человеком на доске.',
        finalMoveRaw: lastSan,
        comment: humanComment.trim() || undefined,
        durationMs: 0,
        tokenCount: 0,
        timestamp: Date.now(),
        retries: []
      };

      const nextThoughts = [...moveThoughts, humanThought];
      const nextLastMove = { from: move.from, to: move.to };
      setMoveThoughts(nextThoughts);
      setLastMove(nextLastMove);
      setHumanComment('');

      // Мгновенная синхронная запись в localStorage
      try {
        const gameState: SavedGameState = {
          fen: fenAfter,
          pgn: engine.getPgn(),
          moveThoughts: nextThoughts,
          lastMove: nextLastMove,
          gameStatus: engine.getGameStatus(),
          winnerColor: null,
          postGameSpeeches,
          humanComment: '',
          statusText: `Ход ${lastSan} сделан человеком.`
        };
        localStorage.setItem('llm_chess_arena_game_v1', JSON.stringify(gameState));
      } catch (err) {
        console.error('Ошибка сохранения:', err);
      }

      syncGameState();
    },
    [humanComment, moveThoughts, postGameSpeeches, syncGameState]
  );

  useEffect(() => {
    if (isInspectingPause) return;
    const engine = engineRef.current;
    if (engine.isGameOver()) return;

    const currentTurn = engine.getTurn();
    const currentConfig = currentTurn === 'w' ? whiteConfig : blackConfig;

    if (currentConfig.type === 'llm') {
      if (gameMode === 'llm_vs_llm') {
        if (isAutoPlaying) {
          autoPlayTimeoutRef.current = setTimeout(() => {
            triggerLlmMove(currentTurn);
          }, 300);
        }
      } else {
        autoPlayTimeoutRef.current = setTimeout(() => {
          triggerLlmMove(currentTurn);
        }, 200);
      }
    }

    return () => {
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current);
      }
    };
  }, [chessState, gameMode, isAutoPlaying, whiteConfig, blackConfig, isInspectingPause, triggerLlmMove]);

  const handleModeChange = (mode: GameMode) => {
    setGameMode(mode);
    if (mode === 'llm_vs_llm') {
      setWhiteConfig(prev => ({
        ...prev,
        type: 'llm',
        style: 'tal',
        name: GRANDMASTER_PRESETS.tal.name,
        avatar: GRANDMASTER_PRESETS.tal.avatar
      }));
    } else {
      setWhiteConfig(prev => ({
        ...prev,
        type: 'human',
        name: 'Кожаный Мешок',
        avatar: '🥊'
      }));
      setIsAutoPlaying(false);
    }
  };

  const handleResetGame = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (autoPlayTimeoutRef.current) {
      clearTimeout(autoPlayTimeoutRef.current);
    }
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    if (pauseIntervalRef.current) clearInterval(pauseIntervalRef.current);
    speechService.stop();

    try {
      localStorage.removeItem('llm_chess_arena_game_v1');
    } catch {}

    hasTriggeredSpeechRef.current = false;
    engineRef.current.reset();
    setLastMove(null);
    setMoveThoughts([]);
    setSelectedMoveIndex(null);
    setIsAutoPlaying(false);
    setIsInspectingPause(false);
    setInspectCountdown(null);
    setPostGameSpeeches([]);
    setIsGameOverModalOpen(false);
    setIsGeneratingGameOverSpeech(false);
    setWinnerColor(null);
    setActiveThinking({
      color: 'w',
      thoughtStream: '',
      contentStream: '',
      tokenCount: 0,
      tokensPerSecond: 0,
      isThinking: false,
      isStreaming: false,
      startTime: 0,
      currentAttempt: 1
    });
    setStatusText('Новая партия начата.');
    syncGameState();
  };

  const handleFlipBoard = () => {
    setBoardOrientation(prev => (prev === 'w' ? 'b' : 'w'));
  };

  const handleRetryCurrentLlmTurn = () => {
    if (activeThinking.isStreaming) return;
    const engine = engineRef.current;
    if (engine.isGameOver()) return;

    const currentTurn = engine.getTurn();
    const currentConfig = currentTurn === 'w' ? whiteConfig : blackConfig;

    if (currentConfig.type === 'llm') {
      triggerLlmMove(currentTurn);
    } else {
      if (moveThoughts.length > 0) {
        engine.getChess().undo();
        const updatedHistory = moveThoughts.slice(0, -1);
        setMoveThoughts(updatedHistory);
        const lastRemaining = updatedHistory[updatedHistory.length - 1];
        setLastMove(lastRemaining ? { from: lastRemaining.from, to: lastRemaining.to } : null);
        syncGameState();

        const prevTurn = engine.getTurn();
        setTimeout(() => {
          triggerLlmMove(prevTurn);
        }, 150);
      }
    }
  };

  const displayedSavedThought =
    selectedMoveIndex !== null && moveThoughts[selectedMoveIndex] ? moveThoughts[selectedMoveIndex] : null;

  const currentTurn = chessState.turn() as PieceColor;
  const isGameOver = chessState.isGameOver();
  const isHumanTurn =
    (currentTurn === 'w' && whiteConfig.type === 'human') || (currentTurn === 'b' && blackConfig.type === 'human');

  const totalWhiteErrors = moveThoughts
    .filter(t => t.color === 'w')
    .reduce((sum, t) => sum + (t.retries?.length || 0), 0);

  const totalBlackErrors = moveThoughts
    .filter(t => t.color === 'b')
    .reduce((sum, t) => sum + (t.retries?.length || 0), 0);

  const activePreset =
    activeThinking.color === 'w'
      ? GRANDMASTER_PRESETS[whiteConfig.style] || GRANDMASTER_PRESETS.kasparov
      : GRANDMASTER_PRESETS[blackConfig.style] || GRANDMASTER_PRESETS.kasparov;

  // Динамическое определение активных провайдеров нейросетей
  const activeLlmPlayers = [
    whiteConfig.type === 'llm' ? { color: 'w' as PieceColor, config: whiteConfig } : null,
    blackConfig.type === 'llm' ? { color: 'b' as PieceColor, config: blackConfig } : null
  ].filter(Boolean) as { color: PieceColor; config: PlayerConfig }[];

  const usesOpenRouter = activeLlmPlayers.some(p => p.config.provider === 'openrouter');
  const usesLmStudio = activeLlmPlayers.some(p => p.config.provider === 'lmstudio' || !p.config.provider);

  const getActiveModelDisplay = () => {
    if (activeLlmPlayers.length === 0) return 'Human vs Human';
    if (usesOpenRouter && usesLmStudio) return 'LM Studio + OpenRouter';
    if (usesOpenRouter) {
      const openRouterPlayer = activeLlmPlayers.find(p => p.config.provider === 'openrouter');
      const modelId = openRouterPlayer?.config.modelId || '';
      const shortName = modelId.includes('/') ? modelId.split('/').pop() : modelId;
      return shortName || (openRouterApiKey ? `${openRouterModels.length} мод.` : 'Без ключа');
    }
    return availableModels.length > 0 ? `${availableModels.length} мод.` : 'Demo';
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-full overflow-hidden p-1.5 sm:p-2.5 gap-1.5 sm:gap-2 select-none">
      {/* Верхний Header */}
      <header className="flex items-center justify-between px-3 sm:px-4 py-1.5 bg-slate-900/90 border border-border/80 rounded-2xl shadow-xl backdrop-blur-xl h-11 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="p-1.5 rounded-xl bg-gradient-to-br from-primary to-indigo-600 shadow-md shadow-primary/20 text-white shrink-0">
            <Swords className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xs sm:text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-primary bg-clip-text text-transparent truncate">
              LLM Chess Arena
            </h1>
            <p className="text-[10px] text-muted-foreground hidden sm:block truncate">
              Гроссмейстерские битвы с визуализацией потока сознания нейросетей
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isGameOver && (postGameSpeeches.length > 0 || isGeneratingGameOverSpeech) && (
            <Button
              size="sm"
              variant="amber"
              onClick={() => setIsGameOverModalOpen(true)}
              className="gap-1.5 h-7 text-xs animate-pulse"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Последнее слово</span>
            </Button>
          )}

          {/* Динамический индикатор провайдера */}
          {activeLlmPlayers.length === 0 ? (
            <button
              type="button"
              onClick={() => handleOpenSettings('players')}
              title="Нажмите для настройки игроков"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/80 border border-border/80 text-xs font-mono text-slate-300 hover:border-slate-600 transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
              <span>Человек vs Человек</span>
            </button>
          ) : usesOpenRouter && usesLmStudio ? (
            <button
              type="button"
              onClick={() => handleOpenSettings('providers')}
              title="Белые и Черные используют разные провайдеры (LM Studio + OpenRouter)"
              className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-950/80 border border-border/80 text-xs font-mono hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full shrink-0 ${availableModels.length > 0 ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400'}`} />
                <span className="text-cyan-300 font-bold">LM Studio</span>
              </div>
              <span className="text-muted-foreground">+</span>
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full shrink-0 ${openRouterApiKey ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                <span className="text-indigo-300 font-bold">OpenRouter</span>
              </div>
            </button>
          ) : usesOpenRouter ? (
            <button
              type="button"
              onClick={() => handleOpenSettings('providers')}
              title={`Активный провайдер: OpenRouter (${getActiveModelDisplay()}). Нажмите для настройки.`}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/80 border border-indigo-500/40 text-xs font-mono hover:border-indigo-400 hover:shadow-cyan-glow transition-all cursor-pointer"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${openRouterApiKey ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              <span className="text-slate-300">OpenRouter:</span>
              <span className="text-indigo-300 font-bold max-w-[140px] truncate font-mono">
                {getActiveModelDisplay()}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleOpenSettings('providers')}
              title={`Активный провайдер: LM Studio (${getActiveModelDisplay()}). Нажмите для настройки.`}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/80 border border-cyan-500/40 text-xs font-mono hover:border-cyan-400 hover:shadow-cyan-glow transition-all cursor-pointer"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${availableModels.length > 0 ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400'}`} />
              <span className="text-slate-300">LM Studio:</span>
              <span className="text-primary font-bold">
                {getActiveModelDisplay()}
              </span>
            </button>
          )}

          <Button
            size="sm"
            variant="neon"
            onClick={() => handleOpenSettings('providers')}
            className="gap-1.5 h-7 sm:h-8 text-xs"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden xs:inline sm:inline">Настройки</span>
          </Button>
        </div>
      </header>

      {/* Мобильный переключатель вкладок */}
      <nav className="flex lg:hidden items-center justify-around bg-slate-900/90 border border-border/80 rounded-2xl p-1 shrink-0 backdrop-blur-xl">
        <Button
          type="button"
          size="sm"
          variant={mobileTab === 'board' ? 'default' : 'ghost'}
          onClick={() => setMobileTab('board')}
          className="flex-1 text-xs h-8"
        >
          <span>♟️ Доска</span>
        </Button>

        <Button
          type="button"
          size="sm"
          variant={mobileTab === 'thinking' ? 'neon' : 'ghost'}
          onClick={() => setMobileTab('thinking')}
          className="flex-1 text-xs h-8 gap-1.5"
        >
          <span>🧠 Мысли LLM</span>
          {activeThinking.isStreaming && (
            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
          )}
        </Button>

        <Button
          type="button"
          size="sm"
          variant={mobileTab === 'history' ? 'default' : 'ghost'}
          onClick={() => setMobileTab('history')}
          className="flex-1 text-xs h-8"
        >
          <span>📜 Ходы ({moveThoughts.length})</span>
        </Button>
      </nav>

      {/* Основная арена: 3 колонки на десктопе, адаптивные вкладки на мобильном */}
      <main className="grid grid-cols-1 lg:grid-cols-[minmax(320px,1.15fr)_minmax(360px,1.3fr)_minmax(280px,0.85fr)] gap-2 flex-1 min-h-0 overflow-hidden">
        {/* ЛЕВАЯ КОЛОНКА: Инспектор мыслей (Thinking Stream) */}
        <div className={`flex flex-col min-h-0 h-full ${mobileTab === 'thinking' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {displayedSavedThought ? (
              <ThinkingSpoiler
                isLive={false}
                savedThought={displayedSavedThought}
                playerName={
                  displayedSavedThought.color === 'w'
                    ? whiteConfig.name
                    : blackConfig.name
                }
                avatar={
                  displayedSavedThought.color === 'w'
                    ? (whiteConfig.type === 'human' ? '👤' : (GRANDMASTER_PRESETS[whiteConfig.style]?.avatar || '🤖'))
                    : (blackConfig.type === 'human' ? '👤' : (GRANDMASTER_PRESETS[blackConfig.style]?.avatar || '🤖'))
                }
                totalPlayerErrors={displayedSavedThought.color === 'w' ? totalWhiteErrors : totalBlackErrors}
              />
            ) : (
              <ThinkingSpoiler
                isLive={true}
                thoughtStream={activeThinking.thoughtStream}
                contentStream={activeThinking.contentStream}
                tokenCount={activeThinking.tokenCount}
                tokensPerSecond={activeThinking.tokensPerSecond}
                isThinkingActive={activeThinking.isThinking}
                isStreaming={activeThinking.isStreaming}
                activeColor={activeThinking.color}
                statusText={statusText}
                currentAttempt={activeThinking.currentAttempt}
                playerName={
                  activeThinking.color === 'w'
                    ? (whiteConfig.type === 'human' ? whiteConfig.name : activePreset.name)
                    : (blackConfig.type === 'human' ? blackConfig.name : activePreset.name)
                }
                avatar={
                  activeThinking.color === 'w'
                    ? (whiteConfig.type === 'human' ? '👤' : activePreset.avatar)
                    : (blackConfig.type === 'human' ? '👤' : activePreset.avatar)
                }
                onRetry={handleRetryCurrentLlmTurn}
                isInspectingPause={isInspectingPause}
                inspectCountdown={inspectCountdown}
                onSkipPause={handleSkipPause}
                totalPlayerErrors={activeThinking.color === 'w' ? totalWhiteErrors : totalBlackErrors}
              />
            )}
          </div>
        </div>

        {/* ЦЕНТРАЛЬНАЯ КОЛОНКА: Шахматная доска + Игроки + Управление */}
        <div className={`flex flex-col items-center justify-between gap-1.5 min-h-0 h-full ${mobileTab === 'board' ? 'flex' : 'hidden lg:flex'}`}>
          {/* Верхний игрок */}
          <div className="w-full">
            <PlayerCard
              color={boardOrientation === 'w' ? 'b' : 'w'}
              config={boardOrientation === 'w' ? blackConfig : whiteConfig}
              isCurrentTurn={currentTurn === (boardOrientation === 'w' ? 'b' : 'w')}
              isThinking={activeThinking.isStreaming && activeThinking.color === (boardOrientation === 'w' ? 'b' : 'w')}
              capturedPieces={boardOrientation === 'w' ? evaluation.captured.b : evaluation.captured.w}
              materialScore={evaluation.materialScore}
              lastComment={
                boardOrientation === 'w'
                  ? [...moveThoughts].reverse().find(t => t.color === 'b' && t.comment)?.comment
                  : [...moveThoughts].reverse().find(t => t.color === 'w' && t.comment)?.comment
              }
              totalErrors={boardOrientation === 'w' ? totalBlackErrors : totalWhiteErrors}
            />
          </div>

          {/* Доска + Eval Bar */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-3 w-full max-w-full my-auto overflow-hidden">
            <EvalBar evaluation={evaluation} isFlipped={boardOrientation === 'b'} />
            <div className="flex-1 min-w-0 flex justify-center overflow-hidden">
              <ChessBoard
                chess={chessState}
                boardOrientation={boardOrientation}
                isInteractive={isHumanTurn && !activeThinking.isStreaming && !isGameOver}
                onMakeMove={handleHumanMove}
                lastMove={lastMove}
              />
            </div>
          </div>

          {/* Нижний игрок */}
          <div className="w-full">
            <PlayerCard
              color={boardOrientation === 'w' ? 'w' : 'b'}
              config={boardOrientation === 'w' ? whiteConfig : blackConfig}
              isCurrentTurn={currentTurn === (boardOrientation === 'w' ? 'w' : 'b')}
              isThinking={activeThinking.isStreaming && activeThinking.color === (boardOrientation === 'w' ? 'w' : 'b')}
              capturedPieces={boardOrientation === 'w' ? evaluation.captured.w : evaluation.captured.b}
              materialScore={evaluation.materialScore}
              lastComment={
                boardOrientation === 'w'
                  ? [...moveThoughts].reverse().find(t => t.color === 'w' && t.comment)?.comment
                  : [...moveThoughts].reverse().find(t => t.color === 'b' && t.comment)?.comment
              }
              totalErrors={boardOrientation === 'w' ? totalWhiteErrors : totalBlackErrors}
            />
          </div>

          {/* Компактный live-тикер мыслей на мобильном виде доски */}
          {activeThinking.isStreaming && (
            <div
              onClick={() => setMobileTab('thinking')}
              className="lg:hidden w-full px-3 py-1.5 rounded-xl bg-slate-950/90 border border-primary/60 text-primary text-xs flex items-center justify-between cursor-pointer shadow-cyan-glow animate-pulse"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="animate-spin text-sm">🧠</span>
                <span className="truncate font-mono text-[11px] text-slate-200">
                  {activeThinking.thoughtStream.slice(-45) || 'Генерация рассуждений...'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 pl-2">
                <Badge variant="cyan" className="font-mono text-[10px] py-0 px-1 font-bold">
                  {activeThinking.tokenCount || Math.round(activeThinking.thoughtStream.length / 2.8)} tok
                </Badge>
                <span className="text-[10px] text-primary font-semibold underline">Мысли →</span>
              </div>
            </div>
          )}

          {/* Поле ввода реплики человека сопернику */}
          {(gameMode === 'human_vs_llm' || whiteConfig.type === 'human' || blackConfig.type === 'human') &&
            !isGameOver && (
              <div className="w-full">
                <HumanChatInput
                  value={humanComment}
                  onChange={setHumanComment}
                  opponentName={
                    (boardOrientation === 'w' ? blackConfig : whiteConfig).type === 'human'
                      ? (boardOrientation === 'w' ? blackConfig : whiteConfig).name || 'Человек'
                      : GRANDMASTER_PRESETS[(boardOrientation === 'w' ? blackConfig : whiteConfig).style]?.name ||
                        'LLM'
                  }
                  opponentStyle={(boardOrientation === 'w' ? blackConfig : whiteConfig).style}
                  disabled={activeThinking.isStreaming}
                  isMobileOpen={isMobileChatOpen}
                  onToggleMobile={setIsMobileChatOpen}
                />
              </div>
            )}

          {/* Панель управления */}
          <div className="w-full">
            <GameControls
              gameMode={gameMode}
              onChangeMode={handleModeChange}
              isAutoPlaying={isAutoPlaying}
              onToggleAutoPlay={() => setIsAutoPlaying(!isAutoPlaying)}
              onStepMove={() => triggerLlmMove(currentTurn)}
              onResetGame={handleResetGame}
              onFlipBoard={handleFlipBoard}
              onOpenSettings={() => handleOpenSettings('game')}
              isThinking={activeThinking.isStreaming}
              isGameOver={isGameOver}
            />
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА: История ходов (PGN) и разбор прошлых мыслей */}
        <div className={`flex flex-col min-h-0 h-full ${mobileTab === 'history' ? 'flex' : 'hidden lg:flex'}`}>
          <MoveHistory
            moveThoughts={moveThoughts}
            selectedMoveIndex={selectedMoveIndex}
            onSelectMove={setSelectedMoveIndex}
            pgn={pgn}
            fen={fen}
          />
        </div>
      </main>

      {/* Модалка настроек на базе shadcn Dialog */}
      <SettingsModal
        isOpen={isSettingsOpen}
        initialTab={settingsTab}
        onClose={() => setIsSettingsOpen(false)}
        lmStudioBaseUrl={lmStudioBaseUrl}
        onUpdateBaseUrl={setLmStudioBaseUrl}
        openRouterApiKey={openRouterApiKey}
        onUpdateOpenRouterApiKey={setOpenRouterApiKey}
        openRouterModels={openRouterModels}
        onSetOpenRouterModels={setOpenRouterModels}
        whiteConfig={whiteConfig}
        onUpdateWhiteConfig={setWhiteConfig}
        blackConfig={blackConfig}
        onUpdateBlackConfig={setBlackConfig}
        maxRetries={maxRetries}
        onUpdateMaxRetries={setMaxRetries}
        postMoveDelaySec={postMoveDelaySec}
        onUpdatePostMoveDelay={setPostMoveDelaySec}
        availableModels={availableModels}
        onSetAvailableModels={setAvailableModels}
        ttsConfig={ttsConfig}
        onUpdateTtsConfig={setTtsConfig}
      />

      {/* Модалка последнего слова и завершения партии */}
      <GameOverModal
        isOpen={isGameOverModalOpen}
        onClose={() => setIsGameOverModalOpen(false)}
        gameStatus={gameStatus}
        winnerColor={winnerColor}
        speeches={postGameSpeeches}
        isGeneratingSpeech={isGeneratingGameOverSpeech}
        onReplaySpeech={speech => {
          speechService.speak(speech.speechText, ttsConfig, speech.style);
        }}
        onNewGame={handleResetGame}
      />
    </div>
  );
};

export default App;
