'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { ExcellenceLoader } from '@/components/loading';

export default function LoginPage() {
  const router = useRouter();
  const { loggedIn, currentRole, loginWithGoogleToken } = useApp();
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
              <div 
                role="status" 
                aria-live="polite"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px', background: 'rgba(99, 102, 241, 0.05)', color: 'var(--primary)', borderRadius: '10px', marginBottom: '20px', fontSize: '0.86rem', fontWeight: 600 }}
              >
                <ExcellenceLoader size="sm" ariaLabel="Authenticating" />
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
