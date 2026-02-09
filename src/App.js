import React, { useState, useEffect, useRef, useContext, createContext, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { authAPI, vendorAPI, customerAPI, publicAPI } from './services/api';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL || window.location.origin;

// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================
const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error', 4000),
    info: (msg) => addToast(msg, 'info'),
    warning: (msg) => addToast(msg, 'warning'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts }) {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
}

function Toast({ message, type }) {
  const colors = {
    success: { bg: '#22c55e20', border: '#22c55e', text: '#22c55e' },
    error: { bg: '#ef444420', border: '#ef4444', text: '#ef4444' },
    info: { bg: '#8b5cf620', border: '#8b5cf6', text: '#8b5cf6' },
    warning: { bg: '#f59e0b20', border: '#f59e0b', text: '#f59e0b' },
  };
  const color = colors[type] || colors.info;

  return (
    <div style={{
      padding: '12px 20px',
      backgroundColor: '#1a1a1a',
      border: `1px solid ${color.border}`,
      borderLeft: `4px solid ${color.border}`,
      borderRadius: '8px',
      color: color.text,
      minWidth: '280px',
      maxWidth: '400px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      animation: 'slideIn 0.3s ease-out',
    }}>
      {message}
    </div>
  );
}

// ============================================
// THEME / STYLES
// ============================================
const theme = {
  bg: '#0f0f0f',
  surface: '#1a1a1a',
  surfaceHover: '#252525',
  border: '#2a2a2a',
  primary: '#8b5cf6',
  primaryHover: '#7c3aed',
  secondary: '#06b6d4', // Cyan color for discovery polls
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
  text: '#ffffff',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
};

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: theme.bg,
    color: theme.text,
    padding: '16px',
    maxWidth: '100vw',
    overflowX: 'hidden',
  },
  card: {
    backgroundColor: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: '12px',
    padding: '16px',
  },
  button: {
    padding: '10px 16px',
    backgroundColor: theme.primary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s',
    fontSize: '14px',
    whiteSpace: 'nowrap',
  },
  buttonSuccess: {
    backgroundColor: theme.success,
  },
  buttonDanger: {
    backgroundColor: theme.danger,
  },
  buttonSecondary: {
    backgroundColor: theme.surfaceHover,
    border: `1px solid ${theme.border}`,
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    color: theme.text,
    fontSize: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: theme.textSecondary,
    fontSize: '14px',
  },
  link: {
    color: theme.primary,
    textDecoration: 'none',
  },
};

// ============================================
// MOBILE NAVIGATION COMPONENT
// ============================================

function MobileNav({ isOpen, onClose, onLogout }) {
  const location = useLocation();

  // Close nav when route changes
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  // Prevent body scroll when nav is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const navLinks = [
    { to: '/vendor/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/vendor/analytics', label: 'Analytics', icon: '📈' },
    { to: '/vendor/route-plan', label: 'Route Plan', icon: '📋' },
    { to: '/vendor/suggestions', label: 'Suggestions', icon: '💡' },
    { to: '/vendor/expiring', label: 'Expiring', icon: '⏰' },
    { to: '/vendor/poll-summary', label: 'Polls', icon: '📊' },
    { to: '/vendor/top-products', label: 'Top 50', icon: '🏆' },
  ];

  return (
    <div
      className={`mobile-nav ${isOpen ? 'open' : ''}`}
      role="navigation"
      aria-hidden={!isOpen}
    >
      <div className="mobile-nav-links">
        {navLinks.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={location.pathname === link.to ? 'active' : ''}
            onClick={onClose}
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        ))}
        <hr style={{ border: 'none', borderTop: '1px solid #2a2a2a', margin: '16px 0' }} />
        <button onClick={() => { onLogout(); onClose(); }}>
          <span>🚪</span>
          Logout
        </button>
      </div>
    </div>
  );
}

function MobileMenuButton({ isOpen, onClick }) {
  return (
    <button
      className={`mobile-menu-btn ${isOpen ? 'open' : ''}`}
      onClick={onClick}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
    >
      <span></span>
      <span></span>
      <span></span>
    </button>
  );
}

// Custom hook for responsive detection
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Format time ago for visit display
function formatTimeAgo(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 30) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else if (diffDays > 0) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffMins > 0) {
    return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
  } else {
    return 'Just now';
  }
}

