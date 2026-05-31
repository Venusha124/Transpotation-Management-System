'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, Truck, MapPin, Activity, AlertTriangle, ArrowRight } from 'lucide-react';

export default function FleetUtilizationPage() {
  const [fleetData, setFleetData] = useState<any[]>([]);
  const [routesHeatmap, setRoutesHeatmap] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFleetData() {
      try {
        const res = await fetch('/api/analytics/fleet');
        if (res.ok) {
          const data = await res.json();
          setFleetData(data.fleetData || []);
          setRoutesHeatmap(data.routesHeatmap || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchFleetData();
  }, []);

  // Determine Max Revenue for Scaling the Heatmap Nodes
  const maxRevenue = Math.max(...routesHeatmap.map(r => r.revenue), 1);
  const totalSystemRevenue = routesHeatmap.reduce((sum, r) => sum + r.revenue, 0);

  // Helper to determine thermal color based on revenue proportion
  const getThermalColor = (revenue: number) => {
    const ratio = revenue / maxRevenue;
    if (ratio > 0.7) return 'rgba(239, 68, 68, 1)'; // Hot Red
    if (ratio > 0.4) return 'rgba(245, 158, 11, 1)'; // Warm Orange
    return 'rgba(16, 185, 129, 1)'; // Cool Green
  };

  const getGlow = (revenue: number) => {
    const color = getThermalColor(revenue);
    return `0 0 20px ${color.replace('1)', '0.5)')}`;
  };

  // Find Underutilized Vehicles (Capacity < 40%)
  const underutilized = fleetData.filter(v => Number(v.utilizationPercentage) < 40);

  return (
    <div className="fade-in-up" style={{ padding: '24px', minHeight: '100vh', background: '#020617' }}>
      
      {/* Header Section */}
      <div className="flex justify-between items-end mb-8">
        <div className="flex items-center gap-4">
          <div style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', padding: '12px', borderRadius: '16px', boxShadow: '0 0 20px rgba(225, 29, 72, 0.4)' }}>
            <Activity size={32} color="white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-1 tracking-tight text-white">Live Thermal Network</h1>
            <p className="text-sm text-slate-400">Real-time revenue hotspots & fleet inefficiency radar</p>
          </div>
        </div>
        
        <div className="hidden md:flex gap-4">
          <div className="glass-panel text-right px-6 py-3">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Network Revenue</p>
            <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              LKR {totalSystemRevenue.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Visual Map - Spans 2 columns on large screens */}
          <div className="lg:col-span-2 glass-panel p-6" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                <MapPin size={20} className="text-rose-400" /> Route Profitability Heatmap
              </h3>
              <div className="flex gap-3 text-xs font-medium">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Cool</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Warm</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Hot</span>
              </div>
            </div>

            {/* Abstract Node Map */}
            <div className="relative w-full h-[400px] rounded-2xl bg-slate-900/50 overflow-hidden flex flex-wrap gap-4 p-6 content-start" style={{ border: '1px inset rgba(255,255,255,0.05)' }}>
              {/* Background grid lines for tech effect */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              
              {routesHeatmap.length === 0 ? (
                 <div className="absolute inset-0 flex items-center justify-center text-slate-500">No route data available</div>
              ) : (
                routesHeatmap.map((route, idx) => {
                  const size = 100 + (route.revenue / maxRevenue) * 60; // Dynamic size based on revenue
                  
                  return (
                    <div key={route.id} 
                      className="relative group cursor-pointer transition-all duration-500 hover:scale-105"
                      style={{ 
                        width: `${size}px`, 
                        height: `${size}px`,
                        background: `radial-gradient(circle at 30% 30%, ${getThermalColor(route.revenue)}, rgba(15,23,42,0.9))`,
                        boxShadow: getGlow(route.revenue),
                        borderRadius: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        border: '1px solid rgba(255,255,255,0.1)',
                        zIndex: 10
                      }}
                    >
                      <div className="text-center px-2">
                        <p className="text-[11px] font-bold text-white uppercase tracking-wider mb-1 line-clamp-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                          {route.name}
                        </p>
                        <div className="bg-black/40 backdrop-blur-sm rounded px-2 py-1 inline-block border border-white/10">
                          <p className="text-xs font-bold text-white">LKR {route.revenue >= 1000 ? (route.revenue/1000).toFixed(1)+'k' : route.revenue}</p>
                        </div>
                      </div>

                      {/* Tooltip on hover */}
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 w-max">
                        <div className="bg-slate-800 text-white text-xs py-2 px-3 rounded shadow-xl border border-white/10">
                          <p className="font-bold mb-1">{route.name}</p>
                          <p className="text-slate-300">Total Trips: {route.trips}</p>
                          <p className="text-emerald-400">Revenue: LKR {route.revenue.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Underutilized Fleet Radar Sidebar */}
          <div className="glass-panel p-6 flex flex-col" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
              <AlertTriangle size={20} className="text-amber-500" /> Fleet Efficiency Radar
            </h3>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {fleetData.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No fleet data.</p>
              ) : underutilized.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-emerald-500 opacity-80">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                    <TrendingUp size={32} />
                  </div>
                  <p className="font-medium text-center">All vehicles are operating above 40% capacity.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-amber-500/80 mb-2 uppercase tracking-widest font-bold">Action Required ({underutilized.length})</p>
                  {underutilized.map(v => (
                    <div key={v.id} className="bg-slate-800/50 hover:bg-slate-800 transition-colors border border-red-500/20 rounded-xl p-4 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-white text-sm">{v.number}</h4>
                          <p className="text-xs text-slate-400">{v.type}</p>
                        </div>
                        <div className="bg-red-500/10 text-red-400 font-bold px-2 py-1 rounded text-xs border border-red-500/20">
                          {v.utilizationPercentage}% Util.
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 text-xs">
                        <span className="text-slate-500">Trips: {v.totalTrips}</span>
                        <span className="text-amber-400 flex items-center gap-1 cursor-pointer hover:text-amber-300">
                          Reassign <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Minor quick stat at bottom of sidebar */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Total Active Vehicles</span>
                <span className="text-lg font-bold text-white">{fleetData.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Raw Data Table - Hidden on default unless expanded, but keeping it elegant */}
      {!loading && (
        <div className="mt-6 glass-panel p-6" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <Truck size={16} /> Detailed Fleet Metrics
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                <tr>
                  <th className="px-6 py-3 rounded-tl-lg">Vehicle No.</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Capacity</th>
                  <th className="px-6 py-3 text-center">Avg. Utilization</th>
                  <th className="px-6 py-3 text-right rounded-tr-lg">Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {fleetData.map((v, i) => (
                  <tr key={v.id} className={`border-b border-white/5 hover:bg-slate-800/30 transition-colors ${i === fleetData.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-6 py-4 font-medium text-white">{v.number}</td>
                    <td className="px-6 py-4 text-slate-300">{v.type}</td>
                    <td className="px-6 py-4 text-slate-300">{v.capacity} pax</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${Number(v.utilizationPercentage) > 75 ? 'bg-emerald-500/20 text-emerald-400' : Number(v.utilizationPercentage) > 40 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {v.utilizationPercentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-emerald-400 font-medium">
                      LKR {v.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
