'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Bus, Users, MapPin, Route, Ticket,
  MapPinned, Wrench, Flame, Receipt, BarChart3,
  Settings, LogOut, User as UserIcon, Menu, X, Bell, QrCode, AlertCircle, Brain, TrendingUp
} from 'lucide-react';
import styles from './DashboardLayout.module.css';
import { useLanguage } from '@/components/LanguageProvider';

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  user: { id: string; email: string; name: string; role: string; };
}

export default function DashboardLayoutClient({ children, user }: DashboardLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (err) { console.error('Failed to load notifications:', err); }
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) { router.push('/login'); router.refresh(); }
    } catch (error) { console.error('Logout failed:', error); }
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'PUT' });
      if (res.ok) setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) { console.error(err); }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const roleLabel: Record<string, string> = {
    ADMIN: 'Administrator', TRANSPORT_MANAGER: 'Fleet Supervisor',
    DISPATCHER: 'Route Coordinator', DRIVER: 'Bus Driver',
    CUSTOMER: 'Passenger', ACCOUNTANT: 'Accountant', CONDUCTOR: 'Bus Conductor'
  };

  const navigationItems = [
    { name: 'Dashboard Overview', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'TRANSPORT_MANAGER', 'DISPATCHER', 'DRIVER', 'CUSTOMER', 'ACCOUNTANT'] },
    { name: 'Bus Fleet', path: '/dashboard/vehicles', icon: Bus, roles: ['ADMIN', 'TRANSPORT_MANAGER', 'DISPATCHER'] },
    { name: 'Drivers', path: '/dashboard/drivers', icon: Users, roles: ['ADMIN', 'TRANSPORT_MANAGER', 'DISPATCHER'] },
    { name: 'Route Plans', path: '/dashboard/routes', icon: Route, roles: ['ADMIN', 'TRANSPORT_MANAGER', 'DISPATCHER'] },
    { name: 'Route Runs', path: '/dashboard/route-runs', icon: MapPinned, roles: ['ADMIN', 'TRANSPORT_MANAGER', 'DISPATCHER', 'DRIVER'] },
    { name: 'Live Bus Tracker', path: '/dashboard/tracking', icon: MapPin, roles: ['ADMIN', 'TRANSPORT_MANAGER', 'DISPATCHER', 'DRIVER', 'CUSTOMER'] },
    { name: 'Passenger Tickets', path: '/dashboard/bookings', icon: Ticket, roles: ['ADMIN', 'TRANSPORT_MANAGER', 'DISPATCHER', 'CUSTOMER'] },
    { name: 'Bus Stops', path: '/dashboard/stops', icon: MapPinned, roles: ['ADMIN', 'TRANSPORT_MANAGER', 'DISPATCHER'] },
    { name: 'Bus Maintenance', path: '/dashboard/maintenance', icon: Wrench, roles: ['ADMIN', 'TRANSPORT_MANAGER', 'DISPATCHER'] },
    { name: 'Fuel Logs', path: '/dashboard/fuel', icon: Flame, roles: ['ADMIN', 'TRANSPORT_MANAGER', 'DISPATCHER', 'ACCOUNTANT'] },
    { name: 'Billing & Revenue', path: '/dashboard/billing', icon: Receipt, roles: ['ADMIN', 'TRANSPORT_MANAGER', 'ACCOUNTANT'] },
    { name: 'Reports & Analytics', path: '/dashboard/reports', icon: BarChart3, roles: ['ADMIN', 'TRANSPORT_MANAGER', 'ACCOUNTANT'] },
    { name: 'AI Forecast', path: '/dashboard/ai-analytics', icon: Brain, roles: ['ADMIN', 'TRANSPORT_MANAGER'] },
    { name: 'Fleet Heatmap', path: '/dashboard/fleet-utilization', icon: TrendingUp, roles: ['ADMIN', 'TRANSPORT_MANAGER'] },
    { name: 'Disputes & Refunds', path: '/dashboard/disputes', icon: AlertCircle, roles: ['ADMIN', 'TRANSPORT_MANAGER'] },
    { name: 'Conductor POS', path: '/dashboard/conductor', icon: QrCode, roles: ['ADMIN', 'TRANSPORT_MANAGER', 'DISPATCHER', 'CONDUCTOR'] },
    { name: 'Passenger Portal', path: '/dashboard/customer-portal', icon: UserIcon, roles: ['CUSTOMER'] },
    { name: 'System Admin Panel', path: '/dashboard/admin', icon: Settings, roles: ['ADMIN'] },
  ];

  const activeNavItems = navigationItems.filter(item => item.roles.includes(user.role));

  return (
    <div className={styles.layoutContainer}>
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : styles.closed}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoArea}>
            <div className={styles.logoIcon} style={{ background: 'transparent', padding: 0 }}>
              <img src="/ascendia_logo.png" alt="Ascendia Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }} />
            </div>
            <div>
              <span className={styles.logoText} style={{ fontSize: '15px', fontWeight: 800 }}>ASCENDIA</span>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '1px' }}>Bus Transit System</div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>

        <div className={styles.userProfileShort}>
          <div className={styles.avatarLetter} style={{ background: 'linear-gradient(135deg, #2563eb 0%, #c53030 100%)' }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className={styles.profileDetails}>
            <span className={styles.profileName}>{user.name}</span>
            <span className={styles.profileRole}>{roleLabel[user.role] || user.role.replace('_', ' ')}</span>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          {activeNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path} className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}>
                <Icon size={19} className={styles.navIcon} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={20} /><span>Logout</span>
          </button>
        </div>
      </aside>

      <div className={styles.mainWrapper}>
        <header className={styles.header}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(!sidebarOpen)}><Menu size={24} /></button>
          <div className={styles.headerActions}>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value as 'en'|'si'|'ta')}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '4px', padding: '4px 8px', marginRight: '16px', outline: 'none' }}
            >
              <option value="en" style={{ color: 'black' }}>ENG</option>
              <option value="si" style={{ color: 'black' }}>SIN</option>
              <option value="ta" style={{ color: 'black' }}>TAM</option>
            </select>
            <div className={styles.notificationWrapper}>
              <button className={styles.actionBtn} onClick={() => setNotificationsOpen(!notificationsOpen)}>
                <Bell size={20} />
                {unreadCount > 0 && <span className={styles.badgeCount}>{unreadCount}</span>}
              </button>
              {notificationsOpen && (
                <div className={`${styles.notificationDropdown} glass-panel`}>
                  <div className={styles.dropdownHeader}>
                    <h4>System Notifications</h4>
                    <span className={styles.clearBtn} onClick={() => setNotificationsOpen(false)}>Close</span>
                  </div>
                  <div className={styles.dropdownBody}>
                    {notifications.length === 0 ? (
                      <p className={styles.emptyText}>No notifications</p>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className={`${styles.notifItem} ${notif.read ? styles.notifRead : styles.notifUnread}`} onClick={() => markAsRead(notif.id)}>
                          <div className={styles.notifHeader}>
                            <h5>{notif.title}</h5>
                            <span className={styles.notifTime}>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p>{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className={styles.headerUser}>
              <div className={styles.headerAvatar} style={{ background: 'linear-gradient(135deg, #2563eb 0%, #c53030 100%)' }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className={styles.headerUsername}>{user.name}</span>
            </div>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
