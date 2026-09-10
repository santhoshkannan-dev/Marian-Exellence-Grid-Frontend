'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export default function EvaluatorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loggedIn, currentRole, logout, selectedAcademicYear, isInitialized, hasDualRole, switchRole } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Redirect to login if not authenticated or unauthorized role
  React.useEffect(() => {
    if (isInitialized) {
      if (!loggedIn) {
        router.push('/login');
      } else if (currentRole && currentRole !== 'evaluator' && currentRole !== 'evaluation' && currentRole !== 'admin' && !hasDualRole) {
        const dest = (currentRole === 'student') ? '/student/dashboard' : '/teacher/dashboard';
        router.push(dest);
      }
    }
  }, [loggedIn, currentRole, isInitialized, hasDualRole, router]);

  if (!isInitialized) {
    return (
      <div role="status" aria-live="polite" className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" style={{ borderTopColor: 'transparent' }}></div>
        <p className="text-sm font-semibold text-gray-500">Verifying evaluator credentials...</p>
        <span className="sr-only">Loading evaluator portal</span>
      </div>
    );
  }

  if (!loggedIn || (currentRole && currentRole !== 'evaluator' && currentRole !== 'evaluation' && currentRole !== 'admin')) {
    return (
      <div role="status" aria-live="polite" className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" style={{ borderTopColor: 'transparent' }}></div>
        <p className="text-sm font-semibold text-gray-500">Redirecting to authorized portal...</p>
      </div>
    );
  }

  const evaluatorNav = [
    { id: 'dashboard', label: 'Dashboard', href: '/evaluator/dashboard' },
    { id: 'evaluation', label: 'Evaluation', href: '/evaluator/evaluation' },
  ];

  const currentNav = evaluatorNav.find((i) => pathname === i.href);
  const headerTitle = currentNav ? currentNav.label : 'Evaluator Dashboard';

  return (
    <div className={`portal-shell-grid ${sidebarCollapsed ? "collapsed" : ""}`}>
      <aside className={`portal-sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <button
          className="mobile-sidebar-close"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close Navigation"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div>
          <div className="portal-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/Assets/Images/hands_logo.png" alt="Marian Logo" style={{ width: '36px', height: '36px', objectFit: 'contain', flexShrink: 0 }} />
              {!sidebarCollapsed && (
                <div>
                  <h2 className="portal-brand-title">Excellence Grid</h2>
                  <p className="portal-brand-sub">Evaluation Panel</p>
                </div>
              )}
            </div>
            <button
              className="sidebar-toggle-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              aria-label="Toggle Sidebar"
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#475569',
                flexShrink: 0
              }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                {sidebarCollapsed ? (
                  <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
                ) : (
                  <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
                )}
              </svg>
            </button>
          </div>

          <nav>
            <ul className="portal-nav-list">
              {evaluatorNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={`portal-nav-btn ${isActive ? 'active' : ''}`}
                      style={{ textDecoration: 'none' }}
                      onClick={() => setSidebarOpen(false)}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <span className="portal-nav-text">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="portal-sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="portal-sidebar-footer-text">Evaluator</div>
          <button
            className="btn btn-secondary btn-sm mobile-logout-btn"
            style={{
              width: '100%',
              marginTop: '6px',
              padding: '6px',
              fontSize: '0.8rem',
              background: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fca5a5'
            }}
            onClick={() => {
              logout();
              router.push('/login');
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="portal-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="portal-content-area">
        <div
          style={{
            position: 'fixed',
            bottom: '-10%',
            right: '-5%',
            width: '650px',
            height: '650px',
            backgroundImage: 'url("/Assets/Images/hands_logo.png")',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            opacity: 0.06,
            filter: 'blur(3px)',
            pointerEvents: 'none',
            zIndex: 0
          }}
        />

        <header className="portal-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="mobile-menu-toggle"
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth <= 768) {
                  setSidebarOpen(!sidebarOpen);
                } else {
                  setSidebarCollapsed(!sidebarCollapsed);
                }
              }}
              title="Toggle Sidebar"
              aria-label="Toggle Navigation"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>{headerTitle}</h1>
              <p className="muted" style={{ fontSize: '0.84rem' }}>Academic Year {selectedAcademicYear || '2025-2026'}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {hasDualRole && (
              <button
                type="button"
                onClick={() => switchRole('teacher')}
                style={{
                  padding: '7px 16px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                  transition: 'all 0.2s ease'
                }}
                title="Switch to Class Teacher View"
              >
                <span>🔄</span>
                <span>Switch to Class Teacher View</span>
              </button>
            )}
            <span
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                background: '#e0e7ff',
                color: '#3730a3',
                fontSize: '0.84rem',
                fontWeight: 700,
                textTransform: 'capitalize'
              }}
            >
              Evaluator
            </span>
            <button
              className="btn btn-secondary"
              style={{ padding: '8px 18px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 700 }}
              onClick={() => {
                logout();
                router.push('/login');
              }}
            >
              Logout
            </button>
          </div>
        </header>

        <main style={{ padding: '36px', flex: 1, position: 'relative', zIndex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
