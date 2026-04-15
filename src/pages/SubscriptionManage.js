import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { vendorAPI } from '../services/api';
import { theme, styles, useIsMobile } from '../shared/theme';
import { useToast } from '../shared/toast';
import CancelRetentionModal from '../components/CancelRetentionModal';

const TIER_DISPLAY = {
  free: { label: 'Free', color: theme.textSecondary, price: '$0', machines: '1 machine' },
  growth: { label: 'Growth', color: theme.primary, price: '$19/mo', machines: 'Up to 10 machines' },
  pro: { label: 'Pro', color: theme.success, price: '$49/mo', machines: 'Up to 30 machines' },
  business: { label: 'Business', color: theme.warning || '#fbbf24', price: '$99/mo', machines: 'Up to 100 machines' },
};

function SubscriptionManage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Handle success redirect from Square Checkout
    if (searchParams.get('status') === 'success') {
      const tier = searchParams.get('tier');
      toast.success(`Welcome to IDDI ${tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : ''}!`);
      // Clean URL
      window.history.replaceState({}, '', '/vendor/subscription');
    }
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const res = await vendorAPI.getSubscriptionStatus();
      setStatus(res.data?.data);
    } catch (err) {
      toast.error('Failed to load subscription info');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (tier) => {
    if (upgrading) return;
    setUpgrading(tier);
    try {
      const res = await vendorAPI.createCheckout(tier);
      const url = res.data?.data?.checkoutUrl;
      if (url) {
        window.location.href = url;
      } else {
        toast.error('Failed to create checkout session');
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setUpgrading(null);
    }
  };

  const handleChangePlan = async (tier) => {
    if (upgrading) return;
    setUpgrading(tier);
    try {
      await vendorAPI.changePlan(tier);
      toast.success(`Plan changed to ${tier}`);
      await loadStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change plan');
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{
          width: 36, height: 36, border: `3px solid ${theme.border}`,
          borderTopColor: theme.primary, borderRadius: '50%',
        }} />
      </div>
    );
  }

  const currentTier = status?.tier || 'free';
  const display = TIER_DISPLAY[currentTier] || TIER_DISPLAY.free;
  const isPaid = currentTier !== 'free';

  return (
    <div style={styles.page}>
      <h1 style={{ ...styles.heading, marginBottom: '8px' }}>Subscription</h1>
      <p style={{ color: theme.textSecondary, fontSize: '14px', marginBottom: '24px' }}>
        Manage your plan and billing.
      </p>

      {/* Current Plan Card */}
      <div style={{
        ...styles.card,
        marginBottom: '24px',
        border: `1px solid ${display.color}40`,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 16,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{
                backgroundColor: `${display.color}20`,
                color: display.color,
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 700,
              }}>
                {display.label}
              </span>
              <span style={{ color: theme.text, fontSize: 24, fontWeight: 800 }}>
                {display.price}
              </span>
            </div>
            <p style={{ color: theme.textSecondary, fontSize: 14, margin: 0 }}>
              {display.machines} — Using {status?.machinesUsed || 0} of {status?.machineLimit || 1}
            </p>
            {status?.nextBillingDate && (
              <p style={{ color: theme.textMuted, fontSize: 13, marginTop: 4, margin: '4px 0 0' }}>
                Next billing: {new Date(status.nextBillingDate).toLocaleDateString()}
              </p>
            )}
          </div>

          {isPaid && (
            <button
              onClick={() => setShowCancelModal(true)}
              style={{
                background: 'none', border: `1px solid ${theme.border}`,
                color: theme.textMuted, padding: '8px 16px',
                borderRadius: 6, fontSize: 13, cursor: 'pointer',
              }}
            >
              Cancel Subscription
            </button>
          )}
        </div>

        {/* Usage bar */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: theme.textMuted, fontSize: 12 }}>Machine usage</span>
            <span style={{ color: theme.textMuted, fontSize: 12 }}>
              {status?.machinesUsed || 0}/{status?.machineLimit || 1}
            </span>
          </div>
          <div style={{
            height: 6, borderRadius: 3,
            backgroundColor: theme.surfaceHover || theme.border,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 3,
              width: `${Math.min(100, ((status?.machinesUsed || 0) / (status?.machineLimit || 1)) * 100)}%`,
              backgroundColor: (status?.machinesUsed || 0) >= (status?.machineLimit || 1)
                ? theme.danger
                : theme.primary,
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <h2 style={{ color: theme.text, fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
        {isPaid ? 'Change Plan' : 'Upgrade'}
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: 16,
      }}>
        {['growth', 'pro', 'business'].map(tier => {
          const td = TIER_DISPLAY[tier];
          const isCurrent = tier === currentTier;
          return (
            <div key={tier} style={{
              ...styles.card,
              border: `1px solid ${isCurrent ? td.color : theme.border}`,
              opacity: isCurrent ? 0.6 : 1,
            }}>
              <h3 style={{ color: td.color, fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>
                {td.label}
              </h3>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: theme.text }}>{td.price.split('/')[0]}</span>
                <span style={{ color: theme.textSecondary, fontSize: 14 }}>/mo</span>
              </div>
              <p style={{ color: theme.textMuted, fontSize: 13, margin: '0 0 16px' }}>
                {td.machines}
              </p>
              <button
                onClick={() => {
                  if (isCurrent) return;
                  if (isPaid) {
                    handleChangePlan(tier);
                  } else {
                    handleUpgrade(tier);
                  }
                }}
                disabled={isCurrent || upgrading === tier}
                style={{
                  width: '100%', padding: '10px 0', borderRadius: 8,
                  border: isCurrent ? `1px solid ${theme.border}` : 'none',
                  backgroundColor: isCurrent ? 'transparent' : theme.primary,
                  color: isCurrent ? theme.textMuted : '#fff',
                  fontSize: 14, fontWeight: 600, cursor: isCurrent ? 'default' : 'pointer',
                  opacity: upgrading === tier ? 0.7 : 1,
                }}
              >
                {isCurrent ? 'Current Plan' : upgrading === tier ? 'Processing...' : isPaid ? 'Switch Plan' : 'Upgrade'}
              </button>
            </div>
          );
        })}
      </div>

      <CancelRetentionModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onCancelled={() => {
          setShowCancelModal(false);
          loadStatus();
        }}
      />
    </div>
  );
}

export default SubscriptionManage;
