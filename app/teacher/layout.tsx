'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    loggedIn,
    logout,
    selectedAcademicYear,
    isInitialized,
    currentRole,
    currentUserInfo,
    isClassTeacher,
    isEvaluator,
    assignedClassName,
    switchRole,
  } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Redirect to login if not authenticated, or restrict pure evaluators (non-class-teachers) to evaluator dashboard
  React.useEffect(() => {
    if (isInitialized && !loggedIn) {
      router.push('/login');
    } else if (
      isInitialized &&
      loggedIn &&
      currentRole !== 'class_teacher' &&
      !isClassTeacher &&
      (currentRole === 'evaluator' || currentRole === 'evaluation' || currentUserInfo?.role === 'evaluation')
    ) {
      // Only pure evaluators (not class teachers) should be redirected
      router.push('/evaluator/dashboard');
    }
  }, [loggedIn, isInitialized, currentRole, currentUserInfo, isClassTeacher, router]);

  if (!isInitialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!loggedIn || (currentRole !== 'class_teacher' && !isClassTeacher && (currentRole === 'evaluator' || currentRole === 'evaluation' || currentUserInfo?.role === 'evaluation'))) {
    return null;
  }

  const teacherNav = [
    { id: 'dashboard', label: 'Dashboard', href: '/teacher/dashboard' },
    { id: 'verification', label: 'Verification Desk', href: '/teacher/verification' },
    { id: 'student-management', label: 'Student Management', href: '/teacher/student-management' },
    { id: 'profile', label: 'My Profile', href: '/teacher/profile' },
  ];

  const currentNav = teacherNav.find((i) => pathname === i.href);
  const headerTitle = currentNav ? (currentNav.id === 'dashboard' ? 'Dashboard' : currentNav.label) : 'Dashboard';

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
              {teacherNav.map((item) => {
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
          <div className="portal-sidebar-footer-text" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
            Class Teacher
          </div>
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

      <div className="portal-content-area" style={{ background: '#f8fafc' }}>
        <header
          className="portal-topbar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 40px',
            background: '#ffffff',
            borderBottom: '1px solid #f1f5f9',
            position: 'sticky',
            top: 0,
            zIndex: 20
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{headerTitle}</h1>
              <p style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
                Academic Year {selectedAcademicYear || '2026–2027'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {(isEvaluator || currentUserInfo?.available_roles?.includes('evaluator') || currentUserInfo?.role === 'evaluation') && (
              <button
                id="role-switch-to-evaluator-btn"
                className="role-switcher-btn"
                onClick={() => {
                  switchRole('evaluator');
                  router.push('/evaluator/dashboard');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 16px',
                  borderRadius: '10px',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                  color: '#ffffff',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                title="Switch to Central Evaluator View"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Switch to Evaluator
              </button>
            )}
            <span
              style={{
                padding: '7px 20px',
                borderRadius: '9999px',
                background: '#d1fae5',
                color: '#047857',
                fontSize: '0.86rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              Class Teacher{assignedClassName ? ` • ${assignedClassName}` : ''}
            </span>
            <button
              className="btn"
              style={{
                padding: '8px 22px',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontWeight: 600,
                background: '#ffffff',
                color: '#0f172a',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => {
                logout();
                router.push('/login');
              }}
            >
              Logout
            </button>
          </div>
        </header>

        <main style={{ padding: '36px 40px', flex: 1, position: 'relative', zIndex: 1, maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
