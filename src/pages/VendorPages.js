import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { vendorAPI } from '../services/api';
import { theme, styles, useIsMobile } from '../shared/theme';
import { useToast } from '../shared/toast';
import { formatTimeAgo } from '../shared/utils';
import QRCode from 'qrcode';
import SubscriptionGate from '../components/SubscriptionGate';
import { FeatureTipBanner } from '../components/FeatureTooltip';

const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL || window.location.origin;

function VendorDashboard() {
  const [machines, setMachines] = useState([]);
  const [products, setProducts] = useState([]);
  const [showMachineForm, setShowMachineForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expiringCount, setExpiringCount] = useState(0);
  const [pendingSuggestions, setPendingSuggestions] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [expiringSoonCount, setExpiringSoonCount] = useState(0);
  const [referralCode, setReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [onboardingDismissed, setOnboardingDismissed] = useState(() => localStorage.getItem('iddi_onboarding_dismissed') === 'true');
  const navigate = useNavigate();
  const toast = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/vendor/login');
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [machinesRes, productsRes, expiringRes, suggestionsRes, alertsRes, referralCodeRes, referralsRes] = await Promise.allSettled([
        vendorAPI.getMachines(),
        vendorAPI.getProducts(),
        vendorAPI.getExpiringProducts(14),
        vendorAPI.getSuggestions({ status: 'pending' }),
        vendorAPI.getInventoryAlerts(),
        vendorAPI.getReferralCode(),
        vendorAPI.getReferrals()
      ]);

      if (machinesRes.status === 'fulfilled') {
        const machines = machinesRes.value?.data?.data?.machines;
        setMachines(Array.isArray(machines) ? machines : []);
      }
      if (productsRes.status === 'fulfilled') {
        const products = productsRes.value?.data?.data?.products;
        setProducts(Array.isArray(products) ? products : []);
      }
      if (expiringRes.status === 'fulfilled') {
        const expiring = expiringRes.value?.data?.data?.products || [];
        setExpiringCount(expiring.length);
        const soonCount = expiring.filter(p => {
          const daysLeft = Math.ceil((new Date(p.expiration_date) - new Date()) / (1000 * 60 * 60 * 24));
          return daysLeft <= 3;
        }).length;
        setExpiringSoonCount(soonCount);
      }
      if (suggestionsRes.status === 'fulfilled') {
        const suggestions = suggestionsRes.value?.data?.data?.suggestions || [];
        setPendingSuggestions(suggestions.length);
      }
      if (alertsRes.status === 'fulfilled') {
        setLowStockCount(alertsRes.value?.data?.data?.count || 0);
      }
      if (referralCodeRes.status === 'fulfilled') {
        setReferralCode(referralCodeRes.value?.data?.data?.referralCode || '');
      }
      if (referralsRes.status === 'fulfilled') {
        setReferralCount(referralsRes.value?.data?.data?.count || 0);
      }
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    navigate('/vendor/login');
  };

  const handleDownloadQR = async (machineId) => {
    try {
      const response = await vendorAPI.getMachineQR(machineId);
      const qrUrl = response.data.data.qr_url;
      const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 512 });
      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = `machine-qr-${machineId}.png`;
      link.click();
      toast.success('QR code downloaded');
      localStorage.setItem('iddi_qr_downloaded', 'true');
    } catch (err) {
      toast.error('Failed to generate QR code');
    }
  };

  const handleDeleteMachine = async (machineId, machineName) => {
    if (!window.confirm(`Are you sure you want to delete "${machineName}"? This will also remove all inventory and customer data associated with this machine. This action cannot be undone.`)) {
      return;
    }
    try {
      await vendorAPI.deleteMachine(machineId);
      toast.success('Machine deleted successfully');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete machine');
    }
  };

  if (loading) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  const statCardStyle = {
    flex: 1,
    minWidth: '70px',
    background: theme.surface,
    borderRadius: '10px',
    padding: '12px 8px',
    textAlign: 'center',
    border: `1px solid ${theme.border}`,
  };

  // Onboarding checklist logic
  const onboardingSteps = [
    { id: 'machine', label: 'Add your first machine', why: 'Machines are the foundation — every feature builds on this.', done: machines.length > 0, action: () => setShowMachineForm(true) },
    { id: 'products', label: 'Add at least 5 products', why: 'More products = better data. Polls need options to compare.', done: products.length >= 5, action: () => setShowProductForm(true) },
    { id: 'qr', label: 'Download a QR code', why: 'This is how customers engage. No QR = no votes, no data.', done: machines.length > 0 && localStorage.getItem('iddi_qr_downloaded'), action: machines.length > 0 ? () => handleDownloadQR(machines[0].id) : null },
    { id: 'referral', label: 'Share your referral link', why: 'Refer other operators and earn rewards as they grow.', done: referralCount > 0, action: () => { if (referralCode) { navigator.clipboard.writeText(`${window.location.origin}/ref/${referralCode}`); toast.success('Referral link copied — share it!'); } } },
  ];
  const completedSteps = onboardingSteps.filter(s => s.done).length;
  const onboardingProgress = Math.round((completedSteps / onboardingSteps.length) * 100);
  const showOnboarding = !onboardingDismissed && completedSteps < onboardingSteps.length;

  return (
    <div style={styles.page}>
      {/* First-time tip: welcome */}
      <FeatureTipBanner
        id="welcome"
        text="Welcome to IDDI! Follow the checklist below to get your first machine up and running. Each step unlocks more of the dashboard."
      />

      {/* Onboarding Checklist */}
      {showOnboarding && (
        <div style={{
          ...styles.card,
          borderRadius: '14px',
          padding: isMobile ? '20px' : '24px',
          marginBottom: '20px',
          border: `1px solid ${theme.primary}30`,
          background: `linear-gradient(135deg, ${theme.surface} 0%, ${theme.primary}06 100%)`,
          position: 'relative',
        }}>
          {completedSteps >= 2 && (
            <button
              onClick={() => { setOnboardingDismissed(true); localStorage.setItem('iddi_onboarding_dismissed', 'true'); }}
              style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: '18px', padding: '4px' }}
              title="Dismiss"
            >
              ✕
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '24px' }}>🚀</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>Get Started with IDDI</h3>
              <p style={{ margin: '2px 0 0', color: theme.textSecondary, fontSize: '13px' }}>
                Complete these steps to get the most out of your dashboard
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: theme.textMuted }}>{completedSteps} of {onboardingSteps.length} complete</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: onboardingProgress === 100 ? theme.success : theme.primary }}>{onboardingProgress}%</span>
            </div>
            <div style={{ height: '6px', borderRadius: '3px', backgroundColor: theme.surfaceHover, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '3px',
                width: `${onboardingProgress}%`,
                backgroundColor: onboardingProgress === 100 ? theme.success : theme.primary,
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {onboardingSteps.map((step) => (
              <div
                key={step.id}
                onClick={!step.done && step.action ? step.action : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 14px', borderRadius: '10px',
                  backgroundColor: step.done ? theme.success + '10' : theme.surfaceHover,
                  border: `1px solid ${step.done ? theme.success + '30' : theme.border}`,
                  cursor: !step.done && step.action ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: step.done ? theme.success : theme.border,
                  color: step.done ? '#fff' : theme.textMuted,
                  fontSize: '13px', fontWeight: '700',
                }}>
                  {step.done ? '✓' : ''}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{
                    fontSize: '14px', fontWeight: '500',
                    color: step.done ? theme.success : theme.text,
                    textDecoration: step.done ? 'line-through' : 'none',
                    opacity: step.done ? 0.7 : 1,
                  }}>
                    {step.label}
                  </span>
                  {!step.done && step.why && (
                    <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '2px' }}>
                      {step.why}
                    </div>
                  )}
                </div>
                {!step.done && step.action && (
                  <span style={{ flexShrink: 0, fontSize: '12px', color: theme.primary, fontWeight: '600' }}>Start →</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 'clamp(20px, 5vw, 28px)' }}>Dashboard</h1>
            <p style={{ color: theme.textSecondary, margin: '4px 0 0 0', fontSize: '14px' }}>
              Manage your vending machines and products
            </p>
          </div>
        </div>

        {/* Desktop Navigation - hidden on mobile */}
        {!isMobile && (
          <div style={{ marginTop: '16px' }}>
            {/* Primary nav row */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '8px',
            }}>
              {[
                { to: '/vendor/analytics', label: 'Analytics', badge: null },
                { to: '/vendor/route-plan', label: 'Route Plan', badge: null },
                { to: '/vendor/suggestions', label: 'Suggestions', badge: pendingSuggestions, badgeColor: theme.danger },
                { to: '/vendor/inventory', label: 'Inventory', badge: lowStockCount, badgeColor: theme.warning, badgeTextColor: 'black' },
                { to: '/vendor/expiring', label: 'Expiring', badge: expiringCount, badgeColor: theme.warning, badgeTextColor: 'black' },
                { to: '/vendor/poll-summary', label: 'Shopping List', badge: null },
                { to: '/vendor/top-products', label: 'Top 50', badge: null },
              ].map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  style={{
                    ...styles.button,
                    ...styles.buttonSecondary,
                    textDecoration: 'none',
                    textAlign: 'center',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    gap: '6px',
                  }}
                >
                  {item.label}
                  {item.badge > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      backgroundColor: item.badgeColor,
                      color: item.badgeTextColor || 'white',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>{item.badge}</span>
                  )}
                </Link>
              ))}
            </div>
            {/* Action buttons row */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={loadData} style={{ ...styles.button, ...styles.buttonSecondary, borderRadius: '10px', padding: '10px 16px', fontSize: '13px' }}>
                Refresh
              </button>
              <button onClick={handleLogout} style={{ ...styles.button, ...styles.buttonDanger, borderRadius: '10px', padding: '10px 16px', fontSize: '13px' }}>
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Mobile Quick Actions — stats glance + refresh */}
        {isMobile && (
          <div style={{ marginTop: '14px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <div style={statCardStyle}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: theme.primary }}>{machines.length}</div>
                <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '2px' }}>Machines</div>
              </div>
              <div style={statCardStyle}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: theme.success }}>{products.length}</div>
                <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '2px' }}>Products</div>
              </div>
              {lowStockCount > 0 && (
                <div style={{ ...statCardStyle, borderColor: theme.warning + '60', cursor: 'pointer' }} onClick={() => navigate('/vendor/inventory')}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: theme.warning }}>{lowStockCount}</div>
                  <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '2px' }}>Low Stock</div>
                </div>
              )}
              {pendingSuggestions > 0 && (
                <div style={{ ...statCardStyle, borderColor: theme.danger + '60', cursor: 'pointer' }} onClick={() => navigate('/vendor/suggestions')}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: theme.danger }}>{pendingSuggestions}</div>
                  <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '2px' }}>Pending</div>
                </div>
              )}
            </div>
            <button onClick={loadData} style={{ ...styles.button, ...styles.buttonSecondary, width: '100%', borderRadius: '10px', padding: '10px' }}>
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Spoilage Urgency Banner */}
      {expiringSoonCount > 0 && (
        <div
          onClick={() => navigate('/vendor/expiring')}
          style={{
            background: theme.danger + '15',
            borderLeft: `4px solid ${theme.danger}`,
            borderRadius: '10px',
            padding: '14px 16px',
            marginBottom: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ color: theme.danger, fontWeight: '600', fontSize: '14px' }}>
            {expiringSoonCount} product{expiringSoonCount !== 1 ? 's' : ''} expiring within 3 days — Tap to review
          </span>
          <span style={{ color: theme.danger, fontSize: '14px', fontWeight: '600' }}>View</span>
        </div>
      )}

      {/* ROI tip */}
      {machines.length > 0 && (
        <FeatureTipBanner
          id="roi"
          text="This estimates your monthly savings from IDDI's spoilage alerts and route optimization. The more machines and products you track, the more accurate it gets."
        />
      )}

      {/* ROI Savings Estimate */}
      {machines.length > 0 && (() => {
        const spoilageSaved = expiringCount * 3.50;
        const monthlyOptimization = machines.length * 27;
        const totalEstimatedSavings = spoilageSaved + monthlyOptimization;
        return (
          <div style={{
            ...styles.card,
            borderRadius: '14px',
            padding: '20px',
            marginBottom: '24px',
            border: `1px solid ${theme.border}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Your IDDI Impact</h3>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '36px', fontWeight: '700', color: theme.success }}>
                ${totalEstimatedSavings.toFixed(2)}
              </div>
              <div style={{ fontSize: '13px', color: theme.textSecondary, marginTop: '4px' }}>
                Estimated monthly savings
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                flex: 1,
                textAlign: 'center',
                background: theme.success + '10',
                borderRadius: '8px',
                padding: '12px 8px',
              }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: theme.success }}>{expiringCount}</div>
                <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '4px' }}>Products saved from spoilage</div>
              </div>
              <div style={{
                flex: 1,
                textAlign: 'center',
                background: theme.primary + '10',
                borderRadius: '8px',
                padding: '12px 8px',
              }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: theme.primary }}>{machines.length}</div>
                <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '4px' }}>Machines optimized</div>
              </div>
            </div>
            <p style={{ fontSize: '11px', color: theme.textMuted, margin: '0', textAlign: 'center' }}>
              Based on average operator improvements from product polling and expiration tracking
            </p>
            {machines.length === 1 && (
              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <Link to="/pricing" style={{ color: theme.primary, fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>
                  Upgrade to Growth to optimize up to 10 machines
                </Link>
              </div>
            )}
          </div>
        );
      })()}

      {/* Machines Section */}
      <div style={{ marginBottom: '48px' }}>
        <FeatureTipBanner
          id="machines"
          text="Each machine gets its own QR code and inventory. Add a machine, then assign products to it. Customers scan the QR to vote on what they want stocked."
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Vending Machines ({machines.length})</h2>
          <button onClick={() => setShowMachineForm(!showMachineForm)} style={{ ...styles.button, ...styles.buttonSuccess, borderRadius: '10px', padding: '10px 16px', fontSize: '13px' }}>
            {showMachineForm ? 'Cancel' : '+ Add Machine'}
          </button>
        </div>

        {showMachineForm && (
          <SubscriptionGate>
            {(canAdd) => canAdd
              ? <MachineForm onSuccess={() => { setShowMachineForm(false); loadData(); }} />
              : null
            }
          </SubscriptionGate>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '12px' }}>
          {machines.map(machine => (
            <div key={machine.id} style={{
              ...styles.card,
              borderRadius: '14px',
              padding: '16px',
              border: `1px solid ${theme.border}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}>
              {/* Machine header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1, marginRight: '8px', fontSize: '16px' }}>{machine.machine_name}</h3>
                <span style={{
                  padding: '4px 12px', flexShrink: 0, whiteSpace: 'nowrap',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '600',
                  backgroundColor: machine.is_active ? theme.success + '20' : theme.danger + '20',
                  color: machine.is_active ? theme.success : theme.danger
                }}>
                  {machine.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p style={{ color: theme.textSecondary, margin: '0 0 6px 0', fontSize: '13px' }}>
                {machine.location}
              </p>
              {machine.last_visit_at && (
                <p style={{ color: theme.textMuted, margin: '0 0 12px 0', fontSize: '12px' }}>
                  Last visit: {formatTimeAgo(machine.last_visit_at)}
                </p>
              )}

              {/* Performance Stats — evenly spaced row */}
              <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '14px',
              }}>
                <div style={{
                  flex: 1,
                  textAlign: 'center',
                  background: theme.success + '10',
                  borderRadius: '8px',
                  padding: '10px 4px',
                }}>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: theme.success, lineHeight: '1' }}>
                    {machine.performing_count || 0}
                  </div>
                  <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Performing</div>
                </div>
                <div style={{
                  flex: 1,
                  textAlign: 'center',
                  background: theme.danger + '10',
                  borderRadius: '8px',
                  padding: '10px 4px',
                }}>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: theme.danger, lineHeight: '1' }}>
                    {machine.not_performing_count || 0}
                  </div>
                  <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Not Perf.</div>
                </div>
                <div style={{
                  flex: 1,
                  textAlign: 'center',
                  background: theme.primary + '10',
                  borderRadius: '8px',
                  padding: '10px 4px',
                }}>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: theme.primary, lineHeight: '1' }}>
                    {machine.product_count || 0}
                  </div>
                  <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Products</div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link to={`/vendor/machines/${machine.id}`} style={{
                  ...styles.button,
                  flex: 1,
                  textAlign: 'center',
                  textDecoration: 'none',
                  fontSize: '13px',
                  padding: '10px',
                  borderRadius: '10px',
                  fontWeight: '600',
                }}>
                  Manage
                </Link>
                <button onClick={() => handleDownloadQR(machine.id)} style={{
                  ...styles.button,
                  ...styles.buttonSecondary,
                  fontSize: '13px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                }}>
                  QR
                </button>
                <button
                  onClick={() => handleDeleteMachine(machine.id, machine.machine_name)}
                  style={{
                    ...styles.button,
                    backgroundColor: 'transparent',
                    border: `1px solid ${theme.danger}`,
                    color: theme.danger,
                    fontSize: '13px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                  }}
                  title="Delete machine"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {machines.length === 0 && (
          <div style={{
            ...styles.card,
            textAlign: 'center',
            padding: '48px 24px',
            borderRadius: '14px',
            border: `1px dashed ${theme.border}`,
            background: theme.surface,
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.5 }}>{'\u{1F3ED}'}</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>No machines yet</h3>
            <p style={{ color: theme.textSecondary, margin: '0 0 16px 0', fontSize: '14px' }}>
              Add your first vending machine to start tracking inventory and performance.
            </p>
            <button onClick={() => setShowMachineForm(true)} style={{ ...styles.button, ...styles.buttonSuccess, borderRadius: '10px', padding: '10px 24px', fontSize: '14px' }}>
              + Add Your First Machine
            </button>
          </div>
        )}
      </div>

      {/* Products Section */}
      <div>
        <FeatureTipBanner
          id="products"
          text="Your product library is shared across all machines. Add a product once, then assign it to any machine's planogram. Performance data follows each product everywhere."
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Product Library ({products.length})</h2>
          <button onClick={() => setShowProductForm(!showProductForm)} style={{ ...styles.button, ...styles.buttonSuccess, borderRadius: '10px', padding: '10px 16px', fontSize: '13px' }}>
            {showProductForm ? 'Cancel' : '+ Add Product'}
          </button>
        </div>

        {showProductForm && <ProductForm onSuccess={() => { setShowProductForm(false); loadData(); }} />}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: '12px' }}>
          {products.map(product => (
            <div key={product.id} style={{
              ...styles.card,
              borderRadius: '12px',
              padding: '14px 16px',
              border: `1px solid ${theme.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: theme.primary + '18',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0,
              }}>
                {product.category?.toLowerCase().includes('beverage') || product.category?.toLowerCase().includes('drink') ? '\u{1F964}' :
                 product.category?.toLowerCase().includes('snack') || product.category?.toLowerCase().includes('chip') ? '\u{1F36A}' :
                 product.category?.toLowerCase().includes('candy') || product.category?.toLowerCase().includes('sweet') ? '\u{1F36C}' :
                 '\u{1F4E6}'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.product_name}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: theme.success, fontWeight: '700', fontSize: '14px' }}>
                    ${parseFloat(product.price).toFixed(2)}
                  </span>
                  <span style={{
                    color: theme.textMuted,
                    fontSize: '11px',
                    background: theme.surfaceHover,
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}>
                    {product.category || 'Uncategorized'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referral Section */}
      {referralCode && (() => {
        const refLink = `${window.location.origin}/ref/${referralCode}`;
        const shareText = `I use IDDI to manage my vending machines — free inventory tracking, QR customer polls, route planning. Check it out:`;
        return (
        <div style={{
          ...styles.card,
          borderRadius: '14px',
          padding: isMobile ? '20px' : '24px',
          marginTop: '24px',
          border: `1px solid ${theme.primary}30`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          background: `linear-gradient(135deg, ${theme.surface} 0%, ${theme.primary}08 100%)`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>🎁</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Refer & Earn</h3>
          </div>
          <p style={{ color: theme.textSecondary, fontSize: '14px', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            Share IDDI with other operators. When they sign up, <strong style={{ color: theme.success }}>you both get 1 month free</strong> on any paid plan.
          </p>

          {/* Referral Link */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="text"
              readOnly
              value={refLink}
              style={{
                ...styles.input,
                flex: 1,
                borderRadius: '10px',
                fontSize: '13px',
                cursor: 'default',
              }}
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(refLink);
                toast.success('Referral link copied!');
              }}
              style={{
                ...styles.button,
                ...styles.buttonSecondary,
                borderRadius: '10px',
                padding: '10px 16px',
                fontSize: '13px',
                flexShrink: 0,
              }}
            >
              Copy
            </button>
          </div>

          {/* Share Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            <a
              href={`sms:?body=${encodeURIComponent(shareText + ' ' + refLink)}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                backgroundColor: theme.success + '20', color: theme.success,
                textDecoration: 'none', border: `1px solid ${theme.success}30`,
              }}
            >
              💬 Text
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + refLink)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                backgroundColor: '#25D36620', color: '#25D366',
                textDecoration: 'none', border: '1px solid #25D36630',
              }}
            >
              WhatsApp
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent('Free vending machine management tool')}&body=${encodeURIComponent(shareText + '\n\n' + refLink)}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                backgroundColor: theme.primary + '20', color: theme.primary,
                textDecoration: 'none', border: `1px solid ${theme.primary}30`,
              }}
            >
              ✉️ Email
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(refLink)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                backgroundColor: '#1877F220', color: '#1877F2',
                textDecoration: 'none', border: '1px solid #1877F230',
              }}
            >
              Facebook
            </a>
            {typeof navigator !== 'undefined' && navigator.share && (
              <button
                onClick={() => navigator.share({ title: 'IDDI - Free Vending Management', text: shareText, url: refLink })}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                  backgroundColor: theme.surfaceHover, color: theme.text,
                  border: `1px solid ${theme.border}`, cursor: 'pointer',
                }}
              >
                📤 Share
              </button>
            )}
          </div>

          {/* Referral Stats */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '16px',
            padding: '12px 16px', borderRadius: '10px',
            backgroundColor: theme.surfaceHover,
          }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: referralCount > 0 ? theme.success : theme.text }}>{referralCount}</div>
              <div style={{ fontSize: '12px', color: theme.textMuted }}>Operator{referralCount !== 1 ? 's' : ''} Referred</div>
            </div>
            {referralCount > 0 && (
              <div style={{ borderLeft: `1px solid ${theme.border}`, paddingLeft: '16px' }}>
                <div style={{ fontSize: '24px', fontWeight: '800', color: theme.primary }}>{referralCount}</div>
                <div style={{ fontSize: '12px', color: theme.textMuted }}>Free Month{referralCount !== 1 ? 's' : ''} Earned</div>
              </div>
            )}
          </div>
        </div>
        );
      })()}
    </div>
  );
}

