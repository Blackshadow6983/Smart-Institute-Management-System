import React from 'react';
import { FolderOpen } from 'lucide-react';

export function EmptyState({ icon: Icon = FolderOpen, title = 'No records found', description = 'There are no entries available for this view.', action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={36} strokeWidth={1.5} />
      </div>
      <div className="empty-state-title">{title}</div>
      <div className="empty-state-desc">{description}</div>
      {action && <div style={{ marginTop: '1rem' }}>{action}</div>}
    </div>
  );
}
