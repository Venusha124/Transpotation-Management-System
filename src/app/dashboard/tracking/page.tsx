'use client';

import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { MapPin, Navigation, Compass, Play, Square } from 'lucide-react';

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
  
  // Real-time telemetry states
  const [vehiclePos, setVehiclePos] = useState<{ lat: number; lng: number } | null>(null);
  const [speed, setSpeed] = useState(0);
  const [eta, setEta] = useState('N/A');
  const [socketStatus, setSocketStatus] = useState('Connecting');

  // Simulation controls
  const [isSimulating, setIsSimulating] = useState(false);
  const simInterval = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const fetchTrips = async () => {
    try {
      const res = await fetch('/api/trips');
      if (res.ok) {
        const data = await res.json();
        // Only track ongoing or assigned trips for active simulation
        setTrips(data.trips.filter((t: any) => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  // Set up socket connection
  useEffect(() => {
    // Connect to Socket.IO running on standard server port
    const socket = io();
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketStatus('Connected');
      console.log('Socket.IO connected to server.');
    });

    socket.on('disconnect', () => {
      setSocketStatus('Disconnected');
    });

    socket.on('location-updated', (data) => {
      // Receive telemetry updates in real-time
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

  // Handle trip selection changes
  const handleTripChange = (tripId: string) => {
    setSelectedTripId(tripId);
    const tripObj = trips.find(t => t.id === tripId) || null;
    setSelectedTrip(tripObj);

    if (tripObj) {
      // Join the specific socket room
      socketRef.current?.emit('join-trip', tripId);
      
      // Extract starting coordinates
      const coords = JSON.parse(tripObj.routePoints);
      if (coords.length > 0) {
        setVehiclePos({ lat: coords[0][0], lng: coords[0][1] });
      }
      setSpeed(0);
      setEta('Calculating...');
    } else {
      setVehiclePos(null);
    }

    // Stop existing simulation
    if (isSimulating) {
      stopSimulation();
    }
  };

  // Simulates Driver GPS streaming
  const startSimulation = () => {
    if (!selectedTrip) return;
    const coords = JSON.parse(selectedTrip.routePoints);
    if (coords.length === 0) return;

    setIsSimulating(true);
    let step = 0;

    // Trigger PUT to set trip to IN_PROGRESS if it wasn't already
    fetch(`/api/trips/${selectedTrip.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'IN_PROGRESS' })
    });

    simInterval.current = setInterval(() => {
      if (step >= coords.length) {
        // Reached destination!
        clearInterval(simInterval.current!);
        setIsSimulating(false);
        setSpeed(0);
        setEta('Arrived!');
        // PUT to complete trip
        fetch(`/api/trips/${selectedTrip.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'COMPLETED' })
        });
        return;
      }

      const [lat, lng] = coords[step];
      const curSpeed = Math.floor(60 + Math.random() * 20); // 60 - 80 km/h
      const remainingSteps = coords.length - step;
      const curEta = `${remainingSteps * 2} mins`;

      // Emit telemetry update through Socket.IO (mimics driver's device)
      socketRef.current?.emit('update-location', {
        tripId: selectedTrip.id,
        currentLat: lat,
        currentLng: lng,
        speed: curSpeed,
        eta: curEta
      });

      // Update locally as well (for quick rendering)
      setVehiclePos({ lat, lng });
      setSpeed(curSpeed);
      setEta(curEta);

      step++;
    }, 3000); // Send coordinates update every 3 seconds
  };

  const stopSimulation = () => {
    if (simInterval.current) {
      clearInterval(simInterval.current);
    }
    setIsSimulating(false);
    setSpeed(0);
  };

  // SVG Map projection helper coordinates calculation
  // Normalizes latitude/longitude array values to standard SVG pixels (400x200 canvas)
  const renderSVGMap = () => {
    if (!selectedTrip) return null;
    const coords = JSON.parse(selectedTrip.routePoints);
    if (coords.length === 0) return null;

    // Find min/max ranges to scale map layout
    const lats = coords.map((c: any) => c[0]);
    const lngs = coords.map((c: any) => c[1]);
    const minLat = Math.min(...lats) - 2;
    const maxLat = Math.max(...lats) + 2;
    const minLng = Math.min(...lngs) - 2;
    const maxLng = Math.max(...lngs) + 2;

    const latRange = maxLat - minLat || 1;
    const lngRange = maxLng - minLng || 1;

    // Scale function
    const project = (lat: number, lng: number) => {
      const x = ((lng - minLng) / lngRange) * 500 + 50; // map into [50, 550]
      const y = (1 - (lat - minLat) / latRange) * 200 + 50; // map into [50, 250] - flip Y for map orientation
      return { x, y };
    };

    const pathPoints = coords.map((c: any) => {
      const p = project(c[0], c[1]);
      return `${p.x},${p.y}`;
    }).join(' ');

    const pickupPos = project(coords[0][0], coords[0][1]);
    const dropPos = project(coords[coords.length - 1][0], coords[coords.length - 1][1]);
    const activePos = vehiclePos ? project(vehiclePos.lat, vehiclePos.lng) : null;

    return (
      <svg style={{ width: '100%', height: '320px', background: '#090d16', border: '1px solid var(--border-light)', borderRadius: '12px' }} viewBox="0 0 600 300">
        {/* Render Map Gridlines */}
        <line x1="0" y1="75" x2="600" y2="75" stroke="#131a2e" strokeWidth="1" />
        <line x1="0" y1="150" x2="600" y2="150" stroke="#131a2e" strokeWidth="1" />
        <line x1="0" y1="225" x2="600" y2="225" stroke="#131a2e" strokeWidth="1" />
        <line x1="150" y1="0" x2="150" y2="300" stroke="#131a2e" strokeWidth="1" />
        <line x1="300" y1="0" x2="300" y2="300" stroke="#131a2e" strokeWidth="1" />
        <line x1="450" y1="0" x2="450" y2="300" stroke="#131a2e" strokeWidth="1" />

        {/* Route Line */}
        <polyline 
          points={pathPoints} 
          fill="none" 
          stroke="rgba(139, 92, 246, 0.4)" 
          strokeWidth="4" 
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline 
          points={pathPoints} 
          fill="none" 
          stroke="var(--primary)" 
          strokeWidth="2" 
          strokeDasharray="6 4"
          strokeLinecap="round"
        />

        {/* Pickup Pin */}
        <g transform={`translate(${pickupPos.x}, ${pickupPos.y})`}>
          <circle cx="0" cy="0" r="8" fill="#131a2e" stroke="var(--secondary)" strokeWidth="3" />
          <circle cx="0" cy="0" r="3" fill="var(--secondary)" />
          <text x="12" y="4" fill="var(--text-secondary)" fontSize="10" fontWeight="600">Start: {selectedTrip.pickup.split(',')[0]}</text>
        </g>

        {/* Destination Pin */}
        <g transform={`translate(${dropPos.x}, ${dropPos.y})`}>
          <circle cx="0" cy="0" r="8" fill="#131a2e" stroke="var(--accent-success)" strokeWidth="3" />
          <circle cx="0" cy="0" r="3" fill="var(--accent-success)" />
          <text x="12" y="4" fill="var(--text-secondary)" fontSize="10" fontWeight="600">Dest: {selectedTrip.destination.split(',')[0]}</text>
        </g>

        {/* Active Vehicle Pulse Pin */}
        {activePos && (
          <g transform={`translate(${activePos.x}, ${activePos.y})`}>
            {/* Glowing Ring */}
            <circle cx="0" cy="0" r="16" fill="rgba(16, 185, 129, 0.15)">
              <animate attributeName="r" values="8;20;8" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="0" cy="0" r="6" fill="var(--accent-success)" stroke="white" strokeWidth="2" />
            <text x="10" y="-10" fill="var(--accent-success)" fontSize="9" fontWeight="700">ACTIVE TRUCK</text>
          </g>
        )}
      </svg>
    );
  };

  return (
    <div className="dashboard-content animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Live GPS & Telemetry Tracking</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Monitor transit paths, speeds, and predict ETA updates in real-time</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: socketStatus === 'Connected' ? 'var(--accent-success)' : 'var(--accent-danger)' }}></div>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Websocket: {socketStatus}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Simulator controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Navigation size={20} color="var(--primary)" /> Select Active Trip
            </h3>
            
            <div className="form-group">
              <label className="form-label">Active Transiting Trips</label>
              <select 
                className="form-input" 
                value={selectedTripId}
                onChange={(e) => handleTripChange(e.target.value)}
              >
                <option value="">-- Choose Assigned/Ongoing Trip --</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>{t.trackingNumber} ({t.pickup.split(',')[0]} ➜ {t.destination.split(',')[0]})</option>
                ))}
              </select>
            </div>

            {selectedTrip && (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-light)' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-primary)' }}>Driver GPS Emulator</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '16px' }}>
                  Simulate telemetry signals streaming from the driver&apos;s mobile client. This broadcasts location changes to the Socket.IO cluster, updating dispatcher maps.
                </p>
                {isSimulating ? (
                  <button onClick={stopSimulation} className="btn btn-danger" style={{ width: '100%' }}>
                    <Square size={16} /> Stop GPS Telemetry Stream
                  </button>
                ) : (
                  <button onClick={startSimulation} className="btn btn-primary" style={{ width: '100%', background: 'var(--accent-success)' }}>
                    <Play size={16} /> Start Driver GPS Stream
                  </button>
                )}
              </div>
            )}
          </div>

          {selectedTrip && (
            <div className="glass-panel" style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Telematic Speed</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '8px' }}>
                  <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--secondary)' }}>{speed}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>km/h</span>
                </div>
              </div>
              
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Predictive ETA</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '8px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-warning)' }}>{eta}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Map visualizer */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={20} color="var(--secondary)" /> SVG Telemetry Map Canvas
          </h3>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {selectedTrip ? (
              <div style={{ width: '100%' }}>
                {renderSVGMap()}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>📍 Coordinates: {vehiclePos ? `${vehiclePos.lat.toFixed(4)}, ${vehiclePos.lng.toFixed(4)}` : 'N/A'}</span>
                  <span>Geofence Status: Inside Route Range</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
                🗺️ Select an active transiting trip to project telemetry on the canvas.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
