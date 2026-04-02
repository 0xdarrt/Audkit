import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../hooks/useData';
import { supabase } from '../utils/supabase';
import PaywallModal from '../components/PaywallModal';
import { Trash, X, LayoutGrid, Orbit } from 'lucide-react';

const typeColors = {
  'FD': '#6db0e8', 'LIC': '#b48de8', 'SGB': '#e8c56d', 'MF': '#4ecb8d', 'PPF': '#e8685a',
  'CHIT': '#e8a06d', 'LOAN_GIVEN': '#e8685a'
};

const PLANET_POSITIONS = [
  { cx: 50, cy: 50 },
  { cx: 22, cy: 32 },
  { cx: 78, cy: 28 },
  { cx: 25, cy: 72 },
  { cx: 75, cy: 68 },
  { cx: 50, cy: 18 },
  { cx: 50, cy: 82 },
];

const ORBIT_SPEEDS = [12, 16, 20, 14, 18, 22, 10];

const fmtMoney = (val) => new Intl.NumberFormat('en-IN').format(val);

export default function Family() {
  const { user, isPremium } = useAuth();
  const { members, assets, loading, reloadData } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedColor, setSelectedColor] = useState('');
  const [viewMode, setViewMode] = useState('cards');
  const [detailMember, setDetailMember] = useState(null);

  const PREDEFINED_COLORS = ['#e8c56d', '#4ecb8d', '#e8685a', '#6db0e8', '#b48de8'];

  if(loading) return <div className="loader-container">Loading family hub...</div>;

  const totNW = assets.reduce((s,a)=>s+Number(a.amount), 0);
  const sortedMembers = [...members].sort((a,b) => {
    const sumA = assets.filter(x => x.members && x.members.some(mem => mem.id === a.id)).reduce((s,v)=>s+Number(v.amount), 0);
    const sumB = assets.filter(x => x.members && x.members.some(mem => mem.id === b.id)).reduce((s,v)=>s+Number(v.amount), 0);
    return sumB - sumA;
  });

  const handleOpenAddMember = () => {
    if (!isPremium && members.length >= 2) {
      setPaywallOpen(true);
    } else {
      setModalOpen(true);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const initials = name.substring(0, 2).toUpperCase();
    
    const finalColor = selectedColor || PREDEFINED_COLORS[Math.floor(Math.random() * PREDEFINED_COLORS.length)];
    
    try {
      const { error } = await supabase.from('members').insert([{
        user_id: user.id,
        name: name,
        role: formData.get('role'),
        status: 'active',
        initials: initials,
        avatar_color: finalColor
      }]);
      if(error) throw error;
      setModalOpen(false);
      setSelectedColor('');
      e.target.reset();
      reloadData();
    } catch(err) {
      alert("Error adding member: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this family member? Their asset assignments will be unlinked.')) return;
    try {
      await supabase.from('asset_members').delete().eq('member_id', memberId);
      await supabase.from('members').delete().eq('id', memberId);
      reloadData();
    } catch (err) {
      alert('Error removing member: ' + err.message);
    }
  };

  // Get member assets helper
  const getMemberAssets = (memberId) => assets.filter(a => a.members && a.members.some(mem => mem.id === memberId));
  const getMemberNetWorth = (memberId) => getMemberAssets(memberId).reduce((s, a) => s + Number(a.amount || 0), 0);

  return (
    <div className="screen fade-in active">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <h2 className="page-heading">Family Hub</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* View Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: '10px', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <button
              className="btn-ghost"
              style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', boxShadow: 'none', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', background: viewMode === 'cards' ? 'var(--bg3)' : 'transparent', color: viewMode === 'cards' ? 'var(--accent)' : 'var(--text3)' }}
              onClick={() => setViewMode('cards')}
            >
              <LayoutGrid size={14} /> Cards
            </button>
            <button
              className="btn-ghost"
              style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', boxShadow: 'none', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', background: viewMode === 'constellation' ? 'var(--bg3)' : 'transparent', color: viewMode === 'constellation' ? 'var(--accent)' : 'var(--text3)' }}
              onClick={() => setViewMode('constellation')}
            >
              <Orbit size={14} /> Constellation
            </button>
          </div>
          <button className="btn-primary" onClick={handleOpenAddMember}>Add Member</button>
        </div>
      </div>

      {/* ═══ CONSTELLATION VIEW ═══ */}
      {viewMode === 'constellation' && (
        <div style={{ position: 'relative', width: '100%', minHeight: '520px', marginBottom: '40px', borderRadius: '24px', border: '1px solid var(--border)', overflow: 'hidden', background: 'radial-gradient(ellipse at center, rgba(232,197,109,0.02) 0%, transparent 70%)' }}>

          {/* Connection Lines SVG */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            {sortedMembers.map((m, i) => {
              const pos = PLANET_POSITIONS[i] || { cx: 50, cy: 50 };
              return sortedMembers.slice(i + 1).map((m2, j) => {
                const pos2 = PLANET_POSITIONS[i + j + 1] || { cx: 50, cy: 50 };
                return (
                  <line key={`line-${m.id}-${m2.id}`}
                    x1={`${pos.cx}%`} y1={`${pos.cy}%`}
                    x2={`${pos2.cx}%`} y2={`${pos2.cy}%`}
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth="1"
                    strokeDasharray="4 8"
                  />
                );
              });
            })}
          </svg>

          {/* Planets */}
          {sortedMembers.map((m, idx) => {
            const pos = PLANET_POSITIONS[idx] || { cx: 50, cy: 50 };
            const memberNW = getMemberNetWorth(m.id);
            const memberAssets = getMemberAssets(m.id);
            const sizeBase = 56;
            const sizeScale = totNW > 0 ? (memberNW / totNW) * 40 : 0;
            const planetSize = sizeBase + sizeScale;
            const glowIntensity = totNW > 0 ? (memberNW / totNW) * 0.4 : 0.1;
            const orbitR = planetSize * 0.85 + 16;
            const orbitSpeed = ORBIT_SPEEDS[idx] || 14;

            return (
              <div key={m.id} style={{
                position: 'absolute',
                left: `${pos.cx}%`, top: `${pos.cy}%`,
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer', zIndex: 2,
              }}
                onClick={() => setDetailMember(m)}
              >
                {/* Satellite orbit container */}
                <div style={{
                  position: 'absolute',
                  width: `${orbitR * 2 + 16}px`, height: `${orbitR * 2 + 16}px`,
                  left: `${planetSize / 2 - orbitR - 8}px`,
                  top: `${planetSize / 2 - orbitR - 8}px`,
                  animation: `constellation-orbit ${orbitSpeed}s linear infinite`,
                }}>
                  {memberAssets.map((a, ai) => {
                    const angle = (ai / Math.max(memberAssets.length, 1)) * 2 * Math.PI;
                    const sx = (orbitR + 8) + Math.cos(angle) * orbitR;
                    const sy = (orbitR + 8) + Math.sin(angle) * orbitR;
                    return (
                      <div key={a.id} title={`${a.name} (${a.type})`} style={{
                        position: 'absolute',
                        left: `${sx}px`, top: `${sy}px`,
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: typeColors[a.type] || '#fff',
                        boxShadow: `0 0 6px ${typeColors[a.type] || '#fff'}`,
                        transform: 'translate(-50%, -50%)',
                      }} />
                    );
                  })}
                </div>

                {/* Orbit ring (faint) */}
                <div style={{
                  position: 'absolute',
                  width: `${orbitR * 2}px`, height: `${orbitR * 2}px`,
                  left: `${planetSize / 2 - orbitR}px`,
                  top: `${planetSize / 2 - orbitR}px`,
                  border: '1px solid rgba(255,255,255,0.04)',
                  borderRadius: '50%', pointerEvents: 'none',
                }} />

                {/* Planet body */}
                <div style={{
                  width: `${planetSize}px`, height: `${planetSize}px`,
                  borderRadius: '50%',
                  background: `radial-gradient(circle at 40% 35%, ${m.avatar_color || '#e8c56d'}22, ${m.avatar_color || '#e8c56d'}08)`,
                  border: `1.5px solid ${m.avatar_color || 'rgba(232,197,109,0.4)'}`,
                  boxShadow: `0 0 ${20 + glowIntensity * 30}px rgba(232,197,109,${glowIntensity})`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  position: 'relative', zIndex: 3,
                }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: `${Math.max(14, planetSize * 0.28)}px`, color: m.avatar_color || '#e8c56d' }}>
                    {m.initials}
                  </span>
                </div>

                {/* Name label below planet */}
                <div style={{ textAlign: 'center', marginTop: '6px', position: 'relative', zIndex: 3 }}>
                  <div style={{ fontFamily: "'Sora', sans-serif", fontSize: '11px', color: 'var(--text)', fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text3)' }}>₹{fmtMoney(memberNW)}</div>
                </div>
              </div>
            );
          })}

          <style>{`
            @keyframes constellation-orbit {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* ═══ MEMBER DETAIL PANEL (from constellation click) ═══ */}
      {detailMember && (
        <>
          <div className="drawer-backdrop fade-in" onClick={() => setDetailMember(null)} />
          <div className="detail-drawer slide-in" style={{ width: '380px', right: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 0' }}>
              <h3 className="section-title">Member Details</h3>
              <button className="btn-ghost" style={{ padding: '6px', border: 'none' }} onClick={() => setDetailMember(null)}><X size={18} /></button>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div className="avatar" style={{ background: detailMember.avatar_color || 'var(--accent)', width: '72px', height: '72px', fontSize: '26px', margin: '0 auto 12px', border: '2px solid rgba(255,255,255,0.1)' }}>
                  {detailMember.initials}
                </div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px' }}>{detailMember.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>{detailMember.role}</div>
              </div>

              <div className="card" style={{ background: 'var(--bg3)', marginBottom: '16px' }}>
                <div className="label" style={{ color: 'var(--text3)' }}>NET WORTH</div>
                <div className="code-val" style={{ fontSize: '28px', color: detailMember.avatar_color || 'var(--accent)' }}>₹{fmtMoney(getMemberNetWorth(detailMember.id))}</div>
                <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>
                  {totNW > 0 ? ((getMemberNetWorth(detailMember.id)/totNW)*100).toFixed(1) : 0}% of family wealth
                </div>
              </div>

              <div className="label" style={{ color: 'var(--text3)', marginBottom: '12px' }}>ASSETS ({getMemberAssets(detailMember.id).length})</div>
              <div style={{ display: 'grid', gap: '8px' }}>
                {getMemberAssets(detailMember.id).map(a => {
                  const hex = typeColors[a.type] || '#fff';
                  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
                  return (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'var(--bg2)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: hex, boxShadow: `0 0 6px ${hex}` }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{a.name}</div>
                        <span style={{ fontSize: '10px', color: hex, background: `rgba(${r},${g},${b},0.1)`, padding: '1px 6px', borderRadius: '4px' }}>{a.type}</span>
                      </div>
                      <div className="code-val" style={{ fontSize: '13px' }}>₹{fmtMoney(a.amount)}</div>
                    </div>
                  );
                })}
                {getMemberAssets(detailMember.id).length === 0 && (
                  <div style={{ fontSize: '13px', color: 'var(--text3)', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>No assets assigned yet</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══ CARDS VIEW ═══ */}
      {viewMode === 'cards' && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {sortedMembers.map(m => {
          const aSub = assets.filter(a => a.members && a.members.some(mem => mem.id === m.id));
          const sum = aSub.reduce((s,a)=>s+Number(a.amount), 0);
          const pct = totNW > 0 ? ((sum/totNW)*100) : 0;
          
          // SVG calculations
          const radius = 40;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (pct / 100) * circumference;
          
          return (
            <div key={m.id} className="flip-card-container" style={{ height: '240px', position: 'relative' }}>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteMember(m.id); }}
                className="btn-ghost"
                style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10, padding: '6px', border: 'none', background: 'rgba(0,0,0,0.4)', borderRadius: '50%', color: 'var(--red)', cursor: 'pointer', opacity: 0.6, transition: '0.2s' }}
                title="Remove member"
              >
                <Trash size={14} />
              </button>
              <div className="flip-card-inner">
                {/* FRONT: Identity */}
                <div className="flip-card-front">
                  <div className="avatar" style={{ background: m.avatar_color || 'var(--accent)', width: '70px', height: '70px', fontSize: '24px', marginBottom: '16px', border: '2px solid rgba(255,255,255,0.1)' }}>
                    {m.initials}
                    <div className={`status-dot ${m.status}`} style={{ width: '16px', height: '16px', border: '3px solid var(--bg2)' }}></div>
                  </div>
                  <div className="section-title" style={{ fontSize: '18px' }}>{m.name}</div>
                  <div className="label" style={{ color: 'var(--text2)', marginTop: '4px' }}>{m.role}</div>
                </div>

                {/* BACK: SVG Radial Interactive Ring */}
                <div className="flip-card-back" style={{ textAlign: 'center', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                  <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 12px' }}>
                    <svg height="100" width="100" style={{ transform: 'rotate(-90deg)' }}>
                      <circle stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" r={radius} cx="50" cy="50" />
                      <circle 
                        stroke={m.avatar_color || 'var(--accent)'} 
                        strokeWidth="8" 
                        fill="transparent" 
                        r={radius} 
                        cx="50" 
                        cy="50" 
                        strokeDasharray={circumference}
                        style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-out 0.2s', strokeLinecap: 'round' }}
                      />
                    </svg>
                    <div style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{pct.toFixed(0)}%</div>
                      <div style={{ fontSize: '9px', color: 'var(--text2)' }}>SHARE</div>
                    </div>
                  </div>
                  
                  <div className="net-worth-number" style={{ fontSize: '22px', color: m.avatar_color || 'var(--accent)' }}>₹{fmtMoney(sum)}</div>
                  <div className="label" style={{ color: 'var(--text2)', marginTop: '4px', fontSize: '10px' }}>{aSub.length} Assets Contributed</div>
                </div>
              </div>
            </div>
          );
        })}

        <div className="card" style={{ border: '2px dashed var(--border2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', height: '240px', background: 'transparent', boxShadow: 'none' }} onClick={handleOpenAddMember}>
          <div className="avatar" style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text2)', marginBottom: '16px', width: '64px', height: '64px', fontSize: '24px' }}>+</div>
          <div className="section-title" style={{ fontSize: '16px', color: 'var(--text2)' }}>Add Member</div>
        </div>
      </div>
      )}

      {paywallOpen && <PaywallModal onClose={() => setPaywallOpen(false)} />}

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="modal-box fade-in">
            <h2 className="section-title" style={{ marginBottom: '24px' }}>Add New Family Member</h2>
            <form onSubmit={handleAddMember} style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label className="label" style={{ color: 'var(--text2)', display: 'block', marginBottom: '6px' }}>Full Name</label>
                <input name="name" type="text" className="form-control" placeholder="e.g. Ramesh Kumar" required />
              </div>
              <div>
                <label className="label" style={{ color: 'var(--text2)', display: 'block', marginBottom: '6px' }}>Relation / Role</label>
                <input name="role" type="text" className="form-control" placeholder="e.g. Father, Spouse" required />
              </div>
              <div>
                <label className="label" style={{ color: 'var(--text2)', display: 'block', marginBottom: '8px' }}>Avatar Color</label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {PREDEFINED_COLORS.map(c => (
                    <div 
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      style={{ 
                        width: '32px', height: '32px', borderRadius: '50%', background: c, 
                        cursor: 'pointer', border: selectedColor === c ? '3px solid #fff' : '2px solid transparent',
                        boxShadow: selectedColor === c ? '0 0 10px '+c : '0 2px 5px rgba(0,0,0,0.5)',
                        transition: 'all 0.2s', transform: selectedColor === c ? 'scale(1.1)' : 'scale(1)'
                      }} 
                    />
                  ))}
                </div>
                {!selectedColor && <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '8px', fontStyle: 'italic' }}>If unselected, a random theme color will be applied.</div>}
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '16px' }} disabled={saving}>
                {saving ? 'Adding...' : 'Add Member'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