// ============================================
// VENDOR COMPONENTS
// ============================================

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
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);

  // Detect mobile browsers and Safari that need redirect-based OAuth
  // Mobile browsers block Google's popup sign-in flow
  useEffect(() => {
    const ua = navigator.userAgent;
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
      const result = await authAPI.vendorGoogleLogin({ credential: response.credential });
      const { token, refreshToken } = result.data.data;
      localStorage.setItem('token', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userType', 'vendor');
      navigate('/vendor/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-in failed');
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
        const response = await authAPI.vendorLogin(data);
        const { token, refreshToken } = response.data.data;
        localStorage.setItem('token', token);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('userType', 'vendor');
        navigate('/vendor/dashboard');
      } else {
        // Registration - redirect to email verification
        const response = await authAPI.vendorRegister(data);
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

      if (errorCode === 'EMAIL_NOT_VERIFIED') {
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
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...styles.card, width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>Email Not Verified</h1>
          <p style={{ color: theme.textSecondary, margin: '0 0 24px 0' }}>
            Please verify your email address before logging in.
          </p>
          <button
            onClick={handleGoToVerification}
            style={{ ...styles.button, width: '100%' }}
          >
            Go to Verification
          </button>
          <button
            onClick={() => setNeedsVerification(false)}
            style={{ ...styles.button, ...styles.buttonSecondary, width: '100%', marginTop: '12px' }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...styles.card, width: '100%', maxWidth: '400px' }}>
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
          <div style={{ marginBottom: '24px' }}>
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
            <div style={{ color: theme.danger, marginBottom: '16px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <button type="submit" style={{ ...styles.button, width: '100%' }} disabled={loading || googleLoading}>
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: theme.border }}></div>
          <span style={{ padding: '0 16px', color: theme.textMuted, fontSize: '14px' }}>or continue with</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: theme.border }}></div>
        </div>

        {/* Google Sign-In Button */}
        {process.env.REACT_APP_GOOGLE_CLIENT_ID && process.env.REACT_APP_GOOGLE_CLIENT_ID !== 'your_google_client_id_here' ? (
          <div style={{ position: 'relative' }}>
            {/* Safari/iOS uses redirect flow due to third-party cookie restrictions */}
            {useRedirectFlow ? (
              <button
                type="button"
                onClick={handleMobileGoogleSignIn}
                disabled={googleLoading}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  backgroundColor: '#fff',
                  border: '1px solid #dadce0',
                  borderRadius: '4px',
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
                borderRadius: '4px',
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
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Link to="/vendor/forgot-password" style={{ ...styles.link, fontSize: '14px' }}>
              Forgot your password?
            </Link>
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: '16px', color: theme.textSecondary }}>
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: 'none', border: 'none', color: theme.primary, cursor: 'pointer' }}
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </p>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Link to="/" style={styles.link}>← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

function ForgotPassword() {
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
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📬</div>
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
          <Link to="/vendor/login" style={styles.link}>← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

function ResetPassword() {
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
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
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
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
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
          <Link to="/vendor/login" style={styles.link}>← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

function EmailVerification() {
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
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
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
          <Link to="/vendor/login" style={styles.link}>← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

function VendorDashboard() {
  const [machines, setMachines] = useState([]);
  const [products, setProducts] = useState([]);
  const [showMachineForm, setShowMachineForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expiringCount, setExpiringCount] = useState(0);
  const [pendingSuggestions, setPendingSuggestions] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      const [machinesRes, productsRes, expiringRes, suggestionsRes] = await Promise.allSettled([
        vendorAPI.getMachines(),
        vendorAPI.getProducts(),
        vendorAPI.getExpiringProducts(14),
        vendorAPI.getSuggestions({ status: 'pending' })
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
      }
      if (suggestionsRes.status === 'fulfilled') {
        const suggestions = suggestionsRes.value?.data?.data?.suggestions || [];
        setPendingSuggestions(suggestions.length);
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

  return (
    <div style={styles.page}>
      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNav
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          onLogout={handleLogout}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 'clamp(20px, 5vw, 28px)' }}>Dashboard</h1>
            <p style={{ color: theme.textSecondary, margin: '4px 0 0 0', fontSize: '14px' }}>
              Manage your vending machines and products
            </p>
          </div>
          {isMobile && (
            <MobileMenuButton
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          )}
        </div>

        {/* Desktop Navigation - hidden on mobile */}
        {!isMobile && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: '8px',
            maxWidth: '100%'
          }}>
            <Link to="/vendor/analytics" style={{ ...styles.button, ...styles.buttonSecondary, textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              📈 Analytics
            </Link>
            <Link to="/vendor/route-plan" style={{ ...styles.button, ...styles.buttonSecondary, textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              📋 Route Plan
            </Link>
            <Link to="/vendor/suggestions" style={{ ...styles.button, ...styles.buttonSecondary, textDecoration: 'none', position: 'relative', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              💡 Suggestions
              {pendingSuggestions > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  backgroundColor: theme.danger,
                  color: 'white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>{pendingSuggestions}</span>
              )}
            </Link>
            <Link to="/vendor/expiring" style={{ ...styles.button, ...styles.buttonSecondary, textDecoration: 'none', position: 'relative', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ⏰ Expiring
              {expiringCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  backgroundColor: theme.warning,
                  color: 'black',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>{expiringCount}</span>
              )}
            </Link>
            <Link to="/vendor/poll-summary" style={{ ...styles.button, ...styles.buttonSecondary, textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              📊 Polls
            </Link>
            <Link to="/vendor/top-products" style={{ ...styles.button, ...styles.buttonSecondary, textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              🏆 Top 50
            </Link>
            <button onClick={loadData} style={{ ...styles.button, ...styles.buttonSecondary }}>
              ↻ Refresh
            </button>
            <button onClick={handleLogout} style={{ ...styles.button, ...styles.buttonDanger }}>
              Logout
            </button>
          </div>
        )}

        {/* Mobile Quick Actions */}
        {isMobile && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button onClick={loadData} style={{ ...styles.button, ...styles.buttonSecondary, flex: 1 }}>
              ↻ Refresh
            </button>
          </div>
        )}
      </div>

      {/* Machines Section */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Vending Machines ({machines.length})</h2>
          <button onClick={() => setShowMachineForm(!showMachineForm)} style={{ ...styles.button, ...styles.buttonSuccess }}>
            {showMachineForm ? 'Cancel' : '+ Add Machine'}
          </button>
        </div>

        {showMachineForm && <MachineForm onSuccess={() => { setShowMachineForm(false); loadData(); }} />}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '12px' }}>
          {machines.map(machine => (
            <div key={machine.id} style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <h3 style={{ margin: 0 }}>{machine.machine_name}</h3>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  backgroundColor: machine.is_active ? theme.success + '20' : theme.danger + '20',
                  color: machine.is_active ? theme.success : theme.danger
                }}>
                  {machine.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p style={{ color: theme.textSecondary, margin: '0 0 8px 0' }}>
                📍 {machine.location}
              </p>
              {machine.last_visit_at && (
                <p style={{ color: theme.textMuted, margin: '0 0 12px 0', fontSize: '13px' }}>
                  🕐 Last visit: {formatTimeAgo(machine.last_visit_at)}
                </p>
              )}

              {/* Performance Stats */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: theme.success }}>
                    {machine.performing_count || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: theme.textMuted }}>Performing</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: theme.danger }}>
                    {machine.not_performing_count || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: theme.textMuted }}>Not Performing</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                    {machine.product_count || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: theme.textMuted }}>Products</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Link to={`/vendor/machines/${machine.id}`} style={{ ...styles.button, flex: 1, textAlign: 'center', textDecoration: 'none', fontSize: '14px', padding: '10px' }}>
                  Manage
                </Link>
                <button onClick={() => handleDownloadQR(machine.id)} style={{ ...styles.button, ...styles.buttonSecondary, fontSize: '14px', padding: '10px' }}>
                  QR
                </button>
                <button
                  onClick={() => handleDeleteMachine(machine.id, machine.machine_name)}
                  style={{ ...styles.button, backgroundColor: theme.danger, fontSize: '14px', padding: '10px' }}
                  title="Delete machine"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        {machines.length === 0 && (
          <div style={{ ...styles.card, textAlign: 'center', padding: '48px' }}>
            <p style={{ color: theme.textSecondary }}>No machines yet. Add your first vending machine above.</p>
          </div>
        )}
      </div>

      {/* Products Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Product Library ({products.length})</h2>
          <button onClick={() => setShowProductForm(!showProductForm)} style={{ ...styles.button, ...styles.buttonSuccess }}>
            {showProductForm ? 'Cancel' : '+ Add Product'}
          </button>
        </div>

        {showProductForm && <ProductForm onSuccess={() => { setShowProductForm(false); loadData(); }} />}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>
          {products.map(product => (
            <div key={product.id} style={styles.card}>
              <h4 style={{ margin: '0 0 8px 0' }}>{product.product_name}</h4>
              <p style={{ color: theme.success, fontWeight: 'bold', margin: '0 0 4px 0' }}>
                ${parseFloat(product.price).toFixed(2)}
              </p>
              <p style={{ color: theme.textMuted, fontSize: '14px', margin: 0 }}>
                {product.category || 'Uncategorized'}
              </p>
            </div>
          ))}
        </div>
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
    <form onSubmit={handleSubmit} style={{ ...styles.card, marginBottom: '20px' }}>
      <h3 style={{ margin: '0 0 16px 0' }}>Add New Machine</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={styles.label}>Machine Name</label>
          <input
            type="text"
            value={machineName}
            onChange={(e) => setMachineName(e.target.value)}
            style={{ ...styles.input, width: '100%' }}
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
            style={{ ...styles.input, width: '100%' }}
            placeholder="123 Main St, Floor 2"
            required
          />
        </div>
        <button type="submit" style={{ ...styles.button, width: '100%' }} disabled={loading}>
          {loading ? 'Creating...' : 'Create'}
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
    <form onSubmit={handleSubmit} style={{ ...styles.card, marginBottom: '20px' }}>
      <h3 style={{ margin: '0 0 16px 0' }}>Add New Product</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={styles.label}>Product Name</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            style={{ ...styles.input, width: '100%' }}
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
              style={{ ...styles.input, width: '100%' }}
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
              style={{ ...styles.input, width: '100%' }}
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
            style={{ ...styles.input, width: '100%' }}
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
        <button type="submit" style={{ ...styles.button, width: '100%' }} disabled={loading}>
          {loading ? 'Creating...' : 'Create'}
        </button>
      </div>
    </form>
  );
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
  const [loading, setLoading] = useState(true);
  // Redistribution state
  const [showRedistribution, setShowRedistribution] = useState(false);
  const [selectedProductForRedist, setSelectedProductForRedist] = useState(null);
  const [redistributionTargets, setRedistributionTargets] = useState([]);
  const [redistributionLoading, setRedistributionLoading] = useState(false);
  const [transferQuantity, setTransferQuantity] = useState(1);
  const [selectedTargetMachine, setSelectedTargetMachine] = useState(null);
  // Notes state
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesChanged, setNotesChanged] = useState(false);
  // Inline poll results state
  const [expandedPollId, setExpandedPollId] = useState(null);
  const [expandedResults, setExpandedResults] = useState(null);
  const [expandedLoading, setExpandedLoading] = useState(false);
  // Visit history state
  const [visitChanges, setVisitChanges] = useState(null);
  const [showVisitDetails, setShowVisitDetails] = useState(false);
  const toast = useToast();

  const initialLoadDone = useRef(false);

  const loadMachineData = useCallback(async (isBackground = false) => {
    try {
      // Only show full-page loading on initial load
      if (!isBackground && !initialLoadDone.current) {
        setLoading(true);
      }
      const [machineRes, inventoryRes, productsRes, pollsRes, visitRes] = await Promise.allSettled([
        vendorAPI.getMachine(id),
        vendorAPI.getMachineInventory(id),
        vendorAPI.getProducts(),
        vendorAPI.getMachinePolls(id),
        vendorAPI.getChangesSinceVisit(id)
      ]);

      if (machineRes.status === 'fulfilled') {
        const machineData = machineRes.value.data.data.machine;
        setMachine(machineData);
        setNotes(machineData.notes || '');
        setNotesChanged(false);
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
        stockQuantity: parseInt(stockQuantity)
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

  const handleSetPerformance = async (inventoryId, isPerforming) => {
    // Save previous value for revert (could be true, false, or null)
    const previousValue = inventory.find(item => item.id === inventoryId)?.is_performing;
    // Optimistic local update
    setInventory(prev => prev.map(item =>
      item.id === inventoryId ? { ...item, is_performing: isPerforming } : item
    ));
    try {
      await vendorAPI.setPerformance(id, inventoryId, { isPerforming });
    } catch (err) {
      // Revert on failure to the actual previous value
      setInventory(prev => prev.map(item =>
        item.id === inventoryId ? { ...item, is_performing: previousValue } : item
      ));
      toast.error(err.response?.data?.message || 'Failed to update performance');
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

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await vendorAPI.updateMachineNotes(id, notes);
      setNotesChanged(false);
      toast.success('Notes saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleNotesChange = (e) => {
    setNotes(e.target.value);
    setNotesChanged(true);
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

  const handleDownloadQRPDF = () => {
    if (!machine?.qr_token || !qrCodeDataUrl) return;
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

  const handleExecuteRedistribution = async () => {
    if (!selectedProductForRedist || !selectedTargetMachine || transferQuantity < 1) return;

    if (transferQuantity > selectedProductForRedist.current_stock) {
      toast.error(`Cannot transfer more than available stock (${selectedProductForRedist.current_stock})`);
      return;
    }

    try {
      setRedistributionLoading(true);
      await vendorAPI.executeRedistribution({
        sourceMachineId: parseInt(id),
        targetMachineId: selectedTargetMachine.machine_id,
        productId: selectedProductForRedist.product_id,
        quantity: transferQuantity,
        reason: 'Product redistribution to optimize performance'
      });
      toast.success(`Transferred ${transferQuantity} units to ${selectedTargetMachine.machine_name}`);
      setSelectedProductForRedist(null);
      setSelectedTargetMachine(null);
      setTransferQuantity(1);
      setShowRedistribution(false);
      loadMachineData(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to execute redistribution');
    } finally {
      setRedistributionLoading(false);
    }
  };

  const handleCancelRedistribution = () => {
    setSelectedProductForRedist(null);
    setSelectedTargetMachine(null);
    setTransferQuantity(1);
    setRedistributionTargets([]);
  };

  if (loading) {
    return <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Loading...</p></div>;
  }

  return (
    <div style={styles.page}>
      <Link to="/vendor/dashboard" style={{ ...styles.link, display: 'inline-block', marginBottom: '24px' }}>
        ← Back to Dashboard
      </Link>

      {/* Machine Header */}
      <div style={{ ...styles.card, marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0' }}>{machine?.machine_name}</h1>
            <p style={{ color: theme.textSecondary, margin: 0 }}>📍 {machine?.location}</p>
          </div>
          <span style={{
            padding: '6px 16px',
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
              <h3 style={{ margin: 0, fontSize: '16px' }}>
                📋 Since Last Visit
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
                      {change.actionType === 'performance_change' ? '📊' :
                       change.actionType === 'product_added' ? '➕' :
                       change.actionType === 'product_removed' ? '➖' : '📝'}
                    </span>
                    <div style={{ flex: 1 }}>
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
                    <span style={{ color: theme.textMuted, fontSize: '12px' }}>
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
          {notesChanged && (
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              style={{ ...styles.button, padding: '6px 16px', fontSize: '14px' }}
            >
              {savingNotes ? 'Saving...' : 'Save Notes'}
            </button>
          )}
        </div>
        <textarea
          value={notes}
          onChange={handleNotesChange}
          placeholder="Add notes about this machine (e.g., access instructions, contact info, special requirements...)"
          style={{
            ...styles.input,
            width: '100%',
            minHeight: '80px',
            resize: 'vertical',
            fontFamily: 'inherit'
          }}
        />
        <p style={{ color: theme.textMuted, fontSize: '12px', margin: '8px 0 0 0' }}>
          Notes are only visible to you. Use them to remember access codes, contact info, or machine-specific details.
        </p>
      </div>

      {/* Inventory Section */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0 }}>Planogram ({inventory.length}/40 products)</h2>
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
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.product_name}
                      style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <div>
                    <h4 style={{ margin: '0 0 4px 0' }}>{item.product_name}</h4>
                    <p style={{ color: theme.textMuted, margin: 0, fontSize: '14px' }}>
                      ${parseFloat(item.price).toFixed(2)} • Stock: {item.current_stock}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveProduct(item.id)}
                  style={{ background: 'none', border: 'none', color: theme.danger, cursor: 'pointer', fontSize: '18px' }}
                  aria-label={`Remove ${item.product_name} from machine`}
                  title="Remove product"
                >
                  ×
                </button>
              </div>

              {/* Performance Toggle */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleSetPerformance(item.id, true)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600',
                    backgroundColor: item.is_performing === true ? theme.success : theme.surfaceHover,
                    color: item.is_performing === true ? 'white' : theme.textSecondary,
                  }}
                >
                  ✓ Yes
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
                    backgroundColor: item.is_performing === false ? theme.danger : theme.surfaceHover,
                    color: item.is_performing === false ? 'white' : theme.textSecondary,
                  }}
                >
                  ✗ No
                </button>
              </div>

              {/* Expiration Date */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                <span style={{ fontSize: '13px', color: theme.textSecondary, fontWeight: '600' }}>Expires:</span>
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
                    padding: '8px 10px',
                    fontSize: '14px',
                    flex: 1,
                  }}
                />
                {item.expiration_date && (() => {
                  const daysLeft = Math.ceil((new Date(item.expiration_date) - new Date()) / (1000 * 60 * 60 * 24));
                  if (daysLeft <= 7) {
                    return (
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: daysLeft <= 3 ? theme.danger + '20' : theme.warning + '20',
                        color: daysLeft <= 3 ? theme.danger : theme.warning,
                        fontWeight: '600',
                      }}>
                        {daysLeft <= 0 ? 'EXPIRED' : `${daysLeft}d left`}
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>

              {item.performance_marked_at && (
                <p style={{ color: theme.textMuted, fontSize: '12px', margin: '8px 0 0 0' }}>
                  Marked: {new Date(item.performance_marked_at).toLocaleDateString()}
                </p>
              )}

              {/* Performance Tally Marks */}
              {(item.performance_yes_count > 0 || item.performance_no_count > 0) && (() => {
                const yesCount = item.performance_yes_count || 0;
                const noCount = item.performance_no_count || 0;
                const makeTallies = (count) => {
                  const groups = [];
                  const fullGroups = Math.floor(count / 5);
                  const remainder = count % 5;
                  for (let i = 0; i < fullGroups; i++) groups.push('|||||');
                  if (remainder > 0) groups.push('|'.repeat(remainder));
                  return groups.join(' ');
                };
                return (
                  <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '14px', fontFamily: 'monospace', letterSpacing: '1px' }}>
                    {yesCount > 0 && (
                      <span style={{ color: theme.success, fontWeight: '700' }} title={`Marked good ${yesCount} times`}>
                        {makeTallies(yesCount)} <span style={{ fontSize: '11px', fontFamily: 'inherit' }}>({yesCount})</span>
                      </span>
                    )}
                    {noCount > 0 && (
                      <span style={{ color: theme.danger, fontWeight: '700' }} title={`Marked bad ${noCount} times`}>
                        {makeTallies(noCount)} <span style={{ fontSize: '11px', fontFamily: 'inherit' }}>({noCount})</span>
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>
          ))}
        </div>

        {inventory.length === 0 && (
          <div style={{ ...styles.card, textAlign: 'center', padding: '48px' }}>
            <p style={{ color: theme.textSecondary }}>No products in this machine yet.</p>
          </div>
        )}

        {/* Redistribute Button */}
        {inventory.length > 0 && (
          <button
            onClick={() => setShowRedistribution(!showRedistribution)}
            style={{ ...styles.button, marginTop: '16px', backgroundColor: showRedistribution ? theme.warning : theme.primary }}
          >
            {showRedistribution ? 'Close Redistribution' : 'Redistribute Products'}
          </button>
        )}
      </div>

      {/* Product Redistribution Section */}
      {showRedistribution && inventory.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ marginBottom: '16px' }}>Product Redistribution</h2>
          <p style={{ color: theme.textSecondary, marginBottom: '16px' }}>
            Move products to machines where they perform better to reduce spoilage.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Source Products (Left Panel) */}
            <div>
              <h3 style={{ marginBottom: '12px', color: theme.textSecondary }}>Select Product to Move</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                {inventory.filter(item => item.current_stock > 0).map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectProductForRedist(item)}
                    style={{
                      ...styles.card,
                      cursor: 'pointer',
                      borderLeft: `4px solid ${selectedProductForRedist?.id === item.id ? theme.primary : 'transparent'}`,
                      backgroundColor: selectedProductForRedist?.id === item.id ? theme.surfaceHover : theme.surface,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: '600' }}>{item.product_name}</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: theme.textMuted }}>
                          Stock: {item.current_stock} • {item.is_performing === true ? 'Performing' : item.is_performing === false ? 'Not Performing' : 'Unmarked'}
                        </p>
                      </div>
                      {selectedProductForRedist?.id === item.id && (
                        <span style={{ color: theme.primary, fontSize: '20px' }}>→</span>
                      )}
                    </div>
                  </div>
                ))}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <label style={{ color: theme.textSecondary }}>Quantity:</label>
                    <input
                      type="number"
                      min="1"
                      max={selectedProductForRedist.current_stock}
                      value={transferQuantity}
                      onChange={(e) => setTransferQuantity(Math.min(parseInt(e.target.value) || 1, selectedProductForRedist.current_stock))}
                      style={{ ...styles.input, width: '80px' }}
                    />
                    <span style={{ color: theme.textMuted, fontSize: '14px' }}>
                      of {selectedProductForRedist.current_stock} available
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={handleExecuteRedistribution}
                      disabled={redistributionLoading}
                      style={{ ...styles.button, ...styles.buttonSuccess, flex: 1 }}
                    >
                      {redistributionLoading ? 'Transferring...' : `Transfer ${transferQuantity} units`}
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
        </div>
      )}

      {/* Swipe Poll Section */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0 }}>Customer Swipe Polls</h2>
          <button onClick={() => setShowPollForm(!showPollForm)} style={{ ...styles.button, ...styles.buttonSuccess }}>
            {showPollForm ? 'Cancel' : '+ Create Poll'}
          </button>
        </div>

        {showPollForm && <SwipePollForm machineId={id} onSuccess={() => { setShowPollForm(false); loadMachineData(true); }} />}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {polls.map(poll => (
            <div key={poll.id} style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                <h4 style={{ margin: 0 }}>{poll.poll_question}</h4>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {/* Poll Type Badge */}
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
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
                      borderRadius: '12px',
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
                    borderRadius: '12px',
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
                        Full results page →
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
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
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
        <div key={index} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
          <input
            type="text"
            value={product.name}
            onChange={(e) => handleProductChange(index, 'name', e.target.value)}
            style={{ ...styles.input, flex: 2 }}
            placeholder="Product name"
            required
          />
          <input
            type="url"
            value={product.imageUrl}
            onChange={(e) => handleProductChange(index, 'imageUrl', e.target.value)}
            style={{ ...styles.input, flex: 2 }}
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
                borderRadius: '12px',
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

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const response = await vendorAPI.getPollSummary();
        setProducts(response.data.data.products || []);
      } catch (err) {
        toast.error('Failed to load poll summary');
      } finally {
        setLoading(false);
      }
    };
    loadSummary();
  }, [toast]);

  const handleCopyShoppingList = () => {
    const qualifying = products.filter(p => p.approval_rate >= 50 && p.total_votes > 0);
    if (qualifying.length === 0) {
      toast.warning('No products above 50% approval yet');
      return;
    }
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const lines = qualifying.map((p, i) =>
      `${i + 1}. ${p.product_name} — ${p.approval_rate}% approval (${p.total_votes} votes)`
    );
    const text = `IDDI Shopping List (${date})\nBased on customer poll results\n\n${lines.join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Shopping list copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div style={styles.page}><p>Loading...</p></div>;

  const qualifying = products.filter(p => p.approval_rate >= 50 && p.total_votes > 0);

  return (
    <div style={styles.page}>
      <Link to="/vendor/dashboard" style={{ ...styles.link, display: 'inline-block', marginBottom: '24px' }}>
        ← Back to Dashboard
      </Link>

      <h1 style={{ margin: '0 0 8px 0' }}>Poll Summary</h1>
      <p style={{ color: theme.textSecondary, margin: '0 0 32px 0' }}>
        Aggregated results across all machines — {products.length} products polled
      </p>

      {/* Results Section */}
      {products.length === 0 ? (
        <div style={{ ...styles.card, textAlign: 'center', padding: '48px' }}>
          <p style={{ color: theme.textSecondary }}>No poll data yet. Create polls on your machines to see results here.</p>
        </div>
      ) : (
        <div style={{ marginBottom: '40px' }}>
          {products.map((product) => (
            <div key={product.product_name} style={{ ...styles.card, marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontWeight: '600', fontSize: '16px' }}>{product.product_name}</span>
                  <span style={{ color: theme.textMuted, fontSize: '13px', marginLeft: '12px' }}>
                    {product.machines_polled} machine{product.machines_polled !== 1 ? 's' : ''}
                  </span>
                </div>
                <span style={{ fontWeight: 'bold', fontSize: '18px', color: product.approval_rate >= 50 ? theme.success : theme.danger }}>
                  {product.approval_rate}%
                </span>
              </div>
              <div style={{ height: '10px', backgroundColor: theme.surfaceHover, borderRadius: '5px', overflow: 'hidden', marginBottom: '6px' }}>
                <div style={{
                  height: '100%',
                  width: `${product.approval_rate}%`,
                  backgroundColor: product.approval_rate >= 50 ? theme.success : theme.danger,
                  borderRadius: '5px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <p style={{ color: theme.textMuted, fontSize: '13px', margin: 0 }}>
                {product.likes} likes / {product.total_votes} total votes
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Shopping List Section */}
      {qualifying.length > 0 && (
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>Shopping List</h2>
            <button onClick={handleCopyShoppingList} style={{ ...styles.button, ...styles.buttonSuccess }}>
              {copied ? 'Copied!' : 'Copy Shopping List'}
            </button>
          </div>
          <p style={{ color: theme.textSecondary, fontSize: '14px', margin: '0 0 16px 0' }}>
            Products with over 50% customer approval, ranked by popularity
          </p>
          <div style={{ backgroundColor: theme.bg, borderRadius: '8px', padding: '16px', fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.8' }}>
            {qualifying.map((p, i) => (
              <div key={p.product_name}>
                {i + 1}. {p.product_name} — {p.approval_rate}% approval ({p.total_votes} votes)
              </div>
            ))}
          </div>
        </div>
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
          ↻ Refresh
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
            {tab === 'overview' ? '📊 Overview' : '🏆 Engagement Rankings'}
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
            <div style={styles.card}>
              <div style={{ color: theme.textMuted, fontSize: '14px', marginBottom: '8px' }}>Unique Visitors</div>
              <div style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 'bold', color: theme.secondary }}>{analytics.today?.uniqueSessions || 0}</div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: theme.textMuted, fontSize: '14px', marginBottom: '8px' }}>Unique Visitors</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: theme.secondary }}>{analytics.thisWeek?.uniqueSessions || 0}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px' }}>vs last week</div>
                  {formatChange(analytics.weekOverWeek?.sessionsChange || 0)}
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
                        📍 {machine.location}
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0' }}>Top 50 Products</h1>
          <p style={{ color: theme.textSecondary, margin: 0 }}>
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
            gap: '8px',
            opacity: refreshing ? 0.6 : 1,
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
                backgroundColor: index < 3 ? theme.warning + '20' : theme.surfaceHover,
                color: index < 3 ? theme.warning : theme.textSecondary
              }}>
                {product.rank_position || index + 1}
              </div>

              {product.image_url && (
                <img src={product.image_url} alt={product.product_name} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
              )}

              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0 }}>{product.product_name}</h4>
                <p style={{ color: theme.textMuted, margin: 0, fontSize: '14px' }}>
                  In {product.total_machines} machines
                  {product.unique_vendors > 0 && (
                    <span style={{ marginLeft: '8px', color: theme.primary }}>
                      • Rated by {product.unique_vendors} vendor{product.unique_vendors !== 1 ? 's' : ''}
                    </span>
                  )}
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: theme.success }}>
                  {product.yes_count}
                </div>
                <div style={{ color: theme.textMuted, fontSize: '12px' }}>
                  performing ({product.performance_percentage || 0}%)
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0' }}>📋 Route Plan</h1>
            <p style={{ color: theme.textSecondary, margin: 0 }}>
              Optimized redistribution plan based on product performance across all machines
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <button
              onClick={loadRoutePlan}
              disabled={loading}
              style={{ ...styles.button, ...styles.buttonSecondary, marginBottom: '8px' }}
            >
              {loading ? 'Refreshing...' : '↻ Refresh'}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
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
                  <h3 style={{ margin: 0 }}>{stop.machineName}</h3>
                </div>
                <p style={{ color: theme.textMuted, margin: '0 0 0 40px', fontSize: '14px' }}>
                  📍 {stop.location}
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
                            <div>
                              <p style={{ margin: 0, fontWeight: '600' }}>{item.productName}</p>
                              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: theme.textMuted }}>
                                Stock: {item.currentStock} units available
                              </p>
                            </div>
                          </div>
                          {item.suggestedTargets && item.suggestedTargets.length > 0 && (
                            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px dashed ${theme.border}` }}>
                              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: theme.textMuted }}>
                                → Move to (performs well at):
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

