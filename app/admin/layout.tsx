'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loggedIn, currentRole, logout, selectedAcademicYear, isInitialized } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Redirect to login if not authenticated or unauthorized role
  React.useEffect(() => {
    if (isInitialized) {
      if (!loggedIn) {
        router.push('/login');
      } else if (currentRole && currentRole !== 'admin') {
        const dest = (currentRole === 'student')
          ? '/student/dashboard'
          : (currentRole === 'teacher' || currentRole === 'faculty')
          ? '/teacher/dashboard'
          : '/evaluator/dashboard';
        router.push(dest);
      }
    }
  }, [loggedIn, currentRole, isInitialized, router]);

  if (!isInitialized) {
    return (
      <div role="status" aria-live="polite" className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" style={{ borderTopColor: 'transparent' }}></div>
        <p className="text-sm font-semibold text-gray-500">Verifying administrator credentials...</p>
        <span className="sr-only">Loading administrator panel</span>
      </div>
    );
  }

  if (!loggedIn || (currentRole && currentRole !== 'admin')) {
    return (
      <div role="status" aria-live="polite" className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" style={{ borderTopColor: 'transparent' }}></div>
        <p className="text-sm font-semibold text-gray-500">Redirecting to authorized portal...</p>
      </div>
    );
  }

  const adminNav = [
    { id: 'years', label: 'Academic Years', href: '/admin/academic-years' },
    { id: 'criteria', label: 'Criteria Management', href: '/admin/criteria' },
    { id: 'groups', label: 'User Groups', href: '/admin/groups' },
    { id: 'evaluators', label: 'Evaluator Management', href: '/admin/evaluators' },
    { id: 'champions', label: 'Previous Champions', href: '/admin/champions' },
    { id: 'departments', label: 'Department Management', href: '/admin/departments' },
    { id: 'rankings', label: 'Class Rankings', href: '/admin/rankings' },
    { id: 'settings', label: 'Settings', href: '/admin/settings' },
  ];

  const currentNav = adminNav.find((i) => pathname === i.href);
  const headerTitle = currentNav ? currentNav.label : 'Academic Years';

  return (
    <div className={`portal-shell-grid ${sidebarCollapsed ? "collapsed" : ""}`}>
      {/* Left Sidebar Navigation */}
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
          <div className="portal-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/Assets/Images/hands_logo.png" alt="Marian Logo" style={{ width: '36px', height: '36px', objectFit: 'contain', flexShrink: 0 }} />
              {!sidebarCollapsed && (
                <div>
                  <h2 className="portal-brand-title" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827' }}>Excellence Grid</h2>
                  <p className="portal-brand-sub" style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF' }}>Evaluation Panel</p>
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
            <ul className="portal-nav-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: 0, margin: 0, listStyle: 'none' }}>
              {adminNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={`portal-nav-btn ${isActive ? 'active' : ''}`}
                      style={{
                        textDecoration: 'none',
                        borderRadius: '9999px',
                        padding: '12px 20px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        display: 'block',
                        transition: 'all 0.2s ease',
                        background: isActive ? '#4F46E5' : 'transparent',
                        color: isActive ? '#ffffff' : '#4B5563',
                        boxShadow: isActive ? '0 4px 12px rgba(79, 70, 229, 0.25)' : 'none'
                      }}
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

        {/* Footer Role Badge */}
        <div className="portal-sidebar-footer" style={{
          border: '1px solid #E5E7EB',
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '16px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto'
        }}>
          <div className="portal-sidebar-footer-text" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.84rem', color: '#374151' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
            Role: Admin
          </div>
          <span className="portal-sidebar-footer-text" style={{
            fontSize: '0.7rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#9CA3AF',
            background: '#F3F4F6',
            padding: '2px 10px',
            borderRadius: '9999px'
          }}>
            Active
          </span>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="portal-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content Area */}
      <div className="portal-content-area" style={{ background: '#F4F7FB', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header Bar Area */}
        <header
          className="portal-topbar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 36px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid #E5E7EB',
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
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#111827', margin: 0, lineHeight: 1.2 }}>{headerTitle}</h1>
              <p style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginTop: '3px', margin: 0 }}>
                Academic Year {selectedAcademicYear || '2026-2027'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a
              href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '')}/admin/`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '9px 20px',
                borderRadius: '9999px',
                fontSize: '0.82rem',
                fontWeight: 800,
                background: '#1B4332',
                color: '#ffffff',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(27, 67, 50, 0.2)',
                transition: 'all 0.2s ease'
              }}
            >
              ⚙ Open Django Administration
            </a>
            <span
              style={{
                padding: '6px 18px',
                borderRadius: '9999px',
                background: '#F3E8FF',
                color: '#9333EA',
                fontSize: '0.8rem',
                fontWeight: 800,
                textTransform: 'capitalize'
              }}
            >
              Admin
            </span>
            <button
              style={{
                padding: '8px 20px',
                borderRadius: '9999px',
                fontSize: '0.82rem',
                fontWeight: 700,
                background: '#ffffff',
                color: '#4B5563',
                border: '1px solid #E5E7EB',
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

        <main style={{ padding: '36px', flex: 1, position: 'relative', zIndex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
