'use client';

import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  user?: {
    name: string;
  };
}

export default function DriverAttendancePage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/driver-attendance');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="dashboard-content animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Driver Attendance Logs</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>View real-time clock-in and clock-out history from the Driver App.</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '10px' }}>
        <div className="table-container" style={{ margin: 0 }}>
          <table className="tms-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Driver Name</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Loading attendance records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No driver attendance logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isClockIn = log.details.includes('IN');
                  return (
                    <tr key={log.id}>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {log.details.replace('Driver ', '').split(' clocked')[0]}
                      </td>
                      <td>
                        <span className={`badge ${isClockIn ? 'badge-success' : 'badge-danger'}`}>
                          <Clock size={12} style={{ marginRight: '4px' }} />
                          {isClockIn ? 'Clock In' : 'Clock Out'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{log.details}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
