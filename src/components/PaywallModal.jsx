import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Crown, CheckCircle } from 'lucide-react';

export default function PaywallModal({ onClose }) {
  const { setIsPremium } = useAuth();
  
  const handleUpgrade = () => {
    setIsPremium(true);
    onClose();
    // Simulate toast
    alert("Welcome to Audkit Family Plan!");
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }} onClick={(e) => { if(e.target === e.currentTarget) onClose() }}>
      <div className="modal-box fade-in" style={{ textAlign: 'center', padding: '40px 32px' }}>
        <div style={{ width: '64px', height: '64px', background: 'rgba(232, 197, 109, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--accent)' }}>
          <Crown size={32} />
        </div>
        <h2 className="section-title" style={{ fontSize: '24px', marginBottom: '8px' }}>Upgrade to Family Plan</h2>
        <div style={{ color: 'var(--text2)', marginBottom: '32px', fontSize: '14px' }}>
          You've reached the free tier limits.
        </div>
        
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '32px', textAlign: 'left', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '24px', fontWeight: 'bold' }}>₹99</span><span style={{ color: 'var(--text2)' }}>/month</span>
              <div style={{ fontSize: '11px', color: 'var(--text3)' }}>or ₹799/year</div>
            </div>
            <div className="badge amber">Save 33%</div>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', padding: 0, margin: 0, fontSize: '14px' }}>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><CheckCircle size={16} color="var(--accent)" /> <span style={{ color: 'var(--text)' }}>Unlimited members</span></li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><CheckCircle size={16} color="var(--accent)" /> <span style={{ color: 'var(--text)' }}>Unlimited assets</span></li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><CheckCircle size={16} color="var(--accent)" /> <span style={{ color: 'var(--text)' }}>WhatsApp reminders</span></li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><CheckCircle size={16} color="var(--accent)" /> <span style={{ color: 'var(--text)' }}>PDF Export</span></li>
            <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><CheckCircle size={16} color="var(--accent)" /> <span style={{ color: 'var(--text)' }}>Priority support</span></li>
          </ul>
        </div>

        <button className="btn-primary" style={{ width: '100%', marginBottom: '12px' }} onClick={handleUpgrade}>
          Start free trial (7 days)
        </button>
        <button className="btn-ghost" style={{ width: '100%', border: 'none', background: 'transparent', boxShadow: 'none' }} onClick={onClose}>
          Maybe later
        </button>
      </div>
    </div>
  );
}
