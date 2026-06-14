import { useState, useEffect } from 'react';

export const theme = {
  bg: '#0a0e12',
  surface: '#121821',
  surfaceHover: '#1b2430',
  border: '#27323f',
  primary: '#0c8a7e',       // Saturated teal — approach + arousing (Mehta-Zhu / Valdez-Mehrabian)
  primaryHover: '#0a7368',
  secondary: '#ff9f1c',     // Complementary amber — high-contrast CTA / poll accent
  success: '#22c55e',
  danger: '#ef4444',        // Reserved for losses/alerts (avoidance + detail focus)
  warning: '#fbbf24',
  text: '#eef2f4',
  textSecondary: '#9fb0bb',
  textMuted: '#677884',
};

export const styles = {
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
    borderRadius: '8px',
    padding: '16px',
  },
  flexCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flexColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  textCenter: {
    textAlign: 'center',
  },
  textSecondary: {
    color: theme.textSecondary,
    fontSize: '14px',
  },
  textMuted: {
    color: theme.textMuted,
    fontSize: '13px',
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
  },
  button: {
    padding: '12px 16px',
    minHeight: '44px',
    boxSizing: 'border-box',
    backgroundColor: theme.primary,
    color: 'white',
    border: 'none',
    borderRadius: '6px',
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
    borderRadius: '6px',
    color: theme.text,
    fontSize: '16px',
    boxSizing: 'border-box',
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

// Custom hook for responsive detection
export function useIsMobile(breakpoint = 768) {
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
