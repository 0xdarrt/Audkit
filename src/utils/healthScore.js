/**
 * Audkit Family Financial Health Score Engine
 * Calculates a composite score out of 100 based on 6 financial checks.
 */

const GRADE_MAP = [
  [90, 'A+'], [80, 'A'], [70, 'B+'], [60, 'B'], [50, 'C+'], [0, 'C']
];

const getGrade = (score) => {
  for (const [threshold, grade] of GRADE_MAP) {
    if (score >= threshold) return grade;
  }
  return 'C';
};

const getDays = (dateStr) => {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
};

export function calculateHealthScore(assets = [], members = [], goals = [], userProfile = {}) {
  const checks = [];
  const totalPortfolio = assets.reduce((s, a) => s + Number(a.amount || 0), 0);

  // CHECK 1: Emergency Fund (25 points)
  const monthlyExpenses = Number(userProfile.monthly_expenses) || 30000; // fallback
  const liquidAssets = assets.filter(a => {
    if (a.type === 'MF') return true; // liquid fund assumption
    if (a.type === 'FD' && a.maturity_date) {
      const days = getDays(a.maturity_date);
      return days !== null && days <= 365;
    }
    return false;
  }).reduce((s, a) => s + Number(a.amount || 0), 0);

  const coverageMonths = monthlyExpenses > 0 ? Math.floor(liquidAssets / monthlyExpenses) : 0;
  const emergencyPts = coverageMonths >= 6 ? 25 : coverageMonths >= 5 ? 22 : coverageMonths >= 4 ? 20 : coverageMonths >= 3 ? 15 : coverageMonths >= 2 ? 10 : coverageMonths >= 1 ? 5 : 0;
  checks.push({
    name: 'Emergency Fund',
    points: emergencyPts,
    max: 25,
    label: `Emergency fund covers ${coverageMonths} months of expenses`,
    recommendation: emergencyPts < 25 ? `Add ₹${new Intl.NumberFormat('en-IN').format((6 * monthlyExpenses) - liquidAssets)} more liquid assets to reach 6 months coverage` : 'You have a healthy emergency buffer'
  });

  // CHECK 2: Diversification (20 points)
  const typeCounts = {};
  assets.forEach(a => { typeCounts[a.type] = (typeCounts[a.type] || 0) + Number(a.amount || 0); });
  let maxConcentration = 0;
  let maxType = '';
  for (const [type, val] of Object.entries(typeCounts)) {
    const pct = totalPortfolio > 0 ? (val / totalPortfolio * 100) : 0;
    if (pct > maxConcentration) { maxConcentration = pct; maxType = type; }
  }
  const diversPts = maxConcentration > 70 ? 0 : maxConcentration > 60 ? 8 : maxConcentration > 50 ? 14 : maxConcentration > 40 ? 17 : 20;
  checks.push({
    name: 'Diversification',
    points: diversPts,
    max: 20,
    label: `${maxType || 'N/A'} makes up ${maxConcentration.toFixed(0)}% of your portfolio`,
    recommendation: diversPts < 20 ? `Reduce ${maxType} concentration below 40% by diversifying into other asset types` : 'Your portfolio is well diversified'
  });

  // CHECK 3: Inflation-beating instruments (20 points)
  const inflationBeaters = assets.filter(a => {
    if (a.type === 'SGB' || a.type === 'MF') return true;
    if (a.rate && Number(a.rate) > 7.5) return true;
    return false;
  });
  const inflationVal = inflationBeaters.reduce((s, a) => s + Number(a.amount || 0), 0);
  const inflationPct = totalPortfolio > 0 ? (inflationVal / totalPortfolio * 100) : 0;
  const inflationPts = inflationPct >= 80 ? 20 : inflationPct >= 60 ? 15 : inflationPct >= 40 ? 10 : inflationPct >= 20 ? 5 : 0;
  checks.push({
    name: 'Inflation Protection',
    points: inflationPts,
    max: 20,
    label: `${inflationPct.toFixed(0)}% of your wealth is beating inflation`,
    recommendation: inflationPts < 20 ? `Move more capital into SGB, MF, or high-yield FDs (>7.5%) to beat inflation` : 'Excellent inflation protection'
  });

  // CHECK 4: Nominee completeness (15 points)
  const withNominee = assets.filter(a => a.notes && a.notes.toLowerCase().includes('nominee')).length;
  const nomineePct = assets.length > 0 ? (withNominee / assets.length) : 0;
  const nomineePts = Math.round(nomineePct * 15);
  checks.push({
    name: 'Nominee Assignment',
    points: nomineePts,
    max: 15,
    label: `${withNominee} of ${assets.length} assets have nominees assigned`,
    recommendation: nomineePts < 15 ? `Add nominee details in asset notes for ${assets.length - withNominee} remaining assets` : 'All assets have nominees'
  });

  // CHECK 5: 80C Utilisation (10 points)
  const licTotal = assets.filter(a => a.type === 'LIC').reduce((s, a) => s + Number(a.amount || 0), 0);
  const ppfTotal = assets.filter(a => a.type === 'PPF').reduce((s, a) => s + Number(a.amount || 0), 0);
  const utilised80c = Math.min(licTotal + ppfTotal, 150000);
  const utilPts = Math.round((utilised80c / 150000) * 10);
  checks.push({
    name: '80C Utilisation',
    points: utilPts,
    max: 10,
    label: `₹${new Intl.NumberFormat('en-IN').format(utilised80c)} of ₹1.5L 80C limit utilised`,
    recommendation: utilPts < 10 ? `Invest ₹${new Intl.NumberFormat('en-IN').format(150000 - utilised80c)} more in LIC/PPF to max out your 80C deduction` : '80C fully utilised'
  });

  // CHECK 6: Maturity Awareness (10 points)
  const upcomingMaturities = assets.filter(a => {
    const d = getDays(a.maturity_date);
    return d !== null && d > 0 && d <= 60;
  });
  // Simplified: if user has no upcoming maturities, full points. Otherwise partial.
  const awarenessPts = upcomingMaturities.length === 0 ? 10 : (assets.length > 0 ? 5 : 10);
  checks.push({
    name: 'Maturity Awareness',
    points: awarenessPts,
    max: 10,
    label: `${upcomingMaturities.length} upcoming maturities within 60 days`,
    recommendation: awarenessPts < 10 ? `Review ${upcomingMaturities.length} assets maturing soon in your Reminders page` : 'All maturities are accounted for'
  });

  const total = checks.reduce((s, c) => s + c.points, 0);
  const grade = getGrade(total);

  // Insights: top 2 lowest scoring checks
  const sortedChecks = [...checks].sort((a, b) => (a.points / a.max) - (b.points / b.max));
  const insights = sortedChecks.slice(0, 2).map(c => ({
    check: c.name,
    message: c.recommendation
  }));

  return { total, grade, checks, insights };
}
