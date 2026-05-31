import React from 'react';
import Link from 'next/link';
import { MapPin, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer" style={{ background: 'rgba(0,0,0,0.8)', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '60px', paddingBottom: '30px' }}>
      <div className="container mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
          
          {/* Column 1: Brand & Socials */}
          <div>
            <Link href="/" className="logo-box mb-6 inline-flex items-center gap-3" style={{ textDecoration: 'none' }}>
              <img src="/ascendia_logo.png" alt="Ascendia" style={{ width: '40px', borderRadius: '8px' }} />
              <span className="logo-text font-bold text-xl text-white">ASCENDIA<br/><span style={{ fontSize: '12px', opacity: 0.7, fontWeight: 'normal' }}>TRANSPORTS</span></span>
            </Link>
            <p className="text-sm opacity-70 mb-6 leading-relaxed">
              Ascendia Transports is your trusted partner in premium bus transportation services. With a commitment to comfort, safety, and reliability, we connect communities and provide convenient travel options.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors font-bold text-white text-xs">
                FB
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors font-bold text-white text-xs">
                IG
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors font-bold text-white text-xs">
                YT
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors font-bold text-white text-xs">
                TK
              </a>
            </div>
          </div>

          {/* Column 2: Support Links */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white border-b border-white/10 pb-2 inline-block">Support</h4>
            <ul className="flex flex-col gap-3 text-sm opacity-80">
              <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/services" className="hover:text-primary transition-colors">Services</Link></li>
              <li><Link href="/timetables" className="hover:text-primary transition-colors">Bus Timetables</Link></li>
              <li><Link href="/gallery" className="hover:text-primary transition-colors">Gallery</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-white/10 pt-6 text-center text-sm opacity-60 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 Ascendia Transports. All Rights Reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
