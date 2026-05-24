'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();

  return (
    <nav className="glass-nav">
      <div className="nav-container">
        <Link href="/" className="logo-box">
           <img src="/ascendia_logo.png" alt="Ascendia" />
           <span className="logo-text">ASCENDIA<br/>TRANSPORTS</span>
        </Link>
        
        <div className="main-nav hidden-mobile">
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/services" className="nav-link">Services</Link>
          <Link href="/timetables" className="nav-link">Bus Timetables</Link>
          <Link href="/gallery" className="nav-link">Gallery</Link>
          <Link href="/about" className="nav-link">About us</Link>
          <Link href="/contact" className="nav-link">Contact us</Link>
        </div>

        <div className="nav-links">
          <button className="nav-link" onClick={() => router.push('/login')}>Sign In</button>
          <button className="btn-primary" onClick={() => router.push('/login')}>Book Now</button>
        </div>
      </div>
    </nav>
  );
}
