import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { publicAPI } from '../services/api';

const STORAGE_KEY = 'exit_intent_shown';
const MOBILE_DELAY_MS = 45000;

const theme = {
  bg: '#0d0d1a',
  surface: '#1a1a2e',
  border: '#2a2a4a',
  primary: '#7c6df0',
  primaryHover: '#6b5ce0',
  success: '#34d399',
  text: '#f0f0f5',
  textSecondary: '#9d9db5',
  textMuted: '#6b6b85',
};

const keyframes = `
@keyframes exitPopupFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes exitPopupSlideUp {
  from { opacity: 0; transform: translateY(40px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
`;

function isMobile() {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent
  );
}

function ExitIntentPopup({ headline, description, leadMagnet, source }) {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const hasTriggered = useRef(false);

  const show = useCallback(() => {
    if (hasTriggered.current) return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    hasTriggered.current = true;
    sessionStorage.setItem(STORAGE_KEY, '1');
    setVisible(true);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
  }, []);

  // Desktop: mouseleave on document
  useEffect(() => {
    if (isMobile()) return;

    const handleMouseLeave = (e) => {
      if (e.clientY <= 0) {
        show();
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [show]);

  // Mobile: timer
  useEffect(() => {
    if (!isMobile()) return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const timer = setTimeout(show, MOBILE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || status === 'submitting') return;

    setStatus('submitting');
    setErrorMsg('');

    try {
      await publicAPI.captureLead({ email: email.trim(), source, leadMagnet });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(
        err?.response?.data?.error || 'Something went wrong. Please try again.'
      );
    }
  };

  if (!visible) return null;

  return (
    <>
      <style>{keyframes}</style>
      <div
        onClick={dismiss}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          animation: 'exitPopupFadeIn 0.3s ease-out',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 480,
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 16,
            padding: 32,
            animation: 'exitPopupSlideUp 0.35s ease-out',
          }}
        >
          {/* Dismiss button */}
          <button
            onClick={dismiss}
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

          {status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(52,211,153,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={theme.success}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2
                style={{
                  color: theme.text,
                  fontSize: 22,
                  fontWeight: 700,
                  margin: '0 0 8px',
                }}
              >
                You're in!
              </h2>
              <p
                style={{
                  color: theme.textSecondary,
                  fontSize: 15,
                  margin: 0,
                }}
              >
                Check your inbox.
              </p>
            </div>
          ) : (
            <>
              <h2
                style={{
                  color: theme.text,
                  fontSize: 22,
                  fontWeight: 700,
                  margin: '0 0 8px',
                  paddingRight: 24,
                }}
              >
                {headline}
              </h2>
              <p
                style={{
                  color: theme.textSecondary,
                  fontSize: 15,
                  margin: '0 0 24px',
                  lineHeight: 1.5,
                }}
              >
                {description}
              </p>

              <form onSubmit={handleSubmit}>
                <input
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: 15,
                    borderRadius: 10,
                    border: `1px solid ${theme.border}`,
                    backgroundColor: theme.bg,
                    color: theme.text,
                    outline: 'none',
                    boxSizing: 'border-box',
                    marginBottom: 12,
                  }}
                />

                {status === 'error' && (
                  <p
                    style={{
                      color: '#f87171',
                      fontSize: 13,
                      margin: '0 0 12px',
                    }}
                  >
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    fontSize: 15,
                    fontWeight: 600,
                    borderRadius: 10,
                    border: 'none',
                    backgroundColor:
                      status === 'submitting'
                        ? theme.textMuted
                        : theme.primary,
                    color: '#fff',
                    cursor:
                      status === 'submitting' ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                >
                  {status === 'submitting' ? 'Sending...' : 'Get Access'}
                </button>
              </form>

              <p
                style={{
                  color: theme.textMuted,
                  fontSize: 12,
                  textAlign: 'center',
                  margin: '14px 0 0',
                }}
              >
                No spam. Unsubscribe anytime.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}

ExitIntentPopup.propTypes = {
  headline: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  leadMagnet: PropTypes.string.isRequired,
  source: PropTypes.string.isRequired,
};

export default ExitIntentPopup;
