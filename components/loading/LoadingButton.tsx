'use client';

import React from 'react';
import { ExcellenceLoader } from './ExcellenceLoader';

export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether the action is currently in progress */
  loading?: boolean;
  /** Optional loading text (defaults to showing spinner alongside or replacing text) */
  loadingText?: string;
  /** Button visual variant (inherits CSS classes) */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText,
  disabled,
  children,
  className = '',
  style,
  type = 'button',
  variant,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading ? 'true' : 'false'}
      className={`btn-loading-wrapper ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        position: 'relative',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? (loading ? 0.9 : 0.6) : 1,
        ...style,
      }}
      {...rest}
    >
      {loading && (
        <ExcellenceLoader
          size="sm"
          label={loadingText || 'Action in progress...'}
          style={{ flexShrink: 0 }}
        />
      )}

      <span>{loading && loadingText ? loadingText : children}</span>
    </button>
  );
};
