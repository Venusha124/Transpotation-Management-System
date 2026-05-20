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

      <div className={styles.authCard}>
        <div className={styles.logoHeader}>
          <div className={styles.logoIcon}>T</div>
          <h2 className={styles.logoTitle}>Join TMS</h2>
          <p className={styles.logoSubtitle}>Create your transportation profile</p>
        </div>

        {error && (
          <div className={styles.errorBanner}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
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

          <div className="form-group">
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

          <div className="form-group">
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

          <div className="form-group">
            <label className="form-label" htmlFor="role">Functional Role</label>
            <div className={styles.selectWrapper}>
              <select 
                id="role"
                className={styles.roleSelect} 
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="CUSTOMER">Customer (Book & Track cargo)</option>
                <option value="DRIVER">Driver (Manage routes & logs)</option>
                <option value="ACCOUNTANT">Accountant (Manage billing & invoices)</option>
                <option value="DISPATCHER">Dispatcher (Schedule trips & approve bookings)</option>
                <option value="TRANSPORT_MANAGER">Transport Manager (Fleet overview)</option>
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
          Already have an account ?
          <Link href="/login" className={styles.authLink}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