function UpgradePrompt({ machineCount }) {
  const [dismissed, setDismissed] = useState(false);

  if (machineCount === 0 || dismissed) return null;

  return (
    <div style={{
      backgroundColor: theme.primary + '08',
      border: `1px solid ${theme.primary}25`,
      borderRadius: '14px',
      padding: '16px',
      marginBottom: '16px',
    }}>
      <p style={{
        margin: '0 0 14px 0',
        fontSize: '14px',
        color: theme.text,
        lineHeight: '1.5',
      }}>
        You're on the Free plan (1 machine). Add up to 10 machines with Growth for $19/mo -- that's less than $2 per machine.
      </p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <Link
          to="/pricing"
          style={{
            ...styles.button,
            ...styles.buttonSecondary,
            borderRadius: '10px',
            padding: '10px 16px',
            fontSize: '13px',
            textDecoration: 'none',
            textAlign: 'center',
          }}
        >
          View Plans
        </Link>
        <button
          onClick={() => setDismissed(true)}
          style={{
            ...styles.button,
            ...styles.buttonSecondary,
            borderRadius: '10px',
            padding: '10px 16px',
            fontSize: '13px',
          }}
        >
          Continue Free
        </button>
      </div>
    </div>
  );
}

function MachineForm({ onSuccess }) {
  const [machineName, setMachineName] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await vendorAPI.createMachine({ machineName, location });
      setMachineName('');
      setLocation('');
      toast.success('Machine created successfully');
      setTimeout(onSuccess, 300);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create machine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ ...styles.card, marginBottom: '20px', borderRadius: '14px', border: `1px solid ${theme.primary}30`, boxShadow: '0 2px 12px rgba(124,109,240,0.08)' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Add New Machine</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={styles.label}>Machine Name</label>
          <input
            type="text"
            value={machineName}
            onChange={(e) => setMachineName(e.target.value)}
            style={{ ...styles.input, width: '100%', borderRadius: '10px' }}
            placeholder="Office Building A"
            required
          />
        </div>
        <div>
          <label style={styles.label}>Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{ ...styles.input, width: '100%', borderRadius: '10px' }}
            placeholder="123 Main St, Floor 2"
            required
          />
        </div>
        <button type="submit" style={{ ...styles.button, width: '100%', borderRadius: '10px', padding: '12px' }} disabled={loading}>
          {loading ? 'Creating...' : 'Create Machine'}
        </button>
      </div>
    </form>
  );
}

function ProductForm({ onSuccess }) {
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const productData = { productName, price: parseFloat(price), category };
      if (imageUrl.trim()) productData.imageUrl = imageUrl.trim();
      await vendorAPI.createProduct(productData);
      setProductName('');
      setPrice('');
      setCategory('');
      setImageUrl('');
      toast.success('Product created successfully');
      setTimeout(onSuccess, 300);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ ...styles.card, marginBottom: '20px', borderRadius: '14px', border: `1px solid ${theme.primary}30`, boxShadow: '0 2px 12px rgba(124,109,240,0.08)' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Add New Product</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={styles.label}>Product Name</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            style={{ ...styles.input, width: '100%', borderRadius: '10px' }}
            placeholder="Coca-Cola"
            required
          />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Price</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={{ ...styles.input, width: '100%', borderRadius: '10px' }}
              placeholder="1.50"
              required
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ ...styles.input, width: '100%', borderRadius: '10px' }}
              placeholder="Beverages"
            />
          </div>
        </div>
        <div>
          <label style={styles.label}>Image URL (optional)</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            style={{ ...styles.input, width: '100%', borderRadius: '10px' }}
            placeholder="https://example.com/product-image.jpg"
          />
        </div>
        {imageUrl && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={imageUrl}
              alt="Preview"
              style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: `1px solid ${theme.border}` }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span style={{ color: theme.textMuted, fontSize: '13px' }}>Image preview</span>
          </div>
        )}
        <button type="submit" style={{ ...styles.button, width: '100%', borderRadius: '10px', padding: '12px' }} disabled={loading}>
          {loading ? 'Creating...' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}

