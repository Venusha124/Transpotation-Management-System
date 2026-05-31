'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Search, DollarSign } from 'lucide-react';

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [refundAmount, setRefundAmount] = useState('');

  const fetchDisputes = async () => {
    try {
      const res = await fetch('/api/disputes');
      if (res.ok) {
        const data = await res.json();
        setDisputes(data.disputes || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolve = async (status: string) => {
    if (!selectedDispute) return;
    try {
      const res = await fetch(`/api/disputes/${selectedDispute.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status, 
          refundAmount: status === 'RESOLVED' ? Number(refundAmount) : 0 
        })
      });
      if (res.ok) {
        setSelectedDispute(null);
        setRefundAmount('');
        fetchDisputes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDisputes = disputes.filter(d => 
    d.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fade-in-up" style={{ padding: '24px' }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Disputes & Refunds</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>Manage customer booking issues and process E-Wallet refunds</p>
        </div>
      </div>

      <div className="glass-panel p-4 mb-6" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Search by customer name or ID..." 
            className="glass-input w-full"
            style={{ paddingLeft: '40px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table className="custom-table w-full">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Booking Info</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>Loading disputes...</td></tr>
            ) : filteredDisputes.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>No disputes found.</td></tr>
            ) : (
              filteredDisputes.map(dispute => (
                <tr key={dispute.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{dispute.customer?.name}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{dispute.customer?.email}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px' }}>From: {dispute.booking?.pickup}</div>
                    <div style={{ fontSize: '13px' }}>To: {dispute.booking?.destination}</div>
                  </td>
                  <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {dispute.reason}
                  </td>
                  <td>
                    <span className={`status-badge ${dispute.status === 'OPEN' ? 'bg-orange-500/20 text-orange-300' : dispute.status === 'RESOLVED' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`} style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                      {dispute.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '13px' }}>
                    {new Date(dispute.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => setSelectedDispute(dispute)}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel max-w-md w-full p-6 relative">
            <h3 className="text-xl font-semibold mb-4 border-b border-white/10 pb-2">Review Dispute</h3>
            
            <div className="mb-4 text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
              <strong>Customer:</strong> {selectedDispute.customer?.name} <br/>
              <strong>Route:</strong> {selectedDispute.booking?.pickup} to {selectedDispute.booking?.destination} <br/>
              <strong>Date Booked:</strong> {new Date(selectedDispute.booking?.createdAt).toLocaleString()} <br/>
            </div>

            <div className="p-3 rounded-lg mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-sm italic">"{selectedDispute.reason}"</p>
            </div>

            {selectedDispute.status === 'OPEN' ? (
              <>
                <div className="form-group mb-4">
                  <label>Refund Amount (LKR)</label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'rgba(255,255,255,0.5)' }} />
                    <input 
                      type="number" 
                      className="glass-input w-full"
                      style={{ paddingLeft: '32px' }}
                      placeholder="0.00"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button className="btn-secondary" onClick={() => setSelectedDispute(null)}>Cancel</button>
                  <button className="btn-secondary" style={{ color: '#fc8181', borderColor: 'rgba(252, 129, 129, 0.3)' }} onClick={() => handleResolve('REJECTED')}>Reject</button>
                  <button className="btn-primary" onClick={() => handleResolve('RESOLVED')}>Resolve & Refund</button>
                </div>
              </>
            ) : (
              <div className="mt-4">
                <p className="text-sm mb-4">This dispute has already been <strong>{selectedDispute.status}</strong>.</p>
                {selectedDispute.status === 'RESOLVED' && (
                  <p className="text-sm text-green-300 mb-4">Refunded: LKR {selectedDispute.refundAmount}</p>
                )}
                <button className="btn-secondary w-full" onClick={() => setSelectedDispute(null)}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
