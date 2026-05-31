'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../Auth.module.css';
import { isValidEmail, isValidPassword } from '../../lib/validators';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validateFields = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    const emailCheck = isValidEmail(email);
    const passCheck = isValidPassword(password);
    if (!emailCheck.valid) errors.email = emailCheck.message;
    if (!passCheck.valid) errors.password = passCheck.message;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateFields()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid email or password.');
      let defaultPath = '/dashboard';
      if (data.user.role === 'CUSTOMER') {
        defaultPath = '/dashboard/customer-portal';
      } else if (data.user.role === 'DRIVER') {
        defaultPath = '/dashboard/route-runs';
      } else if (data.user.role === 'CONDUCTOR') {
        defaultPath = '/dashboard/conductor';
      }
      router.push(searchParams.get('redirect') || defaultPath);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Helper for quick logging in during system test evaluation
  const handleQuickLogin = async (roleEmail: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: roleEmail, password: 'password123' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Redirect depending on the role
      if (data.user.role === 'CUSTOMER') {
        router.push('/dashboard/customer-portal');
      } else if (data.user.role === 'DRIVER') {
        router.push('/dashboard/route-runs');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className={styles.splitContainer}>
      {/* ── Left Side: Visual Showcase ── */}
      <div className={styles.imageShowcase}>
        <div className={styles.techOverlay}></div>
        <div className={styles.scannerLine}></div>
        
        <div className={styles.brandWatermark}>
          <h1>Ascendia</h1>
          <p>Next-Gen Transport Logistics</p>
        </div>
      </div>

      {/* ── Right Side: Auth Panel ── */}
      <div className={styles.authSide}>
        <div className={styles.authCard}>
          <div className={styles.logoHeader}>
            <div className={styles.logoIcon}>
              <img src="/ascendia_logo.png" alt="Ascendia Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <h2 className={styles.logoTitle}>Welcome Back</h2>
            <p className={styles.logoSubtitle}>Enter your credentials to access the portal</p>
          </div>

          {error && (
            <div className={styles.errorBanner}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <label className={styles.authLabel} htmlFor="email">Email Address</label>
              </div>
              <div className={styles.inputWrapper}>
                <input
                  id="email"
                  type="text"
                  className={styles.authInput}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: undefined })); }}
                  onBlur={() => { const r = isValidEmail(email); if (!r.valid) setFieldErrors(p => ({ ...p, email: r.message })); }}
                  placeholder="e.g. admin@tms.com"
                  style={fieldErrors.email ? { borderColor: '#ef4444', boxShadow: '0 0 0 2px rgba(239,68,68,0.2)' } : {}}
                />
              </div>
              {fieldErrors.email && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', display: 'block' }}>{fieldErrors.email}</span>}
            </div>

            {/* Password */}
            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <label className={styles.authLabel} htmlFor="password">Password</label>
                <Link href="/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
              </div>
              <div className={`${styles.inputWrapper} ${styles.passwordWrapper}`}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={styles.authInput}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: undefined })); }}
                  onBlur={() => { const r = isValidPassword(password); if (!r.valid) setFieldErrors(p => ({ ...p, password: r.message })); }}
                  placeholder="••••••••"
                  style={fieldErrors.password ? { borderColor: '#ef4444', boxShadow: '0 0 0 2px rgba(239,68,68,0.2)' } : {}}
                />
                <button
                  type="button"
                  className={styles.eyeToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', display: 'block' }}>{fieldErrors.password}</span>}
            </div>

            <button type="submit" className={styles.btnSubmit} disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className={styles.authFooter}>
            Don&apos;t have an account?
            <Link href="/register" className={styles.authLink}>
              Create one now
            </Link>
          </div>
          
          <div className={styles.copyright}>
            &copy; {new Date().getFullYear()} ASCENDIA SOLUTIONS
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: '40vh', fontSize: '14px' }}>
        Loading Ascendia Portal...
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
