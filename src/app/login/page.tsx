'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../Auth.module.css';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      router.push(redirectPath);
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
        router.push('/dashboard/trips');
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
    <div className={styles.authContainer}>
      {/* ── Background Striped Circles ── */}
      <div className={`${styles.stripedCircle} ${styles.stripedCircleRight}`} />
      <div className={`${styles.stripedCircle} ${styles.stripedCircleBottom}`} />

      {/* ── Frosted Glass Card ── */}
      <div className={styles.authCard}>
        <div className={styles.logoHeader}>
          <div className={styles.logoIcon}>T</div>
          <h2 className={styles.logoTitle}>Login</h2>
          <p className={styles.logoSubtitle}>Transportation Management System</p>
        </div>

        {error && (
          <div className={styles.errorBanner}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="form-group">
            <label className={styles.authLabel} htmlFor="email">
              Username or email
            </label>
            <input
              id="email"
              type="email"
              className={styles.authInput}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@tms.com"
              required
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <div className={styles.labelRow}>
              <label className={styles.authLabel} htmlFor="password">
                Password
              </label>
              <Link href="/forgot-password" className={styles.forgotLink}>
                Forgot password ?
              </Link>
            </div>
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={styles.authInput}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ paddingRight: '44px' }}
                required
              />
              <button
                type="button"
                className={styles.eyeToggle}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  /* Eye-off SVG */
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  /* Eye SVG */
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.btnSubmit}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>

        <div className={styles.authFooter}>
          Don&apos;t have an account ?
          <Link href="/register" className={styles.authLink}>
            Sign up
          </Link>
        </div>

        {/* ── Demo Fast Login ── */}
        <div className={styles.demoSection}>
          <p className={styles.demoLabel}>Quick Demo Accounts</p>
          <div className={styles.demoGrid}>
            <button
              className={styles.demoBtn}
              onClick={() => handleQuickLogin('admin@tms.com')}
              disabled={loading}
            >
              👑 Admin
            </button>
            <button
              className={styles.demoBtn}
              onClick={() => handleQuickLogin('dispatcher@tms.com')}
              disabled={loading}
            >
              ⚡ Dispatcher
            </button>
            <button
              className={styles.demoBtn}
              onClick={() => handleQuickLogin('driver@tms.com')}
              disabled={loading}
            >
              🚛 Driver
            </button>
            <button
              className={styles.demoBtn}
              onClick={() => handleQuickLogin('customer@tms.com')}
              disabled={loading}
            >
              👤 Customer
            </button>
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
        Loading TMS Portal...
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