// ============================================
// CUSTOMER COMPONENTS (Anonymous)
// ============================================

function CustomerMachine() {
  const { qr_token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [initData, setInitData] = useState(null);

  useEffect(() => {
    const initMachine = async () => {
      try {
        // Single API call does everything: resolve QR, create session, check completion, load polls
        const response = await customerAPI.initSession(qr_token);
        const data = response.data.data;

        localStorage.setItem('token', data.sessionToken);
        localStorage.setItem('selectedMachineId', data.machine.id.toString());

        // Preload product images immediately so they're cached by the time user sees them
        if (data.products && data.products.length > 0) {
          data.products.forEach(p => {
            if (p.image_url) {
              const img = new Image();
              img.src = p.image_url;
            }
          });
        }

        setInitData(data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to access machine');
        setLoading(false);
      }
    };

    initMachine();
  }, [qr_token]);

  if (loading) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div>
          <div className="spinner" style={{ width: '48px', height: '48px', border: `3px solid ${theme.border}`, borderTopColor: theme.primary, borderRadius: '50%', margin: '0 auto 16px' }} />
          <p style={{ color: theme.textSecondary }}>Connecting to machine...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <p style={{ color: theme.danger }}>{error}</p>
          <Link to="/" style={{ ...styles.button, display: 'inline-block', marginTop: '16px', textDecoration: 'none' }}>
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return <CustomerSwipe initData={initData} />;
}

function CustomerSwipe({ initData }) {
  const machineId = initData.machine.id;
  const [poll, setPoll] = useState(initData.poll);
  const [products, setProducts] = useState(initData.products || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(!initData.poll || (initData.products || []).length === 0);
  const [alreadyVoted, setAlreadyVoted] = useState(initData.alreadyVoted || false);
  const [loading] = useState(false); // No loading needed - data arrives via props
  const [swiping, setSwiping] = useState(null);
  const [suggestion, setSuggestion] = useState('');
  const [suggestionSubmitted, setSuggestionSubmitted] = useState(false);
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);
  const [cardEntering, setCardEntering] = useState(true);
  const cardRef = useRef(null);
  const toast = useToast();
  const nextPollDate = initData.nextPollDate;

  // Touch/swipe state
  const touchStartRef = useRef({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const SWIPE_THRESHOLD = 80;

  const handleSubmitSuggestion = async () => {
    if (!suggestion.trim()) return;
    setSubmittingSuggestion(true);
    try {
      await customerAPI.submitSuggestion(suggestion.trim());
      setSuggestionSubmitted(true);
      setSuggestion('');
    } catch (err) {
      toast.error('Failed to submit suggestion');
    } finally {
      setSubmittingSuggestion(false);
    }
  };

  const advanceCard = useCallback(() => {
    setSwiping(null);
    setDragOffset(0);
    if (currentIndex < products.length - 1) {
      setCardEntering(true);
      setCurrentIndex(prev => prev + 1);
      setTimeout(() => setCardEntering(false), 400);
    } else {
      // Mark completion
      const localKey = `iddi_poll_completed_machine_${machineId}`;
      localStorage.setItem(localKey, Date.now().toString());
      setCompleted(true);
    }
  }, [currentIndex, products.length, machineId]);

  const handleVote = useCallback(async (voteType) => {
    if (!poll || !products[currentIndex] || swiping) return;

    setSwiping(voteType);

    try {
      await customerAPI.votePoll(poll.id, {
        optionId: products[currentIndex].id,
        voteType
      });

      setTimeout(advanceCard, 350);
    } catch (err) {
      setSwiping(null);
      setDragOffset(0);
      toast.error(err.response?.data?.message || 'Failed to vote');
    }
  }, [poll, products, currentIndex, swiping, advanceCard, toast]);

  // Touch handlers for swipe gesture
  const handleTouchStart = useCallback((e) => {
    if (swiping) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setIsDragging(true);
  }, [swiping]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || swiping) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    setDragOffset(dx);
  }, [isDragging, swiping]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || swiping) return;
    setIsDragging(false);

    if (Math.abs(dragOffset) > SWIPE_THRESHOLD) {
      handleVote(dragOffset > 0 ? 'like' : 'dislike');
    } else {
      setDragOffset(0);
    }
  }, [isDragging, swiping, dragOffset, handleVote]);

  // Reset card entering state on first render
  useEffect(() => {
    if (!loading && products.length > 0) {
      const timer = setTimeout(() => setCardEntering(false), 400);
      return () => clearTimeout(timer);
    }
  }, [loading, products.length]);

  if (loading) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '48px', height: '48px', border: `3px solid ${theme.border}`, borderTopColor: theme.primary, borderRadius: '50%', margin: '0 auto 16px' }} />
          <p style={{ color: theme.textSecondary }}>Loading poll...</p>
        </div>
      </div>
    );
  }

  // Already voted screen
  if (alreadyVoted) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ ...styles.card, maxWidth: '400px', width: '100%', padding: '32px 24px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            backgroundColor: theme.primary + '20', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: '40px'
          }}>
            ✓
          </div>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '24px' }}>You've Already Voted!</h2>
          <p style={{ color: theme.textSecondary, margin: '0 0 8px 0', lineHeight: '1.6' }}>
            Your feedback has been recorded. Thanks for helping us improve!
          </p>
          <p style={{ color: theme.textMuted, margin: 0, fontSize: '14px' }}>
            {nextPollDate ? `Next poll opens ${new Date(nextPollDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.` : 'Check back next month!'}
          </p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ ...styles.card, maxWidth: '400px', width: '100%', padding: '32px 24px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ margin: '0 0 8px 0' }}>Thank You!</h2>
          <p style={{ color: theme.textSecondary, margin: '0 0 24px 0' }}>
            Your feedback helps us stock better products.
          </p>

          {/* Product Suggestion Box */}
          <div style={{
            borderTop: `1px solid ${theme.border}`,
            paddingTop: '24px',
            marginTop: '8px'
          }}>
            <p style={{ margin: '0 0 4px 0', fontWeight: '600', fontSize: '16px' }}>
              Want something we don't carry?
            </p>
            <p style={{ margin: '0 0 16px 0', color: theme.textMuted, fontSize: '14px' }}>
              Tell us and we'll consider adding it!
            </p>
            {suggestionSubmitted ? (
              <div style={{
                backgroundColor: theme.success + '20',
                border: `1px solid ${theme.success}`,
                borderRadius: '12px',
                padding: '16px',
                color: theme.success,
                fontWeight: '500'
              }}>
                ✓ Thanks! Your suggestion was sent to the vendor.
              </div>
            ) : (
              <div>
                <textarea
                  placeholder="e.g., Takis, Celsius Energy, Kind Bars..."
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  maxLength={255}
                  rows={2}
                  style={{
                    ...styles.input,
                    width: '100%',
                    marginBottom: '12px',
                    textAlign: 'center',
                    resize: 'none',
                    minHeight: '64px',
                    fontSize: '16px',
                  }}
                />
                <button
                  onClick={handleSubmitSuggestion}
                  disabled={!suggestion.trim() || submittingSuggestion}
                  style={{
                    ...styles.button,
                    width: '100%',
                    opacity: !suggestion.trim() || submittingSuggestion ? 0.5 : 1,
                    fontSize: '16px',
                    padding: '14px',
                  }}
                >
                  {submittingSuggestion ? 'Sending...' : 'Submit Suggestion'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentProduct = products[currentIndex];
  const progress = `${currentIndex + 1} / ${products.length}`;
  const dragRotation = dragOffset * 0.08;
  const dragOpacity = Math.max(0.4, 1 - Math.abs(dragOffset) / 300);

  // Compute card transform
  let cardTransform;
  let cardTransition;
  let cardBorderColor = theme.border;
  if (swiping === 'like') {
    cardTransform = 'translateX(120%) rotate(15deg)';
    cardTransition = 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s, border-color 0.2s';
    cardBorderColor = theme.success;
  } else if (swiping === 'dislike') {
    cardTransform = 'translateX(-120%) rotate(-15deg)';
    cardTransition = 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s, border-color 0.2s';
    cardBorderColor = theme.danger;
  } else if (isDragging) {
    cardTransform = `translateX(${dragOffset}px) rotate(${dragRotation}deg)`;
    cardTransition = 'none';
    if (dragOffset > 30) cardBorderColor = theme.success;
    else if (dragOffset < -30) cardBorderColor = theme.danger;
  } else if (cardEntering) {
    cardTransform = 'scale(0.95)';
    cardTransition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s';
  } else {
    cardTransform = 'translateX(0) rotate(0deg)';
    cardTransition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.2s';
  }

  // Swipe indicator overlays
  const showLikeIndicator = dragOffset > 30 || swiping === 'like';
  const showDislikeIndicator = dragOffset < -30 || swiping === 'dislike';
  const indicatorOpacity = swiping ? 1 : Math.min(1, Math.abs(dragOffset) / SWIPE_THRESHOLD);

  return (
    <div style={{
      ...styles.page,
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      overflow: 'hidden',
      userSelect: 'none',
      WebkitUserSelect: 'none',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        {poll?.pollType && (
          <div style={{ marginBottom: '10px' }}>
            <span style={{
              padding: '6px 14px',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: '600',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              backgroundColor: poll.pollType === 'discovery' ? theme.secondary + '20' : theme.primary + '20',
              color: poll.pollType === 'discovery' ? theme.secondary : theme.primary
            }}>
              {poll.pollType === 'discovery' ? 'New Products' : 'Help Us Improve'}
            </span>
          </div>
        )}
        <h2 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>{poll?.question || 'Which products do you want?'}</h2>
        <p style={{ color: theme.textSecondary, margin: 0, fontSize: '14px' }}>{progress}</p>

        {/* Progress bar */}
        <div style={{ height: '4px', backgroundColor: theme.surfaceHover, borderRadius: '2px', marginTop: '12px' }}>
          <div style={{
            height: '100%',
            width: `${((currentIndex + 1) / products.length) * 100}%`,
            backgroundColor: theme.primary,
            borderRadius: '2px',
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }} />
        </div>
      </div>

      {/* Swipe instruction - only show on first card */}
      {currentIndex === 0 && !swiping && !isDragging && (
        <div style={{ textAlign: 'center', color: theme.textMuted, fontSize: '13px', marginBottom: '8px' }}>
          Swipe right to keep, left to pass
        </div>
      )}

      {/* Card Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        touchAction: 'pan-y',
      }}>
        <div
          ref={cardRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            ...styles.card,
            width: '100%',
            maxWidth: '350px',
            textAlign: 'center',
            position: 'relative',
            transform: cardTransform,
            transition: cardTransition,
            opacity: swiping ? 0.6 : dragOpacity,
            borderColor: cardBorderColor,
            borderWidth: '2px',
            boxShadow: isDragging
              ? `0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px ${cardBorderColor}40`
              : '0 4px 20px rgba(0,0,0,0.2)',
            cursor: 'grab',
          }}
        >
          {/* Swipe indicator overlays */}
          {showLikeIndicator && (
            <div style={{
              position: 'absolute', top: '16px', left: '16px', zIndex: 10,
              padding: '6px 16px', borderRadius: '8px',
              border: `3px solid ${theme.success}`, color: theme.success,
              fontSize: '24px', fontWeight: '800', letterSpacing: '2px',
              transform: 'rotate(-15deg)', opacity: indicatorOpacity,
              textTransform: 'uppercase',
            }}>
              WANT
            </div>
          )}
          {showDislikeIndicator && (
            <div style={{
              position: 'absolute', top: '16px', right: '16px', zIndex: 10,
              padding: '6px 16px', borderRadius: '8px',
              border: `3px solid ${theme.danger}`, color: theme.danger,
              fontSize: '24px', fontWeight: '800', letterSpacing: '2px',
              transform: 'rotate(15deg)', opacity: indicatorOpacity,
              textTransform: 'uppercase',
            }}>
              PASS
            </div>
          )}

          {/* Color gradient overlay during drag */}
          {isDragging && Math.abs(dragOffset) > 20 && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              borderRadius: '10px', pointerEvents: 'none', zIndex: 5,
              background: dragOffset > 0
                ? `linear-gradient(90deg, transparent 40%, ${theme.success}15 100%)`
                : `linear-gradient(270deg, transparent 40%, ${theme.danger}15 100%)`,
              transition: 'opacity 0.1s',
            }} />
          )}

          {currentProduct?.image_url ? (
            <>
              <img
                src={currentProduct.image_url}
                alt={currentProduct.product_name}
                draggable={false}
                style={{
                  width: '100%',
                  height: '250px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  pointerEvents: 'none',
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div style={{
                display: 'none',
                width: '100%',
                height: '200px',
                backgroundColor: theme.surfaceHover,
                borderRadius: '8px',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                flexDirection: 'column',
                gap: '8px',
              }}>
                <span style={{ fontSize: 'clamp(24px, 6vw, 32px)', opacity: 0.4 }}>📦</span>
                <span style={{ color: theme.textMuted, fontSize: '14px', padding: '0 20px', textAlign: 'center' }}>
                  {currentProduct?.product_name}
                </span>
              </div>
            </>
          ) : (
            <div style={{
              width: '100%',
              height: '200px',
              backgroundColor: theme.surfaceHover,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              flexDirection: 'column',
              gap: '8px',
            }}>
              <span style={{ fontSize: 'clamp(24px, 6vw, 32px)', opacity: 0.4 }}>📦</span>
              <span style={{ color: theme.textMuted, fontSize: '14px', padding: '0 20px', textAlign: 'center' }}>
                {currentProduct?.product_name}
              </span>
            </div>
          )}
          <h3 style={{ margin: 0, fontSize: '22px', position: 'relative', zIndex: 6 }}>{currentProduct?.product_name}</h3>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', padding: '20px 0 12px' }} role="group" aria-label="Vote on product">
        <button
          onClick={() => handleVote('dislike')}
          disabled={!!swiping}
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            border: `3px solid ${theme.danger}`,
            backgroundColor: 'transparent',
            color: theme.danger,
            fontSize: '28px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: `0 0 20px ${theme.danger}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            minHeight: 'unset',
            minWidth: 'unset',
          }}
          aria-label="Pass on this product"
          title="Pass"
        >
          ✗
        </button>
        <button
          onClick={() => handleVote('like')}
          disabled={!!swiping}
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            border: `3px solid ${theme.success}`,
            backgroundColor: 'transparent',
            color: theme.success,
            fontSize: '28px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: `0 0 20px ${theme.success}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            minHeight: 'unset',
            minWidth: 'unset',
          }}
          aria-label="Want this product"
          title="Want it"
        >
          ✓
        </button>
      </div>

      <div style={{ textAlign: 'center', color: theme.textMuted, fontSize: '13px', paddingBottom: '16px' }}>
        ✗ Pass &nbsp;&nbsp;•&nbsp;&nbsp; ✓ Want it
      </div>
    </div>
  );
}

