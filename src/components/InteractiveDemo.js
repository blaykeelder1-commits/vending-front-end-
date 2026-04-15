import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';

const theme = {
  bg: '#0d0d1a',
  surface: '#1a1a2e',
  surfaceHover: '#252540',
  border: '#2a2a4a',
  primary: '#7c6df0',
  primaryHover: '#6b5ce0',
  secondary: '#06b6d4',
  success: '#34d399',
  danger: '#f87171',
  warning: '#fbbf24',
  text: '#f0f0f5',
  textSecondary: '#9d9db5',
  textMuted: '#6b6b85',
};

const STEP_DURATION = 3800;

const demoSteps = [
  {
    id: 'add-machine',
    title: 'Add Your First Machine',
    annotation: 'Name it, drop a location, and it\'s live in your dashboard. Under 30 seconds.',
  },
  {
    id: 'load-products',
    title: 'Load Your Products',
    annotation: 'Build your planogram in bulk. Drag, drop, done — every slot accounted for.',
  },
  {
    id: 'generate-qr',
    title: 'Generate a QR Code',
    annotation: 'One click generates a unique QR. Print it, stick it on the machine, and start collecting data.',
  },
  {
    id: 'customer-scans',
    title: 'Customer Scans & Votes',
    annotation: 'Customers swipe through your products in seconds — telling you exactly what they want stocked.',
  },
  {
    id: 'votes-arrive',
    title: 'Votes Roll In Real-Time',
    annotation: 'See which products your customers love and which ones sit. No more guessing.',
  },
  {
    id: 'dashboard-updates',
    title: 'Performance Dashboard Updates',
    annotation: 'Revenue per machine, top performers, underperformers — all in one view, updating live.',
  },
  {
    id: 'spoilage-alert',
    title: 'Spoilage Alert Fires',
    annotation: 'Catch expiring products before they cost you money. IDDI watches so you don\'t have to.',
  },
  {
    id: 'route-plan',
    title: 'Route Plan Generated',
    annotation: 'Know exactly what to bring to each machine — optimized stops, zero wasted trips.',
  },
  {
    id: 'cta',
    title: 'Your Turn',
    annotation: 'Set up your first machine in under 2 minutes. Free — no credit card required.',
  },
];

// Mini dashboard mockup screens for each step
function StepAddMachine({ progress }) {
  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '12px', fontSize: '13px', fontWeight: '600', color: theme.text }}>
        + New Machine
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            background: theme.surfaceHover, border: `1px solid ${theme.border}`,
            borderRadius: '6px', padding: '10px 12px', fontSize: '13px', color: theme.text,
            overflow: 'hidden',
          }}>
            <span style={{
              opacity: progress > 0.2 ? 1 : 0,
              transition: 'opacity 0.4s',
            }}>Break Room - Building A</span>
            {progress <= 0.2 && <span style={{ color: theme.textMuted }}>Machine name...</span>}
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{
            background: theme.surfaceHover, border: `1px solid ${theme.border}`,
            borderRadius: '6px', padding: '10px 12px', fontSize: '13px', color: theme.text,
          }}>
            <span style={{
              opacity: progress > 0.45 ? 1 : 0,
              transition: 'opacity 0.4s',
            }}>123 Industrial Pkwy, Suite 200</span>
            {progress <= 0.45 && <span style={{ color: theme.textMuted }}>Location address...</span>}
          </div>
        </div>
        <button style={{
          background: progress > 0.7 ? theme.success : theme.primary,
          color: '#fff', border: 'none', borderRadius: '6px',
          padding: '10px', fontSize: '13px', fontWeight: '600',
          transition: 'background 0.3s',
          cursor: 'default',
        }}>
          {progress > 0.7 ? 'Machine Added' : 'Add Machine'}
        </button>
      </div>
    </div>
  );
}

