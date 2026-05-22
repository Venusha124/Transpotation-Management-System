'use client';

import React, { useEffect, useState } from 'react';
import { Ticket, Check, X, CreditCard, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface Booking {
  id: string;
  customerId: string;
  pickup: string;
  destination: string;
  weight: number;
  cargoDetails: string;
  deliveryType: string;
  status: string;
  paymentStatus: string;
  scheduledTime: string;
  createdAt: string;
  seatNumber?: string;
  qrScanned?: boolean;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [userRole, setUserRole] = useState('');

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings);
      }
      const resMe = await fetch('/api/auth/me');
      if (resMe.ok) {
        const data = await resMe.json();
        setUserRole(data.user.role);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleAction = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchBookings();
    } catch (err) { console.error(err); }
  };

  const handlePay = async (id: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'PAID' })
      });
      if (res.ok) fetchBookings();
    } catch (err) { console.error(err); }
  };

  const statusBadge = (s: string) => {
    if (s === 'PENDING') return 'badge-warning';
    if (s === 'APPROVED') return 'badge-success';
    return 'badge-danger';
  };

  return (
    <div className="dashboard-content animate-fade-in">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Ticket size={26} color="var(--primary)" />
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Passenger Tickets & Boarding Passes</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', marginLeft: '36px' }}>
          {userRole === 'CUSTOMER'
            ? 'View your boarding passes and e-tickets for upcoming journeys'
            : 'Approve passenger ticket requests and verify boarding passes'}
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '10px' }}>
        <div className="table-container" style={{ margin: 0 }}>
          <table className="tms-table">
            <thead>
              <tr>
                <th>Ticket Reference</th>
                <th>Journey Route</th>
                <th>Passengers</th>
                <th>Service Type</th>
                <th>Travel Date</th>
                <th>Booking Status</th>
                <th>Fare Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No tickets found. {userRole === 'CUSTOMER' && 'Go to the Passenger Portal to book a journey!'}
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '12px' }}>
                      🎟 {booking.id.toUpperCase().slice(0, 8)}...
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        <span style={{ fontWeight: 600 }}>{booking.pickup}</span>
                        <span style={{ color: '#3b82f6', fontSize: '16px' }}>→</span>
                        <span style={{ fontWeight: 600 }}>{booking.destination}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{booking.weight}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px' }}>pax</span>
                    </td>
                    <td>
                      <span className="badge badge-info">{booking.deliveryType}</span>
                      {booking.cargoDetails && <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>{booking.cargoDetails}</span>}
                    </td>
                    <td style={{ fontSize: '13px' }}>{new Date(booking.scheduledTime).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${statusBadge(booking.status)}`}>{booking.status}</span>
                      {booking.seatNumber && <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Seats: {booking.seatNumber}</span>}
                    </td>
                    <td>
                      <span className={`badge ${booking.paymentStatus === 'PENDING' ? 'badge-warning' : 'badge-success'}`}>
                        {booking.paymentStatus === 'PAID' ? '✓ PAID' : '⏳ PENDING'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {userRole !== 'CUSTOMER' && booking.status === 'PENDING' && (
                          <>
                            <button onClick={() => handleAction(booking.id, 'APPROVED')} className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '11px', background: 'var(--accent-success)' }}>
                              <Check size={12} /> Approve
                            </button>
                            <button onClick={() => handleAction(booking.id, 'REJECTED')} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '11px', color: '#fc8181' }}>
                              <X size={12} /> Reject
                            </button>
                          </>
                        )}
                        {userRole === 'CUSTOMER' && booking.paymentStatus === 'PENDING' && (
                          <button onClick={() => handlePay(booking.id)} className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '11px' }}>
                            <CreditCard size={12} /> Pay Fare
                          </button>
                        )}
                        {booking.status === 'APPROVED' && userRole !== 'CUSTOMER' && (
                          <span style={{ fontSize: '11px', color: 'var(--accent-success)' }}>✓ Confirmed</span>
                        )}
                        {booking.status === 'APPROVED' && booking.paymentStatus === 'PAID' && userRole === 'CUSTOMER' && (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'white', padding: '4px', borderRadius: '4px' }} title="Scan to board">
                            <QRCodeSVG 
                              value={`TICKET:${booking.id}|SEATS:${booking.seatNumber || 'UNASSIGNED'}`} 
                              size={48} 
                            />
                            <span style={{ fontSize: '8px', color: 'black', marginTop: '2px', fontWeight: 'bold' }}>E-TICKET</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
