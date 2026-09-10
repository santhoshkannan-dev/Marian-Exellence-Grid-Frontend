'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export const NavSidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { submissionOpen, submissionWindowStart, submissionWindowEnd, activeAcademicYear } = useApp();

  const handleNavigate = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(path);
  };

  // Format date helper for tooltip
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return null;
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  const windowPeriodText = submissionWindowStart || submissionWindowEnd
    ? ` [${formatDateTime(submissionWindowStart) || 'Immediately'} → ${formatDateTime(submissionWindowEnd) || 'Open'}]`
    : '';

  const tooltipText = `Submission Window: ${submissionOpen ? 'OPEN' : 'CLOSED'}${windowPeriodText} (${activeAcademicYear || '2025-2026'})`;

  // Hide floating sidebar inside portal workspaces to prevent double sidebar overlap
  const isPortalRoute = ['/student', '/teacher', '/admin', '/evaluator'].some(
    (prefix) => pathname.startsWith(prefix)
  );

  if (isPortalRoute) {
    return null;
  }

  return (
    <aside className="nav-sidebar" aria-label="Quick Navigation">
      <div className="nav-line" aria-hidden="true"></div>

      {/* 1. Home */}
      <Link
        href="/"
        id="btn-nav-home"
        className={`nav-btn ${pathname === '/' ? 'active' : ''}`}
        data-tooltip="Home/Dashboard"
        aria-label="Home/Dashboard"
        onClick={handleNavigate('/')}
      >
        <img src="/Assets/Images/hands_logo.png" alt="Marian Logo" style={{ pointerEvents: 'none' }} />
      </Link>

      {/* 2. Login */}
      <Link
        href="/login"
        id="btn-nav-login"
        className={`nav-btn ${pathname === '/login' ? 'active' : ''}`}
        data-tooltip="Login"
        aria-label="Login"
        onClick={handleNavigate('/login')}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }}>
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" x2="3" y1="12" y2="12" />
        </svg>
      </Link>

      {/* 3. Criteria */}
      <Link
        href="/policy"
        id="btn-nav-policy"
        className={`nav-btn ${pathname === '/policy' ? 'active' : ''}`}
        data-tooltip="Policy Criteria"
        aria-label="Policy Criteria"
        onClick={handleNavigate('/policy')}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </Link>

      {/* 4. Submission Window Status (under Policy Criteria button) */}
      <div
        className="nav-btn"
        data-tooltip={tooltipText}
        aria-label="Submission Window Status"
        style={{
          position: 'relative',
          cursor: 'pointer',
          border: submissionOpen ? '2px solid rgba(34, 197, 94, 0.5)' : '2px solid rgba(239, 68, 68, 0.5)',
          background: submissionOpen ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)'
        }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={submissionOpen ? "#16a34a" : "#dc2626"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {/* Glowing Status Dot */}
          <span
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: submissionOpen ? '#22c55e' : '#ef4444',
              boxShadow: submissionOpen ? '0 0 6px #22c55e' : '0 0 6px #ef4444'
            }}
          />
        </div>
      </div>
    </aside>
  );
};