'use client';

import React, { useEffect, useState } from 'react';
import { Users, Plus, Edit2, Trash2, Star } from 'lucide-react';

interface Driver {
  id: string;
  name: string;
  nic: string;
  contact: string;
  address: string;
  licenseNumber: string;
  experience: number;
  emergencyContact: string;
  salary: number;
  availability: boolean;
  attendanceStatus: string;
  rating: number;
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [search, setSearch] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [nic, setNic] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [experience, setExperience] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [salary, setSalary] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('Present');
  const [availability, setAvailability] = useState(true);
  const [rating, setRating] = useState('5.0');
  const [error, setError] = useState('');

  const fetchDrivers = async () => {
    try {
      const res = await fetch('/api/drivers');
      if (res.ok) {
        const data = await res.json();
        setDrivers(data.drivers);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const openAddModal = () => {
    setEditingDriver(null);
    setName('');
    setNic('');
    setContact('');
    setAddress('');
    setLicenseNumber('');
    setExperience('');
    setEmergencyContact('');
    setSalary('');
    setAttendanceStatus('Present');
    setAvailability(true);
    setRating('5.0');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (driver: Driver) => {
    setEditingDriver(driver);
    setName(driver.name);
    setNic(driver.nic);
    setContact(driver.contact);
    setAddress(driver.address);
    setLicenseNumber(driver.licenseNumber);
    setExperience(driver.experience.toString());
    setEmergencyContact(driver.emergencyContact);
    setSalary(driver.salary.toString());
    setAttendanceStatus(driver.attendanceStatus);
    setAvailability(driver.availability);
    setRating(driver.rating.toString());
    setError('');
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this driver profile?')) return;
    try {
      const res = await fetch(`/api/drivers/${id}`, { method: 'DELETE' });
      if (res.ok) fetchDrivers();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleAttendance = async (driver: Driver) => {
    const nextAttendance = driver.attendanceStatus === 'Present' ? 'Absent' : 'Present';
    try {
      await fetch(`/api/drivers/${driver.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendanceStatus: nextAttendance }),
      });
      fetchDrivers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate NIC (Sri Lankan format: 9 numbers + V/v/X/x OR 12 numbers)
    const nicRegex = /^(?:\d{9}[vVxX]|\d{12})$/;
    if (!nic.trim() || !nicRegex.test(nic.trim())) {
      setError('Invalid Sri Lankan NIC format (e.g. 199912345678 or 991234567V)');
      return;
    }

    // Validate Contact number (Sri Lankan mobile: +947xxxxxxxx or 07xxxxxxxx)
    const contactRegex = /^(?:\+94|0)?7[0-9]{8}$/;
    const cleanContact = contact.trim().replace(/[\s-]/g, '');
    if (!contactRegex.test(cleanContact)) {
      setError('Invalid Sri Lankan contact number (e.g. 0771234567 or +94771234567)');
      return;
    }

    // Validate experience and salary
    const expNum = parseInt(experience, 10);
    if (isNaN(expNum) || expNum < 0) {
      setError('Experience cannot be negative.');
      return;
    }

    const salNum = parseFloat(salary);
    if (isNaN(salNum) || salNum < 0) {
      setError('Monthly salary cannot be negative.');
      return;
    }

    // Validate Rating (between 1.0 and 5.0)
    const rateNum = parseFloat(rating);
    if (isNaN(rateNum) || rateNum < 1.0 || rateNum > 5.0) {
      setError('Driver rating must be between 1.0 and 5.0.');
      return;
    }

    const payload = { name, nic, contact, address, licenseNumber, experience: expNum, emergencyContact, salary: salNum, attendanceStatus, availability, rating: rateNum };

    try {
      const url = editingDriver ? `/api/drivers/${editingDriver.id}` : '/api/drivers';
      const method = editingDriver ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setModalOpen(false);
      fetchDrivers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || 
                          d.nic.toLowerCase().includes(search.toLowerCase()) ||
                          d.licenseNumber.toLowerCase().includes(search.toLowerCase());
    const matchesAttendance = attendanceFilter === 'ALL' || d.attendanceStatus === attendanceFilter;
    return matchesSearch && matchesAttendance;
  });

  return (
    <div className="dashboard-content animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Driver Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Manage shift attendance, licensing constraints, and ratings</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={16} /> Register Driver
        </button>
      </div>

      {/* Filters */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Search name, NIC or license..." 
          className="form-input" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '240px' }}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'Present', 'Absent'].map((a) => (
            <button 
              key={a} 
              className={`btn ${attendanceFilter === a ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setAttendanceFilter(a)}
              style={{ padding: '8px 14px', fontSize: '12px' }}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Driver List Table */}
      <div className="glass-panel" style={{ padding: '10px' }}>
        <div className="table-container" style={{ margin: 0 }}>
          <table className="tms-table">
            <thead>
              <tr>
                <th>Driver Name</th>
                <th>NIC / Passport</th>
                <th>Contact</th>
                <th>License No.</th>
                <th>Experience (Yrs)</th>
                <th>Salary</th>
                <th>Rating</th>
                <th>Attendance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No drivers found.
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((driver) => (
                  <tr key={driver.id}>
                    <td style={{ fontWeight: 600, color: 'var(--secondary)' }}>{driver.name}</td>
                    <td>{driver.nic}</td>
                    <td>{driver.contact}</td>
                    <td>{driver.licenseNumber}</td>
                    <td>{driver.experience} years</td>
                    <td>${driver.salary.toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-warning)' }}>
                        <Star size={14} fill="currentColor" />
                        <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>{driver.rating}</span>
                      </div>
                    </td>
                    <td>
                      <button 
                        onClick={() => toggleAttendance(driver)}
                        className={`badge ${driver.attendanceStatus === 'Present' ? 'badge-success' : 'badge-danger'}`}
                        style={{ cursor: 'pointer', border: 'none', font: 'inherit' }}
                      >
                        {driver.attendanceStatus}
                      </button>
                    </td>
                    <td>
                      <span className={`badge ${driver.availability ? 'badge-success' : 'badge-info'}`}>
                        {driver.availability ? 'Available' : 'On Route'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => openEditModal(driver)} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '12px' }}>
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDelete(driver.id)} className="btn btn-danger" style={{ padding: '6px 10px', fontSize: '12px' }}>
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

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '30px', background: 'var(--bg-surface)' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>
              {editingDriver ? 'Edit Driver Profile' : 'Register New Driver'}
            </h2>
            
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Driver Name</label>
                  <input type="text" className="form-input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Marcus Driver" />
                </div>
                <div className="form-group">
                  <label className="form-label">NIC / Passport</label>
                  <input type="text" className="form-input" required value={nic} onChange={(e) => setNic(e.target.value)} placeholder="e.g. 991234567V" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Contact Number</label>
                  <input type="text" className="form-input" required value={contact} onChange={(e) => setContact(e.target.value)} placeholder="e.g. +1-555-0199" />
                </div>
                <div className="form-group">
                  <label className="form-label">License Number</label>
                  <input type="text" className="form-input" required value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="e.g. DL-99887766" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input type="text" className="form-input" required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 456 Route Ave, Logistics Town" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Experience (Years)</label>
                  <input type="number" className="form-input" required value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 8" />
                </div>
                <div className="form-group">
                  <label className="form-label">Monthly Salary ($)</label>
                  <input type="number" className="form-input" required value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="e.g. 3200" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Emergency Contact</label>
                  <input type="text" className="form-input" required value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} placeholder="e.g. +1-555-0100 (Wife)" />
                </div>
                <div className="form-group">
                  <label className="form-label">Performance Rating</label>
                  <input type="number" step="0.1" min="1" max="5" className="form-input" required value={rating} onChange={(e) => setRating(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">{editingDriver ? 'Update' : 'Register'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
