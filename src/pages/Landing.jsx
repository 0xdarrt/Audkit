import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Shield, Zap, Users, PieChart, 
  ChevronDown, Bell, CheckCircle, Smartphone, 
  HelpCircle, Star, Lock, BellRing
} from 'lucide-react';

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

        {/* 3D Visual Mockup Placeholder */}
        <div className={`floating reveal-section ${isVisible('hero') ? 'reveal-up' : ''}`} id="hero-img" style={{ 
          marginTop: '80px', width: '100%', maxWidth: '1000px', height: '400px', 
          background: 'linear-gradient(145deg, #1a1a19, #0f0f0e)', 
          borderRadius: '32px', border: '1px solid var(--border2)', 
          position: 'relative', boxShadow: '0 40px 100px rgba(0,0,0,0.8)' 
        }}>
           <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.1 }}>
              <PieChart size={200} />
           </div>
           {/* Abstract 3D Shapes */}
           <div style={{ position: 'absolute', top: '-30px', left: '-30px', width: '120px', height: '120px', background: 'var(--accent)', borderRadius: '24px', filter: 'blur(60px)', opacity: 0.2 }}></div>
           <div style={{ position: 'absolute', bottom: '100px', right: '50px', width: '150px', height: '150px', background: 'var(--purple)', borderRadius: '50%', filter: 'blur(50px)', opacity: 0.1 }}></div>
           
           <div style={{ display: 'flex', padding: '40px', gap: '24px', height: '100%' }}>
              <div style={{ flex: 1, borderRight: '1px solid var(--border)', paddingRight: '24px' }}>
                 <div className="card-value" style={{ fontSize: '48px', marginBottom: '8px', color: 'var(--accent)' }}>₹82,40,000</div>
                 <div className="label" style={{ color: 'var(--text3)' }}>FAMILY NET WORTH</div>
              </div>
              <div style={{ flex: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                 {[
                   { label: 'Fixed Deposits', val: '₹32L', color: 'var(--blue)' },
                   { label: 'LIC Policies', val: '₹14L', color: 'var(--purple)' },
                   { label: 'Gold Bonds', val: '₹28L', color: 'var(--accent)' },
                   { label: 'Mutual Funds', val: '₹8L', color: 'var(--green)' }
                 ].map((item, i) => (
                   <div key={i} className="interactive-card" style={{ background: 'var(--bg2)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '4px' }}>{item.label}</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: item.color }}>{item.val}</div>
                   </div>
                 ))}
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
