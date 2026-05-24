'use client';
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function GalleryPage() {
  const images = [
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1557223562-6c77ef161f16?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?auto=format&fit=crop&q=80&w=800'
  ];

  return (
    <div className="landing-wrapper">
      <Navbar />
      <header className="hero-section" style={{ minHeight: '40vh', padding: '120px 20px 40px' }}>
        <div className="hero-content fade-in-up">
          <div className="badge-pill">Premium Fleet</div>
          <h1 className="hero-title">
            Our <span className="text-gradient">Gallery</span>
          </h1>
        </div>
      </header>
      
      <section style={{ flex: 1, padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {images.map((src, idx) => (
            <div key={idx} className="glass-panel hover-glow" style={{ height: '250px', borderRadius: '16px', overflow: 'hidden' }}>
              <img src={src} alt="Fleet" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
