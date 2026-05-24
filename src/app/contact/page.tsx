'use client';
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { MapPin, Phone, Mail, Send, MessageSquare, Map, User, AtSign, BookOpen, AlignLeft } from 'lucide-react';

const FloatingField = ({
  icon, label, type = 'text', isTextarea = false, rows = 6
}: {
  icon: React.ReactNode;
  label: string;
  type?: string;
  isTextarea?: boolean;
  rows?: number;
}) => {
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  const borderColor = focused ? '#3b82f6' : 'rgba(255,255,255,0.1)';
  const glowColor = focused ? '0 0 0 3px rgba(59, 130, 246, 0.15)' : 'none';
  const labelTop = focused || hasValue ? '-10px' : isTextarea ? '18px' : '50%';
  const labelFontSize = focused || hasValue ? '11px' : '14px';
  const labelColor = focused ? '#60a5fa' : 'rgba(255,255,255,0.45)';

  const commonProps = {
    onFocus: () => setFocused(true),
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFocused(false);
      setHasValue(e.target.value.length > 0);
    },
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setHasValue(e.target.value.length > 0),
    style: {
      width: '100%',
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: '#fff',
      fontSize: '15px',
      paddingLeft: '0',
      paddingRight: '0',
      paddingTop: isTextarea ? '8px' : '0',
      resize: isTextarea ? 'vertical' as const : undefined,
      fontFamily: 'inherit',
    }
  };

  return (
    <div style={{ position: 'relative', marginTop: '8px' }}>
      {/* Container */}
      <div style={{
        display: 'flex',
        alignItems: isTextarea ? 'flex-start' : 'center',
        gap: '14px',
        padding: isTextarea ? '20px 20px' : '16px 20px',
        background: 'rgba(0,0,0,0.35)',
        border: `1.5px solid ${borderColor}`,
        borderRadius: '14px',
        boxShadow: glowColor,
        transition: 'all 0.3s ease',
        position: 'relative',
      }}>
        {/* Icon */}
        <div style={{
          color: focused ? '#60a5fa' : 'rgba(255,255,255,0.3)',
          transition: 'color 0.3s ease',
          flexShrink: 0,
          marginTop: isTextarea ? '4px' : '0',
        }}>
          {icon}
        </div>

        {/* Input area */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Floating label */}
          <label style={{
            position: 'absolute',
            top: isTextarea ? labelTop : '50%',
            transform: (focused || hasValue) ? 'translateY(0)' : isTextarea ? 'translateY(0)' : 'translateY(-50%)',
            fontSize: labelFontSize,
            color: labelColor,
            pointerEvents: 'none',
            transition: 'all 0.25s ease',
            background: (focused || hasValue) ? 'rgba(10, 18, 40, 0.95)' : 'transparent',
            padding: (focused || hasValue) ? '0 6px' : '0',
            borderRadius: '4px',
            letterSpacing: (focused || hasValue) ? '0.8px' : '0',
            textTransform: (focused || hasValue) ? 'uppercase' : 'none',
            fontWeight: (focused || hasValue) ? '600' : '400',
            left: 0,
            zIndex: 1,
          }}>
            {label}
          </label>

          {isTextarea ? (
            <textarea rows={rows} {...commonProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>} />
          ) : (
            <input type={type} {...commonProps as React.InputHTMLAttributes<HTMLInputElement>} />
          )}
        </div>
      </div>
    </div>
  );
};

