'use client';

import React from 'react';

/**
 * Base single animated skeleton placeholder
 */
export const SkeletonBlock: React.FC<{
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}> = ({ width = '100%', height = '20px', borderRadius = '8px', className = '', style }) => {
  return (
    <div
      className={`excellence-skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        flexShrink: 0,
        ...style,
      }}
    />
  );
};

/**
 * Content-shaped Table Skeleton for submission lists, verification queues, and ranking tables
 */
export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  message?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 4,
  columns = 5,
  showHeader = true,
  message = 'Loading records...',
  className = '',
  style,
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`excellence-table-skeleton ${className}`}
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid rgba(15, 23, 42, 0.08)',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.02)',
        ...style,
      }}
    >
      {/* Header bar */}
      {showHeader && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: '16px',
            paddingBottom: '12px',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          {Array.from({ length: columns }).map((_, i) => (
            <SkeletonBlock key={i} height="16px" width={i === 0 ? '70%' : '55%'} borderRadius="6px" />
          ))}
        </div>
      )}

      {/* Row placeholders */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: '16px',
            alignItems: 'center',
            padding: '10px 0',
            borderBottom: rowIdx === rows - 1 ? 'none' : '1px solid #F1F5F9',
          }}
        >
          {Array.from({ length: columns }).map((_, colIdx) => {
            const widthPct = colIdx === 0 ? '85%' : colIdx === columns - 1 ? '45%' : '65%';
            return <SkeletonBlock key={colIdx} height="18px" width={widthPct} borderRadius="6px" />;
          })}
        </div>
      ))}

      <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        {message}
      </span>
    </div>
  );
};

/**
 * Stat Card Skeleton for dashboard KPIs and summary panels
 */
export interface CardSkeletonProps {
  count?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ count = 3, className = '', style }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`excellence-cards-skeleton ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        width: '100%',
        ...style,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            padding: '24px',
            background: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid rgba(15, 23, 42, 0.08)',
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SkeletonBlock width="45%" height="16px" />
            <SkeletonBlock width="32px" height="32px" borderRadius="10px" />
          </div>
          <SkeletonBlock width="60%" height="36px" borderRadius="8px" />
          <SkeletonBlock width="80%" height="14px" />
        </div>
      ))}
      <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        Loading summary statistics...
      </span>
    </div>
  );
};

/**
 * Podium Skeleton for rankings page (1st, 2nd, 3rd)
 */
export const PodiumSkeleton: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`excellence-podium-skeleton ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        width: '100%',
        ...style,
      }}
    >
      {[2, 1, 3].map((pos) => {
        const height = pos === 1 ? '220px' : pos === 2 ? '190px' : '170px';
        return (
          <div
            key={pos}
            style={{
              height,
              background: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid rgba(15, 23, 42, 0.08)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <SkeletonBlock width="36px" height="36px" borderRadius="12px" />
              <SkeletonBlock width="55%" height="16px" />
            </div>
            <SkeletonBlock width="75%" height="28px" borderRadius="8px" />
            <SkeletonBlock width="40%" height="14px" />
          </div>
        );
      })}
      <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        Computing rankings podium...
      </span>
    </div>
  );
};

/**
 * Standard General Purpose Skeleton (Drop-in replacement for StateViews.LoadingSkeleton)
 */
export const LoadingSkeleton: React.FC<{
  lines?: number;
  height?: string;
  className?: string;
  message?: string;
  showHeader?: boolean;
}> = ({ lines = 3, height = '20px', className = '', message = 'Loading institutional records...', showHeader = true }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`excellence-generic-skeleton ${className}`}
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        width: '100%',
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid rgba(15, 23, 42, 0.08)',
      }}
    >
      {showHeader && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <div
            style={{
              display: 'inline-grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '2px',
              width: '16px',
              height: '16px',
            }}
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <span
                key={i}
                className="excellence-grid-cell"
                style={{ width: '4px', height: '4px', borderRadius: '1px', animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B' }}>{message}</span>
        </div>
      )}

      {Array.from({ length: lines }).map((_, idx) => (
        <SkeletonBlock
          key={idx}
          height={height}
          width={idx === lines - 1 ? '60%' : '100%'}
          borderRadius="8px"
        />
      ))}

      <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        {message}
      </span>
    </div>
  );
};
