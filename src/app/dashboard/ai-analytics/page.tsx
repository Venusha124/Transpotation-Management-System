'use client';

import React, { useEffect, useState } from 'react';
import { Brain, TrendingUp, AlertTriangle } from 'lucide-react';

export default function AIAnalyticsPage() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch('/api/analytics/predictive');
        if (res.ok) {
          const data = await res.json();
          setInsights(data.insights || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchInsights();
  }, []);

  return (
    <div className="fade-in-up" style={{ padding: '24px' }}>
      <div className="flex items-center gap-3 mb-6">
        <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)', padding: '10px', borderRadius: '12px' }}>
          <Brain size={28} color="white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-1">AI Predictive Analytics</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>AI-driven demand forecasting and fleet optimization</p>
        </div>
      </div>

      <div className="glass-panel p-6">
        <h3 className="text-xl font-semibold mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
          <TrendingUp size={20} color="#a855f7" /> 
          Demand Forecast & Recommendations
        </h3>
        
        {loading ? (
          <p className="text-center py-8">Analyzing historical booking data...</p>
        ) : insights.length === 0 ? (
          <p className="text-center py-8">No insights generated yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {insights.map((insight, idx) => (
              <div key={idx} className="glass-panel-inner p-4" style={{ borderLeft: `4px solid ${insight.demandLevel === 'High' ? '#ef4444' : insight.demandLevel === 'Medium' ? '#f59e0b' : '#3b82f6'}` }}>
                <div className="flex items-start gap-3">
                  {insight.demandLevel === 'High' && <AlertTriangle size={20} color="#ef4444" style={{ marginTop: '2px' }} />}
                  <div>
                    <h4 className="font-semibold text-lg">{insight.route}</h4>
                    <span className="text-xs px-2 py-1 rounded-md" style={{ background: 'rgba(255,255,255,0.1)', marginBottom: '8px', display: 'inline-block' }}>
                      Demand: {insight.demandLevel}
                    </span>
                    <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.5' }}>
                      {insight.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
