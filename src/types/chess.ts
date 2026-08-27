import type { Square, PieceSymbol } from 'chess.js';

export type PieceColor = 'w' | 'b';

export type PlayerType = 'human' | 'llm';

export type GameMode = 'human_vs_llm' | 'llm_vs_llm' | 'human_vs_human' | 'sandbox';

export type GrandmasterStyle = 
  | 'kasparov' 
  | 'karpov' 
  | 'tal' 
  | 'carlsen' 
  | 'fischer'
  | 'stockfish'
  | 'troll'
  | 'nikolaich';

export interface GrandmasterPreset {
  id: GrandmasterStyle;
  name: string;
  avatar: string;
  title: string;
  description: string;
  temperature: number;
  promptFlavor: string;
}

export type LlmProvider = 'lmstudio' | 'openrouter';

export interface LMStudioModel {
  id: string;
  object?: string;
  owned_by?: string;
}

export interface OpenRouterModel {
  id: string;
  name?: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
}

export interface PlayerConfig {
  type: PlayerType;
  provider?: LlmProvider;
  name: string;
  avatar?: string;
  bio?: string;
  modelId: string;
  style: GrandmasterStyle;
  temperature: number;
  maxTokens: number;
  systemPromptCustom?: string;
}

export interface TtsConfig {
  enabled: boolean;
  voiceURI: string;
  rate: number;
  pitch: number;
  volume: number;
}

export interface RetryLog {
  attempt: number;
  rawResponse: string;
  errorReason: string;
  timestamp: number;
}

export interface MoveThought {
  moveNumber: number;
  turnNumber: number;
  color: PieceColor;
  san: string;
  uci: string;
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
  fenBefore: string;
  fenAfter: string;
  thoughtText: string;
  comment?: string;
  finalMoveRaw: string;
  durationMs: number;
  tokenCount?: number;
  tokensPerSecond?: number;
  retries: RetryLog[];
  timestamp: number;
  captured?: PieceSymbol;
}

export interface CapturedPieces {
  w: PieceSymbol[]; // white captured black's pieces
  b: PieceSymbol[]; // black captured white's pieces
}

export interface GameEvaluation {
  materialScore: number; // positive = white ahead, negative = black ahead
  advantage: 'white' | 'black' | 'equal';
  captured: CapturedPieces;
}

export type GameStatus = 
  | 'idle'
  | 'playing'
  | 'check'
  | 'checkmate'
  | 'stalemate'
  | 'draw_repetition'
  | 'draw_50_moves'
  | 'draw_insufficient_material'
  | 'draw_agreement'
  | 'llm_thinking'
  | 'error';

export interface ActiveThinkingState {
  color: PieceColor;
  thoughtStream: string;
  contentStream: string;
  tokenCount: number;
  tokensPerSecond: number;
  isThinking: boolean; // while generating reasoning
  isStreaming: boolean; // while request is active
  startTime: number;
  currentAttempt: number;
  lastError?: string;
}
