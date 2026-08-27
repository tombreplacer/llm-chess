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

import { Swords, Trophy, RotateCcw } from 'lucide-react';

export const App: React.FC = () => {
  const engineRef = useRef<ChessEngineService>(new ChessEngineService());
  const [chessState, setChessState] = useState<Chess>(() => new Chess());
  const [fen, setFen] = useState<string>(() => engineRef.current.getFen());
  const [pgn, setPgn] = useState<string>(() => engineRef.current.getPgn());
  const [evaluation, setEvaluation] = useState<GameEvaluation>(() => engineRef.current.getEvaluation());
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);

  const getSavedSettings = () => {
    try {
      const data = localStorage.getItem('llm_chess_arena_settings_v1');
      if (data) return JSON.parse(data);
    } catch {}
    return null;
  };

  const initialSettings = getSavedSettings();

  const [gameMode, setGameMode] = useState<GameMode>(() => initialSettings?.gameMode || 'human_vs_llm');
  const [boardOrientation, setBoardOrientation] = useState<PieceColor>(() => initialSettings?.boardOrientation || 'w');
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);

  const [lmStudioBaseUrl, setLmStudioBaseUrl] = useState<string>(() => initialSettings?.lmStudioBaseUrl || 'http://localhost:1234/v1');
  const [openRouterApiKey, setOpenRouterApiKey] = useState<string>(() => initialSettings?.openRouterApiKey || '');
  const [availableModels, setAvailableModels] = useState<LMStudioModel[]>([]);
  const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>(POPULAR_OPENROUTER_MODELS);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'board' | 'thinking' | 'history'>('board');
  const [maxRetries, setMaxRetries] = useState<number>(() => initialSettings?.maxRetries ?? 3);
  const [postMoveDelaySec, setPostMoveDelaySec] = useState<number>(() => initialSettings?.postMoveDelaySec ?? 3);

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

  const [whiteConfig, setWhiteConfig] = useState<PlayerConfig>(() => initialSettings?.whiteConfig || {
    type: 'human',
    name: 'Кожаный Мешок',
    avatar: '🥊',
    bio: 'Человек с железной волей, решивший доказать превосходство биологического разума над кремнием.',
    modelId: 'mock-ai',
    style: 'kasparov',
    temperature: 0.6,
    maxTokens: 2048
  });

  const [blackConfig, setBlackConfig] = useState<PlayerConfig>(() => initialSettings?.blackConfig || {
    type: 'llm',
    provider: 'lmstudio',
    name: 'Гарри Каспаров',
    avatar: '⚡',
    modelId: 'mock-ai',
    style: 'kasparov',
    temperature: 0.6,
    maxTokens: 2048
  });

  const [ttsConfig, setTtsConfig] = useState<TtsConfig>(() => initialSettings?.ttsConfig || {
    enabled: true,
    voiceURI: '',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0
  });

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

  const [moveThoughts, setMoveThoughts] = useState<MoveThought[]>([]);
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
  const [statusText, setStatusText] = useState<string>('Ожидание первого хода...');

  const abortControllerRef = useRef<AbortController | null>(null);
  const autoPlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncGameState = useCallback(() => {
    const engine = engineRef.current;
    const newChess = new Chess(engine.getFen());
    setChessState(newChess);
    setFen(engine.getFen());
    setPgn(engine.getPgn());
    setEvaluation(engine.getEvaluation());

    const status = engine.getGameStatus();
    setGameStatus(status);

    if (status === 'checkmate') {
      sounds.playVictory();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  }, []);

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
          setMoveThoughts(prev => [...prev, result.thought]);
          setLastMove({ from: result.thought.from, to: result.thought.to });
          syncGameState();

          setActiveThinking(prev => ({
            ...prev,
            isStreaming: false,
            isThinking: false
          }));

          // Озвучиваем реплику гроссмейстера через браузерный TTS
          if (result.thought.comment) {
            speechService.speak(result.thought.comment, ttsConfig, playerConfig.style);
          }

          const isOver = engineRef.current.isGameOver();

          if (postMoveDelaySec > 0 && !isOver) {
            setIsInspectingPause(true);
            setInspectCountdown(postMoveDelaySec);
            setStatusText(`Ход совершен: ${result.thought.san} (Изучение мыслей)`);

            let remaining = postMoveDelaySec;
            pauseIntervalRef.current = setInterval(() => {
              remaining = Math.max(0, +(remaining - 0.1).toFixed(1));
              setInspectCountdown(remaining);
            }, 100);

            pauseTimerRef.current = setTimeout(() => {
              if (pauseIntervalRef.current) clearInterval(pauseIntervalRef.current);
              setIsInspectingPause(false);
              setInspectCountdown(null);
              setStatusText(`Ход совершен: ${result.thought.san}`);
            }, postMoveDelaySec * 1000);
          } else {
            setStatusText(`Ход совершен: ${result.thought.san}`);
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('прерван') || msg.includes('aborted')) {
          setStatusText('Ход отменен.');
        } else {
          setStatusText(`Ошибка: ${msg}`);
          sounds.playRetry();
        }
        setActiveThinking(prev => ({
          ...prev,
          isStreaming: false,
          isThinking: false,
          lastError: msg
        }));
      }
    },
    [whiteConfig, blackConfig, lmStudioBaseUrl, openRouterApiKey, maxRetries, postMoveDelaySec, syncGameState]
  );

  const handleHumanMove = (moveInput: { from: Square; to: Square; promotion?: PieceSymbol }) => {
    const engine = engineRef.current;
    const currentTurn = engine.getTurn();
    const currentConfig = currentTurn === 'w' ? whiteConfig : blackConfig;

    if (currentConfig.type !== 'human') return;
    if (activeThinking.isStreaming || isInspectingPause) return;

    const moveResult = engine.makeMove(moveInput);
    if (!moveResult) {
      sounds.playRetry();
      return;
    }

    if (moveResult.captured) {
      sounds.playCapture();
    } else {
      sounds.playMove();
    }

    if (engine.isCheck()) {
      setTimeout(() => sounds.playCheck(), 100);
    }

    setLastMove({ from: moveResult.from, to: moveResult.to });

    const humanThought: MoveThought = {
      moveNumber: engine.getMoveNumber(),
      turnNumber: Math.floor((engine.getHistory().length - 1) / 2) + 1,
      color: currentTurn,
      san: moveResult.san,
      uci: `${moveResult.from}${moveResult.to}${moveResult.promotion || ''}`,
      from: moveResult.from,
      to: moveResult.to,
      promotion: moveResult.promotion,
      fenBefore: fen,
      fenAfter: engine.getFen(),
      thoughtText: 'Человек сделал свой ход на доске.',
      finalMoveRaw: moveResult.san,
      durationMs: 0,
      retries: [],
      timestamp: Date.now(),
      captured: moveResult.captured
    };

    setMoveThoughts(prev => [...prev, humanThought]);
    setSelectedMoveIndex(null);
    syncGameState();
  };

  useEffect(() => {
    const engine = engineRef.current;
    if (engine.isGameOver()) {
      setIsAutoPlaying(false);
      return;
    }

    const currentTurn = engine.getTurn();
    const nextConfig = currentTurn === 'w' ? whiteConfig : blackConfig;

    if (nextConfig.type === 'llm' && !activeThinking.isStreaming && !isInspectingPause) {
      if (gameMode === 'llm_vs_llm') {
        if (isAutoPlaying) {
          autoPlayTimeoutRef.current = setTimeout(() => {
            triggerLlmMove(currentTurn);
          }, 400);
        }
      } else if (gameMode === 'human_vs_llm') {
        autoPlayTimeoutRef.current = setTimeout(() => {
          triggerLlmMove(currentTurn);
        }, 300);
      }
    }

    return () => {
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current);
      }
    };
  }, [fen, gameMode, isAutoPlaying, activeThinking.isStreaming, isInspectingPause, whiteConfig, blackConfig, triggerLlmMove]);

  const handleModeChange = (mode: GameMode) => {
    setGameMode(mode);
    setIsAutoPlaying(false);
    if (mode === 'llm_vs_llm') {
      setWhiteConfig(prev => ({
        ...prev,
        type: 'llm',
        name: GRANDMASTER_PRESETS[prev.style]?.name || 'Гарри Каспаров'
      }));
      setBlackConfig(prev => ({
        ...prev,
        type: 'llm',
        style: prev.style === 'kasparov' ? 'tal' : prev.style,
        name: GRANDMASTER_PRESETS[prev.style === 'kasparov' ? 'tal' : prev.style]?.name || 'Михаил Таль'
      }));
    } else if (mode === 'human_vs_llm') {
      setWhiteConfig(prev => {
        const isPresetName = Object.values(GRANDMASTER_PRESETS).some(p => p.name === prev.name);
        return {
          ...prev,
          type: 'human',
          name: isPresetName || !prev.name ? 'Кожаный Мешок' : prev.name,
          avatar: prev.avatar || '🥊',
          bio: prev.bio || 'Человек с железной волей, решивший доказать превосходство биологического разума над кремнием.'
        };
      });
      setBlackConfig(prev => ({
        ...prev,
        type: 'llm',
        name: GRANDMASTER_PRESETS[prev.style]?.name || 'Гарри Каспаров'
      }));
      setBoardOrientation('w');
    }
  };

  const handleResetGame = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    engineRef.current.reset();
    setLastMove(null);
    setMoveThoughts([]);
    setSelectedMoveIndex(null);
    setIsAutoPlaying(false);
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

  const currentTurn = engineRef.current.getTurn();
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

  return (
    <div className="app-container">
      {/* Верхний Header */}
      <header className="header-bar">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-md text-white shrink-0">
            <Swords className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xs sm:text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent truncate">
              LLM Chess Arena
            </h1>
            <p className="text-[10px] text-slate-400 hidden sm:block truncate">
              Гроссмейстерские битвы с визуализацией потока мыслей нейросетей (LM Studio)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="text-slate-300">LM Studio:</span>
            <span className="text-cyan-400 font-bold">
              {availableModels.length > 0 ? `${availableModels.length} мод.` : 'Demo'}
            </span>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all shadow cursor-pointer shrink-0"
          >
            ⚙️ <span className="hidden xs:inline sm:inline">Настройки</span>
          </button>
        </div>
      </header>

      {/* Мобильный переключатель вкладок */}
      <nav className="mobile-nav-bar">
        <button
          type="button"
          onClick={() => setMobileTab('board')}
          className={`mobile-nav-btn ${mobileTab === 'board' ? 'active' : ''}`}
        >
          <span>♟️ Доска</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('thinking')}
          className={`mobile-nav-btn ${mobileTab === 'thinking' ? 'active' : ''}`}
        >
          <span className="relative inline-flex items-center gap-1.5">
            <span>🧠 Мысли LLM</span>
            {activeThinking.isStreaming && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            )}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('history')}
          className={`mobile-nav-btn ${mobileTab === 'history' ? 'active' : ''}`}
        >
          <span>📜 Ходы ({moveThoughts.length})</span>
        </button>
      </nav>

      {/* Основная арена: 3 колонки на десктопе, адаптивные вкладки на мобильном */}
      <main className="main-arena">
        {/* ЛЕВАЯ КОЛОНКА: Инспектор мыслей (Thinking Stream) */}
        <div className={`col-panel ${mobileTab === 'thinking' ? 'mobile-active' : ''}`}>
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
        <div className={`col-panel items-center justify-between ${mobileTab === 'board' ? 'mobile-active' : ''}`}>
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
          <div className="flex items-center justify-center gap-1.5 sm:gap-3 w-full max-w-full my-auto overflow-hidden box-border">
            <EvalBar evaluation={evaluation} isFlipped={boardOrientation === 'b'} />
            <div className="flex-1 min-w-0 flex justify-center overflow-hidden">
              <ChessBoard
                chess={chessState}
                boardOrientation={boardOrientation}
                isInteractive={isHumanTurn && !activeThinking.isStreaming && !engineRef.current.isGameOver()}
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
              className="lg:hidden w-full px-3 py-1.5 rounded-xl bg-cyan-950/90 border border-cyan-500/60 text-cyan-300 text-xs flex items-center justify-between cursor-pointer shadow-lg animate-pulse"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="animate-spin text-sm">🧠</span>
                <span className="truncate font-mono text-[11px] text-slate-200">
                  {activeThinking.thoughtStream.slice(-45) || 'Генерация рассуждений...'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 pl-2">
                <span className="px-1.5 py-0.5 rounded bg-cyan-600 text-white font-mono text-[10px] font-bold">
                  {activeThinking.tokenCount || Math.round(activeThinking.thoughtStream.length / 2.8)} tok
                </span>
                <span className="text-[10px] text-cyan-400 font-semibold underline">Мысли →</span>
              </div>
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
              onOpenSettings={() => setIsSettingsOpen(true)}
              isThinking={activeThinking.isStreaming}
              isGameOver={engineRef.current.isGameOver()}
            />
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА: История ходов (PGN) и разбор прошлых мыслей */}
        <div className={`col-panel ${mobileTab === 'history' ? 'mobile-active' : ''}`}>
          <MoveHistory
            moveThoughts={moveThoughts}
            selectedMoveIndex={selectedMoveIndex}
            onSelectMove={setSelectedMoveIndex}
            pgn={pgn}
            fen={fen}
          />
        </div>
      </main>

      {/* Модалка настроек */}
      <SettingsModal
        isOpen={isSettingsOpen}
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

      {/* Модалка завершения партии */}
      {engineRef.current.isGameOver() && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">Партия завершена!</h2>
              <p className="text-slate-300 mt-2 font-medium">
                {gameStatus === 'checkmate' && (
                  <span>
                    Мат! Победили <strong className="text-cyan-400">{engineRef.current.getTurn() === 'w' ? 'Черные' : 'Белые'}</strong>
                  </span>
                )}
                {gameStatus === 'stalemate' && <span>Ничья (Пат на доске)</span>}
                {gameStatus === 'draw_repetition' && <span>Ничья (Троекратное повторение позиции)</span>}
                {gameStatus === 'draw_insufficient_material' && <span>Ничья (Недостаточно материала для мата)</span>}
                {gameStatus === 'draw_50_moves' && <span>Ничья (Правило 50 ходов)</span>}
              </p>
            </div>

            <button
              onClick={handleResetGame}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/40 flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Сыграть еще раз</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
