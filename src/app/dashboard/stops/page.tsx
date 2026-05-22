'use client';

import React, { useEffect, useState } from 'react';
import { MapPinned, Plus, Edit2, Trash2, Search } from 'lucide-react';

interface BusStop {
  id: string;
  stopCode: string;
  stopName: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  routes: string;
  status: string;
  facilities: string;
}

const SRI_LANKA_STOPS: BusStop[] = [
  { id: '1', stopCode: 'CMB-001', stopName: 'Colombo Fort Bus Stand', city: 'Colombo', district: 'Colombo', latitude: 6.9338, longitude: 79.8501, routes: 'Route 101, 103, 120, 154', status: 'Active', facilities: 'Shelter, Seating, Ticket Counter' },
  { id: '2', stopCode: 'KND-001', stopName: 'Kandy Central Bus Station', city: 'Kandy', district: 'Kandy', latitude: 7.2906, longitude: 80.6337, routes: 'Route 101, 202, 311', status: 'Active', facilities: 'Shelter, Seating, Restrooms, Ticket Counter' },
  { id: '3', stopCode: 'GLL-001', stopName: 'Galle Bus Station', city: 'Galle', district: 'Galle', latitude: 6.0328, longitude: 80.2168, routes: 'Route 304, 305, 400', status: 'Active', facilities: 'Shelter, Seating, Ticket Counter' },
  { id: '4', stopCode: 'NWR-001', stopName: 'Nuwara Eliya Bus Stand', city: 'Nuwara Eliya', district: 'Nuwara Eliya', latitude: 6.9497, longitude: 80.7891, routes: 'Route 202, 501', status: 'Active', facilities: 'Shelter, Seating' },
  { id: '5', stopCode: 'MTR-001', stopName: 'Matara Bus Station', city: 'Matara', district: 'Matara', latitude: 5.9455, longitude: 80.5477, routes: 'Route 400, 402, 403', status: 'Active', facilities: 'Shelter, Seating, Ticket Counter, Parking' },
  { id: '6', stopCode: 'JFN-001', stopName: 'Jaffna Bus Stand', city: 'Jaffna', district: 'Jaffna', latitude: 9.6615, longitude: 80.0255, routes: 'Route 600, 601', status: 'Active', facilities: 'Shelter, Seating' },
  { id: '7', stopCode: 'KLT-001', stopName: 'Kurunegala Town Stop', city: 'Kurunegala', district: 'Kurunegala', latitude: 7.4867, longitude: 80.3647, routes: 'Route 103, 210, 215', status: 'Active', facilities: 'Shelter, Seating' },
  { id: '8', stopCode: 'BTL-001', stopName: 'Batticaloa Central', city: 'Batticaloa', district: 'Batticaloa', latitude: 7.7172, longitude: 81.7003, routes: 'Route 700, 701', status: 'Maintenance', facilities: 'Shelter' },
];

