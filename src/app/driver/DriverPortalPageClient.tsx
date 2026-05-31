'use client';

import React, { useEffect, useState } from 'react';
import { Bell, MapPin, Play, CheckCircle2, AlertOctagon, Bus, Clock, User, LogOut, CheckCircle, RefreshCw, Eye, Power, LayoutDashboard } from 'lucide-react';

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
  vehicle?: {
    number: string;
    model: string;
  };
}

interface DriverProfile {
  id: string;
  name: string;
  nic: string;
  contact: string;
  address: string;
  licenseNumber: string;
  experience: number;
  salary: number;
  availability: boolean;
  attendanceStatus: string;
  rating: number;
}

interface DriverPortalPageClientProps {
  initialUser: any;
}

export default function DriverPortalPageClient({ initialUser }: DriverPortalPageClientProps) {
  const [user, setUser] = useState<any>(initialUser);
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdatingAttendance, setIsUpdatingAttendance] = useState(false);

  const fetchDriverData = async () => {
    try {
      const resDrivers = await fetch('/api/drivers');
      if (resDrivers.ok) {
        const data = await resDrivers.json();
        const matched = data.drivers?.find((d: any) => d.userId === initialUser.id);
        if (matched) {
          setDriverProfile(matched);
          
          // Fetch trips for this driver
          const resTrips = await fetch('/api/trips');
          if (resTrips.ok) {
            const tripsData = await resTrips.json();
            const filteredTrips = tripsData.trips?.filter((t: any) => t.driverId === matched.id) || [];
            setTrips(filteredTrips);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load driver details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverData();
  }, []);

  const handleToggleAttendance = async () => {
    if (!driverProfile) return;
    setIsUpdatingAttendance(true);
    const newStatus = driverProfile.attendanceStatus === 'Present' ? 'Absent' : 'Present';
    const newAvailability = newStatus === 'Present';
    try {
      const res = await fetch(`/api/drivers/${driverProfile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendanceStatus: newStatus, availability: newAvailability }),
      });
      if (res.ok) {
        setDriverProfile(prev => prev ? { ...prev, attendanceStatus: newStatus, availability: newAvailability } : null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingAttendance(false);
    }
  };

  const handleUpdateTripStatus = async (tripId: string, status: string, additionalData: any = {}) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...additionalData }),
      });
      if (res.ok) {
        await fetchDriverData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReportDelay = (tripId: string, currentEta: string) => {
    const delayReason = prompt("Enter reason for delay (e.g. Traffic Congestion, Road Work):");
    if (!delayReason) return;
    
    const newEta = prompt(`Enter new estimated journey duration (Current: ${currentEta}):`, `${currentEta} + 30 mins`);
    if (!newEta) return;

    handleUpdateTripStatus(tripId, 'IN_PROGRESS', { delayReason, eta: newEta });
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const activeTrip = trips.find(t => t.status === 'IN_PROGRESS' || t.status === 'IN_TRANSIT');
  const upcomingTrips = trips.filter(t => t.status === 'ASSIGNED' || t.status === 'PENDING');
  const completedTrips = trips.filter(t => t.status === 'COMPLETED');

  if (loading && !driverProfile) {
    return (
      <div className="mobile-app-wrapper theme-dark-glass" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
        <RefreshCw className="spin-anim text-blue" size={48} />
        <h3 className="mt-4">Loading Driver Profile...</h3>
      </div>
    );
  }

  if (!driverProfile) {
    return (
      <div className="mobile-app-wrapper theme-dark-glass" style={{ justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', maxWidth: '380px' }}>
          <AlertOctagon size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <h2>Profile Not Linked</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: '12px 0 24px' }}>
            Your account is not linked to any active Driver record. Please contact administration.
          </p>
          <button className="btn-secondary-mobile interactive" onClick={handleLogout}>Log Out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-app-wrapper theme-dark-glass">
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />

      {/* Header */}
      <div className="top-header">
        <div className="header-top">
          <div>
            <h1 className="greeting">Driver Console</h1>
            <p className="subtitle">Welcome, {driverProfile.name.split(' ')[0]}</p>
          </div>
          <div className="header-icons" style={{ display: 'flex', gap: '8px' }}>
            {['ADMIN', 'TRANSPORT_MANAGER', 'DISPATCHER'].includes(user.role) && (
              <button 
                className="icon-btn glass-btn" 
                onClick={() => window.location.href = '/dashboard'} 
                title="Back to Dashboard"
              >
                <LayoutDashboard size={18} />
              </button>
            )}
            <button className="icon-btn glass-btn" onClick={handleLogout} title="Log Out"><LogOut size={18} /></button>
          </div>
        </div>

        {/* Driver Profile Card */}
        <div className="main-card float-anim">
          <div className="card-top">
            <div className="logo-box" style={{ background: 'transparent', padding: 0, display: 'flex', alignItems: 'center' }}>
               <img src="/ascendia_logo.png" alt="Ascendia" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'contain' }} />
               <span className="logo-text" style={{ marginLeft: '10px', color: '#fff' }}>ASCENDIA<br/>TRANSPORTS</span>
            </div>
            <button 
              className={`status-badge interactive ${driverProfile.attendanceStatus === 'Present' ? 'active-badge' : 'inactive-badge'}`}
              onClick={handleToggleAttendance}
              disabled={isUpdatingAttendance}
              style={{ border: 'none', cursor: 'pointer' }}
            >
              <span className="dot"></span> {driverProfile.attendanceStatus === 'Present' ? 'Present (Active)' : 'Absent (Offline)'}
            </button>
          </div>
          <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div className="card-info">
              <h3>License: {driverProfile.licenseNumber}</h3>
              <p className="id-text">{driverProfile.experience} Years Experience | ⭐ {driverProfile.rating.toFixed(1)} Rating</p>
              <div className="balances-grid mt-4">
                <div className="balance-box">
                  <span className="balance-label">TODAY'S TRIP ASSIGNMENTS</span>
                  <div className="balance-amount">{trips.length} Runs</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="body-content">
        
        {/* ── SECTION 1: ACTIVE RUN ── */}
        <div className="section-title">ACTIVE RUN</div>
        {activeTrip ? (
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', borderLeft: '4px solid #38bdf8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
              <span className="text-blue font-bold" style={{ fontSize: '15px' }}>{activeTrip.trackingNumber}</span>
              <span className="status-badge" style={{ background: 'rgba(56,189,248,0.15)', borderColor: '#38bdf8', color: '#38bdf8' }}>In Transit</span>
            </div>
            
            <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 8px 0' }}>
              {activeTrip.pickup.split(',')[0]} ➜ {activeTrip.destination.split(',')[0]}
            </h3>
            
            <div className="glass-panel-inner" style={{ margin: '16px 0', padding: '12px' }}>
              <p className="text-sm" style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bus size={14} className="text-blue" /> Bus Number: <strong>{activeTrip.vehicle?.number || 'WP-NB-4321'}</strong>
              </p>
              <p className="text-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={14} className="text-green" /> Duration Estimate: <strong>{activeTrip.eta}</strong>
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button 
                onClick={() => handleReportDelay(activeTrip.id, activeTrip.eta)} 
                className="glass-btn interactive" 
                style={{ flex: 1, padding: '14px', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                ⚠️ Report Delay
              </button>
              <button 
                onClick={() => handleUpdateTripStatus(activeTrip.id, 'COMPLETED')} 
                className="btn-primary-mobile interactive" 
                style={{ flex: 1, padding: '14px', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
              >
                <CheckCircle2 size={16} /> Complete Run
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-state-card glass-panel" style={{ marginBottom: '24px' }}>
            <Clock size={32} color="rgba(255,255,255,0.4)" strokeWidth={1.5} />
            <h4>No Active Journey</h4>
            <p className="empty-text">Select an upcoming run below to start your shift.</p>
          </div>
        )}

        {/* ── SECTION 2: UPCOMING RUNS ── */}
        <div className="section-title">UPCOMING ASSIGNMENTS</div>
        {upcomingTrips.length === 0 ? (
          <div className="empty-state-card glass-panel" style={{ marginBottom: '24px', padding: '24px' }}>
            <p className="empty-text">No pending assignments for today.</p>
          </div>
        ) : (
          <div className="manifest-list" style={{ marginBottom: '24px' }}>
            {upcomingTrips.map((trip) => (
              <div key={trip.id} className="manifest-item glass-panel" style={{ padding: '16px', display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>{trip.trackingNumber}</span>
                  <span className="status-badge" style={{ padding: '2px 8px', fontSize: '10px', background: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.4)', color: '#f59e0b' }}>Assigned</span>
                </div>
                <h4 style={{ fontSize: '14px', fontWeight: '800', margin: '0 0 6px 0' }}>
                  {trip.pickup.split(',')[0]} ➜ {trip.destination.split(',')[0]}
                </h4>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 12px 0' }}>
                  Bus: {trip.vehicle?.number || 'WP-NB-4321'} | Pax Count: {trip.weight}
                </p>
                <button 
                  onClick={() => handleUpdateTripStatus(trip.id, 'IN_PROGRESS')} 
                  disabled={!!activeTrip}
                  className="btn-primary-mobile interactive" 
                  style={{ 
                    padding: '10px', 
                    borderRadius: '8px', 
                    fontSize: '12px', 
                    opacity: activeTrip ? 0.5 : 1, 
                    cursor: activeTrip ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Play size={12} /> Start Journey Run
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── SECTION 3: COMPLETED HISTORY ── */}
        <div className="section-title">COMPLETED HISTORY</div>
        {completedTrips.length === 0 ? (
          <div className="empty-state-card glass-panel" style={{ padding: '24px' }}>
            <p className="empty-text">No runs completed yet.</p>
          </div>
        ) : (
          <div className="manifest-list">
            {completedTrips.map((trip) => (
              <div key={trip.id} className="manifest-item glass-panel" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.7 }}>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 4px 0' }}>
                    {trip.pickup.split(',')[0]} ➜ {trip.destination.split(',')[0]}
                  </h4>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                    Finished: {trip.endAt ? new Date(trip.endAt).toLocaleTimeString() : 'N/A'}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <CheckCircle size={12} color="#34d399" />
                  <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 'bold' }}>Done</span>
                </div>
              </div>
            ))}
          </div>
        )}

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
  
  .interactive { transition: transform 0.2s, box-shadow 0.2s, background 0.2s; cursor: pointer; }
  .interactive:active { transform: scale(0.96); }

  .text-gradient { background: linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .text-green { color: #10b981 !important; }
  .text-blue { color: #38bdf8 !important; }
  .mt-4 { margin-top: 16px; }
  .mb-6 { margin-bottom: 24px; }
  .font-bold { font-weight: bold; }

  /* Top Header Area */
  .top-header { padding: 32px 20px 20px; }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
  .greeting { font-size: 22px; font-weight: 800; margin: 0 0 4px 0; letter-spacing: -0.02em; }
  .subtitle { font-size: 14px; color: rgba(255,255,255,0.6); margin: 0; font-family: monospace; font-weight: bold; }
  .header-icons { display: flex; gap: 12px; }
  .icon-btn { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }

  /* Main Driver Card */
  .main-card { background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(12px); border: 1px solid rgba(56, 189, 248, 0.3); color: white; border-radius: 20px; padding: 24px; box-shadow: 0 12px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(56, 189, 248, 0.05); }
  .float-anim { animation: floatBob 6s ease-in-out infinite; }
  @keyframes floatBob { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
  .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
  .logo-box { background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); }
  .logo-text { color: #38bdf8; font-weight: 900; font-style: italic; font-size: 10px; line-height: 1; letter-spacing: 1px; }
  
  .status-badge { padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 6px; border: 1px solid rgba(255,255,255,0.1); }
  .active-badge { background: rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.5); color: #34d399; }
  .active-badge .dot { background: #34d399; box-shadow: 0 0 8px #34d399; }
  .inactive-badge { background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.5); color: #f87171; }
  .inactive-badge .dot { background: #f87171; box-shadow: 0 0 8px #f87171; }
  .dot { width: 6px; height: 6px; border-radius: 50%; }

  .card-info h3 { font-size: 16px; font-weight: 600; color: white; margin: 0 0 4px; }
  .id-text { font-size: 13px; color: #94a3b8; margin: 0; font-family: monospace; }
  .balances-grid { margin-top: 16px; }
  .balance-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 4px; }
  .balance-amount { font-size: 22px; font-weight: 800; color: #fff; }

  /* Body Content */
  .body-content { flex: 1; padding: 20px 20px 60px; overflow-y: auto; }
  .manifest-list { display: flex; flex-direction: column; gap: 12px; }
  .manifest-item { padding: 16px; border: 1px solid rgba(56, 189, 248, 0.1); border-radius: 12px; background: rgba(15, 23, 42, 0.5); }
  .section-title { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px; }
  .empty-state-card { padding: 40px 20px; text-align: center; }
  .empty-state-card svg { margin: 0 auto 16px; color: rgba(56, 189, 248, 0.5); }
  .empty-state-card h4 { font-size: 16px; font-weight: 600; color: #fff; margin: 0 0 6px; }
  .empty-text { font-size: 14px; color: rgba(255,255,255,0.5); font-weight: 500; margin: 0; }

  .btn-primary-mobile { background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); color: white; border: none; padding: 12px; border-radius: 8px; font-size: 14px; font-weight: 700; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3); transition: all 0.2s; }
  .btn-primary-mobile:hover { box-shadow: 0 4px 15px rgba(14, 165, 233, 0.5); transform: translateY(-1px); }
  .btn-secondary-mobile { padding: 12px; border-radius: 8px; font-size: 14px; font-weight: 600; width: 100%; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(56, 189, 248, 0.3); color: #fff; }
  .spin-anim { animation: spin 1s linear infinite; }
  @keyframes spin { 100% { transform: rotate(360deg); } }
`;
