import React, { useEffect, useState, useRef } from 'react';
import { calculateHealthScore } from '../utils/healthScore';
import { useAuth } from '../context/AuthContext';
import ShareScoreCard from './ShareScoreCard';
import { Lock, Share2, CheckCircle, AlertTriangle, XCircle, TrendingDown, X } from 'lucide-react';

const fmtMoney = (val) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val);

export default function HealthScoreWidget({ assets, members, goals, onPaywall }) {
  const { isPremium, user } = useAuth();
  const [animatedScore, setAnimatedScore] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const scoreRef = useRef(null);

  const result = calculateHealthScore(assets, members, goals, {});

  // Animate score on mount
  useEffect(() => {
    let start = 0;
    const end = result.total;
    const duration = 1200;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setAnimatedScore(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [result.total]);

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (animatedScore / 100) * circumference;

  const getStatusIcon = (check) => {
    const pct = check.points / check.max;
    if (pct >= 0.8) return <CheckCircle size={14} color="var(--green)" />;
    if (pct >= 0.4) return <AlertTriangle size={14} color="var(--accent)" />;
    return <XCircle size={14} color="var(--red)" />;
  };

  const getStatusColor = (check) => {
    const pct = check.points / check.max;
    if (pct >= 0.8) return 'var(--green)';
    if (pct >= 0.4) return 'var(--accent)';
    return 'var(--red)';
  };

  return (
    <div className="card" style={{ marginBottom: '40px', padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 className="section-title" style={{ fontSize: '18px' }}>Family Health Score</h3>
        {isPremium ? (
          <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: '11px', gap: '6px' }} onClick={() => setShareOpen(true)}>
            <Share2 size={12} /> Share
          </button>
        ) : (
          <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
            <Lock size={10} /> Upgrade to share
          </span>
        )}
      </div>

      {/* ═══ WEALTH PULSE ═══ */}
      {(() => {
        const score = result.total;
        const orbR = 20 + (score / 100) * 40;
        const pulseSpeed = Math.max(1.5, 4 - score / 50);
        const totalPortfolio = assets.reduce((s, a) => s + Number(a.amount || 0), 0);
        
        const orbitalTypes = [
          { type: 'FD', color: '#6db0e8', r: 80, speed: 20 },
          { type: 'SGB', color: '#e8c56d', r: 95, speed: 35 },
          { type: 'MF', color: '#4ecb8d', r: 110, speed: 28 },
        ].map(o => {
          const typeTotal = assets.filter(a => a.type === o.type).reduce((s, a) => s + Number(a.amount || 0), 0);
          const pct = totalPortfolio > 0 ? (typeTotal / totalPortfolio) * 100 : 0;
          return { ...o, pct };
        }).filter(o => o.pct > 0);

        return (
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <svg viewBox="0 0 400 240" width="400" height="240" style={{ maxWidth: '100%' }}>
              <defs>
                <radialGradient id="orb-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#e8c56d" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#e8c56d" stopOpacity="0" />
                </radialGradient>
              </defs>
              
              {/* Soft halo for high scores */}
              {score > 80 && (
                <circle cx="200" cy="120" r={orbR + 25} fill="rgba(232, 197, 109, 0.04)" />
              )}
              {score > 60 && (
                <circle cx="200" cy="120" r={orbR + 15} fill="url(#orb-glow)" />
              )}

              {/* Orbital Rings */}
              {orbitalTypes.map((o, i) => {
                const circumference = 2 * Math.PI * o.r;
                const dashLen = circumference * (o.pct / 100);
                const sw = 2 + (o.pct / 100) * 8;
                return (
                  <g key={o.type} style={{
                    transformOrigin: '200px 120px',
                    animation: `orbit-spin ${o.speed}s linear infinite${i % 2 === 1 ? ' reverse' : ''}`
                  }}>
                    {/* Faint full ring */}
                    <circle cx="200" cy="120" r={o.r} fill="none"
                      stroke={o.color} strokeOpacity="0.06" strokeWidth={sw * 0.5} />
                    {/* Active arc */}
                    <circle cx="200" cy="120" r={o.r} fill="none"
                      stroke={o.color} strokeOpacity="0.5" strokeWidth={sw}
                      strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dasharray 1.5s ease-out' }}
                    />
                  </g>
                );
              })}

              {/* Central orb */}
              <circle cx="200" cy="120" r={orbR} 
                fill="rgba(232, 197, 109, 0.12)" 
                stroke="#e8c56d" strokeWidth="1.5" strokeOpacity="0.6"
                style={{
                  transformOrigin: '200px 120px',
                  animation: `breathe ${pulseSpeed}s ease-in-out infinite`
                }}
              />

              {/* Inner shimmer ring */}
              <circle cx="200" cy="120" r={orbR * 0.6}
                fill="none" stroke="#e8c56d" strokeWidth="0.5" strokeOpacity="0.2"
                strokeDasharray="4 6"
                style={{
                  transformOrigin: '200px 120px',
                  animation: 'orbit-spin 8s linear infinite reverse'
                }}
              />

              {/* Score text */}
              <text x="200" y="115" textAnchor="middle" dominantBaseline="central"
                fontFamily="'DM Serif Display', serif" fontSize="32" fill="#e8c56d"
                style={{ textShadow: '0 0 20px rgba(232, 197, 109, 0.3)' }}
              >
                {animatedScore}
              </text>
              <text x="200" y="140" textAnchor="middle" dominantBaseline="central"
                fontFamily="'Sora', sans-serif" fontSize="11" fill="#9e9b93"
                letterSpacing="2"
              >
                {result.grade}
              </text>

              {/* Type labels on orbital rings */}
              {orbitalTypes.map(o => (
                <text key={`lbl-${o.type}`} x="200" y={120 - o.r - 6} textAnchor="middle"
                  fontFamily="'Sora', sans-serif" fontSize="8" fill={o.color} fillOpacity="0.5"
                >
                  {o.type} {o.pct.toFixed(0)}%
                </text>
              ))}
            </svg>

            <style>{`
              @keyframes breathe {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.08); }
              }
              @keyframes orbit-spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        );
      })()}

      <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Score Ring */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '180px' }}>
          <div style={{ position: 'relative', width: '180px', height: '180px' }}>
            <svg width="180" height="180" style={{ transform: 'rotate(-90deg)' }}>
              <circle stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="transparent" r={radius} cx="90" cy="90" />
              <circle
                stroke="var(--accent)"
                strokeWidth="12"
                fill="transparent"
                r={radius}
                cx="90"
                cy="90"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
              />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '48px', color: 'var(--accent)' }}>{animatedScore}</div>
              <div style={{ fontSize: '12px', color: 'var(--text3)', letterSpacing: '1px' }}>/ 100</div>
            </div>
          </div>
          <div style={{
            marginTop: '12px', padding: '4px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '14px',
            background: result.total >= 70 ? 'rgba(78,203,141,0.1)' : result.total >= 50 ? 'rgba(232,197,109,0.1)' : 'rgba(232,104,90,0.1)',
            color: result.total >= 70 ? 'var(--green)' : result.total >= 50 ? 'var(--accent)' : 'var(--red)'
          }}>
            Grade {result.grade}
          </div>
        </div>

        {/* Checks Breakdown */}
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ display: 'grid', gap: '8px' }}>
            {result.checks.map((check, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                  background: 'var(--bg2)', borderRadius: '10px', border: '1px solid var(--border)',
                  filter: !isPremium ? 'blur(3px)' : 'none',
                  pointerEvents: !isPremium ? 'none' : 'auto'
                }}
              >
                {getStatusIcon(check)}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '600' }}>{check.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{check.label}</div>
                </div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '14px', color: getStatusColor(check) }}>
                  {check.points}/{check.max}
                </div>
              </div>
            ))}
          </div>

          {!isPremium && (
            <div
              onClick={() => onPaywall?.()}
              style={{
                marginTop: '16px', padding: '14px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer',
                background: 'rgba(232, 197, 109, 0.08)', border: '1px solid rgba(232, 197, 109, 0.2)'
              }}
            >
              <Lock size={14} color="var(--accent)" style={{ marginBottom: '4px' }} />
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--accent)' }}>Unlock full breakdown — upgrade to Premium</div>
            </div>
          )}

          {/* Insights for Premium Users */}
          {isPremium && result.insights.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingDown size={12} /> What's dragging your score down?
              </div>
              <div style={{ display: 'grid', gap: '8px' }}>
                {result.insights.map((ins, i) => (
                  <div key={i} style={{
                    padding: '10px 14px', borderRadius: '10px', fontSize: '12px',
                    background: 'rgba(232, 104, 90, 0.05)', border: '1px solid rgba(232, 104, 90, 0.15)',
                    color: 'var(--text2)'
                  }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--text)' }}>{ins.check}:</span> {ins.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {shareOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShareOpen(false) }}>
          <div className="modal-box fade-in" style={{ maxWidth: '460px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="section-title">Share Your Score</h3>
              <button className="btn-ghost" style={{ padding: '6px', border: 'none' }} onClick={() => setShareOpen(false)}><X size={18} /></button>
            </div>
            <ShareScoreCard
              assets={assets}
              members={members}
              goals={goals}
              userProfile={{}}
              userName={user?.email?.split('@')[0] || 'Family'}
            />
          </div>
        </div>
      )}
    </div>
  );
}
