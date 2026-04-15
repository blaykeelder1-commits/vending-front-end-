import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { startKeepAlive, stopKeepAlive, clearVendorCache, vendorAPI } from '../services/api';
import { theme, useIsMobile } from './theme';
import OfflineIndicator from './OfflineIndicator';
import HelpWidget from '../components/HelpWidget';

function VendorLayout({ children }) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  // Keep backend alive while vendor is using the app
  useEffect(() => {
    startKeepAlive();
    return () => stopKeepAlive();
  }, []);

  const handleLogout = () => {
    stopKeepAlive();
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userType');
    clearVendorCache();
    navigate('/vendor/login');
  };

  // Fetch subscription tier for badge display
  const [tier, setTier] = useState(null);
  useEffect(() => {
    vendorAPI.getSubscriptionStatus()
      .then(res => setTier(res.data?.data?.tier))
      .catch(() => {});
  }, []);

  if (!isMobile) {
    return <><OfflineIndicator />{children}<HelpWidget /></>;
  }

  const navItems = [
    { to: '/vendor/dashboard', label: 'Home', icon: '\u2302' },
    { to: '/vendor/inventory', label: 'Inventory', icon: '\u{1F4E6}' },
    { to: '/vendor/route-plan', label: 'Routes', icon: '\u{1F5FA}' },
    { to: '/vendor/top-products', label: 'Top 50', icon: '\u2B50' },
    { to: '/vendor/poll-summary', label: 'Shop', icon: '\u{1F6D2}' },
    { to: '/vendor/analytics', label: 'Stats', icon: '\u{1F4CA}' },
  ];

  return (
    <>
      {/* Top header bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '56px',
        background: `linear-gradient(135deg, ${theme.surface} 0%, #1e1e38 100%)`,
        borderBottom: `1px solid ${theme.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 1001,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            background: `linear-gradient(135deg, ${theme.primary}, #9b8df8)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '800',
            fontSize: '20px',
            letterSpacing: '3px',
          }}>IDDI</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {tier && tier !== 'free' && (
            <button
              onClick={() => navigate('/vendor/subscription')}
              style={{
                background: `${theme.primary}20`,
                border: 'none',
                color: theme.primary,
                fontSize: '11px',
                fontWeight: '700',
                padding: '4px 10px',
                borderRadius: '12px',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tier}
            </button>
          )}
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${theme.border}`,
              color: theme.textSecondary,
              fontSize: '13px',
              padding: '6px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              minHeight: '36px',
              transition: 'background 0.15s',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
      <OfflineIndicator />
      <div style={{ paddingTop: '64px', paddingBottom: '80px' }}>
        {children}
      </div>

      {/* Bottom navigation */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: `linear-gradient(180deg, ${theme.surface} 0%, #161628 100%)`,
        borderTop: `1px solid ${theme.border}`,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'stretch',
        zIndex: 999,
        paddingTop: '2px',
        paddingBottom: 'max(4px, env(safe-area-inset-bottom))',
        paddingLeft: '4px',
        paddingRight: '4px',
      }}>
        {navItems.map(item => {
          const isActive = location.pathname === item.to;
          return (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              style={{
                background: 'none',
                border: 'none',
                color: isActive ? '#f0f0f5' : '#6b6b85',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                fontSize: '10px',
                padding: '6px 2px 4px',
                minHeight: '50px',
                flex: 1,
                cursor: 'pointer',
                fontWeight: isActive ? '600' : '400',
                letterSpacing: '0.2px',
                position: 'relative',
                borderTop: isActive ? `2px solid ${theme.primary}` : '2px solid transparent',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              <span style={{
                fontSize: '18px',
                lineHeight: '1',
                filter: isActive ? 'none' : 'grayscale(80%)',
                opacity: isActive ? 1 : 0.7,
              }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
      <HelpWidget />
    </>
  );
}

export default VendorLayout;
