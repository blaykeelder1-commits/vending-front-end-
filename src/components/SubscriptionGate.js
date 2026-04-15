import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { vendorAPI } from '../services/api';
import { theme } from '../shared/theme';

/**
 * SubscriptionGate — checks if user can add more machines.
 * If at limit, renders an upgrade prompt instead of children.
 * Usage: <SubscriptionGate>{(canAdd) => canAdd ? <AddMachineForm /> : null}</SubscriptionGate>
 */
function SubscriptionGate({ children, onBlocked }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const mountedRef = useRef(true);
  const blockedFired = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    vendorAPI.getSubscriptionStatus()
      .then(res => { if (mountedRef.current) setStatus(res.data?.data); })
      .catch(() => { if (mountedRef.current) setStatus({ tier: 'free', machineLimit: 1, machinesUsed: 0 }); })
      .finally(() => { if (mountedRef.current) setLoading(false); });
    return () => { mountedRef.current = false; };
  }, []);

  // Fire onBlocked callback outside render to avoid nested setState
  const atLimit = status ? status.machinesUsed >= status.machineLimit : false;
  useEffect(() => {
    if (atLimit && onBlocked && !blockedFired.current) {
      blockedFired.current = true;
      onBlocked(status);
    }
  }, [atLimit, onBlocked, status]);

  if (loading) {
    return (
      <div style={{
        backgroundColor: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: '12px',
        padding: '32px',
        textAlign: 'center',
        marginBottom: '16px',
      }}>
        <div style={{ color: theme.textMuted, fontSize: '14px' }}>Checking plan limits...</div>
      </div>
    );
  }

  if (!status) return null;

  if (!atLimit) {
    return typeof children === 'function' ? children(true) : children;
  }

  // At limit — if onBlocked is set, render children with false
  if (onBlocked) {
    return typeof children === 'function' ? children(false) : children;
  }

  // Default upgrade prompt
  return (
    <div style={{
      backgroundColor: theme.surface,
      border: `1px solid ${theme.primary}40`,
      borderRadius: '12px',
      padding: '24px',
      textAlign: 'center',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        backgroundColor: `${theme.primary}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
        fontSize: '24px',
      }}>
        +
      </div>
      <h3 style={{ color: theme.text, margin: '0 0 8px', fontSize: '18px', fontWeight: '700' }}>
        Ready for Machine #{status.machinesUsed + 1}?
      </h3>
      <p style={{ color: theme.textSecondary, fontSize: '14px', margin: '0 0 20px', lineHeight: '1.6' }}>
        Your {status.tier} plan supports {status.machineLimit} machine{status.machineLimit > 1 ? 's' : ''}.
        Upgrade to add more machines and unlock advanced features.
      </p>
      <button
        onClick={() => navigate('/pricing')}
        style={{
          backgroundColor: theme.primary,
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 24px',
          fontSize: '15px',
          fontWeight: '600',
          cursor: 'pointer',
        }}
      >
        View Plans
      </button>
    </div>
  );
}

export default SubscriptionGate;
