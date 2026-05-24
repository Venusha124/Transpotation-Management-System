'use client';
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AboutPage() {
  return (
    <div className="landing-wrapper">
      <Navbar />
      <header className="hero-section" style={{ minHeight: '30vh', padding: '100px 20px 0px' }}>
        <div className="hero-content fade-in-up">
          <div className="badge-pill">The Ascendia Story</div>
        </div>
      </header>
      
      <section style={{ flex: 1, padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', gap: '60px', alignItems: 'center', flexWrap: 'wrap' }}>
        
        {/* Left Side: Text */}
        <div style={{ flex: '1 1 500px', lineHeight: '1.8' }} className="fade-in-up">
          <h2 style={{ fontSize: '42px', color: '#60a5fa', marginBottom: '24px', fontWeight: '400' }}>Who we are</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '16px', textAlign: 'justify' }}>
            Founded in 2026 by <strong>Mr. Venusha Weerasinghe</strong>, Ascendia Transports has emerged 
            as a leading people mobility company in Sri Lanka, initially starting with a single bus on the 
            Colombo – Kandy route. Over the years, the company has evolved into a trailblazer within the 
            travel industry, now boasting a comprehensive fleet that includes Super luxury coaches, luxury 
            coaches, and non-AC passenger buses.
          </p>
          <br/>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '16px', textAlign: 'justify' }}>
            Under Mr. Weerasinghe's visionary leadership, Ascendia Transports is committed to delivering 
            top-notch Public Bus Services, setting new standards for reliability and innovation in the 
            transportation sector. From its humble beginnings, the company has transformed into a symbol 
            of excellence, consistently prioritizing customer satisfaction and providing a diverse range of 
            high-quality mobility solutions to the people of Sri Lanka.
          </p>
        </div>

        {/* Right Side: Image with offset block */}
        <div style={{ flex: '1 1 400px', position: 'relative', padding: '20px' }} className="fade-in-up">
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            bottom: '40px', 
            left: 0, 
            right: '40px', 
            background: '#1d4ed8', 
            zIndex: 1,
            borderRadius: '4px'
          }}></div>
          <img 
            src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800" 
            alt="Ascendia Fleet" 
            style={{ 
              position: 'relative', 
              zIndex: 2, 
              width: '100%', 
              height: 'auto', 
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              transform: 'translate(20px, 20px)',
              borderRadius: '4px'
            }} 
          />
        </div>

      </section>

      <Footer />
    </div>
  );
}
