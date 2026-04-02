import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../hooks/useData';
import { useGoals } from '../hooks/useGoals';
import { useNavigate } from 'react-router-dom';
import GoalsSection from '../components/GoalsSection';
import HealthScoreWidget from '../components/HealthScoreWidget';
import PaywallModal from '../components/PaywallModal';
import RupeeRain from '../components/RupeeRain';
import { supabase } from '../utils/supabase';

const typeColors = {
  'FD': '#6db0e8', 'LIC': '#b48de8', 'SGB': '#e8c56d', 'MF': '#4ecb8d', 'PPF': '#e8685a'
};

const fmtMoney = (val) => {
  const num = Number(val);
  if (num >= 100000) return `₹${(num/100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${(num/1000).toFixed(1)}K`;
  return `₹${num}`;
};
const exactMoney = (val) => new Intl.NumberFormat('en-IN').format(val);

const getDays = (dateStr) => {
  if(!dateStr) return null;
  const ms = new Date(dateStr) - new Date();
  return Math.ceil(ms / 86400000);
};

export default function Dashboard() {
  const { user, isPremium } = useAuth();
  const { assets, members, loading } = useData();
  const { goals } = useGoals();
  const navigate = useNavigate();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [showRain, setShowRain] = useState(false);
  const [rainDelta, setRainDelta] = useState(0);

  const total = assets.reduce((s, a) => s + Number(a.amount), 0);

  // ═══ RUPEE RAIN TRIGGER ═══
  const triggerRain = useCallback((delta) => {
    setRainDelta(delta);
    setShowRain(true);
  }, []);

  useEffect(() => {
    if (loading || assets.length === 0) return;

    const monthKey = `celebration_shown_${new Date().getFullYear()}_${new Date().getMonth()}_${user?.id}`;
    if (localStorage.getItem(monthKey)) return;

    // Check against previous month's score_history
    (async () => {
      try {
        const { data: history } = await supabase
          .from('score_history')
          .select('total_value')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        const lastVal = history?.[0]?.total_value || 0;
        const delta = total - lastVal;

        if (delta > 1000) {
          triggerRain(delta);
          localStorage.setItem(monthKey, 'true');
        }
      } catch {
        // score_history table may not exist yet — silently skip
      }
    })();
  }, [loading, total, user?.id]);

  // Hidden keyboard shortcut for testing: Ctrl+Shift+R
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        triggerRain(25000);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [triggerRain]);

  if (loading) return <div className="loader-container">Syncing with Supabase...</div>;

  // Allocation Donut
  const sums = {};
  assets.forEach(a => sums[a.type] = (sums[a.type] || 0) + Number(a.amount));
  let cumP = 0;
  const sortedTypes = Object.entries(sums).sort((a,b)=>b[1]-a[1]);

  const incoming = assets.filter(a => a.maturity_date && getDays(a.maturity_date) > 0)
                         .sort((a,b) => getDays(a.maturity_date) - getDays(b.maturity_date)).slice(0, 3);

  const renderChip = (type) => {
    const hex = typeColors[type] || '#fff';
    const r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16);
    return <span className="type-chip" style={{ color: hex, background: `rgba(${r},${g},${b},0.1)` }}>{type}</span>;
  };

  return (
    <div className="screen fade-in active">
      {showRain && <RupeeRain delta={rainDelta} onComplete={() => setShowRain(false)} />}
      <div className="dash-header">
        <div>
          <div className="welcome-text">Good morning, <span id="lbl-user">{user.email.split('@')[0]}</span></div>
          <div className="net-worth-number" style={{ color: 'var(--accent)', fontSize: '48px' }}>₹{total === 0 ? '—' : exactMoney(total)}</div>
        </div>
      </div>

      <div className="dash-grid-6">
        {['FD', 'LIC', 'SGB', 'MF', 'PPF'].map(t => {
          const sub = assets.filter(a => a.type === t);
          const sum = sub.reduce((s, a) => s + Number(a.amount), 0);
          return (
            <div key={t} className={`card metric-card ${t.toLowerCase()}`}>
              <div className="label" style={{ color: 'var(--text2)' }}>{t} Portfolio</div>
              <div className="net-worth-number" style={{ fontSize: '24px' }}>{fmtMoney(sum)}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span className="label" style={{ color: 'var(--text3)' }}>{sub.length} active</span>
              </div>
            </div>
          );
        })}

        {/* Chit Fund Card */}
        {(() => {
          const chits = assets.filter(a => a.type === 'CHIT');
          const monthlyOutflow = chits.reduce((s, a) => s + Number(a.chit_monthly_installment || 0), 0);
          return chits.length > 0 ? (
            <div className="card metric-card" style={{ borderLeft: '3px solid var(--orange)' }}>
              <div className="label" style={{ color: 'var(--orange)' }}>Chit Funds</div>
              <div className="net-worth-number" style={{ fontSize: '24px' }}>{fmtMoney(chits.reduce((s, a) => s + Number(a.chit_total_value || a.amount || 0), 0))}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span className="label" style={{ color: 'var(--text3)' }}>{chits.length} active · ₹{fmtMoney(monthlyOutflow)}/mo</span>
              </div>
            </div>
          ) : null;
        })()}

        {/* Loans Given Card */}
        {(() => {
          const loans = assets.filter(a => a.type === 'LOAN_GIVEN' && (a.loan_status === 'outstanding' || a.loan_status === 'partially_returned'));
          const totalOutstanding = loans.reduce((s, a) => s + Number(a.amount || 0) - Number(a.loan_partial_returned || 0), 0);
          const overdue = loans.filter(a => a.loan_expected_return && new Date(a.loan_expected_return) < new Date()).length;
          return loans.length > 0 ? (
            <div className="card metric-card" style={{ borderLeft: '3px solid var(--red)' }}>
              <div className="label" style={{ color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Loans Given
                {overdue > 0 && <span style={{ background: 'var(--red)', color: '#fff', fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px' }}>{overdue} overdue</span>}
              </div>
              <div className="net-worth-number" style={{ fontSize: '24px' }}>₹{fmtMoney(totalOutstanding)}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span className="label" style={{ color: 'var(--text3)' }}>{loans.length} borrowers</span>
              </div>
            </div>
          ) : null;
        })()}

        <div 
          className="card" 
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px dashed var(--border2)' }}
          onClick={() => navigate('/assets')}
        >
          <span style={{ fontSize: '24px', color: 'var(--text2)', marginBottom: '8px' }}>+</span>
          <span className="section-title" style={{ fontSize: '14px', color: 'var(--text2)' }}>Manage Assets</span>
        </div>
      </div>

      {/* Goals Section */}
      <GoalsSection assets={assets} onPaywall={() => setPaywallOpen(true)} />

      {/* Health Score Widget */}
      <HealthScoreWidget assets={assets} members={members} goals={goals} onPaywall={() => setPaywallOpen(true)} />

      <div className="chart-row">
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="section-title" style={{ alignSelf: 'flex-start', marginBottom: '16px' }}>Allocation</div>
          {total > 0 ? (
            <div style={{ position: 'relative', width: '160px', height: '160px' }}>
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                {sortedTypes.map(([type, val]) => {
                  const p = val / total;
                  const dash = `${p * 251.2} 251.2`;
                  const offset = -cumP * 251.2;
                  cumP += p;
                  return <circle key={type} r="40" cx="50" cy="50" fill="transparent" stroke={typeColors[type]} strokeWidth="15" strokeDasharray={dash} strokeDashoffset={offset} />;
                })}
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <span className="section-title" style={{ fontSize: '14px' }}>100%</span>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text3)', fontStyle: 'italic' }}>No assets to visualize.</div>
          )}
          
          <div style={{ width: '100%', marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sortedTypes.map(([type, val]) => {
              const p = val / total;
              return (
                <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: typeColors[type] }}></span> {type}
                  </span>
                  <span className="code-val">{(p*100).toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div className="section-title">Upcoming Maturities</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {incoming.length > 0 ? incoming.map(a => {
              const d = getDays(a.maturity_date);
              const col = d < 30 ? 'red' : (d < 90 ? 'amber' : 'green');
              return (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                  <div>
                    <div className="section-title" style={{ fontSize: '14px' }}>{a.name}</div>
                    <div className="code-val" style={{ color: 'var(--text2)', marginTop: '4px' }}>{fmtMoney(a.amount)}</div>
                  </div>
                  <span className={`badge ${col}`}>{d}d</span>
                </div>
              );
            }) : (
               <div style={{ color: 'var(--text3)', fontStyle: 'italic' }}>No upcoming maturities scheduled.</div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div className="section-title">Recent Assets</div>
          <span style={{ color: 'var(--text2)', fontSize: '14px', cursor: 'pointer' }} onClick={() => navigate('/assets')}>View all &rarr;</span>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>Asset</th><th>Type</th><th>Amount</th></tr></thead>
            <tbody>
              {assets.slice(-5).reverse().map(a => (
                <tr key={a.id}>
                  <td><div style={{ fontWeight: '500' }}>{a.name}</div></td>
                  <td>{renderChip(a.type)}</td>
                  <td className="code-val">{exactMoney(a.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {paywallOpen && <PaywallModal onClose={() => setPaywallOpen(false)} />}
    </div>
  );
}
