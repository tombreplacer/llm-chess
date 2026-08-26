import React from 'react';
import type { PieceSymbol } from 'chess.js';
import type { PieceColor } from '../../types/chess';

export const ChessPieceSvg: React.FC<{
  type: PieceSymbol;
  color: PieceColor;
  size?: number | string;
  className?: string;
}> = ({ type, color, size = '100%', className = '' }) => {
  const isWhite = color === 'w';
  const fill = isWhite ? '#FFFFFF' : '#1A1D24';
  const stroke = isWhite ? '#2A2D34' : '#E2E8F0';
  const accent = isWhite ? '#E2E8F0' : '#0F172A';

  switch (type) {
    case 'p':
      return (
        <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
          <path
            d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'n':
      return (
        <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
          <path
            d="m 22,10 c 10.5,1 16.5,8 16,29 L 15,39 C 15,30 9.5,23.5 9.5,17.5 c 0,-4.5 3,-8.5 7,-8.5 2.5,0 4.5,1.5 5.5,1 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="m 24,18 c 0.38,2.91 -5.55,7.37 -8,9 -3,2 -2.82,4.34 -5,4 -1.04,-0.94 -1.41,-3.04 0,-3 1.5,0 3,-3 3,-3 0.5,-1 1.5,-3 1.5,-3 0,0 2,-2 3,-2 1,0 2.5,0 3,1 z"
            fill={accent}
            stroke={stroke}
            strokeWidth="1"
          />
          <circle cx="15" cy="15" r="1.5" fill={isWhite ? '#1e293b' : '#f8fafc'} />
        </svg>
      );

    case 'b':
      return (
        <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,39.5 36,39.5 C 33,39.5 12,39.5 9,39.5 C 7.65,39.5 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 z" />
            <path d="M 12,36 C 11,32 11,29 13,27 C 15,25 18,24 19,20 C 17,19 16,16 16,14 C 16,11 19,8 22.5,8 C 26,8 29,11 29,14 C 29,16 28,19 26,20 C 27,24 30,25 32,27 C 34,29 34,32 33,36 z" />
            <path d="M 22.5,8 L 22.5,5" strokeWidth="1.8" />
            <path d="M 21,6.5 L 24,6.5" strokeWidth="1.8" />
            <circle cx="22.5" cy="14" r="1.8" fill={isWhite ? '#1e293b' : '#f8fafc'} />
          </g>
        </svg>
      );

    case 'r':
      return (
        <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9,39 L 36,39 L 36,36 L 9,36 z" />
            <path d="M 12,36 L 12,32 L 33,32 L 33,36 z" />
            <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 z" />
            <path d="M 12,14 L 33,14 L 31,32 L 14,32 z" />
          </g>
        </svg>
      );

    case 'q':
      return (
        <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 22.5,10 L 14,25 L 6.5,13.5 z" />
            <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 L 34,38.5 C 34,38.5 36,37.5 34.5,36 C 34.5,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 z" />
            <circle cx="6.5" cy="12.5" r="2" />
            <circle cx="14" cy="24" r="1.5" />
            <circle cx="22.5" cy="9" r="2.5" />
            <circle cx="31" cy="24" r="1.5" />
            <circle cx="38.5" cy="12.5" r="2" />
          </g>
        </svg>
      );

    case 'k':
      return (
        <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 22.5,11.63 L 22.5,6" strokeWidth="2" />
            <path d="M 20,8 L 25,8" strokeWidth="2" />
            <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25 z" />
            <path d="M 11.5,37 C 17,40.5 28,40.5 33.5,37 C 35,36 36,34 36,31.5 C 36,27 30,24 22.5,24 C 15,24 9,27 9,31.5 C 9,34 10,36 11.5,37 z" />
            <path d="M 11.5,30 C 15,29 30,29 33.5,30" />
            <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" />
          </g>
        </svg>
      );

    default:
      return null;
  }
};
