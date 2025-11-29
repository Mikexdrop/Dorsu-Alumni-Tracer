import React from 'react';

export default function PostModalHeader({ title, createdAt, onClose }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2 style={{ margin: 0, fontSize: 22, lineHeight: 1.12, color: '#071033' }}>{title}</h2>
        <div style={{ color: '#64748b', marginTop: 6, fontSize: 13 }}>{createdAt}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={onClose} aria-label="Close" title="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 20 }}>✕</button>
      </div>
    </div>
  );
}
