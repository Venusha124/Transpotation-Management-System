'use client';
import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Clock, MapPin, ArrowRight, Navigation, Bus, DollarSign, ChevronDown, ChevronUp, Loader2, AlertCircle, Route } from 'lucide-react';

interface Stop {
  id: string;
  name: string;
  code: string;
  address: string;
}

interface RouteStop {
  orderIndex: number;
  arrivalOffset: number;
  stop: Stop;
}

interface RouteData {
  id: string;
  name: string;
  code: string;
  startLocation: string;
  endLocation: string;
  distance: number;
  duration: number;
  basePrice: number;
  status: string;
  type: string;
  routeStops: RouteStop[];
}

const getRouteTypeBadge = (type: string) => {
  const t = (type || 'EXPRESS').toUpperCase();
  switch (t) {
    case 'EXPRESS':
      return { label: 'EXPRESS', color: '#a78bfa', bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.3)' };
    case 'INTERCITY':
      return { label: 'INTERCITY', color: '#60a5fa', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)' };
    case 'MULTI_ROUTE':
      return { label: 'MULTI-ROUTE', color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' };
    case 'CHARTER':
      return { label: 'CHARTER', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' };
    default:
      return { label: 'EXPRESS', color: '#a78bfa', bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.3)' };
  }
};

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}`.trim() : `${m}m`;
}

// Format the offset as an exact time (e.g., "7.30 PM")
function formatExactTime(baseTimeStr: string, offsetMinutes: number) {
  const [hours, minutes] = baseTimeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + offsetMinutes;
  
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m.toString().padStart(2, '0');
  
  return `${displayH}.${displayM} ${ampm}`;
}

function RouteCard({ route }: { route: RouteData }) {
  const [expanded, setExpanded] = useState(false);
  const stops = route.routeStops.sort((a, b) => a.orderIndex - b.orderIndex);

  // Determine a realistic start time for display purposes
  // If it's a Jaffna route, default to 7:30 PM (19:30) as requested, else 08:00 AM
  const isJaffna = route.name.toLowerCase().includes('jaffna') || route.endLocation.toLowerCase().includes('jaffna');
  const baseTime = isJaffna ? '19:30' : '08:00';

  return (
    <div className="glass-panel hover-glow fade-in-up" style={{ padding: '0', overflow: 'hidden', borderRadius: '16px' }}>
      
      {/* Route Header */}
      <div style={{ padding: '28px 32px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        
        {/* Route Badge */}
        <div style={{
          background: 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)',
          padding: '10px 18px',
          borderRadius: '10px',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
        }}>
          <span style={{ fontSize: '13px', fontWeight: '900', color: '#fff', letterSpacing: '1.5px' }}>
            {route.code}
          </span>
        </div>

        {/* Route Name & Direction */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>{route.name}</span>
            {(() => {
              const badge = getRouteTypeBadge(route.type);
              return (
                <span style={{ 
                  padding: '2px 10px', 
                  borderRadius: '12px', 
                  fontSize: '10px', 
                  fontWeight: 800, 
                  background: badge.bg, 
                  color: badge.color, 
                  border: `1px solid ${badge.border}` 
                }}>
                  {badge.label}
                </span>
              );
            })()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '14px', flexWrap: 'wrap' }}>
            <span style={{ color: '#93c5fd', fontWeight: '600' }}>{route.startLocation}</span>
            <ArrowRight size={14} color="#60a5fa" />
            <span style={{ color: '#6ee7b7', fontWeight: '600' }}>{route.endLocation}</span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
              <Clock size={12} /> Duration
            </div>
            <div style={{ color: '#fbbf24', fontWeight: '700', fontSize: '16px' }}>{formatDuration(route.duration)}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
              <Navigation size={12} /> Distance
            </div>
            <div style={{ color: '#60a5fa', fontWeight: '700', fontSize: '16px' }}>{route.distance} km</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
              <DollarSign size={12} /> From
            </div>
            <div style={{ color: '#34d399', fontWeight: '700', fontSize: '16px' }}>
              {route.basePrice > 0 ? `LKR ${route.basePrice.toLocaleString()}` : 'Free'}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
              <MapPin size={12} /> Stops
            </div>
            <div style={{ color: '#c4b5fd', fontWeight: '700', fontSize: '16px' }}>{stops.length}</div>
          </div>
        </div>

        {/* Expand Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: expanded ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            padding: '10px 16px',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            transition: 'all 0.2s ease',
            flexShrink: 0,
          }}
        >
          {expanded ? <><ChevronUp size={16} /> Hide Stops</> : <><ChevronDown size={16} /> View Stops</>}
        </button>
      </div>

      {/* Stops Timeline — collapsible */}
      {expanded && (
        <div style={{ padding: '0 32px 28px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ paddingTop: '24px', position: 'relative' }}>

            {/* Vertical line */}
            <div style={{
              position: 'absolute',
              left: '19px',
              top: '34px',
              bottom: '34px',
              width: '2px',
              background: 'linear-gradient(to bottom, #3b82f6, #7c3aed, #10b981)',
            }}></div>

            {stops.map((rs, i) => {
              const isFirst = i === 0;
              const isLast = i === stops.length - 1;
              const dotColor = isFirst ? '#60a5fa' : isLast ? '#34d399' : '#a78bfa';
              const exactTime = formatExactTime(baseTime, rs.arrivalOffset);
              
              return (
                <div key={rs.stop.id} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: i < stops.length - 1 ? '24px' : '0', position: 'relative', zIndex: 1 }}>
                  {/* Dot */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: `rgba(${isFirst ? '59,130,246' : isLast ? '16,185,129' : '139,92,246'}, 0.15)`,
                    border: `2px solid ${dotColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: `0 0 12px ${dotColor}40`,
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: '900', color: dotColor }}>{i + 1}</span>
                  </div>

                  {/* Stop Info formatted as: StopName - Time */}
                  <div style={{ flex: 1, paddingTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ fontWeight: '700', color: '#fff', fontSize: '16px' }}>
                          {rs.stop.name} <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 6px' }}>—</span> <span style={{ color: dotColor, letterSpacing: '0.5px' }}>{exactTime}</span>
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', marginTop: '4px' }}>{rs.stop.address}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{
                          background: 'rgba(0,0,0,0.3)',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          color: 'rgba(255,255,255,0.6)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          fontFamily: 'monospace'
                        }}>{rs.stop.code}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TimetablesPage() {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/routes?published=true')
      .then(r => r.json())
      .then(data => {
        if (data.success) setRoutes(data.routes);
        else setError('Could not load routes.');
      })
      .catch(() => setError('Network error. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = routes.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.startLocation.toLowerCase().includes(search.toLowerCase()) ||
    r.endLocation.toLowerCase().includes(search.toLowerCase()) ||
    r.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="landing-wrapper">
      <Navbar />

      {/* Hero */}
      <header className="hero-section" style={{ minHeight: '40vh', padding: '100px 20px 20px' }}>
        <div className="hero-content fade-in-up">
          <div className="badge-pill">Schedules & Routes</div>
          <h1 className="hero-title">
            Bus <span className="text-gradient">Timetables</span>
          </h1>
          <p className="hero-subtitle">
            Plan your journey with our reliable, live route schedules and stop-by-stop timetables.
          </p>
        </div>
      </header>

      {/* Stats Bar */}
      {!loading && !error && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {[
            { label: 'Active Routes', value: routes.length, color: '#60a5fa', icon: <Route size={20} /> },
            { label: 'Total Stops', value: routes.reduce((acc, r) => acc + r.routeStops.length, 0), color: '#34d399', icon: <MapPin size={20} /> },
            { label: 'Longest Route', value: routes.length ? `${Math.max(...routes.map(r => r.distance))} km` : '-', color: '#fbbf24', icon: <Navigation size={20} /> },
          ].map((stat, i) => (
            <div key={i} className="glass-panel" style={{ flex: '1 1 200px', padding: '20px 24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <span style={{ color: stat.color }}>{stat.icon}</span>
              <div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search Bar */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 32px' }}>
        <div style={{ position: 'relative' }}>
          <Bus size={20} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by route name, code, or location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="glass-input-lg"
            style={{ paddingLeft: '52px', width: '100%', fontSize: '16px' }}
          />
        </div>
      </div>

      {/* Content */}
      <section style={{ flex: 1, padding: '0 20px 80px', maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {loading && (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <Loader2 size={40} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>Loading live timetables...</p>
          </div>
        )}

        {error && (
          <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <AlertCircle size={40} color="#f87171" />
            <p style={{ color: '#f87171', fontWeight: '600' }}>{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <Bus size={48} color="rgba(255,255,255,0.2)" />
            <h3 style={{ color: 'rgba(255,255,255,0.6)' }}>
              {search ? `No routes match "${search}"` : 'No published routes yet.'}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Routes must be published in the admin dashboard to appear here.</p>
          </div>
        )}

        {!loading && !error && filtered.map(route => (
          <RouteCard key={route.id} route={route} />
        ))}

      </section>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <Footer />
    </div>
  );
}

