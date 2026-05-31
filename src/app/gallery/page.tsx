'use client';
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function GalleryPage() {
  const images = [
    '/bus-gallery/Erase_the_Number_Plate_2K_202605311130.jpeg',
    '/bus-gallery/Give_like_this_images_for_202605311156.jpeg',
    '/bus-gallery/Give_like_this_images_for_202605311200.jpeg',
    '/bus-gallery/Image_names_use_as_Ascendia_202605311153.jpeg',
    '/bus-gallery/Images_for_ASCENDIA_Transports_2K_202605311120.jpeg',
    '/bus-gallery/Images_for_ASCENDIA_Transports_2K_202605311121.jpeg',
    '/bus-gallery/Screenshot 2026-05-31 121246.png',
    '/bus-gallery/Screenshot 2026-05-31 121317.png',
    '/bus-gallery/Screenshot 2026-05-31 121416.png',
    '/bus-gallery/Screenshot 2026-05-31 121522.png',
    '/bus-gallery/Screenshot 2026-05-31 122636.png',
    '/bus-gallery/Screenshot 2026-05-31 122717.png',
    '/bus-gallery/Screenshot 2026-05-31 122741.png',
    '/bus-gallery/Screenshot 2026-05-31 122834.png',
    '/bus-gallery/Use_like_the_given_bus_202605311136.jpeg'
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
