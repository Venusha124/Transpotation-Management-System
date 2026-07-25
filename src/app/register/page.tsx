'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../Auth.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CUSTOMER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters long');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Redirect depending on registered role
      if (role === 'CUSTOMER') {
        router.push('/dashboard/customer-portal');
      } else if (role === 'DRIVER') {
        router.push('/driver');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
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

      {/* ── Right Side Auth Form ── */}
      <div className={styles.authSide}>
        <div className={styles.authCard}>
          <div className={styles.logoHeader}>
            <div className={styles.logoIcon} style={{ background: 'transparent', padding: 0 }}>
              <img src="/ascendia_logo.png" alt="Ascendia Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '14px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }} />
            </div>
            <h2 className={styles.logoTitle}>Join Ascendia</h2>
            <p className={styles.logoSubtitle}>Create your transportation profile</p>
          </div>

          {error && (
            <div className={styles.errorBanner}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.authLabel} htmlFor="name">Full Name</label>
              <input 
                id="name"
                type="text" 
                className={styles.authInput} 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.authLabel} htmlFor="email">Email Address</label>
              <input 
                id="email"
                type="email" 
                className={styles.authInput} 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. john@example.com"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.authLabel} htmlFor="password">Password</label>
              <input 
                id="password"
                type="password" 
                className={styles.authInput} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.authLabel} htmlFor="role">Functional Role</label>
              <div className={styles.selectWrapper}>
                <select 
                  id="role"
                  className={styles.roleSelect} 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ width: '100%', padding: '14px 16px', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '12px', color: '#ffffff', outline: 'none' }}
                >
                  <option style={{ background: '#0f172a' }} value="CUSTOMER">Customer (Book & Track cargo)</option>
                  <option style={{ background: '#0f172a' }} value="DRIVER">Driver (Manage routes & logs)</option>
                  <option style={{ background: '#0f172a' }} value="ACCOUNTANT">Accountant (Manage billing & invoices)</option>
                  <option style={{ background: '#0f172a' }} value="DISPATCHER">Dispatcher (Schedule trips)</option>
                  <option style={{ background: '#0f172a' }} value="TRANSPORT_MANAGER">Transport Manager (Fleet overview)</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              className={styles.btnSubmit}
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <div className={styles.authFooter}>
            Already have an account?
            <Link href="/login" className={styles.authLink}>
              Sign In here
            </Link>
          </div>
          
          <div className={styles.copyright}>
            © {new Date().getFullYear()} ASCENDIA SOLUTIONS
          </div>
        </div>
      </div>
    </div>
  );
}
