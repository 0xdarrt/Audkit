import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../hooks/useData';
import { supabase } from '../utils/supabase';
import { User, Wallet, Target, Users, ChevronRight, ChevronLeft, Sparkles, Check } from 'lucide-react';

const GOAL_PRESETS = [
  { icon: '🎓', label: 'Education', color: '#6db0e8' },
  { icon: '💍', label: 'Wedding', color: '#b48de8' },
  { icon: '🏠', label: 'Home', color: '#e8c56d' },
  { icon: '🛡️', label: 'Emergency Fund', color: '#4ecb8d' },
  { icon: '🏖️', label: 'Retirement', color: '#e8a06d' },
  { icon: '✨', label: 'Custom', color: '#9e9b93' },
];

const ASSET_TYPES = [
  { type: 'FD', icon: '🏦', label: 'Fixed Deposit', color: '#6db0e8' },
  { type: 'LIC', icon: '🛡️', label: 'LIC Policy', color: '#b48de8' },
  { type: 'SGB', icon: '🥇', label: 'Sovereign Gold Bond', color: '#e8c56d' },
  { type: 'MF', icon: '📈', label: 'Mutual Fund', color: '#4ecb8d' },
  { type: 'PPF', icon: '🏛️', label: 'PPF', color: '#e8685a' },
  { type: 'CHIT', icon: '🤝', label: 'Chit Fund', color: '#e8a06d' },
];

