import React from 'react';
import PropTypes from 'prop-types';

const theme = {
  primary: '#8b5cf6',
  bg: '#0f0f0f',
  surface: '#1a1a1a',
  text: '#ffffff',
  textSecondary: '#a1a1aa',
};

function LoadingSpinner({ size = 'medium', message = '', fullPage = false }) {
  const sizes = {
    small: { spinner: 24, border: 3 },
    medium: { spinner: 40, border: 4 },
    large: { spinner: 64, border: 5 },
  };

  const { spinner: spinnerSize, border: borderWidth } = sizes[size] || sizes.medium;

  const spinnerStyle = {
    width: spinnerSize,
    height: spinnerSize,
    border: `${borderWidth}px solid ${theme.surface}`,
    borderTop: `${borderWidth}px solid ${theme.primary}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };

  const containerStyle = fullPage
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.bg,
        zIndex: 9999,
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      };

  return (
    <div style={containerStyle}>
      <div style={spinnerStyle} />
      {message && (
        <p style={{
          marginTop: '16px',
          color: theme.textSecondary,
          fontSize: '14px',
        }}>
          {message}
        </p>
      )}
    </div>
  );
}

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  message: PropTypes.string,
  fullPage: PropTypes.bool,
};

function SkeletonLoader({ width = '100%', height = '20px', borderRadius = '4px', style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: theme.surface,
        animation: 'pulse 2s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

SkeletonLoader.propTypes = {
  width: PropTypes.string,
  height: PropTypes.string,
  borderRadius: PropTypes.string,
  style: PropTypes.object,
};

function SkeletonCard() {
  return (
    <div style={{
      padding: '16px',
      backgroundColor: theme.surface,
      borderRadius: '12px',
      border: `1px solid #2a2a2a`,
    }}>
      <SkeletonLoader height="24px" width="60%" style={{ marginBottom: '12px' }} />
      <SkeletonLoader height="16px" width="40%" style={{ marginBottom: '8px' }} />
      <SkeletonLoader height="16px" width="80%" />
    </div>
  );
}

function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: '16px', padding: '12px', borderBottom: `1px solid #2a2a2a` }}>
        {Array(columns).fill(null).map((_, i) => (
          <SkeletonLoader key={i} height="16px" width={`${100 / columns}%`} />
        ))}
      </div>
      {/* Rows */}
      {Array(rows).fill(null).map((_, rowIndex) => (
        <div key={rowIndex} style={{ display: 'flex', gap: '16px', padding: '12px' }}>
          {Array(columns).fill(null).map((_, colIndex) => (
            <SkeletonLoader key={colIndex} height="14px" width={`${100 / columns}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}

SkeletonTable.propTypes = {
  rows: PropTypes.number,
  columns: PropTypes.number,
};

export { LoadingSpinner, SkeletonLoader, SkeletonCard, SkeletonTable };
export default LoadingSpinner;
