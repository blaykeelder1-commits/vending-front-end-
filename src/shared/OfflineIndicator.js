import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { getPendingMutationCount } from '../services/offlineDb';
import { theme } from './theme';

function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isOnline) {
      const updateCount = async () => {
        try {
          const count = await getPendingMutationCount();
          setPendingCount(count);
        } catch {
          // IndexedDB not available
        }
      };
      updateCount();
      const interval = setInterval(updateCount, 5000);
      return () => clearInterval(interval);
    }
  }, [isOnline]);

  if (isOnline) return null;

  return (
    <div style={{
      background: theme.warning + '20',
      borderBottom: `1px solid ${theme.warning}`,
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontSize: '13px',
      color: theme.warning,
      fontWeight: '500',
    }}>
      <span>You're offline — showing cached data</span>
      {pendingCount > 0 && (
        <span style={{
          backgroundColor: theme.warning,
          color: '#000',
          borderRadius: '10px',
          padding: '1px 8px',
          fontSize: '11px',
          fontWeight: '700',
        }}>
          {pendingCount} pending
        </span>
      )}
    </div>
  );
}

export default OfflineIndicator;
