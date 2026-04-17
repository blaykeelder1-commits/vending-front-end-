import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI, withRetry } from '../services/api';
import { theme, styles } from '../shared/theme';

function GoogleAuthCallback() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      // Implicit flow returns params in URL hash fragment
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const idToken = hashParams.get('id_token');
      const state = hashParams.get('state') || searchParams.get('state');
      const errorParam = hashParams.get('error') || searchParams.get('error');

      if (errorParam) {
        if (errorParam === 'access_denied') {
          setError('Sign-in was cancelled. Tap "Try Again" to retry.');
        } else if (errorParam === 'unauthorized_client' || errorParam === 'invalid_client') {
          setError('Google sign-in is not properly configured. Please contact support.');
        } else {
          setError(`Google sign-in failed (${errorParam}). Tap "Try Again" to retry.`);
        }
        setLoading(false);
        return;
      }

      if (!idToken) {
        setError('No credentials received from Google. Tap "Try Again" to retry.');
        setLoading(false);
        return;
      }

      // Verify state to prevent CSRF
      const savedState = sessionStorage.getItem('google_oauth_state');
      if (state !== savedState) {
        setError('Invalid state parameter. Please try signing in again.');
        setLoading(false);
        return;
      }
      sessionStorage.removeItem('google_oauth_state');
      sessionStorage.removeItem('google_oauth_nonce');

      try {
        // Send id_token to backend (same endpoint as popup flow).
        // Retry silently across transient failures (cold boot / 502-504 / network).
        const result = await withRetry(() => authAPI.vendorGoogleLogin({ credential: idToken }));
        const { token, refreshToken } = result.data.data;

        localStorage.setItem('token', token);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('userType', 'vendor');

        navigate('/vendor/dashboard', { replace: true });
      } catch (err) {
        console.error('Google auth callback error:', err);
        const status = err.response?.status;
        const msg = err.response?.data?.message;
        if (!err.response) {
          setError('Network error - could not reach the server. The server may be starting up, please try again in a moment.');
        } else if (status === 401 || status === 403) {
          setError(msg || 'Google authorization was blocked. The app may need to be configured in Google Cloud Console.');
        } else {
          setError(msg || 'Failed to complete Google sign-in. Please try again.');
        }
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div style={{ ...styles.page, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${theme.border}`, borderTopColor: theme.primary, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: theme.text, fontWeight: '600', marginBottom: '8px' }}>Signing you in...</p>
          <p style={{ color: theme.textMuted, fontSize: '13px' }}>Connecting to server, this may take a moment</p>
        </div>
      </div>
    );
  }

  const handleRetry = () => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const nonce = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    const state = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    sessionStorage.setItem('google_oauth_nonce', nonce);
    sessionStorage.setItem('google_oauth_state', state);
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'id_token');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('nonce', nonce);
    authUrl.searchParams.set('prompt', 'select_account');
    window.location.href = authUrl.toString();
  };

  return (
    <div style={{ ...styles.page, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ ...styles.card, maxWidth: 400, textAlign: 'center' }}>
        <h2 style={{ color: theme.danger, marginBottom: 16 }}>Sign-in Failed</h2>
        <p style={{ color: theme.textSecondary, marginBottom: 24 }}>{error}</p>
        <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
          <button
            onClick={handleRetry}
            style={{ ...styles.button, width: '100%' }}
          >
            Try Again with Google
          </button>
          <button
            onClick={() => navigate('/vendor/login')}
            style={{ ...styles.button, ...styles.buttonSecondary, width: '100%' }}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default GoogleAuthCallback;
