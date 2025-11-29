import React from 'react';
import { Link } from 'react-router-dom';

export default function FacultyPlaceholder({ label }) {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ maxWidth: 900, width: '100%', textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: 32, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', color: '#fff' }}>
        <h1 style={{ color: '#ffd600', marginBottom: 12 }}>{label}</h1>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.9)' }}>This is a placeholder page for {label}. Replace this component with real faculty content when ready.</p>
        <div style={{ marginTop: 18 }}>
          <Link to="/academics" style={{ color: '#1976d2', textDecoration: 'underline' }}>Back to Academics</Link>
        </div>
      </div>
    </div>
  );
}
