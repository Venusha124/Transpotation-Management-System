'use client';

import React, { useEffect, useState } from 'react';
import { Wrench, Plus, AlertCircle, CheckCircle } from 'lucide-react';

interface MaintenanceLog {
  id: string;
  vehicleId: string;
  type: string;
  description: string;
  cost: number;
  status: string;
  scheduledDate: string;
  completedDate?: string;
  partsUsed?: string;
}

interface Vehicle {
  id: string;
  number: string;
  brand: string;
  model: string;
}

export default function MaintenancePage() {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [vehicleId, setVehicleId] = useState('');
  const [type, setType] = useState('Routine Service');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [status, setStatus] = useState('SCHEDULED');
  const [scheduledDate, setScheduledDate] = useState('');
  const [partsUsed, setPartsUsed] = useState('');

  const fetchMaintenanceData = async () => {
    try {
      const resLogs = await fetch('/api/maintenance');
      if (resLogs.ok) {
        const data = await resLogs.json();
        setLogs(data.maintenance);
      }

      const resVehicles = await fetch('/api/vehicles');
      if (resVehicles.ok) {
        const data = await resVehicles.json();
        setVehicles(data.vehicles);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMaintenanceData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payload = {
      vehicleId,
      type,
      description,
      cost,
      status,
      scheduledDate,
      partsUsed,
      completedDate: status === 'COMPLETED' ? new Date().toISOString() : null
    };

    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setModalOpen(false);
      // Reset form
      setVehicleId('');
      setDescription('');
      setCost('');
      setPartsUsed('');
      fetchMaintenanceData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="dashboard-content animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Fleet Maintenance Tracker</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Schedule preventive servicing, log repair actions, and manage parts inventory</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn btn-primary">
          <Plus size={16} /> Schedule Maintenance
        </button>
      </div>

      {/* Stats row */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginBottom: '20px' }}>
        <div className="glass-panel stat-card" style={{ padding: '16px' }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Maintenance Cost</span>
            <h3 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>
              LKR {logs.reduce((sum, log) => sum + log.cost, 0).toLocaleString()}
            </h3>
          </div>
        </div>
        <div className="glass-panel stat-card" style={{ padding: '16px' }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Under repair</span>
            <h3 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', color: 'var(--accent-warning)' }}>
              {logs.filter(l => l.status === 'IN_PROGRESS').length} Vehicles
            </h3>
          </div>
        </div>
        <div className="glass-panel stat-card" style={{ padding: '16px' }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Preventive Tasks Pending</span>
            <h3 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', color: 'var(--secondary)' }}>
              {logs.filter(l => l.status === 'SCHEDULED').length} Scheduled
            </h3>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-panel" style={{ padding: '10px' }}>
        <div className="table-container" style={{ margin: 0 }}>
          <table className="tms-table">
            <thead>
              <tr>
                <th>Vehicle Number</th>
                <th>Service Type</th>
                <th>Diagnostic Description</th>
                <th>Parts Utilized</th>
                <th>Estimated Cost</th>
                <th>Scheduled Date</th>
                <th>Completed Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No maintenance logs registered yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const v = vehicles.find(item => item.id === log.vehicleId);
                  return (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 600, color: 'var(--secondary)' }}>{v ? v.number : 'Unknown Vehicle'}</td>
                      <td style={{ fontWeight: 600 }}>{log.type}</td>
                      <td>{log.description}</td>
                      <td>{log.partsUsed || 'N/A'}</td>
                      <td>LKR {log.cost.toLocaleString()}</td>
                      <td>{new Date(log.scheduledDate).toLocaleDateString()}</td>
                      <td>{log.completedDate ? new Date(log.completedDate).toLocaleDateString() : 'Pending'}</td>
                      <td>
                        <span className={`badge ${
                          log.status === 'COMPLETED' ? 'badge-success' : 
                          log.status === 'IN_PROGRESS' ? 'badge-info' : 'badge-warning'
                        }`}>{log.status}</span>
                      </td>
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
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Log Vehicle Maintenance Task</h2>
            
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Target Fleet Vehicle</label>
                <select className="form-input" required value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.number} ({v.brand} {v.model})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Service Type</label>
                  <select className="form-input" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="Engine Tuning">Engine Tuning</option>
                    <option value="Brake Pad Swap">Brake Pad Swap</option>
                    <option value="Tire Replacement">Tire Replacement</option>
                    <option value="Electrical Repair">Electrical Repair</option>
                    <option value="Routine Oil Service">Routine Oil Service</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Service Cost (LKR)</label>
                  <input type="number" className="form-input" required value={cost} onChange={(e) => setCost(e.target.value)} placeholder="e.g. 450" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Diagnostic Notes</label>
                <input type="text" className="form-input" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe engine faults or scheduled tasks..." />
              </div>

              <div className="form-group">
                <label className="form-label">Replacement Parts Utilized</label>
                <input type="text" className="form-input" value={partsUsed} onChange={(e) => setPartsUsed(e.target.value)} placeholder="e.g. Oil filter, Front break pads" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Scheduled Date</label>
                  <input type="date" className="form-input" required value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Active Status</label>
                  <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="IN_PROGRESS">Active Servicing</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule Servicing</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
