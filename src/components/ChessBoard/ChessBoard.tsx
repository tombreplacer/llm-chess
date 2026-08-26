import React, { useState } from 'react';
import type { Chess, Square, PieceSymbol } from 'chess.js';
import type { PieceColor } from '../../types/chess';
import { ChessPieceSvg } from './ChessPieces';

interface ChessBoardProps {
  chess: Chess;
  boardOrientation?: PieceColor;
  isInteractive?: boolean;
  onMakeMove?: (move: { from: Square; to: Square; promotion?: PieceSymbol }) => void;
  lastMove?: { from: Square; to: Square } | null;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  chess,
  boardOrientation = 'w',
  isInteractive = true,
  onMakeMove,
  lastMove = null
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayFiles = boardOrientation === 'w' ? files : [...files].reverse();
  const displayRanks = boardOrientation === 'w' ? ranks : [...ranks].reverse();

  const getLegalDestinations = (square: Square | null): Square[] => {
    if (!square || !isInteractive) return [];
    const moves = chess.moves({ square, verbose: true });
    return moves.map(m => m.to);
  };

  const legalDestinations = getLegalDestinations(selectedSquare);

  const isKingInCheck = (sq: Square): boolean => {
    if (!chess.inCheck()) return false;
    const piece = chess.get(sq);
    return Boolean(piece && piece.type === 'k' && piece.color === chess.turn());
  };

  const handleSquareClick = (square: Square) => {
    if (!isInteractive) return;
    if (pendingPromotion) return;

    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    if (selectedSquare) {
      const isLegal = legalDestinations.includes(square);
      if (isLegal) {
        executeMoveOrPromptPromotion(selectedSquare, square);
        return;
      }
    }

    const piece = chess.get(square);
    if (piece && piece.color === chess.turn()) {
      setSelectedSquare(square);
    } else {
      setSelectedSquare(null);
    }
  };

  const executeMoveOrPromptPromotion = (from: Square, to: Square) => {
    const piece = chess.get(from);
    const isPawnPromotion =
      piece &&
      piece.type === 'p' &&
      ((piece.color === 'w' && to.endsWith('8')) || (piece.color === 'b' && to.endsWith('1')));

    if (isPawnPromotion) {
      setPendingPromotion({ from, to });
    } else {
      onMakeMove?.({ from, to });
      setSelectedSquare(null);
    }
  };

  const handlePromotionSelect = (promoPiece: PieceSymbol) => {
    if (pendingPromotion) {
      onMakeMove?.({
        from: pendingPromotion.from,
        to: pendingPromotion.to,
        promotion: promoPiece
      });
      setPendingPromotion(null);
      setSelectedSquare(null);
    }
  };

  const handleDragStart = (square: Square, e: React.DragEvent) => {
    if (!isInteractive) return;
    const piece = chess.get(square);
    if (piece && piece.color === chess.turn()) {
      setDraggedSquare(square);
      setSelectedSquare(square);
      e.dataTransfer.setData('text/plain', square);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (square: Square, e: React.DragEvent) => {
    e.preventDefault();
    const fromSquare = (e.dataTransfer.getData('text/plain') as Square) || draggedSquare;
    if (fromSquare && fromSquare !== square) {
      const legal = getLegalDestinations(fromSquare);
      if (legal.includes(square)) {
        executeMoveOrPromptPromotion(fromSquare, square);
      }
    }
    setDraggedSquare(null);
  };

  return (
    <div className="chess-board-wrapper">
      <div className="chess-grid">
        {displayRanks.map((rank, rIdx) =>
          displayFiles.map((file, fIdx) => {
            const square = `${file}${rank}` as Square;
            const piece = chess.get(square);
            const isLight = (fIdx + rIdx) % 2 === 0;

            const isSelected = selectedSquare === square;
            const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);
            const isLegalDest = legalDestinations.includes(square);
            const isCheckSquare = isKingInCheck(square);

            const squareClasses = [
              'chess-square',
              isLight ? 'chess-square-light' : 'chess-square-dark',
              isSelected ? 'chess-square-selected' : '',
              isLastMove ? 'chess-square-last-move' : '',
              isCheckSquare ? 'chess-square-check' : ''
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <div
                key={square}
                onClick={() => handleSquareClick(square)}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(square, e)}
                className={squareClasses}
              >
                {/* Метка ранга (1-8) */}
                {fIdx === 0 && (
                  <span
                    className={`coord-label coord-rank ${
                      isLight ? 'coord-light' : 'coord-dark'
                    }`}
                  >
                    {rank}
                  </span>
                )}

                {/* Метка вертикали (a-h) */}
                {rIdx === 7 && (
                  <span
                    className={`coord-label coord-file ${
                      isLight ? 'coord-light' : 'coord-dark'
                    }`}
                  >
                    {file}
                  </span>
                )}

                {/* Индикатор легального хода */}
                {isLegalDest && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    {piece ? (
                      <div className="w-full h-full border-4 border-rose-500/80 rounded-full animate-pulse scale-90" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
                    )}
                  </div>
                )}

                {/* Шахматная фигура */}
                {piece && (
                  <div
                    draggable={isInteractive && piece.color === chess.turn()}
                    onDragStart={e => handleDragStart(square, e)}
                    style={{ width: '84%', height: '84%' }}
                    className={`flex items-center justify-center transition-transform duration-100 ${
                      isSelected ? 'scale-110 drop-shadow-[0_8px_12px_rgba(0,0,0,0.6)]' : 'hover:scale-105'
                    } ${isInteractive && piece.color === chess.turn() ? 'cursor-grab active:cursor-grabbing' : ''}`}
                  >
                    <ChessPieceSvg type={piece.type} color={piece.color} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Модальное окно превращения пешки */}
      {pendingPromotion && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center z-30 p-6">
          <h4 className="text-lg font-bold text-white mb-4 drop-shadow">Превращение пешки:</h4>
          <div className="flex gap-3 bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-2xl">
            {(['q', 'r', 'b', 'n'] as PieceSymbol[]).map(pSymbol => (
              <button
                key={pSymbol}
                onClick={() => handlePromotionSelect(pSymbol)}
                className="w-14 h-14 p-2 bg-slate-800 hover:bg-emerald-600 rounded-lg transition-colors flex items-center justify-center shadow-md hover:scale-110 active:scale-95"
              >
                <ChessPieceSvg type={pSymbol} color={chess.turn()} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
