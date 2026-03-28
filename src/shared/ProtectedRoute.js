import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { theme, styles } from './theme';

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

export default ProtectedRoute;
