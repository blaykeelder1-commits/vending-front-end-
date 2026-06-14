import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { publicAPI } from '../services/api';

const theme = {
  bg: '#0a0e12',
  surface: '#121821',
  border: '#27323f',
  primary: '#0c8a7e',
  primaryHover: '#0a7368',
  success: '#22c55e',
  error: '#ef4444',
  text: '#eef2f4',
  textSecondary: '#9fb0bb',
  textMuted: '#677884',
};

function LeadCapture({ headline, description, leadMagnet, source, style = {} }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [errorMessage, setErrorMessage] = useState('');

  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source') || source;
  const utmMedium = params.get('utm_medium') || '';
  const utmCampaign = params.get('utm_campaign') || '';

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmed = email.trim();
    if (!trimmed) return;

    setStatus('submitting');
    setErrorMessage('');

    try {
      await publicAPI.captureLead({
        email: trimmed,
        source,
        leadMagnet,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
      });
      setStatus('success');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.'
      );
    }
  };

  if (status === 'success') {
    return (
      <div style={{ ...styles.container, ...style }}>
        <div style={styles.successWrapper}>
          <span style={styles.successIcon}>✓</span>
          <h3 style={styles.successHeadline}>Check your inbox!</h3>
          <p style={styles.successDescription}>
            We sent your <strong style={{ color: theme.text }}>{leadMagnet}</strong> to{' '}
            <strong style={{ color: theme.text }}>{email || 'your email'}</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.container, ...style }}>
      <h3 style={styles.headline}>{headline}</h3>
      {description && <p style={styles.description}>{description}</p>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'submitting'}
          style={styles.input}
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          style={{
            ...styles.button,
            opacity: status === 'submitting' ? 0.7 : 1,
            cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
          }}
        >
          {status === 'submitting' ? 'Sending...' : `Get ${leadMagnet}`}
        </button>
      </form>

      {status === 'error' && (
        <p style={styles.errorText}>{errorMessage}</p>
      )}

      <p style={styles.privacyNote}>No spam, ever. Unsubscribe anytime.</p>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: 12,
    padding: '32px 28px',
    maxWidth: 560,
    width: '100%',
    boxSizing: 'border-box',
  },
  headline: {
    margin: '0 0 8px',
    fontSize: 22,
    fontWeight: 700,
    color: theme.text,
    lineHeight: 1.3,
  },
  description: {
    margin: '0 0 20px',
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 1.5,
  },
  form: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
  },
  input: {
    flex: '1 1 220px',
    minWidth: 0,
    padding: '12px 14px',
    fontSize: 15,
    color: theme.text,
    backgroundColor: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    outline: 'none',
    boxSizing: 'border-box',
  },
  button: {
    flex: '0 0 auto',
    padding: '12px 24px',
    fontSize: 15,
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: theme.primary,
    border: 'none',
    borderRadius: 8,
    whiteSpace: 'nowrap',
  },
  errorText: {
    margin: '12px 0 0',
    fontSize: 14,
    color: theme.error,
  },
  privacyNote: {
    margin: '14px 0 0',
    fontSize: 13,
    color: theme.textMuted,
  },
  successWrapper: {
    textAlign: 'center',
    padding: '8px 0',
  },
  successIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: '50%',
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    color: theme.success,
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 12,
  },
  successHeadline: {
    margin: '0 0 8px',
    fontSize: 20,
    fontWeight: 700,
    color: theme.success,
  },
  successDescription: {
    margin: 0,
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 1.5,
  },
};

LeadCapture.propTypes = {
  headline: PropTypes.string.isRequired,
  description: PropTypes.string,
  leadMagnet: PropTypes.string.isRequired,
  source: PropTypes.string.isRequired,
  style: PropTypes.object,
};

export default LeadCapture;
