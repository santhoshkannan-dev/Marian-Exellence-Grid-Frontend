'use client';

import React from 'react';
import Image from 'next/image';
import { ExcellenceLoader } from './ExcellenceLoader';

export interface LoadingScreenProps {
  /** Primary status headline */
  message?: string;
  /** Secondary contextual subtitle or guidance */
  subtitle?: string;
  /** Optional custom logo image path (defaults to institutional hands logo) */
  logoSrc?: string;
  /** Custom background override if needed */
  background?: string;
  /** Additional CSS class names */
  className?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Preparing your workspace...',
  subtitle = 'Marian Excellence Grid — Marian College Kuttikkanam (Autonomous)',
  logoSrc = '/Assets/Images/hands_logo_zoomed.png',
  background,
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`excellence-loading-screen ${className}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        padding: '24px',
        background:
          background ||
          'radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.08) 0%, transparent 60%), linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #F8FAFC 100%)',
        animation: 'excellenceFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        userSelect: 'none',
      }}
    >
      {/* Brand Crest & Logo */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '28px',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: '#FFFFFF',
            padding: '8px',
            boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.18), 0 0 0 1px rgba(15, 23, 42, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            src={logoSrc}
            alt="Marian Excellence Grid"
            width={48}
            height={48}
            priority
            style={{ objectFit: 'contain' }}
          />
        </div>
      </div>

      {/* Signature 3x3 Animated Excellence Pulse Grid */}
      <div style={{ marginBottom: '24px' }}>
        <ExcellenceLoader size="lg" label={message} />
      </div>

      {/* Primary Message */}
      <h2
        style={{
          fontSize: '1.12rem',
          fontWeight: 800,
          color: 'var(--text-main, #0F172A)',
          margin: '0 0 8px 0',
          textAlign: 'center',
          letterSpacing: '-0.01em',
        }}
      >
        {message}
      </h2>

      {/* Institutional Subtitle */}
      {subtitle && (
        <p
          style={{
            fontSize: '0.82rem',
            color: 'var(--text-muted, #64748B)',
            margin: '0 0 20px 0',
            textAlign: 'center',
            maxWidth: '420px',
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </p>
      )}

      {/* Subtle Institutional Scan / Progress Bar */}
      <div
        style={{
          width: '180px',
          height: '3px',
          borderRadius: '9999px',
          background: 'rgba(99, 102, 241, 0.15)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          className="excellence-scan-bar"
          style={{
            width: '45%',
            height: '100%',
            background: 'linear-gradient(90deg, var(--primary, #4F46E5), var(--secondary, #DB2777))',
            borderRadius: '9999px',
            animation: 'excellenceScanLine 1.8s ease-in-out infinite',
          }}
        />
      </div>

      {/* Screen Reader Announcements */}
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
        {message}. {subtitle}
      </span>
    </div>
  );
};
