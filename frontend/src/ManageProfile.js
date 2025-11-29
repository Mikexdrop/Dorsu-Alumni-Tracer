import React, { useState } from 'react';
import { useToast } from './Toast';

// Lightweight ManageProfile helper component that exposes a small "Create Additional admin" form.
// Usage: <ManageProfileCreateAdmin onCreated={() => refreshUsers()} />
export default function ManageProfileCreateAdmin({ onCreated, fetchUsers }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { show } = useToast() || { show: () => {} };

  const handleSubmit = async (e) => {
    e && e.preventDefault && e.preventDefault();
    setError('');
    if (!username || !password) return setError('Please provide username and password');
    if (password !== confirm) return setError('Passwords do not match');
    setLoading(true);
    try {
      const base = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';
      const url = `${base}/api/admins/`;
      const token = localStorage.getItem('token');
      // Some backends require email/full_name fields; allow optional entry and
      // auto-fill full name from username when left blank.
      const payload = { username, password, user_type: 'admin', email: (email || ''), full_name: (fullName || username || '') };
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const d = await res.json(); msg = d.detail || JSON.stringify(d); } catch(_) { try { msg = await res.text(); } catch(_) {} }
        setError('Create failed: ' + msg);
        return;
      }
      const data = await res.json().catch(() => null);
      try { show('success', 'New admin account created'); } catch (_) {}
  setUsername(''); setPassword(''); setConfirm(''); setFullName(''); setEmail('');
      if (typeof onCreated === 'function') onCreated(data);
      if (typeof fetchUsers === 'function') fetchUsers();
      // Notify other panels (UserManagementPanel) that a new admin was created so they can update immediately
      try {
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('admin-created', { detail: data }));
          // Also ask the app to open the User Management panel and focus the created account
          window.dispatchEvent(new CustomEvent('open-user-management', { detail: { username: (data && (data.username || data.user_name || data.email)) || '', email: (data && data.email) || '' } }));
        }
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error('Create admin failed', err);
      setError('Create admin failed: ' + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 6px 18px rgba(2,6,23,0.04)' }}>
      <h4 style={{ marginTop: 0 }}>Create additional admin</h4>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexDirection: 'column' }}>
          <label style={{ fontSize: 13, marginBottom: 6 }}>Username</label>
          <input placeholder="Username" className="form-input" value={username} onChange={e => { const v = e.target.value; setUsername(v); if (!fullName) setFullName(v); }} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexDirection: 'column' }}>
          <label style={{ fontSize: 13, marginBottom: 6 }}>Full name</label>
          <input placeholder="Full name" className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexDirection: 'column' }}>
          <label style={{ fontSize: 13, marginBottom: 6 }}>Email</label>
          <input placeholder="Email" type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input placeholder="Password" type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input placeholder="Confirm password" type="password" className="form-input" value={confirm} onChange={e => setConfirm(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating…' : 'Create admin'}</button>
        </div>
      </form>
    </div>
  );
}