// ============================================
// SUGGESTIONS MANAGEMENT
// ============================================

function Suggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const toast = useToast();

  useEffect(() => {
    loadSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const response = await vendorAPI.getSuggestions(filter !== 'all' ? { status: filter } : {});
      setSuggestions(response.data?.data?.suggestions || []);
    } catch (err) {
      toast.error('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await vendorAPI.updateSuggestion(id, { status });
      toast.success(`Suggestion marked as ${status}`);
      loadSuggestions();
    } catch (err) {
      toast.error('Failed to update suggestion');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: { bg: theme.warning + '20', color: theme.warning },
      reviewed: { bg: theme.primary + '20', color: theme.primary },
      added: { bg: theme.success + '20', color: theme.success },
      dismissed: { bg: theme.textMuted + '20', color: theme.textMuted },
    };
    const c = colors[status] || colors.pending;
    return {
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      backgroundColor: c.bg,
      color: c.color,
      textTransform: 'capitalize',
    };
  };

  if (loading) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading suggestions...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <Link to="/vendor/dashboard" style={{ ...styles.link, display: 'inline-block', marginBottom: '24px' }}>
        ← Back to Dashboard
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0' }}>💡 Product Suggestions</h1>
          <p style={{ color: theme.textSecondary, margin: 0 }}>
            Customer suggestions from QR code polls
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['pending', 'reviewed', 'added', 'dismissed', 'all'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                ...styles.button,
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: filter === status ? theme.primary : theme.surfaceHover,
                textTransform: 'capitalize',
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {suggestions.length === 0 ? (
        <div style={{ ...styles.card, textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <p style={{ color: theme.textSecondary }}>
            {filter === 'all' ? 'No suggestions yet.' : `No ${filter} suggestions.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {suggestions.map(suggestion => (
            <div key={suggestion.id} style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0' }}>"{suggestion.suggestion_text}"</h3>
                  <p style={{ color: theme.textMuted, margin: 0, fontSize: '14px' }}>
                    From: {suggestion.machine_name} • {new Date(suggestion.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span style={getStatusBadge(suggestion.status)}>{suggestion.status}</span>
              </div>

              {suggestion.status === 'pending' && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button
                    onClick={() => handleUpdateStatus(suggestion.id, 'reviewed')}
                    style={{ ...styles.button, ...styles.buttonSecondary, flex: 1, fontSize: '14px' }}
                  >
                    Mark Reviewed
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(suggestion.id, 'added')}
                    style={{ ...styles.button, ...styles.buttonSuccess, flex: 1, fontSize: '14px' }}
                  >
                    Added to Machine
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(suggestion.id, 'dismissed')}
                    style={{ ...styles.button, backgroundColor: theme.textMuted, flex: 1, fontSize: '14px' }}
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// EXPIRING PRODUCTS
// ============================================

function ExpiringProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(14);
  const toast = useToast();

  const loadExpiringProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await vendorAPI.getExpiringProducts(days);
      setProducts(response.data?.data?.products || []);
    } catch (err) {
      toast.error('Failed to load expiring products');
    } finally {
      setLoading(false);
    }
  }, [days, toast]);

  useEffect(() => {
    loadExpiringProducts();
  }, [loadExpiringProducts]);

  const handleUpdateExpiration = async (machineId, inventoryId, newDate) => {
    try {
      await vendorAPI.updateExpirationDate(machineId, inventoryId, newDate);
      toast.success('Expiration date updated');
      loadExpiringProducts();
    } catch (err) {
      toast.error('Failed to update expiration date');
    }
  };

  const getDaysUntil = (date) => {
    const now = new Date();
    const expDate = new Date(date);
    const diffTime = expDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyColor = (daysLeft) => {
    if (daysLeft <= 3) return theme.danger;
    if (daysLeft <= 7) return theme.warning;
    return theme.textSecondary;
  };

  if (loading) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading expiring products...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <Link to="/vendor/dashboard" style={{ ...styles.link, display: 'inline-block', marginBottom: '24px' }}>
        ← Back to Dashboard
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0' }}>⏰ Expiring Products</h1>
          <p style={{ color: theme.textSecondary, margin: 0 }}>
            Products expiring within {days} days across all machines
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ color: theme.textSecondary }}>Show next:</label>
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            style={{ ...styles.input, width: 'auto', padding: '8px 16px' }}
          >
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="60">60 days</option>
          </select>
        </div>
      </div>

      {products.length === 0 ? (
        <div style={{ ...styles.card, textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
          <h2 style={{ margin: '0 0 8px 0' }}>No Expiring Products</h2>
          <p style={{ color: theme.textSecondary, margin: 0 }}>
            No products are expiring within the next {days} days.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {products.map(product => {
            const daysLeft = getDaysUntil(product.expiration_date);
            const urgencyColor = getUrgencyColor(daysLeft);

            return (
              <div key={`${product.machine_id}-${product.inventory_id}`} style={{
                ...styles.card,
                borderLeft: `4px solid ${urgencyColor}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0' }}>{product.product_name}</h3>
                    <p style={{ color: theme.textMuted, margin: '0 0 4px 0', fontSize: '14px' }}>
                      📍 {product.machine_name} • Stock: {product.current_stock}
                    </p>
                    <p style={{ color: urgencyColor, margin: 0, fontSize: '14px', fontWeight: '600' }}>
                      {daysLeft <= 0 ? 'EXPIRED' : `Expires in ${daysLeft} days`} ({new Date(product.expiration_date).toLocaleDateString()})
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="date"
                      defaultValue={product.expiration_date?.split('T')[0]}
                      onChange={(e) => {
                        if (e.target.value) {
                          handleUpdateExpiration(product.machine_id, product.inventory_id, e.target.value);
                        }
                      }}
                      style={{ ...styles.input, width: 'auto', padding: '8px' }}
                    />
                    <Link
                      to={`/vendor/machines/${product.machine_id}`}
                      style={{ ...styles.button, textDecoration: 'none', padding: '8px 16px', fontSize: '14px' }}
                    >
                      View Machine
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tips */}
      <div style={{ ...styles.card, marginTop: '24px', backgroundColor: theme.warning + '10', borderLeft: `4px solid ${theme.warning}` }}>
        <h3 style={{ margin: '0 0 8px 0', color: theme.warning }}>💡 Tips for Managing Expiring Products</h3>
        <ul style={{ margin: 0, paddingLeft: '20px', color: theme.textSecondary, lineHeight: '1.8' }}>
          <li>Move expiring products to higher-traffic machines</li>
          <li>Consider promotional pricing for products nearing expiration</li>
          <li>Use the Route Plan to optimize redistribution</li>
          <li>Update expiration dates when restocking</li>
        </ul>
      </div>
    </div>
  );
}

// ============================================
// HOME & APP
// ============================================

function Home() {
  return (
    <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div>
        <h1 style={{ fontSize: '48px', margin: '0 0 16px 0' }}>
          <span style={{ color: theme.primary }}>IDDI</span>
        </h1>
        <p style={{ color: theme.textSecondary, fontSize: '18px', margin: '0 0 48px 0' }}>
          Vending Machine Planogram Management
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link to="/vendor/login" style={{
            ...styles.button,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '16px 32px',
            fontSize: '16px'
          }}>
            📊 Vendor Portal
          </Link>
        </div>

        <p style={{ color: theme.textMuted, marginTop: '48px', fontSize: '14px' }}>
          Customers: Scan the QR code on any machine to vote
        </p>
      </div>
    </div>
  );
}

// ============================================
// GOOGLE AUTH CALLBACK COMPONENT (for mobile/Safari redirect flow)
// ============================================
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
        // Send id_token to backend (same endpoint as popup flow)
        const result = await authAPI.vendorGoogleLogin({ credential: idToken });
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
          <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: theme.textSecondary }}>Completing Google sign-in...</p>
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

// ============================================
// PROTECTED ROUTE COMPONENT
// ============================================
// Decode JWT payload without verification (for optimistic local check)
function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload;
  } catch {
    return null;
  }
}

