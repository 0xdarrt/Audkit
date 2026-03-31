import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Shield, Zap, Users, PieChart, 
  ChevronDown, Bell, CheckCircle, Smartphone, 
  HelpCircle, Star, Lock, BellRing, Wallet, X
} from 'lucide-react';

const fmtMoney = (val) => {
  return new Intl.NumberFormat('en-IN').format(val);
};

const useScrollReveal = () => {
  const [revealed, setRevealed] = useState([]);
  const observer = useRef(null);

  useEffect(() => {
    observer.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setRevealed(prev => [...new Set([...prev, entry.target.id])]);
        }
      });
    }, { threshold: 0.1 });

    const sections = document.querySelectorAll('.reveal-section');
    sections.forEach(s => observer.current.observe(s));

    return () => observer.current.disconnect();
  }, []);

  return revealed;
};

export default function Landing() {
  const navigate = useNavigate();
  const revealed = useScrollReveal();
  const [activeFaq, setActiveFaq] = useState(null);
  
  // Interactive Interactivity States
  const [recoverySlider, setRecoverySlider] = useState(65); // % of recovered wealth
  const [tiltStyle, setTiltStyle] = useState({ transform: 'rotateX(0deg) rotateY(0deg)' });
  const [pulseIndex, setPulseIndex] = useState(0);

  const handleMouseMove = (e) => {
    const { clientX, clientY, currentTarget } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;
    setTiltStyle({ transform: `rotateX(${y * -15}deg) rotateY(${x * 15}deg)` });
  };
  
  const resetTilt = () => setTiltStyle({ transform: 'rotateX(0deg) rotateY(0deg)' });

  // Mock Family Activity Feed
  const activityFeed = [
    { user: 'Papa', action: 'added generic FD', val: '₹12,40,000', time: '2m ago' },
    { user: 'System', action: 'maturity alert sent for', val: 'LIC Bond B-4', time: '12m ago' },
    { user: 'Mom', action: 'synced gold vault', val: '400g SGB', time: '1h ago' },
    { user: 'Audkit AI', action: 'analyzed leakage', val: '₹4,500 Saved', time: 'Just Now' }
  ];

  useEffect(() => {
    const timer = setInterval(() => setPulseIndex(p => (p + 1) % activityFeed.length), 3000);
    return () => clearInterval(timer);
  }, []);

  const isVisible = (id) => revealed.includes(id);

  const features = [
    { title: 'Sovereign Portfolio', desc: 'Centralized tracking for FDs, LIC, SGB, and Mutual Funds.', icon: PieChart, color: 'var(--blue)' },
    { title: 'Family Governance', desc: 'Securely sync and split wealth across generations.', icon: Users, color: 'var(--purple)' },
    { title: 'AI Intelligence', desc: 'Heuristic-driven burn rate and reinvestment analysis.', icon: Zap, color: 'var(--accent)' },
    { title: 'Enterprise Alerts', desc: 'Automated maturity notifications via executive email.', icon: Bell, color: 'var(--green)' }
  ];

  return (
    <div className="landing-root" style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: "'Sora', sans-serif" }}>
      
      {/* 3D Static Background Ornament */}
      <div style={{ position: 'fixed', top: '-10%', right: '-5%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(232, 197, 109, 0.05) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }}></div>
      <div style={{ position: 'fixed', bottom: '10%', left: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(180, 141, 232, 0.03) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }}></div>

      {/* Floating Parallax Assets */}
      <div className="floating" style={{ position: 'absolute', top: '15%', left: '10%', opacity: 0.2, zIndex: 0 }}><Wallet size={80} color="var(--accent)" /></div>
      <div className="floating" style={{ position: 'absolute', top: '45%', right: '15%', opacity: 0.1, zIndex: 0, animationDelay: '1s' }}><PieChart size={120} color="var(--purple)" /></div>
      <div className="floating" style={{ position: 'absolute', bottom: '20%', left: '20%', opacity: 0.15, zIndex: 0, animationDelay: '2s' }}><Shield size={60} color="var(--blue)" /></div>

      {/* Floating Navbar */}
      <nav style={{ 
        position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', 
        width: '90%', maxWidth: '1200px', height: '70px', 
        background: 'rgba(24, 24, 23, 0.7)', backdropFilter: 'blur(16px)', 
        borderRadius: '20px', border: '1px solid var(--border)', 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '0 32px', zIndex: 1000 
      }}>
        <div 
          onClick={() => navigate('/')} 
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div className="logo-text" style={{ fontSize: '24px', opacity: 1 }}>Audkit</div>
        </div>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <a href="#features" style={{ color: 'var(--text2)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Features</a>
          <a href="#pricing" style={{ color: 'var(--text2)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Pricing</a>
          <button className="btn-primary" style={{ padding: '8px 24px', fontSize: '14px' }} onClick={() => navigate('/auth')}>
            Get Started <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header id="hero" className="reveal-section" style={{ 
        minHeight: '100vh', display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center', textAlign: 'center', 
        padding: '120px 24px 60px', position: 'relative', zIndex: 1 
      }}>
        <div className={isVisible('hero') ? 'reveal-up' : ''}>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '8px', 
            background: 'var(--bg2)', padding: '6px 16px', borderRadius: '30px', 
            border: '1px solid var(--border)', color: 'var(--accent)', fontSize: '12px', 
            fontWeight: 600, marginBottom: '24px' 
          }}>
            <Shield size={14} /> SOVEREIGN WEALTH FOR INDIAN FAMILIES
          </div>
          <h1 className="hero-title" style={{ 
            maxWidth: '900px', lineHeight: 1.1, marginBottom: '24px', 
            fontSize: 'clamp(40px, 8vw, 84px)' 
          }}>
            Financial clarity <br /> 
            <span style={{ color: 'var(--accent)' }}>for the transition.</span>
          </h1>
          <p style={{ maxWidth: '600px', color: 'var(--text2)', fontSize: '18px', marginBottom: '40px', lineHeight: 1.6 }}>
            Track FDs, LIC policies, and Gold Bonds across your entire family. 
            Automated maturity intelligence for the modern middle class.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button className="btn-primary" style={{ padding: '16px 40px', fontSize: '16px' }} onClick={() => navigate('/auth')}>
              Register Your Vault
            </button>
            <button className="btn-ghost" style={{ padding: '16px 40px', fontSize: '16px' }} onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
              Explore Features
            </button>
          </div>
        </div>

        {/* INTERACTIVE WEALTH PROJECTOR (REPLACES NET WORTH) */}
        <div 
          className={`perspective-1000 reveal-section ${isVisible('hero') ? 'reveal-up' : ''}`} 
          id="hero-projector" 
          onMouseMove={handleMouseMove}
          onMouseLeave={resetTilt}
          style={{ marginTop: '80px', width: '100%', display: 'flex', justifyContent: 'center' }}
        >
           <div className="tilt-card glass-panel" style={{ 
             width: '100%', maxWidth: '800px', height: '420px', 
             background: 'linear-gradient(135deg, rgba(24, 24, 23, 0.95), rgba(15, 15, 14, 0.98))', 
             borderRadius: '32px', border: '1px solid var(--accent)', 
             position: 'relative', overflow: 'hidden', display: 'flex', ...tiltStyle
           }}>
              {/* Animated Pulse Feed in Top Right */}
              <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 10 }}>
                 <div className="card-value" style={{ fontSize: '10px', color: 'var(--accent)', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div className="glow-ring" style={{ width: '12px', height: '12px' }}></div> FAMILY PULSE
                 </div>
                 <div className="fade-in" key={pulseIndex} style={{ background: 'var(--bg2)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center', width: '220px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                      {activityFeed[pulseIndex].user[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text2)' }}><b>{activityFeed[pulseIndex].user}</b> {activityFeed[pulseIndex].action}</div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{activityFeed[pulseIndex].val}</div>
                    </div>
                 </div>
              </div>

              {/* Main Recovery UI */}
              <div style={{ flex: 1, padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'left' }}>
                  <h3 className="section-title" style={{ fontSize: '32px', color: 'var(--accent)', marginBottom: '12px' }}>Illumination Mode</h3>
                  <p style={{ color: 'var(--text3)', fontSize: '14px', maxWidth: '300px', marginBottom: '32px' }}>Billions are lost to "Forgotten Wealth" in India. Slide to see how much of your family vault you can recover from the shadows.</p>
                  
                  <div style={{ width: '100%', maxWidth: '350px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '12px', color: 'var(--text2)', fontWeight: 'bold' }}>
                      <span>HIDDEN WEALTH RECOVERY</span>
                      <span>{recoverySlider}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" 
                      value={recoverySlider} 
                      onChange={(e) => setRecoverySlider(e.target.value)}
                      style={{ width: '100%', height: '6px', background: 'var(--bg2)', borderRadius: '5px', accentColor: 'var(--accent)', cursor: 'pointer' }}
                    />
                  </div>
              </div>

              {/* Visual Result Visualization */}
              <div style={{ flex: 1, background: 'rgba(232, 197, 109, 0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid var(--border)', position: 'relative' }}>
                  <div className="shimmer-bg" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.3 }}></div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: 'var(--accent)', letterSpacing: '3px', marginBottom: '8px' }}>POTENTIAL RECOVERY</div>
                    <div className="hero-title" style={{ fontSize: '64px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '32px', color: 'var(--text3)' }}>₹</span>
                      {fmtMoney(Math.floor(8240000 * (recoverySlider / 100)))}
                    </div>
                    <div style={{ color: 'var(--text3)', fontSize: '12px', marginTop: '16px' }}>BASED ON AVERAGE INDIAN FAMILY ASSETS</div>
                  </div>
              </div>
           </div>
        </div>
      </header>

      {/* PROBLEM SECTION */}
      <section id="problem" className="reveal-section" style={{ padding: '100px 24px', background: 'var(--bg2)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className={isVisible('problem') ? 'reveal-left' : ''}>
            <h2 className="section-title" style={{ fontSize: '40px', marginBottom: '24px' }}>Family wealth is <span style={{ color: 'var(--red)' }}>scattered.</span></h2>
            <p style={{ maxWidth: '700px', color: 'var(--text2)', fontSize: '18px', marginBottom: '60px' }}>
              Most Indian families lose track of maturity dates, physical receipts, and joint-owner allocations. We bring it all under one sovereign roof.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            <div className={`card glass-panel interactive-card ${isVisible('problem') ? 'reveal-up' : ''}`} style={{ padding: '40px' }}>
               <Smartphone size={32} color="var(--red)" style={{ marginBottom: '24px' }} />
               <h3 className="section-title">The Paper Trap</h3>
               <p style={{ color: 'var(--text2)', marginTop: '12px' }}>No more digging through cupboards for physical LIC bonds or old FD receipts.</p>
            </div>
            <div className={`card glass-panel interactive-card ${isVisible('problem') ? 'reveal-up' : ''}`} style={{ padding: '40px' }}>
               <BellRing size={32} color="var(--accent)" style={{ marginBottom: '24px' }} />
               <h3 className="section-title">Frozen Capital</h3>
               <p style={{ color: 'var(--text2)', marginTop: '12px' }}>Billions go unclaimed every year due to forgotten maturity dates. We alert you months in advance.</p>
            </div>
            <div className={`card glass-panel interactive-card ${isVisible('problem') ? 'reveal-up' : ''}`} style={{ padding: '40px' }}>
               <Users size={32} color="var(--purple)" style={{ marginBottom: '24px' }} />
               <h3 className="section-title" id="family-sync">Opaque Ownership</h3>
               <p style={{ color: 'var(--text2)', marginTop: '12px' }}>Easily split and track assets held across multiple family members with different tax brackets.</p>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON SLIDER / STORYTELLING */}
      <section id="comparison" className="reveal-section" style={{ padding: '80px 24px', background: 'var(--bg)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
          <div className={`card glass-panel ${isVisible('comparison') ? 'reveal-left' : ''}`} style={{ flex: 1, padding: '40px', position: 'relative', overflow: 'hidden' }}>
             <div style={{ position: 'absolute', top: 12, left: 12, padding: '4px 12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--red)', fontSize: '10px', borderRadius: '4px', fontWeight: 'bold' }}>TRADITIONAL FAMILY</div>
             <h4 className="section-title" style={{ marginTop: '24px', marginBottom: '24px' }}>The "Excel & Whatsapp" Chaos</h4>
             <div style={{ display: 'grid', gap: '12px' }}>
                {['Maturity date forgotten', 'Physical receipt lost', 'Nominee details unknown'].map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', color: 'var(--text3)', fontSize: '13px' }}>
                    <X size={16} color="var(--red)" /> {t}
                  </div>
                ))}
             </div>
             <div style={{ marginTop: '32px', height: '80px', border: '1px dashed var(--red)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)', fontSize: '11px', opacity: 0.5 }}>₹ LOSS CALCULATED</div>
          </div>

          <div className={`card ${isVisible('comparison') ? 'reveal-right' : ''}`} style={{ flex: 1, padding: '40px', border: '2px solid var(--accent)', background: 'linear-gradient(135deg, #1a1a19, #111)' }}>
             <div style={{ position: 'absolute', top: 12, left: 12, padding: '4px 12px', background: 'rgba(232, 197, 109, 0.1)', color: 'var(--accent)', fontSize: '10px', borderRadius: '4px', fontWeight: 'bold' }}>AUDKIT FAMILY</div>
             <h4 className="section-title" style={{ marginTop: '24px', marginBottom: '24px' }}>The Sovereign Vault</h4>
             <div style={{ display: 'grid', gap: '12px' }}>
                {['Single Source of Truth', 'Multi-Generation Sync', 'Zero-Penalty Auto Alerts'].map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', color: 'var(--text2)', fontSize: '13px' }}>
                    <CheckCircle size={16} color="var(--accent)" /> {t}
                  </div>
                ))}
             </div>
             <button className="btn-primary" style={{ marginTop: '32px', width: '100%', padding: '12px' }} onClick={() => navigate('/auth')}>Secure Your Vault</button>
          </div>
        </div>
      </section>

      {/* FEATURES BENTO */}
      <section id="features" className="reveal-section" style={{ padding: '120px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 className="section-title" style={{ fontSize: '48px', marginBottom: '60px' }}>Built for the Vault.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {features.map((f, i) => (
              <div key={i} className={`card interactive-card hover-glow ${isVisible('features') ? 'reveal-up' : ''}`} style={{ padding: '40px', textAlign: 'left', borderTop: `4px solid ${f.color}` }}>
                <f.icon size={32} color={f.color} style={{ marginBottom: '24px' }} />
                <h3 className="section-title" style={{ marginBottom: '12px' }}>{f.title}</h3>
                <p style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="reveal-section" style={{ padding: '100px 24px', background: 'var(--bg2)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 className="section-title" style={{ fontSize: '40px', marginBottom: '16px' }}>Transparent SaaS Pricing.</h2>
          <p style={{ color: 'var(--text2)', marginBottom: '60px' }}>Start free, upgrade for enterprise-level family governance.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            <div className={`card glass-panel ${isVisible('pricing') ? 'reveal-left' : ''}`} style={{ padding: '40px' }}>
              <h3 className="section-title" style={{ fontSize: '24px' }}>Essential</h3>
              <div style={{ fontSize: '48px', fontWeight: 'bold', margin: '24px 0' }}>₹0<span style={{ fontSize: '20px', color: 'var(--text3)' }}>/mo</span></div>
              <ul style={{ listStyle: 'none', textAlign: 'left', display: 'grid', gap: '12px', marginBottom: '32px' }}>
                <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><CheckCircle size={16} color="var(--green)" /> 4 Active Assets</li>
                <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><CheckCircle size={16} color="var(--green)" /> 2 Family Members</li>
                <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><CheckCircle size={16} color="var(--green)" /> Basic Reminders</li>
              </ul>
              <button className="btn-ghost" style={{ width: '100%' }} onClick={() => navigate('/auth')}>Claim Free Vault</button>
            </div>
            
            <div className={`card ${isVisible('pricing') ? 'reveal-right' : ''}`} style={{ padding: '40px', background: 'linear-gradient(135deg, #1f1f1d, #181817)', border: '2px solid var(--accent)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '15px', right: '-35px', background: 'var(--accent)', color: 'var(--bg)', padding: '4px 40px', transform: 'rotate(45deg)', fontSize: '10px', fontWeight: 'bold' }}>POPULAR</div>
              <h3 className="section-title" style={{ fontSize: '24px', color: 'var(--accent)' }}>Sovereign</h3>
              <div style={{ fontSize: '48px', fontWeight: 'bold', margin: '24px 0' }}>₹299<span style={{ fontSize: '20px', color: 'var(--text3)' }}>/mo</span></div>
              <ul style={{ listStyle: 'none', textAlign: 'left', display: 'grid', gap: '12px', marginBottom: '32px' }}>
                <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><CheckCircle size={16} color="var(--accent)" /> Unlimited Assets</li>
                <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><CheckCircle size={16} color="var(--accent)" /> Unlimited Members</li>
                <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><CheckCircle size={16} color="var(--accent)" /> Email Alert Engine</li>
                <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><CheckCircle size={16} color="var(--accent)" /> AI Wealth Insights</li>
              </ul>
              <button className="btn-primary" style={{ width: '100%' }} onClick={() => navigate('/auth')}>Get Enterprise Access</button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="reveal-section" style={{ padding: '120px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 className="section-title" style={{ fontSize: '32px', marginBottom: '40px', textAlign: 'center' }}>Frequent Questions</h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            {[
              { q: 'Is my data secure?', a: 'We use military-grade AES-256 encryption and Supabase Row-Level Security. We never sell or share your financial data.' },
              { q: 'Can my family see my private assets?', a: 'Only if you assign them as owners. The Family Hub allows granular control over what each member can see.' },
              { q: 'How do the reminders work?', a: 'Our engine generates professional notification emails and dashboard alerts 30, 60, and 90 days before an asset matures.' }
            ].map((faq, i) => (
              <div key={i} className="card" style={{ padding: '0', overflow: 'hidden', cursor: 'pointer' }} onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
                <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 className="section-title" style={{ fontSize: '16px' }}>{faq.q}</h4>
                  <ChevronDown size={20} style={{ transform: activeFaq === i ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
                </div>
                <div style={{ 
                  maxHeight: activeFaq === i ? '200px' : '0', 
                  transition: 'all 0.4s ease', 
                  padding: activeFaq === i ? '0 24px 24px' : '0 24px',
                  color: 'var(--text2)', fontSize: '14px', lineHeight: 1.6, overflow: 'hidden'
                }}>
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: '100px 24px', textAlign: 'center' }}>
         <div className={`card reveal-section ${isVisible('faq') ? 'reveal-up' : ''}`} style={{ 
           maxWidth: '1000px', margin: '0 auto', padding: '80px 24px', 
           background: 'linear-gradient(145deg, #181817, #0f0f0e)', border: '1px solid var(--accent)' 
         }}>
           <h2 className="hero-title" style={{ fontSize: '48px', marginBottom: '24px' }}>Ready for clarity?</h2>
           <p style={{ color: 'var(--text2)', marginBottom: '40px' }}>Join over 1,000 Indian families securing their wealth transition.</p>
           <button className="btn-primary" style={{ padding: '16px 48px' }} onClick={() => navigate('/auth')}>
             Create Your Free Account <ArrowRight size={20} />
           </button>
         </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '80px 24px 40px', borderTop: '1px solid var(--border)', background: 'var(--bg2)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '40px' }}>
          <div>
            <div className="logo-text" style={{ fontSize: '24px' }}>Audkit</div>
            <p style={{ color: 'var(--text3)', marginTop: '12px', fontSize: '14px' }}>© 2026 Audkit Wealth Security. <br /> All rights reserved.</p>
          </div>
          <div style={{ display: 'flex', gap: '80px' }}>
            <div style={{ display: 'grid', gap: '12px' }}>
               <h5 className="label" style={{ color: 'var(--text)' }}>PRODUCT</h5>
               <a href="#" style={{ color: 'var(--text3)', textDecoration: 'none', fontSize: '13px' }}>Dashboard</a>
               <a href="#" style={{ color: 'var(--text3)', textDecoration: 'none', fontSize: '13px' }}>Family Hub</a>
               <a href="#" style={{ color: 'var(--text3)', textDecoration: 'none', fontSize: '13px' }}>Security</a>
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
               <h5 className="label" style={{ color: 'var(--text)' }}>COMPANY</h5>
               <a href="#" style={{ color: 'var(--text3)', textDecoration: 'none', fontSize: '13px' }}>About Us</a>
               <a href="#" style={{ color: 'var(--text3)', textDecoration: 'none', fontSize: '13px' }}>Legal</a>
               <a href="#" style={{ color: 'var(--text3)', textDecoration: 'none', fontSize: '13px' }}>Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
