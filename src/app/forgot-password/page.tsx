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
    <div className={styles.authContainer}>
      {/* ── Background Striped Circles ── */}
      <div className={`${styles.stripedCircle} ${styles.stripedCircleRight}`} />
      <div className={`${styles.stripedCircle} ${styles.stripedCircleBottom}`} />

      <div className={styles.authCard}>
        <div className={styles.logoHeader}>
          <div className={styles.logoIcon}>T</div>
          <h2 className={styles.logoTitle}>Reset Password</h2>
          <p className={styles.logoSubtitle}>Retrieve access to your fleet dashboard</p>
        </div>

        {submitted ? (
          <div>
            <div className={styles.successBanner}>
              📨 An email with instructions has been dispatched to <strong>{email}</strong>.
            </div>
            <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Please check your spam or inbox folders for the recovery link.
            </p>
            <Link href="/login" className="btn btn-secondary" style={{ display: 'block', textAlign: 'center' }}>
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5, textAlign: 'center' }}>
              Enter your registered email address below, and we will send you instructions to reset your password.
            </p>
            
            <div className="form-group">
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
              Remembered password ?
              <Link href="/login" className={styles.authLink}>
                Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
