import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../hooks/useData';
import { useGoals } from '../hooks/useGoals';
import { supabase } from '../utils/supabase';
import PaywallModal from '../components/PaywallModal';
import RateComparisonTable from '../components/RateComparisonTable';
import { Search, SortDesc, Download, X, Edit, Trash, ArrowRight, Wallet, Activity, IndianRupee, Home, Utensils, Bus, Zap, Clapperboard, HeartPulse, BellRing, MoreHorizontal, ShoppingCart, Check, Target } from 'lucide-react';

const typeColors = {
  'FD': '#6db0e8', 'LIC': '#b48de8', 'SGB': '#e8c56d', 'MF': '#4ecb8d', 'PPF': '#e8685a'
};

const expenseCatColors = {
  'Housing': '#b48de8', 'Food': '#4ecb8d', 'Transport': '#6db0e8', 
  'Utilities': '#e8c56d', 'Entertainment': '#e8685a', 'Healthcare': '#f28b82', 
  'Subscriptions': '#a8c7fa', 'Other': '#999'
};

const expenseIcons = {
  'Housing': Home, 'Food': Utensils, 'Transport': Bus, 
  'Utilities': Zap, 'Entertainment': Clapperboard, 'Healthcare': HeartPulse, 
  'Subscriptions': BellRing, 'Other': MoreHorizontal
};

const fmtMoney = (val) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val);

