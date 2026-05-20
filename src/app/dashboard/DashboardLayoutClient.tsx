'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  MapPin, 
  CalendarRange, 
  FolderClock, 
  FileCheck, 
  Wrench, 
  Flame, 
  Receipt, 
  BarChart3, 
  Settings, 
  LogOut, 
  Bell, 
  User as UserIcon, 
  Menu, 
  X,
  ChevronDown
} from 'lucide-react';
import styles from './DashboardLayout.module.css';

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export default function DashboardLayoutClient({ children, user }: DashboardLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Load notifications from local mock endpoints
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    }
    fetchNotifications();
    // Poll notifications every 10 seconds for real-time alerts feel
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'PUT' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Sidebar navigation mapping based on Role
  const navigationItems = [
    {
      name: 'Dashboard Overview',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'TRANSPORT_MANAGER', 'DISPATCHER', 'DRIVER', 'CUSTOMER', 'ACCOUNTANT']
    },
    {
      name: 'Vehicles',
      path: '/dashboard/vehicles',
      icon: Truck,
      roles: ['ADMIN', 'TRANSPORT_MANAGER', 'DISPATCHER']
    },
    {
      name: 'Drivers',
      path: '/dashboard/drivers',
      icon: Users,
      roles: ['ADMIN', 'TRANSPORT_MANAGER', 'DISPATCHER']
    },
    {
      name: 'Trips',
      path: '/dashboard/trips',
      icon: CalendarRange,
      roles: ['ADMIN', 'TRANSPORT_MANAGER', 'DISPATCHER', 'DRIVER']
    },
    {
      name: 'Live GPS Tracking',
      path: '/dashboard/tracking',
      icon: MapPin,
      roles: ['ADMIN', 'TRANSPORT_MANAGER', 'DISPATCHER', 'DRIVER', 'CUSTOMER']
    },
    {
      name: 'Bookings',
      path: '/dashboard/bookings',
      icon: FolderClock,
      roles: ['ADMIN', 'TRANSPORT_MANAGER', 'DISPATCHER', 'CUSTOMER']
    },
    {
      name: 'Shipments',
      path: '/dashboard/shipments',
      icon: FileCheck,
      roles: ['ADMIN', 'TRANSPORT_MANAGER', 'DISPATCHER', 'CUSTOMER']
    },
    {
      name: 'Fleet Maintenance',
      path: '/dashboard/maintenance',
      icon: Wrench,
      roles: ['ADMIN', 'TRANSPORT_MANAGER', 'DISPATCHER']
    },
    {
      name: 'Fuel Logs',
      path: '/dashboard/fuel',
      icon: Flame,
      roles: ['ADMIN', 'TRANSPORT_MANAGER', 'DISPATCHER', 'ACCOUNTANT']
    },
    {
      name: 'Billing & Invoices',
      path: '/dashboard/billing',
      icon: Receipt,
      roles: ['ADMIN', 'TRANSPORT_MANAGER', 'ACCOUNTANT']
    },
    {
      name: 'Reports & Analytics',
      path: '/dashboard/reports',
      icon: BarChart3,
      roles: ['ADMIN', 'TRANSPORT_MANAGER', 'ACCOUNTANT']
    },
    {
      name: 'Customer Portal',
      path: '/dashboard/customer-portal',
      icon: UserIcon,
      roles: ['CUSTOMER']
    },
    {
      name: 'System Admin Panel',
      path: '/dashboard/admin',
      icon: Settings,
      roles: ['ADMIN']
    }
  ];

  // Filter items matching user's active role
  const activeNavItems = navigationItems.filter(item => item.roles.includes(user.role));

  return (
    <div className={styles.layoutContainer}>
      {/* Sidebar Panel */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : styles.closed}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoArea}>
            <div className={styles.logoIcon}>T</div>
            <span className={styles.logoText}>TMS Pro</span>
          </div>
          <button className={styles.closeBtn} onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.userProfileShort}>
          <div className={styles.avatarLetter}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className={styles.profileDetails}>
            <span className={styles.profileName}>{user.name}</span>
            <span className={styles.profileRole}>{user.role.replace('_', ' ')}</span>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          {activeNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              >
                <Icon size={20} className={styles.navIcon} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className={styles.mainWrapper}>
        {/* Header/Navbar */}
        <header className={styles.header}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={24} />
          </button>

          <div className={styles.headerActions}>
            {/* Notification system */}
            <div className={styles.notificationWrapper}>
              <button 
                className={styles.actionBtn} 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className={styles.badgeCount}>{unreadCount}</span>
                )}
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
                        <div 
                          key={notif.id} 
                          className={`${styles.notifItem} ${notif.read ? styles.notifRead : styles.notifUnread}`}
                          onClick={() => markAsRead(notif.id)}
                        >
                          <div className={styles.notifHeader}>
                            <h5>{notif.title}</h5>
                            <span className={styles.notifTime}>
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p>{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className={styles.headerUser}>
              <div className={styles.headerAvatar}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className={styles.headerUsername}>{user.name}</span>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
