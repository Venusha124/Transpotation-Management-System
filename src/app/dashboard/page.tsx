'use client';

import React, { useEffect, useState } from 'react';
import { 
  Truck, 
  Users, 
  MapPin, 
  CircleDollarSign, 
  Fuel, 
  CalendarCheck,
  AlertTriangle,
  ClipboardList
} from 'lucide-react';

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

interface Alert {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

interface Activity {
  id: string;
  action: string;
  details: string;
  timestamp: string;
}

interface TripsDist {
  pending: number;
  assigned: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

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
      if (res.ok) {
        setAlerts(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-light)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading fleet metrics...</p>
        </div>
      </div>
    );
  }

  // Calculate SVG values
  const maxTripVal = Math.max(tripsDist.pending, tripsDist.assigned, tripsDist.inProgress, tripsDist.completed, tripsDist.cancelled, 1);
  const barHeight = (val: number) => (val / maxTripVal) * 140;

  return (
    <div className="dashboard-content animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700 }}>Fleet Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Real-time telemetry and management metrics</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchDashboardData}>
          🔄 Refresh
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="dashboard-grid">
        <div className="glass-panel stat-card">
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Fleet Vehicles</span>
            <h2 style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>{stats?.totalVehicles}</h2>
            <p style={{ fontSize: '11px', color: 'var(--accent-success)', marginTop: '6px' }}>{stats?.availableVehicles} Available Now</p>
          </div>
          <div className="stat-card-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', borderColor: 'rgba(6, 182, 212, 0.2)', color: 'var(--secondary)' }}>
            <Truck size={24} />
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Active Drivers</span>
            <h2 style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>{stats?.activeDrivers}</h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>On Active Trips</p>
          </div>
          <div className="stat-card-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-success)' }}>
            <Users size={24} />
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Ongoing Deliveries</span>
            <h2 style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>{stats?.ongoingDeliveries}</h2>
            <p style={{ fontSize: '11px', color: 'var(--primary-hover)', marginTop: '6px' }}>{stats?.completedTrips} Trips Completed</p>
          </div>
          <div className="stat-card-icon">
            <MapPin size={24} />
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Revenue Ledger</span>
            <h2 style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>${stats?.totalRevenue.toLocaleString()}</h2>
            <p style={{ fontSize: '11px', color: 'var(--accent-success)', marginTop: '6px' }}>Paid Transactions</p>
          </div>
          <div className="stat-card-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-warning)' }}>
            <CircleDollarSign size={24} />
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Fuel Expenses</span>
            <h2 style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>${stats?.totalFuelCost.toLocaleString()}</h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>{stats?.totalFuelUsed.toLocaleString()} Liters consumed</p>
          </div>
          <div className="stat-card-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--accent-danger)' }}>
            <Fuel size={24} />
          </div>
        </div>
      </div>

      {/* SVG Charts Block */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Trip Distribution Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarCheck size={20} color="var(--primary)" /> Trip Status Volume
          </h3>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: '180px', gap: '30px', paddingBottom: '10px' }}>
            {/* Pending Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '45px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{tripsDist.pending}</span>
              <div style={{ width: '100%', height: `${barHeight(tripsDist.pending)}px`, background: 'rgba(255, 255, 255, 0.2)', borderRadius: '6px 6px 0 0', minHeight: '4px' }}></div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'center' }}>Pend</span>
            </div>

            {/* Assigned Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '45px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{tripsDist.assigned}</span>
              <div style={{ width: '100%', height: `${barHeight(tripsDist.assigned)}px`, background: 'var(--border-glow)', borderRadius: '6px 6px 0 0', minHeight: '4px' }}></div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'center' }}>Assg</span>
            </div>

            {/* In Progress Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '45px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{tripsDist.inProgress}</span>
              <div style={{ width: '100%', height: `${barHeight(tripsDist.inProgress)}px`, background: 'linear-gradient(to top, var(--primary), var(--secondary))', borderRadius: '6px 6px 0 0', minHeight: '4px' }}></div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'center' }}>Active</span>
            </div>

            {/* Completed Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '45px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{tripsDist.completed}</span>
              <div style={{ width: '100%', height: `${barHeight(tripsDist.completed)}px`, background: 'var(--accent-success)', borderRadius: '6px 6px 0 0', minHeight: '4px' }}></div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'center' }}>Done</span>
            </div>

            {/* Cancelled Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '45px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{tripsDist.cancelled}</span>
              <div style={{ width: '100%', height: `${barHeight(tripsDist.cancelled)}px`, background: 'var(--accent-danger)', borderRadius: '6px 6px 0 0', minHeight: '4px' }}></div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'center' }}>Cncl</span>
            </div>
          </div>
        </div>

        {/* Revenue Analytics SVG Trend */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CircleDollarSign size={20} color="var(--secondary)" /> Revenue Analytics (Last 5 Months)
          </h3>
          <div style={{ position: 'relative', height: '180px', width: '100%' }}>
            <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 400 150">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--secondary)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Lines */}
              <line x1="40" y1="20" x2="380" y2="20" stroke="var(--border-light)" strokeDasharray="4" />
              <line x1="40" y1="70" x2="380" y2="70" stroke="var(--border-light)" strokeDasharray="4" />
              <line x1="40" y1="120" x2="380" y2="120" stroke="var(--border-light)" />
              {/* Trend line path */}
              <path 
                d="M 60,110 L 140,80 L 220,95 L 300,50 L 380,35" 
                fill="none" 
                stroke="var(--secondary)" 
                strokeWidth="3" 
              />
              <path 
                d="M 60,110 L 140,80 L 220,95 L 300,50 L 380,35 L 380,120 L 60,120 Z" 
                fill="url(#chartGrad)" 
              />
              {/* Points */}
              <circle cx="60" cy="110" r="5" fill="var(--bg-surface)" stroke="var(--secondary)" strokeWidth="2" />
              <circle cx="140" cy="80" r="5" fill="var(--bg-surface)" stroke="var(--secondary)" strokeWidth="2" />
              <circle cx="220" cy="95" r="5" fill="var(--bg-surface)" stroke="var(--secondary)" strokeWidth="2" />
              <circle cx="300" cy="50" r="5" fill="var(--bg-surface)" stroke="var(--secondary)" strokeWidth="2" />
              <circle cx="380" cy="35" r="5" fill="var(--bg-surface)" stroke="var(--secondary)" strokeWidth="2" />
              {/* Label strings */}
              <text x="60" y="140" fill="var(--text-muted)" fontSize="10" textAnchor="middle">Jan</text>
              <text x="140" y="140" fill="var(--text-muted)" fontSize="10" textAnchor="middle">Feb</text>
              <text x="220" y="140" fill="var(--text-muted)" fontSize="10" textAnchor="middle">Mar</text>
              <text x="300" y="140" fill="var(--text-muted)" fontSize="10" textAnchor="middle">Apr</text>
              <text x="380" y="140" fill="var(--text-muted)" fontSize="10" textAnchor="middle">May</text>
            </svg>
          </div>
        </div>
      </div>

      {/* Split layout: Alerts & Audit Logs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Alerts panel */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-warning)' }}>
            <AlertTriangle size={20} /> Active Dispatch Alerts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {alerts.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0' }}>
                ✅ All vehicle systems and registrations are current.
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '10px', padding: '14px 16px' }}>
                  <div style={{ paddingRight: '12px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-warning)' }}>{alert.title}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>{alert.message}</p>
                  </div>
                  <button 
                    onClick={() => handleDismissAlert(alert.id)}
                    className="btn" 
                    style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)' }}
                  >
                    Dismiss
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Audit Log Activities */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={20} color="var(--secondary)" /> System Activity Logs
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
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{act.action}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
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
