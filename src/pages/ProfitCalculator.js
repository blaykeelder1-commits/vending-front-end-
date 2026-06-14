import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { publicAPI } from '../services/api';
import { useIsMobile } from '../shared/theme';

const theme = {
  bg: '#0a0e12',
  surface: '#121821',
  surfaceHover: '#1b2430',
  border: '#27323f',
  primary: '#0c8a7e',
  success: '#22c55e',
  text: '#eef2f4',
  textSecondary: '#9fb0bb',
  textMuted: '#677884',
};

const defaults = {
  machineCount: 3,
  avgItemPrice: 1.75,
  itemsSoldPerDay: 15,
  costPerItem: 0.80,
  locationRent: 50,
};

// IDDI improvement estimates based on what the platform offers
const IDDI_BOOST = {
  salesIncrease: 0.18, // 18% more sales from stocking what customers actually want (polling data)
  spoilageReduction: 0.25, // 25% less spoilage from expiration tracking + smart reorder
};

function ProfitCalculator() {
  const [inputs, setInputs] = useState(defaults);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [sending, setSending] = useState(false);
  const isMobile = useIsMobile();

  const set = (key, raw) => {
    const val = parseFloat(raw);
    setInputs(prev => ({ ...prev, [key]: isNaN(val) ? 0 : val }));
  };

  // --- Current operation calculations ---
  const dailyRevenue = inputs.itemsSoldPerDay * inputs.avgItemPrice * inputs.machineCount;
  const dailyCost = inputs.itemsSoldPerDay * inputs.costPerItem * inputs.machineCount;
  const monthlyRevenue = dailyRevenue * 30;
  const monthlyCost = dailyCost + (inputs.locationRent * inputs.machineCount);
  const monthlyProfit = monthlyRevenue - monthlyCost;
  const annualProfit = monthlyProfit * 12;
  const profitPerMachine = inputs.machineCount > 0 ? monthlyProfit / inputs.machineCount : 0;

  // --- With IDDI calculations ---
  const iddiMonthlyRevenue = dailyRevenue * 30 * (1 + IDDI_BOOST.salesIncrease);
  const iddiMonthlyCost = (dailyCost * (1 - IDDI_BOOST.spoilageReduction)) + (inputs.locationRent * inputs.machineCount);
  const iddiMonthlyProfit = iddiMonthlyRevenue - iddiMonthlyCost;
  const iddiAnnualProfit = iddiMonthlyProfit * 12;
  const iddiExtraProfit = iddiMonthlyProfit - monthlyProfit;

  const fmt = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  const handleEmailResults = async () => {
    if (!email || !email.includes('@')) return;
    setSending(true);
    try {
      await publicAPI.captureLead({
        email,
        source: 'calculator',
        lead_magnet: 'calculator_results',
        utm_source: new URLSearchParams(window.location.search).get('utm_source') || '',
        utm_medium: new URLSearchParams(window.location.search).get('utm_medium') || '',
        utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign') || '',
      });
      setEmailSent(true);
    } catch {
      setEmailSent(true);
    }
    setSending(false);
  };

  const inputStyle = {
    width: '100%', padding: '14px 16px', backgroundColor: theme.surface,
    border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.text,
    fontSize: '16px', boxSizing: 'border-box',
  };
  const labelStyle = {
    display: 'block', marginBottom: '6px', color: theme.textSecondary,
    fontSize: '14px', fontWeight: '500',
  };
  const hintStyle = {
    color: theme.textMuted, fontSize: '12px', marginTop: '4px',
  };

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text, minHeight: '100vh' }}>
      <Helmet>
        <title>Vending Machine Profit Calculator (2026) | IDDI</title>
        <meta name="description" content="Calculate your vending machine profits instantly. Simple inputs, clear results. See how much more you could earn with smarter inventory management. Free calculator by IDDI." />
        <link rel="canonical" href="https://iddisolutions.net/vending-machine-profit-calculator" />
      </Helmet>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10, 14, 18, 0.95)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${theme.border}`, padding: '12px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Link to="/" style={{ fontWeight: '800', fontSize: '22px', letterSpacing: '3px', color: '#fff', textDecoration: 'none' }}>IDDI</Link>
        <div style={{ display: 'flex', gap: isMobile ? '8px' : '12px', alignItems: 'center' }}>
          {!isMobile && (
            <Link to="/pricing" style={{ color: theme.textSecondary, textDecoration: 'none', fontSize: '14px', padding: '8px 12px' }}>
              Pricing
            </Link>
          )}
          <Link to="/vendor/login" style={{ color: theme.textSecondary, textDecoration: 'none', fontSize: '14px', padding: '8px 12px' }}>
            Sign In
          </Link>
          <Link to="/vendor/login" style={{
            backgroundColor: theme.primary, color: '#fff', textDecoration: 'none',
            padding: '10px 20px', borderRadius: '6px', fontWeight: '600', fontSize: '14px',
          }}>
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section style={{ padding: isMobile ? '40px 16px 24px' : '60px 24px 32px', textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: '800', marginBottom: '12px' }}>
          How Much Can Your Machines Make?
        </h1>
        <p style={{ color: theme.textSecondary, fontSize: isMobile ? '14px' : '16px', lineHeight: 1.6, margin: 0 }}>
          Plug in your numbers. No jargon, no formulas — just your machines, your prices, and your costs.
        </p>
      </section>

      {/* Calculator */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: isMobile ? '0 16px 48px' : '0 24px 60px' }}>

        {/* Simple Inputs */}
        <div style={{
          backgroundColor: theme.surface, border: `1px solid ${theme.border}`,
          borderRadius: '12px', padding: isMobile ? '24px 20px' : '32px',
          marginBottom: '24px',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginTop: 0, marginBottom: '24px' }}>Tell us about your operation</h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '20px',
          }}>
            <div>
              <label style={labelStyle}>How many machines do you have?</label>
              <input type="number" value={inputs.machineCount} onChange={e => set('machineCount', e.target.value)} style={inputStyle} min="1" max="500" />
            </div>
            <div>
              <label style={labelStyle}>How many items sell per machine per day?</label>
              <input type="number" value={inputs.itemsSoldPerDay} onChange={e => set('itemsSoldPerDay', e.target.value)} style={inputStyle} min="1" max="200" />
              <p style={hintStyle}>Most machines sell 10-25 items per day</p>
            </div>
            <div>
              <label style={labelStyle}>Average price you charge per item</label>
              <input type="number" value={inputs.avgItemPrice} onChange={e => set('avgItemPrice', e.target.value)} style={inputStyle} min="0.25" max="20" step="0.25" />
              <p style={hintStyle}>Typical range: $1.25 - $2.50</p>
            </div>
            <div>
              <label style={labelStyle}>Average cost you pay per item</label>
              <input type="number" value={inputs.costPerItem} onChange={e => set('costPerItem', e.target.value)} style={inputStyle} min="0.10" max="15" step="0.05" />
              <p style={hintStyle}>What you pay wholesale per unit</p>
            </div>
            <div style={{ gridColumn: isMobile ? undefined : '1 / -1' }}>
              <label style={labelStyle}>Monthly rent per machine location</label>
              <input type="number" value={inputs.locationRent} onChange={e => set('locationRent', e.target.value)} style={inputStyle} min="0" max="500" step="10" />
              <p style={hintStyle}>$0 for free placements, $25-$150 typical for commission spots</p>
            </div>
          </div>
        </div>

        {/* Results: Current vs With IDDI */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '24px',
          marginBottom: '24px',
        }}>
          {/* Current Results */}
          <div style={{
            backgroundColor: theme.surface, border: `1px solid ${theme.border}`,
            borderRadius: '12px', padding: isMobile ? '24px 20px' : '28px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginTop: 0, marginBottom: '20px', color: theme.textSecondary }}>
              Your Current Estimate
            </h3>

            <div style={{
              padding: '20px', borderRadius: '10px', textAlign: 'center', marginBottom: '16px',
              backgroundColor: monthlyProfit > 0 ? theme.success + '10' : '#ef444410',
              border: `1px solid ${monthlyProfit > 0 ? theme.success + '40' : '#ef444440'}`,
            }}>
              <div style={{ color: theme.textMuted, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px' }}>Monthly Profit</div>
              <div style={{ fontSize: isMobile ? '32px' : '36px', fontWeight: '800', color: monthlyProfit > 0 ? theme.success : '#ef4444' }}>
                {fmt(monthlyProfit)}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px', backgroundColor: theme.bg, borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ color: theme.textMuted, fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>ANNUAL</div>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>{fmt(annualProfit)}</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: theme.bg, borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ color: theme.textMuted, fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>PER MACHINE</div>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>{fmt(profitPerMachine)}/mo</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: theme.bg, borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ color: theme.textMuted, fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>REVENUE</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: theme.textSecondary }}>{fmt(monthlyRevenue)}/mo</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: theme.bg, borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ color: theme.textMuted, fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>COSTS</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: theme.textSecondary }}>{fmt(monthlyCost)}/mo</div>
              </div>
            </div>
          </div>

          {/* With IDDI Results */}
          <div style={{
            backgroundColor: theme.surface,
            border: `2px solid ${theme.primary}40`,
            borderRadius: '12px', padding: isMobile ? '24px 20px' : '28px',
            boxShadow: `0 0 30px ${theme.primary}10`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginTop: 0, marginBottom: 0, color: theme.primary }}>
                With IDDI
              </h3>
              {iddiExtraProfit > 0 && (
                <span style={{
                  padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700',
                  backgroundColor: theme.success + '15', color: theme.success,
                }}>
                  +{fmt(iddiExtraProfit)}/mo
                </span>
              )}
            </div>

            <div style={{
              padding: '20px', borderRadius: '10px', textAlign: 'center', marginBottom: '16px',
              backgroundColor: theme.primary + '10',
              border: `1px solid ${theme.primary}30`,
            }}>
              <div style={{ color: theme.textMuted, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px' }}>Monthly Profit</div>
              <div style={{ fontSize: isMobile ? '32px' : '36px', fontWeight: '800', color: theme.primary }}>
                {fmt(iddiMonthlyProfit)}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', backgroundColor: theme.bg, borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ color: theme.textMuted, fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>ANNUAL</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: theme.primary }}>{fmt(iddiAnnualProfit)}</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: theme.bg, borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ color: theme.textMuted, fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>EXTRA/YEAR</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: theme.success }}>{fmt(iddiExtraProfit * 12)}</div>
              </div>
            </div>

            {/* How IDDI helps */}
            <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '16px' }}>
              <p style={{ color: theme.textMuted, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '10px' }}>How IDDI improves your numbers</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: theme.textSecondary }}>
                  <span>Better product selection via customer polls</span>
                  <span style={{ color: theme.success, fontWeight: '600' }}>+18% sales</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: theme.textSecondary }}>
                  <span>Reduced spoilage with expiration tracking</span>
                  <span style={{ color: theme.success, fontWeight: '600' }}>-25% waste</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{
          backgroundColor: theme.primary + '10', border: `2px solid ${theme.primary}30`,
          borderRadius: '12px', padding: isMobile ? '28px 20px' : '32px', textAlign: 'center',
          marginBottom: '48px',
        }}>
          {emailSent ? (
            <div>
              <p style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px' }}>Results saved!</p>
              <p style={{ color: theme.textSecondary, margin: '0 0 16px', fontSize: '14px' }}>
                Ready to start earning {fmt(iddiExtraProfit)}/mo more?
              </p>
              <Link to="/vendor/login" style={{
                backgroundColor: theme.primary, color: '#fff', textDecoration: 'none',
                padding: '14px 32px', borderRadius: '8px', fontWeight: '600', display: 'inline-block',
                fontSize: '15px',
              }}>
                Try IDDI Free
              </Link>
            </div>
          ) : (
            <div>
              <p style={{ margin: '0 0 4px', fontWeight: '700', fontSize: '16px' }}>Save Your Results</p>
              <p style={{ color: theme.textSecondary, margin: '0 0 16px', fontSize: '14px' }}>
                Get a breakdown emailed to you + tips to maximize profits.
              </p>
              <div style={{
                display: 'flex', flexDirection: isMobile ? 'column' : 'row',
                gap: '8px', maxWidth: '400px', margin: '0 auto',
              }}>
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                  onKeyDown={e => e.key === 'Enter' && handleEmailResults()}
                />
                <button
                  onClick={handleEmailResults}
                  disabled={sending || !email.includes('@')}
                  style={{
                    backgroundColor: theme.primary, color: '#fff', border: 'none',
                    padding: '14px 24px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
                    opacity: sending || !email.includes('@') ? 0.5 : 1,
                    whiteSpace: 'nowrap', fontSize: '15px',
                  }}
                >
                  {sending ? '...' : 'Email Me'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SEO content */}
        <section style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px' }}>How to Calculate Vending Machine Profits</h2>
          <div style={{ color: theme.textSecondary, lineHeight: '1.8', fontSize: '15px' }}>
            <p>
              Vending machine profitability depends on a few key variables: <strong>location traffic</strong>, <strong>product selection</strong>, <strong>pricing</strong>, and <strong>operational costs</strong>. Most operators see profit margins between 20-50% depending on their setup.
            </p>
            <h3 style={{ color: theme.text, fontSize: '18px', marginTop: '24px' }}>Key Factors That Affect Your Profits</h3>
            <ul style={{ paddingLeft: '20px' }}>
              <li><strong>Location</strong> — High-traffic spots (offices, gyms, hospitals) can generate 2-3x more revenue than low-traffic ones.</li>
              <li><strong>Product Mix</strong> — Stocking what customers actually want is critical. IDDI uses QR-based customer polls so operators stock based on real demand, not guesswork.</li>
              <li><strong>Spoilage</strong> — Products that expire before selling are pure loss. IDDI tracks expiration dates and alerts you before products go bad.</li>
              <li><strong>Commission/Rent</strong> — Location costs typically range from $0 (free placement) to $200/month for premium spots.</li>
            </ul>
            <h3 style={{ color: theme.text, fontSize: '18px', marginTop: '24px' }}>How IDDI Helps You Earn More</h3>
            <p>
              Most operators lose money on products that don't sell or expire before anyone buys them. IDDI solves both problems. Customer polls tell you what people actually want, so you stock smarter. Expiration tracking alerts you before products go bad, so you waste less. The result: higher sales, lower costs, and more profit per machine.
            </p>
            <p>
              Use the calculator above to see your numbers, then{' '}
              <Link to="/vendor/login" style={{ color: theme.primary }}>try IDDI free</Link> on your first machine to see the difference.
            </p>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${theme.border}`, padding: '40px 24px',
        maxWidth: '900px', margin: '0 auto',
        display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '32px',
      }}>
        <div>
          <span style={{ fontWeight: '800', fontSize: '18px', letterSpacing: '3px' }}>IDDI</span>
          <p style={{ color: theme.textMuted, fontSize: '13px', marginTop: '8px' }}>
            Free vending machine management for everyone.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: theme.textMuted, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '12px' }}>Product</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link to="/for-vendors" style={{ color: theme.textSecondary, textDecoration: 'none', fontSize: '14px' }}>For Vendors</Link>
              <Link to="/pricing" style={{ color: theme.textSecondary, textDecoration: 'none', fontSize: '14px' }}>Pricing</Link>
              <Link to="/vendor/login" style={{ color: theme.textSecondary, textDecoration: 'none', fontSize: '14px' }}>Sign In</Link>
            </div>
          </div>
          <div>
            <div style={{ color: theme.textMuted, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '12px' }}>Resources</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link to="/blog" style={{ color: theme.textSecondary, textDecoration: 'none', fontSize: '14px' }}>Blog</Link>
              <Link to="/how-to-start-a-vending-machine-business" style={{ color: theme.textSecondary, textDecoration: 'none', fontSize: '14px' }}>Startup Guide</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ProfitCalculator;
