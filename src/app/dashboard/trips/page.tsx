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
  
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [weight, setWeight] = useState('');
  const [cargoType, setCargoType] = useState('Local Service');
  const [eta, setEta] = useState('2 hours');
  const [routePath, setRoutePath] = useState('COLOMBO_JAFFNA'); // Mock route selector

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
    } catch (err) {
      console.error(err);
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

    // Set mock coordinates and timetables based on route selection
    let routePoints = '[]';
    let waypoints = '[]';
    if (routePath === 'COLOMBO_KANDY') {
      routePoints = JSON.stringify([
        [6.9271, 79.8612], // Colombo
        [7.0011, 79.9812], // Kadawatha
        [7.0872, 80.0354], // Yakkala
        [7.2255, 80.1983], // Warakapola
        [7.2513, 80.3464], // Kegalle
        [7.2525, 80.4439], // Mawanella
        [7.2906, 80.6337]  // Kandy
      ]);
      waypoints = JSON.stringify([
        { stop: 'Colombo Fort', eta: '0:00' },
        { stop: 'Kadawatha', eta: '0:45' },
        { stop: 'Warakapola', eta: '1:30' },
        { stop: 'Kegalle', eta: '2:15' },
        { stop: 'Kandy', eta: '3:00' }
      ]);
    } else if (routePath === 'COLOMBO_GALLE') {
      routePoints = JSON.stringify([
        [6.9271, 79.8612], // Colombo
        [6.5854, 79.9607], // Kalutara
        [6.4201, 79.9984], // Bentota
        [6.2443, 80.0543], // Ambalangoda
        [6.1362, 80.1042], // Hikkaduwa
        [6.0535, 80.2117]  // Galle
      ]);
      waypoints = JSON.stringify([
        { stop: 'Colombo Fort', eta: '0:00' },
        { stop: 'Kalutara', eta: '1:00' },
        { stop: 'Bentota', eta: '1:30' },
        { stop: 'Hikkaduwa', eta: '2:15' },
        { stop: 'Galle', eta: '2:45' }
      ]);
    } else {
      // COLOMBO_JAFFNA
      routePoints = JSON.stringify([
        [6.9271, 79.8612], // Colombo
        [7.4863, 80.3647], // Kurunegala
        [7.8731, 80.6514], // Dambulla
        [8.3114, 80.4037], // Anuradhapura
        [8.7542, 80.4982], // Vavuniya
        [9.3803, 80.3992], // Kilinochchi
        [9.6615, 80.0255]  // Jaffna
      ]);
      waypoints = JSON.stringify([
        { stop: 'Colombo Fort', eta: '0:00' },
        { stop: 'Kurunegala', eta: '2:30' },
        { stop: 'Dambulla', eta: '4:00' },
        { stop: 'Anuradhapura', eta: '5:30' },
        { stop: 'Vavuniya', eta: '6:45' },
        { stop: 'Jaffna', eta: '8:30' }
      ]);
    }

    const payload = { driverId, vehicleId, pickup: pickup.trim(), destination: destination.trim(), weight: paxNum, cargoType, routePoints, waypoints, eta: eta.trim() };

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

      {/* Schedule Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '540px', padding: '30px', background: 'var(--bg-surface)' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Schedule & Dispatch Trip</h2>
            
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
                  <label className="form-label">Departure Stop</label>
                  <input type="text" className="form-input" required value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="e.g. Colombo Fort Bus Stand" />
                </div>
                <div className="form-group">
                  <label className="form-label">Arrival Stop</label>
                  <input type="text" className="form-input" required value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Kandy Central Bus Station" />
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
                  <input type="text" className="form-input" required value={eta} onChange={(e) => setEta(e.target.value)} placeholder="e.g. 2 hours 30 mins" />
                </div>
                <div className="form-group">
                  <label className="form-label">Bus Route</label>
                  <select className="form-input" value={routePath} onChange={(e) => setRoutePath(e.target.value)}>
                    <option value="COLOMBO_JAFFNA">Route 600 — Northern (Colombo Fort → Jaffna)</option>
                    <option value="COLOMBO_KANDY">Route 101 — Central (Colombo Fort → Kandy)</option>
                    <option value="COLOMBO_GALLE">Route 304 — Southern (Colombo → Galle)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={availableVehicles.length === 0 || availableDrivers.length === 0}>
                  Create & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