export default function OnboardingWizard({ onComplete }) {
  const { user } = useAuth();
  const { reloadData } = useData();

  // Restore saved step
  const savedStep = parseInt(localStorage.getItem('audkit_onboarding_step') || '0');
  const [step, setStep] = useState(savedStep);
  const [saving, setSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Step 1 — Profile
  const [profile, setProfile] = useState({
    display_name: user?.email?.split('@')[0] || '',
    age: '',
    monthly_expenses: '',
    tax_bracket: 20,
  });

  // Step 2 — Asset
  const [selectedAssetType, setSelectedAssetType] = useState(null);
  const [assetForm, setAssetForm] = useState({ name: '', amount: '', rate: '', start_date: '', maturity_date: '' });
  const [assetAdded, setAssetAdded] = useState(false);

  // Step 3 — Goal
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [goalForm, setGoalForm] = useState({ name: '', target_amount: '' });
  const [goalAdded, setGoalAdded] = useState(false);

  // Step 4 — Family
  const [familyForm, setFamilyForm] = useState({ name: '', phone: '', relationship: '' });
  const [memberAdded, setMemberAdded] = useState(false);

  // Save step to localStorage for re-entry
  useEffect(() => {
    localStorage.setItem('audkit_onboarding_step', step.toString());
  }, [step]);

  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handleBack = () => setStep(s => Math.max(s - 1, 0));

  // ═══ STEP HANDLERS ═══

  const saveProfile = async () => {
    try {
      setSaving(true);
      // Try to upsert into profiles table
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        display_name: profile.display_name,
        age: profile.age ? parseInt(profile.age) : null,
        monthly_expenses: profile.monthly_expenses ? parseFloat(profile.monthly_expenses) : null,
        tax_bracket: profile.tax_bracket,
        onboarding_step: 1,
      });
      if (error) {
        console.warn('Profiles table may not exist, skipping DB save:', error);
        // Still proceed — profile data is in state
      }
    } finally {
      setSaving(false);
      handleNext();
    }
  };

  const saveAsset = async () => {
    if (!assetForm.name || !assetForm.amount) return;
    try {
      setSaving(true);
      const { error } = await supabase.from('assets').insert({
        user_id: user.id,
        type: selectedAssetType,
        name: assetForm.name,
        amount: parseFloat(assetForm.amount),
        rate: assetForm.rate ? parseFloat(assetForm.rate) : null,
        start_date: assetForm.start_date || null,
        maturity_date: assetForm.maturity_date || null,
      });
      if (error) throw error;
      setAssetAdded(true);
      await reloadData();
    } catch (err) {
      console.error('Error adding asset:', err);
    } finally {
      setSaving(false);
    }
  };

  const saveGoal = async () => {
    if (!goalForm.name || !goalForm.target_amount) return;
    try {
      setSaving(true);
      const { error } = await supabase.from('goals').insert({
        user_id: user.id,
        name: goalForm.name || selectedGoal,
        target_amount: parseFloat(goalForm.target_amount),
        current_amount: 0,
      });
      if (error) throw error;
      setGoalAdded(true);
    } catch (err) {
      console.error('Error adding goal:', err);
    } finally {
      setSaving(false);
    }
  };

  const saveMember = async () => {
    if (!familyForm.name) return;
    try {
      setSaving(true);
      const initials = familyForm.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      const colors = ['#e8c56d', '#4ecb8d', '#e8685a', '#6db0e8', '#b48de8'];
      const { error } = await supabase.from('members').insert({
        user_id: user.id,
        name: familyForm.name,
        relationship: familyForm.relationship || 'Family',
        phone: familyForm.phone || null,
        initials,
        avatar_color: colors[Math.floor(Math.random() * colors.length)],
      });
      if (error) throw error;
      setMemberAdded(true);
      await reloadData();
    } catch (err) {
      console.error('Error adding member:', err);
    } finally {
      setSaving(false);
    }
  };

  const completeOnboarding = async () => {
    // Mark complete
    try {
      await supabase.from('profiles').upsert({
        id: user.id,
        onboarding_completed: true,
        onboarding_step: 4,
      });
    } catch (e) {
      console.warn('Could not update profiles:', e);
    }
    localStorage.setItem('audkit_onboarding_completed', 'true');
    localStorage.removeItem('audkit_onboarding_step');

    // Fire confetti
    setShowConfetti(true);
    try {
      const confetti = (await import('canvas-confetti')).default;
      // Gold confetti burst
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#e8c56d', '#d4a54a', '#fff', '#b48de8', '#4ecb8d'] });
      setTimeout(() => {
        confetti({ particleCount: 80, spread: 120, origin: { y: 0.5 }, colors: ['#e8c56d', '#6db0e8'] });
      }, 300);
    } catch (e) {
      console.warn('Confetti not available:', e);
    }

    setTimeout(() => {
      onComplete?.();
    }, 3000);
  };

  // ═══ STEP INDICATOR ═══
  const StepDots = () => (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '32px' }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          width: step > i ? '24px' : '8px', height: '8px', borderRadius: '4px',
          background: step >= i ? 'var(--accent)' : 'var(--bg)',
          border: `1px solid ${step >= i ? 'var(--accent)' : 'var(--border)'}`,
          transition: 'all 0.4s ease',
        }} />
      ))}
    </div>
  );

  // ═══ COMPLETION SCREEN ═══
  if (step === 4) {
    return (
      <div className="onboarding-overlay">
        <div className="onboarding-card" style={{ textAlign: 'center', padding: '48px 32px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
          <h2 className="page-heading" style={{ fontSize: '28px', marginBottom: '12px' }}>Your vault is ready!</h2>
          <div style={{ color: 'var(--text2)', marginBottom: '32px', lineHeight: '1.6' }}>
            Welcome to Audkit. Your family financial OS is set up and ready to track, protect, and grow your wealth.
          </div>
          <button className="btn-primary" onClick={completeOnboarding} style={{ padding: '14px 32px', fontSize: '16px', gap: '8px' }}>
            <Sparkles size={16} /> Go to my dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <StepDots />

        {/* ═══ STEP 1: PROFILE ═══ */}
        {step === 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(232, 197, 109, 0.1)', border: '1px solid rgba(232, 197, 109, 0.2)' }}>
                <User size={18} color="var(--accent)" />
              </div>
              <h3 className="page-heading" style={{ fontSize: '22px' }}>Tell us about yourself</h3>
            </div>
            <div style={{ color: 'var(--text3)', fontSize: '13px', marginBottom: '28px' }}>This helps us personalise your financial insights.</div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label className="label" style={{ color: 'var(--text3)', display: 'block', marginBottom: '6px' }}>YOUR NAME</label>
                <input type="text" className="form-control" placeholder="e.g. Rahul Sharma"
                  value={profile.display_name} onChange={e => setProfile(p => ({ ...p, display_name: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="label" style={{ color: 'var(--text3)', display: 'block', marginBottom: '6px' }}>AGE</label>
                  <input type="number" className="form-control" placeholder="35"
                    value={profile.age} onChange={e => setProfile(p => ({ ...p, age: e.target.value }))} />
                </div>
                <div>
                  <label className="label" style={{ color: 'var(--text3)', display: 'block', marginBottom: '6px' }}>TAX BRACKET</label>
                  <select className="form-control" value={profile.tax_bracket} onChange={e => setProfile(p => ({ ...p, tax_bracket: parseInt(e.target.value) }))}>
                    <option value={5}>5%</option>
                    <option value={20}>20%</option>
                    <option value={30}>30%</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label" style={{ color: 'var(--text3)', display: 'block', marginBottom: '6px' }}>MONTHLY HOUSEHOLD EXPENSES (₹)</label>
                <input type="number" className="form-control" placeholder="50000"
                  value={profile.monthly_expenses} onChange={e => setProfile(p => ({ ...p, monthly_expenses: e.target.value }))} />
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>Helps calculate your emergency fund target.</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '28px' }}>
              <button className="btn-primary" onClick={saveProfile} disabled={saving} style={{ gap: '6px' }}>
                {saving ? 'Saving...' : 'Continue'} <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 2: ADD FIRST ASSET ═══ */}
        {step === 1 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(78, 203, 141, 0.1)', border: '1px solid rgba(78, 203, 141, 0.2)' }}>
                <Wallet size={18} color="var(--green)" />
              </div>
              <h3 className="page-heading" style={{ fontSize: '22px' }}>Add your first asset</h3>
            </div>
            <div style={{ color: 'var(--text3)', fontSize: '13px', marginBottom: '24px' }}>Select an asset type to get started.</div>

            {!selectedAssetType && !assetAdded && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                {ASSET_TYPES.map(at => (
                  <button key={at.type} onClick={() => setSelectedAssetType(at.type)} style={{
                    padding: '20px 12px', borderRadius: '14px', cursor: 'pointer',
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                    transition: 'all 0.2s', color: 'var(--text)',
                    fontFamily: "'Sora', sans-serif",
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = at.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
                  >
                    <span style={{ fontSize: '28px' }}>{at.icon}</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: at.color }}>{at.label}</span>
                  </button>
                ))}
              </div>
            )}

            {selectedAssetType && !assetAdded && (
              <div style={{ display: 'grid', gap: '14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '20px' }}>{ASSET_TYPES.find(a => a.type === selectedAssetType)?.icon}</span>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{ASSET_TYPES.find(a => a.type === selectedAssetType)?.label}</span>
                  <button onClick={() => setSelectedAssetType(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '12px' }}>Change</button>
                </div>
                <input type="text" className="form-control" placeholder="Asset name" value={assetForm.name} onChange={e => setAssetForm(f => ({ ...f, name: e.target.value }))} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <input type="number" className="form-control" placeholder="Amount (₹)" value={assetForm.amount} onChange={e => setAssetForm(f => ({ ...f, amount: e.target.value }))} />
                  <input type="number" className="form-control" placeholder="Rate (%)" step="0.01" value={assetForm.rate} onChange={e => setAssetForm(f => ({ ...f, rate: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="label" style={{ color: 'var(--text3)', marginBottom: '4px', display: 'block' }}>START</label>
                    <input type="date" className="form-control" value={assetForm.start_date} onChange={e => setAssetForm(f => ({ ...f, start_date: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label" style={{ color: 'var(--text3)', marginBottom: '4px', display: 'block' }}>MATURITY</label>
                    <input type="date" className="form-control" value={assetForm.maturity_date} onChange={e => setAssetForm(f => ({ ...f, maturity_date: e.target.value }))} />
                  </div>
                </div>
                <button className="btn-primary" onClick={saveAsset} disabled={saving || !assetForm.name || !assetForm.amount} style={{ gap: '6px' }}>
                  {saving ? 'Adding...' : 'Add Asset'}
                </button>
              </div>
            )}

            {assetAdded && (
              <div style={{ textAlign: 'center', padding: '24px', background: 'rgba(78, 203, 141, 0.06)', borderRadius: '12px', border: '1px solid rgba(78, 203, 141, 0.15)' }}>
                <Check size={28} color="var(--green)" style={{ marginBottom: '8px' }} />
                <div style={{ fontWeight: 600 }}>Asset added!</div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
              <button className="btn-ghost" onClick={handleBack} style={{ gap: '4px' }}><ChevronLeft size={14} /> Back</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={handleNext} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '12px' }}>Skip for now</button>
                <button className="btn-primary" onClick={handleNext} disabled={!assetAdded} style={{ gap: '6px' }}>
                  Continue <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: SET FIRST GOAL ═══ */}
        {step === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(109, 176, 232, 0.1)', border: '1px solid rgba(109, 176, 232, 0.2)' }}>
                <Target size={18} color="var(--blue)" />
              </div>
              <h3 className="page-heading" style={{ fontSize: '22px' }}>Set your first goal</h3>
            </div>
            <div style={{ color: 'var(--text3)', fontSize: '13px', marginBottom: '24px' }}>What are you saving towards?</div>

            {!selectedGoal && !goalAdded && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                {GOAL_PRESETS.map(g => (
                  <button key={g.label} onClick={() => { setSelectedGoal(g.label); setGoalForm(f => ({ ...f, name: g.label })); }} style={{
                    padding: '20px 12px', borderRadius: '14px', cursor: 'pointer',
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                    transition: 'all 0.2s', color: 'var(--text)',
                    fontFamily: "'Sora', sans-serif",
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = g.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
                  >
                    <span style={{ fontSize: '28px' }}>{g.icon}</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: g.color }}>{g.label}</span>
                  </button>
                ))}
              </div>
            )}

            {selectedGoal && !goalAdded && (
              <div style={{ display: 'grid', gap: '14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{selectedGoal}</span>
                  <button onClick={() => setSelectedGoal(null)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '12px' }}>Change</button>
                </div>
                {selectedGoal === 'Custom' && (
                  <input type="text" className="form-control" placeholder="Goal name" value={goalForm.name === 'Custom' ? '' : goalForm.name} onChange={e => setGoalForm(f => ({ ...f, name: e.target.value }))} />
                )}
                <input type="number" className="form-control" placeholder="Target amount (₹)" value={goalForm.target_amount} onChange={e => setGoalForm(f => ({ ...f, target_amount: e.target.value }))} />
                <button className="btn-primary" onClick={saveGoal} disabled={saving || !goalForm.target_amount} style={{ gap: '6px' }}>
                  {saving ? 'Saving...' : 'Set Goal'}
                </button>
              </div>
            )}

            {goalAdded && (
              <div style={{ textAlign: 'center', padding: '24px', background: 'rgba(109, 176, 232, 0.06)', borderRadius: '12px', border: '1px solid rgba(109, 176, 232, 0.15)' }}>
                <Check size={28} color="var(--blue)" style={{ marginBottom: '8px' }} />
                <div style={{ fontWeight: 600 }}>Goal set!</div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
              <button className="btn-ghost" onClick={handleBack} style={{ gap: '4px' }}><ChevronLeft size={14} /> Back</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={handleNext} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '12px' }}>Skip for now</button>
                <button className="btn-primary" onClick={handleNext} style={{ gap: '6px' }}>
                  Continue <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 4: INVITE FAMILY ═══ */}
        {step === 3 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(180, 141, 232, 0.1)', border: '1px solid rgba(180, 141, 232, 0.2)' }}>
                <Users size={18} color="var(--purple)" />
              </div>
              <h3 className="page-heading" style={{ fontSize: '22px' }}>Invite your family</h3>
            </div>
            <div style={{ color: 'var(--text3)', fontSize: '13px', marginBottom: '24px' }}>Audkit works best when the whole family is in. Add a member to see combined wealth.</div>

            {!memberAdded ? (
              <div style={{ display: 'grid', gap: '14px', marginBottom: '20px' }}>
                <input type="text" className="form-control" placeholder="Member name" value={familyForm.name} onChange={e => setFamilyForm(f => ({ ...f, name: e.target.value }))} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <input type="tel" className="form-control" placeholder="Phone (optional)" value={familyForm.phone} onChange={e => setFamilyForm(f => ({ ...f, phone: e.target.value }))} />
                  <select className="form-control" value={familyForm.relationship} onChange={e => setFamilyForm(f => ({ ...f, relationship: e.target.value }))}>
                    <option value="">Relationship</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Child">Child</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <button className="btn-primary" onClick={saveMember} disabled={saving || !familyForm.name} style={{ gap: '6px' }}>
                  {saving ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', background: 'rgba(180, 141, 232, 0.06)', borderRadius: '12px', border: '1px solid rgba(180, 141, 232, 0.15)', marginBottom: '20px' }}>
                <Check size={28} color="var(--purple)" style={{ marginBottom: '8px' }} />
                <div style={{ fontWeight: 600 }}>Member added!</div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
              <button className="btn-ghost" onClick={handleBack} style={{ gap: '4px' }}><ChevronLeft size={14} /> Back</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => setStep(4)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '12px' }}>Skip — I'll add later</button>
                <button className="btn-primary" onClick={() => setStep(4)} style={{ gap: '6px' }}>
                  Finish Setup <Sparkles size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Onboarding Overlay Styles */}
      <style>{`
        .onboarding-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 9999;
          background: rgba(5, 5, 8, 0.85);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.4s ease;
        }
        .onboarding-card {
          width: 100%;
          max-width: 480px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.01) 100%);
          backdrop-filter: blur(28px) saturate(180%);
          border-radius: 24px;
          padding: 36px;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 40px 80px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.15);
          animation: slideUpOnboard 0.5s cubic-bezier(0.25, 1, 0.33, 1);
          max-height: 90vh;
          overflow-y: auto;
        }
        @keyframes slideUpOnboard {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
