import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI, withRetry } from '../services/api';
import { theme, styles, useIsMobile } from '../shared/theme';

function VendorLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [useRedirectFlow, setUseRedirectFlow] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);
  const isMobile = useIsMobile();

  // Login card styles — premium feel with breathing room
  const loginCardStyle = {
    ...styles.card,
    width: '100%',
    maxWidth: '400px',
    margin: isMobile ? '0 auto' : '0 auto',
    padding: isMobile ? '24px 20px' : '32px',
    boxShadow: '0 8px 32px rgba(124, 109, 240, 0.08), 0 2px 8px rgba(0, 0, 0, 0.3)',
    borderRadius: '12px',
  };

  const pageStyle = {
    ...styles.page,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: isMobile ? '16px' : '16px',
  };

  // Detect in-app browsers (WebViews) that Google blocks for OAuth
  // and mobile browsers that need redirect-based OAuth
  useEffect(() => {
    const ua = navigator.userAgent;
    // Detect in-app browsers / WebViews where Google blocks OAuth
    const inApp = /FBAN|FBAV|Instagram|Twitter|Line|KAKAOTALK|naver|snapchat|CriOS.*GSA|GSA\/|LinkedIn/i.test(ua) ||
      (/iPhone|iPad|iPod/.test(ua) && !/Safari/i.test(ua)) ||
      (/Android/.test(ua) && /wv|WebView/i.test(ua)) ||
      /\.app$/i.test(ua);
    setIsInAppBrowser(inApp);

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
      (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
    const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(ua) ||
      (/iPad|iPhone|iPod/.test(ua) && !window.MSStream);
    setUseRedirectFlow(isMobile || isSafariBrowser);
  }, []);

  const handleGoogleCallback = useCallback(async (response) => {
    setError('');
    setGoogleLoading(true);
    try {
      const result = await withRetry(() => authAPI.vendorGoogleLogin({ credential: response.credential }));
      const { token, refreshToken } = result.data.data;
      localStorage.setItem('token', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userType', 'vendor');
      navigate('/vendor/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  }, [navigate]);

  // Handle mobile/Safari redirect-based Google Sign-In (implicit flow)
  const handleMobileGoogleSignIn = () => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const scope = 'openid email profile';
    const nonce = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    const state = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);

    // Store nonce and state for verification
    sessionStorage.setItem('google_oauth_nonce', nonce);
    sessionStorage.setItem('google_oauth_state', state);

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'id_token');
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('nonce', nonce);
    authUrl.searchParams.set('prompt', 'select_account');

    window.location.href = authUrl.toString();
  };

  // Initialize Google Sign-In (for non-Safari browsers)
  useEffect(() => {
    // Skip GIS initialization for Safari - we use redirect flow instead
    if (useRedirectFlow) {
      return;
    }

    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === 'your_google_client_id_here') {
      setGoogleError('Google Sign-In not configured');
      return;
    }

    const initializeGoogleSignIn = () => {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCallback,
        });
        if (googleButtonRef.current) {
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: 'filled_black',
            size: 'large',
            width: '100%',
            text: 'continue_with',
          });
        }
        setGoogleError('');
      } catch (err) {
        console.error('Google Sign-In init failed:', err);
        setGoogleError('Google Sign-In failed to initialize');
      }
    };

    if (window.google) {
      initializeGoogleSignIn();
    } else {
      // Use load event listener instead of polling for faster detection
      const scriptEl = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (scriptEl) {
        const onLoad = () => initializeGoogleSignIn();
        const onError = () => setGoogleError('Google Sign-In failed to load. Check your connection.');
        scriptEl.addEventListener('load', onLoad);
        scriptEl.addEventListener('error', onError);
        return () => {
          scriptEl.removeEventListener('load', onLoad);
          scriptEl.removeEventListener('error', onError);
        };
      } else {
        setGoogleError('Google Sign-In script not found.');
      }
    }
  }, [handleGoogleCallback, useRedirectFlow]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = isLogin ? { email, password } : { email, password, fullName };

      if (isLogin) {
        const response = await withRetry(() => authAPI.vendorLogin(data));
        const { token, refreshToken } = response.data.data;
        localStorage.setItem('token', token);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('userType', 'vendor');
        navigate('/vendor/dashboard');
      } else {
        // Registration - redirect to email verification
        const response = await withRetry(() => authAPI.vendorRegister(data));
        const { emailSent, verificationCode: code } = response.data.data;
        // Build verify URL with email; include code if email wasn't delivered
        let verifyUrl = `/vendor/verify-email?email=${encodeURIComponent(email)}`;
        if (!emailSent && code) {
          verifyUrl += `&code=${code}`;
        }
        navigate(verifyUrl);
      }
    } catch (err) {
      const errorCode = err.response?.data?.code;
      const errorEmail = err.response?.data?.data?.email;

      if (!err.response) {
        setError('Unable to reach the server. Please check your connection and try again.');
      } else if (errorCode === 'EMAIL_NOT_VERIFIED') {
        setNeedsVerification(true);
        setEmail(errorEmail || email);
      } else {
        setError(err.response?.data?.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoToVerification = () => {
    navigate(`/vendor/verify-email?email=${encodeURIComponent(email)}`);
  };

  // Show verification needed message
  if (needsVerification) {
    return (
      <div style={pageStyle}>
        <div style={{ ...loginCardStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#128231;</div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>Email Not Verified</h1>
          <p style={{ color: theme.textSecondary, margin: '0 0 24px 0' }}>
            Please verify your email address before logging in.
          </p>
          <button
            onClick={handleGoToVerification}
            style={{ ...styles.button, width: '100%', minHeight: '48px' }}
          >
            Go to Verification
          </button>
          <button
            onClick={() => setNeedsVerification(false)}
            style={{ ...styles.button, ...styles.buttonSecondary, width: '100%', marginTop: '12px', minHeight: '48px' }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={loginCardStyle}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px' }}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p style={{ color: theme.textSecondary, margin: '0 0 24px 0' }}>
          {isLogin ? 'Sign in to manage your vending machines' : 'Start managing your vending business'}
        </p>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: '16px' }}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={styles.input}
                placeholder="John Doe"
                required
              />
            </div>
          )}
          <div style={{ marginBottom: '16px' }}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="you@example.com"
              required
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div style={{
              color: theme.danger,
              marginBottom: '16px',
              fontSize: '14px',
              padding: '12px',
              backgroundColor: theme.danger + '10',
              borderRadius: '8px',
              border: `1px solid ${theme.danger}30`,
            }}>
              {error}
            </div>
          )}

          <button type="submit" style={{ ...styles.button, width: '100%', minHeight: '48px', fontSize: '15px' }} disabled={loading || googleLoading}>
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '28px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: theme.border }}></div>
          <span style={{ padding: '0 20px', color: theme.textMuted, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>or continue with</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: theme.border }}></div>
        </div>

        {/* In-app browser warning */}
        {isInAppBrowser && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: theme.warning + '20',
            border: `1px solid ${theme.warning}`,
            borderRadius: '8px',
            marginBottom: '16px',
            textAlign: 'center',
          }}>
            <p style={{ color: theme.warning, fontSize: '13px', fontWeight: '600', margin: '0 0 8px 0' }}>
              Google Sign-In requires a full browser
            </p>
            <p style={{ color: theme.textSecondary, fontSize: '12px', margin: '0 0 10px 0' }}>
              Tap the button below to copy the link, then paste it in Safari or Chrome.
            </p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin + '/vendor/login').then(() => {
                  setError('');
                  setGoogleError('Link copied! Open Safari or Chrome and paste it.');
                }).catch(() => {
                  setGoogleError(`Open this URL in your browser: ${window.location.origin}`);
                });
              }}
              style={{
                padding: '10px 20px',
                minHeight: '44px',
                backgroundColor: theme.warning,
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Copy Link
            </button>
          </div>
        )}

        {/* Google Sign-In Button */}
        {process.env.REACT_APP_GOOGLE_CLIENT_ID && process.env.REACT_APP_GOOGLE_CLIENT_ID !== 'your_google_client_id_here' ? (
          <div style={{ position: 'relative' }}>
            {/* Mobile uses redirect flow, desktop uses GIS popup */}
            {useRedirectFlow ? (
              <button
                type="button"
                onClick={handleMobileGoogleSignIn}
                disabled={googleLoading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  minHeight: '48px',
                  backgroundColor: '#fff',
                  border: '1px solid #dadce0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#3c4043',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {googleLoading ? 'Signing in...' : 'Continue with Google'}
              </button>
            ) : (
              <div ref={googleButtonRef} style={{ width: '100%' }}></div>
            )}
            {googleLoading && !useRedirectFlow && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
              }}>
                <span style={{ color: 'white', fontSize: '14px' }}>Signing in...</span>
              </div>
            )}
            {googleError && (
              <p style={{ color: theme.warning, fontSize: '13px', margin: '8px 0 0 0', textAlign: 'center' }}>
                {googleError}
              </p>
            )}
          </div>
        ) : (
          <button
            disabled
            style={{
              ...styles.button,
              ...styles.buttonSecondary,
              width: '100%',
              minHeight: '48px',
              opacity: 0.5,
              cursor: 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google Sign-In (Not configured)
          </button>
        )}

        {isLogin && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link to="/vendor/forgot-password" style={{ ...styles.link, fontSize: '14px', padding: '8px', display: 'inline-block' }}>
              Forgot your password?
            </Link>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{
              background: 'none',
              border: 'none',
              color: theme.primary,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              padding: '12px 16px',
              minHeight: '44px',
              borderRadius: '6px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.primary + '15'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: `1px solid ${theme.border}`,
        }}>
          <Link to="/" style={{
            ...styles.link,
            fontSize: '14px',
            fontWeight: '500',
            padding: '10px 16px',
            display: 'inline-block',
            borderRadius: '6px',
            transition: 'background-color 0.2s',
          }}>&#8592; Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...styles.card, width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#128236;</div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>Check Your Email</h1>
          <p style={{ color: theme.textSecondary, margin: '0 0 24px 0' }}>
            If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
          </p>
          <p style={{ color: theme.textMuted, fontSize: '14px', marginBottom: '24px' }}>
            The link will expire in 1 hour. Check your spam folder if you don't see it.
          </p>
          <Link to="/vendor/login" style={{ ...styles.button, display: 'inline-block', textDecoration: 'none' }}>
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...styles.card, width: '100%', maxWidth: '400px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>Forgot Password?</h1>
        <p style={{ color: theme.textSecondary, margin: '0 0 24px 0' }}>
          Enter your email and we'll send you a reset link.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>

          {error && (
            <div style={{ color: theme.danger, marginBottom: '16px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <button type="submit" style={{ ...styles.button, width: '100%' }} disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link to="/vendor/login" style={styles.link}>&#8592; Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword({ token, password });
      setSuccess(true);
    } catch (err) {
      const errorCode = err.response?.data?.code;
      if (errorCode === 'INVALID_TOKEN') {
        setError('This reset link has expired or is invalid. Please request a new one.');
      } else {
        setError(err.response?.data?.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...styles.card, width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#9888;&#65039;</div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>Invalid Link</h1>
          <p style={{ color: theme.textSecondary, margin: '0 0 24px 0' }}>
            This password reset link is invalid or has been used.
          </p>
          <Link to="/vendor/forgot-password" style={{ ...styles.button, display: 'inline-block', textDecoration: 'none' }}>
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...styles.card, width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#9989;</div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>Password Reset!</h1>
          <p style={{ color: theme.textSecondary, margin: '0 0 24px 0' }}>
            Your password has been successfully changed.
          </p>
          <button
            onClick={() => navigate('/vendor/login')}
            style={{ ...styles.button, width: '100%' }}
          >
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...styles.card, width: '100%', maxWidth: '400px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>Set New Password</h1>
        <p style={{ color: theme.textSecondary, margin: '0 0 24px 0' }}>
          Choose a strong password for your account.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={styles.label}>New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              required
              minLength={6}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div style={{
              color: theme.danger,
              marginBottom: '16px',
              fontSize: '14px',
              padding: '12px',
              backgroundColor: theme.danger + '10',
              borderRadius: '8px',
            }}>
              {error}
            </div>
          )}

          <button type="submit" style={{ ...styles.button, width: '100%' }} disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link to="/vendor/login" style={styles.link}>&#8592; Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

export function EmailVerification() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const fallbackCode = searchParams.get('code') || '';
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const response = await authAPI.verifyEmail({ email, code });
      const { token, refreshToken } = response.data.data;
      localStorage.setItem('token', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userType', 'vendor');
      navigate('/vendor/dashboard');
    } catch (err) {
      const errorCode = err.response?.data?.code;
      if (errorCode === 'CODE_EXPIRED') {
        setError('Code expired. Please request a new one.');
      } else {
        setError(err.response?.data?.message || 'Verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const [resendCode, setResendCode] = useState('');

  const handleResend = async () => {
    setResending(true);
    setError('');
    setSuccess('');
    setResendCode('');
    try {
      const response = await authAPI.resendVerification({ email });
      const data = response.data;
      if (data.verificationCode) {
        setResendCode(data.verificationCode);
        setSuccess('New code generated. Enter it below.');
      } else {
        setSuccess('A new verification code has been sent to your email.');
      }
      setCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  return (
    <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...styles.card, width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#128231;</div>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>Verify Your Email</h1>
        <p style={{ color: theme.textSecondary, margin: '0 0 8px 0' }}>
          {fallbackCode ? 'Enter the verification code below to activate your account:' : 'We sent a 6-digit code to:'}
        </p>
        {!fallbackCode && <p style={{ fontWeight: 'bold', marginBottom: '24px' }}>{email}</p>}

        {fallbackCode && (
          <div style={{
            background: '#F3F4F6',
            border: `2px solid ${theme.primary}`,
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
          }}>
            <p style={{ color: theme.textSecondary, fontSize: '13px', margin: '0 0 8px 0' }}>
              Your verification code:
            </p>
            <div style={{
              fontSize: 'clamp(24px, 6vw, 32px)',
              fontWeight: 'bold',
              color: theme.primary,
              letterSpacing: '8px',
              fontFamily: 'monospace',
            }}>
              {fallbackCode}
            </div>
            <p style={{ color: theme.textSecondary, fontSize: '12px', margin: '8px 0 0 0' }}>
              Email delivery is being set up. Copy and paste this code below.
            </p>
          </div>
        )}

        <form onSubmit={handleVerify}>
          <div style={{ marginBottom: '24px' }}>
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              style={{
                ...styles.input,
                fontSize: '32px',
                textAlign: 'center',
                letterSpacing: '8px',
                fontFamily: 'monospace',
              }}
              placeholder="000000"
              maxLength={6}
              autoFocus
            />
          </div>

          {error && (
            <div style={{
              color: theme.danger,
              marginBottom: '16px',
              fontSize: '14px',
              padding: '12px',
              backgroundColor: theme.danger + '10',
              borderRadius: '8px',
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              color: theme.success,
              marginBottom: '16px',
              fontSize: '14px',
              padding: '12px',
              backgroundColor: theme.success + '10',
              borderRadius: '8px',
            }}>
              {success}
            </div>
          )}

          {resendCode && (
            <div style={{
              background: '#F3F4F6',
              border: `2px solid ${theme.primary}`,
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
            }}>
              <div style={{
                fontSize: 'clamp(24px, 6vw, 32px)',
                fontWeight: 'bold',
                color: theme.primary,
                letterSpacing: '8px',
                fontFamily: 'monospace',
              }}>
                {resendCode}
              </div>
            </div>
          )}

          <button
            type="submit"
            style={{ ...styles.button, width: '100%' }}
            disabled={loading || code.length !== 6}
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: `1px solid ${theme.border}` }}>
          <p style={{ color: theme.textSecondary, fontSize: '14px', marginBottom: '12px' }}>
            Didn't receive the code?
          </p>
          <button
            onClick={handleResend}
            disabled={resending}
            style={{
              background: 'none',
              border: 'none',
              color: theme.primary,
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            {resending ? 'Sending...' : 'Resend Code'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link to="/vendor/login" style={styles.link}>&#8592; Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

export { VendorLogin };
export default VendorLogin;
