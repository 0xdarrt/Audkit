import React, { useState } from 'react';
import { PARTNERS } from '../config/partners';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { Lock, ExternalLink, Shield } from 'lucide-react';

const fmtMoney = (val) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val);

const TENURE_KEYS = ['1yr', '2yr', '3yr'];
const TENURE_LABELS = ['1 Year', '2 Years', '3 Years'];

export default function RateComparisonTable({ maturingAmount, currentRate, assetId, onPaywall }) {
  const { user, isPremium } = useAuth();
  const [tenure, setTenure] = useState('1yr');
  const [clickLoading, setClickLoading] = useState(null);

  const sorted = [...PARTNERS].sort((a, b) => (b.rates[tenure] || 0) - (a.rates[tenure] || 0));
  const bestRate = sorted[0]?.rates[tenure] || 0;

  const handleAffiliate = async (partner) => {
    if (!isPremium) {
      onPaywall?.();
      return;
    }
    setClickLoading(partner.id);
    try {
      await supabase.from('referral_clicks').insert([{
        user_id: user.id,
        asset_id: assetId || null,
        partner_id: partner.id,
        clicked_at: new Date().toISOString(),
        amount: maturingAmount,
        tenure: parseInt(tenure)
      }]);
    } catch (err) {
      console.warn('Referral click log failed:', err);
    }
    window.open(`${partner.affiliateUrl}&utm_source=audkit&utm_medium=maturity_alert`, '_blank');
    setClickLoading(null);
  };

  return (
    <div style={{ marginTop: '24px' }}>
      {/* Tenure Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--bg)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '16px', width: 'fit-content' }}>
        {TENURE_KEYS.map((k, i) => (
          <button
            key={k}
            onClick={() => setTenure(k)}
            style={{
              padding: '6px 16px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
              background: tenure === k ? 'var(--accent)' : 'transparent',
              color: tenure === k ? 'var(--bg)' : 'var(--text2)',
              transition: '0.2s'
            }}
          >
            {TENURE_LABELS[i]}
          </button>
        ))}
      </div>

      {/* Rate Table */}
      <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg3)', fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>Partner</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Rate</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Monthly</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Annual</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, idx) => {
              const rate = p.rates[tenure] || 0;
              const annual = Math.floor(maturingAmount * rate / 100);
              const monthly = Math.floor(annual / 12);
              const isBest = rate === bestRate;
              const isBlurred = !isPremium && idx > 0;

              return (
                <tr key={p.id} style={{
                  borderBottom: '1px solid var(--border)',
                  background: isBest ? 'rgba(232, 197, 109, 0.05)' : 'transparent',
                  filter: isBlurred ? 'blur(4px)' : 'none',
                  pointerEvents: isBlurred ? 'none' : 'auto'
                }}>
                  <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>{p.logo}</span>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13px' }}>{p.name}</div>
                      {p.badge && (
                        <span style={{
                          fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase',
                          padding: '2px 6px', borderRadius: '4px', marginTop: '2px', display: 'inline-block',
                          background: p.badge === 'Highest Rate' ? 'rgba(78, 203, 141, 0.15)' : 'rgba(232, 197, 109, 0.15)',
                          color: p.badge === 'Highest Rate' ? 'var(--green)' : 'var(--accent)'
                        }}>
                          {p.badge}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', fontSize: '15px', color: isBest ? 'var(--accent)' : 'var(--text)', fontFamily: "'DM Serif Display', serif" }}>
                    {rate}%
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: 'var(--text2)' }}>
                    ₹{fmtMoney(monthly)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: 'var(--green)' }}>
                    ₹{fmtMoney(annual)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleAffiliate(p)}
                      disabled={clickLoading === p.id}
                      style={{
                        padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold',
                        background: isBest ? 'var(--accent)' : 'var(--bg2)',
                        color: isBest ? 'var(--bg)' : 'var(--text2)',
                        display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap'
                      }}
                    >
                      {clickLoading === p.id ? '...' : <>Open FD <ExternalLink size={12} /></>}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Free user overlay */}
      {!isPremium && (
        <div
          onClick={() => onPaywall?.()}
          style={{
            marginTop: '12px', padding: '16px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer',
            background: 'rgba(232, 197, 109, 0.08)', border: '1px solid rgba(232, 197, 109, 0.2)'
          }}
        >
          <Lock size={16} color="var(--accent)" style={{ marginBottom: '4px' }} />
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--accent)' }}>Unlock all partner rates — upgrade to Premium</div>
        </div>
      )}

      {/* DICGC Info */}
      {maturingAmount <= 500000 && (
        <div style={{
          marginTop: '12px', padding: '12px 16px', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'center',
          background: 'rgba(78, 203, 141, 0.08)', border: '1px solid rgba(78, 203, 141, 0.2)'
        }}>
          <Shield size={16} color="var(--green)" />
          <div style={{ fontSize: '12px', color: 'var(--green)' }}>
            DICGC insured up to ₹5,00,000. Your ₹{fmtMoney(maturingAmount)} is fully covered.
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ marginTop: '12px', fontSize: '10px', color: 'var(--text3)', textAlign: 'center' }}>
        Rates indicative. Verify on partner site before investing.
      </div>
    </div>
  );
}
