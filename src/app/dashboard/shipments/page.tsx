'use client';

import React, { useEffect, useState } from 'react';
import { FileCheck, Compass, QrCode, Barcode } from 'lucide-react';

interface Trip {
  id: string;
  trackingNumber: string;
  pickup: string;
  destination: string;
  status: string;
  cargoType: string;
  weight: number;
  eta: string;
}

export default function ShipmentsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const fetchTrips = async () => {
    try {
      const res = await fetch('/api/trips');
      if (res.ok) {
        const data = await res.json();
        setTrips(data.trips);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleSelectTrip = (id: string) => {
    setSelectedTripId(id);
    setSelectedTrip(trips.find(t => t.id === id) || null);
  };

  // SVG barcode generator based on tracking number string
  const renderSVGBarcode = (text: string) => {
    const bars = [];
    let x = 10;
    // Simple mock pattern based on character codes
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      const width1 = (code % 3) + 1;
      const width2 = (code % 2) + 1;
      bars.push(<rect key={`${i}-1`} x={x} y={10} width={width1} height={60} fill="var(--text-primary)" />);
      x += width1 + 2;
      bars.push(<rect key={`${i}-2`} x={x} y={10} width={width2} height={60} fill="var(--text-primary)" />);
      x += width2 + 3;
    }
    return (
      <svg style={{ width: '100%', height: '80px', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-light)', borderRadius: '8px', padding: '10px' }} viewBox={`0 0 ${x + 10} 80`}>
        {bars}
        <text x="50%" y="76" fill="var(--text-secondary)" fontSize="10" textAnchor="middle" letterSpacing="2">{text}</text>
      </svg>
    );
  };

  // SVG QR Code generator (renders typical QR finder patterns and mock pixel noise)
  const renderSVGQRCode = (text: string) => {
    // Generate static nested squares for the three finder patterns
    const renderFinder = (x: number, y: number) => (
      <g>
        <rect x={x} y={y} width={28} height={28} fill="none" stroke="var(--primary)" strokeWidth="4" />
        <rect x={x + 6} y={y + 6} width={16} height={16} fill="var(--primary)" />
      </g>
    );

    // Seeded random block matrix to look like a realistic QR code
    const matrix = [];
    const size = 18; // 18x18 pixels
    let seed = 0;
    for (let i = 0; i < text.length; i++) {
      seed += text.charCodeAt(i);
    }

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Skip finder pattern zones (top-left, top-right, bottom-left)
        if (
          (r < 7 && c < 7) ||
          (r < 7 && c > size - 8) ||
          (r > size - 8 && c < 7)
        ) {
          continue;
        }
        // Pseudo-random noise based on seed
        const val = ((r * c + seed + (r * 13) + (c * 17)) % 7) > 3;
        if (val) {
          matrix.push(<rect key={`${r}-${c}`} x={c * 4 + 8} y={r * 4 + 8} width={3.5} height={3.5} fill="var(--text-primary)" />);
        }
      }
    }

    return (
      <svg style={{ width: '100px', height: '100px', background: 'white', borderRadius: '8px', padding: '6px' }} viewBox="0 0 92 92">
        {/* White background and finder squares */}
        <rect x="0" y="0" width="92" height="92" fill="white" />
        {/* Draw Finder blocks in dark blue/slate color */}
        <g stroke="#0f172a" fill="#0f172a">
          {/* Top Left */}
          <rect x="6" y="6" width="28" height="28" fill="none" stroke="#0f172a" strokeWidth="4" />
          <rect x="12" y="12" width="16" height="16" />
          {/* Top Right */}
          <rect x="58" y="6" width="28" height="28" fill="none" stroke="#0f172a" strokeWidth="4" />
          <rect x="64" y="12" width="16" height="16" />
          {/* Bottom Left */}
          <rect x="6" y="58" width="28" height="28" fill="none" stroke="#0f172a" strokeWidth="4" />
          <rect x="12" y="64" width="16" height="16" />
        </g>
        {/* Random elements inside */}
        <g fill="#0f172a">
          {matrix}
        </g>
      </svg>
    );
  };

  return (
    <div className="dashboard-content animate-fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Cargo Shipment Tracker</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>Monitor cargo manifests, timelines, and generate barcodes</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Shipment Selector */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCheck size={20} color="var(--primary)" /> Shipment Manifests
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
            {trips.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '30px' }}>No shipments available.</p>
            ) : (
              trips.map((trip) => (
                <div 
                  key={trip.id}
                  onClick={() => handleSelectTrip(trip.id)}
                  className={`glass-panel`}
                  style={{ 
                    padding: '16px', 
                    cursor: 'pointer', 
                    borderWidth: '1px',
                    borderColor: selectedTripId === trip.id ? 'var(--primary)' : 'var(--border-light)',
                    background: selectedTripId === trip.id ? 'rgba(139,92,246,0.05)' : 'rgba(255,255,255,0.01)',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>{trip.trackingNumber}</span>
                    <span className={`badge ${
                      trip.status === 'ASSIGNED' ? 'badge-warning' : 
                      trip.status === 'IN_PROGRESS' ? 'badge-info' : 'badge-success'
                    }`}>{trip.status}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{trip.pickup.split(',')[0]} ➔ {trip.destination.split(',')[0]}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detailed Timeline and Barcodes */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          {selectedTrip ? (
            <div>
              <h3 style={{ fontSize: '18px', marginBottom: '20px', color: 'var(--text-primary)' }}>
                Shipment {selectedTrip.trackingNumber}
              </h3>

              {/* Progress Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', margin: '20px 10px', position: 'relative' }}>
                {/* Timeline vertical bar */}
                <div style={{ position: 'absolute', left: '19px', top: '10px', bottom: '10px', width: '2px', background: 'var(--border-light)', zIndex: 1 }}></div>

                {/* Step 1: Assigned */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 2 }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid var(--bg-surface)' }}>
                    <span>📦</span>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Assigned for Dispatch</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Origin: {selectedTrip.pickup}</p>
                  </div>
                </div>

                {/* Step 2: Transit */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 2 }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    background: selectedTrip.status === 'IN_PROGRESS' || selectedTrip.status === 'COMPLETED' ? 'var(--secondary)' : 'var(--border-light)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '4px solid var(--bg-surface)'
                  }}>
                    <span>🚛</span>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: selectedTrip.status === 'IN_PROGRESS' || selectedTrip.status === 'COMPLETED' ? 'var(--text-primary)' : 'var(--text-muted)' }}>In Transit</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Speed and location streamed dynamically</p>
                  </div>
                </div>

                {/* Step 3: Arrived */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 2 }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    background: selectedTrip.status === 'COMPLETED' ? 'var(--accent-success)' : 'var(--border-light)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '4px solid var(--bg-surface)'
                  }}>
                    <span>🏁</span>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: selectedTrip.status === 'COMPLETED' ? 'var(--text-primary)' : 'var(--text-muted)' }}>Arrived at Destination</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Destination: {selectedTrip.destination}</p>
                  </div>
                </div>
              </div>

              {/* Barcode & QR Code Section */}
              <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--border-light)' }}>
                <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '14px' }}>
                  Waybill Manifest Identifiers
                </h4>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    {renderSVGBarcode(selectedTrip.trackingNumber)}
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {renderSVGQRCode(selectedTrip.trackingNumber)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '50px 0' }}>
              📦 Select a shipment code from the manifest list to display transit details and waybills.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