function ProtectedRoute({ children }) {
  // 'optimistic' = rendered based on local JWT check, verifying in background
  // true = fully verified, false = not authenticated
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Optimistic: check JWT locally on first render
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    if (!token || userType !== 'vendor') return null;
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.exp) return null;
    // If token expires in the future, optimistically render
    if (payload.exp * 1000 > Date.now()) return 'optimistic';
    return null;
  });

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const userType = localStorage.getItem('userType');

      if (!token || userType !== 'vendor') {
        localStorage.removeItem('token');
        localStorage.removeItem('userType');
        setIsAuthenticated(false);
        return;
      }

      try {
        // Verify token with backend (background check)
        await authAPI.verify();
        setIsAuthenticated(true);
      } catch (error) {
        // Token invalid on server - try refresh before kicking out
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          // The interceptor will handle refresh automatically on next API call
          // Just mark as failed so user gets redirected
        }
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userType');
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Show loading only if we couldn't do an optimistic check
  if (isAuthenticated === null) {
    return (
      <div style={{
        ...styles.page,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${theme.border}`,
            borderTopColor: theme.primary,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: theme.textSecondary }}>Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (isAuthenticated === false) {
    return <Navigate to="/vendor/login" replace />;
  }

  // Render immediately for 'optimistic' or true
  return children;
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />

            {/* Auth Callback Routes */}
            <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />

            {/* Vendor Auth Routes (Public) */}
            <Route path="/vendor/login" element={<VendorLogin />} />
            <Route path="/vendor/verify-email" element={<EmailVerification />} />
            <Route path="/vendor/forgot-password" element={<ForgotPassword />} />
            <Route path="/vendor/reset-password" element={<ResetPassword />} />

            {/* Vendor Protected Routes */}
            <Route path="/vendor/dashboard" element={<ProtectedRoute><VendorDashboard /></ProtectedRoute>} />
            <Route path="/vendor/machines/:id" element={<ProtectedRoute><MachineDetails /></ProtectedRoute>} />
            <Route path="/vendor/polls/:pollId/results" element={<ProtectedRoute><PollResults /></ProtectedRoute>} />
            <Route path="/vendor/poll-summary" element={<ProtectedRoute><PollSummary /></ProtectedRoute>} />
            <Route path="/vendor/top-products" element={<ProtectedRoute><TopProducts /></ProtectedRoute>} />
            <Route path="/vendor/analytics" element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} />
            <Route path="/vendor/route-plan" element={<ProtectedRoute><RoutePlan /></ProtectedRoute>} />
            <Route path="/vendor/suggestions" element={<ProtectedRoute><Suggestions /></ProtectedRoute>} />
            <Route path="/vendor/expiring" element={<ProtectedRoute><ExpiringProducts /></ProtectedRoute>} />

            {/* Customer Routes (Anonymous) */}
            <Route path="/customer/machine/:qr_token" element={<CustomerMachine />} />

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
