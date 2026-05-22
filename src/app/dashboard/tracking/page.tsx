'use client';

import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { MapPin, Navigation, Compass, Play, Square, Bus } from 'lucide-react';

interface Trip {
  id: string;
  trackingNumber: string;
  pickup: string;
  destination: string;
  status: string;
  routePoints: string;
}

export default function TrackingPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [vehiclePos, setVehiclePos] = useState<{ lat: number; lng: number } | null>(null);
  const [speed, setSpeed] = useState(0);
  const [eta, setEta] = useState('N/A');
  const [socketStatus, setSocketStatus] = useState('Connecting');
  const [isSimulating, setIsSimulating] = useState(false);
  const simInterval = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const fetchTrips = async () => {
    try {
      const res = await fetch('/api/trips');
      if (res.ok) {
        const data = await res.json();
        setTrips(data.trips.filter((t: any) => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED'));
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchTrips(); }, []);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;
    socket.on('connect', () => setSocketStatus('Connected'));
    socket.on('disconnect', () => setSocketStatus('Disconnected'));
    socket.on('location-updated', (data) => {
      if (selectedTripId && data.tripId === selectedTripId) {
        setVehiclePos({ lat: data.currentLat, lng: data.currentLng });
        setSpeed(data.speed);
        setEta(data.eta);
      }
    });
    return () => {
      if (simInterval.current) clearInterval(simInterval.current);
      socket.disconnect();
    };
  }, [selectedTripId]);

  const handleTripChange = (tripId: string) => {
    setSelectedTripId(tripId);
    const tripObj = trips.find(t => t.id === tripId) || null;
    setSelectedTrip(tripObj);
    if (tripObj) {
      socketRef.current?.emit('join-trip', tripId);
      const coords = JSON.parse(tripObj.routePoints);
      if (coords.length > 0) setVehiclePos({ lat: coords[0][0], lng: coords[0][1] });
      setSpeed(0); setEta('Calculating...');
    } else { setVehiclePos(null); }
    if (isSimulating) stopSimulation();
  };

  const startSimulation = () => {
    if (!selectedTrip) return;
    const coords = JSON.parse(selectedTrip.routePoints);
    if (coords.length === 0) return;
    setIsSimulating(true);
    let step = 0;
    fetch(`/api/trips/${selectedTrip.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'IN_PROGRESS' }) });
    simInterval.current = setInterval(() => {
      if (step >= coords.length) {
        clearInterval(simInterval.current!);
        setIsSimulating(false); setSpeed(0); setEta('Arrived! 🏁');
        fetch(`/api/trips/${selectedTrip.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'COMPLETED' }) });
        return;
      }
      const [lat, lng] = coords[step];
      const curSpeed = Math.floor(40 + Math.random() * 30);
      const curEta = `${(coords.length - step) * 2} mins`;
      socketRef.current?.emit('update-location', { tripId: selectedTrip.id, currentLat: lat, currentLng: lng, speed: curSpeed, eta: curEta });
      setVehiclePos({ lat, lng }); setSpeed(curSpeed); setEta(curEta);
      step++;
    }, 3000);
  };

  const stopSimulation = () => {
    if (simInterval.current) clearInterval(simInterval.current);
    setIsSimulating(false); setSpeed(0);
  };

  const renderSVGMap = () => {
    if (!selectedTrip) return null;
    const coords = JSON.parse(selectedTrip.routePoints);
    if (coords.length === 0) return null;
    const lats = coords.map((c: any) => c[0]);
    const lngs = coords.map((c: any) => c[1]);
    const minLat = Math.min(...lats) - 2; const maxLat = Math.max(...lats) + 2;
    const minLng = Math.min(...lngs) - 2; const maxLng = Math.max(...lngs) + 2;
    const latRange = maxLat - minLat || 1; const lngRange = maxLng - minLng || 1;
    const project = (lat: number, lng: number) => ({
      x: ((lng - minLng) / lngRange) * 500 + 50,
      y: (1 - (lat - minLat) / latRange) * 200 + 50
    });
    const pathPoints = coords.map((c: any) => { const p = project(c[0], c[1]); return `${p.x},${p.y}`; }).join(' ');
    const pickupPos = project(coords[0][0], coords[0][1]);
    const dropPos = project(coords[coords.length - 1][0], coords[coords.length - 1][1]);
    const activePos = vehiclePos ? project(vehiclePos.lat, vehiclePos.lng) : null;
    const stops = coords.filter((_: any, i: number) => i % Math.max(1, Math.floor(coords.length / 5)) === 0 && i !== 0 && i !== coords.length - 1);

    return (
      <svg style={{ width: '100%', height: '320px', background: '#07111e', border: '1px solid var(--border-light)', borderRadius: '12px' }} viewBox="0 0 600 300">
        {[75, 150, 225].map(y => <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="rgba(37,99,235,0.08)" strokeWidth="1" />)}
        {[150, 300, 450].map(x => <line key={x} x1={x} y1="0" x2={x} y2="300" stroke="rgba(37,99,235,0.08)" strokeWidth="1" />)}
        {/* Route shadow */}
        <polyline points={pathPoints} fill="none" stroke="rgba(37,99,235,0.25)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        {/* Route line */}
        <polyline points={pathPoints} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {/* Intermediate stops */}
        {stops.map((c: any, i: number) => { const p = project(c[0], c[1]); return (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--bg-surface)" stroke="#3b82f6" strokeWidth="2" />
        ); })}
        {/* Departure stop */}
        <g transform={`translate(${pickupPos.x}, ${pickupPos.y})`}>
          <circle cx="0" cy="0" r="10" fill="#132238" stroke="#10b981" strokeWidth="3" />
          <circle cx="0" cy="0" r="4" fill="#10b981" />
          <text x="14" y="5" fill="#10b981" fontSize="10" fontWeight="700">Departure: {selectedTrip.pickup.split(',')[0]}</text>
        </g>
        {/* Destination stop */}
        <g transform={`translate(${dropPos.x}, ${dropPos.y})`}>
          <circle cx="0" cy="0" r="10" fill="#132238" stroke="#c53030" strokeWidth="3" />
          <circle cx="0" cy="0" r="4" fill="#c53030" />
          <text x="14" y="5" fill="#fc8181" fontSize="10" fontWeight="700">Arrival: {selectedTrip.destination.split(',')[0]}</text>
        </g>
        {/* Active bus pin */}
        {activePos && (
          <g transform={`translate(${activePos.x}, ${activePos.y})`}>
            <circle cx="0" cy="0" r="18" fill="rgba(37,99,235,0.18)">
              <animate attributeName="r" values="10;22;10" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="0" cy="0" r="8" fill="#2563eb" stroke="white" strokeWidth="2.5" />
            <text x="0" y="4" fill="white" fontSize="8" fontWeight="800" textAnchor="middle">🚌</text>
            <text x="12" y="-12" fill="#60a5fa" fontSize="9" fontWeight="700">LIVE BUS</text>
          </g>
        )}
      </svg>
    );
  };

  return (
    <div className="dashboard-content animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MapPin size={26} color="var(--primary)" />
            <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Live Bus Tracker</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', marginLeft: '36px' }}>Monitor active bus positions, speeds and ETA in real-time</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: socketStatus === 'Connected' ? 'var(--accent-success)' : 'var(--accent-danger)' }}></div>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>WebSocket: {socketStatus}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '17px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Navigation size={20} color="var(--primary)" /> Select Active Route Run
            </h3>
            <div className="form-group">
              <label className="form-label">Active / Assigned Bus Services</label>
              <select className="form-input" value={selectedTripId} onChange={(e) => handleTripChange(e.target.value)}>
                <option value="">-- Choose an active route run --</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>🚌 {t.trackingNumber} ({t.pickup.split(',')[0]} → {t.destination.split(',')[0]})</option>
                ))}
              </select>
            </div>
            {selectedTrip && (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-light)' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '10px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bus size={16} color="var(--primary)" /> GPS Route Emulator
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                  Simulate the bus GPS stream along the route, broadcasting real-time telemetry to the dispatcher map.
                </p>
                {isSimulating ? (
                  <button onClick={stopSimulation} className="btn btn-danger" style={{ width: '100%' }}>
                    <Square size={16} /> Stop GPS Simulation
                  </button>
                ) : (
                  <button onClick={startSimulation} className="btn btn-primary" style={{ width: '100%', background: 'var(--accent-success)' }}>
                    <Play size={16} /> Start Bus GPS Stream
                  </button>
                )}
              </div>
            )}
          </div>

          {selectedTrip && (
            <div className="glass-panel" style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'rgba(37,99,235,0.06)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(37,99,235,0.15)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Bus Speed</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '8px' }}>
                  <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary)' }}>{speed}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>km/h</span>
                </div>
              </div>
              <div style={{ background: 'rgba(37,99,235,0.06)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(37,99,235,0.15)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Estimated Arrival</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '8px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-warning)' }}>{eta}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '17px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={20} color="var(--primary)" /> Route Map Canvas
          </h3>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {selectedTrip ? (
              <div style={{ width: '100%' }}>
                {renderSVGMap()}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>📍 {vehiclePos ? `${vehiclePos.lat.toFixed(4)}, ${vehiclePos.lng.toFixed(4)}` : 'Awaiting GPS signal...'}</span>
                  <span>Geofence: Within Route Range</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚌</div>
                <p style={{ fontSize: '14px' }}>Select an active route run to track the bus on the map.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
