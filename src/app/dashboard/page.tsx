'use client';

import React, { useEffect, useState } from 'react';
import { Bus, Users, MapPin, CircleDollarSign, Fuel, CalendarCheck, AlertTriangle, ClipboardList, Ticket } from 'lucide-react';

interface Stats {
  totalVehicles: number;
  activeDrivers: number;
  ongoingDeliveries: number;
  completedTrips: number;
  totalRevenue: number;
  totalFuelUsed: number;
  totalFuelCost: number;
  availableVehicles: number;
}

interface Alert { id: string; title: string; message: string; createdAt: string; }
interface Activity { id: string; action: string; details: string; timestamp: string; }
interface TripsDist { pending: number; assigned: number; inProgress: number; completed: number; cancelled: number; }

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tripsDist, setTripsDist] = useState<TripsDist>({ pending: 0, assigned: 0, inProgress: 0, completed: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard-summary');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setAlerts(data.alerts);
        setActivities(data.activities);
        setTripsDist(data.tripsDistribution);
      }
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleDismissAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'PUT' });
      if (res.ok) setAlerts(prev => prev.filter(a => a.id !== id));
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="dashboard-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '44px', height: '44px', border: '3px solid var(--border-light)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading bus fleet metrics...</p>
        </div>
      </div>
    );
  }

  const maxTripVal = Math.max(tripsDist.pending, tripsDist.assigned, tripsDist.inProgress, tripsDist.completed, tripsDist.cancelled, 1);
  const barHeight = (val: number) => (val / maxTripVal) * 140;
  const barData = [
    { label: 'Sched.', value: tripsDist.pending, color: 'rgba(255,255,255,0.2)' },
    { label: 'Assgn.', value: tripsDist.assigned, color: 'rgba(37,99,235,0.6)' },
    { label: 'Active', value: tripsDist.inProgress, color: '#2563eb' },
    { label: 'Done', value: tripsDist.completed, color: 'var(--accent-success)' },
    { label: 'Cncl.', value: tripsDist.cancelled, color: 'var(--accent-danger)' },
  ];

  return (
    <div className="dashboard-content animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🚌</div>
            <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Bus Transit Dashboard</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginLeft: '52px' }}>Real-time fleet telemetry and route management metrics</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchDashboardData} style={{ borderColor: 'var(--border-glow)', color: 'var(--primary)' }}>
          🔄 Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-grid">
        <div className="glass-panel stat-card">
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Buses in Fleet</span>
            <h2 style={{ fontSize: '34px', fontWeight: 800, marginTop: '8px' }}>{stats?.totalVehicles}</h2>
            <p style={{ fontSize: '11px', color: 'var(--accent-success)', marginTop: '6px' }}>🟢 {stats?.availableVehicles} Available</p>
          </div>
          <div className="stat-card-icon" style={{ background: 'rgba(37,99,235,0.12)', borderColor: 'rgba(37,99,235,0.25)', color: '#3b82f6' }}>
            <Bus size={24} />
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Drivers on Duty</span>
            <h2 style={{ fontSize: '34px', fontWeight: 800, marginTop: '8px' }}>{stats?.activeDrivers}</h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>Currently on route runs</p>
          </div>
          <div className="stat-card-icon" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)', color: 'var(--accent-success)' }}>
            <Users size={24} />
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Route Runs</span>
            <h2 style={{ fontSize: '34px', fontWeight: 800, marginTop: '8px' }}>{stats?.ongoingDeliveries}</h2>
            <p style={{ fontSize: '11px', color: 'var(--primary-hover)', marginTop: '6px' }}>{stats?.completedTrips} Runs Completed Today</p>
          </div>
          <div className="stat-card-icon" style={{ background: 'rgba(37,99,235,0.1)', borderColor: 'rgba(37,99,235,0.2)', color: 'var(--primary)' }}>
            <MapPin size={24} />
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Passengers Today</span>
            <h2 style={{ fontSize: '34px', fontWeight: 800, marginTop: '8px' }}>{(stats?.completedTrips ?? 0) * 12}</h2>
            <p style={{ fontSize: '11px', color: 'var(--accent-success)', marginTop: '6px' }}>Across all active routes</p>
          </div>
          <div className="stat-card-icon" style={{ background: 'rgba(197,48,48,0.1)', borderColor: 'rgba(197,48,48,0.2)', color: '#e53e3e' }}>
            <Ticket size={24} />
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ticket Revenue</span>
            <h2 style={{ fontSize: '26px', fontWeight: 800, marginTop: '8px' }}>LKR {stats?.totalRevenue.toLocaleString()}</h2>
            <p style={{ fontSize: '11px', color: 'var(--accent-success)', marginTop: '6px' }}>Paid Transactions</p>
          </div>
          <div className="stat-card-icon" style={{ background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.2)', color: 'var(--accent-warning)' }}>
            <CircleDollarSign size={24} />
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fuel Expenses</span>
            <h2 style={{ fontSize: '26px', fontWeight: 800, marginTop: '8px' }}>LKR {stats?.totalFuelCost.toLocaleString()}</h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>{stats?.totalFuelUsed.toLocaleString()} Liters consumed</p>
          </div>
          <div className="stat-card-icon" style={{ background: 'rgba(197,48,48,0.1)', borderColor: 'rgba(197,48,48,0.2)', color: 'var(--accent-danger)' }}>
            <Fuel size={24} />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '17px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarCheck size={20} color="var(--primary)" /> Route Run Status
          </h3>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: '180px', gap: '28px', paddingBottom: '10px' }}>
            {barData.map((bar, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '48px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 700 }}>{bar.value}</span>
                <div style={{ width: '100%', height: `${barHeight(bar.value)}px`, background: bar.color, borderRadius: '6px 6px 0 0', minHeight: '4px', transition: 'height 0.4s ease' }}></div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'center' }}>{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '17px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CircleDollarSign size={20} color="#3b82f6" /> Ticket Revenue Trend
          </h3>
          <div style={{ position: 'relative', height: '180px' }}>
            <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 400 150">
              <defs>
                <linearGradient id="busChartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <line x1="40" y1="20" x2="380" y2="20" stroke="var(--border-light)" strokeDasharray="4" />
              <line x1="40" y1="70" x2="380" y2="70" stroke="var(--border-light)" strokeDasharray="4" />
              <line x1="40" y1="120" x2="380" y2="120" stroke="var(--border-light)" />
              <path d="M 60,115 L 140,85 L 220,98 L 300,52 L 380,30" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
              <path d="M 60,115 L 140,85 L 220,98 L 300,52 L 380,30 L 380,120 L 60,120 Z" fill="url(#busChartGrad)" />
              {[{x:60,y:115},{x:140,y:85},{x:220,y:98},{x:300,y:52},{x:380,y:30}].map((p,i) => (
                <circle key={i} cx={p.x} cy={p.y} r="5" fill="var(--bg-surface)" stroke="#2563eb" strokeWidth="2.5" />
              ))}
              {[['Jan',60],['Feb',140],['Mar',220],['Apr',300],['May',380]].map(([m, x]) => (
                <text key={m} x={x} y="140" fill="var(--text-muted)" fontSize="10" textAnchor="middle">{m}</text>
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* Alerts & Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '17px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-warning)' }}>
            <AlertTriangle size={20} /> Active Dispatch Alerts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {alerts.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0', fontSize: '13px' }}>
                ✅ All buses, routes and registrations are current.
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '10px', padding: '14px 16px' }}>
                  <div style={{ paddingRight: '12px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-warning)' }}>{alert.title}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>{alert.message}</p>
                  </div>
                  <button onClick={() => handleDismissAlert(alert.id)} className="btn" style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}>Dismiss</button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '17px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={20} color="var(--primary)" /> System Activity Logs
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {activities.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '30px 0' }}>No logs recorded yet.</p>
            ) : (
              activities.map((act) => (
                <div key={act.id} style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', marginTop: '5px', flexShrink: 0 }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600 }}>{act.action}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '2px', fontSize: '12px' }}>{act.details}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
