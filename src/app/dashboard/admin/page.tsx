'use client';

import React, { useEffect, useState } from 'react';
import { Settings, ShieldAlert, Users, ClipboardList } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
}

export default function AdminPanelPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAdminData = async () => {
    try {
      const res = await fetch('/api/admin');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setLogs(data.auditLogs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setError('');
    try {
      const res = await fetch('/api/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      fetchAdminData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading system configurations...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-content animate-fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>System Administration Panel</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
          Configure user roles (RBAC) and audit the global telemetry registers
        </p>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px' }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        
        {/* User Gating Section */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="var(--primary)" /> Registered Accounts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '420px', overflowY: 'auto' }}>
            {users.map((u) => (
              <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)', borderRadius: '10px' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.email}</span>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <select 
                    className="form-input" 
                    style={{ fontSize: '11px', padding: '6px 12px', width: 'auto', background: 'rgba(0,0,0,0.3)' }}
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="TRANSPORT_MANAGER">Transport Manager</option>
                    <option value="DISPATCHER">Dispatcher</option>
                    <option value="DRIVER">Driver</option>
                    <option value="CUSTOMER">Customer</option>
                    <option value="ACCOUNTANT">Accountant</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Audits list */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={20} color="var(--secondary)" /> System Audit Registers
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto', paddingRight: '6px' }}>
            {logs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '30px' }}>No audit transactions recorded.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} style={{ fontSize: '12px', background: 'rgba(255,255,255,0.01)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ color: 'var(--secondary)' }}>{log.action}</strong>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>{log.details}</p>
                </div>
              ))
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
