import React from 'react';
import type { PieceSymbol } from 'chess.js';
import type { PieceColor, PieceTheme } from '../../types/chess';

interface ChessPieceSvgProps {
  type: PieceSymbol;
  color: PieceColor;
  theme?: PieceTheme;
  size?: number | string;
  className?: string;
}

export const ChessPieceSvg: React.FC<ChessPieceSvgProps> = ({
  type,
  color,
  theme = 'cburnett',
  size = '100%',
  className = ''
}) => {
  const isWhite = color === 'w';

  // 1. NEON CYBERPUNK THEME
  if (theme === 'neon') {
    const neonStroke = isWhite ? '#38bdf8' : '#f43f5e';
    const neonFill = isWhite ? 'rgba(56, 189, 248, 0.18)' : 'rgba(244, 63, 94, 0.18)';
    const neonAccent = isWhite ? '#bae6fd' : '#fecdd3';

    switch (type) {
      case 'p':
        return (
          <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
            <defs>
              <filter id={`neon-glow-${color}-p`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <circle cx="22.5" cy="13" r="5" fill={neonFill} stroke={neonStroke} strokeWidth="2" filter={`url(#neon-glow-${color}-p)`} />
            <path d="M 18,19 L 27,19 L 29,35 L 16,35 Z" fill={neonFill} stroke={neonStroke} strokeWidth="2" strokeLinejoin="round" />
            <path d="M 12,39 L 33,39" stroke={neonAccent} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="22.5" cy="13" r="1.5" fill={neonAccent} />
          </svg>
        );

      case 'n':
        return (
          <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
            <defs>
              <filter id={`neon-glow-${color}-n`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d="M 22,8 L 14,16 L 12,24 L 16,23 L 15,36 L 31,36 L 31,23 L 34,14 L 27,8 Z"
              fill={neonFill}
              stroke={neonStroke}
              strokeWidth="2"
              strokeLinejoin="round"
              filter={`url(#neon-glow-${color}-n)`}
            />
            <path d="M 16,21 L 22,17 L 27,21" fill="none" stroke={neonAccent} strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="18" cy="15" r="1.5" fill={neonAccent} />
            <path d="M 12,39 L 33,39" stroke={neonAccent} strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );

      case 'b':
        return (
          <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
            <defs>
              <filter id={`neon-glow-${color}-b`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d="M 22.5,7 L 29,18 L 26,35 L 19,35 L 16,18 Z"
              fill={neonFill}
              stroke={neonStroke}
              strokeWidth="2"
              strokeLinejoin="round"
              filter={`url(#neon-glow-${color}-b)`}
            />
            <circle cx="22.5" cy="6" r="2" fill={neonAccent} />
            <line x1="22.5" y1="13" x2="22.5" y2="22" stroke={neonAccent} strokeWidth="1.8" strokeLinecap="round" />
            <line x1="18.5" y1="17" x2="26.5" y2="17" stroke={neonAccent} strokeWidth="1.8" strokeLinecap="round" />
            <path d="M 13,39 L 32,39" stroke={neonAccent} strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );

      case 'r':
        return (
          <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
            <defs>
              <filter id={`neon-glow-${color}-r`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d="M 12,11 L 12,18 L 15,18 L 15,35 L 30,35 L 30,18 L 33,18 L 33,11 L 29,11 L 29,14 L 26,14 L 26,11 L 19,11 L 19,14 L 16,14 L 16,11 Z"
              fill={neonFill}
              stroke={neonStroke}
              strokeWidth="2"
              strokeLinejoin="round"
              filter={`url(#neon-glow-${color}-r)`}
            />
            <line x1="18" y1="24" x2="27" y2="24" stroke={neonAccent} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 11,39 L 34,39" stroke={neonAccent} strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );

      case 'q':
        return (
          <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
            <defs>
              <filter id={`neon-glow-${color}-q`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d="M 9,16 L 14,35 L 31,35 L 36,16 L 28,24 L 22.5,12 L 17,24 Z"
              fill={neonFill}
              stroke={neonStroke}
              strokeWidth="2"
              strokeLinejoin="round"
              filter={`url(#neon-glow-${color}-q)`}
            />
            <circle cx="9" cy="14" r="2" fill={neonAccent} />
            <circle cx="17" cy="11" r="2" fill={neonAccent} />
            <circle cx="22.5" cy="8" r="2.5" fill={neonAccent} />
            <circle cx="28" cy="11" r="2" fill={neonAccent} />
            <circle cx="36" cy="14" r="2" fill={neonAccent} />
            <path d="M 11,39 L 34,39" stroke={neonAccent} strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );

      case 'k':
        return (
          <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
            <defs>
              <filter id={`neon-glow-${color}-k`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d="M 12,20 L 15,35 L 30,35 L 33,20 L 22.5,15 Z"
              fill={neonFill}
              stroke={neonStroke}
              strokeWidth="2"
              strokeLinejoin="round"
              filter={`url(#neon-glow-${color}-k)`}
            />
            {/* Крест короля */}
            <line x1="22.5" y1="5" x2="22.5" y2="13" stroke={neonAccent} strokeWidth="2.2" strokeLinecap="round" />
            <line x1="18.5" y1="8" x2="26.5" y2="8" stroke={neonAccent} strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="22.5" cy="24" r="3" fill="none" stroke={neonAccent} strokeWidth="1.5" />
            <path d="M 11,39 L 34,39" stroke={neonAccent} strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );
    }
  }

  // 2. PIXEL 8-BIT RETRO THEME
  if (theme === 'pixel') {
    const pxFill = isWhite ? '#f8fafc' : '#0f172a';
    const pxStroke = isWhite ? '#0284c7' : '#94a3b8';
    const pxAccent = isWhite ? '#38bdf8' : '#e2e8f0';

    switch (type) {
      case 'p':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className={className} style={{ imageRendering: 'pixelated' }}>
            <rect x="6" y="2" width="4" height="4" fill={pxFill} stroke={pxStroke} strokeWidth="0.6" />
            <rect x="7" y="6" width="2" height="2" fill={pxAccent} />
            <rect x="5" y="8" width="6" height="5" fill={pxFill} stroke={pxStroke} strokeWidth="0.6" />
            <rect x="4" y="13" width="8" height="2" fill={pxAccent} stroke={pxStroke} strokeWidth="0.6" />
          </svg>
        );

      case 'n':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className={className} style={{ imageRendering: 'pixelated' }}>
            <rect x="6" y="2" width="5" height="3" fill={pxFill} stroke={pxStroke} strokeWidth="0.6" />
            <rect x="4" y="5" width="8" height="3" fill={pxFill} stroke={pxStroke} strokeWidth="0.6" />
            <rect x="3" y="8" width="5" height="2" fill={pxAccent} />
            <rect x="5" y="8" width="7" height="5" fill={pxFill} stroke={pxStroke} strokeWidth="0.6" />
            <rect x="5" y="5" width="2" height="2" fill={isWhite ? '#0f172a' : '#ffffff'} />
            <rect x="4" y="13" width="9" height="2" fill={pxAccent} stroke={pxStroke} strokeWidth="0.6" />
          </svg>
        );

      case 'b':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className={className} style={{ imageRendering: 'pixelated' }}>
            <rect x="7" y="1" width="2" height="2" fill={pxAccent} />
            <rect x="5" y="3" width="6" height="4" fill={pxFill} stroke={pxStroke} strokeWidth="0.6" />
            <rect x="7" y="4" width="2" height="3" fill={isWhite ? '#0284c7' : '#e2e8f0'} />
            <rect x="6" y="7" width="4" height="2" fill={pxAccent} />
            <rect x="5" y="9" width="6" height="4" fill={pxFill} stroke={pxStroke} strokeWidth="0.6" />
            <rect x="4" y="13" width="8" height="2" fill={pxAccent} stroke={pxStroke} strokeWidth="0.6" />
          </svg>
        );

      case 'r':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className={className} style={{ imageRendering: 'pixelated' }}>
            <rect x="4" y="2" width="2" height="3" fill={pxFill} stroke={pxStroke} strokeWidth="0.6" />
            <rect x="7" y="2" width="2" height="2" fill={pxFill} stroke={pxStroke} strokeWidth="0.6" />
            <rect x="10" y="2" width="2" height="3" fill={pxFill} stroke={pxStroke} strokeWidth="0.6" />
            <rect x="4" y="5" width="8" height="2" fill={pxAccent} />
            <rect x="5" y="7" width="6" height="6" fill={pxFill} stroke={pxStroke} strokeWidth="0.6" />
            <rect x="3" y="13" width="10" height="2" fill={pxAccent} stroke={pxStroke} strokeWidth="0.6" />
          </svg>
        );

      case 'q':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className={className} style={{ imageRendering: 'pixelated' }}>
            <rect x="3" y="2" width="2" height="2" fill={pxAccent} />
            <rect x="7" y="1" width="2" height="2" fill={pxAccent} />
            <rect x="11" y="2" width="2" height="2" fill={pxAccent} />
            <rect x="4" y="4" width="8" height="4" fill={pxFill} stroke={pxStroke} strokeWidth="0.6" />
            <rect x="5" y="8" width="6" height="5" fill={pxFill} stroke={pxStroke} strokeWidth="0.6" />
            <rect x="3" y="13" width="10" height="2" fill={pxAccent} stroke={pxStroke} strokeWidth="0.6" />
          </svg>
        );

      case 'k':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className={className} style={{ imageRendering: 'pixelated' }}>
            <rect x="7" y="1" width="2" height="4" fill={pxAccent} />
            <rect x="5" y="2" width="6" height="2" fill={pxAccent} />
            <rect x="4" y="5" width="8" height="3" fill={pxFill} stroke={pxStroke} strokeWidth="0.6" />
            <rect x="5" y="8" width="6" height="5" fill={pxFill} stroke={pxStroke} strokeWidth="0.6" />
            <rect x="3" y="13" width="10" height="2" fill={pxAccent} stroke={pxStroke} strokeWidth="0.6" />
          </svg>
        );
    }
  }

  // 3. ALPHA MODERN FLAT THEME
  if (theme === 'alpha') {
    const alphaFill = isWhite ? '#f8fafc' : '#1e293b';
    const alphaStroke = isWhite ? '#0284c7' : '#94a3b8';
    const alphaAccent = isWhite ? '#38bdf8' : '#64748b';

    switch (type) {
      case 'p':
        return (
          <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
            <circle cx="22.5" cy="14" r="6" fill={alphaFill} stroke={alphaStroke} strokeWidth="2" />
            <path d="M 16,21 C 16,28 13,34 13,37 L 32,37 C 32,34 29,28 29,21 Z" fill={alphaFill} stroke={alphaStroke} strokeWidth="2" strokeLinejoin="round" />
            <rect x="11" y="37" width="23" height="3" rx="1.5" fill={alphaAccent} />
          </svg>
        );

      case 'n':
        return (
          <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
            <path
              d="M 23,8 C 16,9 13,15 11,21 C 9,27 14,26 15,24 C 14,31 13,37 13,37 L 33,37 C 33,37 34,22 34,14 C 34,8 29,7 23,8 Z"
              fill={alphaFill}
              stroke={alphaStroke}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="18" cy="15" r="2" fill={isWhite ? '#0f172a' : '#f8fafc'} />
            <path d="M 20,23 L 26,20" stroke={alphaStroke} strokeWidth="2" strokeLinecap="round" />
            <rect x="11" y="37" width="23" height="3" rx="1.5" fill={alphaAccent} />
          </svg>
        );

      case 'b':
        return (
          <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
            <circle cx="22.5" cy="7" r="2.5" fill={alphaAccent} />
            <path
              d="M 22.5,9 C 16,14 15,22 17,28 C 18,31 14,37 14,37 L 31,37 C 31,37 27,31 28,28 C 30,22 29,14 22.5,9 Z"
              fill={alphaFill}
              stroke={alphaStroke}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <line x1="22.5" y1="14" x2="22.5" y2="24" stroke={alphaStroke} strokeWidth="2" strokeLinecap="round" />
            <line x1="18" y1="18" x2="27" y2="18" stroke={alphaStroke} strokeWidth="2" strokeLinecap="round" />
            <rect x="11" y="37" width="23" height="3" rx="1.5" fill={alphaAccent} />
          </svg>
        );

      case 'r':
        return (
          <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
            <path
              d="M 12,12 L 12,18 L 16,18 L 16,37 L 29,37 L 29,18 L 33,18 L 33,12 L 29,12 L 29,15 L 26,15 L 26,12 L 19,12 L 19,15 L 16,15 L 16,12 Z"
              fill={alphaFill}
              stroke={alphaStroke}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <line x1="16" y1="24" x2="29" y2="24" stroke={alphaAccent} strokeWidth="2" strokeLinecap="round" />
            <rect x="10" y="37" width="25" height="3" rx="1.5" fill={alphaAccent} />
          </svg>
        );

      case 'q':
        return (
          <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
            <path
              d="M 8,17 L 14,37 L 31,37 L 37,17 L 29,25 L 22.5,12 L 16,25 Z"
              fill={alphaFill}
              stroke={alphaStroke}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="8" cy="15" r="2.5" fill={alphaAccent} />
            <circle cx="22.5" cy="10" r="2.5" fill={alphaAccent} />
            <circle cx="37" cy="15" r="2.5" fill={alphaAccent} />
            <rect x="11" y="37" width="23" height="3" rx="1.5" fill={alphaAccent} />
          </svg>
        );

      case 'k':
        return (
          <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
            <path
              d="M 13,19 C 13,27 11,37 11,37 L 34,37 C 34,37 32,27 32,19 C 27,22 18,22 13,19 Z"
              fill={alphaFill}
              stroke={alphaStroke}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <line x1="22.5" y1="6" x2="22.5" y2="15" stroke={alphaStroke} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="18" y1="9" x2="27" y2="9" stroke={alphaStroke} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="22.5" cy="27" r="3" fill={alphaAccent} />
            <rect x="10" y="37" width="25" height="3" rx="1.5" fill={alphaAccent} />
          </svg>
        );
    }
  }

  // 4. SPATIAL HOLOGRAM / SCI-FI THEME
  if (theme === 'spatial') {
    const spPrimary = isWhite ? '#a855f7' : '#06b6d4';
    const spSecondary = isWhite ? '#ec4899' : '#3b82f6';
    const spFill = isWhite ? 'rgba(168, 85, 247, 0.22)' : 'rgba(6, 182, 212, 0.22)';

    switch (type) {
      case 'p':
        return (
          <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
            <polygon points="22.5,7 28,15 22.5,23 17,15" fill={spFill} stroke={spPrimary} strokeWidth="1.8" />
            <polygon points="17,24 28,24 31,37 14,37" fill={spFill} stroke={spSecondary} strokeWidth="1.8" strokeLinejoin="round" />
            <line x1="12" y1="39" x2="33" y2="39" stroke={spPrimary} strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="22.5" cy="15" r="2" fill={spPrimary} />
          </svg>
        );

      case 'n':
        return (
          <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
            <polygon points="22,7 13,16 11,25 18,24 16,37 32,37 32,22 34,14 26,7" fill={spFill} stroke={spPrimary} strokeWidth="1.8" strokeLinejoin="round" />
            <line x1="13" y1="16" x2="26" y2="24" stroke={spSecondary} strokeWidth="1.5" />
            <circle cx="17" cy="15" r="2" fill={spSecondary} />
            <line x1="12" y1="39" x2="33" y2="39" stroke={spPrimary} strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        );

      case 'b':
        return (
          <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
            <polygon points="22.5,6 30,17 26,37 19,37 15,17" fill={spFill} stroke={spPrimary} strokeWidth="1.8" strokeLinejoin="round" />
            <circle cx="22.5" cy="6" r="2.5" fill={spSecondary} />
            <line x1="22.5" y1="12" x2="22.5" y2="26" stroke={spSecondary} strokeWidth="1.8" />
            <line x1="17" y1="19" x2="28" y2="19" stroke={spSecondary} strokeWidth="1.8" />
            <line x1="12" y1="39" x2="33" y2="39" stroke={spPrimary} strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        );

      case 'r':
        return (
          <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
            <polygon points="12,11 12,18 16,18 16,37 29,37 29,18 33,18 33,11 28,11 28,14 25,14 25,11 20,11 20,14 17,14 17,11" fill={spFill} stroke={spPrimary} strokeWidth="1.8" strokeLinejoin="round" />
            <line x1="16" y1="26" x2="29" y2="26" stroke={spSecondary} strokeWidth="1.8" />
            <line x1="11" y1="39" x2="34" y2="39" stroke={spPrimary} strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        );

      case 'q':
        return (
          <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
            <polygon points="8,15 14,37 31,37 37,15 28,24 22.5,10 17,24" fill={spFill} stroke={spPrimary} strokeWidth="1.8" strokeLinejoin="round" />
            <circle cx="8" cy="14" r="2" fill={spSecondary} />
            <circle cx="17" cy="11" r="2" fill={spSecondary} />
            <circle cx="22.5" cy="8" r="2.5" fill={spSecondary} />
            <circle cx="28" cy="11" r="2" fill={spSecondary} />
            <circle cx="37" cy="14" r="2" fill={spSecondary} />
            <line x1="11" y1="39" x2="34" y2="39" stroke={spPrimary} strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        );

      case 'k':
        return (
          <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
            <polygon points="12,18 15,37 30,37 33,18 22.5,13" fill={spFill} stroke={spPrimary} strokeWidth="1.8" strokeLinejoin="round" />
            <line x1="22.5" y1="4" x2="22.5" y2="12" stroke={spSecondary} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="18" y1="7" x2="27" y2="7" stroke={spSecondary} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="22.5" cy="25" r="3.5" fill="none" stroke={spPrimary} strokeWidth="1.8" />
            <line x1="11" y1="39" x2="34" y2="39" stroke={spPrimary} strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        );
    }
  }

  // 5. MERIDA MASTER THEME (Vintage grandmaster tournament style)
  if (theme === 'merida') {
    const meridaFill = isWhite ? '#fef08a' : '#1e1b4b';
    const meridaStroke = isWhite ? '#854d0e' : '#c084fc';
    const meridaAccent = isWhite ? '#ca8a04' : '#e0e7ff';

    switch (type) {
      case 'p':
        return (
          <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
            <path
              d="M 22.5,9 C 20,9 18,11 18,13.5 C 18,14.5 18.5,15.5 19,16 C 17,17 15,20 15,23 C 15,25 16,27 18,28 C 15,30 12,34 12,38 L 33,38 C 33,34 30,30 27,28 C 29,27 30,25 30,23 C 30,20 28,17 26,16 C 26.5,15.5 27,14.5 27,13.5 C 27,11 25,9 22.5,9 Z"
              fill={meridaFill}
              stroke={meridaStroke}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <line x1="14" y1="38" x2="31" y2="38" stroke={meridaAccent} strokeWidth="2" />
          </svg>
        );

      case 'n':
        return (
          <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
            <path
              d="M 22,9 C 13,10 10,16 9,21 C 8,26 13,26 15,23 C 14,31 12,38 12,38 L 33,38 C 33,38 36,23 35,14 C 34,8 28,8 22,9 Z"
              fill={meridaFill}
              stroke={meridaStroke}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <circle cx="16" cy="15" r="2" fill={isWhite ? '#713f12' : '#ffffff'} />
            <path d="M 18,22 C 20,24 23,24 26,20" stroke={meridaStroke} strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </svg>
        );

      case 'b':
        return (
          <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
            <path
              d="M 22.5,7 C 17,12 15,19 17,26 C 18,30 13,38 13,38 L 32,38 C 32,38 27,30 28,26 C 30,19 28,12 22.5,7 Z"
              fill={meridaFill}
              stroke={meridaStroke}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <circle cx="22.5" cy="6" r="2" fill={meridaAccent} stroke={meridaStroke} strokeWidth="1.2" />
            <line x1="22.5" y1="13" x2="22.5" y2="24" stroke={meridaStroke} strokeWidth="1.8" />
            <line x1="18" y1="17" x2="27" y2="17" stroke={meridaStroke} strokeWidth="1.8" />
          </svg>
        );

      case 'r':
        return (
          <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
            <path
              d="M 11,12 L 11,18 L 15,18 L 15,38 L 30,38 L 30,18 L 34,18 L 34,12 L 29,12 L 29,15 L 26,15 L 26,12 L 19,12 L 19,15 L 16,15 L 16,12 Z"
              fill={meridaFill}
              stroke={meridaStroke}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <line x1="15" y1="24" x2="30" y2="24" stroke={meridaAccent} strokeWidth="1.6" />
          </svg>
        );

      case 'q':
        return (
          <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
            <path
              d="M 8,16 L 13,38 L 32,38 L 37,16 L 29,24 L 22.5,11 L 16,24 Z"
              fill={meridaFill}
              stroke={meridaStroke}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <circle cx="8" cy="14" r="2.2" fill={meridaAccent} stroke={meridaStroke} strokeWidth="1" />
            <circle cx="16" cy="11" r="2.2" fill={meridaAccent} stroke={meridaStroke} strokeWidth="1" />
            <circle cx="22.5" cy="8" r="2.5" fill={meridaAccent} stroke={meridaStroke} strokeWidth="1" />
            <circle cx="29" cy="11" r="2.2" fill={meridaAccent} stroke={meridaStroke} strokeWidth="1" />
            <circle cx="37" cy="14" r="2.2" fill={meridaAccent} stroke={meridaStroke} strokeWidth="1" />
          </svg>
        );

      case 'k':
        return (
          <svg viewBox="0 0 45 45" width={size} height={size} className={className}>
            <path
              d="M 12,18 C 12,26 10,38 10,38 L 35,38 C 35,38 33,26 33,18 C 28,21 17,21 12,18 Z"
              fill={meridaFill}
              stroke={meridaStroke}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <line x1="22.5" y1="5" x2="22.5" y2="14" stroke={meridaStroke} strokeWidth="2.2" strokeLinecap="round" />
            <line x1="18" y1="8" x2="27" y2="8" stroke={meridaStroke} strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="22.5" cy="26" r="3" fill={meridaAccent} stroke={meridaStroke} strokeWidth="1.2" />
          </svg>
        );
    }
  }

  // 6. DEFAULT: CLASSIC STAUNTON (CBURNETT)
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
