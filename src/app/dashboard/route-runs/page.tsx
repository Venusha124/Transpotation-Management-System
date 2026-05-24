'use client';

import React, { useEffect, useState } from 'react';
import { Route, Plus, Play, CheckCircle2, AlertOctagon, Trash2, Bus, Clock } from 'lucide-react';

interface Trip {
  id: string;
  trackingNumber: string;
  driverId: string;
  vehicleId: string;
  pickup: string;
  destination: string;
  weight: number;
  cargoType: string;
  status: string;
  eta: string;
  routePoints: string;
  startAt?: string;
  endAt?: string;
}

interface Vehicle {
  id: string;
  number: string;
  brand: string;
  model: string;
  availability: boolean;
  status: string;
  capacity: number;
}

interface Driver {
  id: string;
  name: string;
  availability: boolean;
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routesList, setRoutesList] = useState<any[]>([]);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [weight, setWeight] = useState('');
  const [cargoType, setCargoType] = useState('Local Service');
  const [eta, setEta] = useState('');
  const [routePath, setRoutePath] = useState(''); // Stores the actual Route ID

  const fetchTripsData = async () => {
    try {
      const resTrips = await fetch('/api/trips');
      if (resTrips.ok) {
        const data = await resTrips.json();
        setTrips(data.trips);
      }

      // Fetch vehicles and drivers to check availability
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

      // Fetch published routes
      const resRoutes = await fetch('/api/routes?published=true');
      if (resRoutes.ok) {
        const data = await resRoutes.json();
        setRoutesList(data.routes);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRouteSelection = (routeId: string) => {
    setRoutePath(routeId);
    const selected = routesList.find(r => r.id === routeId);
    if (selected) {
      setPickup(selected.startLocation);
      setDestination(selected.endLocation);
      const hours = Math.floor(selected.duration / 60);
      const mins = selected.duration % 60;
      setEta(`${hours > 0 ? hours + ' hours ' : ''}${mins > 0 ? mins + ' mins' : ''}`.trim());
    } else {
      setPickup('');
      setDestination('');
      setEta('');
    }
  };

  useEffect(() => {
    fetchTripsData();
  }, []);

  // Filter ONLY available vehicles/drivers for assignment
  const availableVehicles = vehicles.filter(v => v.availability && v.status === 'Available');
  const availableDrivers = drivers.filter(d => d.availability);

  const handleUpdateStatus = async (id: string, status: string, additionalData: any = {}) => {
    try {
      const res = await fetch(`/api/trips/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...additionalData }),
      });
      if (res.ok) fetchTripsData();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleReportDelay = (id: string, currentEta: string) => {
    const delayReason = prompt("Enter reason for delay (e.g. Heavy Traffic, Weather):");
    if (!delayReason) return;
    
    const newEta = prompt(`Enter new estimated ETA (Current: ${currentEta}):`, `${currentEta} + 30 mins`);
    if (!newEta) return;

    handleUpdateStatus(id, 'IN_PROGRESS', { delayReason, eta: newEta });
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to cancel and delete this trip?')) return;
    try {
      const res = await fetch(`/api/trips/${tripId}`, { method: 'DELETE' });
      if (res.ok) fetchTripsData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // -- Required selections --
    if (!vehicleId) { setError('Please select an available bus for this route run.'); return; }
    if (!driverId) { setError('Please select an available driver for this route run.'); return; }

    // -- Departure / Arrival stops --
    if (!pickup.trim()) { setError('Departure stop / terminal is required.'); return; }
    if (!destination.trim()) { setError('Arrival stop / terminal is required.'); return; }
    if (pickup.trim().toLowerCase() === destination.trim().toLowerCase()) {
      setError('Departure and Arrival stops cannot be the same location.'); return;
    }
    if (pickup.trim().length < 3) { setError('Departure stop name must be at least 3 characters.'); return; }
    if (destination.trim().length < 3) { setError('Arrival stop name must be at least 3 characters.'); return; }

    // -- Passenger count --
    const paxNum = parseInt(weight, 10);
    if (isNaN(paxNum) || paxNum <= 0) { setError('Passenger count must be a positive whole number.'); return; }

    const selectedVehicle = vehicles.find(v => v.id === vehicleId);
    if (selectedVehicle && paxNum > selectedVehicle.capacity) {
      setError(`Passenger count (${paxNum}) exceeds bus seat capacity (${selectedVehicle.capacity} seats) for bus ${selectedVehicle.number}.`);
      return;
    }

    // -- ETA --
    if (!eta.trim() || eta.trim().length < 3) { setError('Please enter a valid estimated journey duration (e.g. "2 hours 30 mins").'); return; }

    const selectedRoute = routesList.find(r => r.id === routePath);
    let routePoints = '[]';
    let waypoints = '[]';

    if (selectedRoute && selectedRoute.routeStops) {
      // Create waypoints directly from the database route stops
      const generatedWaypoints = selectedRoute.routeStops.map((rs: any) => ({
        stop: rs.stop.name,
        eta: `+${rs.arrivalOffset} mins`
      }));
      waypoints = JSON.stringify(generatedWaypoints);

      // As a fallback for routePoints if lat/lng are provided in the stops
      const points = selectedRoute.routeStops
        .filter((rs: any) => rs.stop.latitude && rs.stop.longitude)
        .map((rs: any) => [parseFloat(rs.stop.latitude), parseFloat(rs.stop.longitude)]);
      if (points.length > 0) routePoints = JSON.stringify(points);
    }

    const payload = { 
      driverId, 
      vehicleId, 
      routeId: routePath || undefined,
      pickup: pickup.trim(), 
      destination: destination.trim(), 
      weight: paxNum, 
      cargoType, 
      routePoints, 
      waypoints, 
      eta: eta.trim() 
    };

    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setModalOpen(false);
      setDriverId(''); setVehicleId(''); setPickup(''); setDestination(''); setWeight('');
      fetchTripsData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <>
      <div className="dashboard-content animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Route size={26} color="var(--primary)" />
            <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Route Run Scheduling</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', marginLeft: '36px' }}>Dispatch buses, assign routes and track service run lifecycles</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn btn-primary">
          <Plus size={16} /> Schedule Route Run
        </button>
      </div>

      {/* Trips list */}
      <div className="glass-panel" style={{ padding: '10px' }}>
        <div className="table-container" style={{ margin: 0 }}>
          <table className="tms-table">
            <thead>
              <tr>
                <th>Run Number</th>
                <th>Bus Driver</th>
                <th>Bus Number</th>
                <th>Route (Departure → Arrival)</th>
                <th>Service / Passengers</th>
                <th>Est. Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No trips scheduled yet. Click &quot;Schedule Trip&quot; to assign assets.
                  </td>
                </tr>
              ) : (
                trips.map((trip) => {
                  const assignedDriver = drivers.find(d => d.id === trip.driverId);
                  const assignedVehicle = vehicles.find(v => v.id === trip.vehicleId);
                  return (
                    <tr key={trip.id}>
                      <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          🚌 {trip.trackingNumber}
                        </div>
                      </td>
                      <td>{assignedDriver ? assignedDriver.name : 'Unassigned'}</td>
                      <td style={{ fontWeight: 600 }}>{assignedVehicle ? assignedVehicle.number : 'Unassigned'}</td>
                      <td style={{ fontSize: '13px' }}>
                        <strong>{trip.pickup}</strong> <span style={{ color: 'var(--primary)' }}>→</span> <strong>{trip.destination}</strong>
                      </td>
                      <td>
                        <span className="badge badge-info">{trip.cargoType}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>{trip.weight} passengers</span>
                      </td>
                      <td style={{ fontSize: '13px' }}>{trip.eta}</td>
                      <td>
                        <span className={`badge ${
                          trip.status === 'ASSIGNED' ? 'badge-warning' : 
                          trip.status === 'IN_PROGRESS' ? 'badge-info' : 
                          trip.status === 'COMPLETED' ? 'badge-success' : 'badge-danger'
                        }`}>
                          {trip.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {trip.status === 'ASSIGNED' && (
                            <button 
                              onClick={() => handleUpdateStatus(trip.id, 'IN_PROGRESS')}
                              className="btn btn-primary" 
                              style={{ padding: '6px 10px', fontSize: '11px', background: 'var(--secondary)' }}
                            >
                              <Play size={11} /> Start
                            </button>
                          )}
                          {trip.status === 'IN_PROGRESS' && (
                            <button 
                              onClick={() => handleUpdateStatus(trip.id, 'COMPLETED')}
                              className="btn btn-primary" 
                              style={{ padding: '6px 10px', fontSize: '11px', background: 'var(--accent-success)' }}
                            >
                              <CheckCircle2 size={11} /> Complete
                            </button>
                          )}
                          {trip.status === 'IN_PROGRESS' && (
                            <button 
                              onClick={() => handleReportDelay(trip.id, trip.eta)}
                              className="btn btn-secondary" 
                              style={{ padding: '6px 10px', fontSize: '11px', color: '#f59e0b' }}
                              title="Send Smart Delay Alert to passengers"
                            >
                              <Clock size={11} /> Delay
                            </button>
                          )}
                          {trip.status !== 'COMPLETED' && trip.status !== 'CANCELLED' && (
                            <button 
                              onClick={() => handleUpdateStatus(trip.id, 'CANCELLED')}
                              className="btn btn-secondary" 
                              style={{ padding: '6px 10px', fontSize: '11px', color: '#f87171' }}
                            >
                              <AlertOctagon size={11} /> Cancel
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteTrip(trip.id)}
                            className="btn btn-danger" 
                            style={{ padding: '6px 10px', fontSize: '11px' }}
                          >
                            <Trash2 size={11} />
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
      </div>

      {/* Schedule Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '60px 20px', overflowY: 'auto' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '780px', padding: '32px', borderRadius: '20px', margin: 'auto 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: '#60a5fa', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Route size={20} /> Schedule & Dispatch Trip
              </h3>
              <button type="button" className="btn-icon" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Available Bus</label>
                  <select className="form-input" required value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                    <option value="">-- Select Available Bus --</option>
                    {availableVehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.number} ({v.brand} — {v.capacity} seats)</option>
                    ))}
                  </select>
                  {availableVehicles.length === 0 && (
                    <span style={{ fontSize: '10px', color: 'var(--accent-danger)' }}>No buses available. Set one to Available.</span>
                  )}
                </div>
                
                <div className="form-group">
                  <label className="form-label">Available Driver</label>
                  <select className="form-input" required value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                    <option value="">-- Select Available Driver --</option>
                    {availableDrivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  {availableDrivers.length === 0 && (
                    <span style={{ fontSize: '10px', color: 'var(--accent-danger)' }}>No drivers available. Set one to Present & Available.</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Bus Route</label>
                  <select className="form-input" value={routePath} onChange={(e) => handleRouteSelection(e.target.value)}>
                    <option value="">-- Select Master Route (Optional) --</option>
                    {routesList.map(r => (
                      <option key={r.id} value={r.id}>{r.code} — {r.name} ({r.distance}km)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Departure Stop</label>
                  <input type="text" className="form-input" required value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="e.g. Colombo Fort Bus Stand" readOnly={!!routePath} style={{ background: routePath ? 'rgba(0,0,0,0.2)' : undefined }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Arrival Stop</label>
                  <input type="text" className="form-input" required value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Kandy Central Bus Station" readOnly={!!routePath} style={{ background: routePath ? 'rgba(0,0,0,0.2)' : undefined }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Passenger Count</label>
                  <input type="number" className="form-input" required value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 45" />
                </div>
                <div className="form-group">
                  <label className="form-label">Service Type</label>
                  <select className="form-input" value={cargoType} onChange={(e) => setCargoType(e.target.value)}>
                    <option value="Local Service">Local Service</option>
                    <option value="Express Service">Express Service</option>
                    <option value="Inter-City Express">Inter-City Express</option>
                    <option value="Air-Conditioned">Air-Conditioned</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Est. Journey Duration</label>
                  <input type="text" className="form-input" required value={eta} onChange={(e) => setEta(e.target.value)} placeholder="e.g. 2 hours 30 mins" readOnly={!!routePath} style={{ background: routePath ? 'rgba(0,0,0,0.2)' : undefined }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary" style={{ padding: '12px 24px' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={availableVehicles.length === 0 || availableDrivers.length === 0} style={{ padding: '12px 24px' }}>
                  Create & Dispatch Route Run
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
