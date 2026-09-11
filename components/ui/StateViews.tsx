'use client';

import React from 'react';
import { ExcellenceLoader } from '@/components/loading';

/**
 * Reusable Loading Skeleton for tables, lists, and cards
 */
export const LoadingSkeleton: React.FC<{
  lines?: number;
  height?: string;
  className?: string;
  message?: string;
}> = ({ lines = 3, height = '20px', className = '', message = 'Loading institutional records...' }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`state-loading-container ${className}`}
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <ExcellenceLoader size="sm" label={message} />
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B' }}>{message}</span>
      </div>

      {Array.from({ length: lines }).map((_, idx) => (
        <div
          key={idx}
          style={{
            height,
            width: idx === lines - 1 ? '60%' : '100%',
            background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
            backgroundSize: '200% 100%',
            borderRadius: '8px',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ))}
      <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>
        Loading
      </span>
    </div>
  );
};

/**
 * Empty state view with icon, title, description, and optional action
 */
export const EmptyState: React.FC<{
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}> = ({ title, description, icon, action }) => {
  return (
    <div
      role="region"
      aria-label={title}
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1.5px dashed #CBD5E1',
        margin: '20px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icon ? (
        <div style={{ marginBottom: '16px', color: '#94A3B8' }}>{icon}</div>
      ) : (
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: '#F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            color: '#64748B',
            fontSize: '1.25rem',
            fontWeight: 800,
          }}
        >
          📂
        </div>
      )}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E293B', margin: '0 0 6px 0' }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.85rem', color: '#64748B', maxWidth: '440px', margin: '0 0 20px 0', lineHeight: 1.5 }}>
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            padding: '10px 24px',
            borderRadius: '9999px',
            background: 'var(--primary, #4F46E5)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.85rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
            transition: 'all 0.2s ease',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

/**
 * Standardized Error Banner with retry option
 */
export const ErrorBanner: React.FC<{
  message: string;
  onRetry?: () => void;
  title?: string;
}> = ({ message, onRetry, title = 'Unable to Load Records' }) => {
  return (
    <div
      role="alert"
      style={{
        padding: '16px 20px',
        borderRadius: '12px',
        background: '#FEF2F2',
        border: '1.5px solid #FCA5A5',
        color: '#991B1B',
        margin: '16px 0',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', gap: '12px' }}>
        <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>⚠️</span>
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.92rem', fontWeight: 800, color: '#991B1B' }}>
            {title}
          </h4>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#B91C1C', lineHeight: 1.4 }}>
            {message}
          </p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            background: '#FFFFFF',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
};
