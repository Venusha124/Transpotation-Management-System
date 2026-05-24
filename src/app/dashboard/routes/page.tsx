'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Route, MapPin, CheckCircle, Clock, ChevronDown, ChevronUp, Eye, EyeOff, AlertTriangle, Edit2 } from 'lucide-react';

interface Stop {
  id: string;
  name: string;
  code: string;
  address: string;
  status: string;
}

interface RouteStop {
  id: string;
  orderIndex: number;
  arrivalOffset: number;
  stop: Stop;
}

interface RouteItem {
  id: string;
  name: string;
  code: string;
  startLocation: string;
  endLocation: string;
  distance: number;
  duration: number;
  basePrice: number;
  status: string;
  createdAt: string;
  routeStops: RouteStop[];
  trips?: any[];
}

interface StopRow {
  stopId: string;
  arrivalOffset: string;
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);

  // Create/Edit Route Form
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteItem | null>(null);
  const [routeForm, setRouteForm] = useState({ name: '', code: '', startLocation: '', endLocation: '', distance: '', duration: '', basePrice: '', publish: false });
  const [selectedStops, setSelectedStops] = useState<StopRow[]>([{ stopId: '', arrivalOffset: '0' }, { stopId: '', arrivalOffset: '0' }]);

  // Create/Edit Stop Form
  const [showStopForm, setShowStopForm] = useState(false);
  const [editingStop, setEditingStop] = useState<Stop | null>(null);
  const [stopForm, setStopForm] = useState({ name: '', code: '', address: '', latitude: '', longitude: '', status: 'ACTIVE' });

  const fetchData = async () => {
    setLoading(true);
    const [routesRes, stopsRes] = await Promise.all([
      fetch('/api/routes').then(r => r.json()),
      fetch('/api/stops').then(r => r.json()),
    ]);
    if (routesRes.routes) setRoutes(routesRes.routes);
    if (stopsRes.stops) setStops(stopsRes.stops);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmitStop = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    
    const method = editingStop ? 'PUT' : 'POST';
    const url = editingStop ? `/api/stops/${editingStop.id}` : '/api/stops';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stopForm)
    });
    
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    
    setSuccess(editingStop ? 'Stop updated successfully!' : 'Stop created successfully!');
    setStopForm({ name: '', code: '', address: '', latitude: '', longitude: '', status: 'ACTIVE' });
    setShowStopForm(false);
    setEditingStop(null);
    fetchData();
  };

  const openEditStopModal = (stop: Stop) => {
    setEditingStop(stop);
    setStopForm({
      name: stop.name,
      code: stop.code,
      address: stop.address,
      latitude: (stop as any).latitude ? (stop as any).latitude.toString() : '',
      longitude: (stop as any).longitude ? (stop as any).longitude.toString() : '',
      status: stop.status
    });
    setShowStopForm(true);
    setShowRouteForm(false);
  };

  const handleSubmitRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const stopsPayload = selectedStops.filter(s => s.stopId);
    
    const method = editingRoute ? 'PUT' : 'POST';
    const url = editingRoute ? `/api/routes/${editingRoute.id}` : '/api/routes';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...routeForm, stops: stopsPayload }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    
    setSuccess(editingRoute ? `Route "${data.route.name}" updated successfully!` : `Route "${data.route.name}" created successfully!`);
    setRouteForm({ name: '', code: '', startLocation: '', endLocation: '', distance: '', duration: '', basePrice: '', publish: false });
    setSelectedStops([{ stopId: '', arrivalOffset: '0' }, { stopId: '', arrivalOffset: '0' }]);
    setShowRouteForm(false);
    setEditingRoute(null);
    fetchData();
  };

  const openEditRouteModal = (route: RouteItem) => {
    setEditingRoute(route);
    setRouteForm({
      name: route.name,
      code: route.code,
      startLocation: route.startLocation,
      endLocation: route.endLocation,
      distance: route.distance.toString(),
      duration: route.duration.toString(),
      basePrice: route.basePrice.toString(),
      publish: route.status === 'PUBLISHED',
    });
    const stops = route.routeStops.map(rs => ({
      stopId: rs.stop.id,
      arrivalOffset: rs.arrivalOffset.toString()
    }));
    setSelectedStops(stops.length > 0 ? stops : [{ stopId: '', arrivalOffset: '0' }, { stopId: '', arrivalOffset: '0' }]);
    setShowRouteForm(true);
    setShowStopForm(false);
  };

  const handleTogglePublish = async (route: RouteItem) => {
    const newStatus = route.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    const res = await fetch(`/api/routes/${route.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    fetchData();
  };

  const handleDeleteRoute = async (id: string) => {
    if (!confirm('Are you sure you want to delete this route?')) return;
    const res = await fetch(`/api/routes/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    setSuccess('Route deleted.');
    fetchData();
  };

  const addStopRow = () => setSelectedStops(prev => [...prev, { stopId: '', arrivalOffset: '0' }]);
  const removeStopRow = (idx: number) => setSelectedStops(prev => prev.filter((_, i) => i !== idx));
  const updateStopRow = (idx: number, field: keyof StopRow, value: string) => {
    setSelectedStops(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const activeStops = stops.filter(s => s.status === 'ACTIVE');

  return (
    <div style={{ padding: '32px', fontFamily: 'var(--font-primary, Inter)', color: '#fff', minHeight: '100vh', background: 'var(--bg-gradient)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Route size={28} color="#60a5fa" /> Route Management
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>Create routes, manage bus stops, and publish to all connected systems.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => { 
            setEditingStop(null);
            setStopForm({ name: '', code: '', address: '', latitude: '', longitude: '', status: 'ACTIVE' });
            setShowStopForm(!showStopForm); 
            setShowRouteForm(false); 
          }} className="btn-outline-sm">
            <MapPin size={16} /> {showStopForm && !editingStop ? 'Cancel Stop' : 'New Stop'}
          </button>
          <button onClick={() => { 
            setEditingRoute(null);
            setRouteForm({ name: '', code: '', startLocation: '', endLocation: '', distance: '', duration: '', basePrice: '', publish: false });
            setSelectedStops([{ stopId: '', arrivalOffset: '0' }, { stopId: '', arrivalOffset: '0' }]);
            setShowRouteForm(!showRouteForm); 
            setShowStopForm(false); 
          }} className="btn-primary-sm">
            <Plus size={16} /> {showRouteForm && !editingRoute ? 'Cancel Route' : 'New Route'}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && <div className="alert-error" style={{ marginBottom: '16px' }}><AlertTriangle size={16} /> {error}</div>}
      {success && <div className="alert-success" style={{ marginBottom: '16px' }}><CheckCircle size={16} /> {success}</div>}

      {/* Create/Edit Stop Modal */}
      {showStopForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '60px 20px', overflowY: 'auto' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '620px', padding: '28px', borderRadius: '20px', margin: 'auto 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#60a5fa' }}>{editingStop ? '✏️ Edit Bus Stop' : '➕ Create New Bus Stop'}</h3>
              <button className="btn-icon" onClick={() => setShowStopForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmitStop}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label className="form-label">Stop Name *</label>
                  <input className="glass-input" value={stopForm.name} onChange={e => setStopForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Colombo Fort" required />
                </div>
                <div>
                  <label className="form-label">Stop Code *</label>
                  <input className="glass-input" value={stopForm.code} onChange={e => setStopForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. CMB-FT" required />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Address *</label>
                  <input className="glass-input" value={stopForm.address} onChange={e => setStopForm(p => ({ ...p, address: e.target.value }))} placeholder="Full address" required />
                </div>
                <div>
                  <label className="form-label">Latitude (optional)</label>
                  <input className="glass-input" type="number" step="any" value={stopForm.latitude} onChange={e => setStopForm(p => ({ ...p, latitude: e.target.value }))} placeholder="e.g. 6.9271" />
                </div>
                <div>
                  <label className="form-label">Longitude (optional)</label>
                  <input className="glass-input" type="number" step="any" value={stopForm.longitude} onChange={e => setStopForm(p => ({ ...p, longitude: e.target.value }))} placeholder="e.g. 79.8612" />
                </div>
                {editingStop && (
                  <div>
                    <label className="form-label">Status</label>
                    <select className="glass-input" value={stopForm.status} onChange={e => setStopForm(p => ({ ...p, status: e.target.value }))}>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                )}
              </div>
              <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline-sm" style={{ padding: '10px 20px' }} onClick={() => setShowStopForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editingStop ? 'Update Stop' : 'Create Stop'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create/Edit Route Modal */}
      {showRouteForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '60px 20px', overflowY: 'auto' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '780px', padding: '32px', borderRadius: '20px', margin: 'auto 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: '#a78bfa', fontSize: '20px' }}>{editingRoute ? '🗺️ Edit Route Plan' : '🗺️ Create New Route'}</h3>
              <button className="btn-icon" onClick={() => setShowRouteForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmitRoute}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label className="form-label">Route Name *</label>
                  <input className="glass-input" value={routeForm.name} onChange={e => setRouteForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Colombo-Kandy Express" required />
                </div>
                <div>
                  <label className="form-label">Route Code *</label>
                  <input className="glass-input" value={routeForm.code} onChange={e => setRouteForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. CMB-KDY-01" required />
                </div>
                <div>
                  <label className="form-label">Start Location *</label>
                  <input className="glass-input" value={routeForm.startLocation} onChange={e => setRouteForm(p => ({ ...p, startLocation: e.target.value }))} placeholder="e.g. Colombo" required />
                </div>
                <div>
                  <label className="form-label">End Location *</label>
                  <input className="glass-input" value={routeForm.endLocation} onChange={e => setRouteForm(p => ({ ...p, endLocation: e.target.value }))} placeholder="e.g. Kandy" required />
                </div>
                <div>
                  <label className="form-label">Distance (km) *</label>
                  <input className="glass-input" type="number" step="0.1" min="0.1" value={routeForm.distance} onChange={e => setRouteForm(p => ({ ...p, distance: e.target.value }))} placeholder="e.g. 115" required />
                </div>
                <div>
                  <label className="form-label">Duration (minutes) *</label>
                  <input className="glass-input" type="number" min="1" value={routeForm.duration} onChange={e => setRouteForm(p => ({ ...p, duration: e.target.value }))} placeholder="e.g. 180" required />
                </div>
                <div>
                  <label className="form-label">Base Price (LKR)</label>
                  <input className="glass-input" type="number" step="0.01" min="0" value={routeForm.basePrice} onChange={e => setRouteForm(p => ({ ...p, basePrice: e.target.value }))} placeholder="e.g. 450" />
                </div>
              </div>

              {/* Stops Builder */}
              <div style={{ marginTop: '28px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ color: '#fbbf24', margin: 0 }}>🛑 Bus Stops (min. 2 required)</h4>
                  <button type="button" onClick={addStopRow} className="btn-outline-sm"><Plus size={14} /> Add Stop</button>
                </div>
                {selectedStops.map((row, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 160px auto', gap: '12px', marginBottom: '12px', alignItems: 'end' }}>
                    <div>
                      <label className="form-label">Stop {idx + 1} {idx === 0 ? '(Origin)' : idx === selectedStops.length - 1 ? '(Destination)' : ''}</label>
                      <select className="glass-input" value={row.stopId} onChange={e => updateStopRow(idx, 'stopId', e.target.value)} required>
                        <option value="">Select stop...</option>
                        {activeStops.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Arrival Offset (min)</label>
                      <input className="glass-input" type="number" min="0" value={row.arrivalOffset} onChange={e => updateStopRow(idx, 'arrivalOffset', e.target.value)} />
                    </div>
                    <button type="button" onClick={() => removeStopRow(idx)} className="btn-icon" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', width: '42px', height: '42px' }}>
                      <Trash2 size={16} color="#ef4444" />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '28px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                  <input type="checkbox" checked={routeForm.publish} onChange={e => setRouteForm(p => ({ ...p, publish: e.target.checked }))} />
                  Publish immediately (visible to passengers &amp; website)
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" className="btn-outline-sm" style={{ padding: '10px 20px' }} onClick={() => setShowRouteForm(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Create Route</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Routes List */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'rgba(255,255,255,0.4)' }}>Loading routes...</div>
        ) : routes.length === 0 ? (
          <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', borderRadius: '16px' }}>
            <Route size={48} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>No routes created yet. Create your first route to get started.</p>
          </div>
        ) : (
          routes.map(route => (
            <div key={route.id} className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              {/* Route Header */}
              <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '10px', padding: '10px 14px' }}>
                    <span style={{ fontWeight: 700, color: '#60a5fa', fontSize: '13px' }}>{route.code}</span>
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '17px' }}>{route.name}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginTop: '2px' }}>
                      📍 {route.startLocation} → {route.endLocation} &nbsp;•&nbsp; {route.distance} km &nbsp;•&nbsp; ~{route.duration} min
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: route.status === 'PUBLISHED' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: route.status === 'PUBLISHED' ? '#10b981' : '#f59e0b', border: `1px solid ${route.status === 'PUBLISHED' ? '#10b981' : '#f59e0b'}40` }}>
                    {route.status}
                  </span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{route.routeStops.length} stops</span>
                  <span style={{ fontSize: '13px', color: '#10b981' }}>LKR {route.basePrice.toLocaleString()}</span>
                  <button onClick={() => openEditRouteModal(route)} className="btn-icon" title="Edit Route">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleTogglePublish(route)} className="btn-icon" title={route.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}>
                    {route.status === 'PUBLISHED' ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button onClick={() => handleDeleteRoute(route.id)} className="btn-icon-danger" title="Delete Route">
                    <Trash2 size={16} />
                  </button>
                  <button onClick={() => setExpandedRoute(expandedRoute === route.id ? null : route.id)} className="btn-icon">
                    {expandedRoute === route.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Expanded: Stops + Active Trips */}
              {expandedRoute === route.id && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '20px 24px' }}>
                  <h4 style={{ marginBottom: '14px', color: '#fbbf24', fontSize: '14px', fontWeight: 600 }}>🛑 Stops Along This Route</h4>
                  <div style={{ display: 'flex', gap: '0', overflowX: 'auto', paddingBottom: '8px' }}>
                    {route.routeStops.map((rs, idx) => (
                      <div key={rs.id} style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center', minWidth: '120px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: idx === 0 ? 'rgba(16,185,129,0.2)' : idx === route.routeStops.length - 1 ? 'rgba(239,68,68,0.2)' : 'rgba(96,165,250,0.15)', border: `2px solid ${idx === 0 ? '#10b981' : idx === route.routeStops.length - 1 ? '#ef4444' : '#60a5fa'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontWeight: 700, fontSize: '13px', color: idx === 0 ? '#10b981' : idx === route.routeStops.length - 1 ? '#ef4444' : '#60a5fa' }}>{idx + 1}</div>
                          <p style={{ fontSize: '11px', fontWeight: 600, color: '#fff' }}>{rs.stop.name}</p>
                          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>{rs.stop.code}</p>
                          {rs.arrivalOffset > 0 && <p style={{ fontSize: '10px', color: '#60a5fa' }}>+{rs.arrivalOffset} min</p>}
                        </div>
                        {idx < route.routeStops.length - 1 && (
                          <div style={{ flex: 1, height: '2px', background: 'linear-gradient(90deg, #60a5fa, #a78bfa)', minWidth: '40px', margin: '0 4px' }} />
                        )}
                      </div>
                    ))}
                  </div>

                  {route.trips && route.trips.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                      <h4 style={{ marginBottom: '12px', color: '#10b981', fontSize: '14px', fontWeight: 600 }}>🚌 Active Trips on This Route</h4>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {route.trips.map((trip: any) => (
                          <div key={trip.id} style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, fontSize: '14px' }}>{trip.trackingNumber}</span>
                            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{trip.vehicle?.brand} {trip.vehicle?.model} ({trip.vehicle?.number})</span>
                            <span style={{ fontSize: '13px', color: '#60a5fa' }}>ETA: {trip.eta}</span>
                            <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', background: 'rgba(16,185,129,0.2)', color: '#10b981' }}>{trip.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Stops Overview */}
      <div style={{ marginTop: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={20} color="#fbbf24" /> Bus Stop Registry ({stops.length} stops)
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          {stops.map(stop => (
            <div key={stop.id} className="glass-panel" style={{ padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: '14px' }}>{stop.name}</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{stop.code} • {stop.address}</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', background: stop.status === 'ACTIVE' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: stop.status === 'ACTIVE' ? '#10b981' : '#ef4444' }}>
                  {stop.status}
                </span>
                <button onClick={() => openEditStopModal(stop)} className="btn-icon" title="Edit Stop" style={{ padding: '4px' }}>
                  <Edit2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {stops.length === 0 && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>No stops created yet. Create stops first before building routes.</p>}
        </div>
      </div>
    </div>
  );
}
