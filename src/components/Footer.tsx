import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer" style={{ background: 'rgba(0,0,0,0.8)', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '60px', paddingBottom: '30px' }}>
      <div className="container mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-10">

          {/* Center Brand & Socials */}
          <Link href="/" className="logo-box mb-6 inline-flex items-center gap-3" style={{ textDecoration: 'none' }}>
            <img src="/ascendia_logo.png" alt="Ascendia" style={{ width: '40px', borderRadius: '8px' }} />
            <span className="logo-text font-bold text-xl text-white">ASCENDIA<br /><span style={{ fontSize: '12px', opacity: 0.7, fontWeight: 'normal' }}>TRANSPORTS</span></span>
          </Link>
          <p className="text-sm opacity-70 mb-6 leading-relaxed">
            Ascendia Transports is your trusted partner in premium bus transportation services. With a commitment to comfort, safety, and reliability, we connect communities and provide convenient travel options.
          </p>
          <div className="flex gap-4 justify-center">
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
