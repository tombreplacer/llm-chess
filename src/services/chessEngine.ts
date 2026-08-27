import { Chess } from 'chess.js';
import type { Square, PieceSymbol, Move } from 'chess.js';
import type { GameEvaluation, GameStatus, PieceColor } from '../types/chess';

const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0
};

export class ChessEngineService {
  private chess: Chess;

  constructor(fen?: string) {
    this.chess = new Chess(fen);
  }

  public reset(fen?: string): void {
    if (fen) {
      this.chess.load(fen);
    } else {
      this.chess.reset();
    }
  }

  public getChess(): Chess {
    return this.chess;
  }

  public getFen(): string {
    return this.chess.fen();
  }

  public getPgn(): string {
    return this.chess.pgn();
  }

  public getTurn(): PieceColor {
    return this.chess.turn() as PieceColor;
  }

  public getMoveNumber(): number {
    return Math.floor(this.chess.history().length / 2) + 1;
  }

  public getHistory(): string[] {
    return this.chess.history();
  }

  public getHistoryVerbose(): Move[] {
    return this.chess.history({ verbose: true });
  }

  public getLegalMovesVerbose(): Move[] {
    return this.chess.moves({ verbose: true });
  }

  public getLegalMovesSan(): string[] {
    return this.chess.moves();
  }

  public getLegalMovesUci(): string[] {
    return this.getLegalMovesVerbose().map(m => `${m.from}${m.to}${m.promotion || ''}`);
  }

  public isCheck(): boolean {
    return this.chess.inCheck();
  }

  public isGameOver(): boolean {
    return this.chess.isGameOver();
  }

  public getGameStatus(): GameStatus {
    if (this.chess.isCheckmate()) return 'checkmate';
    if (this.chess.isStalemate()) return 'stalemate';
    if (this.chess.isThreefoldRepetition()) return 'draw_repetition';
    if (this.chess.isInsufficientMaterial()) return 'draw_insufficient_material';
    if (this.chess.isDraw()) return 'draw_50_moves';
    if (this.chess.inCheck()) return 'check';
    return 'playing';
  }

