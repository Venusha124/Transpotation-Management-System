'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, Download, FileText, Table } from 'lucide-react';

export default function ReportsPage() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [payments, setPayments] = useState([]);

  const fetchData = async () => {
    try {
      const rVehicles = await fetch('/api/vehicles').then(r => r.json());
      const rDrivers = await fetch('/api/drivers').then(r => r.json());
      const rTrips = await fetch('/api/trips').then(r => r.json());
      const rFuel = await fetch('/api/fuel').then(r => r.json());
      const rBilling = await fetch('/api/billing').then(r => r.json());

      if (rVehicles.success) setVehicles(rVehicles.vehicles);
      if (rDrivers.success) setDrivers(rDrivers.drivers);
      if (rTrips.success) setTrips(rTrips.trips);
      if (rFuel.success) setFuelLogs(rFuel.fuelLogs);
      if (rBilling.success) setPayments(rBilling.payments);
    } catch (error) {
      console.error('Failed to compile reports data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Client-side CSV compiler and exporter
  const triggerCSVDownload = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert('No data points available to compile this report.');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add headers row
    csvRows.push(headers.join(','));

    // Add content rows
    for (const item of data) {
      const values = headers.map(h => {
        const val = item[h];
        const stringVal = val === null || val === undefined ? '' : String(val);
        // Escape quotes
        return `"${stringVal.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dashboard-content animate-fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Reports & Exporters</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
          Aggregate fleet operations logs and download clean spreadsheet CSV files
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Vehicles Report */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '24px' }}>🚛</span>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Fleet Inventory Sheet</h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
              Export detailed list of all vehicles including brands, load capacity categories, insurance timelines, and current operational states.
            </p>
          </div>
          <button 
            onClick={() => triggerCSVDownload(vehicles, 'tms_fleet_vehicles')}
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: 'auto' }}
          >
            <Download size={16} /> Export Vehicles CSV ({vehicles.length})
          </button>
        </div>

        {/* Trips Report */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '24px' }}>🗺️</span>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Trips & Deliveries Registry</h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
              Export trip logs, tracking codes, assigned drivers/vehicles, geographical routes, cargo weights, and transit completion metrics.
            </p>
          </div>
          <button 
            onClick={() => triggerCSVDownload(trips, 'tms_delivery_trips')}
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: 'auto' }}
          >
            <Download size={16} /> Export Trips CSV ({trips.length})
          </button>
        </div>

        {/* Fuel Report */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '24px' }}>⛽</span>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Fuel Auditing Log</h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
              Export fuel consumption ledgers containing dates, odometer records, fill volumes, and costs to verify vehicle fuel economy rates.
            </p>
          </div>
          <button 
            onClick={() => triggerCSVDownload(fuelLogs, 'tms_fuel_efficiency')}
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: 'auto' }}
          >
            <Download size={16} /> Export Fuel Logs CSV ({fuelLogs.length})
          </button>
        </div>

        {/* Ledger Report */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '24px' }}>💵</span>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Ledger Payments Sheet</h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
              Export cargo booking invoice balances, transaction IDs, payment methods, timestamps, and settlement tracking logs.
            </p>
          </div>
          <button 
            onClick={() => triggerCSVDownload(payments, 'tms_payments_ledger')}
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: 'auto' }}
          >
            <Download size={16} /> Export Payments CSV ({payments.length})
          </button>
        </div>
      </div>
    </div>
  );
}
