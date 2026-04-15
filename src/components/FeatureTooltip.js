import React, { useState, useEffect, useRef } from 'react';
import { theme } from '../shared/theme';

const STORAGE_PREFIX = 'iddi_tip_';

/**
 * First-time contextual tooltip. Shows once per feature, dismissed via click or X.
 * Stored in localStorage so it never reappears.
 *
 * Usage:
 *   <FeatureTooltip id="machines" text="Your machines appear here..." position="bottom">
 *     <h2>Vending Machines</h2>
 *   </FeatureTooltip>
 */
function FeatureTooltip({ id, text, children, position = 'bottom' }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const dismissTimerRef = useRef(null);

  useEffect(() => {
    const key = STORAGE_PREFIX + id;
    if (!localStorage.getItem(key)) {
      setDismissed(false);
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, [id]);

  useEffect(() => {
    return () => clearTimeout(dismissTimerRef.current);
  }, []);

  const dismiss = (e) => {
    if (e) e.stopPropagation();
    setVisible(false);
    localStorage.setItem(STORAGE_PREFIX + id, '1');
    dismissTimerRef.current = setTimeout(() => setDismissed(true), 300);
  };

  if (dismissed) return children;

  const positions = {
    bottom: { top: '100%', left: '0', marginTop: '8px' },
    top: { bottom: '100%', left: '0', marginBottom: '8px' },
    right: { top: '0', left: '100%', marginLeft: '8px' },
  };

  const arrowPositions = {
    bottom: {
      top: '-6px', left: '20px',
      borderLeft: '6px solid transparent',
      borderRight: '6px solid transparent',
      borderBottom: `6px solid ${theme.primary}40`,
    },
    top: {
      bottom: '-6px', left: '20px',
      borderLeft: '6px solid transparent',
      borderRight: '6px solid transparent',
      borderTop: `6px solid ${theme.primary}40`,
    },
    right: {
      top: '12px', left: '-6px',
      borderTop: '6px solid transparent',
      borderBottom: '6px solid transparent',
      borderRight: `6px solid ${theme.primary}40`,
    },
  };

  return (
    <div style={{ position: 'relative' }}>
      {children}
      <div style={{
        position: 'absolute',
        ...positions[position],
        zIndex: 50,
        maxWidth: '280px',
        minWidth: '200px',
        background: theme.surface,
        border: `1px solid ${theme.primary}40`,
        borderRadius: '10px',
        padding: '12px 14px',
        boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 20px ${theme.primary}10`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
        transition: 'all 0.3s ease',
        pointerEvents: visible ? 'auto' : 'none',
      }}>
        {/* Arrow */}
        <div style={{
          position: 'absolute',
          width: 0, height: 0,
          ...arrowPositions[position],
        }} />
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <div style={{
            width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
            background: theme.primary + '20', color: theme.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: '700', marginTop: '1px',
          }}>
            ?
          </div>
          <p style={{
            margin: 0, fontSize: '13px', color: theme.textSecondary,
            lineHeight: '1.5', flex: 1,
          }}>
            {text}
          </p>
          <button
            onClick={dismiss}
            style={{
              background: 'none', border: 'none', color: theme.textMuted,
              cursor: 'pointer', fontSize: '14px', padding: '0 2px',
              flexShrink: 0, lineHeight: 1,
            }}
            aria-label="Dismiss tip"
          >
            ✕
          </button>
        </div>
        <button
          onClick={dismiss}
          style={{
            marginTop: '8px', width: '100%',
            background: theme.primary + '15', color: theme.primary,
            border: `1px solid ${theme.primary}30`, borderRadius: '6px',
            padding: '6px', fontSize: '12px', fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}

/**
 * Inline variant — renders the tooltip as a subtle banner below the target,
 * no absolute positioning needed. Better for sections that don't have relative parents.
 */
export function FeatureTipBanner({ id, text }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const dismissTimerRef = useRef(null);

  useEffect(() => {
    const key = STORAGE_PREFIX + id;
    if (!localStorage.getItem(key)) {
      setDismissed(false);
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, [id]);

  useEffect(() => {
    return () => clearTimeout(dismissTimerRef.current);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_PREFIX + id, '1');
    dismissTimerRef.current = setTimeout(() => setDismissed(true), 300);
  };

  if (dismissed) return null;

  return (
    <div style={{
      background: theme.primary + '08',
      border: `1px solid ${theme.primary}25`,
      borderRadius: '10px',
      padding: '10px 14px',
      marginBottom: '12px',
      display: 'flex', alignItems: 'center', gap: '10px',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(-4px)',
      transition: 'all 0.3s ease',
    }}>
      <div style={{
        width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
        background: theme.primary + '20', color: theme.primary,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px', fontWeight: '700',
      }}>
        ?
      </div>
      <p style={{
        margin: 0, fontSize: '13px', color: theme.textSecondary,
        lineHeight: '1.4', flex: 1,
      }}>
        {text}
      </p>
      <button
        onClick={dismiss}
        style={{
          background: theme.primary + '15', color: theme.primary,
          border: `1px solid ${theme.primary}30`, borderRadius: '6px',
          padding: '4px 10px', fontSize: '11px', fontWeight: '600',
          cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
        }}
      >
        Got it
      </button>
    </div>
  );
}

export default FeatureTooltip;
