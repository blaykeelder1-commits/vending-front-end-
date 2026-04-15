import React, { useState } from 'react';
import { vendorAPI } from '../services/api';
import { theme } from '../shared/theme';

const CANCEL_REASONS = [
  { key: 'too_expensive', label: 'Too expensive for what I get' },
  { key: 'dont_use_enough', label: "I don't use it enough to justify paying" },
  { key: 'missing_features', label: 'Missing features I need' },
  { key: 'found_alternative', label: 'Found a better alternative' },
  { key: 'business_changed', label: 'My business situation changed' },
  { key: 'dont_understand_features', label: "I don't understand how to use the features" },
];

const RETENTION_REASONS = ['dont_use_enough', 'dont_understand_features'];

function CancelRetentionModal({ isOpen, onClose, onCancelled }) {
  const [step, setStep] = useState('reasons'); // 'reasons' | 'retention' | 'confirming' | 'done'
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [otherText, setOtherText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retentionAccepted, setRetentionAccepted] = useState(false);

  if (!isOpen) return null;

  const toggleReason = (key) => {
    setSelectedReasons(prev =>
      prev.includes(key) ? prev.filter(r => r !== key) : [...prev, key]
    );
  };

  const shouldOfferRetention = selectedReasons.some(r => RETENTION_REASONS.includes(r));

  const handleSubmitReasons = async () => {
    if (selectedReasons.length === 0) return;

    setLoading(true);
    setError('');

    try {
      await vendorAPI.submitCancelFeedback({
        reasons: selectedReasons,
        otherText: otherText || null,
        acceptedRetention: false,
      });

      if (shouldOfferRetention) {
        setStep('retention');
      } else {
        setStep('confirming');
        await performCancel();
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimFreeMonth = async () => {
    setLoading(true);
    setError('');
    try {
      await vendorAPI.submitCancelFeedback({
        reasons: selectedReasons,
        otherText: otherText || null,
        acceptedRetention: true,
      });
      setRetentionAccepted(true);
      setStep('done');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const performCancel = async () => {
    try {
      await vendorAPI.cancelSubscription();
      setStep('done');
      if (onCancelled) onCancelled();
    } catch (err) {
      setError('Failed to cancel subscription. Please contact support.');
      setStep('reasons');
    }
  };

  const handleContinueToCancel = async () => {
    setLoading(true);
    setStep('confirming');
    await performCancel();
    setLoading(false);
  };

  const handleClose = () => {
    setStep('reasons');
    setSelectedReasons([]);
    setOtherText('');
    setError('');
    setRetentionAccepted(false);
    onClose();
  };

  return (
    <div
      onClick={loading || step === 'confirming' ? undefined : handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          backgroundColor: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 16, padding: 32,
          position: 'relative',
        }}
      >
        {/* Close */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute', top: 12, right: 12,
            background: 'none', border: 'none',
            color: theme.textMuted, fontSize: 22, cursor: 'pointer',
          }}
        >&#x2715;</button>

        {step === 'reasons' && (
          <>
            <h2 style={{ color: theme.text, fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>
              We're sorry to see you go
            </h2>
            <p style={{ color: theme.textSecondary, fontSize: 14, margin: '0 0 20px', lineHeight: 1.6 }}>
              Help us understand why so we can improve.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {CANCEL_REASONS.map(reason => (
                <label
                  key={reason.key}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                    backgroundColor: selectedReasons.includes(reason.key) ? `${theme.primary}15` : 'transparent',
                    border: `1px solid ${selectedReasons.includes(reason.key) ? theme.primary : theme.border}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedReasons.includes(reason.key)}
                    onChange={() => toggleReason(reason.key)}
                    style={{ accentColor: theme.primary }}
                  />
                  <span style={{ color: theme.text, fontSize: 14 }}>{reason.label}</span>
                </label>
              ))}

              {/* Other */}
              <label style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px 12px', borderRadius: 8,
                border: `1px solid ${theme.border}`,
              }}>
                <input
                  type="checkbox"
                  checked={selectedReasons.includes('other')}
                  onChange={() => toggleReason('other')}
                  style={{ accentColor: theme.primary, marginTop: 2 }}
                />
                <div style={{ flex: 1 }}>
                  <span style={{ color: theme.text, fontSize: 14 }}>Other</span>
                  {selectedReasons.includes('other') && (
                    <textarea
                      value={otherText}
                      onChange={e => setOtherText(e.target.value)}
                      placeholder="Tell us more..."
                      style={{
                        width: '100%', marginTop: 8, padding: 8, borderRadius: 6,
                        backgroundColor: theme.bg, color: theme.text,
                        border: `1px solid ${theme.border}`, fontSize: 13,
                        resize: 'vertical', minHeight: 60,
                      }}
                    />
                  )}
                </div>
              </label>
            </div>

            {error && <p style={{ color: theme.danger, fontSize: 13, marginBottom: 12 }}>{error}</p>}

            <button
              onClick={handleSubmitReasons}
              disabled={loading || selectedReasons.length === 0}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 8,
                border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                backgroundColor: selectedReasons.length > 0 ? theme.danger : theme.border,
                color: '#fff',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Processing...' : 'Continue'}
            </button>
          </>
        )}

        {step === 'retention' && (
          <>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              backgroundColor: `${theme.success}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: 28,
            }}>
              {'\uD83C\uDF81'}
            </div>
            <h2 style={{ color: theme.text, fontSize: 20, fontWeight: 700, margin: '0 0 8px', textAlign: 'center' }}>
              How about a free month on us?
            </h2>
            <p style={{ color: theme.textSecondary, fontSize: 14, margin: '0 0 24px', lineHeight: 1.6, textAlign: 'center' }}>
              We'd love to give you more time to explore everything IDDI can do for your operation.
              Your next billing cycle will be skipped — no charge, no strings attached.
            </p>

            {error && <p style={{ color: theme.danger, fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>}

            <button
              onClick={handleClaimFreeMonth}
              disabled={loading}
              style={{
                width: '100%', padding: '13px 0', borderRadius: 8,
                border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                backgroundColor: theme.success, color: '#fff',
                marginBottom: 12, opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Activating...' : 'Claim Free Month'}
            </button>

            <button
              onClick={handleContinueToCancel}
              disabled={loading}
              style={{
                display: 'block', width: '100%',
                background: 'none', border: 'none',
                color: theme.textMuted, fontSize: 14, cursor: 'pointer',
                padding: '6px 0', textAlign: 'center',
              }}
            >
              No thanks, continue to cancel
            </button>
          </>
        )}

        {step === 'confirming' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div className="spinner" style={{
              width: 36, height: 36,
              border: `3px solid ${theme.border}`,
              borderTopColor: theme.primary,
              borderRadius: '50%',
              margin: '0 auto 16px',
            }} />
            <p style={{ color: theme.textSecondary }}>Cancelling your subscription...</p>
          </div>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>
              {retentionAccepted ? '\u2705' : '\uD83D\uDC4B'}
            </div>
            <h2 style={{ color: theme.text, fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>
              {retentionAccepted ? 'Free Month Claimed!' : 'Subscription Cancelled'}
            </h2>
            <p style={{ color: theme.textSecondary, fontSize: 14, margin: '0 0 20px', lineHeight: 1.6 }}>
              {retentionAccepted
                ? 'Your billing is paused for one month. Explore everything IDDI has to offer!'
                : 'Thank you for your feedback. You can continue using the free plan.'}
            </p>
            <button
              onClick={handleClose}
              style={{
                padding: '10px 24px', borderRadius: 8,
                border: `1px solid ${theme.border}`,
                background: 'none', color: theme.text,
                fontSize: 14, cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CancelRetentionModal;
