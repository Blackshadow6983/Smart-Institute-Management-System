import React from 'react';

export function StatusBadge({ status, type }) {
  let badgeClass = 'badge-info';
  const s = (status || '').toLowerCase();

  if (type) {
    badgeClass = `badge-${type}`;
  } else if (s.includes('active') || s.includes('approved') || s.includes('paid') || s.includes('pass') || s.includes('present')) {
    badgeClass = 'badge-success';
  } else if (s.includes('pending') || s.includes('partial') || s.includes('due') || s.includes('warning')) {
    badgeClass = 'badge-pending';
  } else if (s.includes('failed') || s.includes('rejected') || s.includes('absent') || s.includes('overdue')) {
    badgeClass = 'badge-danger';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      {status}
    </span>
  );
}