  public makeMove(moveInput: string | { from: Square; to: Square; promotion?: PieceSymbol }): Move | null {
    try {
      if (typeof moveInput === 'string') {
        const clean = moveInput.trim();
        
        try {
          const move = this.chess.move(clean);
          if (move) return move;
        } catch {
          // ignore and try UCI
        }

        if (clean.length >= 4 && clean.length <= 5) {
          const from = clean.substring(0, 2) as Square;
          const to = clean.substring(2, 4) as Square;
          const promotion = clean.length === 5 ? (clean[4].toLowerCase() as PieceSymbol) : undefined;
          
          try {
            const move = this.chess.move({ from, to, promotion: promotion || 'q' });
            if (move) return move;
          } catch {
            // ignore
          }
        }

        const legalVerbose = this.getLegalMovesVerbose();
        const simplified = clean.replace(/[+#=x\- ]/g, '').toLowerCase();

        for (const legal of legalVerbose) {
          const uci = `${legal.from}${legal.to}${legal.promotion || ''}`.toLowerCase();
          const sanClean = legal.san.replace(/[+#=x\- ]/g, '').toLowerCase();
          
          if (uci === simplified || sanClean === simplified || legal.san.toLowerCase() === clean.toLowerCase()) {
            return this.chess.move(legal);
          }
        }
      } else {
        return this.chess.move(moveInput);
      }
    } catch {
      return null;
    }

    return null;
  }

  public undo(): Move | null {
    return this.chess.undo();
  }

  public getEvaluation(): GameEvaluation {
    const board = this.chess.board();
    
    const initialCounts: Record<PieceColor, Record<PieceSymbol, number>> = {
      w: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
      b: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 }
    };

    const currentCounts: Record<PieceColor, Record<PieceSymbol, number>> = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 }
    };

    let whiteMaterial = 0;
    let blackMaterial = 0;

    for (const row of board) {
      for (const cell of row) {
        if (cell) {
          currentCounts[cell.color][cell.type]++;
          const val = PIECE_VALUES[cell.type] || 0;
          if (cell.color === 'w') {
            whiteMaterial += val;
          } else {
            blackMaterial += val;
          }
        }
      }
    }

    const capturedByWhite: PieceSymbol[] = [];
    const capturedByBlack: PieceSymbol[] = [];

    const pieceOrder: PieceSymbol[] = ['q', 'r', 'b', 'n', 'p'];

    for (const piece of pieceOrder) {
      const lostByBlack = Math.max(0, initialCounts.b[piece] - currentCounts.b[piece]);
      for (let i = 0; i < lostByBlack; i++) {
        capturedByWhite.push(piece);
      }

      const lostByWhite = Math.max(0, initialCounts.w[piece] - currentCounts.w[piece]);
      for (let i = 0; i < lostByWhite; i++) {
        capturedByBlack.push(piece);
      }
    }

    const materialScore = whiteMaterial - blackMaterial;
    let advantage: 'white' | 'black' | 'equal' = 'equal';
    if (materialScore > 0) advantage = 'white';
    else if (materialScore < 0) advantage = 'black';

    return {
      materialScore,
      advantage,
      captured: {
        w: capturedByWhite,
        b: capturedByBlack
      }
    };
  }

  public explainIllegalMove(attemptedMove: string): string {
    const raw = (attemptedMove || '').trim();
    if (!raw) {
      return 'Ты не указал конкретный ход в формате <move>ХОД</move>. Обязательно добавь тег <move> с ходом из списка легальных ходов.';
    }

    const legalSan = this.getLegalMovesSan();
    const legalVerbose = this.getLegalMovesVerbose();

    if (this.chess.inCheck()) {
      return `Твой король находится под ШАХОМ! Ход "${raw}" оставляет короля под боем или не защищает от шаха. Ты ОБЯЗАН защитить короля! Доступные ходы для спасения: [ ${legalSan.join(', ')} ].`;
    }

    // Проверяем попытку походить конкретной фигурой
    const firstChar = raw[0].toUpperCase();
    const isPieceMove = ['N', 'B', 'R', 'Q', 'K'].includes(firstChar);
    if (isPieceMove) {
      const pieceType = firstChar.toLowerCase() as PieceSymbol;
      const samePieceMoves = legalVerbose
        .filter(m => m.piece === pieceType)
        .map(m => m.san);

      if (samePieceMoves.length > 0) {
        return `Ход "${raw}" невозможен по правилам! Доступные легальные ходы этой же фигурой: [ ${samePieceMoves.join(', ')} ]. Либо выбери другой ход из списка: [ ${legalSan.join(', ')} ].`;
      } else {
        return `У тебя нет легальных ходов фигурой "${firstChar}" в этой позиции! Выбери ход другой фигурой из списка: [ ${legalSan.join(', ')} ].`;
      }
    }

    // Если ход пешкой (например, e5, d4, exd5)
    if (/^[a-h]/.test(raw)) {
      const file = raw[0];
      const pawnMovesOnFile = legalVerbose
        .filter(m => m.piece === 'p' && (m.from.startsWith(file) || m.to.startsWith(file)))
        .map(m => m.san);

      if (pawnMovesOnFile.length > 0) {
        return `Пешечный ход "${raw}" невозможен! Доступные ходы пешками на этой вертикали: [ ${pawnMovesOnFile.join(', ')} ]. Все легальные ходы: [ ${legalSan.join(', ')} ].`;
      }
    }

    return `Ход "${raw}" НЕЛЕГАЛЕН на этой доске (фигура связана, поле заблокировано или такой ход противоречит правилам). Ты обязан выбрать СТРОГО один ход из легальных: [ ${legalSan.join(', ')} ].`;
  }
}
