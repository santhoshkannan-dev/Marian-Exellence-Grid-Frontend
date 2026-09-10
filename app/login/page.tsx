'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export default function LoginPage() {
  const router = useRouter();
  const { loggedIn, currentRole, loginWithGoogleToken, loginBypass } = useApp();
  const [selectedBypassEmail, setSelectedBypassEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Allow user to view login page without forced auto-redirection

  // Load Google Identity Services SDK
  useEffect(() => {
    const initGoogleSignIn = () => {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        console.warn('Google Client ID is not configured in NEXT_PUBLIC_GOOGLE_CLIENT_ID.');
        return;
      }
      if ((window as any).google && (window as any).google.accounts) {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
        });
        const btnContainer = document.getElementById('google-signin-btn');
        if (btnContainer) {
          (window as any).google.accounts.id.renderButton(
            btnContainer,
            {
              theme: 'filled_blue',
              size: 'large',
              width: 320,
              text: 'signin_with',
              shape: 'pill'
            }
          );
        }
      }
    };

    if (typeof window !== 'undefined') {
      if ((window as any).google) {
        initGoogleSignIn();
      } else {
        const existingScript = document.getElementById('google-gsi-script');
        if (!existingScript) {
          const script = document.createElement('script');
          script.src = 'https://accounts.google.com/gsi/client';
          script.id = 'google-gsi-script';
          script.async = true;
          script.defer = true;
          script.onload = initGoogleSignIn;
          document.body.appendChild(script);
        } else {
          existingScript.addEventListener('load', initGoogleSignIn);
        }
      }
    }
  }, []);

  const handleGoogleCredentialResponse = async (response: any) => {
    setErrorMsg('');
    setLoading(true);
    const result = await loginWithGoogleToken(response.credential);
    setLoading(false);
    if (result.success) {
      const targetRole = ((result as any).user?.role || currentRole || 'student').toLowerCase();
      if (targetRole === 'student') router.push('/student/dashboard');
      else if (targetRole === 'teacher' || targetRole === 'faculty') router.push('/teacher/dashboard');
      else if (targetRole === 'admin') router.push('/admin/academic-years');
      else if (targetRole === 'evaluator' || targetRole === 'evaluation') router.push('/evaluator/dashboard');
    } else {
      setErrorMsg(result.error || 'Google Sign-In failed.');
    }
  };

  const handleBypassLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBypassEmail) {
      setErrorMsg('Please select a profile to bypass authentication.');
      return;
    }

    let emailToUse = selectedBypassEmail;
    let overrideRole = undefined;
    if (selectedBypassEmail.startsWith('{')) {
      try {
        const parsed = JSON.parse(selectedBypassEmail);
        emailToUse = parsed.email;
        overrideRole = parsed.role;
      } catch (e) {
        // Fallback to raw string
      }
    }

    setErrorMsg('');
    setLoading(true);
    const result = await loginBypass(emailToUse, overrideRole);
    setLoading(false);
    if (result.success) {
      const targetRole = ((result as any).user?.role || overrideRole || 'student').toLowerCase();
      if (targetRole === 'student') router.push('/student/dashboard');
      else if (targetRole === 'teacher' || targetRole === 'faculty') router.push('/teacher/dashboard');
      else if (targetRole === 'admin') router.push('/admin/academic-years');
      else if (targetRole === 'evaluator' || targetRole === 'evaluation') router.push('/evaluator/dashboard');
    } else {
      setErrorMsg(result.error || 'Bypass authentication failed.');
    }
  };

  return (
    <div className="login-page-container">
      <main className="login-layout">
        {/* Left Visual Card */}
        <section className="login-visual">
          <div className="visual-copy">
            <p className="visual-kicker">MARIAN COLLEGE, KUTTIKKANAM</p>
            <h1 className="visual-title">Marian Excellence Grid</h1>
            <p className="visual-lead">Recognize. Evaluate. Excel together.</p>
            <p className="visual-desc">
              A smart way to track, verify and celebrate class achievements across Marian College Kuttikkanam.
            </p>
            <p className="visual-tagline">SIMPLE. SMART. EFFECTIVE.</p>
          </div>
        </section>

        {/* Right Form Card */}
        <section className="login-panel">
          <div className="login-card" style={{ padding: '40px 30px' }}>
            <img className="card-logo" src="/Assets/Images/hands_logo.png" alt="Marian Logo" style={{ maxHeight: '100px', margin: '0 auto 20px auto', objectFit: 'contain' }} />

            <div className="card-heading" style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>Portal Access</h2>
              <p className="muted" style={{ fontSize: '0.86rem' }}>Sign in using your official institution account</p>
            </div>

            {errorMsg && (
              <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#b91c1c', borderRadius: '10px', marginBottom: '20px', fontSize: '0.84rem', fontWeight: 600, border: '1px solid #fca5a5' }}>
                {errorMsg}
              </div>
            )}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: 'rgba(99, 102, 241, 0.05)', color: 'var(--primary)', borderRadius: '10px', marginBottom: '20px', fontSize: '0.86rem', fontWeight: 600 }}>
                <span className="spinner" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span>Authenticating with server...</span>
              </div>
            )}

            {/* Google OAuth Login Button */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
              <div id="google-signin-btn" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}></div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                Only accounts ending with <strong>@mariancollege.org</strong> are authorized.
              </p>
            </div>

            {/* Divider for Bypass Mode */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', marginBottom: '24px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.08)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Development Bypass</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.08)' }} />
            </div>

            {/* Bypass Form */}
            <form onSubmit={handleBypassLogin}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="bypass-email-select">SELECT ROLE</label>
                <div className="select-wrapper">
                  <select
                    id="bypass-email-select"
                    value={selectedBypassEmail}
                    onChange={(e) => {
                      setSelectedBypassEmail(e.target.value);
                      setErrorMsg('');
                    }}
                    required
                  >
                    <option value="" disabled>Select your role</option>
                    <option value="santhosh.25pmc152@mariancollege.org">Student/DQC Rep (santhosh.25pmc152 - II MCA)</option>
                    <option value="amal.25pmc114@mariancollege.org">PG Student (amal.25pmc114 - II MCA)</option>
                    <option value="santhosh.25ubc154@mariancollege.org">UG Student (santhosh.25ubc154 - II BCA A)</option>
                    <option value="kochumol.abraham@mariancollege.org">Class Teacher / Faculty (Kochumol Abraham)</option>
                    <option value="allen.george@mariancollege.org">Evaluator (Allen George)</option>
                    <option value="admin@mariancollege.org">Institutional Admin (admin@mariancollege.org)</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-continue" disabled={loading} style={{ width: '100%', height: '48px', justifyContent: 'center' }}>
                <span>Bypass & Log In</span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </form>

            <div className="card-accent" style={{ marginTop: '24px' }}>
              <span className="accent-line"></span>
              <span className="accent-diamond"></span>
              <span className="accent-line"></span>
            </div>
          </div>
        </section>
      </main>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
