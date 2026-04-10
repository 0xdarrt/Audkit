import React, { useState, useMemo } from 'react';
import { PARTNERS } from '../config/partners';
import { Sparkles, RefreshCw, ExternalLink, AlertTriangle, Shield, TrendingUp, ChevronRight } from 'lucide-react';

const fmtMoney = (val) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val);

// ═══ LOCAL RULE-BASED RECOMMENDATION ENGINE ═══
// Generates the same structured output as the Claude API would, but entirely client-side.
function generateRecommendation(asset, allAssets) {
  const amount = Number(asset.amount || 0);
  const currentRate = Number(asset.rate || 0);

  // Portfolio analysis
  const totalPortfolio = allAssets.reduce((s, a) => s + Number(a.amount || 0), 0);
  const byType = {};
  allAssets.forEach(a => {
    const t = a.type || 'OTHER';
    byType[t] = (byType[t] || 0) + Number(a.amount || 0);
  });
  const fdPct = ((byType['FD'] || 0) / totalPortfolio * 100) || 0;
  const sgbPct = ((byType['SGB'] || 0) / totalPortfolio * 100) || 0;
  const mfPct = ((byType['MF'] || 0) / totalPortfolio * 100) || 0;
  const ppfPct = ((byType['PPF'] || 0) / totalPortfolio * 100) || 0;

  // Find best rate partner
  const bestPartner = [...PARTNERS].sort((a, b) => (b.rates['1yr'] || 0) - (a.rates['1yr'] || 0))[0];
  const bestRate = bestPartner?.rates['1yr'] || 7.5;
  const rateDelta = bestRate - currentRate;

  // TDS check
  const annualInterest = amount * bestRate / 100;
  const tdsWarning = annualInterest > 40000;

  // Build top recommendation
  let topRec;
  let alternatives = [];
  let warning = null;

  if (rateDelta > 0.3) {
    // Significant rate improvement available
    topRec = {
      instrument: 'Fixed Deposit',
      partner: bestPartner.name,
      rate: bestRate,
      reasoning: `Your current FD earns ${currentRate}%. ${bestPartner.name} offers ${bestRate}% — that's ₹${fmtMoney(Math.round(amount * rateDelta / 100))}/yr extra on ₹${fmtMoney(amount)}. ${bestPartner.dicgcInsured ? 'DICGC insured up to ₹5L.' : ''}`,
    };
  } else {
    topRec = {
      instrument: 'Fixed Deposit',
      partner: bestPartner.name,
      rate: bestRate,
      reasoning: `Your current rate of ${currentRate}% is competitive. Consider ${bestPartner.name} at ${bestRate}% for DICGC-insured safety. Renewal keeps your interest compounding.`,
    };
  }

  // Generate alternatives based on portfolio gaps
  if (sgbPct < 10 && amount >= 50000) {
    alternatives.push({
      instrument: 'Sovereign Gold Bond',
      rate: 2.5,
      note: `Only ${sgbPct.toFixed(0)}% of your portfolio is in gold. SGBs offer 2.5% + gold appreciation, tax-free at maturity.`,
    });
  }

  if (ppfPct < 15) {
    alternatives.push({
      instrument: 'PPF Top-up',
      rate: 7.1,
      note: `PPF at 7.1% is tax-free under 80C. Your PPF allocation is only ${ppfPct.toFixed(0)}% — consider topping up.`,
    });
  }

  // Add a second FD partner as alternative
  const secondBest = PARTNERS.filter(p => p.id !== bestPartner.id).sort((a, b) => (b.rates['1yr'] || 0) - (a.rates['1yr'] || 0))[0];
  if (secondBest) {
    alternatives.push({
      instrument: 'Fixed Deposit',
      rate: secondBest.rates['1yr'],
      note: `${secondBest.name} at ${secondBest.rates['1yr']}% — another DICGC-insured option.`,
    });
  }

  // Limit to 3 alternatives
  alternatives = alternatives.slice(0, 3);

  // TDS warning
  if (tdsWarning) {
    warning = `Annual interest on ₹${fmtMoney(amount)} at ${bestRate}% exceeds ₹40,000. TDS of 10% will apply. Submit Form 15G/H to avoid deduction if your total income is below taxable limit.`;
  }

  // FD concentration warning  
  if (fdPct > 70 && !warning) {
    warning = `${fdPct.toFixed(0)}% of your portfolio is in FDs. Consider diversifying into gold (SGB) or PPF for tax efficiency and inflation hedging.`;
  }

  return {
    topRecommendation: topRec,
    alternatives,
    warning,
    disclaimer: 'This is informational only, not SEBI-registered advice. Verify rates before investing.',
  };
}