function VisitRestockFlow({ machineId, inventory, onComplete, onCancel }) {
  const isMobile = useIsMobile();
  const toast = useToast();
  const [step, setStep] = useState('reconcile');
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [items, setItems] = useState(() =>
    inventory.map(inv => ({
      inventoryId: inv.id,
      productName: inv.product_name,
      currentStock: inv.current_stock,
      remaining: '',
      restockQuantity: '',
      imageUrl: inv.image_url,
    }))
  );

  const updateItem = (index, field, value) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const allReconciled = items.every(item => item.remaining !== '');

  const totalSold = items.reduce((sum, item) => {
    const sold = item.currentStock - (parseInt(item.remaining) || 0);
    return sum + Math.max(0, sold);
  }, 0);

  const totalRestocked = items.reduce((sum, item) => sum + (parseInt(item.restockQuantity) || 0), 0);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        items: items.map(item => ({
          inventoryId: item.inventoryId,
          remaining: parseInt(item.remaining) || 0,
          restockQuantity: parseInt(item.restockQuantity) || 0,
        }))
      };
      const result = await vendorAPI.visitRestock(machineId, payload);
      setResults(result.data);
      setStep('summary');
      toast.success('Visit recorded successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit visit');
    } finally {
      setSubmitting(false);
    }
  };

  const containerStyle = {
    backgroundColor: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: '14px',
    padding: isMobile ? '16px' : '24px',
    marginBottom: '24px',
  };

  const productCardStyle = {
    backgroundColor: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: '10px',
    padding: '14px 16px',
  };

  // Step 1: Reconcile
  if (step === 'reconcile') {
    return (
      <div style={containerStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>Count remaining stock</h2>
          <button
            onClick={onCancel}
            style={{ ...styles.button, ...styles.buttonSecondary, padding: '8px 16px', fontSize: '13px' }}
          >
            Cancel
          </button>
        </div>
        <p style={{ color: theme.textSecondary, fontSize: '14px', margin: '0 0 20px 0' }}>
          For each product, enter how many you see on the shelf
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {items.map((item, index) => {
            const remaining = parseInt(item.remaining);
            const sold = !isNaN(remaining) ? item.currentStock - remaining : null;
            return (
              <div key={item.inventoryId} style={productCardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: theme.border, flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.productName}
                    </div>
                    <div style={{ color: theme.textMuted, fontSize: '13px' }}>
                      Last stocked: {item.currentStock}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...styles.label, marginBottom: '4px', fontSize: '13px' }}>How many left?</label>
                    <input
                      type="number"
                      value={item.remaining}
                      onChange={(e) => updateItem(index, 'remaining', e.target.value)}
                      style={{ ...styles.input, width: '100%', borderRadius: '10px' }}
                      min="0"
                      placeholder="0"
                    />
                  </div>
                  <div style={{ flexShrink: 0, paddingTop: '22px', minWidth: '80px', textAlign: 'right' }}>
                    {sold !== null && sold > 0 && (
                      <span style={{ color: theme.success, fontWeight: '600', fontSize: '14px' }}>{sold} sold</span>
                    )}
                    {sold !== null && sold === 0 && (
                      <span style={{ color: theme.textMuted, fontSize: '14px' }}>None sold</span>
                    )}
                    {sold !== null && sold < 0 && (
                      <span style={{ color: theme.warning, fontSize: '14px' }}>+{Math.abs(sold)} extra</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setStep('restock')}
          disabled={!allReconciled}
          style={{
            ...styles.button,
            width: '100%',
            borderRadius: '10px',
            padding: '14px',
            fontSize: '16px',
            opacity: allReconciled ? 1 : 0.5,
          }}
        >
          Next
        </button>
      </div>
    );
  }

  // Step 2: Restock
  if (step === 'restock') {
    return (
      <div style={containerStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>Add new stock</h2>
          <button
            onClick={onCancel}
            style={{ ...styles.button, ...styles.buttonSecondary, padding: '8px 16px', fontSize: '13px' }}
          >
            Cancel
          </button>
        </div>
        <p style={{ color: theme.textSecondary, fontSize: '14px', margin: '0 0 20px 0' }}>
          Enter how many you are adding to each product (leave blank or 0 to skip)
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {items.map((item, index) => {
            const remaining = parseInt(item.remaining) || 0;
            const sold = Math.max(0, item.currentStock - remaining);
            return (
              <div key={item.inventoryId} style={productCardStyle}>
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontWeight: '600', fontSize: '15px' }}>{item.productName}</div>
                  <div style={{ color: theme.textSecondary, fontSize: '13px', marginTop: '2px' }}>
                    Currently: {remaining} remaining, {sold} sold
                  </div>
                </div>
                <div>
                  <label style={{ ...styles.label, marginBottom: '4px', fontSize: '13px' }}>Adding</label>
                  <input
                    type="number"
                    value={item.restockQuantity}
                    onChange={(e) => updateItem(index, 'restockQuantity', e.target.value)}
                    style={{ ...styles.input, width: '100%', borderRadius: '10px' }}
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setStep('reconcile')}
            style={{ ...styles.button, ...styles.buttonSecondary, flex: 1, borderRadius: '10px', padding: '14px', fontSize: '16px' }}
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              ...styles.button,
              flex: 2,
              borderRadius: '10px',
              padding: '14px',
              fontSize: '16px',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Visit'}
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Summary
  if (step === 'summary') {
    return (
      <div style={containerStyle}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px' }}>Visit Complete</h2>

        <div style={{
          ...productCardStyle,
          marginBottom: '16px',
          display: 'flex',
          gap: '24px',
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{items.length}</div>
            <div style={{ color: theme.textMuted, fontSize: '13px' }}>Products reconciled</div>
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: theme.success }}>{totalSold}</div>
            <div style={{ color: theme.textMuted, fontSize: '13px' }}>Total sold</div>
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: theme.primary }}>{totalRestocked}</div>
            <div style={{ color: theme.textMuted, fontSize: '13px' }}>Total restocked</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {items.map(item => {
            const remaining = parseInt(item.remaining) || 0;
            const sold = Math.max(0, item.currentStock - remaining);
            const added = parseInt(item.restockQuantity) || 0;
            const newStock = remaining + added;
            return (
              <div key={item.inventoryId} style={{
                ...productCardStyle,
                padding: '10px 14px',
              }}>
                <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>{item.productName}</div>
                <div style={{ color: theme.textSecondary, fontSize: '13px' }}>
                  Had {item.currentStock}, now has {newStock} ({sold} sold{added > 0 ? `, ${added} added` : ''})
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onComplete}
          style={{
            ...styles.button,
            ...styles.buttonSuccess,
            width: '100%',
            borderRadius: '10px',
            padding: '14px',
            fontSize: '16px',
          }}
        >
          Done
        </button>
      </div>
    );
  }

  return null;
}

function MachineDetails() {
  const { id } = useParams();
  const [machine, setMachine] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({});
  const [polls, setPolls] = useState([]);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPollForm, setShowPollForm] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [sourceType, setSourceType] = useState('warehouse');
  const [warehouseStock, setWarehouseStock] = useState({});
  const [loading, setLoading] = useState(true);
  // Redistribution state
  const [showRedistribution, setShowRedistribution] = useState(false);
  const [selectedProductForRedist, setSelectedProductForRedist] = useState(null);
  const [redistributionTargets, setRedistributionTargets] = useState([]);
  const [redistributionLoading, setRedistributionLoading] = useState(false);
  const [transferQuantity, setTransferQuantity] = useState(1);
  const [selectedTargetMachine, setSelectedTargetMachine] = useState(null);
  // Batch redistribution queue state
  const [redistQueue, setRedistQueue] = useState([]);
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [batchResults, setBatchResults] = useState(null);
  // Auto distribute state
  const [autoDistSuggestions, setAutoDistSuggestions] = useState(null);
  const [autoDistLoading, setAutoDistLoading] = useState(false);
  const [autoDistExecuting, setAutoDistExecuting] = useState(false);
  // Notes state
  const [noteInput, setNoteInput] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [notesList, setNotesList] = useState([]);
  const [showNotesHistory, setShowNotesHistory] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  // Inline poll results state
  const [expandedPollId, setExpandedPollId] = useState(null);
  const [expandedResults, setExpandedResults] = useState(null);
  const [expandedLoading, setExpandedLoading] = useState(false);
  const [pendingMarks, setPendingMarks] = useState({});
  const [submittingVisit, setSubmittingVisit] = useState(false);
  // Visit history state
  const [visitChanges, setVisitChanges] = useState(null);
  const isMobile = useIsMobile();
  const [showVisitDetails, setShowVisitDetails] = useState(false);
  const [stockCounts, setStockCounts] = useState({}); // { inventoryId: 'remaining count' }
  const [quickMode, setQuickMode] = useState(null); // null | 'performance' | 'stock' | 'redistribute'
  const [editingStockId, setEditingStockId] = useState(null);
  const [editStockValue, setEditStockValue] = useState('');
  const toast = useToast();

  const initialLoadDone = useRef(false);

  const loadMachineData = useCallback(async (isBackground = false) => {
    try {
      // Only show full-page loading on initial load
      if (!isBackground && !initialLoadDone.current) {
        setLoading(true);
      }
      const [machineRes, inventoryRes, productsRes, pollsRes, visitRes, centralInvRes] = await Promise.allSettled([
        vendorAPI.getMachine(id),
        vendorAPI.getMachineInventory(id),
        vendorAPI.getProducts(),
        vendorAPI.getMachinePolls(id),
        vendorAPI.getChangesSinceVisit(id),
        vendorAPI.getInventory()
      ]);

      if (machineRes.status === 'fulfilled') {
        const machineData = machineRes.value.data.data.machine;
        setMachine(machineData);
        // Notes are now loaded separately via getNotes
        if (machineData.qr_token) {
          const qrUrl = `${FRONTEND_URL}/customer/machine/${machineData.qr_token}`;
          const qrImage = await QRCode.toDataURL(qrUrl, { width: 300 });
          setQrCodeDataUrl(qrImage);
        }
      }

      if (inventoryRes.status === 'fulfilled') {
        setInventory(inventoryRes.value.data.data.inventory);
        setStats(inventoryRes.value.data.data.stats);
      }

      if (productsRes.status === 'fulfilled') {
        setProducts(productsRes.value.data.data.products);
      }

      if (pollsRes.status === 'fulfilled') {
        setPolls(pollsRes.value.data.data.polls || []);
      }

      if (visitRes.status === 'fulfilled') {
        setVisitChanges(visitRes.value.data.data);
      }

      if (centralInvRes.status === 'fulfilled') {
        const inv = centralInvRes.value.data?.data?.inventory || [];
        const stockMap = {};
        inv.forEach(item => { stockMap[item.product_id] = item.quantity_on_hand; });
        setWarehouseStock(stockMap);
      }
    } catch (err) {
      toast.error('Failed to load machine data');
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
    }
  }, [id, toast]);

  useEffect(() => {
    loadMachineData();
  }, [loadMachineData]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await vendorAPI.addToInventory(id, {
        productId: parseInt(selectedProductId),
        stockQuantity: parseInt(stockQuantity),
        sourceType,
      });

      // Get product details from local state
      const product = products.find(p => p.id === parseInt(selectedProductId));
      const newItem = response.data.data.inventoryItem;

      // Build full inventory item with product details
      const fullItem = {
        ...newItem,
        product_name: product?.product_name,
        price: product?.price,
        image_url: product?.image_url,
        category: product?.category,
      };

      // Update state locally instead of reloading
      setInventory(prev => [...prev, fullItem]);

      setSelectedProductId('');
      setStockQuantity('10');
      // Keep add form open so user can add multiple products
      toast.success('Product added to machine');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add product');
    }
  };

  const handleSetPerformance = (inventoryId, isPerforming) => {
    setPendingMarks(prev => {
      // Tapping the same value again deselects it
      if (prev[inventoryId] === isPerforming) {
        const next = { ...prev };
        delete next[inventoryId];
        return next;
      }
      return { ...prev, [inventoryId]: isPerforming };
    });
  };

  const handleSubmitVisit = async () => {
    const marks = Object.entries(pendingMarks).map(([inventoryId, isPerforming]) => ({
      inventoryId: parseInt(inventoryId),
      isPerforming,
    }));
    const counts = Object.entries(stockCounts)
      .filter(([, val]) => val !== '' && val !== undefined)
      .map(([inventoryId, remaining]) => ({
        inventoryId: parseInt(inventoryId),
        remaining: parseInt(remaining) || 0,
        restockQuantity: 0,
      }));

    if (marks.length === 0 && counts.length === 0) return;
    setSubmittingVisit(true);
    try {
      const results = [];
      // Submit performance marks
      if (marks.length > 0) {
        const res = await vendorAPI.commitPerformance(id, { marks });
        setInventory(res.data.data.inventory);
        results.push(`${marks.length} marked`);
      }
      // Submit stock counts
      if (counts.length > 0) {
        await vendorAPI.visitRestock(id, { items: counts });
        results.push(`${counts.length} counted`);
      }
      setPendingMarks({});
      setStockCounts({});
      // Reload fresh data
      loadMachineData(true);
      toast.success(`Visit submitted: ${results.join(', ')}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit visit');
    } finally {
      setSubmittingVisit(false);
    }
  };

  const handleRemoveProduct = async (inventoryId) => {
    if (!window.confirm('Remove this product from the machine?')) return;
    // Optimistic local update - save previous state for revert
    const previousInventory = inventory;
    setInventory(prev => prev.filter(item => item.id !== inventoryId));
    try {
      await vendorAPI.removeFromInventory(id, inventoryId);
      toast.success('Product removed from machine');
    } catch (err) {
      // Revert on failure
      setInventory(previousInventory);
      toast.error(err.response?.data?.message || 'Failed to remove product');
    }
  };

  const handleAddNote = async () => {
    if (!noteInput.trim()) return;
    setSavingNote(true);
    try {
      const res = await vendorAPI.addMachineNote(id, noteInput.trim());
      const newNote = res.data.data.note;
      setNotesList(prev => [newNote, ...prev]);
      setNoteInput('');
      toast.success('Note logged');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add note');
    } finally {
      setSavingNote(false);
    }
  };

  const handleLoadNotes = async () => {
    if (showNotesHistory) {
      setShowNotesHistory(false);
      return;
    }
    setNotesLoading(true);
    try {
      const res = await vendorAPI.getMachineNotes(id);
      setNotesList(res.data.data.notes);
      setShowNotesHistory(true);
    } catch (err) {
      toast.error('Failed to load notes');
    } finally {
      setNotesLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await vendorAPI.deleteMachineNote(id, noteId);
      setNotesList(prev => prev.filter(n => n.id !== noteId));
      toast.success('Note deleted');
    } catch (err) {
      toast.error('Failed to delete note');
    }
  };

  const handleSetExpiration = async (inventoryId, date) => {
    // Optimistic local update
    const previousInventory = inventory;
    setInventory(prev => prev.map(item =>
      item.id === inventoryId ? { ...item, expiration_date: date } : item
    ));
    try {
      await vendorAPI.updateExpirationDate(id, inventoryId, date);
      toast.success('Expiration date updated');
    } catch (err) {
      // Revert on failure
      setInventory(previousInventory);
      toast.error(err.response?.data?.message || 'Failed to update expiration date');
    }
  };

  const handleTogglePollResults = async (pollId) => {
    if (expandedPollId === pollId) {
      setExpandedPollId(null);
      setExpandedResults(null);
      return;
    }
    setExpandedPollId(pollId);
    setExpandedLoading(true);
    try {
      const response = await vendorAPI.getPollResults(pollId);
      setExpandedResults(response.data.data);
    } catch (err) {
      toast.error('Failed to load poll results');
      setExpandedPollId(null);
    } finally {
      setExpandedLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!machine?.qr_token) return;
    const qrUrl = `${FRONTEND_URL}/customer/machine/${machine.qr_token}`;
    navigator.clipboard.writeText(qrUrl);
    toast.success('Link copied to clipboard');
  };

  const handleDownloadQRPDF = async () => {
    if (!machine?.qr_token || !qrCodeDataUrl) return;
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    pdf.setFontSize(18);
    pdf.text(machine.machine_name || 'Machine QR Code', pageWidth / 2, 20, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text('Scan to vote on products', pageWidth / 2, 35, { align: 'center' });
    pdf.addImage(qrCodeDataUrl, 'PNG', (pageWidth - 80) / 2, 50, 80, 80);
    pdf.save(`machine-${id}-qr.pdf`);
  };

  // Redistribution handlers
  const handleSelectProductForRedist = async (item) => {
    setSelectedProductForRedist(item);
    setRedistributionLoading(true);
    setTransferQuantity(1);
    setSelectedTargetMachine(null);
    try {
      const response = await vendorAPI.getRedistributionTargets(id, item.product_id);
      setRedistributionTargets(response.data?.data?.targetMachines || []);
    } catch (err) {
      toast.error('Failed to load redistribution targets');
      setRedistributionTargets([]);
    } finally {
      setRedistributionLoading(false);
    }
  };

  const getQueuedQuantity = (productId) => {
    return redistQueue
      .filter(m => m.product.product_id === productId)
      .reduce((sum, m) => sum + m.quantity, 0);
  };

  const getEffectiveStock = (item) => {
    return item.current_stock - getQueuedQuantity(item.product_id);
  };

  const handleAddToQueue = () => {
    if (!selectedProductForRedist || !selectedTargetMachine || transferQuantity < 1) return;

    const effectiveStock = getEffectiveStock(selectedProductForRedist);
    if (transferQuantity > effectiveStock) {
      toast.error(`Cannot transfer more than effective stock (${effectiveStock})`);
      return;
    }

    setRedistQueue(prev => [...prev, {
      id: Date.now() + Math.random(),
      product: selectedProductForRedist,
      targetMachine: selectedTargetMachine,
      quantity: transferQuantity,
    }]);

    toast.success(`Added ${transferQuantity}x ${selectedProductForRedist.product_name} to ${selectedTargetMachine.machine_name} queue`);
    setSelectedProductForRedist(null);
    setSelectedTargetMachine(null);
    setTransferQuantity(1);
    setRedistributionTargets([]);
  };

  const handleRemoveFromQueue = (moveId) => {
    setRedistQueue(prev => prev.filter(m => m.id !== moveId));
  };

  const handleCommitBatch = async () => {
    if (redistQueue.length === 0) return;
    try {
      setBatchSubmitting(true);
      const response = await vendorAPI.executeBatchRedistribution({
        moves: redistQueue.map(m => ({
          sourceMachineId: parseInt(id),
          targetMachineId: m.targetMachine.machine_id,
          productId: m.product.product_id,
          quantity: m.quantity,
        })),
        reason: 'Batch product redistribution',
      });
      const results = response.data?.data;
      // Clear all redistribution state
      setRedistQueue([]);
      setSelectedProductForRedist(null);
      setSelectedTargetMachine(null);
      setTransferQuantity(1);
      setRedistributionTargets([]);
      setBatchSubmitting(false);
      // Show summary briefly, then auto-close
      setBatchResults(results);
      toast.success(`Done! ${results?.totalMoves} transfers completed (${results?.totalUnitsTransferred} units moved)`);
      // Reload inventory so fully-transferred products disappear
      loadMachineData(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Batch redistribution failed');
      setBatchSubmitting(false);
    }
  };

  const handleCloseBatchSummary = () => {
    setBatchResults(null);
    setShowRedistribution(false);
  };

  const handleAutoDistribute = async () => {
    try {
      setAutoDistLoading(true);
      const response = await vendorAPI.getAutoDistribute(id);
      const data = response.data?.data;
      if (data?.moves?.length === 0) {
        toast.info('No redistribution needed — all products are performing well or no better placement found.');
        setAutoDistSuggestions(null);
      } else {
        setAutoDistSuggestions(data);
      }
    } catch (err) {
      toast.error('Failed to generate auto-distribute suggestions');
    } finally {
      setAutoDistLoading(false);
    }
  };

  const handleApproveAutoDistribute = async () => {
    if (!autoDistSuggestions?.moves?.length) return;
    try {
      setAutoDistExecuting(true);
      await vendorAPI.executeBatchRedistribution({
        moves: autoDistSuggestions.moves.map(m => ({
          sourceMachineId: parseInt(id),
          targetMachineId: m.targetMachineId,
          productId: m.productId,
          quantity: m.quantity,
        })),
        reason: 'Auto-distribute: move non-performing products to better machines',
      });
      toast.success(`Auto-distribute complete! ${autoDistSuggestions.summary.totalMoves} transfers (${autoDistSuggestions.summary.totalUnits} units)`);
      setAutoDistSuggestions(null);
      loadMachineData(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Auto-distribute failed');
    } finally {
      setAutoDistExecuting(false);
    }
  };

  const handleCancelRedistribution = () => {
    setSelectedProductForRedist(null);
    setSelectedTargetMachine(null);
    setTransferQuantity(1);
    setRedistributionTargets([]);
  };

  const handleQuickStockUpdate = async (itemId, newStock) => {
    const previousInventory = inventory;
    setInventory(prev => prev.map(item =>
      item.id === itemId ? { ...item, current_stock: parseInt(newStock) } : item
    ));
    setEditingStockId(null);
    try {
      await vendorAPI.updateInventory(id, itemId, { stockQuantity: parseInt(newStock) });
      toast.success('Stock updated');
    } catch (err) {
      setInventory(previousInventory);
      toast.error(err.response?.data?.message || 'Failed to update stock');
    }
  };

  if (loading) {
    return <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Loading...</p></div>;
  }

  return (
    <div style={styles.page}>
      <Link to="/vendor/dashboard" style={{ ...styles.link, display: 'inline-block', marginBottom: '24px' }}>
        ← Back to Dashboard
      </Link>

      {/* Quick Action Bar - Mobile Only */}
      {isMobile && (
        <div style={{
          position: 'sticky',
          top: '56px',
          zIndex: 100,
          background: theme.bg,
          padding: '8px 0 12px 0',
          marginBottom: '8px',
          borderBottom: `1px solid ${theme.border}`,
        }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}>
            {[
              { key: null, label: 'Inventory', badge: inventory.length },
              { key: 'performance', label: 'Mark Perf.', badge: Object.keys(pendingMarks).length || null },
              { key: 'stock', label: 'Update Stock', badge: null },
              { key: 'redistribute', label: 'Redistribute', badge: null },
            ].map(action => (
              <button
                key={action.key || 'default'}
                onClick={() => {
                  setQuickMode(action.key);
                  if (action.key === 'redistribute') handleAutoDistribute();
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: `1px solid ${quickMode === action.key ? theme.primary : theme.border}`,
                  background: quickMode === action.key ? theme.primary + '20' : theme.surface,
                  color: quickMode === action.key ? theme.primary : theme.textSecondary,
                  fontSize: '13px',
                  fontWeight: quickMode === action.key ? '600' : '400',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0,
                }}
              >
                {action.label}
                {action.badge > 0 && (
                  <span style={{
                    background: theme.primary,
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '1px 7px',
                    fontSize: '11px',
                    fontWeight: '700',
                  }}>{action.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Mode: Performance */}
      {isMobile && quickMode === 'performance' && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Mark Performance</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {inventory.map(item => (
              <div key={item.id} style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: item.is_performing === true ? theme.success
                      : item.is_performing === false ? theme.danger
                      : theme.textMuted,
                  }} />
                  <span style={{ fontSize: '15px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.product_name}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => handleSetPerformance(item.id, true)}
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '12px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '22px',
                      fontWeight: '700',
                      background: pendingMarks[item.id] === true ? theme.success : theme.surfaceHover,
                      color: pendingMarks[item.id] === true ? '#fff' : theme.textMuted,
                    }}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => handleSetPerformance(item.id, false)}
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '12px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '22px',
                      fontWeight: '700',
                      background: pendingMarks[item.id] === false ? theme.danger : theme.surfaceHover,
                      color: pendingMarks[item.id] === false ? '#fff' : theme.textMuted,
                    }}
                  >
                    ✗
                  </button>
                </div>
              </div>
            ))}
          </div>
          {Object.keys(pendingMarks).length > 0 && (
            <button
              onClick={handleSubmitVisit}
              disabled={submittingVisit}
              style={{
                ...styles.button,
                width: '100%',
                marginTop: '16px',
                backgroundColor: theme.success,
                fontSize: '16px',
                padding: '16px',
                position: 'sticky',
                bottom: '64px',
                zIndex: 50,
              }}
            >
              {submittingVisit ? 'Submitting...' : `Submit Visit (${Object.keys(pendingMarks).length} marked)`}
            </button>
          )}
        </div>
      )}

      {/* Quick Mode: Stock Update */}
      {isMobile && quickMode === 'stock' && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Update Stock</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {inventory.map(item => (
              <div key={item.id} style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}>
                <span style={{ fontSize: '15px', fontWeight: '500', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.product_name}
                </span>
                {editingStockId === item.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <button
                      onClick={() => setEditStockValue(String(Math.max(0, parseInt(editStockValue || '0') - 1)))}
                      style={{
                        width: '40px', height: '40px', borderRadius: '8px', border: 'none',
                        background: theme.surfaceHover, color: theme.text, fontSize: '18px', cursor: 'pointer',
                      }}
                    >−</button>
                    <input
                      type="number"
                      value={editStockValue}
                      onChange={(e) => setEditStockValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleQuickStockUpdate(item.id, editStockValue); }}
                      style={{
                        ...styles.input,
                        width: '60px',
                        textAlign: 'center',
                        fontSize: '16px',
                        fontWeight: '600',
                        padding: '8px',
                      }}
                      min="0"
                      autoFocus
                    />
                    <button
                      onClick={() => setEditStockValue(String(parseInt(editStockValue || '0') + 1))}
                      style={{
                        width: '40px', height: '40px', borderRadius: '8px', border: 'none',
                        background: theme.surfaceHover, color: theme.text, fontSize: '18px', cursor: 'pointer',
                      }}
                    >+</button>
                    <button
                      onClick={() => handleQuickStockUpdate(item.id, editStockValue)}
                      style={{
                        ...styles.button, padding: '8px 16px', fontSize: '14px',
                      }}
                    >Save</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingStockId(item.id); setEditStockValue(String(item.current_stock)); }}
                    style={{
                      background: theme.surfaceHover,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '8px',
                      padding: '8px 16px',
                      color: theme.text,
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      minWidth: '60px',
                      textAlign: 'center',
                    }}
                  >
                    {item.current_stock}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Mode: Redistribute */}
      {isMobile && quickMode === 'redistribute' && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Redistribution Suggestions</h3>
          {autoDistLoading ? (
            <div style={{ ...styles.card, textAlign: 'center', padding: '32px' }}>
              <p style={{ color: theme.textSecondary }}>Analyzing fleet...</p>
            </div>
          ) : autoDistSuggestions?.moves?.length > 0 ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {autoDistSuggestions.moves.map((move, i) => (
                  <div key={i} style={{
                    background: theme.surface,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '12px',
                    padding: '14px 16px',
                  }}>
                    <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>
                      {move.quantity}x {move.productName}
                    </div>
                    <div style={{ color: theme.textSecondary, fontSize: '13px' }}>
                      To: {move.targetMachineName}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleApproveAutoDistribute}
                disabled={autoDistExecuting}
                style={{
                  ...styles.button,
                  ...styles.buttonSuccess,
                  width: '100%',
                  fontSize: '16px',
                  padding: '16px',
                  position: 'sticky',
                  bottom: '64px',
                  zIndex: 50,
                  opacity: autoDistExecuting ? 0.7 : 1,
                }}
              >
                {autoDistExecuting ? 'Distributing...' : `Approve All (${autoDistSuggestions.summary.totalMoves} transfers)`}
              </button>
            </>
          ) : (
            <div style={{ ...styles.card, textAlign: 'center', padding: '32px' }}>
              <p style={{ color: theme.textSecondary }}>No suggestions — fleet is optimized</p>
            </div>
          )}
        </div>
      )}

      {/* Machine Header */}
      <div style={{ ...styles.card, marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div style={{ minWidth: 0, flex: 1, marginRight: '8px' }}>
            <h1 style={{ margin: '0 0 8px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{machine?.machine_name}</h1>
            <p style={{ color: theme.textSecondary, margin: 0 }}>{machine?.location}</p>
          </div>
          <span style={{
            padding: '6px 16px', flexShrink: 0, whiteSpace: 'nowrap',
            borderRadius: '20px',
            backgroundColor: machine?.is_active ? theme.success + '20' : theme.danger + '20',
            color: machine?.is_active ? theme.success : theme.danger
          }}>
            {machine?.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '24px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 'bold' }}>{stats.total || 0}</div>
            <div style={{ color: theme.textMuted, fontSize: '14px' }}>Total Products</div>
          </div>
          <div>
            <div style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 'bold', color: theme.success }}>{stats.performing || 0}</div>
            <div style={{ color: theme.textMuted, fontSize: '14px' }}>Performing Well</div>
          </div>
          <div>
            <div style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 'bold', color: theme.danger }}>{stats.notPerforming || 0}</div>
            <div style={{ color: theme.textMuted, fontSize: '14px' }}>Not Performing</div>
          </div>
          <div>
            <div style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 'bold', color: theme.textMuted }}>{stats.unmarked || 0}</div>
            <div style={{ color: theme.textMuted, fontSize: '14px' }}>Not Marked</div>
          </div>
          {stats.expiringSoon > 0 && (
            <div>
              <div style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 'bold', color: theme.warning }}>{stats.expiringSoon}</div>
              <div style={{ color: theme.textMuted, fontSize: '14px' }}>Expiring Soon</div>
            </div>
          )}
        </div>
      </div>

      {/* Since Last Visit Summary Card */}
      {visitChanges?.hasHistory && visitChanges?.summary?.totalChanges > 0 && (
        <div style={{ ...styles.card, marginBottom: '24px', borderLeft: `4px solid ${theme.primary}` }}>
          <div
            onClick={() => setShowVisitDetails(!showVisitDetails)}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', minWidth: 0, flex: 1 }}>
                Since Last Visit
                <span style={{ fontWeight: 'normal', color: theme.textMuted, fontSize: '14px', marginLeft: '8px' }}>
                  ({formatTimeAgo(visitChanges.lastVisitAt)})
                </span>
              </h3>
              <span style={{ color: theme.textMuted, fontSize: '20px' }}>
                {showVisitDetails ? '▼' : '▶'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
              {visitChanges.summary.performanceChanges > 0 && (
                <span style={{ color: theme.primary, fontSize: '14px' }}>
                  {visitChanges.summary.performanceChanges} performance change{visitChanges.summary.performanceChanges !== 1 ? 's' : ''}
                </span>
              )}
              {visitChanges.summary.productsAdded > 0 && (
                <span style={{ color: theme.success, fontSize: '14px' }}>
                  {visitChanges.summary.productsAdded} product{visitChanges.summary.productsAdded !== 1 ? 's' : ''} added
                </span>
              )}
              {visitChanges.summary.productsRemoved > 0 && (
                <span style={{ color: theme.danger, fontSize: '14px' }}>
                  {visitChanges.summary.productsRemoved} product{visitChanges.summary.productsRemoved !== 1 ? 's' : ''} removed
                </span>
              )}
            </div>
          </div>

          {/* Expanded Details */}
          {showVisitDetails && visitChanges.changes?.length > 0 && (
            <div style={{ marginTop: '16px', borderTop: `1px solid ${theme.border}`, paddingTop: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {visitChanges.changes.map((change, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    backgroundColor: theme.surfaceHover,
                    borderRadius: '8px',
                    fontSize: '13px'
                  }}>
                    <span style={{
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      backgroundColor: change.actionType === 'performance_change' ? theme.primary + '30' :
                                       change.actionType === 'product_added' ? theme.success + '30' :
                                       change.actionType === 'product_removed' ? theme.danger + '30' : theme.border,
                      fontSize: '12px'
                    }}>
                      {change.actionType === 'performance_change' ? '~' :
                       change.actionType === 'product_added' ? '+' :
                       change.actionType === 'product_removed' ? '-' : '*'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>
                      {change.actionType === 'performance_change' && (
                        <span>
                          <strong>{change.details.product_name}</strong>
                          {' marked as '}
                          <span style={{ color: change.details.new_status ? theme.success : theme.danger }}>
                            {change.details.new_status ? 'performing' : 'not performing'}
                          </span>
                          {change.details.old_status !== null && (
                            <span style={{ color: theme.textMuted }}>
                              {' (was '}{change.details.old_status ? 'performing' : 'not performing'}{')'}
                            </span>
                          )}
                        </span>
                      )}
                      {change.actionType === 'product_added' && (
                        <span>
                          <strong>{change.details.product_name}</strong>
                          {' added to inventory'}
                          {change.details.initial_stock > 0 && (
                            <span style={{ color: theme.textMuted }}> (qty: {change.details.initial_stock})</span>
                          )}
                        </span>
                      )}
                      {change.actionType === 'product_removed' && (
                        <span>
                          <strong>{change.details.product_name}</strong>
                          {' removed from inventory'}
                        </span>
                      )}
                    </div>
                    <span style={{ color: theme.textMuted, fontSize: '12px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {formatTimeAgo(change.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Machine Notes Section */}
      <div style={{ ...styles.card, marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0 }}>📝 Machine Notes</h3>
          <button
            onClick={handleLoadNotes}
            disabled={notesLoading}
            style={{ ...styles.button, padding: '6px 16px', fontSize: '14px', background: showNotesHistory ? theme.accent : theme.cardBg, border: `1px solid ${theme.border}` }}
          >
            {notesLoading ? 'Loading...' : showNotesHistory ? 'Hide History' : `View Notes${notesList.length > 0 ? ` (${notesList.length})` : ''}`}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <textarea
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="Add a note about this machine..."
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddNote(); } }}
            style={{
              ...styles.input,
              flex: 1,
              minHeight: '44px',
              maxHeight: '120px',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
          <button
            onClick={handleAddNote}
            disabled={savingNote || !noteInput.trim()}
            style={{ ...styles.button, ...styles.buttonSuccess, padding: '10px 20px', whiteSpace: 'nowrap', height: '44px' }}
          >
            {savingNote ? '...' : '+ Add'}
          </button>
        </div>
        <p style={{ color: theme.textMuted, fontSize: '12px', margin: '8px 0 0 0' }}>
          Notes are logged with timestamps. Press Enter to add, or Shift+Enter for a new line.
        </p>

        {showNotesHistory && (
          <div style={{ marginTop: '16px', borderTop: `1px solid ${theme.border}`, paddingTop: '12px' }}>
            {notesList.length === 0 ? (
              <p style={{ color: theme.textMuted, fontStyle: 'italic', margin: 0 }}>No notes yet for this machine.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {notesList.map(note => (
                  <div key={note.id} style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', flex: 1 }}>{note.content}</p>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        title="Delete note"
                        style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: '2px 6px', fontSize: '14px', flexShrink: 0, borderRadius: '4px' }}
                        onMouseOver={(e) => e.target.style.color = '#ef4444'}
                        onMouseOut={(e) => e.target.style.color = theme.textMuted}
                      >
                        ✕
                      </button>
                    </div>
                    <p style={{ color: theme.textMuted, fontSize: '11px', margin: '6px 0 0 0' }}>
                      {new Date(note.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Inventory Section */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <h2 style={{ margin: 0 }}>Planogram ({inventory.length}/60 products)</h2>
          <button onClick={() => setShowAddForm(!showAddForm)} style={{ ...styles.button, ...styles.buttonSuccess }}>
            {showAddForm ? 'Cancel' : '+ Add Product'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddProduct} style={{ ...styles.card, marginBottom: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={styles.label}>Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  style={{ ...styles.input, width: '100%' }}
                  required
                >
                  <option value="">Select product...</option>
                  {products.map(product => {
                    const alreadyAdded = inventory.some(i => i.product_id === product.id);
                    return (
                      <option
                        key={product.id}
                        value={product.id}
                        disabled={alreadyAdded}
                      >
                        {product.product_name} - ${product.price}{alreadyAdded ? ' (Already added)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div style={{ marginBottom: '4px' }}>
                <label style={styles.label}>Source</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setSourceType('warehouse')}
                    style={{
                      ...styles.button,
                      flex: 1,
                      fontSize: '13px',
                      padding: '8px 12px',
                      backgroundColor: sourceType === 'warehouse' ? theme.primary : 'transparent',
                      border: `1px solid ${sourceType === 'warehouse' ? theme.primary : theme.border}`,
                    }}
                  >
                    From Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType('direct')}
                    style={{
                      ...styles.button,
                      flex: 1,
                      fontSize: '13px',
                      padding: '8px 12px',
                      backgroundColor: sourceType === 'direct' ? theme.primary : 'transparent',
                      border: `1px solid ${sourceType === 'direct' ? theme.primary : theme.border}`,
                    }}
                  >
                    Direct Purchase
                  </button>
                </div>
                {sourceType === 'warehouse' && selectedProductId && warehouseStock[parseInt(selectedProductId)] !== undefined && (
                  <div style={{ color: theme.textMuted, fontSize: '12px', marginTop: '6px' }}>
                    On Hand: {warehouseStock[parseInt(selectedProductId)]} available
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Initial Stock</label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    style={{ ...styles.input, width: '100%' }}
                    min="0"
                    required
                  />
                </div>
                <button type="submit" style={{ ...styles.button, whiteSpace: 'nowrap' }}>Add</button>
              </div>
            </div>
          </form>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
          {inventory.map(item => (
            <div key={item.id} style={{
              ...styles.card,
              borderLeft: `4px solid ${item.is_performing === true ? theme.success : item.is_performing === false ? theme.danger : theme.border}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: theme.border, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: theme.textMuted }}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                    ) : <span style={{ fontSize: '14px', color: '#4a4a6a' }}>--</span>}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h4 style={{ margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product_name}</h4>
                    <p style={{ color: theme.textMuted, margin: 0, fontSize: '13px' }}>
                      {item.category || 'Product'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveProduct(item.id)}
                  style={{ background: 'none', border: 'none', color: theme.danger, cursor: 'pointer', fontSize: '18px', padding: '8px', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  aria-label={`Remove ${item.product_name} from machine`}
                  title="Remove product"
                >
                  ×
                </button>
              </div>

              {/* Info Row: Price, Stock, Expiration */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', color: theme.success, fontWeight: '600' }}>
                  ${parseFloat(item.price).toFixed(2)}
                </span>
                <span style={{ fontSize: '13px', color: theme.textMuted }}>
                  Stock: {item.current_stock}
                </span>
                {item.expiration_date && (() => {
                  const daysLeft = Math.ceil((new Date(item.expiration_date) - new Date()) / (1000 * 60 * 60 * 24));
                  const dateStr = new Date(item.expiration_date).toLocaleDateString();
                  return (
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: daysLeft <= 3 ? theme.danger + '20' : daysLeft <= 7 ? theme.warning + '20' : theme.surfaceHover,
                      color: daysLeft <= 3 ? theme.danger : daysLeft <= 7 ? theme.warning : theme.textMuted,
                      fontWeight: '600',
                    }}>
                      {daysLeft <= 0 ? 'EXPIRED' : daysLeft <= 7 ? `${daysLeft}d left` : `Exp: ${dateStr}`}
                    </span>
                  );
                })()}
                {item.performance_marked_at && (
                  <span style={{ fontSize: '11px', color: theme.textMuted }}>
                    Last marked: {new Date(item.performance_marked_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Performance History Tally */}
              {(item.performance_yes_count > 0 || item.performance_no_count > 0) && (() => {
                const yesCount = item.performance_yes_count || 0;
                const noCount = item.performance_no_count || 0;
                return (
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', fontSize: '12px' }}>
                    {yesCount > 0 && (
                      <span style={{ color: theme.success, fontWeight: '600' }}>
                        Good: {yesCount}
                      </span>
                    )}
                    {noCount > 0 && (
                      <span style={{ color: theme.danger, fontWeight: '600' }}>
                        Bad: {noCount}
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* Performance Toggle */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <button
                  onClick={() => handleSetPerformance(item.id, true)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600',
                    backgroundColor: pendingMarks[item.id] === true ? theme.success : theme.surfaceHover,
                    color: pendingMarks[item.id] === true ? 'white' : theme.textSecondary,
                  }}
                >
                  Good
                </button>
                <button
                  onClick={() => handleSetPerformance(item.id, false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600',
                    backgroundColor: pendingMarks[item.id] === false ? theme.danger : theme.surfaceHover,
                    color: pendingMarks[item.id] === false ? 'white' : theme.textSecondary,
                  }}
                >
                  Bad
                </button>
              </div>

              {/* Visual Recount */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 10px',
                backgroundColor: theme.bg,
                borderRadius: '8px',
                border: `1px solid ${stockCounts[item.id] !== undefined && stockCounts[item.id] !== '' ? theme.primary + '60' : theme.border}`,
              }}>
                <label style={{ fontSize: '13px', color: theme.textSecondary, whiteSpace: 'nowrap', fontWeight: '500' }}>
                  How many left?
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder={String(item.current_stock)}
                  value={stockCounts[item.id] !== undefined ? stockCounts[item.id] : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStockCounts(prev => ({ ...prev, [item.id]: val }));
                  }}
                  style={{
                    ...styles.input,
                    padding: '6px 10px',
                    fontSize: '15px',
                    width: '70px',
                    textAlign: 'center',
                    flex: 'none',
                  }}
                />
                {stockCounts[item.id] !== undefined && stockCounts[item.id] !== '' && (() => {
                  const remaining = parseInt(stockCounts[item.id]) || 0;
                  const sold = item.current_stock - remaining;
                  if (sold > 0) {
                    return <span style={{ fontSize: '12px', color: theme.success, fontWeight: '600' }}>{sold} sold</span>;
                  } else if (sold === 0) {
                    return <span style={{ fontSize: '12px', color: theme.textMuted }}>None sold</span>;
                  }
                  return <span style={{ fontSize: '12px', color: theme.warning }}>+{Math.abs(sold)} more</span>;
                })()}
              </div>

              {/* Expiration Date */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <span style={{ fontSize: '12px', color: theme.textMuted, whiteSpace: 'nowrap' }}>Exp:</span>
                <input
                  type="date"
                  defaultValue={item.expiration_date?.split('T')[0] || ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleSetExpiration(item.id, e.target.value);
                    }
                  }}
                  style={{
                    ...styles.input,
                    padding: '6px 10px',
                    fontSize: '13px',
                    flex: 1,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Submit Visit Button */}
        {(Object.keys(pendingMarks).length > 0 || Object.values(stockCounts).some(v => v !== '' && v !== undefined)) && (() => {
          const markedCount = Object.keys(pendingMarks).length;
          const countedCount = Object.values(stockCounts).filter(v => v !== '' && v !== undefined).length;
          const parts = [];
          if (markedCount > 0) parts.push(`${markedCount} marked`);
          if (countedCount > 0) parts.push(`${countedCount} counted`);
          return (
            <button
              onClick={handleSubmitVisit}
              disabled={submittingVisit}
              style={{
                ...styles.button,
                width: '100%',
                marginTop: '16px',
                backgroundColor: theme.success,
                opacity: submittingVisit ? 0.7 : 1,
                fontSize: '16px',
                padding: '14px',
              }}
            >
              {submittingVisit ? 'Submitting...' : `Submit Visit (${parts.join(', ')})`}
            </button>
          );
        })()}

        {inventory.length === 0 && (
          <div style={{ ...styles.card, textAlign: 'center', padding: '48px' }}>
            <p style={{ color: theme.textSecondary }}>No products in this machine yet.</p>
          </div>
        )}

        {/* Redistribute Buttons */}
        {inventory.length > 0 && (
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px', marginTop: '16px' }}>
            <button
              onClick={() => { setShowRedistribution(!showRedistribution); setAutoDistSuggestions(null); }}
              style={{ ...styles.button, backgroundColor: showRedistribution ? theme.warning : theme.primary }}
            >
              {showRedistribution ? 'Close Redistribution' : 'Redistribute Products'}
            </button>
            <button
              onClick={handleAutoDistribute}
              disabled={autoDistLoading}
              style={{ ...styles.button, backgroundColor: theme.secondary, opacity: autoDistLoading ? 0.7 : 1 }}
            >
              {autoDistLoading ? 'Analyzing...' : 'Auto Distribute'}
            </button>
          </div>
        )}

        {/* Auto Distribute Suggestions */}
        {autoDistSuggestions && (
          <div style={{ ...styles.card, marginTop: '16px', borderLeft: `4px solid ${theme.secondary}` }}>
            <h3 style={{ margin: '0 0 4px 0' }}>Auto Distribute Suggestions</h3>
            <p style={{ color: theme.textMuted, fontSize: '14px', margin: '0 0 16px 0' }}>
              {autoDistSuggestions.summary.totalProducts} products, {autoDistSuggestions.summary.totalUnits} units across {autoDistSuggestions.summary.totalMoves} moves — based on performance history
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto', marginBottom: '16px' }}>
              {autoDistSuggestions.moves.map((move, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: theme.surfaceHover, borderRadius: '8px', fontSize: '14px' }}>
                  <span><strong>{move.quantity}x</strong> {move.productName} to {move.targetMachineName}</span>
                  <span style={{ color: move.targetIsPerforming ? theme.success : theme.textMuted, fontSize: '12px' }}>
                    {move.targetIsPerforming ? 'Performing' : `${move.targetPositiveMarks} positive marks`}
                  </span>
                </div>
              ))}
            </div>

            {autoDistSuggestions.summary.skipped.length > 0 && (
              <p style={{ color: theme.textMuted, fontSize: '13px', margin: '0 0 12px 0' }}>
                Skipped: {autoDistSuggestions.summary.skipped.map(s => s.productName).join(', ')} (no better placement found)
              </p>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleApproveAutoDistribute}
                disabled={autoDistExecuting}
                style={{ ...styles.button, ...styles.buttonSuccess, flex: 1, fontSize: '16px', padding: '14px', opacity: autoDistExecuting ? 0.7 : 1 }}
              >
                {autoDistExecuting ? 'Distributing...' : `Approve & Execute (${autoDistSuggestions.summary.totalMoves} transfers)`}
              </button>
              <button
                onClick={() => setAutoDistSuggestions(null)}
                disabled={autoDistExecuting}
                style={{ ...styles.button, backgroundColor: theme.surfaceHover }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Redistribution Section */}
      {showRedistribution && inventory.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ marginBottom: '16px' }}>Product Redistribution</h2>
          <p style={{ color: theme.textSecondary, marginBottom: '16px' }}>
            Move products to machines where they perform better to reduce spoilage.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '16px' : '24px' }}>
            {/* Source Products (Left Panel) */}
            <div>
              <h3 style={{ marginBottom: '12px', color: theme.textSecondary }}>Select Product to Move</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                {inventory.filter(item => item.current_stock > 0).map(item => {
                  const effectiveStock = getEffectiveStock(item);
                  const isDisabled = effectiveStock <= 0;
                  return (
                    <div
                      key={item.id}
                      onClick={() => !isDisabled && handleSelectProductForRedist(item)}
                      style={{
                        ...styles.card,
                        cursor: isDisabled ? 'default' : 'pointer',
                        opacity: isDisabled ? 0.5 : 1,
                        borderLeft: `4px solid ${selectedProductForRedist?.id === item.id ? theme.primary : 'transparent'}`,
                        backgroundColor: selectedProductForRedist?.id === item.id ? theme.surfaceHover : theme.surface,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: '600' }}>{item.product_name}</p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: theme.textMuted }}>
                            Stock: {item.current_stock}{getQueuedQuantity(item.product_id) > 0 ? ` (${effectiveStock} available)` : ''} • {item.is_performing === true ? 'Performing' : item.is_performing === false ? 'Not Performing' : 'Unmarked'}
                          </p>
                        </div>
                        {selectedProductForRedist?.id === item.id && (
                          <span style={{ color: theme.primary, fontSize: '13px', fontWeight: '600' }}>Selected</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Target Machines (Right Panel) */}
            <div>
              <h3 style={{ marginBottom: '12px', color: theme.textSecondary }}>
                {selectedProductForRedist ? `Send "${selectedProductForRedist.product_name}" to:` : 'Select a product first'}
              </h3>

              {redistributionLoading ? (
                <div style={{ ...styles.card, textAlign: 'center', padding: '24px' }}>
                  <p style={{ color: theme.textSecondary }}>Loading target machines...</p>
                </div>
              ) : selectedProductForRedist ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                  {redistributionTargets.length > 0 ? (
                    redistributionTargets.map(target => (
                      <div
                        key={target.machine_id}
                        onClick={() => setSelectedTargetMachine(target)}
                        style={{
                          ...styles.card,
                          cursor: 'pointer',
                          borderLeft: `4px solid ${selectedTargetMachine?.machine_id === target.machine_id ? theme.success : target.is_performing ? theme.success + '50' : 'transparent'}`,
                          backgroundColor: selectedTargetMachine?.machine_id === target.machine_id ? theme.surfaceHover : theme.surface,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p style={{ margin: 0, fontWeight: '600' }}>{target.machine_name}</p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: theme.textMuted }}>
                              {target.location}
                            </p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                              {target.has_product ? (
                                <span>
                                  Stock: {target.current_stock} •{' '}
                                  <span style={{ color: target.is_performing ? theme.success : target.is_performing === false ? theme.danger : theme.textMuted }}>
                                    {target.is_performing ? 'Performing' : target.is_performing === false ? 'Not Performing' : 'Unmarked'}
                                  </span>
                                </span>
                              ) : (
                                <span style={{ color: theme.warning }}>Product not in this machine yet</span>
                              )}
                            </p>
                          </div>
                          {target.is_performing && <span style={{ color: theme.success, fontSize: '16px' }}>★</span>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ ...styles.card, textAlign: 'center', padding: '24px' }}>
                      <p style={{ color: theme.textSecondary }}>No other machines available for redistribution.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ ...styles.card, textAlign: 'center', padding: '24px' }}>
                  <p style={{ color: theme.textSecondary }}>Click on a product to see available target machines.</p>
                </div>
              )}

              {/* Transfer Controls */}
              {selectedProductForRedist && selectedTargetMachine && (
                <div style={{ ...styles.card, marginTop: '16px' }}>
                  <h4 style={{ margin: '0 0 12px 0' }}>Transfer Details</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <label style={{ color: theme.textSecondary }}>Quantity:</label>
                    <input
                      type="number"
                      min="1"
                      max={getEffectiveStock(selectedProductForRedist)}
                      value={transferQuantity}
                      onChange={(e) => setTransferQuantity(Math.min(parseInt(e.target.value) || 1, getEffectiveStock(selectedProductForRedist)))}
                      style={{ ...styles.input, width: '80px' }}
                    />
                    <span style={{ color: theme.textMuted, fontSize: '14px' }}>
                      of {getEffectiveStock(selectedProductForRedist)} available{getQueuedQuantity(selectedProductForRedist.product_id) > 0 ? ` (${selectedProductForRedist.current_stock} total, ${getQueuedQuantity(selectedProductForRedist.product_id)} queued)` : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={handleAddToQueue}
                      disabled={redistributionLoading}
                      style={{ ...styles.button, ...styles.buttonSuccess, flex: 1 }}
                    >
                      Add to Queue ({transferQuantity} units)
                    </button>
                    <button
                      onClick={handleCancelRedistribution}
                      style={{ ...styles.button, backgroundColor: theme.surfaceHover }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Queue Panel */}
          {redistQueue.length > 0 && !batchResults && (
            <div style={{ ...styles.card, marginTop: '16px' }}>
              <h3 style={{ margin: '0 0 12px 0' }}>Queued Transfers ({redistQueue.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {redistQueue.map(move => (
                  <div key={move.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', gap: '8px', backgroundColor: theme.surfaceHover, borderRadius: '8px' }}>
                    <span style={{ wordBreak: 'break-word', minWidth: 0 }}>
                      <strong>{move.quantity}x</strong> {move.product.product_name} to {move.targetMachine.machine_name}
                    </span>
                    <button
                      onClick={() => handleRemoveFromQueue(move.id)}
                      style={{ background: 'none', border: 'none', color: theme.danger, cursor: 'pointer', fontSize: '18px', padding: '8px', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <p style={{ color: theme.textMuted, fontSize: '14px', margin: '0 0 12px 0' }}>
                Total: {redistQueue.reduce((sum, m) => sum + m.quantity, 0)} units across {redistQueue.length} transfers
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleCommitBatch}
                  disabled={batchSubmitting}
                  style={{ ...styles.button, ...styles.buttonSuccess, flex: 1, opacity: batchSubmitting ? 0.7 : 1 }}
                >
                  {batchSubmitting ? 'Committing transfers... please wait' : `Commit All Transfers (${redistQueue.length})`}
                </button>
                <button
                  onClick={() => setRedistQueue([])}
                  disabled={batchSubmitting}
                  style={{ ...styles.button, backgroundColor: theme.surfaceHover, opacity: batchSubmitting ? 0.5 : 1 }}
                >
                  Clear Queue
                </button>
              </div>
            </div>
          )}

          {/* Batch Summary View */}
          {batchResults && (
            <div style={{ ...styles.card, marginTop: '16px', borderLeft: `4px solid ${theme.success}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '20px' }}>&#10003;</span>
                <h3 style={{ margin: 0, color: theme.success }}>All Transfers Complete</h3>
              </div>
              <p style={{ color: theme.textMuted, fontSize: '14px', margin: '0 0 16px 0' }}>
                {batchResults.totalMoves} transfers, {batchResults.totalUnitsTransferred} total units moved. Inventory has been updated.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {batchResults.moves.map((move, i) => (
                  <div key={i} style={{ padding: '10px 12px', backgroundColor: theme.surfaceHover, borderRadius: '8px', fontSize: '14px' }}>
                    <div><strong>{move.quantity}x</strong> {move.productName} to {move.targetMachine}</div>
                    <div style={{ color: theme.textMuted, marginTop: '4px' }}>
                      Source: {move.sourceStockBefore} to {move.sourceStockAfter} | Target: {move.targetStockBefore} to {move.targetStockAfter}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleCloseBatchSummary}
                style={{ ...styles.button, ...styles.buttonSuccess, width: '100%', fontSize: '16px', padding: '14px' }}
              >
                Done — Close Redistribution
              </button>
            </div>
          )}
        </div>
      )}

      {/* Swipe Poll Section */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <h2 style={{ margin: 0 }}>Customer Swipe Polls</h2>
          <button onClick={() => setShowPollForm(!showPollForm)} style={{ ...styles.button, ...styles.buttonSuccess }}>
            {showPollForm ? 'Cancel' : '+ Create Poll'}
          </button>
        </div>

        {showPollForm && <SwipePollForm machineId={id} onSuccess={() => { setShowPollForm(false); loadMachineData(true); }} />}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
          {polls.map(poll => (
            <div key={poll.id} style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                <h4 style={{ margin: 0, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>{poll.poll_question}</h4>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flexShrink: 0 }}>
                  {/* Poll Type Badge */}
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    backgroundColor: poll.pollType === 'discovery' ? theme.secondary + '20' : theme.primary + '20',
                    color: poll.pollType === 'discovery' ? theme.secondary : theme.primary
                  }}>
                    {poll.pollType === 'discovery' ? 'Discovery' : 'Performance'}
                  </span>
                  {/* Auto-generated indicator */}
                  {poll.isAutoGenerated && (
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      backgroundColor: theme.warning + '20',
                      color: theme.warning
                    }}>
                      Auto
                    </span>
                  )}
                  {/* Active Status */}
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    backgroundColor: poll.is_active ? theme.success + '20' : theme.surfaceHover,
                    color: poll.is_active ? theme.success : theme.textMuted
                  }}>
                    {poll.is_active ? 'Active' : 'Closed'}
                  </span>
                </div>
              </div>
              <p style={{ color: theme.textMuted, fontSize: '14px', margin: '0 0 12px 0' }}>
                {poll.product_count || 0} products • {poll.total_votes || 0} votes
              </p>
              <button
                onClick={() => handleTogglePollResults(poll.id)}
                style={{ ...styles.button, display: 'block', width: '100%', textAlign: 'center', fontSize: '14px', padding: '10px' }}
              >
                {expandedPollId === poll.id ? 'Hide Results' : 'View Results'}
              </button>

              {expandedPollId === poll.id && (
                <div style={{ marginTop: '16px' }}>
                  {expandedLoading ? (
                    <p style={{ color: theme.textMuted, textAlign: 'center' }}>Loading results...</p>
                  ) : expandedResults ? (
                    <div>
                      <p style={{ color: theme.textSecondary, fontSize: '13px', marginBottom: '12px' }}>
                        {expandedResults.totalVotes} total votes
                      </p>
                      {expandedResults.results.map((option) => (
                        <div key={option.option_id} style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '14px' }}>{option.product_name}</span>
                            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{option.approval_percent}%</span>
                          </div>
                          <div style={{ height: '8px', backgroundColor: theme.surfaceHover, borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${option.approval_percent}%`,
                              backgroundColor: option.approval_percent >= 50 ? theme.success : theme.danger,
                              borderRadius: '4px',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                          <p style={{ color: theme.textMuted, fontSize: '12px', margin: '4px 0 0 0' }}>
                            {option.swipe_right} likes / {option.swipe_left} passes
                          </p>
                        </div>
                      ))}
                      <Link to={`/vendor/polls/${poll.id}/results`} style={{ ...styles.link, fontSize: '13px' }}>
                        Full results page
                      </Link>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>

        {polls.length === 0 && (
          <div style={{ ...styles.card, textAlign: 'center', padding: '32px' }}>
            <p style={{ color: theme.textSecondary }}>No polls created yet. Create one to get customer feedback!</p>
          </div>
        )}
      </div>

      {/* QR Code Section */}
      <div style={styles.card}>
        <h2 style={{ margin: '0 0 16px 0' }}>Machine QR Code</h2>
        {qrCodeDataUrl ? (
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <img src={qrCodeDataUrl} alt="QR Code" style={{ width: '150px', borderRadius: '8px' }} />
            <div>
              <p style={{ color: theme.textSecondary, margin: '0 0 16px 0' }}>
                Customers scan this to vote on potential new products
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleCopyLink} style={{ ...styles.button, ...styles.buttonSecondary }}>
                  Copy Link
                </button>
                <button onClick={handleDownloadQRPDF} style={styles.button}>
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: theme.textMuted }}>Loading QR code...</p>
        )}
      </div>
    </div>
  );
}

function SwipePollForm({ machineId, onSuccess }) {
  const [pollType, setPollType] = useState('performance');
  const [question, setQuestion] = useState('Which products would you like to see more of?');
  const [products, setProducts] = useState([{ name: '', imageUrl: '' }, { name: '', imageUrl: '' }]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handlePollTypeChange = (type) => {
    setPollType(type);
    if (type === 'discovery') {
      setQuestion('Would you be interested in these new products?');
    } else {
      setQuestion('Which products would you like to see more of?');
    }
  };

  const handleAddProduct = () => {
    if (products.length < 20) {
      setProducts([...products, { name: '', imageUrl: '' }]);
    }
  };

  const handleRemoveProduct = (index) => {
    if (products.length > 2) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const handleProductChange = (index, field, value) => {
    const updated = [...products];
    updated[index][field] = value;
    setProducts(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validProducts = products.filter(p => p.name.trim());
    if (validProducts.length < 2) {
      toast.warning('Please add at least 2 products');
      return;
    }

    setLoading(true);
    try {
      await vendorAPI.createPoll(machineId, { question, pollType, products: validProducts });
      toast.success(pollType === 'discovery'
        ? 'Discovery poll created - gauge interest in new products!'
        : 'Poll created successfully');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ ...styles.card, marginBottom: '20px' }}>
      <h3 style={{ margin: '0 0 16px 0' }}>Create Swipe Poll</h3>

      {/* Poll Type Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label style={styles.label}>Poll Type</label>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={() => handlePollTypeChange('performance')}
            style={{
              ...styles.button,
              flex: 1,
              backgroundColor: pollType === 'performance' ? theme.primary : '#f0f0f0',
              color: pollType === 'performance' ? '#fff' : theme.text,
            }}
          >
            Performance Poll
          </button>
          <button
            type="button"
            onClick={() => handlePollTypeChange('discovery')}
            style={{
              ...styles.button,
              flex: 1,
              backgroundColor: pollType === 'discovery' ? theme.secondary : '#f0f0f0',
              color: pollType === 'discovery' ? '#fff' : theme.text,
            }}
          >
            Discovery Poll
          </button>
        </div>
        <p style={{ fontSize: '13px', color: theme.textSecondary, marginTop: '8px' }}>
          {pollType === 'performance'
            ? 'Ask customers about products you currently stock (e.g., underperformers)'
            : 'Test interest in NEW products before adding them to your inventory'}
        </p>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={styles.label}>Poll Question</label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          style={styles.input}
          required
        />
      </div>

      <label style={styles.label}>
        {pollType === 'discovery' ? 'New Products to Test (add images!)' : 'Products to Vote On'}
      </label>
      {products.map((product, index) => (
        <div key={index} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
          <input
            type="text"
            value={product.name}
            onChange={(e) => handleProductChange(index, 'name', e.target.value)}
            style={{ ...styles.input, flex: '2 1 140px' }}
            placeholder="Product name"
            required
          />
          <input
            type="url"
            value={product.imageUrl}
            onChange={(e) => handleProductChange(index, 'imageUrl', e.target.value)}
            style={{ ...styles.input, flex: '2 1 140px' }}
            placeholder={pollType === 'discovery' ? 'Image URL (recommended)' : 'Image URL (optional)'}
          />
          {products.length > 2 && (
            <button
              type="button"
              onClick={() => handleRemoveProduct(index)}
              style={{ ...styles.button, ...styles.buttonDanger, padding: '10px 14px' }}
              aria-label={`Remove product ${index + 1}`}
              title="Remove product"
            >
              ×
            </button>
          )}
        </div>
      ))}

      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
        <button type="button" onClick={handleAddProduct} style={{ ...styles.button, ...styles.buttonSecondary }}>
          + Add Product
        </button>
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? 'Creating...' : `Create ${pollType === 'discovery' ? 'Discovery' : ''} Poll`}
        </button>
      </div>
    </form>
  );
}

function PollResults() {
  const { pollId } = useParams();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const loadResults = useCallback(async () => {
    try {
      const response = await vendorAPI.getPollResults(pollId);
      setResults(response.data.data);
    } catch (err) {
      toast.error('Failed to load poll results');
    } finally {
      setLoading(false);
    }
  }, [pollId, toast]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  if (loading) return <div style={styles.page}><p>Loading...</p></div>;
  if (!results) return <div style={styles.page}><p>Poll not found.</p></div>;

  return (
    <div style={styles.page}>
      <Link to="/vendor/dashboard" style={{ ...styles.link, display: 'inline-block', marginBottom: '24px' }}>
        ← Back to Dashboard
      </Link>

      {/* Poll Type Badge */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{
          padding: '6px 14px',
          borderRadius: '16px',
          fontSize: '12px',
          fontWeight: '500',
          backgroundColor: results.poll.pollType === 'discovery' ? theme.secondary + '20' : theme.primary + '20',
          color: results.poll.pollType === 'discovery' ? theme.secondary : theme.primary
        }}>
          {results.poll.pollType === 'discovery' ? 'Discovery Poll' : 'Performance Poll'}
        </span>
        {results.poll.isAutoGenerated && (
          <span style={{
            padding: '6px 14px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: theme.warning + '20',
            color: theme.warning
          }}>
            Auto-Generated
          </span>
        )}
      </div>

      <h1 style={{ margin: '0 0 8px 0' }}>{results.poll.poll_question}</h1>
      <p style={{ color: theme.textSecondary, margin: '0 0 32px 0' }}>
        {results.poll.machine_name} • {results.totalVotes} total votes
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '20px' }}>
        {results.results.map((option, index) => (
          <div key={option.option_id} style={styles.card}>
            {option.image_url && (
              <img src={option.image_url} alt={option.product_name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' }} />
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0 }}>{option.product_name}</h3>
              <span style={{
                padding: '4px 12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                backgroundColor: theme.primary + '20',
                color: theme.primary
              }}>
                #{index + 1}
              </span>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: theme.success }}>Want it ({option.swipe_right})</span>
                <span style={{ fontWeight: 'bold' }}>{option.approval_percent}%</span>
              </div>
              <div style={{ height: '8px', backgroundColor: theme.surfaceHover, borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${option.approval_percent}%`, backgroundColor: theme.success, borderRadius: '4px' }} />
              </div>
            </div>

            <p style={{ color: theme.textMuted, fontSize: '14px', margin: 0 }}>
              {option.total_votes} total votes • {option.swipe_left} passes
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PollSummary() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadList = async () => {
      try {
        const response = await vendorAPI.getShoppingList();
        setProducts(response.data.data.products || []);
      } catch (err) {
        toast.error('Failed to load shopping list');
      } finally {
        setLoading(false);
      }
    };
    loadList();
  }, [toast]);

  const buildShoppingText = () => {
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const lines = products.map((p, i) =>
      `${i + 1}. ${p.product_name} — ${p.total_yes} good marks across ${p.machine_count} machine${Number(p.machine_count) !== 1 ? 's' : ''}`
    );
    return `IDDI Shopping List (${date})\nBased on product performance across all machines\n\n${lines.join('\n')}`;
  };

  const handleCopy = () => {
    if (products.length === 0) {
      toast.warning('No products on the shopping list yet');
      return;
    }
    navigator.clipboard.writeText(buildShoppingText());
    setCopied(true);
    toast.success('Shopping list copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div style={styles.page}><p>Loading...</p></div>;

  return (
    <div style={styles.page}>
      <Link to="/vendor/dashboard" style={{ ...styles.link, display: 'inline-block', marginBottom: '24px' }}>
        ← Back to Dashboard
      </Link>

      <h1 style={{ margin: '0 0 8px 0' }}>Shopping List</h1>
      <p style={{ color: theme.textSecondary, margin: '0 0 12px 0' }}>
        Based on your performance marks across all machines — not poll votes
      </p>
      <p style={{ color: theme.textMuted, fontSize: '13px', margin: '0 0 32px 0' }}>
        Products you've marked as doing good (yes) or bad (no) on each machine. Only products with 5+ marks and at least 1 good mark appear here.
      </p>

      {products.length === 0 ? (
        <div style={{ ...styles.card, textAlign: 'center', padding: '48px' }}>
          <p style={{ fontSize: '24px', margin: '0 0 16px 0', color: theme.textMuted }}>No items</p>
          <p style={{ fontWeight: '600', fontSize: '16px', margin: '0 0 8px 0' }}>No products qualify yet</p>
          <p style={{ color: theme.textSecondary }}>Keep marking products as doing good or bad on your machines. Products need at least 5 performance marks with at least 1 good mark to show up here.</p>
        </div>
      ) : (
        <>
          <p style={{ color: theme.textMuted, fontSize: '13px', margin: '0 0 16px 0' }}>
            {products.length} product{products.length !== 1 ? 's' : ''} doing well enough to restock
          </p>
          <div style={{ marginBottom: '40px' }}>
            {products.map((product, i) => (
              <div key={product.product_name} style={{ ...styles.card, marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '8px', gap: '8px' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ fontWeight: '600', fontSize: isMobile ? '15px' : '16px', wordBreak: 'break-word' }}>{i + 1}. {product.product_name}</span>
                    {product.category && (
                      <span style={{ color: theme.textMuted, fontSize: '12px', marginLeft: '10px', backgroundColor: theme.surfaceHover, padding: '2px 8px', borderRadius: '10px', display: 'inline-block', marginTop: isMobile ? '4px' : undefined }}>
                        {product.category}
                      </span>
                    )}
                  </div>
                  <span style={{ fontWeight: 'bold', fontSize: '16px', color: theme.success, flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {product.total_yes} good
                  </span>
                </div>
                <div style={{ height: '10px', backgroundColor: theme.surfaceHover, borderRadius: '5px', overflow: 'hidden', marginBottom: '6px' }}>
                  <div style={{
                    height: '100%',
                    width: `${product.approval_rate}%`,
                    backgroundColor: Number(product.approval_rate) >= 70 ? theme.success : theme.warning,
                    borderRadius: '5px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <p style={{ color: theme.textMuted, fontSize: '13px', margin: 0 }}>
                  {product.total_yes} good / {product.total_no} bad marks — across {product.machine_count} machine{Number(product.machine_count) !== 1 ? 's' : ''} — {product.total_marks} total marks
                </p>
              </div>
            ))}
          </div>

          {/* Copyable Preview */}
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', marginBottom: '16px', flexDirection: isMobile ? 'column' : 'row', gap: '12px' }}>
              <h2 style={{ margin: 0 }}>Shopping List</h2>
              <button onClick={handleCopy} style={{ ...styles.button, ...styles.buttonSuccess, flexShrink: 0 }}>
                {copied ? 'Copied!' : 'Copy Shopping List'}
              </button>
            </div>
            <div style={{ backgroundColor: theme.bg, borderRadius: '8px', padding: isMobile ? '12px' : '16px', fontFamily: 'monospace', fontSize: isMobile ? '12px' : '14px', lineHeight: '1.8', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {buildShoppingText()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// ANALYTICS DASHBOARD
// ============================================

function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const toast = useToast();

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [overviewRes, engagementRes] = await Promise.allSettled([
        vendorAPI.getAnalyticsOverview(),
        vendorAPI.getEngagementRankings(),
      ]);

      if (overviewRes.status === 'fulfilled') {
        setAnalytics(overviewRes.value?.data?.data);
      }
      if (engagementRes.status === 'fulfilled') {
        setEngagement(engagementRes.value?.data?.data);
      }
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatChange = (change) => {
    if (change === 0) return <span style={{ color: theme.textMuted }}>0%</span>;
    if (change > 0) return <span style={{ color: theme.success }}>+{change}%</span>;
    return <span style={{ color: theme.danger }}>{change}%</span>;
  };

  if (loading) {
    return <div style={styles.page}><p>Loading analytics...</p></div>;
  }

  return (
    <div style={styles.page}>
      <Link to="/vendor/dashboard" style={{ ...styles.link, display: 'inline-block', marginBottom: '24px' }}>
        ← Back to Dashboard
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0' }}>Analytics</h1>
          <p style={{ color: theme.textSecondary, margin: 0 }}>
            Track customer engagement and machine performance
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          style={styles.buttonSecondary}
        >
          Refresh
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {['overview', 'engagement'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.button,
              backgroundColor: activeTab === tab ? theme.primary : theme.surfaceHover,
              border: activeTab === tab ? 'none' : `1px solid ${theme.border}`,
            }}
          >
            {tab === 'overview' ? 'Overview' : 'Engagement Rankings'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && analytics && (
        <>
          {/* Today's Stats */}
          <h2 style={{ marginBottom: '16px' }}>Today</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '16px', marginBottom: '32px' }}>
            <div style={styles.card}>
              <div style={{ color: theme.textMuted, fontSize: '14px', marginBottom: '8px' }}>QR Scans</div>
              <div style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 'bold' }}>{analytics.today?.qrScans || 0}</div>
            </div>
            <div style={styles.card}>
              <div style={{ color: theme.textMuted, fontSize: '14px', marginBottom: '8px' }}>Poll Votes</div>
              <div style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 'bold', color: theme.primary }}>{analytics.today?.pollVotes || 0}</div>
            </div>
            <div style={styles.card}>
              <div style={{ color: theme.textMuted, fontSize: '14px', marginBottom: '8px' }}>Suggestions</div>
              <div style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 'bold', color: theme.success }}>{analytics.today?.suggestions || 0}</div>
            </div>
          </div>

          {/* This Week's Stats */}
          <h2 style={{ marginBottom: '16px' }}>This Week</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px', marginBottom: '32px' }}>
            <div style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: theme.textMuted, fontSize: '14px', marginBottom: '8px' }}>QR Scans</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{analytics.thisWeek?.qrScans || 0}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px' }}>vs last week</div>
                  {formatChange(analytics.weekOverWeek?.qrScansChange || 0)}
                </div>
              </div>
            </div>
            <div style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: theme.textMuted, fontSize: '14px', marginBottom: '8px' }}>Poll Votes</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: theme.primary }}>{analytics.thisWeek?.pollVotes || 0}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px' }}>vs last week</div>
                  {formatChange(analytics.weekOverWeek?.pollVotesChange || 0)}
                </div>
              </div>
            </div>
            <div style={styles.card}>
              <div style={{ color: theme.textMuted, fontSize: '14px', marginBottom: '8px' }}>Suggestions</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: theme.success }}>{analytics.thisWeek?.suggestions || 0}</div>
            </div>
          </div>

          {/* Top Machines */}
          {analytics.topMachines && analytics.topMachines.length > 0 && (
            <>
              <h2 style={{ marginBottom: '16px' }}>Top Machines This Week</h2>
              <div style={{ display: 'grid', gap: '12px' }}>
                {analytics.topMachines.slice(0, 5).map((machine, index) => (
                  <div key={machine.machineId} style={{
                    ...styles.card,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    padding: '16px 20px'
                  }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      backgroundColor: index < 3 ? theme.primary + '20' : theme.surfaceHover,
                      color: index < 3 ? theme.primary : theme.textSecondary
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <Link to={`/vendor/machines/${machine.machineId}`} style={{ ...styles.link, fontWeight: '600' }}>
                        {machine.machineName}
                      </Link>
                    </div>
                    <div style={{ display: 'flex', gap: '24px', textAlign: 'center' }}>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{machine.qrScans}</div>
                        <div style={{ color: theme.textMuted, fontSize: '12px' }}>scans</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: theme.primary }}>{machine.pollVotes}</div>
                        <div style={{ color: theme.textMuted, fontSize: '12px' }}>votes</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: theme.secondary }}>{machine.uniqueSessions}</div>
                        <div style={{ color: theme.textMuted, fontSize: '12px' }}>visitors</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Empty State */}
          {(!analytics.topMachines || analytics.topMachines.length === 0) && (
            <div style={{ ...styles.card, textAlign: 'center', padding: '48px' }}>
              <p style={{ color: theme.textSecondary, marginBottom: '8px' }}>No analytics data yet</p>
              <p style={{ color: theme.textMuted, fontSize: '14px' }}>
                Share your machine QR codes with customers to start collecting engagement data.
              </p>
            </div>
          )}
        </>
      )}

      {activeTab === 'engagement' && engagement && (
        <>
          <h2 style={{ marginBottom: '16px' }}>Machine Engagement Rankings (Last 30 Days)</h2>
          <p style={{ color: theme.textMuted, marginBottom: '24px', fontSize: '14px' }}>
            Engagement score = (QR Scans × 1) + (Poll Votes × 3) + (Suggestions × 5)
          </p>

          {engagement.machines && engagement.machines.length > 0 ? (
            <div style={{ display: 'grid', gap: '12px' }}>
              {engagement.machines.map((machine) => (
                <div key={machine.machineId} style={{
                  ...styles.card,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  padding: '16px 20px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    backgroundColor: machine.rank <= 3 ? theme.warning + '20' : theme.surfaceHover,
                    color: machine.rank <= 3 ? theme.warning : theme.textSecondary
                  }}>
                    {machine.rank}
                  </div>

                  <div style={{ flex: 1 }}>
                    <Link to={`/vendor/machines/${machine.machineId}`} style={{ ...styles.link, fontWeight: '600', fontSize: '16px' }}>
                      {machine.machineName}
                    </Link>
                    {machine.location && (
                      <div style={{ color: theme.textMuted, fontSize: '13px', marginTop: '2px' }}>
                        {machine.location}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '24px', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{machine.qrScans}</div>
                      <div style={{ color: theme.textMuted, fontSize: '11px' }}>scans</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: theme.primary }}>{machine.pollVotes}</div>
                      <div style={{ color: theme.textMuted, fontSize: '11px' }}>votes</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: theme.success }}>{machine.suggestions}</div>
                      <div style={{ color: theme.textMuted, fontSize: '11px' }}>suggestions</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: theme.secondary }}>{machine.uniqueSessions}</div>
                      <div style={{ color: theme.textMuted, fontSize: '11px' }}>visitors</div>
                    </div>
                  </div>

                  <div style={{
                    padding: '8px 16px',
                    backgroundColor: theme.primary + '20',
                    borderRadius: '8px',
                    textAlign: 'center',
                    minWidth: '80px'
                  }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: theme.primary }}>{machine.engagementScore}</div>
                    <div style={{ color: theme.textMuted, fontSize: '11px' }}>score</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ ...styles.card, textAlign: 'center', padding: '48px' }}>
              <p style={{ color: theme.textSecondary }}>No engagement data yet</p>
            </div>
          )}
        </>
      )}

      {/* Last updated */}
      {analytics?.lastUpdated && (
        <p style={{ color: theme.textMuted, fontSize: '12px', marginTop: '24px', textAlign: 'center' }}>
          Last updated: {new Date(analytics.lastUpdated).toLocaleString()}
        </p>
      )}
    </div>
  );
}

// ============================================
// TOP 50 PRODUCTS
// ============================================

function TopProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const toast = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    loadTopProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTopProducts = async () => {
    try {
      const response = await vendorAPI.getTopProducts();
      setProducts(response.data.data.topProducts);
      setLastUpdated(response.data.data.lastUpdated);
    } catch (err) {
      toast.error('Failed to load top products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadTopProducts();
  };

  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return 'Calculating...';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (loading) return <div style={styles.page}><p>Loading...</p></div>;

  return (
    <div style={styles.page}>
      <Link to="/vendor/dashboard" style={{ ...styles.link, display: 'inline-block', marginBottom: '24px' }}>
        ← Back to Dashboard
      </Link>

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-start', gap: '12px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: isMobile ? '22px' : undefined }}>Top 50 Products</h1>
          <p style={{ color: theme.textSecondary, margin: 0, fontSize: isMobile ? '13px' : undefined }}>
            Most popular products across all vendors based on weighted performance ratings
          </p>
          <p style={{ color: theme.textMuted, margin: '4px 0 0 0', fontSize: '13px' }}>
            Last updated: {formatLastUpdated(lastUpdated)}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            ...styles.buttonSecondary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            opacity: refreshing ? 0.6 : 1,
            flexShrink: 0,
          }}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {products.length === 0 ? (
        <div style={{ ...styles.card, textAlign: 'center', padding: '48px' }}>
          <p style={{ color: theme.textSecondary }}>No performance data yet. Start marking products as performing!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {products.map((product, index) => (
            <div key={product.product_id} style={{
              ...styles.card,
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '10px' : '20px',
              padding: isMobile ? '12px' : '16px 20px'
            }}>
              <div style={{
                width: isMobile ? '28px' : '40px',
                height: isMobile ? '28px' : '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: isMobile ? '12px' : '16px',
                flexShrink: 0,
                backgroundColor: index < 3 ? theme.warning + '20' : theme.surfaceHover,
                color: index < 3 ? theme.warning : theme.textSecondary
              }}>
                {product.rank_position || index + 1}
              </div>

              <div style={{ width: isMobile ? '40px' : '50px', height: isMobile ? '40px' : '50px', borderRadius: '8px', background: theme.border, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: theme.textMuted }}>
                {product.image_url ? (
                  <img src={product.image_url} alt={product.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                ) : <span style={{ fontSize: '14px', color: '#4a4a6a' }}>--</span>}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: 0, fontSize: isMobile ? '14px' : undefined, wordBreak: 'break-word' }}>{product.product_name}</h4>
                <p style={{ color: theme.textMuted, margin: 0, fontSize: isMobile ? '12px' : '14px' }}>
                  {product.unique_vendors > 0
                    ? `Used by ${product.unique_vendors} vendor${product.unique_vendors !== 1 ? 's' : ''}`
                    : ''}
                </p>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: 'bold', color: theme.success }}>
                  {product.yes_count}
                </div>
                <div style={{ color: theme.textMuted, fontSize: isMobile ? '10px' : '12px' }}>
                  {isMobile ? `${product.performance_percentage || 0}%` : `performing (${product.performance_percentage || 0}%)`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// ROUTE PLAN - Global Redistribution View
// ============================================

function RoutePlan() {
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStop, setSelectedStop] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const location = useLocation();
  const toast = useToast();
  const isMobile = useIsMobile();

  // Reload data whenever the page is navigated to (using location.key)
  useEffect(() => {
    loadRoutePlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const loadRoutePlan = async () => {
    try {
      setLoading(true);
      const response = await vendorAPI.getRedistributionPlan();
      setRouteData(response.data.data);
      setLastUpdated(new Date());
    } catch (err) {
      toast.error('Failed to load route plan');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Analyzing machines and generating route plan...</p>
      </div>
    );
  }

  if (!routeData || routeData.routeStops.length === 0) {
    return (
      <div style={styles.page}>
        <Link to="/vendor/dashboard" style={{ ...styles.link, display: 'inline-block', marginBottom: '24px' }}>
          ← Back to Dashboard
        </Link>
        <div style={{ ...styles.card, textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>✓</div>
          <h2 style={{ margin: '0 0 8px 0' }}>No Redistribution Needed</h2>
          <p style={{ color: theme.textSecondary, margin: 0 }}>
            All products are performing well in their current machines, or there are no better placement opportunities.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <Link to="/vendor/dashboard" style={{ ...styles.link, display: 'inline-block', marginBottom: '24px' }}>
        ← Back to Dashboard
      </Link>

      {/* Header */}
      <div style={{ ...styles.card, marginBottom: '24px', background: `linear-gradient(135deg, ${theme.primary}20, ${theme.surface})` }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'start', marginBottom: '16px', gap: '12px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: isMobile ? '22px' : undefined }}>Route Plan</h1>
            <p style={{ color: theme.textSecondary, margin: 0, fontSize: isMobile ? '13px' : undefined }}>
              Optimized redistribution plan based on product performance across all machines
            </p>
          </div>
          <div style={{ textAlign: isMobile ? 'left' : 'right', display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={loadRoutePlan}
              disabled={loading}
              style={{ ...styles.button, ...styles.buttonSecondary, flexShrink: 0 }}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            {lastUpdated && (
              <div style={{ fontSize: '12px', color: theme.textMuted }}>
                Updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 'bold', color: theme.warning }}>
              {routeData.summary.totalMachinesAffected}
            </div>
            <div style={{ color: theme.textMuted, fontSize: '14px' }}>Machines to Visit</div>
          </div>
          <div>
            <div style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 'bold', color: theme.danger }}>
              {routeData.summary.totalProductsToRemove}
            </div>
            <div style={{ color: theme.textMuted, fontSize: '14px' }}>Products to Remove</div>
          </div>
          <div>
            <div style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 'bold', color: theme.success }}>
              {routeData.summary.totalProductsToAdd}
            </div>
            <div style={{ color: theme.textMuted, fontSize: '14px' }}>Products to Add</div>
          </div>
        </div>
      </div>

      {/* Route Stops */}
      <h2 style={{ margin: '0 0 16px 0' }}>Route Stops ({routeData.routeStops.length})</h2>
      <p style={{ color: theme.textSecondary, marginBottom: '20px' }}>
        Click on a machine to see what to REMOVE (underperforming) and ADD (performing well here)
      </p>

      <div style={{ display: 'grid', gap: '16px' }}>
        {routeData.routeStops.map((stop, index) => (
          <div
            key={stop.machineId}
            style={{
              ...styles.card,
              cursor: 'pointer',
              borderLeft: `4px solid ${selectedStop === stop.machineId ? theme.primary : theme.border}`,
              backgroundColor: selectedStop === stop.machineId ? theme.surfaceHover : theme.surface,
            }}
            onClick={() => setSelectedStop(selectedStop === stop.machineId ? null : stop.machineId)}
          >
            {/* Stop Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <span style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: theme.primary,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}>
                    {index + 1}
                  </span>
                  <h3 style={{ margin: 0, wordBreak: 'break-word' }}>{stop.machineName}</h3>
                </div>
                <p style={{ color: theme.textMuted, margin: '0 0 0 40px', fontSize: '14px' }}>
                  {stop.location}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                {stop.remove.length > 0 && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: theme.danger }}>
                      {stop.remove.length}
                    </div>
                    <div style={{ fontSize: '12px', color: theme.textMuted }}>Remove</div>
                  </div>
                )}
                {stop.add.length > 0 && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: theme.success }}>
                      {stop.add.length}
                    </div>
                    <div style={{ fontSize: '12px', color: theme.textMuted }}>Add</div>
                  </div>
                )}
              </div>
            </div>

            {/* Expanded Details */}
            {selectedStop === stop.machineId && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${theme.border}` }}>
                {/* REMOVE Section */}
                {stop.remove.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ color: theme.danger, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      ❌ REMOVE from this machine (underperforming here)
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {stop.remove.map(item => (
                        <div
                          key={item.productId}
                          style={{
                            padding: '12px',
                            backgroundColor: theme.danger + '10',
                            borderRadius: '8px',
                            borderLeft: `3px solid ${theme.danger}`
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ margin: 0, fontWeight: '600', wordBreak: 'break-word' }}>{item.productName}</p>
                              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: theme.textMuted }}>
                                Stock: {item.currentStock} units available
                              </p>
                            </div>
                          </div>
                          {item.suggestedTargets && item.suggestedTargets.length > 0 && (
                            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px dashed ${theme.border}` }}>
                              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: theme.textMuted }}>
                                Move to (performs well at):
                              </p>
                              {item.suggestedTargets.slice(0, 2).map(target => (
                                <span
                                  key={target.machineId}
                                  style={{
                                    display: 'inline-block',
                                    padding: '2px 8px',
                                    backgroundColor: theme.success + '20',
                                    color: theme.success,
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    marginRight: '6px',
                                    marginTop: '4px'
                                  }}
                                >
                                  {target.machineName}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ADD Section */}
                {stop.add.length > 0 && (
                  <div>
                    <h4 style={{ color: theme.success, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      ✅ ADD to this machine (performs well here)
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {stop.add.map((item, idx) => (
                        <div
                          key={`${item.productId}-${item.sourceMachineId}-${idx}`}
                          style={{
                            padding: '12px',
                            backgroundColor: theme.success + '10',
                            borderRadius: '8px',
                            borderLeft: `3px solid ${theme.success}`
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                              <p style={{ margin: 0, fontWeight: '600' }}>{item.productName}</p>
                              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: theme.textMuted }}>
                                From: {item.sourceMachineName} ({item.availableStock} available)
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                  <Link
                    to={`/vendor/machines/${stop.machineId}`}
                    style={{ ...styles.button, textDecoration: 'none', textAlign: 'center', flex: 1 }}
                  >
                    Open Machine Details
                  </Link>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div style={{ ...styles.card, marginTop: '24px', backgroundColor: theme.warning + '10', borderLeft: `4px solid ${theme.warning}` }}>
        <h3 style={{ margin: '0 0 8px 0', color: theme.warning }}>📝 How to Use This Plan</h3>
        <ol style={{ margin: 0, paddingLeft: '20px', color: theme.textSecondary, lineHeight: '1.8' }}>
          <li>Review each stop on your route</li>
          <li>At each machine, <strong>REMOVE</strong> the underperforming products (red items)</li>
          <li>Keep removed products on your truck for later stops</li>
          <li>At machines where products perform well, <strong>ADD</strong> products from your truck (green items)</li>
          <li>This optimizes sales and reduces spoilage!</li>
        </ol>
      </div>
    </div>
  );
}

export { VendorDashboard, MachineDetails, PollResults, PollSummary, AnalyticsDashboard, TopProducts, RoutePlan };
