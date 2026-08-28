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
    <div className="relative aspect-square w-full max-w-[min(52vh,480px)] min-w-0 mx-auto rounded-2xl p-1.5 bg-gradient-to-br from-slate-800 to-slate-950 shadow-2xl border border-slate-700/60 select-none">
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full rounded-xl overflow-hidden shadow-inner border-2 border-slate-950">
        {displayRanks.map((rank, rIdx) =>
          displayFiles.map((file, fIdx) => {
            const square = `${file}${rank}` as Square;
            const piece = chess.get(square);
            const isLight = (fIdx + rIdx) % 2 === 0;

            const isSelected = selectedSquare === square;
            const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);
            const isLegalDest = legalDestinations.includes(square);
            const isCheckSquare = isKingInCheck(square);

            let bgClass = isLight ? 'bg-[#d8e2ec]' : 'bg-[#475e7a]';
            if (isLastMove) {
              bgClass = isLight ? 'bg-[#fef08a]' : 'bg-[#ca8a04]';
            }
            if (isSelected) {
              bgClass = 'bg-emerald-500 text-white';
            }
            if (isCheckSquare) {
              bgClass = 'bg-rose-600 animate-pulse';
            }

            return (
              <div
                key={square}
                onClick={() => handleSquareClick(square)}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(square, e)}
                className={`relative flex items-center justify-center cursor-pointer transition-colors duration-100 ${bgClass}`}
              >
                {/* Метка ранга (1-8) */}
                {fIdx === 0 && (
                  <span
                    className={`absolute top-0.5 left-1 text-[8px] sm:text-[9px] font-mono font-bold pointer-events-none select-none z-10 ${
                      isLight ? 'text-[#475e7a]' : 'text-[#d8e2ec]'
                    }`}
                  >
                    {rank}
                  </span>
                )}

                {/* Метка вертикали (a-h) */}
                {rIdx === 7 && (
                  <span
                    className={`absolute bottom-0.5 right-1 text-[8px] sm:text-[9px] font-mono font-bold pointer-events-none select-none z-10 ${
                      isLight ? 'text-[#475e7a]' : 'text-[#d8e2ec]'
                    }`}
                  >
                    {file}
                  </span>
                )}

                {/* Индикатор легального хода */}
                {isLegalDest && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
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
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center z-30 p-6 animate-in fade-in zoom-in-95">
          <h4 className="text-sm sm:text-base font-bold text-white mb-4 drop-shadow">Выберите фигуру:</h4>
          <div className="flex gap-2.5 bg-slate-900 p-3 rounded-2xl border border-border shadow-2xl">
            {(['q', 'r', 'b', 'n'] as PieceSymbol[]).map(pSymbol => (
              <button
                key={pSymbol}
                onClick={() => handlePromotionSelect(pSymbol)}
                className="w-12 h-12 sm:w-14 sm:h-14 p-2 bg-slate-800 hover:bg-emerald-600 rounded-xl transition-all flex items-center justify-center shadow-md hover:scale-110 active:scale-95 cursor-pointer"
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
