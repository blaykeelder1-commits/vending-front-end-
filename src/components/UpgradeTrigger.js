import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { theme } from '../shared/theme';

const DISMISS_KEY_PREFIX = 'iddi_upgrade_dismissed_';

const keyframes = `
@keyframes upgradeFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes upgradeScaleIn {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}
`;

const TRIGGER_CONFIG = {
  'machine-limit': {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="18" rx="2" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
    getHeadline: () => 'Ready for Machine #2?',
    getDescription: () =>
      'Upgrade to Growth ($19/mo) to manage up to 10 machines. That\u2019s less than $2 per machine.',
    cta: 'Upgrade to Growth',
    secondary: 'Maybe Later',
  },
  performance: {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
    getHeadline: () => 'Your Machine is Crushing It!',
    getDescription: (data) =>
      `Your ${data?.machineName || 'machine'} is performing ${data?.percentAbove || '0'}% above average. Imagine these results across 10 machines.`,
    cta: 'See Growth Plan',
    secondary: 'Keep Going',
  },
  'referral-reward': {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.warning || '#fbbf24'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12V8H6a2 2 0 0 1 0-4h12v4" />
        <path d="M4 6v12a2 2 0 0 0 2 2h14v-4" />
        <path d="M12 12l-4-4" />
        <path d="M12 12l4-4" />
      </svg>
    ),
    getHeadline: () => 'You Earned a Free Month!',
    getDescription: (data) =>
      `${data?.referralName || 'Someone'} just signed up through your link. Your free month of Growth is ready to activate.`,
    cta: 'Activate Free Month',
    secondary: "I'll Decide Later",
  },
};

function UpgradeTrigger({ trigger, isOpen, onClose, data }) {
  const navigate = useNavigate();

  const dismissKey = `${DISMISS_KEY_PREFIX}${trigger}`;

  const wasDismissed = sessionStorage.getItem(dismissKey) === '1';

  const handleDismiss = useCallback(() => {
    sessionStorage.setItem(dismissKey, '1');
    onClose();
  }, [dismissKey, onClose]);

  const handleCTA = useCallback(() => {
    sessionStorage.setItem(dismissKey, '1');
    onClose();
    navigate('/pricing');
  }, [dismissKey, onClose, navigate]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen || wasDismissed) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') handleDismiss();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, wasDismissed, handleDismiss]);

  if (!isOpen || wasDismissed) return null;

  const config = TRIGGER_CONFIG[trigger];
  if (!config) return null;

  return (
    <>
      <style>{keyframes}</style>
      <div
        onClick={handleDismiss}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          animation: 'upgradeFadeIn 0.3s ease-out',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 420,
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 16,
            padding: 32,
            animation: 'upgradeScaleIn 0.3s ease-out',
          }}
        >
          {/* Close button */}
          <button
            onClick={handleDismiss}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'none',
              border: 'none',
              color: theme.textMuted,
              fontSize: 22,
              cursor: 'pointer',
              lineHeight: 1,
              padding: 4,
            }}
          >
            &#x2715;
          </button>

          {/* Icon */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: `${theme.primary}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            {config.icon}
          </div>

          {/* Headline */}
          <h2
            style={{
              color: theme.text,
              fontSize: 22,
              fontWeight: 700,
              margin: '0 0 10px',
              textAlign: 'center',
              paddingRight: 0,
            }}
          >
            {config.getHeadline(data)}
          </h2>

          {/* Description */}
          <p
            style={{
              color: theme.textSecondary,
              fontSize: 15,
              margin: '0 0 28px',
              lineHeight: 1.6,
              textAlign: 'center',
            }}
          >
            {config.getDescription(data)}
          </p>

          {/* Primary CTA */}
          <button
            onClick={handleCTA}
            style={{
              width: '100%',
              padding: '13px 0',
              fontSize: 15,
              fontWeight: 600,
              borderRadius: 10,
              border: 'none',
              backgroundColor: theme.primary,
              color: '#fff',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              marginBottom: 12,
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = theme.primaryHover)}
            onMouseLeave={(e) => (e.target.style.backgroundColor = theme.primary)}
          >
            {config.cta}
          </button>

          {/* Secondary action */}
          <button
            onClick={handleDismiss}
            style={{
              display: 'block',
              width: '100%',
              background: 'none',
              border: 'none',
              color: theme.textMuted,
              fontSize: 14,
              cursor: 'pointer',
              padding: '6px 0',
              textAlign: 'center',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.color = theme.textSecondary)}
            onMouseLeave={(e) => (e.target.style.color = theme.textMuted)}
          >
            {config.secondary}
          </button>
        </div>
      </div>
    </>
  );
}

UpgradeTrigger.propTypes = {
  trigger: PropTypes.oneOf(['machine-limit', 'performance', 'referral-reward']).isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.object,
};

UpgradeTrigger.defaultProps = {
  data: {},
};

export default UpgradeTrigger;
