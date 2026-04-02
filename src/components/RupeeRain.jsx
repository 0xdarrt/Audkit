import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';

const fmtMoney = (val) => new Intl.NumberFormat('en-IN').format(Math.round(val));

export default function RupeeRain({ delta, onComplete }) {
  const [particles, setParticles] = useState([]);
  const [countVal, setCountVal] = useState(0);
  const [visible, setVisible] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    // Generate 40 particles
    const p = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: 14 + Math.random() * 14,
      opacity: 0.4 + Math.random() * 0.6,
      duration: 1.8 + Math.random() * 1.4,
      delay: Math.random() * 0.8,
      rotation: Math.random() * 720 - 360,
    }));
    setParticles(p);

    // Fire confetti
    const end = Date.now() + 1500;
    const colors = ['#e8c56d', '#4ecb8d', '#ffffff'];
    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60 + Math.random() * 60,
        spread: 55 + Math.random() * 30,
        origin: { x: Math.random(), y: Math.random() * 0.3 },
        colors,
        disableForReducedMotion: true,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();

    // Count-up animation
    const countDuration = 2000;
    const countStart = performance.now();
    const target = Math.abs(delta);
    const animateCount = (now) => {
      const elapsed = now - countStart;
      const progress = Math.min(elapsed / countDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCountVal(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(animateCount);
    };
    requestAnimationFrame(animateCount);

    // Fade out and remove
    const fadeTimer = setTimeout(() => setVisible(false), 2800);
    const removeTimer = setTimeout(() => onComplete?.(), 3500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible && countVal >= Math.abs(delta)) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none',
        opacity: visible ? 1 : 0, transition: 'opacity 0.7s ease-out',
      }}
    >
      {/* Counter overlay */}
      <div style={{
        position: 'absolute', top: '60px', left: '50%', transform: 'translateX(-50%)',
        textAlign: 'center', zIndex: 10000,
      }}>
        <div style={{
          fontFamily: "'DM Serif Display', serif", fontSize: '36px', color: '#e8c56d',
          textShadow: '0 0 30px rgba(232, 197, 109, 0.5)',
          letterSpacing: '-1px',
        }}>
          +₹{fmtMoney(countVal)}
        </div>
        <div style={{
          fontFamily: "'Sora', sans-serif", fontSize: '13px', color: 'rgba(232, 197, 109, 0.7)',
          marginTop: '4px',
        }}>
          this month 🎉
        </div>
      </div>

      {/* Rupee particles */}
      {particles.map(p => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: '-30px',
            fontSize: `${p.size}px`,
            color: '#e8c56d',
            opacity: p.opacity,
            fontFamily: "'DM Serif Display', serif",
            fontWeight: 'bold',
            animation: `rupee-fall ${p.duration}s ${p.delay}s ease-in forwards`,
            willChange: 'transform',
          }}
        >
          ₹
        </span>
      ))}

      {/* Keyframes injected via style tag */}
      <style>{`
        @keyframes rupee-fall {
          0% { transform: translateY(-30px) rotate(0deg); opacity: 1; }
          80% { opacity: 0.8; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