export default function StopsPage() {
  const [stops, setStops] = useState<BusStop[]>(SRI_LANKA_STOPS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStop, setEditingStop] = useState<BusStop | null>(null);
  const [selectedStop, setSelectedStop] = useState<BusStop | null>(null);

  // Form fields
  const [stopCode, setStopCode] = useState('');
  const [stopName, setStopName] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [routes, setRoutes] = useState('');
  const [status, setStatus] = useState('Active');
  const [facilities, setFacilities] = useState('');

  const openAdd = () => {
    setEditingStop(null);
    setStopCode(''); setStopName(''); setCity(''); setDistrict('');
    setLatitude(''); setLongitude(''); setRoutes(''); setStatus('Active'); setFacilities('');
    setModalOpen(true);
  };

  const openEdit = (stop: BusStop) => {
    setEditingStop(stop);
    setStopCode(stop.stopCode); setStopName(stop.stopName); setCity(stop.city);
    setDistrict(stop.district); setLatitude(stop.latitude.toString());
    setLongitude(stop.longitude.toString()); setRoutes(stop.routes);
    setStatus(stop.status); setFacilities(stop.facilities);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Remove this bus stop?')) return;
    setStops(prev => prev.filter(s => s.id !== id));
    if (selectedStop?.id === id) setSelectedStop(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // -- Stop Code --
    if (!stopCode.trim()) { alert('Stop code is required.'); return; }
    const codeRegex = /^[A-Z]{2,4}-\d{3}$/;
    if (!codeRegex.test(stopCode.trim().toUpperCase())) {
      alert('Stop code must follow format: XXX-000 (e.g. CMB-001).'); return;
    }

    // -- Duplicate code check --
    const duplicate = stops.find(
      s => s.stopCode.toUpperCase() === stopCode.trim().toUpperCase() && s.id !== editingStop?.id
    );
    if (duplicate) { alert(`Stop code "${stopCode.trim().toUpperCase()}" is already in use.`); return; }

    // -- Name / City / District --
    if (!stopName.trim() || stopName.trim().length < 4) { alert('Stop name must be at least 4 characters.'); return; }
    if (!city.trim() || city.trim().length < 2) { alert('City name must be at least 2 characters.'); return; }
    if (!district.trim() || district.trim().length < 2) { alert('District name must be at least 2 characters.'); return; }

    // -- Coordinates (Sri Lanka bounds) --
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat)) { alert('Latitude must be a valid number.'); return; }
    if (isNaN(lng)) { alert('Longitude must be a valid number.'); return; }
    if (lat < 5.7 || lat > 9.9) { alert('Latitude must be within Sri Lanka bounds (5.7 – 9.9).'); return; }
    if (lng < 79.4 || lng > 82.0) { alert('Longitude must be within Sri Lanka bounds (79.4 – 82.0).'); return; }

    const newStop: BusStop = {
      id: editingStop?.id || String(Date.now()),
      stopCode: stopCode.trim().toUpperCase(),
      stopName: stopName.trim(),
      city: city.trim(),
      district: district.trim(),
      latitude: lat,
      longitude: lng,
      routes: routes.trim(),
      status,
      facilities: facilities.trim()
    };
    if (editingStop) {
      setStops(prev => prev.map(s => s.id === editingStop.id ? newStop : s));
    } else {
      setStops(prev => [...prev, newStop]);
    }
    setModalOpen(false);
  };


  const filtered = stops.filter(s => {
    const q = search.toLowerCase();
    const matches = s.stopName.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.stopCode.toLowerCase().includes(q);
    const statusOk = statusFilter === 'ALL' || s.status === statusFilter;
    return matches && statusOk;
  });

  // Simple SVG map of Sri Lanka with stop dots
  const mapProject = (lat: number, lng: number) => {
    const minLat = 5.8, maxLat = 9.9, minLng = 79.5, maxLng = 81.9;
    const x = ((lng - minLng) / (maxLng - minLng)) * 260 + 20;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 380 + 10;
    return { x, y };
  };

  return (
    <div className="dashboard-content animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MapPinned size={26} color="var(--primary)" />
            <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Bus Stops Management</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', marginLeft: '36px' }}>Manage all bus stops, terminals and stand locations across Sri Lanka</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">
          <Plus size={16} /> Add Bus Stop
        </button>
      </div>

      {/* Stats row */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '20px' }}>
        {[
          { label: 'Total Stops', value: stops.length, color: '#3b82f6' },
          { label: 'Active Stops', value: stops.filter(s => s.status === 'Active').length, color: '#10b981' },
          { label: 'Under Maintenance', value: stops.filter(s => s.status === 'Maintenance').length, color: '#f59e0b' },
          { label: 'Districts Covered', value: [...new Set(stops.map(s => s.district))].length, color: '#c53030' },
        ].map(stat => (
          <div key={stat.label} className="glass-panel" style={{ padding: '16px 20px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</span>
            <div style={{ fontSize: '28px', fontWeight: 800, color: stat.color, marginTop: '4px' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
        {/* Left: table */}
        <div>
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Search stop name, city or code..." className="form-input"
                value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['ALL', 'Active', 'Maintenance', 'Inactive'].map(s => (
                <button key={s} className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setStatusFilter(s)} style={{ padding: '8px 12px', fontSize: '12px' }}>
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
                    <th>Stop Code</th>
                    <th>Stop Name</th>
                    <th>City / District</th>
                    <th>Coordinates</th>
                    <th>Routes Served</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No bus stops match the filters.</td></tr>
                  ) : (
                    filtered.map(stop => (
                      <tr key={stop.id} onClick={() => setSelectedStop(stop)}
                        style={{ cursor: 'pointer', background: selectedStop?.id === stop.id ? 'rgba(37,99,235,0.06)' : undefined }}>
                        <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '12px' }}>{stop.stopCode}</td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>{stop.stopName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{stop.facilities}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: '13px' }}>{stop.city}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{stop.district} District</div>
                        </td>
                        <td style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                          {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '150px' }}>{stop.routes}</td>
                        <td>
                          <span className={`badge ${stop.status === 'Active' ? 'badge-success' : stop.status === 'Maintenance' ? 'badge-warning' : 'badge-danger'}`}>
                            {stop.status}
                          </span>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => openEdit(stop)} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '12px' }}><Edit2 size={13} /></button>
                            <button onClick={() => handleDelete(stop.id)} className="btn btn-danger" style={{ padding: '6px 10px', fontSize: '12px' }}><Trash2 size={13} /></button>
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

        {/* Right: Sri Lanka SVG map */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPinned size={18} color="var(--primary)" /> Sri Lanka Stop Map
          </h3>
          <div style={{ position: 'relative', background: 'rgba(37,99,235,0.04)', borderRadius: '10px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <svg viewBox="0 0 300 400" style={{ width: '100%' }}>
              {/* Grid */}
              {[100,200,300].map(x => <line key={x} x1={x} y1="0" x2={x} y2="400" stroke="rgba(37,99,235,0.06)" />)}
              {[100,200,300].map(y => <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="rgba(37,99,235,0.06)" />)}
              {/* Sri Lanka rough outline */}
              <path d="M 140,10 L 180,15 L 210,40 L 230,80 L 240,130 L 250,175 L 240,230 L 220,280 L 195,330 L 170,370 L 150,380 L 135,370 L 115,320 L 100,260 L 95,200 L 100,150 L 115,90 L 130,40 Z"
                fill="rgba(37,99,235,0.08)" stroke="rgba(37,99,235,0.25)" strokeWidth="1.5" />
              {/* Stop dots */}
              {stops.map(stop => {
                const p = mapProject(stop.latitude, stop.longitude);
                const isSelected = selectedStop?.id === stop.id;
                return (
                  <g key={stop.id} onClick={() => setSelectedStop(stop)} style={{ cursor: 'pointer' }}>
                    {isSelected && <circle cx={p.x} cy={p.y} r="12" fill="rgba(37,99,235,0.2)" />}
                    <circle cx={p.x} cy={p.y} r={isSelected ? 7 : 5}
                      fill={stop.status === 'Active' ? '#2563eb' : '#f59e0b'}
                      stroke="white" strokeWidth={isSelected ? 2.5 : 1.5} />
                    {isSelected && (
                      <text x={p.x + 10} y={p.y + 4} fill="#60a5fa" fontSize="8" fontWeight="700">{stop.stopCode}</text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {selectedStop && (
            <div style={{ marginTop: '16px', padding: '14px', background: 'rgba(37,99,235,0.06)', borderRadius: '10px', border: '1px solid rgba(37,99,235,0.15)' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary)', marginBottom: '6px' }}>{selectedStop.stopName}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <div>📍 {selectedStop.city}, {selectedStop.district}</div>
                <div>🚌 {selectedStop.routes}</div>
                <div>🏗 {selectedStop.facilities}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', marginTop: '4px', color: 'var(--text-muted)' }}>{selectedStop.latitude.toFixed(4)}, {selectedStop.longitude.toFixed(4)}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '560px', padding: '30px', background: 'var(--bg-surface)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPinned size={22} color="var(--primary)" />
              {editingStop ? 'Edit Bus Stop' : 'Add New Bus Stop'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Stop Code</label>
                  <input type="text" className="form-input" required value={stopCode} onChange={e => setStopCode(e.target.value)} placeholder="e.g. CMB-001" />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="Active">Active</option>
                    <option value="Maintenance">Under Maintenance</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Stop / Terminal Name</label>
                <input type="text" className="form-input" required value={stopName} onChange={e => setStopName(e.target.value)} placeholder="e.g. Colombo Fort Bus Stand" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input type="text" className="form-input" required value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Colombo" />
                </div>
                <div className="form-group">
                  <label className="form-label">District</label>
                  <input type="text" className="form-input" required value={district} onChange={e => setDistrict(e.target.value)} placeholder="e.g. Colombo" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input type="number" step="0.0001" className="form-input" required value={latitude} onChange={e => setLatitude(e.target.value)} placeholder="e.g. 6.9338" />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input type="number" step="0.0001" className="form-input" required value={longitude} onChange={e => setLongitude(e.target.value)} placeholder="e.g. 79.8501" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Routes Served</label>
                <input type="text" className="form-input" value={routes} onChange={e => setRoutes(e.target.value)} placeholder="e.g. Route 101, 103, 120" />
              </div>
              <div className="form-group">
                <label className="form-label">Facilities Available</label>
                <input type="text" className="form-input" value={facilities} onChange={e => setFacilities(e.target.value)} placeholder="e.g. Shelter, Seating, Ticket Counter" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">{editingStop ? 'Update Stop' : 'Add Stop'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
