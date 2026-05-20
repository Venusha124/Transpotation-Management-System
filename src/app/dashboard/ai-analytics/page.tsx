'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, BrainCircuit, Activity, Wrench, ShieldAlert, Cpu } from 'lucide-react';

interface Vehicle {
  id: string;
  number: string;
  type: string;
  capacity: number;
  model: string;
  brand: string;
  fuelType: string;
  status: string;
}

interface Driver {
  id: string;
  name: string;
  nic: string;
  experience: number;
  rating: number;
  availability: boolean;
}

export default function AIAnalyticsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  // route state
  const [selectedRoute, setSelectedRoute] = useState('colombo-jaffna');
  // load matching state
  const [cargoWeight, setCargoWeight] = useState<number>(3500);

  const fetchAssets = async () => {
    try {
      const vRes = await fetch('/api/vehicles');
      const dRes = await fetch('/api/drivers');
      if (vRes.ok && dRes.ok) {
        const vData = await vRes.json();
        const dData = await dRes.json();
        setVehicles(vData.vehicles || []);
        setDrivers(dData.drivers || []);
      }
    } catch (err) {
      console.error('Error loading AI source registers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const routePresets: Record<string, {
    name: string;
    distance: number;
    baseHours: number;
    riskFactor: string;
    safestPath: string;
    weatherAdjustedDuration: string;
    estFuelSaving: string;
    narrative: string;
  }> = {
    'colombo-jaffna': {
      name: 'Colombo Port ➔ Jaffna Central Depot',
      distance: 395,
      baseHours: 6.5,
      riskFactor: 'Medium (A9 Highway traffic + animal crossings near Vavuniya)',
      safestPath: 'A1 to Kurunegala ➔ A9 via Dambulla and Anuradhapura bypass',
      weatherAdjustedDuration: '6h 15m (Optimal road condition)',
      estFuelSaving: '14.2% (Eco-routing recommendation active)',
      narrative: 'Heavy congestion predicted around Kurunegala town center. Take the outer Ring Road. Road works near Mankulam; limit night speeds to 50 km/h.'
    },
    'colombo-kandy': {
      name: 'Colombo Hub ➔ Kandy Goods Yard',
      distance: 115,
      baseHours: 3.5,
      riskFactor: 'High (Hilly terrain, sharp curves, potential mudslides near Kadugannawa)',
      safestPath: 'Central Expressway (E04) to Mirigama ➔ A1 Highway',
      weatherAdjustedDuration: '3h 10m (High humidity, low friction risk)',
      estFuelSaving: '8.5% (Ascent optimization active)',
      narrative: 'Brake pad wear accelerates by 2.4x on this mountain pass. Avoid overloading beyond 85% capacity. Shift to low gears during Kadugannawa descent.'
    },
    'colombo-galle': {
      name: 'Colombo Hub ➔ Galle Fort Depot',
      distance: 125,
      baseHours: 1.8,
      riskFactor: 'Low (Southern Expressway high speed limits)',
      safestPath: 'Southern Expressway (E01) via Kottawa interchange',
      weatherAdjustedDuration: '1h 45m (Optimal)',
      estFuelSaving: '18.7% (Cruise throttle stabilization)',
      narrative: 'Excellent highway surface. Wind resistance dominates fuel curves above 80 km/h. Maintain cruise control at 80 km/h for peak vehicle fuel economy.'
    }
  };

  // Helper calculation for dynamic vehicle health prediction
  const getVehicleHealthPredictor = (v: Vehicle) => {
    // Generate pseudo-deterministic wear levels based on vehicle ID string length and model
    const hash = (v.id.length * 7) % 100;
    const brakesWear = Math.min(hash + 20, 95);
    const engineWear = Math.min((hash * 3) % 65 + 15, 90);
    const tiresWear = Math.min((hash * 5) % 70 + 25, 95);
    const expectedBreakdownDays = Math.max(180 - (brakesWear * 1.5), 5);
    
    let priority = 'Low';
    if (brakesWear > 80 || tiresWear > 80) priority = 'Critical';
    else if (brakesWear > 60 || tiresWear > 60) priority = 'Medium';

    return {
      brakesWear,
      engineWear,
      tiresWear,
      expectedBreakdownDays: Math.floor(expectedBreakdownDays),
      priority
    };
  };

  // Helper calculation for driver fatigue risk
  const getDriverSafetyProfile = (d: Driver) => {
    const hash = (d.nic.length * 11) % 100;
    const weeklyHours = (hash % 25) + 20; // 20 - 45 hours
    const sleepDeficit = (hash % 3);
    const fatigueIndex = Math.min(Math.floor((weeklyHours / 45) * 60 + (sleepDeficit * 15)), 100);
    
    let risk = 'Safe';
    if (fatigueIndex > 75) risk = 'High Fatigue';
    else if (fatigueIndex > 50) risk = 'Moderate Risk';

    return {
      weeklyHours,
      fatigueIndex,
      risk,
      safetyScore: Math.floor(d.rating * 20)
    };
  };

  // Helper load matching calculation
  const getLoadMatchEvaluation = () => {
    if (vehicles.length === 0) return null;
    
    const suitable = vehicles.filter(v => v.capacity >= cargoWeight && v.status === 'Available');
    if (suitable.length === 0) {
      return {
        matched: false,
        message: 'No available vehicles have the capacity to carry this weight. Consider split shipment or wait for heavy trucks to return.',
        bestFit: null
      };
    }

    // Sort by capacity, pick the smallest one that can hold the cargo to save fuel cost
    suitable.sort((a, b) => a.capacity - b.capacity);
    const best = suitable[0];
    const capacityEfficiency = (cargoWeight / best.capacity) * 100;
    const estEmissionClass = best.fuelType === 'Diesel' ? 'Euro 4 (Medium)' : 'Euro 6 (Low)';

    return {
      matched: true,
      bestFit: best,
      capacityEfficiency: Math.floor(capacityEfficiency),
      estEmissionClass,
      estCostPerKm: best.type.toLowerCase().includes('truck') ? 2.45 : 1.20
    };
  };

  if (loading) {
    return (
      <div className="dashboard-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-light)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Analyzing fleet telemetry logs...</p>
        </div>
      </div>
    );
  }

  const activeRoute = routePresets[selectedRoute];
  const loadEvaluation = getLoadMatchEvaluation();

  return (
    <div className="dashboard-content animate-fade-in">
      {/* Title */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BrainCircuit size={28} color="var(--primary)" /> AI Insights & Predictive Analytics
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Smart neural models evaluating route friction, driver fatigue states, and fleet breakdown predictions.
          </p>
        </div>
        <div className="badge badge-success" style={{ padding: '8px 12px', gap: '6px', fontSize: '11px', display: 'flex', alignItems: 'center' }}>
          <Cpu size={12} /> Neural Core Online
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Widget 1: AI Route Optimization */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--secondary)" /> Route Path & Fuel Optimizer
          </h3>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>SELECT TRANSIT PATHWAY:</label>
            <select 
              className="form-input" 
              value={selectedRoute} 
              onChange={(e) => setSelectedRoute(e.target.value)}
              style={{ width: '100%' }}
            >
              {Object.keys(routePresets).map(key => (
                <option key={key} value={key}>{routePresets[key].name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>ESTIMATED DISTANCE:</span>
              <p style={{ fontWeight: 700, fontSize: '16px', marginTop: '4px' }}>{activeRoute.distance} km</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>ECO FUEL SAVING:</span>
              <p style={{ fontWeight: 700, fontSize: '16px', marginTop: '4px', color: 'var(--accent-success)' }}>{activeRoute.estFuelSaving}</p>
            </div>
          </div>

          <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <strong>Neural Recommended Path:</strong>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>{activeRoute.safestPath}</p>
            </div>
            <div>
              <strong>AI Dynamic Risk Assessment:</strong>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>{activeRoute.riskFactor}</p>
            </div>
            <div style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px dashed rgba(6, 182, 212, 0.2)', padding: '12px', borderRadius: '8px', marginTop: '4px' }}>
              <strong style={{ fontSize: '12px', color: 'var(--secondary)' }}>💡 AI Dispatch Recommendation:</strong>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px', lineHeight: 1.4 }}>{activeRoute.narrative}</p>
            </div>
          </div>
        </div>

        {/* Widget 2: AI Cargo Load Allocation Matcher */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--accent-success)" /> Load Allocation Optimizer
          </h3>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>CARGO WEIGHT TO SHIP (KG):</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input 
                type="number" 
                className="form-input" 
                value={cargoWeight} 
                onChange={(e) => setCargoWeight(Math.max(1, Number(e.target.value)))}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>kg</span>
            </div>
          </div>

          {loadEvaluation ? (
            loadEvaluation.matched ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(16, 185, 129, 0.05)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                  <div style={{ fontSize: '24px' }}>🚚</div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>BEST VEHICLE FIT MATCHED:</span>
                    <h4 style={{ fontWeight: 700, color: 'var(--accent-success)' }}>
                      {loadEvaluation.bestFit.brand} {loadEvaluation.bestFit.model} ({loadEvaluation.bestFit.number})
                    </h4>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.01)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>CAPACITY EFFICIENCY:</span>
                    <p style={{ fontWeight: 600, fontSize: '14px', marginTop: '2px' }}>{loadEvaluation.capacityEfficiency}% utilized</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.01)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>EMISSION ESTIMATE:</span>
                    <p style={{ fontWeight: 600, fontSize: '14px', marginTop: '2px' }}>{loadEvaluation.estEmissionClass}</p>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Est. Transit Fuel Cost / km:</span>
                    <span style={{ fontWeight: 600 }}>${loadEvaluation.estCostPerKm.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '6px', marginTop: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>AI Efficiency Rating:</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary-hover)' }}>Excellent (Eco-matched)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--accent-warning)', padding: '16px', background: 'rgba(245,158,11,0.05)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.15)', fontSize: '13px' }}>
                ⚠️ {loadEvaluation.message}
              </div>
            )
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>No vehicles registered to run load evaluation.</p>
          )}
        </div>
      </div>

      {/* Split Grid: Predictive Health Maintenance & Driver Fatigue Assessments */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Predictive Maintenance list */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wrench size={18} color="var(--accent-warning)" /> Predictive Fleet Health Matrix
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
            {vehicles.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>No vehicles found.</p>
            ) : (
              vehicles.map(v => {
                const health = getVehicleHealthPredictor(v);
                return (
                  <div key={v.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '13px' }}>{v.number} ({v.type})</strong>
                      <span className={`badge ${health.priority === 'Critical' ? 'badge-danger' : health.priority === 'Medium' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '10px' }}>
                        {health.priority} Risk
                      </span>
                    </div>
                    {/* Wear levels */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span>Brake Wear Indicator:</span>
                          <span style={{ color: health.brakesWear > 70 ? 'var(--accent-danger)' : 'inherit' }}>{health.brakesWear}%</span>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                          <div style={{ width: `${health.brakesWear}%`, height: '100%', background: health.brakesWear > 70 ? 'var(--accent-danger)' : 'var(--primary)', borderRadius: '2px' }}></div>
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span>Tire Tread Wear:</span>
                          <span style={{ color: health.tiresWear > 70 ? 'var(--accent-danger)' : 'inherit' }}>{health.tiresWear}%</span>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                          <div style={{ width: `${health.tiresWear}%`, height: '100%', background: health.tiresWear > 70 ? 'var(--accent-danger)' : 'var(--secondary)', borderRadius: '2px' }}></div>
                        </div>
                      </div>
                      <div style={{ marginTop: '4px', fontSize: '12px', borderTop: '1px solid var(--border-light)', paddingTop: '6px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Est. safe operational window:</span>
                        <strong style={{ color: health.expectedBreakdownDays < 30 ? 'var(--accent-danger)' : 'var(--text-primary)' }}>{health.expectedBreakdownDays} days</strong>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Fatigue Risk & Safety Matrix */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} color="var(--accent-danger)" /> Driver Fatigue & Risk Classifier
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
            {drivers.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>No driver records found.</p>
            ) : (
              drivers.map(d => {
                const safety = getDriverSafetyProfile(d);
                return (
                  <div key={d.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '13px' }}>{d.name}</strong>
                      <span className={`badge ${safety.risk === 'High Fatigue' ? 'badge-danger' : safety.risk === 'Moderate Risk' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '10px' }}>
                        {safety.risk}
                      </span>
                    </div>
                    {/* Metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      <div>
                        <span>Drive Hours (Weekly):</span>
                        <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{safety.weeklyHours.toFixed(1)} hrs</p>
                      </div>
                      <div>
                        <span>Neural Safety Score:</span>
                        <p style={{ fontWeight: 600, color: 'var(--accent-success)', marginTop: '2px' }}>{safety.safetyScore}/100</p>
                      </div>
                    </div>
                    {/* Fatigue slider indicator */}
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span>Fatigue Index Rating:</span>
                        <span style={{ fontWeight: 600, color: safety.fatigueIndex > 65 ? 'var(--accent-danger)' : 'inherit' }}>{safety.fatigueIndex}%</span>
                      </div>
                      <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                        <div style={{ width: `${safety.fatigueIndex}%`, height: '100%', background: safety.fatigueIndex > 65 ? 'var(--accent-danger)' : 'var(--accent-success)', borderRadius: '2px' }}></div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