export default function AIAdvisorCard({ asset, allAssets, isPremium, onPaywall }) {
  const [state, setState] = useState('idle'); // idle | loading | loaded
  const [recommendation, setRecommendation] = useState(null);

  const daysToMaturity = useMemo(() => {
    if (!asset?.maturity_date) return null;
    return Math.ceil((new Date(asset.maturity_date) - new Date()) / 86400000);
  }, [asset]);

  const handleGenerate = () => {
    if (!isPremium) {
      onPaywall?.();
      return;
    }

    setState('loading');

    // Simulate a brief "thinking" delay for UX realism
    setTimeout(() => {
      try {
        const rec = generateRecommendation(asset, allAssets || []);
        setRecommendation(rec);
        setState('loaded');
      } catch (e) {
        console.error('AI Advisor error:', e);
        setState('idle');
      }
    }, 1500);
  };

  const handleRefresh = () => {
    setState('idle');
    setRecommendation(null);
    setTimeout(() => handleGenerate(), 100);
  };

  // Find affiliate URL for recommended partner
  const getPartnerUrl = (partnerName) => {
    const p = PARTNERS.find(p => p.name === partnerName);
    return p?.affiliateUrl || '#';
  };

  if (!asset || asset.type !== 'FD' || !daysToMaturity || daysToMaturity <= 0 || daysToMaturity > 60) {
    return null;
  }

  return (
    <div className="card" style={{ padding: '20px', background: 'transparent', marginBottom: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(232, 197, 109, 0.15), rgba(169, 114, 252, 0.1))',
          border: '1px solid rgba(232, 197, 109, 0.2)',
        }}>
          <Sparkles size={14} color="var(--accent)" />
        </div>
        <div className="label" style={{ color: 'var(--text3)' }}>AI REINVESTMENT ADVISOR</div>
        <span style={{ fontSize: '9px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', background: 'rgba(169, 114, 252, 0.12)', color: 'var(--purple)' }}>SMART</span>
      </div>

      {/* ═══ IDLE STATE ═══ */}
      {state === 'idle' && (
        <div>
          <div style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '16px', lineHeight: '1.6' }}>
            Get a personalised reinvestment recommendation based on your portfolio composition, current rates, and tax implications.
          </div>
          <button
            className="btn-primary"
            onClick={handleGenerate}
            style={{ width: '100%', gap: '8px', position: 'relative', overflow: 'hidden' }}
          >
            <Sparkles size={14} />
            {isPremium ? 'Get AI reinvestment advice' : 'Unlock AI Advisor'}
            <ChevronRight size={14} />
          </button>
          {!isPremium && (
            <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text3)', marginTop: '8px' }}>
              <Shield size={10} style={{ verticalAlign: 'middle' }} /> Premium feature
            </div>
          )}
          {/* Disclaimer always visible */}
          <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '12px', lineHeight: '1.4', opacity: 0.7 }}>
            This is informational only, not SEBI-registered advice. Verify rates before investing.
          </div>
        </div>
      )}

      {/* ═══ LOADING STATE ═══ */}
      {state === 'loading' && (
        <div style={{ padding: '20px 0' }}>
          {/* Shimmer skeleton */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[100, 80, 60].map((w, i) => (
              <div key={i} style={{
                width: `${w}%`, height: '14px', borderRadius: '6px',
                background: 'linear-gradient(90deg, var(--bg) 25%, var(--bg3) 50%, var(--bg) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer-ai 1.5s infinite',
              }} />
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: 'var(--accent)' }}>
            <Sparkles size={12} style={{ verticalAlign: 'middle', marginRight: '6px', animation: 'spin 2s linear infinite' }} />
            Analysing your portfolio...
          </div>
          <style>{`
            @keyframes shimmer-ai {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          `}</style>
        </div>
      )}

      {/* ═══ LOADED STATE ═══ */}
      {state === 'loaded' && recommendation && (
        <div>
          {/* Top Recommendation */}
          <div style={{
            padding: '16px', borderRadius: '12px', marginBottom: '16px',
            background: 'linear-gradient(135deg, rgba(232, 197, 109, 0.06), rgba(232, 197, 109, 0.02))',
            border: '1px solid rgba(232, 197, 109, 0.15)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div className="label" style={{ color: 'var(--accent)', letterSpacing: '1px' }}>TOP RECOMMENDATION</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: 'var(--accent)', fontStyle: 'italic' }}>
                {recommendation.topRecommendation.rate}%
              </div>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>
              {recommendation.topRecommendation.instrument} — {recommendation.topRecommendation.partner}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: '1.6' }}>
              {recommendation.topRecommendation.reasoning}
            </div>
          </div>

          {/* Alternatives */}
          {recommendation.alternatives.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div className="label" style={{ color: 'var(--text3)', marginBottom: '10px', letterSpacing: '1px' }}>ALTERNATIVES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recommendation.alternatives.map((alt, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 12px', borderRadius: '10px',
                    background: 'var(--bg)', border: '1px solid var(--border)',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{alt.instrument}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{alt.note}</div>
                    </div>
                    <div className="code-val" style={{ fontSize: '14px', color: 'var(--green)', flexShrink: 0, marginLeft: '12px' }}>
                      {alt.rate}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning */}
          {recommendation.warning && (
            <div style={{
              padding: '12px 14px', borderRadius: '10px', marginBottom: '16px',
              background: 'rgba(232, 160, 109, 0.06)', border: '1px solid rgba(232, 160, 109, 0.15)',
              display: 'flex', gap: '10px', alignItems: 'flex-start',
            }}>
              <AlertTriangle size={14} color="var(--orange)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '11px', color: 'var(--orange)', lineHeight: '1.5' }}>{recommendation.warning}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <a
              href={getPartnerUrl(recommendation.topRecommendation.partner)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ flex: 1, textDecoration: 'none', textAlign: 'center', gap: '6px', fontSize: '12px' }}
            >
              <ExternalLink size={12} /> Open with {recommendation.topRecommendation.partner}
            </a>
            <button className="btn-ghost" onClick={handleRefresh} style={{ padding: '8px 12px' }}>
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Disclaimer */}
          <div style={{ fontSize: '10px', color: 'var(--text3)', lineHeight: '1.4', opacity: 0.7 }}>
            {recommendation.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
}
