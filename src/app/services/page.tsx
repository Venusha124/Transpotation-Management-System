'use client';
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Briefcase, Globe, Headset, Bus, Star, ShieldCheck, Wind, Tv, Wifi, BatteryCharging, Package } from 'lucide-react';

export default function ServicesPage() {
  return (
    <div className="landing-wrapper">
      <Navbar />
      
      {/* Hero Header */}
      <header className="hero-section" style={{ minHeight: '40vh', padding: '120px 20px 40px' }}>
        <div className="hero-content fade-in-up" style={{ maxWidth: '900px' }}>
          <div className="badge-pill">What We Do</div>
          <h1 className="hero-title">
            We Provide <span className="text-gradient">Best Services</span> For You
          </h1>
          <p className="hero-subtitle">
            We offer a range of services to cater to the transportation needs of our customers. Our services include:
          </p>
        </div>
      </header>
      
      {/* Services Grid (Luggage, Online Booking, Customer Support) */}
      <section className="features-section" style={{ padding: '20px 20px 60px' }}>
        <div className="features-container">
          <div className="feature-card glass-panel hover-glow fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="icon-wrapper"><Briefcase size={28} color="#f59e0b" /></div>
            <h3>Luggage Service</h3>
            <p>We offer luggage services for our passengers, providing a secure and convenient option for transporting their belongings.</p>
          </div>
          <div className="feature-card glass-panel hover-glow fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="icon-wrapper"><Globe size={28} color="#3b82f6" /></div>
            <h3>Online Booking</h3>
            <p>We have user-friendly websites and mobile apps that allow passengers to book tickets or charter services online.</p>
          </div>
          <div className="feature-card glass-panel hover-glow fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="icon-wrapper"><Headset size={28} color="#10b981" /></div>
            <h3>Customer Support</h3>
            <p>Our customer support teams can assist passengers with inquiries, ticket changes, and other concerns.</p>
          </div>
        </div>
      </section>

      {/* Detailed Sections (Public Transport, Special Hires) */}
      <section style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '40px' }}>
        
        {/* Public Transport */}
        <div className="glass-panel hover-glow fade-in-up" style={{ padding: '40px', display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 300px' }}>
            <div className="icon-wrapper" style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <Bus size={32} color="#3b82f6" />
            </div>
            <h2 style={{ fontSize: '32px', marginBottom: '16px' }}>Public Transport</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.8', textAlign: 'justify' }}>
              Our public transport services are meticulously designed to meet the diverse needs of daily commuters, offering a comprehensive, efficient, and user-friendly network of bus routes. We are committed to providing a seamless and reliable transportation experience, placing a strong emphasis on punctuality, safety, and affordability. 
              <br/><br/>
              Our extensive bus services encompass a wide range of routes, connecting key residential, commercial, and industrial areas. This expansive network ensures that commuters have convenient and accessible transportation to various destinations within the city and its surrounding areas. We continually strive to enhance our services to better serve our community. For more information or assistance, please do not hesitate to contact us.
            </p>
          </div>
        </div>

        {/* Special Hires */}
        <div className="glass-panel hover-glow fade-in-up" style={{ padding: '40px', display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 300px' }}>
            <div className="icon-wrapper" style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <Star size={32} color="#8b5cf6" />
            </div>
            <h2 style={{ fontSize: '32px', marginBottom: '16px' }}>Special Hires</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.8', textAlign: 'justify' }}>
              Our bus special hire services offer a variety of options to suit different needs and preferences, including semi luxury, luxury, and super luxury types. Whether you're planning a corporate event, a group outing, or a special occasion, we have buses with various seating capacities to accommodate your group size comfortably.
              <br/><br/>
              Our semi-luxury buses provide a blend of comfort and affordability, while our luxury buses offer enhanced features for a more refined travel experience. For those seeking the ultimate in comfort and style, our super luxury buses are equipped with top-of-the-line amenities. To learn more about our special hire services or to make a booking, please contact us.
            </p>
          </div>
        </div>

      </section>

      {/* Amenities */}
      <section style={{ padding: '60px 20px', background: 'rgba(15, 23, 42, 0.8)', marginTop: '40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '36px', marginBottom: '16px' }}>Amenities in our luxury buses</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '800px', margin: '0 auto 48px', lineHeight: '1.6' }}>
            Our buses are equipped with state-of-the-art features to ensure a safe and comfortable traveling experience for our passengers. Some of the key features of our buses include CCTV cameras for passenger safety, experienced drivers, and comfortable seating arrangements.
          </p>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
            {[
              { icon: <ShieldCheck size={24}/>, title: "CCTV Cameras" },
              { icon: <Wind size={24}/>, title: "Fully Air-Conditioned" },
              { icon: <Package size={24}/>, title: "Significant Undercarriage Storage" },
              { icon: <Tv size={24}/>, title: "TV Entertainment" },
              { icon: <Wifi size={24}/>, title: "High Speed Internet Facility" },
              { icon: <Briefcase size={24}/>, title: "Cool Box" },
              { icon: <BatteryCharging size={24}/>, title: "Reclining Seats with USB Charging" }
            ].map((amenity, idx) => (
              <div key={idx} className="glass-panel hover-glow" style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '12px' }}>
                <span style={{ color: '#60a5fa' }}>{amenity.icon}</span>
                <span style={{ fontWeight: '600' }}>{amenity.title}</span>
              </div>
            ))}
          </div>

          <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '48px', fontSize: '18px', fontStyle: 'italic' }}>
            "Our comprehensive attention to detail assures you a smooth and hassle-free traveling experience."
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
