'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Bell, User, QrCode, Plus, List, Home, History, MapPin, CheckCircle2, XCircle, RefreshCw, CreditCard, ScanLine, Ticket, ChevronLeft, Lock, Bus, Receipt, Printer, CheckCircle, Eye } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface ConductorPOSPageClientProps {
  initialUser: any;
}

export default function ConductorPOSPageClient({ initialUser }: ConductorPOSPageClientProps) {
  const [user, setUser] = useState<any>(initialUser);
  
  // Shift Management
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [shiftDetails, setShiftDetails] = useState({ bus: '', route: '', fare: 500, tripId: '' });
  const [showSettlement, setShowSettlement] = useState(false);
  
  // Finance Tracking
  const [fares, setFares] = useState({ cash: 0, digital: 0 });

  // Navigation
  const [activeTab, setActiveTab] = useState<'home' | 'scan' | 'issue' | 'history'>('home');
  const [manifestView, setManifestView] = useState<'list' | 'map'>('list');
  
  // Scanner State
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [verificationData, setVerificationData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Data state
  const [scannedPassengers, setScannedPassengers] = useState<any[]>([]);
  const [bookedSeats, setBookedSeats] = useState<number[]>([]); // 1 to 40
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [tripBookings, setTripBookings] = useState<any[]>([]);

  // Issue Ticket State
  const [paxCount, setPaxCount] = useState(1);
  const [generatedPaymentQR, setGeneratedPaymentQR] = useState<{ id: string, amount: number } | null>(null);
  const [printTicketData, setPrintTicketData] = useState<any>(null);
  const [availableTrips, setAvailableTrips] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  const fetchTripBookings = async () => {
    if (!shiftDetails.tripId) return;
    try {
      const res = await fetch(`/api/bookings?tripId=${shiftDetails.tripId}`);
      if (res.ok) {
        const data = await res.json();
        setTripBookings(data.bookings || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isShiftActive && shiftDetails.tripId) {
      fetchTripBookings();
    } else {
      setTripBookings([]);
    }
  }, [isShiftActive, shiftDetails.tripId]);

  useEffect(() => {
    fetch('/api/auth/me').then(res => res.json()).then(data => {
      if (data.user) setUser(data.user);
    }).catch(console.error);

    fetch('/api/trips').then(res => res.json()).then(data => setAvailableTrips(data.trips || []));
    fetch('/api/vehicles').then(res => res.json()).then(data => setVehicles(data.vehicles || []));
  }, []);

  const allocateSeats = (count: number) => {
    let assigned = [];
    for (let i = 1; i <= 40; i++) {
      if (!bookedSeats.includes(i)) {
        assigned.push(i);
        if (assigned.length === count) break;
      }
    }
    setBookedSeats(prev => [...prev, ...assigned]);
    return assigned.join(', ');
  };

  useEffect(() => {
    if (activeTab === 'scan' && isShiftActive) {
      if (!scannerRef.current) {
        scannerRef.current = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
        scannerRef.current.render(
          (decodedText) => {
            setScanResult(decodedText);
            if (scannerRef.current) { try { scannerRef.current.clear(); } catch(e) {} scannerRef.current = null; }
            verifyTicket(decodedText);
          },
          (err) => {}
        );
      }
    } else {
      if (scannerRef.current) { try { scannerRef.current.clear(); } catch(e) {} scannerRef.current = null; }
    }
  }, [activeTab, isShiftActive]);

  const verifyTicket = async (qrData: string) => {
    setLoading(true); setError(null); setVerificationData(null);
    try {
      const res = await fetch('/api/verify-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.requiresPayment && data.ticket) {
          if (scannerRef.current) { try { scannerRef.current.clear(); scannerRef.current = null; } catch(e) {} }
          setPaxCount(data.ticket.weight || 1);
          setScanResult(null); setLoading(false);
          setActiveTab('issue');
          return;
        }
        throw new Error(data.error || "Failed to verify ticket.");
      }
      
      const seats = data.ticket.seats === 'Unassigned' ? allocateSeats(data.ticket.weight || 1) : data.ticket.seats;
      data.ticket.seats = seats;
      setVerificationData(data);
      setScannedPassengers(prev => [{ id: data.ticket.id, seats, route: `${data.ticket.pickup.split(',')[0]} ➜ ${data.ticket.destination.split(',')[0]}`, timestamp: new Date().toLocaleTimeString() }, ...prev]);
      setTripBookings(prev => prev.map(b => b.id === data.ticket.id ? { ...b, qrScanned: true } : b));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualTest = () => {
    const testPayload = "TICKET:TEST-" + Math.floor(Math.random() * 10000) + "|SEATS:A1";
    setScanResult(testPayload);
    if (scannerRef.current) { try { scannerRef.current.clear(); scannerRef.current = null; } catch(e) {} }
    
    setLoading(true); setError(null); setVerificationData(null);
    setTimeout(() => {
      setLoading(false);
      const seats = allocateSeats(2); 
      const data = { success: true, ticket: { id: testPayload.split('|')[0].replace('TICKET:', ''), seats, pickup: 'Colombo', destination: 'Kandy', price: 1000 } };
      setVerificationData(data);
      setScannedPassengers(prev => [{ id: data.ticket.id, seats: data.ticket.seats, route: 'Colombo ➜ Kandy', timestamp: new Date().toLocaleTimeString() }, ...prev]);
    }, 1000);
  };

  const resetScanner = () => {
    setScanResult(null); setVerificationData(null); setError(null);
    if (scannerRef.current) { try { scannerRef.current.clear(); } catch(e) {} scannerRef.current = null; }
    setActiveTab('home'); setTimeout(() => setActiveTab('scan'), 100);
  };

  const handleGenerateQR = () => {
    const mockId = Math.random().toString(36).substring(2, 10).toUpperCase();
    setGeneratedPaymentQR({ id: mockId, amount: paxCount * shiftDetails.fare });
  };

  const handlePaymentSuccess = (method: 'CASH' | 'QR', amount: number) => {
    if (method === 'CASH') setFares(prev => ({ ...prev, cash: prev.cash + amount }));
    if (method === 'QR') setFares(prev => ({ ...prev, digital: prev.digital + amount }));
    
    const assignedSeats = allocateSeats(paxCount);
    const mockId = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    setScannedPassengers(prev => [{ id: mockId, seats: assignedSeats, route: shiftDetails.route, timestamp: new Date().toLocaleTimeString() }, ...prev]);
    
    setGeneratedPaymentQR(null);
    setPrintTicketData({ id: mockId, seats: assignedSeats, route: shiftDetails.route, amount, method, date: new Date().toLocaleString() });
  };

  const executePrint = () => {
    window.print();
    setPrintTicketData(null);
    setPaxCount(1);
  };

  if (!isShiftActive) {
    return (
      <div className="mobile-app-wrapper theme-dark-glass" style={{ justifyContent: 'center', padding: '20px' }}>
        <style dangerouslySetInnerHTML={{__html: globalStyles}} />
        <div className="start-shift-card glass-panel fade-in-up">
          <div className="icon-badge-large"><Bus size={48} color="#60a5fa" /></div>
          <h2>Start Your Shift</h2>
          <p>Select your assigned route run to begin boarding passengers.</p>
          
          <div className="form-group">
            <label>Assigned Route Run (Trip)</label>
            <select className="glass-input" 
              value={shiftDetails.tripId}
              onChange={e => {
                const trip = availableTrips.find(t => t.id === e.target.value);
                if (trip) {
                  const vehicle = vehicles.find(v => v.id === trip.vehicleId);
                  const routeName = `${trip.pickup.split(',')[0]} - ${trip.destination.split(',')[0]}`;
                  // Use the real basePrice from the linked Route Plan, fallback to 500
                  const fare = trip.route?.basePrice && trip.route.basePrice > 0 ? trip.route.basePrice : 500;
                  setShiftDetails({ bus: vehicle ? vehicle.number : (trip.vehicle?.number || 'Unknown'), route: routeName, fare: fare, tripId: trip.id });
                } else {
                  setShiftDetails({ bus: '', route: '', fare: 500, tripId: '' });
                }
              }}
            >
              <option value="">-- Select Active Route Run --</option>
              {availableTrips.filter(t => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS').map(trip => (
                <option key={trip.id} value={trip.id}>
                  {trip.trackingNumber} : {trip.pickup.split(',')[0]} ➜ {trip.destination.split(',')[0]}
                </option>
              ))}
            </select>
          </div>

          {/* Fare Preview Card — shown when a trip is selected */}
          {shiftDetails.tripId && (
            <div style={{ background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '12px', padding: '16px', marginBottom: '8px', textAlign: 'left' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>Route Plan Summary</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Bus No.</span>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>{shiftDetails.bus}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Route</span>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>{shiftDetails.route}</span>
              </div>
              <div style={{ borderTop: '1px dashed rgba(56,189,248,0.2)', marginTop: '10px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>Fare per Passenger</span>
                <span style={{ fontSize: '20px', fontWeight: 900, background: 'linear-gradient(135deg,#38bdf8,#3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  LKR {shiftDetails.fare.toLocaleString()}.00
                </span>
              </div>
            </div>
          )}
          
          <button 
            className="btn-primary-mobile mt-4 interactive" 
            onClick={() => setIsShiftActive(true)}
            disabled={!shiftDetails.tripId}
            style={!shiftDetails.tripId ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            Start Shift
          </button>
        </div>
      </div>
    );
  }

  const renderHome = () => (
    <div className="home-view fade-in-up">
      <div className="top-header">
        <div className="header-top">
          <div>
            <h1 className="greeting">Good Shift! {user?.name?.split(' ')[0] || 'Conductor'}</h1>
            <p className="subtitle">{shiftDetails.bus} | {shiftDetails.route}</p>
          </div>
          <div className="header-icons">
            <button className="icon-btn glass-btn"><Bell size={18} /></button>
          </div>
        </div>

        <div className="main-card float-anim">
          <div className="card-top">
            <div className="logo-box" style={{ background: 'transparent', padding: 0, display: 'flex', alignItems: 'center' }}>
               <img src="/ascendia_logo.png" alt="Ascendia" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'contain', boxShadow: '0 2px 10px rgba(0,0,0,0.5)' }} />
               <span className="logo-text" style={{ marginLeft: '10px', color: '#fff' }}>ASCENDIA<br/>TRANSPORTS</span>
            </div>
            <div className="status-badge"><span className="dot"></span> Active</div>
          </div>
          <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div className="card-info">
              <h3>Conductor ID</h3>
              <p className="id-text">ID {user?.id?.toUpperCase().substring(0,12) || 'A91FBD18AF66'}</p>
              
              <div className="balances-grid mt-4">
                <div className="balance-box">
                  <span className="balance-label">CASH IN HAND</span>
                  <div className="balance-amount" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                     LKR {fares.cash.toLocaleString()} <Eye size={16} className="eye-icon" />
                  </div>
                </div>
              </div>
            </div>
            <div className="qr-container">
               <QRCodeSVG value={`COND:${user?.id}`} size={70} bgColor="#fff" fgColor="#000" />
            </div>
          </div>
        </div>
      </div>

      <div className="body-content">
        <div className="quick-actions">
          <div className="action-card glass-panel interactive" onClick={() => setActiveTab('scan')}>
            <div className="icon-wrapper glass-icon"><ScanLine size={24} color="#60a5fa" /></div>
            <h4>Scanner</h4>
          </div>
          <div className="action-card glass-panel interactive" onClick={() => setActiveTab('issue')}>
            <div className="icon-wrapper glass-icon"><Plus size={24} color="#a78bfa" /></div>
            <h4>Issue</h4>
          </div>
          <div className="action-card glass-panel interactive" onClick={() => setActiveTab('history')}>
            <div className="icon-wrapper glass-icon"><List size={24} color="#34d399" /></div>
            <h4>Manifest</h4>
          </div>
        </div>

        <button className="btn-secondary-mobile interactive mb-6" style={{background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.4)'}} onClick={() => setShowSettlement(true)}>
          End Shift & Settle Fares
        </button>

        <div className="section-title">RECENT ACTIVITY</div>
        {scannedPassengers.length === 0 ? (
          <div className="empty-state-card glass-panel">
            <History size={32} color="rgba(255,255,255,0.4)" strokeWidth={1.5} />
            <h4>No Recent Scans</h4>
            <p className="empty-text">Scan a passenger's ticket to get started</p>
          </div>
        ) : (
          <div className="manifest-list">
             {scannedPassengers.slice(0,3).map((p, i) => (
                <div key={i} className="manifest-item glass-panel" style={{padding: '12px'}}>
                  <div className="item-left">
                    <div className="icon-badge"><CheckCircle2 size={16} color="#10b981" /></div>
                    <div><h4 style={{fontSize: '13px'}}>{p.id}</h4></div>
                  </div>
                  <span className="time">{p.timestamp}</span>
                </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderScan = () => (
    <div className="scan-view fade-in-up">
      <div className="view-header">
        <h2>Scan Boarding Pass</h2>
        <p>Point camera at passenger's QR code</p>
      </div>

      <div className="scanner-container glass-panel">
        <div style={{ display: (!scanResult && !loading && !verificationData && !error) ? 'block' : 'none' }}>
          <div id="qr-reader" className="qr-reader-custom"></div>
          <div className="manual-test-box">
            <button onClick={handleManualTest} className="btn-test glass-btn interactive">Simulate Scan</button>
          </div>
          
          <div className="manual-ref-box" style={{ borderTop: '1px dashed rgba(255,255,255,0.15)', marginTop: '24px', paddingTop: '20px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', textAlign: 'left' }}>
              Or Board by Booking Reference
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select 
                className="glass-input interactive" 
                style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', fontSize: '14px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(56, 189, 248, 0.3)' }}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    verifyTicket(`TICKET:${val}`);
                    e.target.value = ''; // Reset selection
                  }
                }}
              >
                <option value="" style={{ background: '#0f172a', color: 'rgba(255,255,255,0.5)' }}>-- Select Booking Reference --</option>
                {tripBookings.filter(b => b.status === 'APPROVED' && !b.qrScanned).length === 0 ? (
                  <option disabled style={{ background: '#0f172a', color: 'rgba(255,255,255,0.4)' }}>No active bookings ready for boarding</option>
                ) : (
                  tripBookings
                    .filter(b => b.status === 'APPROVED' && !b.qrScanned)
                    .map(b => (
                      <option key={b.id} value={b.id} style={{ background: '#0f172a', color: '#fff' }}>
                        BOOK-{b.id.toUpperCase().slice(0, 8)} ({b.pickup.split(',')[0]} ➜ {b.destination.split(',')[0]} | {b.paymentStatus})
                      </option>
                    ))
                )}
              </select>
              <button 
                onClick={fetchTripBookings} 
                className="glass-btn interactive" 
                title="Refresh Bookings"
                type="button"
                style={{ padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '46px', width: '46px' }}
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="status-box"><RefreshCw size={48} className="spin text-blue-400" /><h3>Verifying Ticket...</h3></div>
        )}

        {verificationData && (
          <div className="status-box success">
            <div className="glow-circle green-glow"><CheckCircle2 size={64} color="#10b981" /></div>
            <h2 className="text-success mb-2">Verified!</h2>
            <div className="ticket-details glass-panel-inner">
              <div className="detail-row"><span className="label">ID</span> <span className="val">{verificationData.ticket.id}</span></div>
              <div className="detail-row"><span className="label">SEATS</span> <span className="val text-accent">{verificationData.ticket.seats}</span></div>
              <div className="detail-row"><span className="label">ROUTE</span> <span className="val">{verificationData.ticket.pickup.split(',')[0]} ➜ {verificationData.ticket.destination.split(',')[0]}</span></div>
              <div className="detail-row"><span className="label">FARE</span> <span className="val text-green">LKR {verificationData.ticket.price?.toLocaleString() || '---'}.00</span></div>
            </div>
            <button onClick={resetScanner} className="btn-primary-mobile interactive">Scan Next Passenger</button>
          </div>
        )}

        {error && (
          <div className="status-box error">
            <div className="glow-circle red-glow"><XCircle size={64} color="#ef4444" /></div>
            <h2 className="text-error mb-2">Failed</h2>
            <p className="mb-6">{error}</p>
            <button onClick={resetScanner} className="btn-secondary-mobile glass-btn interactive">Try Again</button>
          </div>
        )}
      </div>
    </div>
  );

  const renderIssue = () => (
    <div className="issue-view fade-in-up">
      <div className="view-header">
        <h2>Issue Ticket</h2>
        <p>{shiftDetails.route}</p>
      </div>

      <div className="issue-form-card glass-panel">
        {!generatedPaymentQR ? (
          <>
            <div className="form-group">
              <label>Number of Passengers</label>
              <div className="pax-selector glass-input">
                <button onClick={() => setPaxCount(Math.max(1, paxCount - 1))} className="glass-btn">-</button>
                <span>{paxCount}</span>
                <button onClick={() => setPaxCount(paxCount + 1)} className="glass-btn">+</button>
              </div>
            </div>
            <div className="fare-calc glass-panel-inner">
              <span>Total Fare:</span>
              <span className="amount text-gradient">LKR {(paxCount * shiftDetails.fare).toLocaleString()}.00</span>
            </div>
            <div className="form-actions-column mt-4">
              <button onClick={() => handlePaymentSuccess('CASH', paxCount * shiftDetails.fare)} className="btn-success-mobile interactive mb-2">
                💵 Collect Cash
              </button>
              <button onClick={handleGenerateQR} className="btn-primary-mobile interactive">
                <QrCode size={18} /> Generate LANKAQR
              </button>
            </div>
          </>
        ) : (
          <div className="qr-payment-screen">
            <h3>LANKAQR Payment</h3>
            <p>Ask passenger to scan to pay</p>
            <div className="qr-display-box glass-panel-inner">
              <QRCodeSVG value={`PAY:${generatedPaymentQR.id}|AMT:${generatedPaymentQR.amount}`} size={200} bgColor="transparent" fgColor="#000" />
            </div>
            <h2 className="payment-amount text-gradient">LKR {generatedPaymentQR.amount.toLocaleString()}.00</h2>
            <div className="payment-actions">
              <button className="btn-success-mobile interactive" onClick={() => handlePaymentSuccess('QR', generatedPaymentQR.amount)}>Verify Payment</button>
              <button className="btn-secondary-mobile glass-btn interactive" onClick={() => setGeneratedPaymentQR(null)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="history-view fade-in-up">
      <div className="view-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h2>Manifest</h2>
          <p>{bookedSeats.length} / 40 Passengers</p>
        </div>
        <div className="toggle-switch glass-panel-inner" style={{padding: '4px', display: 'flex', gap: '4px'}}>
          <button className={`toggle-btn ${manifestView === 'list' ? 'active' : ''}`} onClick={() => setManifestView('list')}><List size={16}/></button>
          <button className={`toggle-btn ${manifestView === 'map' ? 'active' : ''}`} onClick={() => setManifestView('map')}><CheckCircle size={16}/></button>
        </div>
      </div>
      
      {manifestView === 'list' ? (
        <div className="manifest-list">
          {scannedPassengers.length === 0 ? (
            <div className="empty-state glass-panel">No passengers boarded yet.</div>
          ) : (
            scannedPassengers.map((p, i) => (
              <div key={i} className="manifest-item glass-panel interactive">
                <div className="item-left">
                  <div className="icon-badge"><CheckCircle2 size={16} color="#10b981" /></div>
                  <div><h4>{p.id}</h4><p>{p.route}</p></div>
                </div>
                <div className="item-right">
                  <span className="seats">{p.seats}</span>
                  <span className="time">{p.timestamp}</span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="seat-map-container glass-panel">
           <div className="bus-front">Driver</div>
           <div className="seat-grid">
              {Array.from({length: 40}, (_, i) => i + 1).map(seat => {
                 const isBooked = bookedSeats.includes(seat);
                 return (
                   <div key={seat} className={`seat ${isBooked ? 'booked' : 'available'}`}>
                      {seat}
                   </div>
                 );
              })}
           </div>
           <div className="seat-legend">
              <div className="legend-item"><span className="box available"></span> Empty</div>
              <div className="legend-item"><span className="box booked"></span> Occupied</div>
           </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="mobile-app-wrapper theme-dark-glass">
      <style dangerouslySetInnerHTML={{__html: globalStyles}} />
      
      {/* Print Receipt Section (Hidden from screen, shown on print) */}
      {printTicketData && (
        <div className="print-receipt-section">
           <div className="receipt-content">
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',marginBottom:'4px'}}>
                <img src="/ascendia_logo.png" alt="Ascendia" style={{width:'32px',height:'32px',objectFit:'contain'}} />
                <div>
                  <h3 style={{margin:0,fontSize:'16px',fontWeight:900}}>ASCENDIA</h3>
                  <p style={{margin:0,fontSize:'9px',letterSpacing:'2px'}}>TRANSPORTS</p>
                </div>
              </div>
              <p style={{fontSize:'10px',margin:'2px 0'}}>No.157Y, Kebellaovita, Polgasovita</p>
              <p style={{fontSize:'10px',margin:'2px 0'}}>info@ascendiatransports.lk</p>
              <div className="divider"></div>
              <p style={{fontSize:'10px',fontWeight:700,textTransform:'uppercase',letterSpacing:'1px'}}>BUS TICKET RECEIPT</p>
              <div className="divider"></div>
              <p>Bus No: <strong>{shiftDetails.bus}</strong></p>
              <p>Route: <strong>{printTicketData.route}</strong></p>
              <p>Ticket ID: <strong>{printTicketData.id}</strong></p>
              <p>Seat(s): <strong>{printTicketData.seats}</strong></p>
              <p>Date: {printTicketData.date}</p>
              <p>Payment: {printTicketData.method === 'CASH' ? '💵 Cash' : '📱 LANKAQR'}</p>
              <div className="divider"></div>
              <h2>LKR {printTicketData.amount.toLocaleString()}.00</h2>
              <div className="divider"></div>
              <div style={{display:'flex',justifyContent:'center',margin:'8px 0'}}>
                <QRCodeSVG value={`ASCENDIA:${printTicketData.id}`} size={80} bgColor="#fff" fgColor="#000" />
              </div>
              <p className="footer-text">Thank you for travelling with Ascendia!</p>
              <p className="footer-text">Please retain this ticket until journey end.</p>
           </div>
        </div>
      )}

      {/* Screens when shift is active */}
      {!printTicketData && !showSettlement && (
        <>
          {activeTab === 'home' && renderHome()}
          {activeTab === 'scan' && renderScan()}
          {activeTab === 'issue' && renderIssue()}
          {activeTab === 'history' && renderHistory()}

          <div className="bottom-nav-pill">
            <button className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}><Home size={22} /><span>Home</span></button>
            <button className={`nav-item ${activeTab === 'scan' ? 'active' : ''}`} onClick={() => setActiveTab('scan')}><ScanLine size={22} /><span>Scan</span></button>
            <button className={`nav-item ${activeTab === 'issue' ? 'active' : ''}`} onClick={() => setActiveTab('issue')}><Ticket size={22} /><span>Issue</span></button>
            <button className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}><History size={22} /><span>Manifest</span></button>
          </div>
        </>
      )}

      {/* Branded Receipt Modal Overlay */}
      {printTicketData && (
        <div className="print-modal-overlay fade-in-up">
           <div className="print-modal glass-panel" style={{maxWidth:'360px',textAlign:'center'}}>

             {/* Header */}
             <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',marginBottom:'4px'}}>
               <img src="/ascendia_logo.png" alt="Ascendia" style={{width:'36px',height:'36px',borderRadius:'8px',objectFit:'contain'}} />
               <div style={{textAlign:'left'}}>
                 <div style={{fontWeight:900,fontSize:'16px',letterSpacing:'1px'}}>ASCENDIA</div>
                 <div style={{fontSize:'9px',letterSpacing:'3px',color:'rgba(255,255,255,0.5)'}}>TRANSPORTS</div>
               </div>
             </div>
             <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',marginBottom:'16px'}}>Bus Ticket Receipt</div>

             {/* Success Badge */}
             <div style={{display:'inline-flex',alignItems:'center',gap:'6px',background:'rgba(16,185,129,0.15)',border:'1px solid rgba(16,185,129,0.4)',color:'#34d399',padding:'6px 16px',borderRadius:'20px',fontSize:'13px',fontWeight:700,marginBottom:'20px'}}>
               <CheckCircle2 size={14} /> Payment Successful
             </div>

             {/* Receipt Body */}
             <div style={{background:'rgba(255,255,255,0.04)',border:'1px dashed rgba(56,189,248,0.3)',borderRadius:'12px',padding:'16px',marginBottom:'16px',textAlign:'left'}}>
               <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                 <span style={{fontSize:'12px',color:'rgba(255,255,255,0.5)'}}>Ticket ID</span>
                 <span style={{fontSize:'12px',fontFamily:'monospace',fontWeight:700,color:'#38bdf8'}}>{printTicketData.id}</span>
               </div>
               <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                 <span style={{fontSize:'12px',color:'rgba(255,255,255,0.5)'}}>Bus No.</span>
                 <span style={{fontSize:'12px',fontWeight:700}}>{shiftDetails.bus}</span>
               </div>
               <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                 <span style={{fontSize:'12px',color:'rgba(255,255,255,0.5)'}}>Route</span>
                 <span style={{fontSize:'12px',fontWeight:700,textAlign:'right',maxWidth:'55%'}}>{printTicketData.route}</span>
               </div>
               <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                 <span style={{fontSize:'12px',color:'rgba(255,255,255,0.5)'}}>Seat(s)</span>
                 <span style={{fontSize:'12px',fontWeight:700,color:'#a78bfa'}}>{printTicketData.seats}</span>
               </div>
               <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                 <span style={{fontSize:'12px',color:'rgba(255,255,255,0.5)'}}>Payment</span>
                 <span style={{fontSize:'12px',fontWeight:700}}>{printTicketData.method === 'CASH' ? '💵 Cash' : '📱 LANKAQR'}</span>
               </div>
               <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0'}}>
                 <span style={{fontSize:'12px',color:'rgba(255,255,255,0.5)'}}>Date & Time</span>
                 <span style={{fontSize:'11px',color:'rgba(255,255,255,0.6)'}}>{printTicketData.date}</span>
               </div>
               <div style={{borderTop:'1px dashed rgba(56,189,248,0.2)',margin:'12px 0'}}></div>
               <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                 <span style={{fontSize:'13px',fontWeight:700,color:'rgba(255,255,255,0.8)'}}>TOTAL FARE</span>
                 <span style={{fontSize:'22px',fontWeight:900,background:'linear-gradient(135deg,#38bdf8,#3b82f6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>LKR {printTicketData.amount.toLocaleString()}.00</span>
               </div>
             </div>

             {/* QR Code */}
             <div style={{display:'flex',justifyContent:'center',marginBottom:'16px'}}>
               <div style={{background:'white',padding:'10px',borderRadius:'12px',boxShadow:'0 0 20px rgba(56,189,248,0.25)'}}>
                 <QRCodeSVG value={`ASCENDIA:${printTicketData.id}`} size={100} bgColor="#fff" fgColor="#000" />
               </div>
             </div>
             <p style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',marginBottom:'20px'}}>Scan to verify this ticket</p>

             {/* Actions */}
             <button className="btn-primary-mobile interactive mb-2" onClick={executePrint}>
               <Printer size={16} /> Print Physical Receipt
             </button>
             <button className="btn-secondary-mobile glass-btn interactive mt-2" onClick={() => { setPrintTicketData(null); setPaxCount(1); }}>Skip Printing</button>
           </div>
         </div>
      )}

      {/* Settle Shift Modal */}
      {showSettlement && (
        <div className="settlement-overlay fade-in-up">
          <div className="settlement-modal glass-panel">
             <h2>End of Shift Summary</h2>
             <p>{shiftDetails.bus} | {shiftDetails.route}</p>
             <div className="settlement-grid mt-4">
                <div className="s-box"><span className="label">Total Passengers</span><span className="val">{scannedPassengers.length}</span></div>
                <div className="s-box"><span className="label">QR Collections</span><span className="val text-blue">LKR {fares.digital.toLocaleString()}</span></div>
                <div className="s-box highlight"><span className="label">Cash to Handover</span><span className="val text-green">LKR {fares.cash.toLocaleString()}</span></div>
             </div>
             <div className="form-actions mt-6">
                <button className="btn-secondary-mobile glass-btn" onClick={() => setShowSettlement(false)}>Cancel</button>
                <button className="btn-success-mobile" onClick={() => { alert('Shift Settled!'); window.location.reload(); }}>Confirm Handover</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

const globalStyles = `
  .mobile-app-wrapper { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999; display: flex; flex-direction: column; overflow: hidden; font-family: 'Inter', sans-serif; color: #f8fafc; background: linear-gradient(135deg, rgba(2, 6, 23, 1) 0%, rgba(15, 23, 42, 1) 100%); }
  .fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

  .glass-panel { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4); }
  .glass-panel-inner { background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(56, 189, 248, 0.1); border-radius: 12px; padding: 16px; }
  .glass-btn { background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(56, 189, 248, 0.3); color: #fff; backdrop-filter: blur(8px); transition: all 0.2s; }
  .glass-btn:hover { border-color: rgba(56, 189, 248, 0.8); box-shadow: 0 0 10px rgba(56, 189, 248, 0.2); }
  .glass-input { background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(56, 189, 248, 0.3); color: white; padding: 14px; border-radius: 10px; width: 100%; outline: none; transition: all 0.2s; }
  .glass-input:focus { border-color: rgba(56, 189, 248, 0.8); box-shadow: 0 0 10px rgba(56, 189, 248, 0.2); }
  .glass-input option { background: #0f172a; color: white; }

  .interactive { transition: transform 0.2s, box-shadow 0.2s, background 0.2s; cursor: pointer; }
  .interactive:active { transform: scale(0.96); }

  .text-gradient { background: linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .text-green { color: #10b981 !important; }
  .text-blue { color: #38bdf8 !important; }
  .mt-2 { margin-top: 8px; }
  .mt-4 { margin-top: 16px; }
  .mt-6 { margin-top: 24px; }
  .mb-2 { margin-bottom: 8px; }
  .mb-4 { margin-bottom: 16px; }
  .mb-6 { margin-bottom: 24px; }
  .font-bold { font-weight: bold; }

  /* Start Shift Screen */
  .start-shift-card { max-width: 400px; width: 100%; margin: 0 auto; padding: 32px 24px; text-align: center; }
  .icon-badge-large { display: inline-flex; padding: 20px; border-radius: 50%; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); margin-bottom: 16px; box-shadow: 0 0 40px rgba(56, 189, 248, 0.15); }
  .start-shift-card h2 { font-size: 24px; font-weight: 800; margin-bottom: 8px; }
  .start-shift-card p { font-size: 14px; color: rgba(255,255,255,0.6); margin-bottom: 32px; }
  .form-group { margin-bottom: 20px; text-align: left; }
  .form-group label { display: block; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.8); margin-bottom: 8px; }

  /* Top Header Area */
  .top-header { padding: 32px 20px 20px; }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
  .greeting { font-size: 22px; font-weight: 800; margin: 0 0 4px 0; letter-spacing: -0.02em; }
  .subtitle { font-size: 14px; color: rgba(255,255,255,0.6); margin: 0; font-family: monospace; font-weight: bold; }
  .header-icons { display: flex; gap: 12px; }
  .icon-btn { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }

  /* Main Conductor Card */
  .main-card { background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(12px); border: 1px solid rgba(56, 189, 248, 0.3); color: white; border-radius: 20px; padding: 24px; box-shadow: 0 12px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(56, 189, 248, 0.05); }
  .float-anim { animation: floatBob 6s ease-in-out infinite; }
  @keyframes floatBob { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
  .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
  .logo-box { background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); }
  .logo-text { color: #38bdf8; font-weight: 900; font-style: italic; font-size: 10px; line-height: 1; letter-spacing: 1px; }
  .status-badge { background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.5); color: #34d399; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
  .dot { width: 6px; height: 6px; background: #34d399; border-radius: 50%; box-shadow: 0 0 8px #34d399; }
  .card-info h3 { font-size: 16px; font-weight: 600; color: white; margin: 0 0 4px; }
  .id-text { font-size: 13px; color: #94a3b8; margin: 0; font-family: monospace; }
  .balances-grid { margin-top: 16px; }
  .balance-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 4px; }
  .balance-amount { font-size: 22px; font-weight: 800; color: #fff; }
  .eye-icon { color: rgba(56,189,248,0.8); background: rgba(56,189,248,0.1); padding: 4px; border-radius: 6px; width: 26px; height: 26px; }
  .qr-container { background: rgba(255,255,255,0.9); padding: 8px; border-radius: 12px; box-shadow: 0 0 15px rgba(56, 189, 248, 0.2); }

  /* Body Content */
  .body-content { flex: 1; padding: 20px 20px 100px; overflow-y: auto; }
  .quick-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
  .action-card { padding: 16px 8px; text-align: center; }
  .action-card:hover { background: rgba(56, 189, 248, 0.1); border-color: rgba(56, 189, 248, 0.4); box-shadow: 0 0 15px rgba(56, 189, 248, 0.1); }
  .icon-wrapper { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(56, 189, 248, 0.2); }
  .action-card h4 { font-size: 12px; font-weight: 600; margin: 0; color: #fff; }
  .section-title { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px; }
  .empty-state-card { padding: 40px 20px; text-align: center; }
  .empty-state-card svg { margin: 0 auto 16px; color: rgba(56, 189, 248, 0.5); }
  .empty-state-card h4 { font-size: 16px; font-weight: 600; color: #fff; margin: 0 0 6px; }
  .empty-text { font-size: 14px; color: rgba(255,255,255,0.5); font-weight: 500; margin: 0; }

  /* Views */
  .home-view { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .scan-view, .issue-view, .history-view { padding: 32px 20px 120px; flex: 1; overflow-y: auto; }
  .view-header { margin-bottom: 24px; }
  .view-header h2 { font-size: 26px; font-weight: 800; color: #fff; margin: 0 0 6px; }
  .view-header p { font-size: 14px; color: rgba(255,255,255,0.6); margin: 0; font-family: monospace; font-weight: bold; }

  .scanner-container { padding: 16px; }
  .qr-reader-custom { border: none !important; border-radius: 12px; overflow: hidden; background: rgba(0,0,0,0.4); }
  #qr-reader__status_span { display: none !important; }
  #qr-reader video { object-fit: cover; border-radius: 12px; }
  #qr-reader__dashboard_section_csr span { color: rgba(255,255,255,0.8) !important; font-size: 13px; }
  #qr-reader__dashboard_section_csr button { background: rgba(56, 189, 248, 0.1) !important; border: 1px solid rgba(56, 189, 248, 0.3) !important; color: white !important; padding: 8px 16px !important; border-radius: 8px !important; font-weight: 600 !important; cursor: pointer !important; margin: 10px 4px !important; transition: background 0.2s !important; }
  #qr-reader__dashboard_section_csr a { color: #38bdf8 !important; text-decoration: none !important; }
  #qr-reader select { background: rgba(15,23,42,0.8) !important; color: white !important; border: 1px solid rgba(56, 189, 248, 0.3) !important; padding: 8px !important; border-radius: 8px !important; outline: none !important; }
  
  .manual-test-box { margin-top: 20px; text-align: center; }
  .btn-test { padding: 12px; border-radius: 8px; font-size: 13px; font-weight: 600; width: 100%; border: 1px dashed rgba(56, 189, 248, 0.3); color: rgba(56, 189, 248, 0.8); }

  .btn-primary-mobile { background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); color: white; border: none; padding: 16px; border-radius: 12px; font-size: 16px; font-weight: 700; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 8px 20px rgba(14, 165, 233, 0.3); transition: all 0.2s; }
  .btn-primary-mobile:hover { box-shadow: 0 8px 25px rgba(14, 165, 233, 0.5); transform: translateY(-1px); }
  .btn-secondary-mobile { padding: 16px; border-radius: 12px; font-size: 16px; font-weight: 600; width: 100%; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(56, 189, 248, 0.3); color: #fff; }
  .btn-success-mobile { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; padding: 16px; border-radius: 12px; font-size: 16px; font-weight: 700; width: 100%; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3); transition: all 0.2s; }

  .status-box { text-align: center; padding: 30px 10px; }
  .glow-circle { width: 100px; height: 100px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
  .green-glow { background: rgba(16,185,129,0.1); box-shadow: 0 0 30px rgba(16,185,129,0.2); }
  .red-glow { background: rgba(239,68,68,0.1); box-shadow: 0 0 30px rgba(239,68,68,0.2); }
  .text-success { color: #34d399; font-size: 28px; font-weight: 800; }
  .text-error { color: #f87171; font-size: 28px; font-weight: 800; }
  .ticket-details { text-align: left; margin-bottom: 32px; }
  .detail-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .detail-row .label { font-size: 12px; color: rgba(255,255,255,0.5); font-weight: 600; text-transform: uppercase; }
  .detail-row .val { font-size: 15px; font-weight: 700; color: #fff; text-align: right; }
  .text-accent { color: #38bdf8 !important; font-size: 18px !important; }

  /* Issue Form */
  .issue-form-card { padding: 24px; }
  .pax-selector { display: flex; align-items: center; justify-content: space-between; padding: 6px; }
  .pax-selector button { width: 44px; height: 44px; border-radius: 8px; font-size: 22px; font-weight: 600; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; }
  .pax-selector span { font-size: 20px; font-weight: 800; }
  .fare-calc { display: flex; justify-content: space-between; align-items: center; margin-top: 24px; }
  .fare-calc span { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.8); }
  .fare-calc .amount { font-size: 24px; font-weight: 800; color: #38bdf8; }

  .qr-payment-screen { text-align: center; }
  .qr-payment-screen h3 { font-size: 22px; font-weight: 800; margin: 0 0 6px; }
  .qr-payment-screen p { font-size: 14px; color: rgba(255,255,255,0.6); margin: 0 0 32px; }
  .qr-display-box { display: inline-block; margin-bottom: 24px; background: #fff; padding: 16px; border-radius: 16px; box-shadow: 0 0 20px rgba(56, 189, 248, 0.3); }
  .payment-amount { font-size: 32px; margin: 0 0 32px; color: #38bdf8; font-weight: 800; }

  /* Manifest & Seat Map */
  .toggle-btn { background: transparent; border: 1px solid rgba(56, 189, 248, 0.2); color: rgba(255,255,255,0.5); padding: 6px 12px; border-radius: 8px; cursor: pointer; transition: 0.2s; }
  .toggle-btn.active { background: rgba(56, 189, 248, 0.1); border-color: rgba(56, 189, 248, 0.5); color: #38bdf8; }
  .manifest-list { display: flex; flex-direction: column; gap: 12px; }
  .manifest-item { padding: 16px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(56, 189, 248, 0.1); border-radius: 12px; background: rgba(15, 23, 42, 0.5); }
  .item-left { display: flex; align-items: center; gap: 14px; }
  .icon-badge { background: rgba(56, 189, 248, 0.1); padding: 8px; border-radius: 50%; color: #38bdf8; }
  .item-left h4 { margin: 0 0 4px 0; font-size: 15px; font-weight: 700; color: #fff; }
  .item-left p { margin: 0; font-size: 12px; color: rgba(255,255,255,0.5); }
  .item-right { text-align: right; }
  .seats { display: block; font-size: 15px; font-weight: 800; color: #38bdf8; margin-bottom: 4px; }
  .time { display: block; font-size: 11px; color: rgba(255,255,255,0.4); }
  
  .seat-map-container { padding: 24px; display: flex; flex-direction: column; align-items: center; }
  .bus-front { border: 1px solid rgba(56, 189, 248, 0.3); padding: 8px 32px; border-radius: 8px; font-size: 12px; font-weight: 700; margin-bottom: 24px; letter-spacing: 2px; text-transform: uppercase; color: #38bdf8; background: rgba(56, 189, 248, 0.05); }
  .seat-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; width: 100%; max-width: 260px; margin-bottom: 24px; }
  .seat-grid > :nth-child(5n+3) { visibility: hidden; }
  .seat { padding: 12px 0; text-align: center; border-radius: 8px; font-size: 12px; font-weight: 700; color: white; transition: 0.3s; }
  .seat.available { background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16,185,129,0.5); color: #34d399; }
  .seat.booked { background: rgba(239, 68, 68, 0.8); border: 1px solid #ef4444; color: #fff; box-shadow: 0 0 10px rgba(239,68,68,0.5); }
  .seat-legend { display: flex; gap: 24px; }
  .legend-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: rgba(255,255,255,0.7); }
  .legend-item .box { width: 16px; height: 16px; border-radius: 4px; }

  /* Modals (Settlement & Print) */
  .settlement-overlay, .print-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .settlement-modal, .print-modal { width: 100%; max-width: 400px; padding: 32px 24px; text-align: center; }
  .settlement-modal h2 { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
  .settlement-modal p { font-size: 14px; color: rgba(255,255,255,0.6); font-family: monospace; }
  .settlement-grid { display: flex; flex-direction: column; gap: 12px; }
  .s-box { display: flex; justify-content: space-between; padding: 16px; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(56, 189, 248, 0.15); border-radius: 12px; }
  .s-box.highlight { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.4); }
  .s-box .label { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.8); }
  .s-box .val { font-size: 16px; font-weight: 800; }
  .form-actions { display: flex; gap: 16px; }

  .print-modal h2 { font-size: 24px; font-weight: 800; margin-bottom: 8px; }
  .print-modal p { font-size: 14px; color: rgba(255,255,255,0.6); margin-bottom: 24px; }
  .mock-receipt { background: #fff; color: #000; padding: 24px; border-radius: 8px; font-family: monospace; margin-bottom: 24px; border-top: 4px dashed #ccc; border-bottom: 4px dashed #ccc; }
  .mock-receipt p { color: #000; margin: 4px 0; font-size: 18px; }
  
  /* Bottom Nav */
  .bottom-nav-pill { position: fixed; bottom: 24px; left: 24px; right: 24px; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(24px); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 40px; display: flex; justify-content: space-around; align-items: center; padding: 8px; z-index: 1000; box-shadow: 0 10px 40px rgba(0,0,0,0.6), inset 0 0 15px rgba(56, 189, 248, 0.05); }
  .nav-item { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; background: transparent; border: none; cursor: pointer; color: rgba(255,255,255,0.4); font-size: 10px; font-weight: 600; padding: 10px 16px; border-radius: 30px; transition: 0.3s; }
  .nav-item.active { color: #fff; background: rgba(56, 189, 248, 0.1); box-shadow: inset 0 0 10px rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.2); }
  .nav-item.active svg { transform: scale(1.1); color: #38bdf8; }

  /* Print Styles for Real Receipt */
  @media print {
    body * { visibility: hidden; }
    .print-receipt-section, .print-receipt-section * { visibility: visible; }
    .print-receipt-section { position: absolute; left: 0; top: 0; width: 58mm; margin: 0; padding: 0; font-family: 'Courier New', monospace; color: #000; background: #fff; }
    .receipt-content { padding: 10mm 5mm; text-align: center; }
    .receipt-content h3 { font-size: 18px; margin: 0 0 4px; }
    .receipt-content p { font-size: 12px; margin: 2px 0; }
    .receipt-content .divider { border-top: 1px dashed #000; margin: 8px 0; }
    .receipt-content h2 { font-size: 20px; font-weight: bold; margin: 8px 0; }
    .ticket-id { font-size: 14px; font-weight: bold; }
    .footer-text { font-size: 10px; margin-top: 12px; }
  }
`;