function StepLoadProducts({ progress }) {
  const products = [
    { name: 'Coca-Cola', price: '$1.75', slot: 'A1' },
    { name: 'Lay\'s Classic', price: '$2.00', slot: 'A2' },
    { name: 'Snickers', price: '$1.50', slot: 'B1' },
    { name: 'Dasani Water', price: '$1.25', slot: 'B2' },
    { name: 'Red Bull', price: '$3.50', slot: 'C1' },
  ];
  const visibleCount = Math.min(5, Math.floor(progress * 7) + 1);

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ fontSize: '13px', fontWeight: '600', color: theme.text, marginBottom: '12px' }}>
        Break Room - Building A
        <span style={{ color: theme.textMuted, fontWeight: '400', marginLeft: '8px' }}>
          {Math.min(visibleCount, 5)} products
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {products.slice(0, visibleCount).map((p, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: theme.surfaceHover, borderRadius: '6px', padding: '8px 12px',
            border: `1px solid ${theme.border}`,
            opacity: i === visibleCount - 1 && progress < 0.9 ? 0.7 : 1,
            transform: i === visibleCount - 1 && progress < 0.9 ? 'translateY(4px)' : 'none',
            transition: 'all 0.3s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: theme.primary + '20', color: theme.primary,
                fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px',
              }}>{p.slot}</span>
              <span style={{ fontSize: '13px', color: theme.text }}>{p.name}</span>
            </div>
            <span style={{ fontSize: '12px', color: theme.success, fontWeight: '600' }}>{p.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepGenerateQR({ progress }) {
  return (
    <div style={{ padding: '16px', textAlign: 'center' }}>
      <div style={{ fontSize: '13px', fontWeight: '600', color: theme.text, marginBottom: '16px', textAlign: 'left' }}>
        QR Code — Break Room - Building A
      </div>
      <div style={{
        width: '120px', height: '120px', margin: '0 auto 16px',
        background: '#fff', borderRadius: '12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: progress > 0.3 ? 'scale(1)' : 'scale(0.8)',
        opacity: progress > 0.3 ? 1 : 0,
        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        {/* Simple QR pattern */}
        <svg width="90" height="90" viewBox="0 0 90 90">
          <rect x="5" y="5" width="25" height="25" rx="3" fill="#1a1a2e" />
          <rect x="60" y="5" width="25" height="25" rx="3" fill="#1a1a2e" />
          <rect x="5" y="60" width="25" height="25" rx="3" fill="#1a1a2e" />
          <rect x="10" y="10" width="15" height="15" rx="2" fill="#7c6df0" />
          <rect x="65" y="10" width="15" height="15" rx="2" fill="#7c6df0" />
          <rect x="10" y="65" width="15" height="15" rx="2" fill="#7c6df0" />
          <rect x="35" y="5" width="5" height="5" fill="#1a1a2e" />
          <rect x="35" y="15" width="5" height="5" fill="#1a1a2e" />
          <rect x="45" y="5" width="5" height="5" fill="#1a1a2e" />
          <rect x="35" y="35" width="20" height="20" rx="4" fill="#7c6df0" />
          <rect x="5" y="40" width="5" height="5" fill="#1a1a2e" />
          <rect x="15" y="40" width="5" height="5" fill="#1a1a2e" />
          <rect x="60" y="40" width="5" height="5" fill="#1a1a2e" />
          <rect x="70" y="40" width="5" height="5" fill="#1a1a2e" />
          <rect x="80" y="40" width="5" height="5" fill="#1a1a2e" />
          <rect x="60" y="60" width="5" height="5" fill="#1a1a2e" />
          <rect x="70" y="70" width="5" height="5" fill="#1a1a2e" />
          <rect x="80" y="60" width="5" height="5" fill="#1a1a2e" />
          <rect x="80" y="80" width="5" height="5" fill="#1a1a2e" />
        </svg>
      </div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        background: progress > 0.6 ? theme.success + '20' : theme.primary + '20',
        color: progress > 0.6 ? theme.success : theme.primary,
        padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
        transition: 'all 0.3s',
      }}>
        {progress > 0.6 ? 'Ready to print' : 'Generating...'}
      </div>
    </div>
  );
}

function StepCustomerScans({ progress }) {
  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          width: '36px', height: '52px', borderRadius: '8px',
          border: `2px solid ${progress > 0.3 ? theme.success : theme.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 0.3s',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Phone icon */}
          <div style={{
            width: '20px', height: '20px', borderRadius: '3px',
            background: progress > 0.3 ? theme.primary : theme.surfaceHover,
            transition: 'background 0.3s',
          }} />
          {progress > 0.3 && (
            <div style={{
              position: 'absolute', top: '-2px', right: '-2px',
              width: '10px', height: '10px', borderRadius: '50%',
              background: theme.success, border: '2px solid ' + theme.surface,
            }} />
          )}
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: theme.text }}>
            {progress > 0.3 ? 'Customer connected' : 'Waiting for scan...'}
          </div>
          <div style={{ fontSize: '11px', color: theme.textMuted }}>Break Room - Building A</div>
        </div>
      </div>
      {progress > 0.4 && (
        <div style={{
          background: theme.surfaceHover, borderRadius: '10px', padding: '14px',
          border: `1px solid ${theme.border}`,
          opacity: progress > 0.5 ? 1 : 0,
          transform: progress > 0.5 ? 'translateY(0)' : 'translateY(8px)',
          transition: 'all 0.4s',
        }}>
          <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Customer is swiping...
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['Coca-Cola', 'Lay\'s', 'Snickers', 'Red Bull'].map((name, i) => {
              const voted = progress > 0.5 + (i * 0.12);
              const liked = i !== 2; // Snickers gets a pass
              return (
                <div key={i} style={{
                  padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
                  background: voted ? (liked ? theme.success + '20' : theme.danger + '20') : theme.surface,
                  color: voted ? (liked ? theme.success : theme.danger) : theme.textMuted,
                  border: `1px solid ${voted ? (liked ? theme.success + '30' : theme.danger + '30') : theme.border}`,
                  transition: 'all 0.3s',
                }}>
                  {voted ? (liked ? '+' : 'x') : '?'} {name}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StepVotesArrive({ progress }) {
  const baseVotes = [
    { name: 'Coca-Cola', votes: 47, pct: 89 },
    { name: 'Red Bull', votes: 38, pct: 72 },
    { name: 'Dasani Water', votes: 34, pct: 64 },
    { name: 'Lay\'s Classic', votes: 29, pct: 55 },
    { name: 'Snickers', votes: 14, pct: 26 },
  ];

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ fontSize: '13px', fontWeight: '600', color: theme.text, marginBottom: '4px' }}>
        Customer Votes
      </div>
      <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '12px' }}>
        53 total votes this week
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {baseVotes.map((item, i) => {
          const barWidth = Math.min(item.pct, item.pct * (progress * 1.3));
          return (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ fontSize: '12px', color: theme.text }}>{item.name}</span>
                <span style={{ fontSize: '11px', color: item.pct > 50 ? theme.success : theme.danger, fontWeight: '600' }}>
                  {Math.round(item.pct * Math.min(1, progress * 1.3))}%
                </span>
              </div>
              <div style={{ height: '6px', borderRadius: '3px', background: theme.surfaceHover, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '3px',
                  background: item.pct > 50
                    ? `linear-gradient(90deg, ${theme.success}80, ${theme.success})`
                    : `linear-gradient(90deg, ${theme.danger}60, ${theme.danger})`,
                  width: `${barWidth}%`,
                  transition: 'width 0.6s ease-out',
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepDashboardUpdates({ progress }) {
  const animateNum = (target) => Math.round(target * Math.min(1, progress * 1.4));

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ fontSize: '13px', fontWeight: '600', color: theme.text, marginBottom: '12px' }}>
        Performance Overview
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        {[
          { label: 'Revenue', value: `$${animateNum(2847)}`, color: theme.success, sub: '+18% vs last month' },
          { label: 'Machines', value: '5', color: theme.primary, sub: 'All active' },
          { label: 'Top Product', value: 'Cola', color: theme.warning, sub: '89% approval' },
          { label: 'Waste Saved', value: `$${animateNum(135)}`, color: theme.secondary, sub: '-25% spoilage' },
        ].map((stat, i) => (
          <div key={i} style={{
            background: theme.surfaceHover, borderRadius: '8px', padding: '10px',
            border: `1px solid ${theme.border}`,
            opacity: progress > (i * 0.15) ? 1 : 0,
            transform: progress > (i * 0.15) ? 'scale(1)' : 'scale(0.95)',
            transition: 'all 0.4s',
          }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '2px' }}>{stat.label}</div>
            <div style={{ fontSize: '10px', color: theme.textSecondary, marginTop: '2px' }}>{stat.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepSpoilageAlert({ progress }) {
  return (
    <div style={{ padding: '16px' }}>
      <div style={{ fontSize: '13px', fontWeight: '600', color: theme.text, marginBottom: '12px' }}>
        Inventory Alerts
      </div>
      {/* Alert banner */}
      <div style={{
        background: theme.danger + '15',
        borderLeft: `4px solid ${theme.danger}`,
        borderRadius: '8px', padding: '12px 14px', marginBottom: '10px',
        opacity: progress > 0.2 ? 1 : 0,
        transform: progress > 0.2 ? 'translateX(0)' : 'translateX(-12px)',
        transition: 'all 0.4s',
      }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: theme.danger, marginBottom: '4px' }}>
          3 products expiring within 3 days
        </div>
        <div style={{ fontSize: '11px', color: theme.textSecondary }}>
          Break Room - Building A
        </div>
      </div>
      {/* Expiring items */}
      {[
        { name: 'Greek Yogurt', days: 1, slot: 'C3' },
        { name: 'Fresh Sandwich', days: 2, slot: 'D1' },
        { name: 'Orange Juice', days: 3, slot: 'B4' },
      ].map((item, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 12px', borderRadius: '6px',
          background: theme.surfaceHover, border: `1px solid ${theme.border}`,
          marginBottom: '6px',
          opacity: progress > 0.35 + (i * 0.15) ? 1 : 0,
          transition: 'opacity 0.3s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px',
              background: theme.danger + '20', color: theme.danger,
            }}>{item.slot}</span>
            <span style={{ fontSize: '12px', color: theme.text }}>{item.name}</span>
          </div>
          <span style={{
            fontSize: '11px', fontWeight: '600',
            color: item.days <= 1 ? theme.danger : theme.warning,
          }}>
            {item.days}d left
          </span>
        </div>
      ))}
    </div>
  );
}

function StepRoutePlan({ progress }) {
  const stops = [
    { name: 'Break Room - Bldg A', items: 8, priority: 'high' },
    { name: 'Lobby - Main Office', items: 4, priority: 'medium' },
    { name: 'Gym - 2nd Floor', items: 3, priority: 'low' },
  ];

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ fontSize: '13px', fontWeight: '600', color: theme.text, marginBottom: '4px' }}>
        Today's Route Plan
      </div>
      <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '12px' }}>
        3 stops &middot; 15 items to restock
      </div>
      {stops.map((stop, i) => {
        const active = progress > (i * 0.25);
        const colors = { high: theme.danger, medium: theme.warning, low: theme.success };
        return (
          <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: i < stops.length - 1 ? '4px' : 0 }}>
            {/* Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px' }}>
              <div style={{
                width: '16px', height: '16px', borderRadius: '50%',
                background: active ? theme.primary : theme.surfaceHover,
                border: `2px solid ${active ? theme.primary : theme.border}`,
                transition: 'all 0.3s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '9px', color: '#fff', fontWeight: '700',
              }}>
                {active ? i + 1 : ''}
              </div>
              {i < stops.length - 1 && (
                <div style={{
                  width: '2px', flex: 1, minHeight: '24px',
                  background: progress > ((i + 1) * 0.25) ? theme.primary + '60' : theme.border,
                  transition: 'background 0.3s',
                }} />
              )}
            </div>
            {/* Stop card */}
            <div style={{
              flex: 1, background: theme.surfaceHover, borderRadius: '8px',
              padding: '10px 12px', border: `1px solid ${theme.border}`,
              marginBottom: '8px',
              opacity: active ? 1 : 0.4,
              transition: 'opacity 0.4s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: theme.text }}>{stop.name}</span>
                <span style={{
                  fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '10px',
                  background: colors[stop.priority] + '20', color: colors[stop.priority],
                }}>
                  {stop.items} items
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StepCTA() {
  return (
    <div style={{ padding: '24px 16px', textAlign: 'center' }}>
      <div style={{
        fontSize: '24px', fontWeight: '800', color: theme.text,
        marginBottom: '8px', lineHeight: '1.2',
      }}>
        Your Turn
      </div>
      <p style={{
        color: theme.textSecondary, fontSize: '14px', lineHeight: '1.6',
        marginBottom: '20px', maxWidth: '280px', margin: '0 auto 20px',
      }}>
        Set up your first machine in under 2 minutes. Everything you just saw — free.
      </p>
      <Link to="/vendor/login" style={{
        display: 'block', background: theme.primary, color: '#fff',
        textDecoration: 'none', padding: '14px 24px', borderRadius: '8px',
        fontWeight: '700', fontSize: '15px', textAlign: 'center',
      }}>
        Start Free — No Credit Card
      </Link>
      <div style={{ marginTop: '12px', fontSize: '12px', color: theme.textMuted }}>
        Free tier includes 1 machine, unlimited products, full analytics
      </div>
    </div>
  );
}

const stepComponents = [
  StepAddMachine,
  StepLoadProducts,
  StepGenerateQR,
  StepCustomerScans,
  StepVotesArrive,
  StepDashboardUpdates,
  StepSpoilageAlert,
  StepRoutePlan,
  StepCTA,
];

function InteractiveDemo({ isMobile }) {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);
  const progressRef = useRef(null);
  const startTimeRef = useRef(null);

  const advanceStep = useCallback(() => {
    setActiveStep(prev => {
      if (prev >= demoSteps.length - 1) return prev; // Stay on CTA
      return prev + 1;
    });
    setProgress(0);
  }, []);

  // Progress animation
  useEffect(() => {
    if (paused || activeStep >= demoSteps.length - 1) return;

    startTimeRef.current = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const p = Math.min(1, elapsed / STEP_DURATION);
      setProgress(p);

      if (p < 1) {
        progressRef.current = requestAnimationFrame(animate);
      } else {
        timerRef.current = setTimeout(advanceStep, 200);
      }
    };

    progressRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(progressRef.current);
      clearTimeout(timerRef.current);
    };
  }, [activeStep, paused, advanceStep]);

  const goToStep = (index) => {
    setActiveStep(index);
    setProgress(0);
    setPaused(false);
  };

  const togglePause = () => {
    setPaused(prev => !prev);
  };

  const StepComponent = stepComponents[activeStep];
  const isLastStep = activeStep === demoSteps.length - 1;

  return (
    <div style={{
      maxWidth: '420px',
      margin: '0 auto',
      background: theme.surface,
      borderRadius: '16px',
      border: `1px solid ${theme.border}`,
      overflow: 'hidden',
      boxShadow: `0 4px 24px rgba(0,0,0,0.3), 0 0 60px ${theme.primary}06`,
    }}>
      {/* Top bar — step title + controls */}
      <div style={{
        padding: '14px 16px 10px',
        borderBottom: `1px solid ${theme.border}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', color: theme.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isLastStep ? '' : `Step ${activeStep + 1} of ${demoSteps.length - 1}`}
          </div>
          {!isLastStep && (
            <button
              onClick={togglePause}
              style={{
                background: 'none', border: `1px solid ${theme.border}`,
                color: theme.textMuted, borderRadius: '4px', padding: '2px 8px',
                fontSize: '11px', cursor: 'pointer',
              }}
            >
              {paused ? 'Play' : 'Pause'}
            </button>
          )}
        </div>

        {/* Progress bar */}
        {!isLastStep && (
          <div style={{ height: '3px', borderRadius: '2px', background: theme.surfaceHover, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '2px',
              background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`,
              width: `${((activeStep + progress) / (demoSteps.length - 1)) * 100}%`,
              transition: 'width 0.1s linear',
            }} />
          </div>
        )}

        {/* Step title */}
        {!isLastStep && (
          <div style={{ marginTop: '10px' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: theme.text }}>
              {demoSteps[activeStep].title}
            </div>
          </div>
        )}
      </div>

      {/* Step content */}
      <div style={{ minHeight: '220px', position: 'relative' }}>
        <StepComponent progress={progress} />
      </div>

      {/* Annotation + dots */}
      <div style={{
        padding: '12px 16px 16px',
        borderTop: `1px solid ${theme.border}`,
      }}>
        <p style={{
          fontSize: '13px', color: theme.textSecondary, lineHeight: '1.5',
          margin: '0 0 12px', minHeight: '40px',
        }}>
          {demoSteps[activeStep].annotation}
        </p>

        {/* Step dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
          {demoSteps.map((_, i) => (
            <button
              key={i}
              onClick={() => goToStep(i)}
              style={{
                width: i === activeStep ? '20px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: i === activeStep
                  ? theme.primary
                  : i < activeStep
                    ? theme.primary + '50'
                    : theme.surfaceHover,
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.3s',
              }}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default InteractiveDemo;
