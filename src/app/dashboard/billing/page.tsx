'use client';

import React, { useEffect, useState } from 'react';
import { Receipt, CreditCard, Printer, Check } from 'lucide-react';

interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  method: string;
  status: string;
  transactionId?: string;
  createdAt: string;
}

interface Booking {
  id: string;
  pickup: string;
  destination: string;
  weight: number;
  cargoDetails: string;
  deliveryType: string;
}

export default function BillingPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  // Invoice selection for printable layouts
  const [selectedInvoice, setSelectedInvoice] = useState<{ p: Payment; b: Booking } | null>(null);

  const fetchBillingData = async () => {
    try {
      const resPay = await fetch('/api/billing');
      if (resPay.ok) {
        const data = await resPay.json();
        setPayments(data.payments);
      }

      const resBookings = await fetch('/api/bookings');
      if (resBookings.ok) {
        const data = await resBookings.json();
        setBookings(data.bookings);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const handleProcessPayment = async (payId: string, method: string) => {
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: payId, status: 'PAID', method })
      });
      if (res.ok) {
        fetchBillingData();
        // Update active selection modal if open
        if (selectedInvoice && selectedInvoice.p.id === payId) {
          const updated = await res.json();
          setSelectedInvoice({ p: updated.payment, b: selectedInvoice.b });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="dashboard-content animate-fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Invoices & Billing Ledger</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>Process dispatch fees, collect cash payments, and generate invoices</p>
      </div>

      <div className="glass-panel" style={{ padding: '10px' }}>
        <div className="table-container" style={{ margin: 0 }}>
          <table className="tms-table">
            <thead>
              <tr>
                <th>Invoice Code</th>
                <th>Booking Ref</th>
                <th>Fee Amount</th>
                <th>Method</th>
                <th>Created Date</th>
                <th>Invoice Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No invoice ledgers generated.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const b = bookings.find(item => item.id === p.bookingId);
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, color: 'var(--secondary)', fontSize: '12px' }}>
                        {p.transactionId || `INV-${p.id.toUpperCase().slice(0, 8)}`}
                      </td>
                      <td style={{ fontSize: '12px' }}>{p.bookingId.slice(0, 8)}...</td>
                      <td style={{ fontWeight: 700 }}>LKR {p.amount.toFixed(2)}</td>
                      <td>{p.method}</td>
                      <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${p.status === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => b && setSelectedInvoice({ p, b })}
                            className="btn btn-secondary" 
                            style={{ padding: '6px 10px', fontSize: '11px' }}
                          >
                            👁️ View Invoice
                          </button>
                          {p.status === 'PENDING' && (
                            <>
                              <button 
                                onClick={() => handleProcessPayment(p.id, 'Cash')}
                                className="btn btn-primary" 
                                style={{ padding: '6px 10px', fontSize: '11px', background: 'var(--accent-success)' }}
                              >
                                💵 Cash
                              </button>
                              <button 
                                onClick={() => handleProcessPayment(p.id, 'Credit Card')}
                                className="btn btn-primary" 
                                style={{ padding: '6px 10px', fontSize: '11px', background: 'var(--secondary)' }}
                              >
                                💳 Card
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice modal overlay */}
      {selectedInvoice && (
        <div className="invoice-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div className="glass-panel printable-invoice-card" style={{ width: '100%', maxWidth: '640px', padding: '40px', background: 'var(--bg-surface)' }}>
            
            {/* Modal actions, hidden during print */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <button onClick={() => setSelectedInvoice(null)} className="btn btn-secondary">
                ❌ Close
              </button>
              <button onClick={handlePrint} className="btn btn-primary">
                <Printer size={16} /> Print Waybill Invoice
              </button>
            </div>

            {/* Print invoice block */}
            <div className="print-content">
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border-light)', paddingBottom: '20px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--secondary)' }}>Ascendia Transports</h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>100 Port Rd, Colombo, Sri Lanka</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700 }}>WAYBILL INVOICE</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    No: {selectedInvoice.p.transactionId || `INV-${selectedInvoice.p.id.toUpperCase().slice(0, 8)}`}
                  </span>
                </div>
              </div>

              {/* Shipping Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '30px', fontSize: '13px' }}>
                <div>
                  <h4 style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>SHIP FROM:</h4>
                  <p style={{ fontWeight: 600 }}>Ascendia Hub Facility</p>
                  <p>{selectedInvoice.b.pickup}</p>
                </div>
                <div>
                  <h4 style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>SHIP TO (DESTINATION):</h4>
                  <p style={{ fontWeight: 600 }}>Receiver Depot</p>
                  <p>{selectedInvoice.b.destination}</p>
                </div>
              </div>

              {/* Cargo Ledger Manifest */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <th style={{ textAlign: 'left', padding: '10px 0', color: 'var(--text-muted)' }}>Manifest Description</th>
                    <th style={{ textAlign: 'center', padding: '10px 0', color: 'var(--text-muted)' }}>Class Type</th>
                    <th style={{ textAlign: 'right', padding: '10px 0', color: 'var(--text-muted)' }}>Weight</th>
                    <th style={{ textAlign: 'right', padding: '10px 0', color: 'var(--text-muted)' }}>Price Unit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '12px 0' }}>{selectedInvoice.b.cargoDetails}</td>
                    <td style={{ textAlign: 'center' }}>{selectedInvoice.b.deliveryType}</td>
                    <td style={{ textAlign: 'right' }}>{selectedInvoice.b.weight.toLocaleString()} kg</td>
                    <td style={{ textAlign: 'right' }}>LKR {selectedInvoice.p.amount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Total calculations */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '40px', fontSize: '13px' }}>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Logistics Subtotal:</span>
                  <span style={{ color: 'var(--text-muted)' }}>Surcharge fee:</span>
                  <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>Total Due:</strong>
                  <span style={{ color: 'var(--text-muted)' }}>Payment status:</span>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: 600 }}>
                  <span>LKR {(selectedInvoice.p.amount * 0.9).toFixed(2)}</span>
                  <span>LKR {(selectedInvoice.p.amount * 0.1).toFixed(2)}</span>
                  <strong style={{ fontSize: '16px', color: 'var(--secondary)' }}>LKR {selectedInvoice.p.amount.toFixed(2)}</strong>
                  <span style={{ color: selectedInvoice.p.status === 'PAID' ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
                    {selectedInvoice.p.status}
                  </span>
                </div>
              </div>

              {/* Footer Stamp */}
              <div style={{ borderTop: '1px dashed var(--border-light)', marginTop: '40px', paddingTop: '16px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                Thank you for using Ascendia Transports. Scan Barcode for route optimization verification.
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
