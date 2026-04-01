import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { calculateHealthScore } from '../utils/healthScore';
import { CheckCircle } from 'lucide-react';

export default function ShareScoreCard({ assets, members, goals, userProfile, userName }) {
  const cardRef = useRef(null);
  const result = calculateHealthScore(assets, members, goals, userProfile || {});

  const topChecks = [...result.checks]
    .sort((a, b) => (b.points / b.max) - (a.points / a.max))
    .slice(0, 3);

  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0b0b0a',
        scale: 2,
        useCORS: true
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'audkit-family-score.png', { type: 'image/png' });

        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `Our Family Score: ${result.total}/100`,
              text: `Check out our family financial health score on Audkit!`
            });
          } catch (err) {
            // User cancelled share
          }
        } else {
          // Fallback: download
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'audkit-family-score.png';
          link.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  return (
    <div>
      {/* The card to be screenshotted */}
      <div
        ref={cardRef}
        style={{
          width: '400px', height: '210px', padding: '24px',
          background: 'linear-gradient(135deg, #0b0b0a, #151514)',
          borderRadius: '16px', border: '1px solid rgba(232, 197, 109, 0.3)',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          fontFamily: "'Sora', sans-serif", color: '#fff', position: 'relative', overflow: 'hidden'
        }}
      >
        {/* Decorative glow */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(232, 197, 109, 0.15), transparent)', borderRadius: '50%' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#e8c56d' }}>Audkit</div>
          <div style={{ fontSize: '11px', color: '#888' }}>{userName || 'Family'}</div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '72px', color: '#e8c56d', lineHeight: 1 }}>{result.total}</div>
          <div style={{
            display: 'inline-block', padding: '2px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', marginTop: '4px',
            background: result.total >= 70 ? 'rgba(78,203,141,0.2)' : 'rgba(232,197,109,0.2)',
            color: result.total >= 70 ? '#4ecb8d' : '#e8c56d'
          }}>
            {result.grade}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '8px' }}>
            {topChecks.map((c, i) => (
              <span key={i} style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(78,203,141,0.1)', color: '#4ecb8d', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <CheckCircle size={8} /> {c.name}
              </span>
            ))}
          </div>
          <div style={{ textAlign: 'center', fontSize: '9px', color: '#555' }}>
            audkit.app · Family Financial Health Score 2026
          </div>
        </div>
      </div>

      <button
        onClick={handleShare}
        className="btn-primary"
        style={{ marginTop: '16px', width: '100%', padding: '12px' }}
      >
        Download & Share Score Card
      </button>
    </div>
  );
}
