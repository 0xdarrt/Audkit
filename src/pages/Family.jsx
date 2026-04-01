import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../hooks/useData';
import { supabase } from '../utils/supabase';
import PaywallModal from '../components/PaywallModal';
import { Trash } from 'lucide-react';

const fmtMoney = (val) => new Intl.NumberFormat('en-IN').format(val);

export default function Family() {
  const { user, isPremium } = useAuth();
  const { members, assets, loading, reloadData } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedColor, setSelectedColor] = useState('');

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

  return (
    <div className="screen fade-in active">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 className="page-heading">Family Hub</h2>
        <button className="btn-primary" onClick={handleOpenAddMember}>Add Member</button>
      </div>

      {/* 3D Flip Cards Grid - Now includes SVG Rings */}
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
