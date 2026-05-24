'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Map, Calendar, ShieldCheck, Zap, ArrowRight, Compass } from 'lucide-react';

interface Trip {
  id: string;
  trackingNumber: string;
  pickup: string;
  destination: string;
  status: string;
  eta: string;
}

export default function LandingPage() {
  const router = useRouter();
  
  const [trips, setTrips] = useState<Trip[]>([]);
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [date, setDate] = useState('');
  const [searchResults, setSearchResults] = useState<Trip[] | null>(null);
  
  const [trackingId, setTrackingId] = useState('');
  const [trackedTrip, setTrackedTrip] = useState<Trip | null>(null);
  
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  
  const [fleet, setFleet] = useState<any[]>([]);

  useEffect(() => {
    // Fetch available trips to populate dropdowns or initial data
    fetch('/api/trips')
      .then(res => res.json())
      .then(data => {
        if (data.trips) setTrips(data.trips.filter((t: Trip) => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS'));
      })
      .catch(console.error);
      
    // Fetch top reviews
    fetch('/api/reviews')
      .then(res => res.json())
      .then(data => {
        if (data.reviews) setReviews(data.reviews);
      })
      .catch(console.error);
      
    // Fetch fleet (Buses)
    fetch('/api/vehicles')
      .then(res => res.json())
      .then(data => {
        if (data.vehicles) {
          const buses = data.vehicles.filter((v: any) => v.type.toLowerCase().includes('bus') || v.type.toLowerCase() === 'passenger coach' || v.type.toLowerCase() === 'double decker' || v.capacity > 15);
          setFleet(buses.slice(0, 3));
        }
      })
      .catch(console.error);
  }, []);

  const handleSearchRoutes = (e: React.FormEvent) => {
    e.preventDefault();
    const results = trips.filter(t => 
      (!searchFrom || t.pickup.toLowerCase().includes(searchFrom.toLowerCase())) &&
      (!searchTo || t.destination.toLowerCase().includes(searchTo.toLowerCase()))
    );
    setSearchResults(results);
  };

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId) return;
    const found = trips.find(t => t.trackingNumber.toLowerCase() === trackingId.trim().toLowerCase());
    setTrackedTrip(found || null);
  };

  const uniquePickups = Array.from(new Set(trips.map(t => t.pickup.split(',')[0])));
  const uniqueDestinations = Array.from(new Set(trips.map(t => t.destination.split(',')[0])));

  return (
    <div className="landing-wrapper">
      {/* Navbar */}
      <nav className="glass-nav">
        <div className="nav-container">
          <div className="logo-box">
             <img src="/ascendia_logo.png" alt="Ascendia" />
             <span className="logo-text">ASCENDIA<br/>TRANSPORTS</span>
          </div>
          <div className="nav-links">
            <button className="nav-link" onClick={() => router.push('/login')}>Sign In</button>
            <button className="btn-primary" onClick={() => router.push('/login')}>Book Now</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-content fade-in-up">
          <div className="badge-pill">Premium Logistics & Passenger Transport</div>
          <h1 className="hero-title">
            The Future of <br/> <span className="text-gradient">Travel & Transport</span>
          </h1>
          <p className="hero-subtitle">
            Experience next-generation logistics. From express passenger routes to secured freight, travel with Ascendia's modern fleet.
          </p>

          <div className="hero-actions">
            {/* Booking Widget */}
            <div className="booking-widget glass-panel">
              <form onSubmit={handleSearchRoutes} className="widget-form">
                <div className="input-group">
                  <MapPin className="input-icon" size={18} />
                  <select value={searchFrom} onChange={(e) => setSearchFrom(e.target.value)} className="glass-input-lg">
                    <option value="">Pickup Location</option>
                    {uniquePickups.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <Map className="input-icon" size={18} />
                  <select value={searchTo} onChange={(e) => setSearchTo(e.target.value)} className="glass-input-lg">
                    <option value="">Destination</option>
                    {uniqueDestinations.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <Calendar className="input-icon" size={18} />
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="glass-input-lg" />
                </div>
                <button type="submit" className="btn-primary btn-search interactive">Find Bus</button>
              </form>

              {/* Search Results */}
              {searchResults !== null && (
                <div className="search-results mt-4">
                  <h4 className="results-title">Available Routes</h4>
                  {searchResults.length === 0 ? (
                    <p className="no-results">No routes found for your selection.</p>
                  ) : (
                    <div className="route-list">
                      {searchResults.slice(0, 3).map(trip => (
                        <div key={trip.id} className="route-card glass-panel-inner">
                          <div className="route-info">
                            <strong>{trip.pickup.split(',')[0]} ➜ {trip.destination.split(',')[0]}</strong>
                            <p>ETA: {trip.eta}</p>
                          </div>
                          <button className="btn-success interactive" onClick={() => router.push('/login')}>
                            Book Seat
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="feature-card glass-panel hover-glow">
            <div className="icon-wrapper"><ShieldCheck size={28} color="#10b981" /></div>
            <h3>Secured Logistics</h3>
            <p>Every trip is monitored in real-time with comprehensive passenger and cargo protection.</p>
          </div>
          <div className="feature-card glass-panel hover-glow">
            <div className="icon-wrapper"><Zap size={28} color="#a78bfa" /></div>
            <h3>Express VIP Travel</h3>
            <p>Our modern fleet guarantees comfortable, high-speed travel across intercity routes.</p>
          </div>
          <div className="feature-card glass-panel hover-glow">
            <div className="icon-wrapper"><Compass size={28} color="#60a5fa" /></div>
            <h3>Live GPS Tracking</h3>
            <p>Never miss a bus again. Track your vehicle's live location with our advanced telemetry.</p>
          </div>
        </div>
      </section>

      {/* Fleet Showcase Section */}
      {fleet.length > 0 && (
        <section className="fleet-section">
          <div className="section-header fade-in-up">
            <h2>Our Premium Fleet</h2>
            <p>Travel in ultimate comfort with our meticulously maintained vehicles.</p>
          </div>
          <div className="fleet-container">
            {fleet.map((vehicle, idx) => {
              const bgImages = [
                'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=400',
                'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=400',
                'https://images.unsplash.com/photo-1557223562-6c77ef161f16?auto=format&fit=crop&q=80&w=400'
              ];
              const bgImage = bgImages[idx % bgImages.length];
              
              return (
                <div key={vehicle.id} className="fleet-card glass-panel hover-glow">
                  <div className="fleet-image" style={{ background: `url(${bgImage}) center/cover` }}></div>
                  <div className="fleet-details">
                    <h3>{vehicle.brand} {vehicle.model}</h3>
                    <p>{vehicle.capacity}-Seater • {vehicle.type} • {vehicle.fuelType}</p>
                    <p style={{fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px'}}>Fleet ID: {vehicle.number}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Live Passenger Testimonials */}
      {reviews.length > 0 && (
        <section className="testimonials-section">
          <div className="section-header fade-in-up">
            <h2>Passenger Experiences</h2>
            <p>Don't just take our word for it. Here's what our travelers say.</p>
          </div>
          <div className="testimonials-container">
            {reviews.map((review, idx) => (
              <div key={review.id} className="review-card glass-panel hover-glow" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="review-stars">
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </div>
                <p className="review-text">"{review.feedback}"</p>
                <div className="review-author">
                  <div className="author-avatar">{review.customerName.charAt(0)}</div>
                  <div>
                    <strong>{review.customerName}</strong>
                    <span className="author-route">{review.route}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Live Tracking Section */}
      <section className="tracking-section glass-panel">
        <div className="tracking-container fade-in-up">
          <h2>Track Your Journey</h2>
          <p>Enter your tracking number or ticket ID to see live status.</p>
          <form onSubmit={handleTrack} className="track-form mt-4">
            <input 
              type="text" 
              placeholder="e.g. TRIP-2026-1002" 
              className="glass-input-lg"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
            />
            <button type="submit" className="btn-primary interactive">Track <ArrowRight size={18} /></button>
          </form>

          {trackedTrip && (
            <div className="tracked-result glass-panel-inner mt-6 fade-in-up">
              <div className="flex-between">
                <strong>{trackedTrip.trackingNumber}</strong>
                <span className="badge-active">{trackedTrip.status}</span>
              </div>
              <p className="mt-2">📍 {trackedTrip.pickup} ➜ {trackedTrip.destination}</p>
              <p className="mt-2 text-green">ETA: <strong>{trackedTrip.eta}</strong></p>
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="section-header fade-in-up">
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know about traveling with Ascendia.</p>
        </div>
        <div className="faq-container">
          {[
            { q: "How does the E-Wallet work?", a: "You can load funds directly into your Ascendia E-Wallet via our secure portal. When booking a ticket, simply select E-Wallet at checkout for instant, one-click confirmation." },
            { q: "What is your luggage policy?", a: "Standard class passengers are allowed 20kg of checked luggage and one small carry-on bag. Express VIP passengers receive an upgraded 35kg allowance." },
            { q: "Can I track my bus if I didn't book the ticket?", a: "Yes! If a family member shares their unique tracking ID (e.g. TRIP-2026-1025) with you, you can enter it in the tracker above to view the live location and ETA without an account." },
            { q: "How do I cancel or reschedule my trip?", a: "You can cancel or reschedule any trip directly from your Customer Portal up to 4 hours before the departure time without penalty. Refunds are instantly credited back to your E-Wallet." }
          ].map((faq, idx) => (
            <div key={idx} className={`faq-item glass-panel ${activeFaq === idx ? 'active' : ''}`} onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}>
              <div className="faq-question">
                <strong>{faq.q}</strong>
                <span className="faq-icon">{activeFaq === idx ? '−' : '+'}</span>
              </div>
              {activeFaq === idx && <div className="faq-answer"><p>{faq.a}</p></div>}
            </div>
          ))}
        </div>
      </section>
      
      {/* Footer */}
      <footer className="footer">
        <p>© 2026 Ascendia Transports. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
