import React, { useState, useEffect } from 'react';
import { useGoals } from '../hooks/useGoals';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash, Target, X } from 'lucide-react';

const fmtMoney = (val) => {
  const num = Number(val);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${num}`;
};

const PRESETS = [
  { icon: '🎓', name: "Children's Education", target_amount: 1000000, color: '#6db0e8' },
  { icon: '💒', name: 'Wedding Fund', target_amount: 1500000, color: '#b48de8' },
  { icon: '🏠', name: 'Home Purchase', target_amount: 5000000, color: '#4ecb8d' },
  { icon: '🛡', name: 'Emergency Fund', target_amount: 300000, color: '#e8685a' },
  { icon: '✈', name: 'Retirement Corpus', target_amount: 10000000, color: '#e8c56d' },
  { icon: '✏', name: 'Custom Goal', target_amount: 0, color: '#a8c7fa' },
];

export default function GoalsSection({ assets, onPaywall }) {
  const { goals, loading, createGoal, deleteGoal } = useGoals();
  const { isPremium } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [customName, setCustomName] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [saving, setSaving] = useState(false);

  // Calculate progress for each goal
  const goalsWithProgress = goals.map(goal => {
    const linkedAssets = (assets || []).filter(a => a.goal_id === goal.id);
    const current = linkedAssets.reduce((sum, a) => sum + Number(a.amount), 0);
    const pct = goal.target_amount > 0 ? Math.min((current / goal.target_amount) * 100, 100) : 0;
    
    let status = 'on-track';
    let statusText = 'On track';
    if (goal.target_date) {
      const monthsLeft = Math.max(1, Math.ceil((new Date(goal.target_date) - new Date()) / (30 * 86400000)));
      const remaining = goal.target_amount - current;
      const monthlyRequired = remaining / monthsLeft;
      const yearsLeft = (monthsLeft / 12).toFixed(1);
      
      if (remaining <= 0) {
        status = 'complete';
        statusText = '🎉 Goal achieved!';
      } else if (monthlyRequired > (goal.target_amount / 60)) {
        status = 'behind';
        statusText = `Behind · Need ₹${fmtMoney(remaining)} more · ${yearsLeft}y left`;
      } else {
        statusText = `On track · ${yearsLeft}y left`;
      }
    }
    
    return { ...goal, current, pct, status, statusText, linkedAssets };
  });

  const handleCreate = async () => {
    if (!isPremium && goals.length >= 2) {
      onPaywall?.();
      return;
    }
    setModalOpen(true);
  };

  const handleSaveGoal = async () => {
    if (!selectedPreset) return;
    setSaving(true);
    try {
      const isCustom = selectedPreset.name === 'Custom Goal';
      await createGoal({
        name: isCustom ? customName : selectedPreset.name,
        target_amount: isCustom ? Number(customAmount) : (Number(customAmount) || selectedPreset.target_amount),
        target_date: customDate || null,
        icon: selectedPreset.icon,
        color: selectedPreset.color
      });
      setModalOpen(false);
      setSelectedPreset(null);
      setCustomName('');
      setCustomAmount('');
      setCustomDate('');
    } catch (err) {
      alert('Error creating goal: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Delete this goal? Assets linked to it will be unlinked.')) return;
    try {
      await deleteGoal(id);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  if (loading) return null;

  return (
    <div style={{ marginBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 className="section-title" style={{ fontSize: '18px' }}>Your Goals</h3>
        <button className="btn-ghost" style={{ padding: '6px 14px', fontSize: '12px', gap: '6px' }} onClick={handleCreate}>
          <Plus size={14} /> New Goal
        </button>
      </div>

      {goalsWithProgress.length === 0 ? (
        <div
          className="card"
          style={{ padding: '40px', textAlign: 'center', borderStyle: 'dashed', cursor: 'pointer' }}
          onClick={handleCreate}
        >
          <Target size={32} color="var(--text3)" style={{ marginBottom: '12px' }} />
          <div style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '4px' }}>Set a goal to see your progress</div>
          <div style={{ color: 'var(--accent)', fontSize: '13px', fontWeight: 'bold' }}>Create first goal →</div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '8px' }}>
          {goalsWithProgress.map((g, idx) => (
            <div
              key={g.id}
              className="card interactive-card fade-in"
              style={{
                minWidth: '260px', flex: '0 0 auto', padding: '24px', position: 'relative',
                background: `linear-gradient(135deg, rgba(${parseInt(g.color?.slice(1,3),16)||30},${parseInt(g.color?.slice(3,5),16)||30},${parseInt(g.color?.slice(5,7),16)||30},0.08), var(--bg2))`,
                animationDelay: `${idx * 0.1}s`
              }}
            >
              <button
                onClick={() => handleDeleteGoal(g.id)}
                style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: '4px', opacity: 0.5 }}
              >
                <Trash size={12} />
              </button>

              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{g.icon}</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '16px', marginBottom: '4px' }}>{g.name}</div>
              
              {/* Progress Bar */}
              <div style={{ width: '100%', height: '8px', background: 'var(--bg)', borderRadius: '4px', marginTop: '16px', marginBottom: '8px', overflow: 'hidden' }}>
                <div style={{
                  width: `${g.pct}%`, height: '100%', borderRadius: '4px',
                  background: g.status === 'complete' ? 'var(--green)' : 'var(--accent)',
                  transition: 'width 1s ease-out'
                }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text2)', marginBottom: '12px' }}>
                <span>{fmtMoney(g.current)} of {fmtMoney(g.target_amount)}</span>
                <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{g.pct.toFixed(0)}%</span>
              </div>

              <div style={{
                fontSize: '11px', padding: '4px 10px', borderRadius: '6px', display: 'inline-block',
                background: g.status === 'complete' ? 'rgba(78,203,141,0.1)' : g.status === 'behind' ? 'rgba(232,104,90,0.1)' : 'rgba(232,197,109,0.1)',
                color: g.status === 'complete' ? 'var(--green)' : g.status === 'behind' ? 'var(--red)' : 'var(--accent)'
              }}>
                {g.statusText}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Goal Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="modal-box fade-in" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 className="section-title">Create a Goal</h2>
              <button className="btn-ghost" style={{ padding: '6px', border: 'none' }} onClick={() => setModalOpen(false)}><X size={18} /></button>
            </div>

            {!selectedPreset ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                {PRESETS.map(preset => (
                  <div
                    key={preset.name}
                    className="card interactive-card"
                    onClick={() => {
                      setSelectedPreset(preset);
                      if (preset.name !== 'Custom Goal') setCustomAmount(String(preset.target_amount));
                    }}
                    style={{ padding: '20px', textAlign: 'center', cursor: 'pointer', border: `1px solid ${preset.color}22` }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>{preset.icon}</div>
                    <div style={{ fontSize: '12px', fontWeight: '600' }}>{preset.name}</div>
                    {preset.target_amount > 0 && (
                      <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>{fmtMoney(preset.target_amount)}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '32px' }}>{selectedPreset.icon}</span>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{selectedPreset.name === 'Custom Goal' ? 'Your Custom Goal' : selectedPreset.name}</div>
                    <button style={{ fontSize: '11px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => setSelectedPreset(null)}>← Change goal type</button>
                  </div>
                </div>

                {selectedPreset.name === 'Custom Goal' && (
                  <div>
                    <label className="label" style={{ color: 'var(--text2)', display: 'block', marginBottom: '6px' }}>Goal Name</label>
                    <input type="text" className="form-control" placeholder="e.g. New Car" value={customName} onChange={e => setCustomName(e.target.value)} />
                  </div>
                )}

                <div>
                  <label className="label" style={{ color: 'var(--text2)', display: 'block', marginBottom: '6px' }}>Target Amount (₹)</label>
                  <input type="number" className="form-control code-val" value={customAmount} onChange={e => setCustomAmount(e.target.value)} />
                </div>

                <div>
                  <label className="label" style={{ color: 'var(--text2)', display: 'block', marginBottom: '6px' }}>Target Date (optional)</label>
                  <input type="date" className="form-control" value={customDate} onChange={e => setCustomDate(e.target.value)} />
                </div>

                <button className="btn-primary" style={{ marginTop: '8px' }} onClick={handleSaveGoal} disabled={saving || (selectedPreset.name === 'Custom Goal' && !customName)}>
                  {saving ? 'Creating...' : 'Create Goal'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
