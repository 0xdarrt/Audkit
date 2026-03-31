import React, { useState } from 'react';
import { useData } from '../hooks/useData';
import { useAuth } from '../context/AuthContext';
import PaywallModal from '../components/PaywallModal';
import { Mail, BellRing, Settings } from 'lucide-react';

const fmtMoney = (val) => new Intl.NumberFormat('en-IN').format(val);
const getDays = (dateStr) => {
  if(!dateStr) return null;
  const ms = new Date(dateStr) - new Date();
  return Math.ceil(ms / 86400000);
};

export default function Reminders() {
  const { isPremium } = useAuth();
  const { assets, loading } = useData();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [previewMsg, setPreviewMsg] = useState(null); // stores asset object if open

  if(loading) return <div className="loader-container">Loading reminders...</div>;

  let items = assets.filter(a => a.maturity_date && getDays(a.maturity_date) > 0 && getDays(a.maturity_date) < 365)
                    .sort((a,b) => getDays(a.maturity_date) - getDays(b.maturity_date));

  const handlePreviewClick = (asset) => {
    if (!isPremium) {
      setPaywallOpen(true);
    } else {
      setPreviewMsg(asset);
    }
  };

  return (
    <div className="screen fade-in active">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h2 className="page-heading">Maturity Reminders</h2>
          <div style={{ color: 'var(--text2)', marginTop: '8px' }}>Action required on items approaching maturity.</div>
        </div>
        <div 
          onClick={() => {
            if (!isPremium) setPaywallOpen(true);
            else alert("Enterprise Email & SMS workflow is active!");
          }} 
          style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg2)', padding: '8px 16px', borderRadius: '30px', border: '1px solid var(--border)', cursor: 'pointer' }}
        >
          <BellRing size={16} color="var(--accent)" />
          <span style={{ fontSize: '13px', fontWeight: 500 }}>Alert Settings</span>
          <div style={{ width: '36px', height: '20px', background: isPremium ? 'var(--green)' : 'var(--text3)', borderRadius: '20px', position: 'relative' }}>
            <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', right: isPremium ? '2px' : 'auto', left: isPremium ? 'auto' : '2px', top: '2px' }}></div>
          </div>
        </div>
      </div>

      <div className="reminders-grid">
        {items.length === 0 && <div style={{color: 'var(--text3)'}}>No active reminders within the next 365 days.</div>}
        {items.map(a => {
          const days = getDays(a.maturity_date);
          const tint = days < 30 ? 'red-tint' : (days < 90 ? 'amber-tint' : 'green-tint');
          const fillCol = days < 30 ? 'var(--red)' : (days < 90 ? 'var(--accent)' : 'var(--green)');
          const pct = Math.max(10, 100 - (days/365 * 100));
          
          return (
            <div key={a.id} className={`reminder-card ${tint} hover-wa-trigger`} style={{ position: 'relative' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', width: '100%' }}>
                <div style={{ fontSize: '24px' }}>⏱️</div>
                <div style={{ flex: 1 }}>
                  <div className="section-title" style={{ fontSize: '16px' }}>{a.name}</div>
                  <div className="label" style={{ color: 'var(--text2)', marginTop: '4px' }}>
                    {a.members && a.members.length > 0 ? a.members.map(m=>m.name).join(', ') : 'Unassigned'} &bull; Matures on {new Date(a.maturity_date).toLocaleDateString()}
                  </div>
                  {a.notes && <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px', fontStyle: 'italic' }}>"{a.notes}"</div>}
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <div className="code-val" style={{ color: 'var(--accent)', fontSize: '18px' }}>₹{fmtMoney(a.amount)}</div>
                  <div className="badge" style={{ background: 'transparent', color: 'var(--text2)', padding: 0 }}>{days} days to go</div>
                  <button 
                    className="btn-ghost" 
                    style={{ padding: '6px 12px', fontSize: '12px', gap: '6px' }}
                    onClick={() => handlePreviewClick(a)}
                  >
                    <Mail size={14} color="var(--accent)" /> Preview Email
                  </button>
                </div>
              </div>
              <div className="urgency-bar-container">
                <div className="urgency-bar-fill" style={{ width: `${pct}%`, background: fillCol }}></div>
              </div>
            </div>
          );
        })}
      </div>

      {paywallOpen && <PaywallModal onClose={() => setPaywallOpen(false)} />}

      {previewMsg && (
        <div className="modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) setPreviewMsg(null) }}>
          <div className="modal-box fade-in" style={{ padding: 0, overflow: 'hidden', background: '#fff', maxWidth: '440px', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            
            {/* Email Header */}
            <div style={{ borderBottom: '1px solid #eee', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#888', fontSize: '12px', fontWeight: '500' }}>INBOX &bull; AUTOMATED ALERT</div>
              <div style={{ color: '#aaa', fontSize: '12px' }}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '40px', height: '40px', background: '#eef2ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BellRing size={20} color="#4f46e5" />
                </div>
                <div>
                  <div style={{ color: '#111', fontWeight: 'bold', fontSize: '15px' }}>Audkit Financial Vault</div>
                  <div style={{ color: '#666', fontSize: '13px' }}>alerts@audkit.app</div>
                </div>
              </div>

              <h3 style={{ fontSize: '20px', color: '#111', marginBottom: '16px', fontWeight: '600' }}>Action Required: {previewMsg.name} is maturing soon.</h3>
              
              <div style={{ color: '#444', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
                <p style={{ marginBottom: '16px' }}>Hi {previewMsg.members && previewMsg.members.length > 0 ? previewMsg.members.map(m=>(m.name || '').split(' ')[0]).join(', ') : 'there'},</p>
                <p style={{ marginBottom: '16px' }}>This is an automated alert. Your family asset <strong>{previewMsg.name}</strong> valued at <strong>₹{fmtMoney(previewMsg.amount)}</strong> is officially maturing in exactly <strong>{getDays(previewMsg.maturity_date)} days</strong> on {new Date(previewMsg.maturity_date).toLocaleDateString()}.</p>
                
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #4f46e5', marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>SYSTEM RECOMMENDATION</div>
                  <div style={{ color: '#0f172a', fontWeight: '500' }}>Current prevailing FD rates are at 7.25%. Consider reinvesting to maintain compound growth.</div>
                </div>
                
                <p>Log in to your dashboard to mark this asset as renewed or liquidated.</p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button style={{ flex: 1, padding: '12px', background: '#111', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setPreviewMsg(null)}>Take Action Dashboard</button>
              </div>
            </div>
            
            <div style={{ background: '#f8f9fa', padding: '16px', textAlign: 'center', fontSize: '11px', color: '#888', borderTop: '1px solid #eee' }}>
              This email was sent securely via Audkit Enterprise.<br/>You can manage your alert preferences in Settings.
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
