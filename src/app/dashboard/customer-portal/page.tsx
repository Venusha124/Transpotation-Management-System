'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Bell, Ticket, MapPin, FolderClock, Home, Eye, Search, Plus, Compass, CheckCircle2, RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import SeatMap from '@/components/SeatMap';
import { useLanguage } from '@/components/LanguageProvider';
import { isFutureDate } from '@/lib/validators';

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
  seatNumber?: string;
  tripId?: string;
  rating?: number;
  feedback?: string;
}

interface Trip {
  id: string;
  trackingNumber: string;
  pickup: string;
  destination: string;
  status: string;
  eta: string;
  cargoType: string;
  vehicleId?: string;
  waypoints?: string;
}

export default function PassengerAppPage() {
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  
  // Navigation
  const [activeTab, setActiveTab] = useState<'home' | 'book' | 'track' | 'tickets'>('home');
  
  // Data State
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availableTrips, setAvailableTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  
  // Tracking State
  const [searchTracking, setSearchTracking] = useState('');
  const [trackedTrip, setTrackedTrip] = useState<Trip | null>(null);
  const [trackError, setTrackError] = useState('');
  
  // Booking Form State
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [deliveryType, setDeliveryType] = useState('Standard');
  const [scheduledTime, setScheduledTime] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string | undefined }>({});
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [error, setError] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeBookingId, setDisputeBookingId] = useState<string | null>(null);

  // New Features State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(1000);
  const [isToppingUp, setIsToppingUp] = useState(false);

  const [showRateModal, setShowRateModal] = useState(false);
  const [bookingToRate, setBookingToRate] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetch('/api/trips').then(res => res.json()).then(data => setAvailableTrips(data.trips || []));
    fetch('/api/vehicles').then(res => res.json()).then(data => setVehicles(data.vehicles || []));
    fetchCustomerBookings();
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (selectedTrip) {
      fetch(`/api/bookings?tripId=${selectedTrip.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.bookings) {
            const seats = data.bookings.flatMap((b: any) => 
              b.seatNumber ? b.seatNumber.split(',').map((s: string) => s.trim()) : []
            );
            setBookedSeats(seats);
          }
        })
        .catch(err => console.error("Failed to fetch booked seats", err));
    } else {
      setBookedSeats([]);
    }
  }, [selectedTrip]);

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) setUser(data.user);
      }
    } catch (err) { console.error(err); }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) { console.error(err); }
  };

  const fetchCustomerBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings);
      }
    } catch (err) { console.error(err); }
  };

  const validateFields = () => {
    const errors: { [key: string]: string | undefined } = {};
    const dateCheck = isFutureDate(scheduledTime, 'Travel Date');
    if (!dateCheck.valid) errors.scheduledTime = dateCheck.message;
    if (!selectedTrip) errors.trip = 'Please select a route run.';
    if (selectedSeats.length === 0) errors.seats = 'Please select at least one seat.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateFields()) {
      setError('Please fix the highlighted field errors before confirming.');
      return;
    }

    if (!selectedTrip) return;

    const payload = { 
      pickup: selectedTrip.pickup, 
      destination: selectedTrip.destination, 
      weight: selectedSeats.length, 
      cargoDetails: selectedTrip.cargoType, 
      deliveryType, 
      scheduledTime,
      seatNumber: selectedSeats.join(','),
      tripId: selectedTrip.id
    };

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        setSelectedTrip(null);
        setSelectedSeats([]);
        setScheduledTime('');
        fetchCustomerBookings();
        setActiveTab('tickets');
      }, 2000);
    } catch (err: any) { setError(err.message); }
  };

  const handleTrackPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError(''); setTrackedTrip(null);
    if (!searchTracking) return;

    try {
      const res = await fetch('/api/trips');
      if (res.ok) {
        const data = await res.json();
        const found = data.trips.find((t: any) => t.trackingNumber.toLowerCase() === searchTracking.trim().toLowerCase());
        if (found) setTrackedTrip(found);
        else setTrackError('Tracking number not found.');
      }
    } catch (err) { setTrackError('Failed to query tracking records.'); }
  };

  const handlePayInvoice = async (bookingId: string) => {
    setPaymentError('');
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'PAID' })
      });
      if (res.ok) {
        fetchCustomerBookings();
        fetchUserData(); // refresh balance
      } else {
        const data = await res.json();
        setPaymentError(data.error || 'Payment failed');
        setTimeout(() => setPaymentError(''), 5000);
      }
    } catch (err) { console.error(err); setPaymentError('Network error'); }
  };

  const handleCreateDispute = async () => {
    if (!disputeBookingId || !disputeReason.trim()) return;
    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: disputeBookingId, reason: disputeReason })
      });
      if (res.ok) {
        setDisputeBookingId(null);
        setDisputeReason('');
        alert('Your issue has been reported. Customer support will contact you soon.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTopUpWallet = async () => {
    setIsToppingUp(true);
    try {
      // Simulate Payment Gateway Delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const res = await fetch('/api/users/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: topUpAmount })
      });
      if (res.ok) {
        setShowTopUp(false);
        fetchUserData(); // refresh balance
        fetchNotifications(); // refresh notifications
      }
    } catch (err) { console.error(err); }
    setIsToppingUp(false);
  };

  const handleMarkNotificationsRead = async () => {
    setShowNotifications(true);
    const unread = notifications.filter(n => !n.read).map(n => n.id);
    if (unread.length > 0) {
      await fetch('/api/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notificationIds: unread }) });
      fetchNotifications();
    }
  };

  const handleSubmitRating = async () => {
    if (!bookingToRate) return;
    setIsSubmittingRating(true);
    try {
      const res = await fetch(`/api/bookings/${bookingToRate.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback })
      });
      if (res.ok) {
        setShowRateModal(false);
        setBookingToRate(null);
        fetchCustomerBookings();
      }
    } catch (err) { console.error(err); }
    setIsSubmittingRating(false);
  };

  const renderHome = () => (
    <div className="home-view fade-in-up">
      <div className="top-header">
        <div className="header-top">
          <div>
            <h1 className="greeting">Hello, {user?.name?.split(' ')[0] || 'Passenger'}</h1>
            <p className="subtitle">Ready for your next journey?</p>
          </div>
          <div className="header-icons">
            <button className="icon-btn glass-btn" onClick={handleMarkNotificationsRead} style={{position: 'relative'}}>
              <Bell size={18} />
              {notifications.filter(n => !n.read).length > 0 && (
                <span style={{position: 'absolute', top: '8px', right: '10px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%'}}></span>
              )}
            </button>
          </div>
        </div>

        <div className="main-card float-anim">
          <div className="card-top">
            <div className="logo-box" style={{ background: 'transparent', padding: 0, display: 'flex', alignItems: 'center' }}>
               <img src="/ascendia_logo.png" alt="Ascendia" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'contain', boxShadow: '0 2px 10px rgba(0,0,0,0.5)' }} />
               <span className="logo-text" style={{ marginLeft: '10px', color: '#fff' }}>ASCENDIA<br/>TRANSPORTS</span>
            </div>
            <div className="status-badge"><span className="dot"></span> E-Wallet Active</div>
          </div>
          <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div className="card-info">
              <h3>Passenger ID</h3>
              <p className="id-text">ID {user?.id?.toUpperCase().substring(0,12) || 'PASS-9X2V4A'}</p>
              
              <div className="balances-grid mt-4" style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                <div className="balance-box">
                  <span className="balance-label">WALLET BALANCE</span>
                  <div className="balance-amount" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                     LKR {user?.walletBalance?.toFixed(2) || '0.00'} <Eye size={16} className="eye-icon" />
                  </div>
                </div>
                <button className="btn-success-mobile interactive" style={{ padding: '6px 12px', fontSize: '12px', height: 'fit-content' }} onClick={() => setShowTopUp(true)}>
                  <Plus size={14} /> Top Up
                </button>
              </div>
            </div>
            <div className="qr-container">
               <QRCodeSVG value={`PASS:${user?.id}`} size={70} bgColor="#fff" fgColor="#000" />
            </div>
          </div>
        </div>
      </div>

      <div className="body-content">
        <div className="quick-actions">
          <div className="action-card glass-panel interactive" onClick={() => setActiveTab('book')}>
            <div className="icon-wrapper glass-icon"><Ticket size={24} color="#a78bfa" /></div>
            <h4>Book Ticket</h4>
          </div>
          <div className="action-card glass-panel interactive" onClick={() => setActiveTab('track')}>
            <div className="icon-wrapper glass-icon"><MapPin size={24} color="#34d399" /></div>
            <h4>Track Bus</h4>
          </div>
          <div className="action-card glass-panel interactive" onClick={() => setActiveTab('tickets')}>
            <div className="icon-wrapper glass-icon"><FolderClock size={24} color="#60a5fa" /></div>
            <h4>My Tickets</h4>
          </div>
        </div>

        <div className="section-title">UPCOMING TRIPS</div>
        {bookings.filter(b => b.status === 'APPROVED' || b.status === 'PENDING').length === 0 ? (
          <div className="empty-state-card glass-panel">
            <Compass size={32} color="rgba(255,255,255,0.4)" strokeWidth={1.5} />
            <h4>No Upcoming Trips</h4>
            <p className="empty-text">Book a ticket to get started</p>
            <button className="btn-primary-mobile mt-4 interactive" onClick={() => setActiveTab('book')}>Book Now</button>
          </div>
        ) : (
          <div className="manifest-list">
             {bookings.filter(b => b.status === 'APPROVED' || b.status === 'PENDING').slice(0,3).map((booking, i) => (
                <div key={i} className="manifest-item glass-panel interactive" onClick={() => setActiveTab('tickets')}>
                  <div className="item-left">
                    <div className="icon-badge"><Ticket size={16} color="#60a5fa" /></div>
                    <div>
                      <h4 style={{fontSize: '13px'}}>{booking.pickup.split(',')[0]} ➜ {booking.destination.split(',')[0]}</h4>
                      <p>Ref: BOOK-{booking.id.toUpperCase().slice(0, 8)} | {booking.scheduledTime}</p>
                    </div>
                  </div>
                  <div className="item-right">
                    <span className="seats">{booking.seatNumber || 'Unassigned'}</span>
                    <span className="time">{booking.status}</span>
                  </div>
                </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderBook = () => {
    return (
    <div className="book-view fade-in-up">
      <div className="view-header">
        <h2>{t('book.title')}</h2>
        <p>{t('book.subtitle')}</p>
      </div>

      <div className="issue-form-card glass-panel">
        {bookingSuccess ? (
          <div className="status-box success">
            <div className="glow-circle green-glow"><CheckCircle2 size={64} color="#10b981" /></div>
            <h2 className="text-success mb-2">Booking Confirmed!</h2>
            <p className="mb-6">Your e-ticket is ready in the My Tickets tab.</p>
          </div>
        ) : (
          <form onSubmit={handleBookingSubmit}>
            {error && <div className="error-box mb-4">⚠️ {error}</div>}
            
            <div className="form-group">
              <label>Available Routes</label>
              <select className="glass-input" value={selectedTrip?.id || ''} onChange={(e) => {
                const t = availableTrips.find(t => t.id === e.target.value);
                setSelectedTrip(t || null); setSelectedSeats([]);
              }}>
                <option value="">-- Select a route --</option>
                {availableTrips.filter(t => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS').map(trip => (
                  <option key={trip.id} value={trip.id}>
                    {trip.trackingNumber} : {trip.pickup.split(',')[0]} ➜ {trip.destination.split(',')[0]}
                  </option>
                ))}
              </select>
            </div>

            {selectedTrip && (
              <div className="seat-selection-box glass-panel-inner mt-4 mb-4">
                <label className="mb-2 block text-sm" style={{color:'rgba(255,255,255,0.7)'}}>{t('book.select_seats')}</label>
                {(() => {
                  const vehicle = vehicles.find(v => v.id === selectedTrip.vehicleId);
                  if (!vehicle) return <p className="text-sm">Loading bus layout...</p>;
                  return (
                    <SeatMap 
                      capacity={vehicle.capacity} layout={vehicle.seatLayout || '2x2'}
                      bookedSeats={bookedSeats} selectedSeats={selectedSeats}
                      onSeatSelect={(seatId) => setSelectedSeats(prev => prev.includes(seatId) ? prev.filter(s => s !== seatId) : [...prev, seatId])}
                      maxSelectable={4}
                    />
                  );
                })()}
              </div>
            )}

            <div className="form-group mt-4">
              <label>Passenger Class</label>
              <select className="glass-input" value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)}>
                <option value="Standard">Standard Class</option>
                <option value="Express">Express VIP</option>
              </select>
            </div>

            <div className="form-group mt-4">
              <label>Travel Date</label>
              <input type="date" className="glass-input" value={scheduledTime} onChange={(e) => { setScheduledTime(e.target.value); setFieldErrors(p => ({ ...p, scheduledTime: undefined })); }}
                onBlur={() => { const r = isFutureDate(scheduledTime, 'Travel Date'); if (!r.valid) setFieldErrors(p => ({ ...p, scheduledTime: r.message })); }}
                style={fieldErrors.scheduledTime ? { borderColor: '#fc8181' } : {}} />
              {fieldErrors.scheduledTime && <span style={{ color: '#fc8181', fontSize: '11px', marginTop: '4px', display: 'block' }}>⚠ {fieldErrors.scheduledTime}</span>}
            </div>

            <button type="submit" className="btn-primary-mobile mt-6 interactive">
              Confirm {selectedSeats.length > 0 ? `${selectedSeats.length} Seats` : 'Booking'}
            </button>
          </form>
        )}
      </div>
    </div>
  )};

  const renderTrack = () => {
    return (
    <div className="track-view fade-in-up">
      <div className="view-header">
        <h2>{t('track.title')}</h2>
        <p>{t('track.subtitle')}</p>
      </div>

      <div className="scanner-container glass-panel" style={{textAlign: 'left'}}>
        <form onSubmit={handleTrackPackage}>
          <div className="form-group">
            <input type="text" className="glass-input mb-4" placeholder="e.g. TRIP-2026-1025" value={searchTracking} onChange={(e) => setSearchTracking(e.target.value)} />
            <button type="submit" className="btn-primary-mobile interactive"><Search size={18} /> Track Journey</button>
          </div>
        </form>

        {trackError && <div className="error-box mt-4">⚠️ {trackError}</div>}

        {trackedTrip && (
          <div className="glass-panel-inner mt-6">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <strong className="text-blue">{trackedTrip.trackingNumber}</strong>
              <span className="status-badge" style={{padding: '4px 8px'}}>{trackedTrip.status}</span>
            </div>
            <p className="text-sm mb-2">📍 {trackedTrip.pickup.split(',')[0]} ➜ {trackedTrip.destination.split(',')[0]}</p>
            <p className="text-sm text-green">ETA: <strong>{trackedTrip.eta}</strong></p>

            {trackedTrip.waypoints && (() => {
              try {
                const wp = JSON.parse(trackedTrip.waypoints) as { stop: string; eta: string }[];
                return (
                  <div className="mt-4 pt-4" style={{borderTop: '1px dashed rgba(255,255,255,0.2)'}}>
                    <h4 style={{ fontSize: '12px', marginBottom: '12px', color: 'rgba(255,255,255,0.6)' }}>LIVE ROUTE TIMETABLE</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', background: 'rgba(255,255,255,0.1)' }} />
                      {wp.map((point, index) => {
                        const progress = trackedTrip.status === 'COMPLETED' ? 1 : trackedTrip.status === 'IN_PROGRESS' ? 0.5 : 0;
                        const isPassed = (index / (wp.length - 1)) <= progress;
                        return (
                          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
                            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: isPassed ? '#10b981' : '#0f172a', border: `2px solid ${isPassed ? '#10b981' : 'rgba(255,255,255,0.3)'}`, flexShrink: 0 }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '13px' }}>
                              <span style={{ color: isPassed ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: isPassed ? 600 : 400 }}>{point.stop}</span>
                              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>+{point.eta}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              } catch(e) { return null; }
            })()}
          </div>
        )}
      </div>
    </div>
  )};

  const renderTickets = () => {
    return (
    <div className="history-view fade-in-up">
      <div className="view-header">
        <h2>{t('tickets.title')}</h2>
        <p>{t('tickets.subtitle')}</p>
      </div>
      
      {paymentError && <div className="error-box mb-4">⚠️ {paymentError}</div>}
      
      <div className="manifest-list">
        {bookings.length === 0 ? (
          <div className="empty-state-card glass-panel">No tickets booked yet.</div>
        ) : (
          bookings.map((booking) => (
            <div key={booking.id} className="manifest-item glass-panel">
              <div className="item-left" style={{width: '60%'}}>
                <div className="icon-badge"><Ticket size={16} color="#10b981" /></div>
                <div>
                  <h4 style={{fontSize:'13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                    {booking.pickup.split(',')[0]} ➜ {booking.destination.split(',')[0]}
                  </h4>
                  <p>Ref: BOOK-{booking.id.toUpperCase().slice(0, 8)} | {booking.scheduledTime} | {booking.deliveryType}</p>
                </div>
              </div>
              <div className="item-right" style={{width: '40%'}}>
                <span className="seats" style={{fontSize: '13px'}}>{booking.seatNumber || 'Pending'}</span>
                {booking.status === 'COMPLETED' ? (
                  booking.rating ? (
                    <span className="badge badge-success" style={{fontSize: '10px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid rgba(16,185,129,0.5)'}}>⭐ {booking.rating}/5</span>
                  ) : (
                    <button onClick={() => { setBookingToRate(booking); setShowRateModal(true); setRating(5); setFeedback(''); }} className="btn-primary-mobile" style={{padding: '6px 10px', fontSize: '10px', borderRadius: '6px', marginTop: '4px'}}>Rate Trip</button>
                  )
                ) : booking.paymentStatus === 'PENDING' ? (
                  <button onClick={() => handlePayInvoice(booking.id)} className="btn-success-mobile" style={{padding: '6px 10px', fontSize: '10px', borderRadius: '6px', marginTop: '4px'}}>{t('tickets.pay_now')}</button>
                ) : (
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px'}}>
                    <span className="badge badge-success" style={{fontSize: '10px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid rgba(16,185,129,0.5)'}}>{t('tickets.paid')}</span>
                    <button onClick={() => setDisputeBookingId(booking.id)} className="btn-secondary" style={{padding: '4px 8px', fontSize: '10px', borderRadius: '6px', color: '#fc8181', borderColor: 'rgba(252, 129, 129, 0.3)'}}>Report Issue</button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {disputeBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel max-w-md w-full p-6 relative">
            <h3 className="text-xl font-semibold mb-4 border-b border-white/10 pb-2">Report an Issue</h3>
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>Please describe the issue you faced with this trip. Our support team will investigate and process a refund if applicable.</p>
            <textarea 
              className="glass-input w-full mb-4" 
              rows={4}
              placeholder="E.g., Bus was severely delayed, AC was not working..."
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => {setDisputeBookingId(null); setDisputeReason('');}}>Cancel</button>
              <button className="btn-primary" onClick={handleCreateDispute}>Submit Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )};

  return (
    <div className="mobile-app-wrapper theme-dark-glass">
      <style dangerouslySetInnerHTML={{__html: globalStyles}} />
      
      {activeTab === 'home' && renderHome()}
      {activeTab === 'book' && renderBook()}
      {activeTab === 'track' && renderTrack()}
      {activeTab === 'tickets' && renderTickets()}

      {/* Top Up Modal */}
      {showTopUp && (
        <div className="modal-overlay fade-in-up" style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.75)', zIndex: 10001, display:'flex', alignItems:'flex-start', justifyContent:'center', padding: '60px 20px', overflowY: 'auto'}}>
          <div className="glass-panel" style={{width: '100%', maxWidth: '380px', padding: '28px', borderRadius: '20px', margin: 'auto 0'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
              <h3 style={{margin:0}}>Top Up E-Wallet</h3>
              <button className="glass-btn interactive" onClick={() => setShowTopUp(false)} style={{padding:'6px 12px', borderRadius:'20px', fontSize:'12px'}}>✕ Close</button>
            </div>
            <p className="text-sm" style={{color: 'rgba(255,255,255,0.6)', marginBottom: '20px'}}>Select amount to load via SecureGateway™</p>
            
            <div style={{display: 'flex', gap: '8px', marginBottom: '16px'}}>
               {[1000, 2000, 5000].map(amt => (
                 <button key={amt} className={`glass-btn interactive ${topUpAmount === amt ? 'active-amt' : ''}`} onClick={() => setTopUpAmount(amt)} style={{flex: 1, padding: '10px', borderRadius: '8px', borderColor: topUpAmount === amt ? '#60a5fa' : 'rgba(255,255,255,0.1)'}}>
                   LKR {amt}
                 </button>
               ))}
            </div>
            
            <div className="form-group mb-4">
              <label>Custom Amount (LKR)</label>
              <input type="number" className="glass-input" value={topUpAmount} onChange={(e) => setTopUpAmount(Number(e.target.value))} />
            </div>

            <div style={{display: 'flex', gap: '12px', marginTop: '24px'}}>
              <button className="glass-btn interactive" style={{flex: 1, padding: '14px', borderRadius: '10px'}} onClick={() => setShowTopUp(false)}>Cancel</button>
              <button className="btn-primary-mobile interactive" style={{flex: 1}} onClick={handleTopUpWallet} disabled={isToppingUp}>
                {isToppingUp ? <RefreshCw className="spin-anim" size={18} /> : 'Pay Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Drawer */}
      {showNotifications && (
        <div className="modal-overlay fade-in-up" style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', zIndex: 10001, display:'flex', alignItems:'flex-end'}}>
          <div className="glass-panel" style={{width: '100%', height: '70vh', padding: '24px', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, overflowY: 'auto'}}>
            <div style={{display:'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h3 style={{margin:0}}>Notifications</h3>
              <button className="glass-btn interactive" style={{padding: '6px 12px', borderRadius: '20px', fontSize: '12px'}} onClick={() => setShowNotifications(false)}>Close</button>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              {notifications.length === 0 ? <p style={{color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '20px'}}>No recent notifications.</p> : null}
              {notifications.map(n => (
                <div key={n.id} className="glass-panel-inner" style={{background: n.read ? 'rgba(255,255,255,0.02)' : 'rgba(96,165,250,0.1)'}}>
                  <strong style={{display: 'block', fontSize: '14px', marginBottom: '4px'}}>{n.title}</strong>
                  <p style={{margin:0, fontSize: '13px', color: 'rgba(255,255,255,0.7)'}}>{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRateModal && bookingToRate && (
        <div className="modal-overlay fade-in-up" style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.75)', zIndex: 10001, display:'flex', alignItems:'flex-start', justifyContent:'center', padding: '60px 20px', overflowY: 'auto'}}>
          <div className="glass-panel" style={{width: '100%', maxWidth: '380px', padding: '28px', borderRadius: '20px', margin: 'auto 0'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px'}}>
              <h3 style={{margin:0}}>Rate Your Trip</h3>
              <button className="glass-btn interactive" onClick={() => setShowRateModal(false)} style={{padding:'6px 12px', borderRadius:'20px', fontSize:'12px'}}>✕ Close</button>
            </div>
            <p className="text-sm" style={{color: 'rgba(255,255,255,0.6)', marginBottom: '20px'}}>{bookingToRate.pickup.split(',')[0]} ➜ {bookingToRate.destination.split(',')[0]}</p>
            
            <div style={{display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px'}}>
               {[1, 2, 3, 4, 5].map(star => (
                 <button key={star} onClick={() => setRating(star)} style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '32px', color: star <= rating ? '#fbbf24' : 'rgba(255,255,255,0.2)'}}>
                   ★
                 </button>
               ))}
            </div>
            
            <div className="form-group mb-4">
              <label>Feedback (Optional)</label>
              <textarea className="glass-input" rows={3} placeholder="How was the journey?" value={feedback} onChange={(e) => setFeedback(e.target.value)}></textarea>
            </div>

            <div style={{display: 'flex', gap: '12px', marginTop: '24px'}}>
              <button className="glass-btn interactive" style={{flex: 1, padding: '14px', borderRadius: '10px'}} onClick={() => setShowRateModal(false)}>Cancel</button>
              <button className="btn-primary-mobile interactive" style={{flex: 1}} onClick={handleSubmitRating} disabled={isSubmittingRating}>
                {isSubmittingRating ? 'Saving...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE NAV */}
      <div className="bottom-nav-pill">
        <button className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}><Home size={22} /><span>{t('nav.home')}</span></button>
        <button className={`nav-item ${activeTab === 'book' ? 'active' : ''}`} onClick={() => setActiveTab('book')}><Ticket size={22} /><span>{t('nav.book')}</span></button>
        <button className={`nav-item ${activeTab === 'track' ? 'active' : ''}`} onClick={() => setActiveTab('track')}><MapPin size={22} /><span>{t('nav.track')}</span></button>
        <button className={`nav-item ${activeTab === 'tickets' ? 'active' : ''}`} onClick={() => setActiveTab('tickets')}><FolderClock size={22} /><span>{t('nav.tickets')}</span></button>
      </div>
    </div>
  );
}

const globalStyles = `
  .mobile-app-wrapper { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999; display: flex; flex-direction: column; overflow: hidden; font-family: 'Inter', sans-serif; color: #f8fafc; background: linear-gradient(135deg, rgba(2, 6, 23, 1) 0%, rgba(15, 23, 42, 1) 100%); }
  .fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

  .glass-panel { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4); }
  .glass-panel-inner { background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(56, 189, 248, 0.1); border-radius: 12px; padding: 16px; }
  .glass-btn { background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(56, 189, 248, 0.3); color: #fff; backdrop-filter: blur(8px); transition: all 0.2s; }
  .glass-btn:hover { border-color: rgba(56, 189, 248, 0.8); box-shadow: 0 0 10px rgba(56, 189, 248, 0.2); }
  .glass-input { background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(56, 189, 248, 0.3); color: white; padding: 14px; border-radius: 10px; width: 100%; outline: none; transition: all 0.2s; }
  .glass-input:focus { border-color: rgba(56, 189, 248, 0.8); box-shadow: 0 0 10px rgba(56, 189, 248, 0.2); }
  .glass-input option { background: #0f172a; color: white; }

  .interactive { transition: transform 0.2s, box-shadow 0.2s, background 0.2s; cursor: pointer; }
  .interactive:active { transform: scale(0.96); }

  .text-gradient { background: linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .text-green { color: #10b981 !important; }
  .text-blue { color: #38bdf8 !important; }
  .mt-2 { margin-top: 8px; }
  .mt-4 { margin-top: 16px; }
  .mt-6 { margin-top: 24px; }
  .mb-2 { margin-bottom: 8px; }
  .mb-4 { margin-bottom: 16px; }
  .mb-6 { margin-bottom: 24px; }
  .pt-4 { padding-top: 16px; }
  .block { display: block; }
  .text-sm { font-size: 13px; }

  /* Top Header Area */
  .top-header { padding: 32px 20px 20px; }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
  .greeting { font-size: 22px; font-weight: 800; margin: 0 0 4px 0; letter-spacing: -0.02em; }
  .subtitle { font-size: 14px; color: rgba(255,255,255,0.6); margin: 0; font-family: monospace; font-weight: bold; }
  .header-icons { display: flex; gap: 12px; }
  .icon-btn { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }

  /* E-Wallet Passenger Card */
  .main-card { background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(12px); border: 1px solid rgba(56, 189, 248, 0.3); color: white; border-radius: 20px; padding: 24px; box-shadow: 0 12px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(56, 189, 248, 0.05); }
  .float-anim { animation: floatBob 6s ease-in-out infinite; }
  @keyframes floatBob { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
  .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
  .logo-box { background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); }
  .logo-text { color: #38bdf8; font-weight: 900; font-style: italic; font-size: 10px; line-height: 1; letter-spacing: 1px; }
  .status-badge { background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.5); color: #34d399; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
  .dot { width: 6px; height: 6px; background: #34d399; border-radius: 50%; box-shadow: 0 0 8px #34d399; }
  .card-info h3 { font-size: 16px; font-weight: 600; color: white; margin: 0 0 4px; }
  .id-text { font-size: 13px; color: #94a3b8; margin: 0; font-family: monospace; }
  .balances-grid { margin-top: 16px; }
  .balance-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 4px; }
  .balance-amount { font-size: 22px; font-weight: 800; color: #fff; }
  .eye-icon { color: rgba(56,189,248,0.8); background: rgba(56,189,248,0.1); padding: 4px; border-radius: 6px; width: 26px; height: 26px; }
  .qr-container { background: rgba(255,255,255,0.9); padding: 8px; border-radius: 12px; box-shadow: 0 0 15px rgba(56, 189, 248, 0.2); }

  /* Body Content */
  .body-content { flex: 1; padding: 20px 20px 100px; overflow-y: auto; }
  .quick-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
  .action-card { padding: 16px 8px; text-align: center; }
  .action-card:hover { background: rgba(56, 189, 248, 0.1); border-color: rgba(56, 189, 248, 0.4); box-shadow: 0 0 15px rgba(56, 189, 248, 0.1); }
  .icon-wrapper { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(56, 189, 248, 0.2); }
  .action-card h4 { font-size: 12px; font-weight: 600; margin: 0; color: #fff; }
  .section-title { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px; }
  .empty-state-card { padding: 40px 20px; text-align: center; }
  .empty-state-card svg { margin: 0 auto 16px; color: rgba(56, 189, 248, 0.5); }
  .empty-state-card h4 { font-size: 16px; font-weight: 600; color: #fff; margin: 0 0 6px; }
  .empty-text { font-size: 14px; color: rgba(255,255,255,0.5); font-weight: 500; margin: 0; }
  .error-box { background: rgba(239,68,68,0.1); color: #f87171; border: 1px solid rgba(239,68,68,0.2); padding: 12px; border-radius: 8px; font-size: 13px; }

  /* Views */
  .home-view { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .book-view, .track-view, .history-view { padding: 32px 20px 120px; flex: 1; overflow-y: auto; }
  .view-header { margin-bottom: 24px; }
  .view-header h2 { font-size: 26px; font-weight: 800; color: #fff; margin: 0 0 6px; }
  .view-header p { font-size: 14px; color: rgba(255,255,255,0.6); margin: 0; font-family: monospace; font-weight: bold; }

  .scanner-container { padding: 16px; }
  .btn-primary-mobile { background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); color: white; border: none; padding: 16px; border-radius: 12px; font-size: 16px; font-weight: 700; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 8px 20px rgba(14, 165, 233, 0.3); transition: all 0.2s; }
  .btn-primary-mobile:hover { box-shadow: 0 8px 25px rgba(14, 165, 233, 0.5); transform: translateY(-1px); }
  .btn-success-mobile { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; padding: 16px; border-radius: 12px; font-size: 16px; font-weight: 700; width: 100%; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3); transition: all 0.2s; }

  .status-box { text-align: center; padding: 30px 10px; }
  .glow-circle { width: 100px; height: 100px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
  .green-glow { background: rgba(16,185,129,0.1); box-shadow: 0 0 30px rgba(16,185,129,0.2); }
  .text-success { color: #34d399; font-size: 28px; font-weight: 800; }

  /* Issue Form */
  .issue-form-card { padding: 24px; }

  /* Manifest & Seat Map */
  .manifest-list { display: flex; flex-direction: column; gap: 12px; }
  .manifest-item { padding: 16px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(56, 189, 248, 0.1); border-radius: 12px; background: rgba(15, 23, 42, 0.5); }
  .item-left { display: flex; align-items: center; gap: 14px; }
  .icon-badge { background: rgba(56, 189, 248, 0.1); padding: 8px; border-radius: 50%; color: #38bdf8; }
  .item-left h4 { margin: 0 0 4px 0; font-size: 15px; font-weight: 700; color: #fff; }
  .item-left p { margin: 0; font-size: 12px; color: rgba(255,255,255,0.5); }
  .item-right { text-align: right; }
  .seats { display: block; font-size: 15px; font-weight: 800; color: #38bdf8; margin-bottom: 4px; }
  .time { display: block; font-size: 11px; color: rgba(255,255,255,0.4); }
  
  /* Bottom Nav */
  .bottom-nav-pill { position: fixed; bottom: 24px; left: 24px; right: 24px; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(24px); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 40px; display: flex; justify-content: space-around; align-items: center; padding: 8px; z-index: 1000; box-shadow: 0 10px 40px rgba(0,0,0,0.6), inset 0 0 15px rgba(56, 189, 248, 0.05); }
  .nav-item { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; background: transparent; border: none; cursor: pointer; color: rgba(255,255,255,0.4); font-size: 10px; font-weight: 600; padding: 10px 16px; border-radius: 30px; transition: 0.3s; }
  .nav-item.active { color: #fff; background: rgba(56, 189, 248, 0.1); box-shadow: inset 0 0 10px rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.2); }
  .nav-item.active svg { transform: scale(1.1); color: #38bdf8; }
  .spin-anim { animation: spin 1s linear infinite; }
  @keyframes spin { 100% { transform: rotate(360deg); } }
  .active-amt { background: rgba(56, 189, 248, 0.2) !important; color: #38bdf8 !important; border: 1px solid rgba(56, 189, 248, 0.3); }
`;
