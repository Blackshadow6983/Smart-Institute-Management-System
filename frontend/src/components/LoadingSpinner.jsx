import React from 'react';

export function LoadingSpinner({ message = 'Loading institutional records...' }) {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <span>{message}</span>
    </div>
  );
}
