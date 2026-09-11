'use client';

import React from 'react';

export interface ExcellenceLoaderProps {
  /** Size variant: 'sm' (22px), 'md' (44px), 'lg' (72px) */
  size?: 'sm' | 'md' | 'lg';
  /** Optional accessible status label */
  label?: string;
  /** Optional aria-label override */
  ariaLabel?: string;
  /** Whether to show the text label alongside or below the loader */
  showText?: boolean;
  /** Layout direction when text is shown: 'column' | 'row' */
  direction?: 'column' | 'row';
  /** Additional CSS class names */
  className?: string;
  /** Custom style overrides */
  style?: React.CSSProperties;
}

const SIZE_CONFIG = {
  sm: {
    containerSize: 22,
    cellSize: 5.5,
    gap: 2.5,
    borderRadius: 2,
    centerRadius: 3,
    fontSize: '0.78rem',
  },
  md: {
    containerSize: 44,
    cellSize: 11,
    gap: 4.5,
    borderRadius: 3.5,
    centerRadius: 5,
    fontSize: '0.88rem',
  },
  lg: {
    containerSize: 72,
    cellSize: 18,
    gap: 7,
    borderRadius: 5,
    centerRadius: 8,
    fontSize: '1rem',
  },
};

// Sequential delay pattern across the 3x3 grid (center highlighted as anchor)
// Grid layout:
// [0] [1] [2]
// [3] [4] [5]  <- [4] is center
// [6] [7] [8]
const CELL_DELAYS = [
  0.0, 0.15, 0.3,
  0.45, 0.0, 0.6,
  0.75, 0.9, 1.05
];

export const ExcellenceLoader: React.FC<ExcellenceLoaderProps> = ({
  size = 'md',
  label = 'Loading institutional records...',
  ariaLabel,
  showText = false,
  direction = 'column',
  className = '',
  style,
}) => {
  const cfg = SIZE_CONFIG[size] || SIZE_CONFIG.md;
  const effectiveLabel = ariaLabel || label;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={effectiveLabel}
      className={`excellence-loader-wrapper ${className}`}
      style={{
        display: 'inline-flex',
        flexDirection: direction,
        alignItems: 'center',
        justifyContent: 'center',
        gap: size === 'sm' ? '8px' : '14px',
        ...style,
      }}
    >
      <div
        className="excellence-grid-loader"
        style={{
          width: `${cfg.containerSize}px`,
          height: `${cfg.containerSize}px`,
          gap: `${cfg.gap}px`,
        }}
      >
        {CELL_DELAYS.map((delay, index) => {
          const isCenter = index === 4;
          const isCorner = index === 0 || index === 2 || index === 6 || index === 8;

          return (
            <span
              key={index}
              className={`excellence-grid-cell ${isCenter ? 'center-cell' : isCorner ? 'accent' : ''}`}
              style={{
                width: `${cfg.cellSize}px`,
                height: `${cfg.cellSize}px`,
                borderRadius: `${isCenter ? cfg.centerRadius : cfg.borderRadius}px`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
      </div>

      {showText && (
        <span
          style={{
            fontSize: cfg.fontSize,
            fontWeight: 700,
            color: 'var(--text-muted, #64748B)',
            letterSpacing: '0.01em',
            textAlign: 'center',
          }}
        >
          {effectiveLabel}
        </span>
      )}

      {/* Visually hidden for screen readers when showText is false */}
      {!showText && (
        <span
          className="sr-only"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          {effectiveLabel}
        </span>
      )}
    </div>
  );
};
