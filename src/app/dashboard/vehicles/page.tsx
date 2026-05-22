'use client';

import React, { useEffect, useState } from 'react';
import { Bus, Plus, Edit2, Trash2 } from 'lucide-react';
import { isValidSriLankaPlate, isPositiveInteger, isRequired, isFutureDate } from '@/lib/validators';

interface Vehicle {
  id: string;
  number: string;
  type: string;
  capacity: number;
  model: string;
  brand: string;
  fuelType: string;
  insuranceExpiry: string;
  licenseExpiry: string;
  availability: boolean;
  status: string;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [number, setNumber] = useState('');
  const [type, setType] = useState('Local Bus');
  const [capacity, setCapacity] = useState('');
  const [model, setModel] = useState('');
  const [brand, setBrand] = useState('');
  const [fuelType, setFuelType] = useState('Diesel');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [status, setStatus] = useState('Available');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string | undefined }>({});

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles');
      if (res.ok) {
        const data = await res.json();
        setVehicles(data.vehicles);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchVehicles(); }, []);

  const openAddModal = () => {
    setEditingVehicle(null);
    setNumber(''); setType('Local Bus'); setCapacity(''); setModel(''); setBrand('');
    setFuelType('Diesel'); setInsuranceExpiry(''); setLicenseExpiry(''); setStatus('Available'); setError('');
    setModalOpen(true);
  };

  const openEditModal = (v: Vehicle) => {
    setEditingVehicle(v);
    setNumber(v.number); setType(v.type); setCapacity(v.capacity.toString()); setModel(v.model);
    setBrand(v.brand); setFuelType(v.fuelType); setInsuranceExpiry(v.insuranceExpiry.split('T')[0]);
    setLicenseExpiry(v.licenseExpiry.split('T')[0]); setStatus(v.status); setError(''); setFieldErrors({});
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this bus from the fleet?')) return;
    try {
      const res = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
      if (res.ok) fetchVehicles();
    } catch (err) { console.error(err); }
  };

  const validateFields = () => {
    const errors: { [key: string]: string | undefined } = {};
    
    const plateCheck = isValidSriLankaPlate(number);
    if (!plateCheck.valid) errors.number = plateCheck.message;
    
    const brandCheck = isRequired(brand, 'Brand');
    if (!brandCheck.valid) errors.brand = brandCheck.message;
    
    const modelCheck = isRequired(model, 'Model');
    if (!modelCheck.valid) errors.model = modelCheck.message;
    
    const capCheck = isPositiveInteger(capacity, 'Seat Capacity');
    if (!capCheck.valid) errors.capacity = capCheck.message;
    else if (parseInt(capacity, 10) > 120) errors.capacity = 'Capacity cannot exceed 120 seats.';
    else if (parseInt(capacity, 10) < 5) errors.capacity = 'Capacity must be at least 5.';

    const insCheck = isFutureDate(insuranceExpiry, 'Insurance Expiry');
    if (!insCheck.valid && status !== 'Maintenance') errors.insuranceExpiry = 'Must be a valid future date unless in maintenance.';
    
    const licCheck = isFutureDate(licenseExpiry, 'License Expiry');
    if (!licCheck.valid && status !== 'Maintenance') errors.licenseExpiry = 'Must be a valid future date unless in maintenance.';

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
    const capNum = parseInt(capacity, 10);

    // Duplicate plate check (exclude current when editing)
    const duplicate = vehicles.find(
      v => v.number.toLowerCase() === number.trim().toLowerCase() && v.id !== editingVehicle?.id
    );
    if (duplicate) { setError(`Bus plate "${number.trim().toUpperCase()}" is already registered in the fleet.`); return; }

    const payload = { number: number.trim().toUpperCase(), type, capacity: capNum, model: model.trim(), brand: brand.trim(), fuelType, insuranceExpiry, licenseExpiry, status };
    try {
      const url = editingVehicle ? `/api/vehicles/${editingVehicle.id}` : '/api/vehicles';
      const method = editingVehicle ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setModalOpen(false);
      fetchVehicles();
    } catch (err: any) { setError(err.message); }
  };


  const filtered = vehicles.filter(v => {
    const matchesSearch = v.number.toLowerCase().includes(search.toLowerCase()) ||
      v.brand.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="dashboard-content animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bus size={26} color="var(--primary)" />
            <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Bus Fleet Management</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', marginLeft: '36px' }}>Manage bus registrations, seat capacity and operational status</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={16} /> Register Bus
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
        <input type="text" placeholder="Search by bus number, brand or model..." className="form-input"
          value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: '240px' }} />
        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'Available', 'Active', 'Maintenance'].map((s) => (
            <button key={s} className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(s)} style={{ padding: '8px 14px', fontSize: '12px' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '10px' }}>
        <div className="table-container" style={{ margin: 0 }}>
          <table className="tms-table">
            <thead>
              <tr>
                <th>Bus Number</th>
                <th>Brand / Model</th>
                <th>Bus Type</th>
                <th>Seat Capacity</th>
                <th>Fuel Type</th>
                <th>Insurance Status</th>
                <th>Availability</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No buses match the current filters.</td></tr>
              ) : (
                filtered.map((vehicle) => {
                  const insExpired = new Date(vehicle.insuranceExpiry).getTime() < Date.now();
                  return (
                    <tr key={vehicle.id}>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Bus size={16} style={{ opacity: 0.7 }} />{vehicle.number}
                        </div>
                      </td>
                      <td>{vehicle.brand} {vehicle.model}</td>
                      <td>
                        <span className="badge badge-info">{vehicle.type}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{vehicle.capacity}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px' }}>seats</span>
                      </td>
                      <td>{vehicle.fuelType}</td>
                      <td>
                        <span className={`badge ${insExpired ? 'badge-danger' : 'badge-success'}`}>
                          {insExpired ? '⚠ Expired' : '✓ Active'} ({new Date(vehicle.insuranceExpiry).toLocaleDateString()})
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${vehicle.status === 'Available' ? 'badge-success' : vehicle.status === 'Active' ? 'badge-info' : 'badge-warning'}`}>
                          {vehicle.status === 'Active' ? '🚌 On Route' : vehicle.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => openEditModal(vehicle)} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '12px' }}><Edit2 size={13} /></button>
                          <button onClick={() => handleDelete(vehicle.id)} className="btn btn-danger" style={{ padding: '6px 10px', fontSize: '12px' }}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '540px', padding: '30px', background: 'var(--bg-surface)' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bus size={22} color="var(--primary)" />
              {editingVehicle ? 'Edit Bus Details' : 'Register New Bus'}
            </h2>
            {error && (
              <div style={{ background: 'rgba(197,48,48,0.1)', color: '#fc8181', border: '1px solid rgba(197,48,48,0.2)', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>⚠️ {error}</div>
            )}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Bus Number / Plate</label>
                  <input type="text" className="form-input" required value={number} 
                    onChange={(e) => { setNumber(e.target.value); setFieldErrors(p => ({ ...p, number: undefined })); }} 
                    onBlur={() => { const r = isValidSriLankaPlate(number); if (!r.valid) setFieldErrors(p => ({ ...p, number: r.message })); }}
                    placeholder="e.g. NB-3344" style={fieldErrors.number ? { borderColor: '#fc8181' } : {}} />
                  {fieldErrors.number && <span style={{ color: '#fc8181', fontSize: '11px', marginTop: '4px', display: 'block' }}>⚠ {fieldErrors.number}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Brand</label>
                  <input type="text" className="form-input" required value={brand} 
                    onChange={(e) => { setBrand(e.target.value); setFieldErrors(p => ({ ...p, brand: undefined })); }} 
                    onBlur={() => { const r = isRequired(brand, 'Brand'); if (!r.valid) setFieldErrors(p => ({ ...p, brand: r.message })); }}
                    placeholder="e.g. TATA, Volvo, Ashok" style={fieldErrors.brand ? { borderColor: '#fc8181' } : {}} />
                  {fieldErrors.brand && <span style={{ color: '#fc8181', fontSize: '11px', marginTop: '4px', display: 'block' }}>⚠ {fieldErrors.brand}</span>}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Model</label>
                  <input type="text" className="form-input" required value={model} 
                    onChange={(e) => { setModel(e.target.value); setFieldErrors(p => ({ ...p, model: undefined })); }} 
                    onBlur={() => { const r = isRequired(model, 'Model'); if (!r.valid) setFieldErrors(p => ({ ...p, model: r.message })); }}
                    placeholder="e.g. Lanka Lion, LF213" style={fieldErrors.model ? { borderColor: '#fc8181' } : {}} />
                  {fieldErrors.model && <span style={{ color: '#fc8181', fontSize: '11px', marginTop: '4px', display: 'block' }}>⚠ {fieldErrors.model}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Bus Type / Service</label>
                  <select className="form-input" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="Local Bus">Local Bus</option>
                    <option value="Express Bus">Express Bus</option>
                    <option value="Inter-City Express">Inter-City Express</option>
                    <option value="Air-Conditioned">Air-Conditioned</option>
                    <option value="Mini Bus">Mini Bus</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Seat Capacity</label>
                  <input type="number" className="form-input" required value={capacity} 
                    onChange={(e) => { setCapacity(e.target.value); setFieldErrors(p => ({ ...p, capacity: undefined })); }} 
                    onBlur={() => { const r = isPositiveInteger(capacity, 'Seat Capacity'); if (!r.valid) setFieldErrors(p => ({ ...p, capacity: r.message })); }}
                    placeholder="e.g. 52" style={fieldErrors.capacity ? { borderColor: '#fc8181' } : {}} />
                  {fieldErrors.capacity && <span style={{ color: '#fc8181', fontSize: '11px', marginTop: '4px', display: 'block' }}>⚠ {fieldErrors.capacity}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Fuel Type</label>
                  <select className="form-input" value={fuelType} onChange={(e) => setFuelType(e.target.value)}>
                    <option value="Diesel">Diesel</option>
                    <option value="Petrol">Petrol</option>
                    <option value="CNG">CNG</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Insurance Expiry</label>
                  <input type="date" className="form-input" required value={insuranceExpiry} 
                    onChange={(e) => { setInsuranceExpiry(e.target.value); setFieldErrors(p => ({ ...p, insuranceExpiry: undefined })); }} 
                    style={fieldErrors.insuranceExpiry ? { borderColor: '#fc8181' } : {}} />
                  {fieldErrors.insuranceExpiry && <span style={{ color: '#fc8181', fontSize: '11px', marginTop: '4px', display: 'block' }}>⚠ {fieldErrors.insuranceExpiry}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">License Expiry</label>
                  <input type="date" className="form-input" required value={licenseExpiry} 
                    onChange={(e) => { setLicenseExpiry(e.target.value); setFieldErrors(p => ({ ...p, licenseExpiry: undefined })); }} 
                    style={fieldErrors.licenseExpiry ? { borderColor: '#fc8181' } : {}} />
                  {fieldErrors.licenseExpiry && <span style={{ color: '#fc8181', fontSize: '11px', marginTop: '4px', display: 'block' }}>⚠ {fieldErrors.licenseExpiry}</span>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Operational Status</label>
                <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="Available">Available</option>
                  <option value="Active">Active (On Route)</option>
                  <option value="Maintenance">Under Maintenance</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">{editingVehicle ? 'Update Bus' : 'Register Bus'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