export default function ContactPage() {
  return (
    <div className="landing-wrapper">
      <Navbar />
      
      {/* Hero Header */}
      <header className="hero-section" style={{ minHeight: '35vh', padding: '100px 20px 0px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '10%', left: '10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(96, 165, 250, 0.15) 0%, transparent 70%)', borderRadius: '50%' }}></div>
        <div className="hero-content fade-in-up" style={{ position: 'relative', zIndex: 2 }}>
          <div className="badge-pill" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', borderColor: 'rgba(59, 130, 246, 0.4)' }}>Get In Touch</div>
          <h1 className="hero-title">
            Let's <span className="text-gradient" style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #34d399 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Connect</span>
          </h1>
          <p className="hero-subtitle">
            Whether you have a question, need support, or want to book a special hire, we're here to help.
          </p>
        </div>
      </header>
      
      {/* Main Contact Section */}
      <section style={{ flex: 1, padding: '40px 20px 80px', maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        
        {/* Left Side */}
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '20px' }} className="fade-in-up">
          
          <div style={{ display: 'flex', gap: '20px' }}>
            <div className="glass-panel hover-glow interactive" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div className="icon-wrapper" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <MapPin size={24} color="#fbbf24" />
              </div>
              <h3 style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Address</h3>
              <p style={{ color: '#fff', fontWeight: 'bold', fontSize: '16px' }}>128 Transport Blvd<br/>Colombo 03</p>
            </div>
            <div className="glass-panel hover-glow interactive" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div className="icon-wrapper" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Phone size={24} color="#60a5fa" />
              </div>
              <h3 style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Operations</h3>
              <p style={{ color: '#fff', fontWeight: 'bold', fontSize: '16px' }}>076 714 8292<br/><span style={{ color: '#34d399', fontSize: '12px', fontWeight: 'normal' }}>Available Now</span></p>
            </div>
          </div>

          <div className="glass-panel hover-glow interactive" style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div className="icon-wrapper" style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
              <Mail size={24} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Email Address</h3>
              <p style={{ color: '#fff', fontWeight: 'bold', fontSize: '20px', letterSpacing: '0.5px' }}>hello@ascendia.lk</p>
            </div>
          </div>

          <div className="glass-panel hover-glow" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)', borderRadius: '50%' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', position: 'relative', zIndex: 2 }}>
              <div className="icon-wrapper" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)' }}>
                <Map size={24} color="#fff" />
              </div>
              <h3 style={{ fontSize: '20px', color: '#fff', fontWeight: '700', letterSpacing: '0.5px' }}>24/7 Route Hotlines</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', zIndex: 2 }}>
              {[
                { tag: 'Express', tagColor: '#a78bfa', route: 'Colombo ➜ Jaffna', num: '077 107 5555', bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.3)', iconColor: '#c4b5fd' },
                { tag: 'Intercity', tagColor: '#60a5fa', route: 'Panadura ⇌ Kandy', num: '077 779 8600', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', iconColor: '#93c5fd' },
                { tag: 'Multi-Route', tagColor: '#10b981', route: 'Makumbura ⇌ Badulla / Colombo ⇌ Passara', num: '076 138 2300', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', iconColor: '#6ee7b7' },
                { tag: 'Charter', tagColor: '#f59e0b', route: 'Special Hires', num: '074 289 3612', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', iconColor: '#fcd34d' },
              ].map((item, i) => (
                <div key={i} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }} className="interactive">
                  <div>
                    <span style={{ fontSize: '11px', color: item.tagColor, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>{item.tag}</span>
                    <div style={{ color: '#fff', fontSize: '14px', marginTop: '4px' }}>{item.route}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: item.bg, padding: '6px 12px', borderRadius: '20px', border: `1px solid ${item.border}`, flexShrink: 0 }}>
                    <Phone size={14} color={item.iconColor} />
                    <strong style={{ color: '#fff', fontSize: '14px' }}>{item.num}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Beautiful Form */}
        <div style={{ flex: '1 1 500px', animationDelay: '0.2s' }} className="fade-in-up">
          <div className="glass-panel" style={{ padding: '48px', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', bottom: '-100px', right: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', position: 'relative', zIndex: 2 }}>
              <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '16px' }}>
                <MessageSquare size={28} color="#60a5fa" />
              </div>
              <h2 style={{ fontSize: '32px', color: '#fff', fontWeight: '700' }}>Send us a Message</h2>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '36px', lineHeight: '1.6', fontSize: '15px', position: 'relative', zIndex: 2 }}>
              Please feel free to reach out. We're here to assist you!
            </p>
            
            <form style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, position: 'relative', zIndex: 2 }}>
              <FloatingField icon={<User size={18} />} label="Your name" type="text" />
              <FloatingField icon={<AtSign size={18} />} label="Your email" type="email" />
              <FloatingField icon={<BookOpen size={18} />} label="Subject" type="text" />
              <FloatingField icon={<AlignLeft size={18} />} label="Your message" isTextarea rows={5} />
              
              <button type="submit" style={{
                padding: '20px',
                borderRadius: '14px',
                marginTop: 'auto',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '12px',
                fontSize: '16px',
                fontWeight: '600',
                letterSpacing: '0.5px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                border: '1px solid rgba(59,130,246,0.4)',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35), inset 0 1px 0 rgba(255,255,255,0.1)',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}>
                <span>Send Message</span>
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>

      </section>

      <Footer />
    </div>
  );
}

