'use client';

import React from 'react';
import { ExcellenceLoader } from './ExcellenceLoader';

export interface LoadingOverlayProps {
  /** Optional contextual loading message */
  message?: string;
  /** Size of the loader: 'sm' | 'md' */
  size?: 'sm' | 'md';
  /** Positioning mode: 'absolute' (covers container) | 'relative' (renders inline in container) */
  mode?: 'absolute' | 'relative';
  /** Background color override (default: translucent card blur) */
  background?: string;
  /** Minimum height when rendered in relative mode */
  minHeight?: string | number;
  /** Additional CSS class names */
  className?: string;
  /** Custom style overrides */
  style?: React.CSSProperties;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Loading performance data...',
  size = 'md',
  mode = 'absolute',
  background = 'rgba(255, 255, 255, 0.82)',
  minHeight = '140px',
  className = '',
  style,
}) => {
  const isAbsolute = mode === 'absolute';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`excellence-loading-overlay ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background,
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        borderRadius: 'inherit',
        zIndex: 40,
        animation: 'excellenceFadeIn 0.2s ease-out forwards',
        ...(isAbsolute
          ? {
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
            }
          : {
              position: 'relative',
              width: '100%',
              minHeight,
            }),
        ...style,
      }}
    >
      <ExcellenceLoader size={size} label={message} showText={true} />
    </div>
  );
};