const getDays = (dateStr) => {
  if(!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
};

const calculateMaturity = (asset) => {
  if (!asset.rate || !asset.start_date || !asset.maturity_date) return asset.amount;
  const years = (new Date(asset.maturity_date) - new Date(asset.start_date)) / 31536000000;
  if (years <= 0) return asset.amount;
  return asset.amount * Math.pow((1 + asset.rate / 100), years);
};

export default function Assets() {
  const { user, isPremium } = useAuth();
  const { assets, expenses, members, loading, reloadData } = useData();
  const { goals } = useGoals();
  
  const [activeTab, setActiveTab] = useState('portfolio'); // 'portfolio' | 'cashflow'

  const [modalOpen, setModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [formData, setFormData] = useState({}); // used for pre-fill edits
  const [expenseRows, setExpenseRows] = useState([]); // legacy bulk rows for the backend
  const [activeExpense, setActiveExpense] = useState({ type: 'Expense', amount: '', category: 'Food', date: '', description: '' });
  const [receiptStack, setReceiptStack] = useState([]); // visual pending receipts
  
  // Advanced Features State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Maturity');
  const [selectedAsset, setSelectedAsset] = useState(null); // Right Drawer

  const renderChip = (type, dict = typeColors) => {
    const hex = dict[type] || '#ffffff';
    const r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16);
    return <span className="type-chip" style={{ color: hex, background: `rgba(${r || 255},${g || 255},${b || 255},0.1)`, border: `1px solid rgba(${r || 255},${g || 255},${b || 255},0.3)` }}>{type}</span>;
  };

  const handleMemberToggle = (id) => {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const handleOpenAdd = () => {
    if (!isPremium && assets.length >= 4) {
      setPaywallOpen(true);
    } else {
      setFormData({});
      setSelectedMembers([]);
      setModalOpen(true);
    }
  };

  const handleOpenAddExpense = () => {
    setActiveExpense({ 
      type: 'Expense', 
      amount: '', 
      category: 'Food', 
      date: new Date().toLocaleDateString('en-CA'), 
      description: '' 
    });
    setReceiptStack([]);
    setExpenseModalOpen(true);
  };

  const addReceiptToStack = () => {
    if(!activeExpense.amount || Number(activeExpense.amount) <= 0) {
      alert("Enter a valid amount first."); return;
    }
    setReceiptStack([...receiptStack, { ...activeExpense, id: Date.now() }]);
    // Reset but keep date/type for convenience (flexible entry)
    setActiveExpense({ ...activeExpense, amount: '', description: '' });
  };

  const handleExpenseChange = (index, field, value) => {
    const newRows = [...expenseRows];
    newRows[index][field] = value;
    setExpenseRows(newRows);
  };

  const addExpenseRow = () => {
    const lastRow = expenseRows[expenseRows.length - 1];
    setExpenseRows([...expenseRows, { id: Date.now(), type: lastRow.type, date: lastRow.date, amount: '', category: lastRow.category, description: '' }]);
  };

  const removeExpenseRow = (index) => {
    if (expenseRows.length === 1) return;
    setExpenseRows(expenseRows.filter((_, i) => i !== index));
  };

  const handleEdit = () => {
    setFormData(selectedAsset);
    setSelectedMembers(selectedAsset.members ? selectedAsset.members.map(m => m.id) : []);
    setSelectedAsset(null);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if(!window.confirm("Are you sure you want to delete this asset?")) return;
    try {
      await supabase.from('assets').delete().eq('id', selectedAsset.id);
      setSelectedAsset(null);
      reloadData();
    } catch(err) {
      alert("Failed to delete.");
    }
  };

  const handleDeleteExpense = async (id) => {
    if(!window.confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await supabase.from('expenses').delete().eq('id', id);
      reloadData();
    } catch(err) {
      alert("Failed to delete.");
    }
  };

  const handleSaveAsset = async (e) => {
    e.preventDefault();
    if (selectedMembers.length === 0) {
      alert("Please select at least one family member."); return;
    }
    setSaving(true);
    const formVals = new FormData(e.target);
    const payload = {
      name: formVals.get('name'),
      type: formVals.get('type'),
      amount: Number(formVals.get('amount')),
      rate: Number(formVals.get('rate')) || 0,
      start_date: formVals.get('start_date') || null,
      maturity_date: formVals.get('maturity_date') || null,
      notes: formVals.get('notes') || null,
      goal_id: formVals.get('goal_id') || null,
      user_id: user.id
    };

    try {
      let assetId;
      if (formData.id) {
        await supabase.from('assets').update(payload).eq('id', formData.id);
        assetId = formData.id;
        await supabase.from('asset_members').delete().eq('asset_id', assetId); 
      } else {
        const { data: insertedAsset } = await supabase.from('assets').insert([payload]).select().single();
        assetId = insertedAsset.id;
      }
      const memberLinks = selectedMembers.map(mId => ({ asset_id: assetId, member_id: mId }));
      await supabase.from('asset_members').insert(memberLinks);
      setModalOpen(false);
      setFormData({});
      setSelectedMembers([]);
      reloadData();
    } catch(err) {
      alert("Error saving asset: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveExpense = async (e) => {
    if(e) e.preventDefault();
    setSaving(true);
    
    const finalItems = [...receiptStack];
    if(activeExpense.amount && Number(activeExpense.amount) > 0) {
      finalItems.push(activeExpense);
    }

    if(finalItems.length === 0) {
      alert("No valid transactions to save.");
      setSaving(false);
      return;
    }

    const payloadArray = finalItems.map(r => ({
      type: r.type,
      amount: Number(r.amount),
      category: r.category,
      date: r.date,
      description: r.description || null,
      user_id: user.id
    }));

    try {
      await supabase.from('expenses').insert(payloadArray);
      setExpenseModalOpen(false);
      reloadData();
    } catch(err) {
      alert("Error saving transactions: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Compute Search, Filter, Sort for Assets
  const processedAssets = useMemo(() => {
    let result = [...assets];
    if (activeFilter !== 'All') result = result.filter(a => a.type === activeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => 
        (a.name || '').toLowerCase().includes(q) || 
        (a.notes || '').toLowerCase().includes(q) ||
        (a.members && a.members.some(m => (m.name || '').toLowerCase().includes(q)))
      );
    }
    result.sort((a,b) => {
      if (sortBy === 'Maturity') {
        const dA = getDays(a.maturity_date) || 999999;
        const dB = getDays(b.maturity_date) || 999999;
        return dA - dB;
      }
      if (sortBy === 'Amount') return (Number(b.amount) || 0) - (Number(a.amount) || 0);
      if (sortBy === 'Name') return (a.name || '').localeCompare(b.name || '');
      return 0; // fallback
    });
    return result;
  }, [assets, activeFilter, searchQuery, sortBy]);

  const typeTotals = assets.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + Number(curr.amount);
    return acc;
  }, {});

  const totalNW = assets.reduce((s,a)=>s+Number(a.amount), 0);

  // Parse Expenses
  const totalIncome = expenses?.filter(e => e.type === 'Income').reduce((s,e) => s + Number(e.amount), 0) || 0;
  const totalExpense = expenses?.filter(e => e.type === 'Expense').reduce((s,e) => s + Number(e.amount), 0) || 0;
  
  const expenseCategoriesAgg = expenses?.filter(e => e.type === 'Expense').reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount);
    return acc;
  }, {}) || {};

  const generateInsights = () => {
    const insights = [];
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
    
    if (totalIncome > 0) {
      if (savingsRate > 20) insights.push({ type: 'success', text: `Excellent savings rate (${savingsRate.toFixed(1)}%). Consider sweeping excess capital into compounding assets like SGB or Mutual Funds.` });
      else if (savingsRate < 10 && savingsRate > 0) insights.push({ type: 'warning', text: `Your savings buffer is exceptionally low at ${savingsRate.toFixed(1)}%. Review non-essential spending to build a healthier emergency net.` });
      else if (savingsRate <= 0) insights.push({ type: 'danger', text: `Negative cashflow detected. You've structurally burned ₹${fmtMoney(totalExpense - totalIncome)} more than you brought in during recorded periods. Immediate spending audit required.` });
    } else if (totalExpense > 0) {
      insights.push({ type: 'danger', text: `You've registered ₹${fmtMoney(totalExpense)} in outflows but no income source. Logging income flows is highly encouraged to accurately benchmark your burn rate.` });
    }

    if (totalExpense > 0) {
       let maxCat = '', maxVal = 0;
       for (const [cat, val] of Object.entries(expenseCategoriesAgg)) {
         if (val > maxVal && cat !== 'Housing' && cat !== 'Utilities') { maxVal = val; maxCat = cat; }
       }
       if (maxVal > totalExpense * 0.3) insights.push({ type: 'info', text: `High variable spending clustered. You burned ₹${fmtMoney(maxVal)} solely on ${maxCat}, compromising ${((maxVal/totalExpense)*100).toFixed(1)}% of your total discretionary outflows.` });
    }
    return insights;
  };

  if (loading) return <div className="loader-container">Loading module...</div>;

  return (
    <>
      <div className="screen fade-in active no-print-padding">
        
        {/* UNIFIED HEADER & TOGGLE */}
        <div className="hide-on-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ minWidth: 'max-content' }}>
            <h2 className="page-heading" style={{ marginBottom: '16px' }}>Financial Center</h2>
            <div style={{ display: 'flex', gap: '8px', background: 'var(--bg2)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)', display: 'inline-flex' }}>
              <button 
                className="btn-ghost" 
                style={{ padding: '8px 16px', boxShadow: 'none', border: 'none', background: activeTab === 'portfolio' ? 'var(--bg3)' : 'transparent', color: activeTab === 'portfolio' ? 'var(--accent)' : 'var(--text2)', fontWeight: activeTab === 'portfolio' ? 'bold' : 'normal', display: 'flex', gap: '8px', alignItems: 'center' }}
                onClick={() => setActiveTab('portfolio')}
              >
                <Wallet size={16} /> Wealth Portfolio
              </button>
              <button 
                className="btn-ghost" 
                style={{ padding: '8px 16px', boxShadow: 'none', border: 'none', background: activeTab === 'cashflow' ? 'var(--bg3)' : 'transparent', color: activeTab === 'cashflow' ? 'var(--accent)' : 'var(--text2)', fontWeight: activeTab === 'cashflow' ? 'bold' : 'normal', display: 'flex', gap: '8px', alignItems: 'center' }}
                onClick={() => setActiveTab('cashflow')}
              >
                <Activity size={16} /> Cashflow & Expenses
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            {activeTab === 'portfolio' && (
              <>
                <button className="btn-ghost" onClick={() => window.print()}><Download size={16} /> Export PDF</button>
                <button className="btn-primary" onClick={handleOpenAdd}>+ Add Asset</button>
              </>
            )}
            {activeTab === 'cashflow' && (
              <button className="btn-primary" onClick={handleOpenAddExpense}>+ Add Transaction</button>
            )}
          </div>
        </div>

        {/* --- TAB 1: PORTFOLIO --- */}
        {activeTab === 'portfolio' && (
          <div className="fade-in">
            {/* PRINT ONLY HEADER */}
            <div className="print-only">
              <h1 style={{ fontFamily: 'DM Serif Display', fontSize: '32px', borderBottom: '2px solid #000', paddingBottom: '16px', marginBottom: '16px' }}>Audkit Family Financial Statement</h1>
              <div style={{ fontSize: '14px', marginBottom: '24px' }}>Date: {new Date().toLocaleDateString()}</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '32px' }}>Total Net Worth: ₹{fmtMoney(totalNW)}</div>
            </div>

            {/* Dynamic Summary Cards */}
            {Object.keys(typeTotals).length > 0 && (
              <div className="hide-on-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                {Object.entries(typeTotals).map(([type, amount]) => (
                  <div key={type} className={`card metric-card ${type.toLowerCase()}`} style={{ padding: '20px' }}>
                    <div className="label" style={{ color: 'var(--text2)', marginBottom: '8px' }}>{type} Value</div>
                    <div className="card-value" style={{ fontSize: '24px', color: typeColors[type] || 'var(--text)' }}>₹{fmtMoney(amount)}</div>
                  </div>
                ))}
              </div>
            )}

            {/* SEARCH AND FILTER BAR */}
            <div className="hide-on-print card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '300px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} color="var(--text2)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="text" className="form-control" placeholder="Search assets, members, notes..." 
                    style={{ paddingLeft: '40px', background: 'var(--bg)' }}
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '8px', background: 'var(--bg)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  {['All', 'FD', 'LIC', 'SGB', 'MF', 'PPF'].map(f => (
                    <button key={f} className="btn-ghost" 
                      style={{ padding: '4px 12px', boxShadow: 'none', border: 'none', background: activeFilter === f ? 'transparent' : 'transparent', color: activeFilter === f ? 'var(--accent)' : 'var(--text2)', fontWeight: activeFilter === f ? 'bold' : 'normal' }}
                      onClick={() => setActiveFilter(f)}>{f}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SortDesc size={16} color="var(--text2)" />
                  <select className="form-control" style={{ width: '140px', padding: '8px', background: 'var(--bg)' }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="Maturity">Maturity First</option>
                    <option value="Amount">Amount (High)</option>
                    <option value="Name">Name (A-Z)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="hide-on-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '12px', color: 'var(--text2)' }}>
              <div>Showing {processedAssets.length} of {assets.length} assets</div>
              {(searchQuery || activeFilter !== 'All') && (
                <button className="btn-ghost" style={{ padding: 0, border: 'none', background: 'none', color: 'var(--accent)', fontSize: '12px' }} onClick={() => { setSearchQuery(''); setActiveFilter('All'); }}>
                  Clear Filters
                </button>
              )}
            </div>

            {/* Asset Table */}
            <div className="card fade-in" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-container">
                <table>
                  <thead style={{ background: 'var(--bg3)' }}>
                    <tr>
                      <th>Asset Details</th>
                      <th>Type</th>
                      <th className="hide-on-print">Principal Amount</th>
                      <th className="print-only">Amount</th>
                      <th>Rate %</th>
                      <th>Matures In</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedAssets.map(a => {
                      const days = getDays(a.maturity_date);
                      let badge = <span className="badge dash hide-on-print">—</span>;
                      let printMaturity = "—";
                      if(days !== null) {
                        const bCol = days < 30 ? 'red' : (days < 90 ? 'amber' : 'green');
                        badge = <span className={`badge ${bCol} hide-on-print`}>{days}d</span>;
                        printMaturity = new Date(a.maturity_date).toLocaleDateString();
                      }
                      return (
                        <tr key={a.id} onClick={() => setSelectedAsset(a)} style={{ cursor: 'pointer', transition: 'all 0.3s' }}>
                          <td>
                            <div className="section-title" style={{ fontSize: '15px', color: 'var(--text)', marginBottom: '8px' }}>{a.name}</div>
                            <div className="members-row" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              {a.members && a.members.map(m => (
                                <div key={m.id} className="avatar hide-on-print" style={{ width: '24px', height: '24px', fontSize: '10px', background: m.avatar_color || 'var(--accent)', border: '2px solid var(--bg2)' }} title={`${m.name} (${m.role})`}>{m.initials}</div>
                              ))}
                              <span className="print-only" style={{ fontSize: '12px' }}>{a.members && a.members.length > 0 ? a.members.map(m=>m.name).join(', ') : 'Unassigned'}</span>
                              {(!a.members || a.members.length === 0) && <span className="hide-on-print" style={{fontSize: '11px', color: 'var(--text3)'}}>Unassigned</span>}
                            </div>
                          </td>
                          <td><span className="hide-on-print">{renderChip(a.type, typeColors)}</span><span className="print-only">{a.type}</span></td>
                          <td className="code-val" style={{ fontSize: '15px' }}>₹{fmtMoney(a.amount)}</td>
                          <td className="code-val">{a.rate ? a.rate+'%' : '—'}</td>
                          <td>{badge}<span className="print-only">{printMaturity}</span></td>
                        </tr>
                      );
                    })}
                    {processedAssets.length === 0 && (
                      <tr>
                         <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text3)', padding: '48px' }}>
                            <div style={{ fontSize: '16px', marginBottom: '8px' }}>No matches found</div>
                            <div style={{ fontSize: '13px' }}>Try adjusting your filters or adding a new asset.</div>
                         </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 2: CASHFLOW --- */}
        {activeTab === 'cashflow' && (
          <div className="fade-in">
            {/* Cashflow Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
              <div className="card" style={{ background: 'linear-gradient(135deg, rgba(78, 203, 141, 0.1), rgba(0,0,0,0))', border: '1px solid rgba(78, 203, 141, 0.3)' }}>
                <div className="label" style={{ color: 'var(--green)', marginBottom: '12px' }}>Total Inflows</div>
                <div className="code-val" style={{ fontSize: '32px', color: 'var(--text)' }}>₹{fmtMoney(totalIncome)}</div>
              </div>
              <div className="card" style={{ background: 'linear-gradient(135deg, rgba(232, 104, 90, 0.1), rgba(0,0,0,0))', border: '1px solid rgba(232, 104, 90, 0.3)' }}>
                <div className="label" style={{ color: 'var(--red)', marginBottom: '12px' }}>Total Outflows (Burn)</div>
                <div className="code-val" style={{ fontSize: '32px', color: 'var(--text)' }}>₹{fmtMoney(totalExpense)}</div>
              </div>
              <div className="card">
                <div className="label" style={{ color: 'var(--text2)', marginBottom: '12px' }}>Net Cashflow</div>
                <div className="code-val" style={{ fontSize: '32px', color: (totalIncome - totalExpense) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {(totalIncome - totalExpense) >= 0 ? '+' : ''}₹{fmtMoney(totalIncome - totalExpense)}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'flex-start' }}>
              <div style={{ flex: 2 }}>
                <h3 className="section-title" style={{ marginBottom: '16px' }}>Expense Breakdown</h3>
                {Object.keys(expenseCategoriesAgg).length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px', marginBottom: '40px' }}>
                    {Object.entries(expenseCategoriesAgg).sort((a,b)=>b[1]-a[1]).map(([cat, amount]) => (
                      <div key={cat} className="card" style={{ padding: '16px' }}>
                        <div style={{ marginBottom: '12px' }}>{renderChip(cat, expenseCatColors)}</div>
                        <div className="code-val" style={{ fontSize: '20px' }}>₹{fmtMoney(amount)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text3)', borderStyle: 'dashed', marginBottom: '40px' }}>No expenses logged yet.</div>
                )}
              </div>

              {/* Financial Intelligence Engine */}
              {expenses.length > 0 && generateInsights().length > 0 && (
                <div style={{ flex: 1 }}>
                  <h3 className="section-title" style={{ marginBottom: '16px' }}>Smart Insights</h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {generateInsights().map((ins, i) => (
                      <div key={i} className="card" style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '14px 16px', borderLeft: `4px solid ${ins.type === 'success' ? 'var(--green)' : ins.type === 'danger' ? 'var(--red)' : ins.type === 'warning' ? '#f59e0b' : 'var(--accent)'}`, background: 'var(--bg3)', boxShadow: 'none' }}>
                         <div style={{ fontSize: '20px' }}>{ins.type === 'success' ? '🌱' : ins.type === 'warning' ? '⚠️' : ins.type === 'danger' ? '🚨' : '💡'}</div>
                         <div style={{ fontSize: '12px', lineHeight: 1.4, color: 'var(--text2)' }}>{ins.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <h3 className="section-title" style={{ marginBottom: '16px' }}>Ledger</h3>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-container">
                <table>
                  <thead style={{ background: 'var(--bg3)' }}>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.length === 0 && (
                      <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text3)', padding: '24px' }}>Ledger is empty</td></tr>
                    )}
                    {expenses.map(exp => (
                      <tr key={exp.id}>
                        <td style={{ color: 'var(--text2)' }}>{new Date(exp.date).toLocaleDateString()}</td>
                        <td style={{ fontWeight: '500' }}>{exp.description || '—'}</td>
                        <td>{exp.type === 'Income' ? <span className="type-chip" style={{color: 'var(--green)', background: 'rgba(78,203,141,0.1)'}}>Income</span> : renderChip(exp.category, expenseCatColors)}</td>
                        <td className="code-val" style={{ color: exp.type === 'Income' ? 'var(--green)' : 'var(--text)', fontSize: '15px' }}>
                          {exp.type === 'Income' ? '+' : '-'}₹{fmtMoney(exp.amount)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn-ghost" style={{ padding: '4px', color: 'var(--text3)' }} onClick={() => handleDeleteExpense(exp.id)}>
                            <Trash size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>

      <div className="print-only footer" style={{ marginTop: '40px', borderTop: '1px solid #000', paddingTop: '16px', fontSize: '11px', textAlign: 'center' }}>
        Generated dynamically by Audkit Security &bull; audkit.app
      </div>

      {paywallOpen && <PaywallModal onClose={() => setPaywallOpen(false)} />}

      {/* Asset Modal */}
      {modalOpen && (
        <div className="modal-overlay hide-on-print" onClick={(e) => { if(e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="modal-box fade-in">
            <h2 className="section-title" style={{ marginBottom: '24px' }}>{formData.id ? 'Edit Asset' : 'Add New Asset'}</h2>
            <form onSubmit={handleSaveAsset}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label className="label" style={{ color: 'var(--text2)', display: 'block', marginBottom: '6px' }}>Asset Type</label>
                  <select name="type" className="form-control" required defaultValue={formData.type || 'FD'}>
                    <option value="FD">Fixed Deposit (FD)</option>
                    <option value="LIC">LIC Policy</option>
                    <option value="SGB">SGB</option>
                    <option value="MF">Mutual Fund (MF)</option>
                    <option value="PPF">PPF / EPF</option>
                  </select>
                </div>
                <div>
                  <label className="label" style={{ color: 'var(--text2)', display: 'block', marginBottom: '6px' }}>Name / Details</label>
                  <input name="name" type="text" className="form-control" placeholder="e.g. SBI Savings FD" required defaultValue={formData.name || ''} />
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="label" style={{ color: 'var(--text2)', display: 'block', marginBottom: '6px' }}>Amount (₹)</label>
                    <input name="amount" type="number" className="form-control code-val" required defaultValue={formData.amount || ''} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label" style={{ color: 'var(--text2)', display: 'block', marginBottom: '6px' }}>Rate (%)</label>
                    <input name="rate" type="number" step="0.1" className="form-control code-val" defaultValue={formData.rate || ''} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="label" style={{ color: 'var(--text2)', display: 'block', marginBottom: '6px' }}>Start Date</label>
                    <input name="start_date" type="date" className="form-control" defaultValue={formData.start_date || ''} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label" style={{ color: 'var(--text2)', display: 'block', marginBottom: '6px' }}>Maturity Date</label>
                    <input name="maturity_date" type="date" className="form-control" defaultValue={formData.maturity_date || ''} />
                  </div>
                </div>
                <div>
                  <label className="label" style={{ color: 'var(--text2)', display: 'block', marginBottom: '6px' }}>Owners (Select Multiple)</label>
                  <div className="form-control" style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {members.map(m => (
                      <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                        <input type="checkbox" style={{ accentColor: 'var(--accent)' }} checked={selectedMembers.includes(m.id)} onChange={() => handleMemberToggle(m.id)} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="avatar" style={{ width: '24px', height: '24px', fontSize: '10px', background: m.avatar_color || 'var(--accent)' }}>{m.initials}</span>
                          <span>{m.name} <span style={{ color: 'var(--text2)', fontSize: '12px' }}>({m.role})</span></span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label" style={{ color: 'var(--text2)', display: 'block', marginBottom: '6px' }}>Notes</label>
                  <input name="notes" type="text" className="form-control" defaultValue={formData.notes || ''} />
                </div>
                <div>
                  <label className="label" style={{ color: 'var(--text2)', display: 'block', marginBottom: '6px' }}>Link to Goal</label>
                  <select name="goal_id" className="form-control" defaultValue={formData.goal_id || ''}>
                    <option value="">No goal</option>
                    {goals.map(g => (
                      <option key={g.id} value={g.id}>{g.icon} {g.name}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn-primary" style={{ marginTop: '16px' }} disabled={saving || members.length === 0}>
                  {saving ? 'Saving...' : 'Save Asset'}
                </button>
                <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dribbble-Inspired Expense Modal */}
      {expenseModalOpen && (
        <div className="modal-overlay hide-on-print" onClick={(e) => { if(e.target === e.currentTarget) setExpenseModalOpen(false) }}>
          <div className="modal-box fade-in" style={{ maxWidth: '440px', padding: '0', overflow: 'hidden', background: 'var(--bg2)' }}>
            
            {/* Header with Switch */}
            <div style={{ padding: '24px 24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="btn-ghost" style={{ padding: '8px', border: 'none' }} onClick={() => setExpenseModalOpen(false)}><X size={20}/></button>
                <div style={{ background: 'var(--bg3)', padding: '4px', borderRadius: '30px', display: 'flex', gap: '4px', border: '1px solid var(--border)' }}>
                  {['Expense', 'Income'].map(t => (
                    <button 
                      key={t}
                      onClick={() => setActiveExpense({...activeExpense, type: t})}
                      style={{ padding: '6px 20px', borderRadius: '30px', border: 'none', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', background: activeExpense.type === t ? 'var(--accent)' : 'transparent', color: activeExpense.type === t ? 'var(--bg)' : 'var(--text2)', transition: '0.3s' }}
                    >
                      {t === 'Expense' ? 'Spent' : 'Income'}
                    </button>
                  ))}
                </div>
                <div style={{ width: '36px' }}></div>
              </div>

              {/* Hero Amount Input */}
              <div style={{ textAlign: 'center', width: '100%' }}>
                <div style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Amount</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '32px', color: 'var(--text2)', fontWeight: 'bold' }}>₹</span>
                  <input 
                    type="number" 
                    className="code-val" 
                    placeholder="0.00"
                    style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '56px', textAlign: 'center', width: '100%', outline: 'none', fontWeight: 'bold' }}
                    value={activeExpense.amount}
                    onChange={(e) => setActiveExpense({...activeExpense, amount: e.target.value})}
                    autoFocus
                  />
                </div>
              </div>
            </div>

            {/* Category Grid */}
            <div style={{ background: 'var(--bg3)', padding: '24px', borderRadius: '32px 32px 0 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {Object.keys(expenseCatColors).map(cat => {
                  const Icon = expenseIcons[cat] || MoreHorizontal;
                  const isActive = activeExpense.category === cat;
                  return (
                    <div 
                      key={cat} 
                      onClick={() => setActiveExpense({...activeExpense, category: cat})}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    >
                      <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: isActive ? 'var(--accent)' : 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: isActive ? 'none' : '1px solid var(--border)', transition: '0.3s', color: isActive ? 'var(--bg)' : 'var(--text2)' }}>
                        <Icon size={20} />
                      </div>
                      <span style={{ fontSize: '10px', color: isActive ? 'var(--text)' : 'var(--text3)', fontWeight: isActive ? 'bold' : 'normal' }}>{cat}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
                <input 
                  type="date" className="form-control" 
                  value={activeExpense.date} 
                  onChange={(e) => setActiveExpense({...activeExpense, date: e.target.value})}
                  style={{ background: 'var(--bg2)', borderRadius: '12px' }}
                />
                <input 
                  type="text" className="form-control" placeholder="What's this for?" 
                  value={activeExpense.description} 
                  onChange={(e) => setActiveExpense({...activeExpense, description: e.target.value})}
                  style={{ background: 'var(--bg2)', borderRadius: '12px' }}
                />
              </div>

              {/* Receipt Stack Visualization */}
              {receiptStack.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '16px' }}>
                  {receiptStack.map((r, idx) => (
                    <div key={r.id} style={{ flex: '0 0 auto', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '30px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text2)' }}>{r.category}: ₹{r.amount}</span>
                      <X size={12} style={{ cursor: 'pointer', color: 'var(--text3)' }} onClick={() => setReceiptStack(receiptStack.filter((_, i) => i !== idx))} />
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn-ghost" style={{ flex: 1, borderRadius: '12px', padding: '16px', fontSize: '14px' }} onClick={addReceiptToStack}>+ Add Next</button>
                <button type="button" className="btn-primary" style={{ flex: 2, borderRadius: '12px', padding: '16px', fontSize: '14px' }} onClick={() => handleSaveExpense()} disabled={saving}>
                  {saving ? 'Processing...' : (receiptStack.length > 0 ? `Save Stack (${receiptStack.length + (activeExpense.amount ? 1 : 0)})` : 'Save Transaction')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Right Drawer Panel for Selected Asset */}
      {selectedAsset && <div className="sidebar-backdrop hide-on-print" onClick={() => setSelectedAsset(null)} style={{ zIndex: 104 }}></div>}
      <div className={`asset-drawer hide-on-print ${selectedAsset ? 'open' : ''}`}>
        {selectedAsset && (
          <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h2 className="section-title" style={{ fontSize: '24px' }}>Asset Details</h2>
              <button className="btn-ghost" style={{ padding: '8px', border: 'none' }} onClick={() => setSelectedAsset(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ marginBottom: '16px' }}>{renderChip(selectedAsset?.type || 'Other', typeColors)}</div>
              <h1 className="page-heading" style={{ fontSize: '32px', marginBottom: '8px' }}>{selectedAsset?.name || 'Unnamed Asset'}</h1>
              {selectedAsset?.goal_id && (() => {
                const linkedGoal = goals.find(g => g.id === selectedAsset.goal_id);
                return linkedGoal ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(232, 197, 109, 0.1)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', color: 'var(--accent)', marginBottom: '16px' }}>
                    <Target size={12} /> Part of: {linkedGoal.icon} {linkedGoal.name}
                  </div>
                ) : null;
              })()}
              
              <div className="card" style={{ background: 'var(--bg3)', marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div className="label" style={{ color: 'var(--text3)' }}>PRINCIPAL AMOUNT</div>
                    <div className="code-val" style={{ fontSize: '24px', color: 'var(--accent)' }}>₹{fmtMoney(selectedAsset?.amount || 0)}</div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div className="label" style={{ color: 'var(--text3)' }}>INTEREST RATE</div>
                      <div className="code-val" style={{ fontSize: '16px' }}>{selectedAsset?.rate || '0'}% p.a.</div>
                    </div>
                    {(selectedAsset?.start_date && selectedAsset?.maturity_date) && (
                      <div style={{ textAlign: 'right' }}>
                        <div className="label" style={{ color: 'var(--text3)' }}>EST. MATURITY AMOUNT</div>
                        <div className="code-val" style={{ fontSize: '16px', color: 'var(--green)' }}>₹{fmtMoney(calculateMaturity(selectedAsset))}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div className="card" style={{ padding: '16px', background: 'transparent' }}>
                  <div className="label" style={{ color: 'var(--text3)' }}>START DATE</div>
                  <div style={{ marginTop: '4px' }}>{selectedAsset?.start_date ? new Date(selectedAsset.start_date).toLocaleDateString() : '—'}</div>
                </div>
                <div className="card" style={{ padding: '16px', background: 'transparent' }}>
                  <div className="label" style={{ color: 'var(--text3)' }}>MATURITY DATE</div>
                  <div style={{ marginTop: '4px' }}>{selectedAsset?.maturity_date ? new Date(selectedAsset.maturity_date).toLocaleDateString() : '—'}</div>
                </div>
              </div>

              <div className="card" style={{ padding: '16px', background: 'transparent', marginBottom: '24px' }}>
                <div className="label" style={{ color: 'var(--text3)', marginBottom: '12px' }}>ASSIGNED OWNERS</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {selectedAsset?.members && selectedAsset.members.map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg2)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '30px' }}>
                      <span className="avatar" style={{ width: '20px', height: '20px', fontSize: '10px', background: m.avatar_color || 'var(--accent)' }}>{m?.initials || '?'}</span>
                      <span style={{ fontSize: '12px', fontWeight: 500 }}>{m?.name || 'Unknown'}</span>
                    </div>
                  ))}
                  {(!selectedAsset?.members || selectedAsset.members.length === 0) && <div style={{ fontSize: '12px', color: 'var(--text3)' }}>No owners assigned</div>}
                </div>
              </div>

              {selectedAsset?.notes && (
                <div className="card" style={{ padding: '16px', background: 'transparent', marginBottom: '24px' }}>
                  <div className="label" style={{ color: 'var(--text3)', marginBottom: '8px' }}>NOTES</div>
                  <div style={{ color: 'var(--text2)', fontStyle: 'italic', fontSize: '13px' }}>"{selectedAsset.notes}"</div>
                </div>
              )}

              {/* FD REFERRAL ENGINE — only for FDs within 60 days of maturity */}
              {selectedAsset?.type === 'FD' && getDays(selectedAsset?.maturity_date) > 0 && getDays(selectedAsset?.maturity_date) <= 60 && (
                <div className="card" style={{ padding: '16px', background: 'transparent', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div className="label" style={{ color: 'var(--text3)' }}>REINVESTMENT OPTIONS</div>
                    <span style={{ fontSize: '9px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', background: 'rgba(232, 197, 109, 0.15)', color: 'var(--accent)' }}>NEW</span>
                  </div>
                  <RateComparisonTable
                    maturingAmount={selectedAsset?.amount || 0}
                    currentRate={selectedAsset?.rate || 0}
                    assetId={selectedAsset?.id}
                    onPaywall={() => setPaywallOpen(true)}
                  />
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', display: 'flex', gap: '16px' }}>
              <button className="btn-ghost" style={{ flex: 1, display: 'flex', gap: '8px', justifyContent: 'center' }} onClick={handleEdit}>
                <Edit size={16} /> Edit Asset
              </button>
              <button className="btn-ghost" style={{ flex: 1, display: 'flex', gap: '8px', justifyContent: 'center', color: 'var(--red)', borderColor: 'rgba(232, 104, 90, 0.3)' }} onClick={handleDelete}>
                <Trash size={16} /> Delete
              </button>
            </div>
          </div>
        )}
      </div>
      
    </>
  );
}
