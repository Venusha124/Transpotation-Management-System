'use client';

import React, { useEffect, useState } from 'react';
import { Truck, Plus, Edit2, Trash2 } from 'lucide-react';

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

  // Form states
  const [number, setNumber] = useState('');
  const [type, setType] = useState('Truck');
  const [capacity, setCapacity] = useState('');
  const [model, setModel] = useState('');
  const [brand, setBrand] = useState('');
  const [fuelType, setFuelType] = useState('Diesel');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [status, setStatus] = useState('Available');
  const [error, setError] = useState('');

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles');
      if (res.ok) {
        const data = await res.json();
        setVehicles(data.vehicles);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const openAddModal = () => {
    setEditingVehicle(null);
    setNumber('');
    setType('Truck');
    setCapacity('');
    setModel('');
    setBrand('');
    setFuelType('Diesel');
    setInsuranceExpiry('');
    setLicenseExpiry('');
    setStatus('Available');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setNumber(vehicle.number);
    setType(vehicle.type);
    setCapacity(vehicle.capacity.toString());
    setModel(vehicle.model);
    setBrand(vehicle.brand);
    setFuelType(vehicle.fuelType);
    setInsuranceExpiry(vehicle.insuranceExpiry.split('T')[0]);
    setLicenseExpiry(vehicle.licenseExpiry.split('T')[0]);
    setStatus(vehicle.status);
    setError('');
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this vehicle from the fleet?')) return;
    try {
      const res = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
      if (res.ok) fetchVehicles();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const capNum = parseInt(capacity, 10);
    if (isNaN(capNum) || capNum <= 0) {
      setError('Load capacity must be a positive integer greater than zero.');
      return;
    }

    const payload = { number, type, capacity: capNum, model, brand, fuelType, insuranceExpiry, licenseExpiry, status };

    try {
      const url = editingVehicle ? `/api/vehicles/${editingVehicle.id}` : '/api/vehicles';
      const method = editingVehicle ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setModalOpen(false);
      fetchVehicles();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filteredVehicles = vehicles.filter(v => {
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
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Vehicle Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Monitor registration details and vehicle statuses</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={16} /> Add Vehicle
        </button>
      </div>

      {/* Filter and search bars */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Search number, brand or model..." 
          className="form-input" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '240px' }}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'Available', 'Active', 'Maintenance'].map((s) => (
            <button 
              key={s} 
              className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(s)}
              style={{ padding: '8px 14px', fontSize: '12px' }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Fleet table */}
      <div className="glass-panel" style={{ padding: '10px' }}>
        <div className="table-container" style={{ margin: 0 }}>
          <table className="tms-table">
            <thead>
              <tr>
                <th>Vehicle Number</th>
                <th>Brand / Model</th>
                <th>Category</th>
                <th>Capacity (kg)</th>
                <th>Fuel Type</th>
                <th>Insurance Status</th>
                <th>Availability</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No fleet vehicles match search filters.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => {
                  const insExpired = new Date(vehicle.insuranceExpiry).getTime() < Date.now();
                  return (
                    <tr key={vehicle.id}>
                      <td style={{ fontWeight: 600, color: 'var(--secondary)' }}>{vehicle.number}</td>
                      <td>{vehicle.brand} {vehicle.model}</td>
                      <td>{vehicle.type}</td>
                      <td>{vehicle.capacity.toLocaleString()}</td>
                      <td>{vehicle.fuelType}</td>
                      <td>
                        <span className={`badge ${insExpired ? 'badge-danger' : 'badge-success'}`}>
                          {insExpired ? 'Expired' : 'Active'} (Exp: {new Date(vehicle.insuranceExpiry).toLocaleDateString()})
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          vehicle.status === 'Available' ? 'badge-success' : 
                          vehicle.status === 'Active' ? 'badge-info' : 'badge-warning'
                        }`}>
                          {vehicle.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => openEditModal(vehicle)} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '12px' }}>
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDelete(vehicle.id)} className="btn btn-danger" style={{ padding: '6px 10px', fontSize: '12px' }}>
                            <Trash2 size={13} />
                          </button>
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

      {/* Modal for adding/editing vehicles */}
      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '30px', background: 'var(--bg-surface)' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>
              {editingVehicle ? 'Edit Vehicle Details' : 'Register Fleet Vehicle'}
            </h2>
            
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Vehicle Number</label>
                  <input type="text" className="form-input" required value={number} onChange={(e) => setNumber(e.target.value)} placeholder="e.g. V-TRUCK-8899" />
                </div>
                <div className="form-group">
                  <label className="form-label">Vehicle Brand</label>
                  <input type="text" className="form-input" required value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Volvo" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Vehicle Model</label>
                  <input type="text" className="form-input" required value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. FH16" />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="Heavy Cargo Truck">Heavy Cargo Truck</option>
                    <option value="Flatbed Lorry">Flatbed Lorry</option>
                    <option value="Delivery Van">Delivery Van</option>
                    <option value="Refrigerated Truck">Refrigerated Truck</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Capacity (kg)</label>
                  <input type="number" className="form-input" required value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="e.g. 15000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Fuel Type</label>
                  <select className="form-input" value={fuelType} onChange={(e) => setFuelType(e.target.value)}>
                    <option value="Diesel">Diesel</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Insurance Expiration</label>
                  <input type="date" className="form-input" required value={insuranceExpiry} onChange={(e) => setInsuranceExpiry(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">License Expiration</label>
                  <input type="date" className="form-input" required value={licenseExpiry} onChange={(e) => setLicenseExpiry(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Active Status</label>
                <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="Available">Available</option>
                  <option value="Active">Active (On Trip)</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">{editingVehicle ? 'Update' : 'Register'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
