'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Map, Calendar, ShieldCheck, Zap, ArrowRight, Compass, Shield, Users, Clock, Award } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

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
      <Navbar />

      {/* Hero Section */}
      <header className="hero-section" style={{ minHeight: '90vh' }}>
        <div className="hero-content fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div>
            <div className="badge-pill" style={{ marginBottom: '16px' }}>Premium Logistics & Passenger Transport</div>
            <h1 className="hero-title" style={{ fontSize: '3.5rem', lineHeight: '1.2' }}>
              Sri Lanka&apos;s Best Public Transport, <br/>
              Only with <span className="text-gradient">Ascendia Transports</span>
            </h1>
            <p className="hero-subtitle" style={{ maxWidth: '700px', margin: '0 auto', fontSize: '1.1rem' }}>
              Experience next-generation logistics and passenger mobility. Book your tickets online instantly and travel with Ascendia&apos;s modern fleet.
            </p>
          </div>

          <div className="hero-actions" style={{ justifyContent: 'center' }}>
            {/* Booking Widget */}
            <div className="booking-widget glass-panel" style={{ width: '100%', maxWidth: '900px' }}>
              <form onSubmit={handleSearchRoutes} className="widget-form" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
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
                  <h4 className="results-title text-left mb-2">Available Routes</h4>
                  {searchResults.length === 0 ? (
                    <p className="no-results text-left">No routes found for your selection.</p>
                  ) : (
                    <div className="route-list">
                      {searchResults.slice(0, 3).map(trip => (
                        <div key={trip.id} className="route-card glass-panel-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px' }}>
                          <div className="route-info text-left">
                            <strong>{trip.pickup.split(',')[0]} ➜ {trip.destination.split(',')[0]}</strong>
                            <p className="text-sm opacity-70">ETA: {trip.eta}</p>
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

      {/* Vision & Mission Section */}
      <section className="info-section" style={{ padding: '80px 20px', background: 'rgba(0,0,0,0.3)' }}>
        <div className="container mx-auto max-w-6xl text-center fade-in-up">
          <h2 className="text-3xl font-bold mb-4">Our Vision and Mission</h2>
          <h3 className="text-xl text-gradient mb-6">Connecting People, Transforming Journeys.</h3>
          <p className="text-lg opacity-80 max-w-4xl mx-auto leading-relaxed">
            At Ascendia Transports, our mission is to provide exceptional passenger service, focusing on luxury long-distance travel, safe commuter services, and versatile vehicle rentals, all with a commitment to enhancing lives and fostering thriving communities. We are dedicated to revolutionising the transportation experience for our passengers, emphasising safety, comfort, and sustainability.
          </p>
          <div className="mt-8 font-medium text-xl">
            ASCENDIA TRANSPORTS - Elevating Travel with Comfort, Safety, and Punctuality.
          </div>
        </div>
      </section>

      {/* Company Profile & Features */}
      <section className="features-section" style={{ paddingTop: '80px' }}>
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Company Profile</h2>
            <p className="opacity-80 max-w-3xl mx-auto">
              Ascendia Transports is one of the largest and most trusted transport providers in Sri Lanka. With a modern fleet categorized into super luxury, semi-luxury, and normal buses, we have been serving the transportation needs of our customers seamlessly.
            </p>
          </div>
          <div className="features-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
            <div className="feature-card glass-panel hover-glow text-center p-6">
              <div className="icon-wrapper mx-auto mb-4" style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)' }}>
                <Shield size={32} color="#10b981" />
              </div>
              <h3 className="text-lg font-bold mb-2">Secure Payments</h3>
              <p className="text-sm opacity-70">Secure payment options for your peace of mind when booking online.</p>
            </div>
            <div className="feature-card glass-panel hover-glow text-center p-6">
              <div className="icon-wrapper mx-auto mb-4" style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(167,139,250,0.1)' }}>
                <Users size={32} color="#a78bfa" />
              </div>
              <h3 className="text-lg font-bold mb-2">Trained Drivers</h3>
              <p className="text-sm opacity-70">Highly trained drivers with excellent safety records and professionalism.</p>
            </div>
            <div className="feature-card glass-panel hover-glow text-center p-6">
              <div className="icon-wrapper mx-auto mb-4" style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(96,165,250,0.1)' }}>
                <Clock size={32} color="#60a5fa" />
              </div>
              <h3 className="text-lg font-bold mb-2">Punctuality</h3>
              <p className="text-sm opacity-70">Timely departures and arrivals to ensure you reach your destination on time.</p>
            </div>
            <div className="feature-card glass-panel hover-glow text-center p-6">
              <div className="icon-wrapper mx-auto mb-4" style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(244,114,182,0.1)' }}>
                <Award size={32} color="#f472b6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Safety First</h3>
              <p className="text-sm opacity-70">Your safety is our priority. We adhere to strict safety protocols and regulations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Destinations */}
      <section className="destinations-section" style={{ padding: '80px 20px' }}>
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Our Destinations</h2>
              <p className="opacity-80">Explore our comprehensive network of scheduled routes.</p>
            </div>
            <button className="btn-secondary hidden-mobile">All Destinations ➤</button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {[
              { route: "Kandy - Colombo", img: "/bus-gallery/Give_like_this_images_for_202605311156.jpeg" },
              { route: "Galle - Matara Local", img: "/bus-gallery/Images_for_ASCENDIA_Transports_2K_202605311120.jpeg" },
              { route: "Kandy - Trincomalee Normal", img: "/bus-gallery/Images_for_ASCENDIA_Transports_2K_202605311121.jpeg" },
              { route: "Colombo - Nuwara Eliya AC", img: "/bus-gallery/Use_like_the_given_bus_202605311136.jpeg" },
              { route: "Colombo - Jaffna Intercity", img: "/bus-gallery/Erase_the_Number_Plate_2K_202605311130.jpeg" },
              { route: "Colombo - Galle Highway", img: "/bus-gallery/Image_names_use_as_Ascendia_202605311153.jpeg" }
            ].map((dest, idx) => (
              <div key={idx} className="glass-panel overflow-hidden" style={{ borderRadius: '16px', padding: 0 }}>
                <div style={{ height: '200px', backgroundImage: `url('${dest.img}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                <div className="p-5 flex flex-col gap-4">
                  <h3 className="text-xl font-bold">{dest.route}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gradient cursor-pointer hover:opacity-80">More Details</span>
                    <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }} onClick={() => router.push('/login')}>BOOK NOW</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety & Comfort Block */}
      <section className="safety-section" style={{ background: 'linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.9)), url("/bus-gallery/Screenshot 2026-05-31 121522.png") center/cover', padding: '100px 20px', textAlign: 'center' }}>
        <div className="container mx-auto max-w-4xl fade-in-up glass-panel" style={{ padding: '40px', background: 'rgba(0,0,0,0.6)' }}>
          <ShieldCheck size={48} color="#10b981" className="mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Safety and comfort are our top priorities.</h2>
          <p className="text-lg opacity-90 leading-relaxed mb-8">
            We take stringent measures to ensure the safety of our passengers, including regular maintenance and inspections of our buses, adherence to traffic rules, and continuous training of our drivers. We also strive to provide a comfortable traveling experience by maintaining clean buses and offering professional customer service.
          </p>
          <button className="btn-primary interactive mx-auto">Discover More</button>
        </div>
      </section>

      {/* Booking App CTA */}
      <section className="cta-section" style={{ padding: '80px 20px', background: 'rgba(0,0,0,0.4)' }}>
        <div className="container mx-auto max-w-5xl flex flex-col md:flex-row items-center gap-10">
          <div className="md:w-1/2">
            <img src="/bus-gallery/Screenshot 2026-05-31 121246.png" alt="Booking App" style={{ width: '100%', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }} />
          </div>
          <div className="md:w-1/2">
            <div className="badge-pill mb-4">Book Online Instantly</div>
            <h2 className="text-3xl font-bold mb-6">It’s never been easier to book your journey online!</h2>
            <ul className="flex flex-col gap-4 mb-8">
              <li className="flex items-start gap-3">
                <span className="text-gradient font-bold mt-1">1.</span>
                <p>Choose your pickup, destination, and journey date to see available buses.</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gradient font-bold mt-1">2.</span>
                <p>Choose the best ticket and instantly reserve your seat from the comfort of your home.</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gradient font-bold mt-1">3.</span>
                <p>Pay for your tickets securely using your E-Wallet and generate digital QR tickets.</p>
              </li>
            </ul>
            <button className="btn-primary" style={{ padding: '12px 24px', fontSize: '1.1rem' }} onClick={() => router.push('/login')}>Visit Passenger Portal</button>
          </div>
        </div>
      </section>

      {/* Fleet Showcase Section */}
      {fleet.length > 0 && (
        <section className="fleet-section" style={{ padding: '80px 20px' }}>
          <div className="section-header fade-in-up text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">Our Premium Fleet</h2>
            <p className="opacity-80">Travel in ultimate comfort with our meticulously maintained vehicles.</p>
          </div>
          <div className="fleet-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            {fleet.map((vehicle, idx) => {
              const bgImages = [
                '/bus-gallery/Erase_the_Number_Plate_2K_202605311130.jpeg',
                '/bus-gallery/Give_like_this_images_for_202605311200.jpeg',
                '/bus-gallery/Images_for_ASCENDIA_Transports_2K_202605311121.jpeg'
              ];
              const bgImage = bgImages[idx % bgImages.length];
              
              return (
                <div key={vehicle.id} className="fleet-card glass-panel hover-glow overflow-hidden p-0">
                  <div className="fleet-image" style={{ background: `url('${bgImage}') center/cover`, height: '200px' }}></div>
                  <div className="fleet-details p-5">
                    <h3 className="text-xl font-bold mb-1">{vehicle.brand} {vehicle.model}</h3>
                    <p className="opacity-80">{vehicle.capacity}-Seater • {vehicle.type}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Live Tracking Section */}
      <section className="tracking-section" style={{ padding: '60px 20px', background: 'rgba(0,0,0,0.5)' }}>
        <div className="tracking-container glass-panel fade-in-up mx-auto max-w-3xl text-center p-8">
          <h2 className="text-2xl font-bold mb-2">Track Your Journey</h2>
          <p className="opacity-80">Enter your tracking number or ticket ID to see live status.</p>
          <form onSubmit={handleTrack} className="track-form mt-6 flex justify-center gap-2">
            <input 
              type="text" 
              placeholder="e.g. TRIP-2026-1002" 
              className="glass-input-lg"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              style={{ width: '60%', maxWidth: '400px' }}
            />
            <button type="submit" className="btn-primary interactive flex items-center gap-2">Track <ArrowRight size={18} /></button>
          </form>

          {trackedTrip && (
            <div className="tracked-result glass-panel-inner mt-6 fade-in-up text-left p-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-3">
                <strong className="text-lg">{trackedTrip.trackingNumber}</strong>
                <span className="badge-active bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm">{trackedTrip.status}</span>
              </div>
              <p className="mt-2 text-lg">📍 {trackedTrip.pickup} ➜ {trackedTrip.destination}</p>
              <p className="mt-3 text-green-400 font-medium">Expected Time of Arrival: <strong>{trackedTrip.eta}</strong></p>
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section" style={{ padding: '80px 20px' }}>
        <div className="section-header fade-in-up text-center mb-10">
          <h2 className="text-3xl font-bold mb-2">Frequently Asked Questions</h2>
          <p className="opacity-80">Everything you need to know about traveling with Ascendia.</p>
        </div>
        <div className="faq-container mx-auto max-w-4xl flex flex-col gap-4">
          {[
            { q: "How does the E-Wallet work?", a: "You can load funds directly into your Ascendia E-Wallet via our secure portal. When booking a ticket, simply select E-Wallet at checkout for instant confirmation." },
            { q: "What is your luggage policy?", a: "Standard class passengers are allowed 20kg of checked luggage and one small carry-on bag. Express VIP passengers receive an upgraded 35kg allowance." },
            { q: "Can I track my bus if I didn't book the ticket?", a: "Yes! If a family member shares their unique tracking ID with you, you can enter it in the tracker above to view the live location." },
            { q: "How do I cancel or reschedule my trip?", a: "You can cancel or reschedule any trip directly from your Customer Portal up to 4 hours before the departure time without penalty. Refunds are credited back to your E-Wallet." }
          ].map((faq, idx) => (
            <div key={idx} className={`faq-item glass-panel cursor-pointer ${activeFaq === idx ? 'active border-primary/50' : ''}`} onClick={() => setActiveFaq(activeFaq === idx ? null : idx)} style={{ padding: '20px', transition: 'all 0.3s ease' }}>
              <div className="faq-question flex justify-between items-center">
                <strong className="text-lg">{faq.q}</strong>
                <span className="faq-icon text-2xl text-gradient">{activeFaq === idx ? '−' : '+'}</span>
              </div>
              {activeFaq === idx && <div className="faq-answer mt-4 opacity-80 leading-relaxed"><p>{faq.a}</p></div>}
            </div>
          ))}
        </div>
      </section>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
