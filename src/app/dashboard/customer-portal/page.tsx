'use client';

import React, { useEffect, useState } from 'react';
import { FolderClock, Plus, Search, MapPin, Compass } from 'lucide-react';

interface Booking {
  id: string;
  pickup: string;
  destination: string;
  weight: number;
  cargoDetails: string;
  deliveryType: string;
  status: string;
  paymentStatus: string;
  scheduledTime: string;
}

interface Trip {
  trackingNumber: string;
  pickup: string;
  destination: string;
  status: string;
  eta: string;
  currentLat?: number;
  currentLng?: number;
  routePoints: string;
}

export default function CustomerPortalPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTracking, setSearchTracking] = useState('');
  const [trackedTrip, setTrackedTrip] = useState<Trip | null>(null);
  const [trackError, setTrackError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [weight, setWeight] = useState('');
  const [cargoDetails, setCargoDetails] = useState('');
  const [deliveryType, setDeliveryType] = useState('Standard');
  const [scheduledTime, setScheduledTime] = useState('');

  const fetchCustomerBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCustomerBookings();
  }, []);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payload = { pickup, destination, weight, cargoDetails, deliveryType, scheduledTime };

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setModalOpen(false);
      // Reset form
      setPickup('');
      setDestination('');
      setWeight('');
      setCargoDetails('');
      setScheduledTime('');
      fetchCustomerBookings();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleTrackPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError('');
    setTrackedTrip(null);

    if (!searchTracking) return;

    try {
      const res = await fetch('/api/trips');
      if (res.ok) {
        const data = await res.json();
        const found = data.trips.find((t: any) => 
          t.trackingNumber.toLowerCase() === searchTracking.trim().toLowerCase()
        );

        if (found) {
          setTrackedTrip(found);
        } else {
          setTrackError('Shipment tracking number not found in system registers.');
        }
      }
    } catch (err) {
      setTrackError('Failed to query tracking records.');
    }
  };

  const handlePayInvoice = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'PAID' })
      });
      if (res.ok) fetchCustomerBookings();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-content animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Customer Cargo Portal</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Book new cargo consignments and verify live shipment positions</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn btn-primary">
          <Plus size={16} /> Book Cargo
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Tracking Widget */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔍 Track Consignment
          </h3>
          <form onSubmit={handleTrackPackage} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input 
              type="text" 
              placeholder="Enter Tracking ID (e.g. TRIP-2026-1025)" 
              className="form-input" 
              value={searchTracking}
              onChange={(e) => setSearchTracking(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary">Track</button>
          </form>

          {trackError && <div style={{ fontSize: '12px', color: '#f87171', marginBottom: '16px' }}>⚠️ {trackError}</div>}

          {trackedTrip ? (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <strong style={{ color: 'var(--secondary)' }}>{trackedTrip.trackingNumber}</strong>
                <span className="badge badge-info">{trackedTrip.status}</span>
              </div>
              <p style={{ fontSize: '13px', lineHeight: 1.5, marginBottom: '10px' }}>
                📍 Routing from <strong>{trackedTrip.pickup.split(',')[0]}</strong> to <strong>{trackedTrip.destination.split(',')[0]}</strong>
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Predictive Arrival ETA: <strong>{trackedTrip.eta}</strong></p>

              {/* Progress Bar */}
              <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ 
                  background: 'var(--primary)', 
                  height: '100%', 
                  width: trackedTrip.status === 'COMPLETED' ? '100%' : 
                         trackedTrip.status === 'IN_PROGRESS' ? '50%' : '15%',
                  transition: 'width 0.5s ease' 
                }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
                <span>Scheduled</span>
                <span>In Transit</span>
                <span>Delivered</span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0', fontSize: '12px' }}>
              Enter a trip tracking reference above to pull real-time location.
            </div>
          )}
        </div>

        {/* History / Invoices Widget */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderClock size={20} color="var(--secondary)" /> Previous Booking Manifests
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '360px', overflowY: 'auto' }}>
            {bookings.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '30px' }}>No bookings scheduled yet.</p>
            ) : (
              bookings.map((booking) => (
                <div key={booking.id} style={{ padding: '14px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{booking.pickup.split(',')[0]} ➜ {booking.destination.split(',')[0]}</h4>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{booking.cargoDetails} ({booking.weight} kg)</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <span className={`badge ${booking.status === 'APPROVED' ? 'badge-success' : 'badge-warning'}`}>{booking.status}</span>
                    {booking.paymentStatus === 'PENDING' ? (
                      <button 
                        onClick={() => handlePayInvoice(booking.id)}
                        className="btn btn-primary" 
                        style={{ padding: '4px 8px', fontSize: '10px', background: 'var(--accent-success)' }}
                      >
                        💵 Pay Invoice
                      </button>
                    ) : (
                      <span className="badge badge-success">PAID</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Book Cargo Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '30px', background: 'var(--bg-surface)' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Book Cargo Consignment</h2>
            
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleBookingSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Pickup Facility Address</label>
                  <input type="text" className="form-input" required value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="e.g. Orugodawatta Yard, Colombo" />
                </div>
                <div className="form-group">
                  <label className="form-label">Destination Facility Address</label>
                  <input type="text" className="form-input" required value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Goods Yard, Kandy" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Cargo Weight (kg)</label>
                  <input type="number" className="form-input" required value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 4500" />
                </div>
                <div className="form-group">
                  <label className="form-label">Delivery Class Priority</label>
                  <select className="form-input" value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)}>
                    <option value="Standard">Standard Class Delivery</option>
                    <option value="Express">Express Air/Road Cargo</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Cargo Details Manifest</label>
                <input type="text" className="form-input" required value={cargoDetails} onChange={(e) => setCargoDetails(e.target.value)} placeholder="e.g. Industrial pipes, spare electronics" />
              </div>

              <div className="form-group">
                <label className="form-label">Preferred Dispatch Date</label>
                <input type="date" className="form-input" required value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
