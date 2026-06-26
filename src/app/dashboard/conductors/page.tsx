'use client';

import React, { useEffect, useState } from 'react';
import { Users, Plus, Edit2, Trash2 } from 'lucide-react';
import { isRequired } from '@/lib/validators';

interface Conductor {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export default function ConductorsPage() {
  const [conductors, setConductors] = useState<Conductor[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConductor, setEditingConductor] = useState<Conductor | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string | undefined }>({});

  const fetchConductors = async () => {
    try {
      const res = await fetch('/api/conductors');
      if (res.ok) {
        const data = await res.json();
        setConductors(data.conductors);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConductors();
  }, []);

  const openAddModal = () => {
    setEditingConductor(null);
    setName('');
    setEmail('');
    setPassword('');
    setError('');
    setFieldErrors({});
    setModalOpen(true);
  };

  const openEditModal = (conductor: Conductor) => {
    setEditingConductor(conductor);
    setName(conductor.name);
    setEmail(conductor.email);
    setPassword('');
    setError('');
    setFieldErrors({});
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this conductor?')) return;
    try {
      const res = await fetch(`/api/conductors/${id}`, { method: 'DELETE' });
      if (res.ok) fetchConductors();
    } catch (err) {
      console.error(err);
    }
  };

  const validateFields = () => {
    const errors: { [key: string]: string | undefined } = {};
    if (!name) errors.name = "Name is required";
    if (!email || !email.includes('@')) errors.email = "Valid email is required";
    if (!editingConductor && password.length < 6) errors.password = "Password must be at least 6 characters";
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateFields()) {
      setError('Please fix the highlighted field errors before submitting.');
      return;
    }

    const payload: any = { name, email };
    if (password) payload.password = password;

    try {
      const url = editingConductor ? `/api/conductors/${editingConductor.id}` : '/api/conductors';
      const method = editingConductor ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setModalOpen(false);
      fetchConductors();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filteredConductors = conductors.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="dashboard-content animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Conductor Profiles</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Manage bus conductor login accounts.</p>
          </div>
          <button onClick={openAddModal} className="btn btn-primary">
            <Plus size={16} /> Register Conductor
          </button>
        </div>

        <div className="glass-panel" style={{ padding: '16px', marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            className="form-input" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
        </div>

        <div className="glass-panel" style={{ padding: '10px' }}>
          <div className="table-container" style={{ margin: 0 }}>
            <table className="tms-table">
              <thead>
                <tr>
                  <th>Conductor Name</th>
                  <th>Login Email</th>
                  <th>Date Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredConductors.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No conductors found.
                    </td>
                  </tr>
                ) : (
                  filteredConductors.map((conductor) => (
                    <tr key={conductor.id}>
                      <td style={{ fontWeight: 600, color: 'var(--secondary)' }}>{conductor.name}</td>
                      <td>{conductor.email}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{new Date(conductor.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => openEditModal(conductor)} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '12px' }}>
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDelete(conductor.id)} className="btn btn-danger" style={{ padding: '6px 10px', fontSize: '12px' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '32px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: '#60a5fa', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} /> {editingConductor ? 'Edit Conductor' : 'Register New Conductor'}
              </h3>
              <button type="button" className="btn-icon" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" required value={name} 
                  onChange={(e) => { setName(e.target.value); setFieldErrors(p => ({ ...p, name: undefined })); }} 
                  placeholder="e.g. John Doe" />
                {fieldErrors.name && <span style={{ color: '#fc8181', fontSize: '11px', marginTop: '4px' }}>⚠ {fieldErrors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Login ID)</label>
                <input type="email" className="form-input" required value={email} 
                  onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: undefined })); }} 
                  placeholder="e.g. conductor@tms.com" />
                {fieldErrors.email && <span style={{ color: '#fc8181', fontSize: '11px', marginTop: '4px' }}>⚠ {fieldErrors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">{editingConductor ? 'New Password (Optional)' : 'Password'}</label>
                <input type="password" className="form-input" value={password} 
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: undefined })); }} 
                  placeholder="••••••••" />
                {fieldErrors.password && <span style={{ color: '#fc8181', fontSize: '11px', marginTop: '4px' }}>⚠ {fieldErrors.password}</span>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '30px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn-outline-sm" style={{ padding: '10px 20px' }}>Cancel</button>
                <button type="submit" className="btn-primary">{editingConductor ? 'Update' : 'Register'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
