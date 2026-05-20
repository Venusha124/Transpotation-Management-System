'use client';

import React, { useEffect, useState } from 'react';
import { Fuel, Plus } from 'lucide-react';

interface FuelLog {
  id: string;
  vehicleId: string;
  driverId: string;
  liters: number;
  cost: number;
  mileage: number;
  date: string;
}

interface Vehicle {
  id: string;
  number: string;
  brand: string;
  model: string;
}

interface Driver {
  id: string;
  name: string;
}

export default function FuelPage() {
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [liters, setLiters] = useState('');
  const [cost, setCost] = useState('');
  const [mileage, setMileage] = useState('');
  const [date, setDate] = useState('');

  const fetchFuelData = async () => {
    try {
      const resLogs = await fetch('/api/fuel');
      if (resLogs.ok) {
        const data = await resLogs.json();
        setLogs(data.fuelLogs);
      }

      const resVehicles = await fetch('/api/vehicles');
      if (resVehicles.ok) {
        const data = await resVehicles.json();
        setVehicles(data.vehicles);
      }

      const resDrivers = await fetch('/api/drivers');
      if (resDrivers.ok) {
        const data = await resDrivers.json();
        setDrivers(data.drivers);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFuelData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payload = { vehicleId, driverId, liters, cost, mileage, date };

    try {
      const res = await fetch('/api/fuel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setModalOpen(false);
      setVehicleId('');
      setDriverId('');
      setLiters('');
      setCost('');
      setMileage('');
      fetchFuelData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Aggregated analytics
  const totalFuelLiters = logs.reduce((sum, l) => sum + l.liters, 0);
  const totalFuelCost = logs.reduce((sum, l) => sum + l.cost, 0);
  const avgFuelPrice = totalFuelLiters > 0 ? (totalFuelCost / totalFuelLiters) : 0;

  return (
    <div className="dashboard-content animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Fuel Auditing</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Monitor refueling logs, total costs, and evaluate fleet economy rates</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn btn-primary">
          <Plus size={16} /> Log Fuel Fill
        </button>
      </div>

      {/* Analytics KPI Widgets */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginBottom: '20px' }}>
        <div className="glass-panel stat-card" style={{ padding: '16px' }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Accumulated Fuel Volume</span>
            <h3 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>{totalFuelLiters.toLocaleString()} Liters</h3>
          </div>
        </div>
        
        <div className="glass-panel stat-card" style={{ padding: '16px' }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Accumulated Fuel Expense</span>
            <h3 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', color: 'var(--accent-danger)' }}>${totalFuelCost.toLocaleString()}</h3>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ padding: '16px' }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Average Price Per Liter</span>
            <h3 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', color: 'var(--secondary)' }}>${avgFuelPrice.toFixed(2)}/L</h3>
          </div>
        </div>
      </div>

      {/* Log list table */}
      <div className="glass-panel" style={{ padding: '10px' }}>
        <div className="table-container" style={{ margin: 0 }}>
          <table className="tms-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Vehicle Number</th>
                <th>Driver Name</th>
                <th>Fuel Added (Liters)</th>
                <th>Total Cost</th>
                <th>Unit Price</th>
                <th>Odometer Reading (km)</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No fuel logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const v = vehicles.find(item => item.id === log.vehicleId);
                  const d = drivers.find(item => item.id === log.driverId);
                  return (
                    <tr key={log.id}>
                      <td>{new Date(log.date).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 600, color: 'var(--secondary)' }}>{v ? v.number : 'Unknown Vehicle'}</td>
                      <td>{d ? d.name : 'Unknown Driver'}</td>
                      <td>{log.liters.toLocaleString()} L</td>
                      <td style={{ fontWeight: 600, color: 'var(--accent-danger)' }}>${log.cost.toLocaleString()}</td>
                      <td>${(log.cost / log.liters).toFixed(2)}/L</td>
                      <td>{log.mileage.toLocaleString()} km</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '30px', background: 'var(--bg-surface)' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Log Refuelling Record</h2>
            
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Fleet Vehicle</label>
                <select className="form-input" required value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                  <option value="">-- Select Vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.number} ({v.brand} {v.model})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Active Driver</label>
                <select className="form-input" required value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                  <option value="">-- Select Driver --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Liters Added (L)</label>
                  <input type="number" step="0.01" className="form-input" required value={liters} onChange={(e) => setLiters(e.target.value)} placeholder="e.g. 120.50" />
                </div>
                <div className="form-group">
                  <label className="form-label">Refueling Cost ($)</label>
                  <input type="number" step="0.01" className="form-input" required value={cost} onChange={(e) => setCost(e.target.value)} placeholder="e.g. 241.00" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Odometer Reading (km)</label>
                  <input type="number" className="form-input" required value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="e.g. 104500" />
                </div>
                <div className="form-group">
                  <label className="form-label">Refueling Date</label>
                  <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Refueling log</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
