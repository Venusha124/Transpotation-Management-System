'use client';

import React, { useEffect, useState } from 'react';
import { FolderClock, Check, X, CreditCard } from 'lucide-react';

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

      // Check current user role
      const resMe = await fetch('/api/auth/me');
      if (resMe.ok) {
        const data = await resMe.json();
        setUserRole(data.user.role);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleAction = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchBookings();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePay = async (id: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'PAID' })
      });
      if (res.ok) fetchBookings();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-content animate-fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Cargo Booking Requests</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
          {userRole === 'CUSTOMER' 
            ? 'Manage and checkout your cargo shipment bookings' 
            : 'Approve cargo booking requests and assign payments'}
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '10px' }}>
        <div className="table-container" style={{ margin: 0 }}>
          <table className="tms-table">
            <thead>
              <tr>
                <th>Booking Reference</th>
                <th>Route (Pickup ➜ Drop)</th>
                <th>Cargo Weight</th>
                <th>Category</th>
                <th>Scheduled Date</th>
                <th>Approval Status</th>
                <th>Invoice Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No bookings found. {userRole === 'CUSTOMER' && 'Go to the Customer Portal to create one!'}
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary-hover)', fontSize: '12px' }}>
                      {booking.id.toUpperCase().slice(0, 8)}...
                    </td>
                    <td>
                      <strong>{booking.pickup}</strong> to <strong>{booking.destination}</strong>
                    </td>
                    <td>{booking.weight} kg</td>
                    <td>{booking.deliveryType} ({booking.cargoDetails})</td>
                    <td>{new Date(booking.scheduledTime).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${
                        booking.status === 'PENDING' ? 'badge-warning' : 
                        booking.status === 'APPROVED' ? 'badge-success' : 'badge-danger'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        booking.paymentStatus === 'PENDING' ? 'badge-warning' : 'badge-success'
                      }`}>
                        {booking.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {userRole !== 'CUSTOMER' && booking.status === 'PENDING' && (
                          <>
                            <button 
                              onClick={() => handleAction(booking.id, 'APPROVED')} 
                              className="btn btn-primary" 
                              style={{ padding: '6px 10px', fontSize: '11px', background: 'var(--accent-success)' }}
                            >
                              <Check size={12} /> Approve
                            </button>
                            <button 
                              onClick={() => handleAction(booking.id, 'REJECTED')} 
                              className="btn btn-secondary" 
                              style={{ padding: '6px 10px', fontSize: '11px', color: '#f87171' }}
                            >
                              <X size={12} /> Reject
                            </button>
                          </>
                        )}
                        {userRole === 'CUSTOMER' && booking.paymentStatus === 'PENDING' && (
                          <button 
                            onClick={() => handlePay(booking.id)} 
                            className="btn btn-primary" 
                            style={{ padding: '6px 10px', fontSize: '11px', background: 'var(--secondary)' }}
                          >
                            <CreditCard size={12} /> Pay Invoice
                          </button>
                        )}
                        {booking.status === 'APPROVED' && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Approved Asset</span>
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
