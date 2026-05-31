'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from '../Auth.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Mock verification delay
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
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

      {/* ── Right Side Auth Form ── */}
      <div className={styles.authSide}>
        <div className={styles.authCard}>
          <div className={styles.logoHeader}>
            <div className={styles.logoIcon} style={{ background: 'transparent', padding: 0 }}>
              <img src="/ascendia_logo.png" alt="Ascendia Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '14px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }} />
            </div>
            <h2 className={styles.logoTitle}>Reset Password</h2>
            <p className={styles.logoSubtitle}>Retrieve access to your fleet dashboard</p>
          </div>

          {submitted ? (
            <div>
              <div className={styles.successBanner} style={{ background: 'rgba(56, 189, 248, 0.1)', borderLeft: '3px solid #38bdf8', color: '#7dd3fc', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' }}>
                📨 An email with instructions has been dispatched to <strong>{email}</strong>.
              </div>
              <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
                Please check your spam or inbox folders for the recovery link.
              </p>
              <Link href="/login" className={styles.btnSubmit} style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: 1.5, textAlign: 'center' }}>
                Enter your registered email address below, and we will send you instructions to reset your password.
              </p>
              
              <div className={styles.formGroup}>
                <label className={styles.authLabel} htmlFor="email">Email Address</label>
                <input 
                  id="email"
                  type="email" 
                  className={styles.authInput} 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>

              <button 
                type="submit" 
                className={styles.btnSubmit}
                disabled={loading}
              >
                {loading ? 'Dispatched Request...' : 'Send Password Reset Link'}
              </button>

              <div className={styles.authFooter}>
                Remembered password?
                <Link href="/login" className={styles.authLink}>
                  Sign In
                </Link>
              </div>
            </form>
          )}

          <div className={styles.copyright}>
            © {new Date().getFullYear()} ASCENDIA SOLUTIONS
          </div>
        </div>
      </div>
    </div>
  );
}
