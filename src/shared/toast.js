import React, { useState, useCallback, useContext, createContext } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export function ToastProvider({ children }) {
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

const ToastContainer = React.memo(function ToastContainer({ toasts }) {
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
});

const Toast = React.memo(function Toast({ message, type }) {
  const colors = {
    success: { bg: '#34d39920', border: '#34d399', text: '#34d399' },
    error: { bg: '#f8717120', border: '#f87171', text: '#f87171' },
    info: { bg: '#7c6df020', border: '#7c6df0', text: '#7c6df0' },
    warning: { bg: '#fbbf2420', border: '#fbbf24', text: '#fbbf24' },
  };
  const color = colors[type] || colors.info;

  return (
    <div style={{
      padding: '12px 20px',
      backgroundColor: '#1a1a2e',
      border: `1px solid ${color.border}`,
      borderLeft: `4px solid ${color.border}`,
      borderRadius: '6px',
      color: color.text,
      minWidth: '280px',
      maxWidth: '400px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      animation: 'slideIn 0.3s ease-out',
    }}>
      {message}
    </div>
  );
});
