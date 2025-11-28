import React, { useEffect, useState } from 'react';
import programs from './programs';
import { useNavigate } from 'react-router-dom';

// AlumniProfilePanel
// - Loads current alumni profile by `userId` prop or from localStorage `userId`
// - Displays editable fields (username, email, full_name and any other keys returned)
// - Allows saving changes (PATCH), deleting account (DELETE), and uploading an image (PATCH multipart with field `image`)
// Backend expectations (adjust paths/field names if your backend differs):
// GET/PATCH/DELETE: http://127.0.0.1:8000/api/alumni/<id>/
// Auth: Authorization: Bearer <token> from localStorage

function AlumniProfilePanel({ userId: propUserId, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // toast state
  const [toast, setToast] = useState(null);
  // Password management state
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  // visibility toggles for password fields
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  // activeUserId: prioritized source for profile loading
  // 1) explicit propUserId
  // 2) localStorage.userId
  // 3) auto-discovered via /api/users/me or /api/auth/user/
  const [activeUserId, setActiveUserId] = useState(() => {
    if (propUserId) return String(propUserId);
    const storedId = localStorage.getItem('userId');
    if (storedId) return storedId;
    const cur = localStorage.getItem('currentUser');
    if (cur) {
      try {
        const obj = JSON.parse(cur);
        return String(obj.id ?? (obj.user && obj.user.id) ?? obj.pk ?? '');
      } catch (_) {
        return '';
      }
    }
    return '';
  });
  const [discovering] = useState(false);

  // NOTE: removed automatic discovery via `/api/users/*` endpoints because this backend
  // does not expose those routes and they caused noisy 404s in the server logs.
  // The component falls back to the manual discovery UI below (enter user id) when
  // `activeUserId` is not present in localStorage or props.

  // Fetch profile when activeUserId changes
  useEffect(() => {
    if (!activeUserId) return;
    async function fetchProfile() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/alumni/${activeUserId}/`);
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        setProfile(data);
        setForm(data);
      } catch (err) {
        setError('Failed to load profile: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [activeUserId]);

  // Refresh profile from server and update local storage + notify other components
  async function refreshProfile() {
    if (!activeUserId) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://127.0.0.1:8000/api/alumni/${activeUserId}/` , { headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}) } });
      if (!res.ok) throw new Error('Failed to refresh profile');
      const data = await res.json();
      setProfile(data);
      setForm(data);
      try {
        const base = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';
        function ensureAbsImage(obj) {
          if (!obj) return obj;
          try {
            if (typeof obj.image === 'string') {
              const s = obj.image.trim();
              if (s && s.startsWith('/')) obj.image = `${base}${s}`;
            } else if (obj.image && typeof obj.image === 'object' && typeof obj.image.url === 'string') {
              const s = obj.image.url.trim();
              if (s && s.startsWith('/')) obj.image = `${base}${s}`; else obj.image = s;
            }
            if (obj.profile && typeof obj.profile === 'object') {
              if (typeof obj.profile.image === 'string') {
                const s2 = obj.profile.image.trim();
                if (s2 && s2.startsWith('/')) obj.profile.image = `${base}${s2}`;
              } else if (obj.profile.image && typeof obj.profile.image === 'object' && typeof obj.profile.image.url === 'string') {
                const s2 = obj.profile.image.url.trim();
                if (s2 && s2.startsWith('/')) obj.profile.image = `${base}${s2}`; else obj.profile.image = s2;
              }
            }
          } catch (_) {}
          return obj;
        }
        const norm = ensureAbsImage(data);
        localStorage.setItem('currentUser', JSON.stringify(norm));
        window.dispatchEvent(new CustomEvent('user-updated', { detail: norm }));
      } catch (_) {}
    } catch (err) {
      setError('Failed to refresh profile: ' + (err && err.message ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }


  function onChangeField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave(e) {
    e && e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      // If the user selected an imageFile, upload via multipart FormData (image + fields)
      if (imageFile) {
        const formData = new FormData();
        for (const [k, v] of Object.entries(form)) {
          // never send the `image` key from the form object; we send the actual file only
          if (k === 'image') continue;
          if (v == null) continue;
          // skip File/Blob-like values (we'll append the actual file below)
          if (typeof File !== 'undefined' && v instanceof File) continue;
          if (typeof Blob !== 'undefined' && v instanceof Blob) continue;
          if (typeof v === 'object' && (('size' in v && typeof v.size === 'number') || ('name' in v && typeof v.name === 'string'))) continue;
          formData.append(k, String(v));
        }
        // append the actual image file selected by the user
        formData.append('image', imageFile);
        const res = await fetch(`http://127.0.0.1:8000/api/alumni/${activeUserId}/`, {
          method: 'PATCH',
          headers: {
            ...(token ? { Authorization: 'Bearer ' + token } : {})
            // Do NOT set Content-Type; browser will set multipart boundary
          },
          body: formData
        });
        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try { const d = await res.json(); msg = d.detail || JSON.stringify(d); } catch(_) { try { msg = await res.text(); } catch(_){} }
          throw new Error(msg);
        }
  const updated = await res.json();
  setProfile(updated);
  setForm(updated);
  // show non-blocking toast
  try { setToast({ message: 'Profile saved successfully', type: 'success' }); setTimeout(() => setToast(null), 3500); } catch (_) {}
        try {
          // Normalize any relative image paths into absolute URLs so the header
          // avatar code can preload them after a full page refresh.
          const base = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';
          function ensureAbsImage(obj) {
            if (!obj) return obj;
            try {
              if (typeof obj.image === 'string') {
                const s = obj.image.trim();
                if (s && s.startsWith('/')) obj.image = `${base}${s}`;
              } else if (obj.image && typeof obj.image === 'object' && typeof obj.image.url === 'string') {
                const s = obj.image.url.trim();
                if (s && s.startsWith('/')) obj.image = `${base}${s}`; else obj.image = s;
              }
              if (obj.profile && typeof obj.profile === 'object') {
                if (typeof obj.profile.image === 'string') {
                  const s2 = obj.profile.image.trim();
                  if (s2 && s2.startsWith('/')) obj.profile.image = `${base}${s2}`;
                } else if (obj.profile.image && typeof obj.profile.image === 'object' && typeof obj.profile.image.url === 'string') {
                  const s2 = obj.profile.image.url.trim();
                  if (s2 && s2.startsWith('/')) obj.profile.image = `${base}${s2}`; else obj.profile.image = s2;
                }
              }
            } catch (_) {}
            return obj;
          }
          const norm = ensureAbsImage(updated);
          // update local cache of currentUser so header/avatar can reflect changes
          localStorage.setItem('currentUser', JSON.stringify(norm));
          // notify other parts of the app in the same window
          window.dispatchEvent(new CustomEvent('user-updated', { detail: norm }));
        } catch (_) {}
        setImageFile(null);
      } else {
        // No image selected -> send JSON payload (strip any file-like values)
  const payload = { ...form };
  // never include the `image` url/field in JSON saves — backend expects files for image
  if ('image' in payload) delete payload.image;
        function isFileLike(v) {
          if (!v) return false;
          if (typeof File !== 'undefined' && v instanceof File) return true;
          if (typeof Blob !== 'undefined' && v instanceof Blob) return true;
          return (typeof v === 'object') && (('size' in v && typeof v.size === 'number') || ('name' in v && typeof v.name === 'string'));
        }
        for (const k of Object.keys(payload)) {
          if (isFileLike(payload[k])) delete payload[k];
        }
        const res = await fetch(`http://127.0.0.1:8000/api/alumni/${activeUserId}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: 'Bearer ' + token } : {})
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try { const d = await res.json(); msg = d.detail || JSON.stringify(d); } catch(_) { try { msg = await res.text(); } catch(_){} }
          throw new Error(msg);
        }
  const updated = await res.json();
  setProfile(updated);
  setForm(updated);
  // show non-blocking toast
  try { setToast({ message: 'Profile saved successfully', type: 'success' }); setTimeout(() => setToast(null), 3500); } catch (_) {}
        try {
          const base = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';
          function ensureAbsImage(obj) {
            if (!obj) return obj;
            try {
              if (typeof obj.image === 'string') {
                const s = obj.image.trim();
                if (s && s.startsWith('/')) obj.image = `${base}${s}`;
              } else if (obj.image && typeof obj.image === 'object' && typeof obj.image.url === 'string') {
                const s = obj.image.url.trim();
                if (s && s.startsWith('/')) obj.image = `${base}${s}`; else obj.image = s;
              }
              if (obj.profile && typeof obj.profile === 'object') {
                if (typeof obj.profile.image === 'string') {
                  const s2 = obj.profile.image.trim();
                  if (s2 && s2.startsWith('/')) obj.profile.image = `${base}${s2}`;
                } else if (obj.profile.image && typeof obj.profile.image === 'object' && typeof obj.profile.image.url === 'string') {
                  const s2 = obj.profile.image.url.trim();
                  if (s2 && s2.startsWith('/')) obj.profile.image = `${base}${s2}`; else obj.profile.image = s2;
                }
              }
            } catch (_) {}
            return obj;
          }
          const norm = ensureAbsImage(updated);
          localStorage.setItem('currentUser', JSON.stringify(norm));
          window.dispatchEvent(new CustomEvent('user-updated', { detail: norm }));
        } catch (_) {}
      }
    } catch (err) {
      setError('Failed to save profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Change password handler: sends current/new password to a change-password endpoint
  async function handleChangePassword(e) {
    e && e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    // Basic client-side validation
    if (!currentPassword) return setPasswordError('Please enter your current password');
    if (!newPassword || newPassword.length < 8) return setPasswordError('New password must be at least 8 characters');
    if (newPassword !== confirmPassword) return setPasswordError('New password and confirmation do not match');

    setChangingPassword(true);
    try {
      const token = localStorage.getItem('token');
      // prefer an alumni-specific change endpoint, fall back to a generic auth endpoint
      const id = activeUserId;
      const endpoints = [];
      if (id) endpoints.push(`/api/alumni/${encodeURIComponent(id)}/change_password/`);
      endpoints.push(`/api/auth/change_password/`);

      let res = null;
      for (let i = 0; i < endpoints.length; i++) {
        const url = endpoints[i];
        try {
          res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: 'Bearer ' + token } : {})
            },
            body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
          });
        } catch (err) {
          // network error - try next endpoint
          res = null;
        }

        // If we got a response and it's a 404 or 405 from the alumni-specific endpoint,
        // treat it as non-fatal and continue to the next (generic) endpoint.
        if (res && (res.status === 404 || res.status === 405)) {
          // only skip when this is the alumni-specific URL (i.e. first endpoint)
          if (i === 0) {
            res = null; // force trying the next endpoint
            continue;
          }
        }

        if (res) break;
      }

      if (!res) throw new Error('Network error or no endpoint responded');
      if (!res.ok) {
        let msg = `Failed to change password (${res.status})`;
        try {
          const data = await res.json().catch(() => null);
          if (data && data.detail) msg = data.detail;
          else if (data && data.error) msg = data.error;
        } catch (_) {}
        throw new Error(msg);
      }

      setPasswordSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // clear success after a short delay
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err) {
      setPasswordError(err && err.message ? String(err.message) : 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleDelete() {
    // This function now assumes the user already confirmed via the in-UI modal
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://127.0.0.1:8000/api/alumni/${activeUserId}/`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: 'Bearer ' + token } : {})
        }
      });
      if (!res.ok) throw new Error('Failed to delete account');
      // Notify parent
      onDeleted && onDeleted();
      // Optionally clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      // redirect to home
      window.location.href = '/';
    } catch (err) {
      setError('Failed to delete account: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Image upload: send multipart/form-data with field 'image'
  async function handleImageUpload(e) {
    e && e.preventDefault();
    if (!imageFile) return setError('Please choose an image file first');
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', imageFile);
  const res = await fetch(`http://127.0.0.1:8000/api/alumni/${activeUserId}/`, {
        method: 'PATCH',
        headers: {
          ...(token ? { Authorization: 'Bearer ' + token } : {})
          // Do NOT set Content-Type; browser will set multipart boundary
        },
        body: formData
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const d = await res.json(); msg = d.detail || JSON.stringify(d); } catch(_) { try { msg = await res.text(); } catch(_){} }
        throw new Error(msg);
      }
      const updated = await res.json();
      setProfile(updated);
      setForm(updated);
      setImageFile(null);
        try {
          const base = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';
          function ensureAbsImage(obj) {
            if (!obj) return obj;
            try {
              if (typeof obj.image === 'string') {
                const s = obj.image.trim();
                if (s && s.startsWith('/')) obj.image = `${base}${s}`;
              } else if (obj.image && typeof obj.image === 'object' && typeof obj.image.url === 'string') {
                const s = obj.image.url.trim();
                if (s && s.startsWith('/')) obj.image = `${base}${s}`; else obj.image = s;
              }
              if (obj.profile && typeof obj.profile === 'object') {
                if (typeof obj.profile.image === 'string') {
                  const s2 = obj.profile.image.trim();
                  if (s2 && s2.startsWith('/')) obj.profile.image = `${base}${s2}`;
                } else if (obj.profile.image && typeof obj.profile.image === 'object' && typeof obj.profile.image.url === 'string') {
                  const s2 = obj.profile.image.url.trim();
                  if (s2 && s2.startsWith('/')) obj.profile.image = `${base}${s2}`; else obj.profile.image = s2;
                }
              }
            } catch (_) {}
            return obj;
          }
          const norm = ensureAbsImage(updated);
          localStorage.setItem('currentUser', JSON.stringify(norm));
          window.dispatchEvent(new CustomEvent('user-updated', { detail: norm }));
        } catch (_) {}
    } catch (err) {
      setError('Failed to upload image: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Close zoom on Escape
  useEffect(() => {
    if (!zoomedImage) return;
    function onKey(e) {
      if (e.key === 'Escape') setZoomedImage(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomedImage]);

  if (!activeUserId) {
    // show discovery UI when no id available
    return (
      <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 760, background: '#fff', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.08)', padding: 28 }}>
          <h2 style={{ margin: 0, marginBottom: 8, fontSize: 20 }}>My Profile</h2>
          <p style={{ color: '#555', marginTop: 0, marginBottom: 18 }}>Please sign in to manage your profile.</p>
          {discovering ? (
            <div style={{ padding: 18, textAlign: 'center', color: '#666' }}>Trying to discover your account…</div>
          ) : (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Enter user id (for testing)</label>
                <input value={activeUserId} onChange={e => setActiveUserId(e.target.value)} style={{ padding: 10, width: '100%', borderRadius: 8, border: '1px solid #ddd' }} />
                <div style={{ marginTop: 10 }}>
                  <button onClick={() => { if (activeUserId) { localStorage.setItem('userId', String(activeUserId)); window.location.reload(); } }} className="btn btn-primary">Load</button>
                </div>
              </div>
              <div style={{ color: '#666', minWidth: 220 }}>Tip: set <code>localStorage.userId</code> to your alumni id or sign in normally.</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden', background: 'linear-gradient(135deg, #0f2c3e 0%, #1a4b6d 50%, #2a6b97 100%)' }}>
      {/* Loading overlay */}
      {loading && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 4500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.98)', padding: 18, borderRadius: 12, display: 'flex', gap: 12, alignItems: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            <svg width="28" height="28" viewBox="0 0 50 50" style={{ animation: 'spin 900ms linear infinite' }}>
              <circle cx="25" cy="25" r="20" fill="none" stroke="#0b74de" strokeWidth="4" strokeLinecap="round" strokeDasharray="31.4 31.4" transform="rotate(-90 25 25)" />
            </svg>
            <div style={{ fontSize: 15, color: '#0f1724' }}>Saving profile…</div>
          </div>
        </div>
      )}
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 18, right: 18, zIndex: 4600 }}>
          <div style={{ background: toast.type === 'success' ? '#0f1724' : '#111827', color: '#f8efe6', padding: '12px 16px', borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.25)', minWidth: 220 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{toast.type === 'success' ? 'Success' : 'Notice'}</div>
            <div style={{ fontSize: 14 }}>{toast.message}</div>
          </div>
        </div>
      )}
      {/* Decorative background copied from ConsentHome */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 10% 20%, rgba(37, 85, 124, 0.3) 0%, transparent 20%),
          radial-gradient(circle at 90% 70%, rgba(51, 105, 30, 0.25) 0%, transparent 20%),
          radial-gradient(circle at 50% 30%, rgba(25, 118, 210, 0.2) 0%, transparent 30%)
        `,
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '5%',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(51, 105, 30, 0.15) 0%, transparent 70%)',
        animation: 'float 15s ease-in-out infinite',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        top: '60%',
        right: '10%',
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(25, 118, 210, 0.1) 0%, transparent 70%)',
        animation: 'float 18s ease-in-out infinite reverse',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        left: '15%',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(211, 47, 47, 0.1) 0%, transparent 70%)',
        animation: 'float 12s ease-in-out infinite',
        zIndex: 0
      }} />
      <style>{`
        @keyframes float { 0% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-20px) rotate(5deg); } 100% { transform: translateY(0) rotate(0deg); } }
      `}</style>
  <section className="profile-section" style={{ position: 'relative', width: '100%', maxWidth: 1600, boxSizing: 'border-box', padding: '48px 24px', zIndex: 1 }}>
        <style>{`
          .profile-btn { transition: transform 260ms cubic-bezier(.2,.8,.2,1), box-shadow 260ms ease, filter 260ms ease; }
          .profile-btn:hover { transform: translateY(-6px) scale(1.02); box-shadow: 0 16px 40px rgba(0,0,0,0.18); filter: brightness(1.02); }
          .profile-btn:active { transform: translateY(-2px) scale(0.995); }
        `}</style>
        {/* Mobile / responsive tweaks */}
        <style>{`
          @media (max-width: 720px) {
            .profile-section { padding: 20px 12px !important; }
            .profile-layout { flex-direction: column !important; }
            .profile-main { min-width: unset !important; width: 100% !important; }
            aside.profile-aside { width: 100% !important; min-width: unset !important; margin-top: 16px !important; }
            .profile-grid { grid-template-columns: 1fr !important; }
            .profile-actions { flex-direction: column !important; gap: 8px !important; }
            .profile-actions .btn { width: 100% !important; }
            .profile-actions .btn.btn-danger { margin-left: 0 !important; }
            .profile-aside-image { width: 120px !important; height: 120px !important; }
            /* Reduce padding inside cards on small screens */
            .profile-main, aside.profile-aside { padding: 16px !important; }
          }
        `}</style>
        <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 1100 }}>
            <div className="profile-layout" style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div className="profile-main" style={{ flex: 1, minWidth: 420, background: '#fff', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.06)', padding: 24 }}>
                <div style={{ position: 'relative', marginBottom: 12, minHeight: 36 }}>
                  <div style={{ position: 'absolute', left: 0, top: 0 }}>
                              <button type="button" onClick={() => { try { navigate('/'); } catch (_) { window.location.href = '/'; } }} className="btn btn-outline" style={{ padding: '6px 10px', borderRadius: 8 }}>← Back</button>
                  </div>
                  <h2 style={{ margin: 0, fontSize: 20, textAlign: 'center', position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)' }}>My Profile</h2>
                  {/* header action buttons removed — use form controls at the bottom of the form */}
                </div>
                {loading && <div style={{ marginBottom: 12, color: '#666' }}>Loading...</div>}
                {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

                {profile ? (
                  <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
                    <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {['username','email','full_name','name','surname','mi','gender','contact','faculty','program'].map(k => (
                        (k in form) ? (
                          <div key={k} style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#333' }}>{k.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())}</label>
                            {k === 'program' ? (
                              <>
                                <input list="programs-list" value={form[k] ?? ''} onChange={e => onChangeField(k, e.target.value)} style={{ padding: 10, borderRadius: 10, border: '1px solid #e6e6e6', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }} />
                                <datalist id="programs-list">
                                  {programs.map(p => (<option key={p} value={p} />))}
                                </datalist>
                                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>You can edit your program/course here. Changes may be subject to administrative review.</div>
                              </>
                            ) : (
                              <input value={form[k] ?? ''} onChange={e => onChangeField(k, e.target.value)} style={{ padding: 10, borderRadius: 10, border: '1px solid #e6e6e6', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }} />
                            )}
                          </div>
                        ) : null
                      ))}
                    </div>

                    <div style={{ marginTop: 14 }}>
                      {Object.keys(form).filter(k => !['id','username','email','full_name','name','surname','mi','gender','contact','faculty','program','password','image'].includes(k)).map(k => (
                        <div key={k} style={{ marginBottom: 12 }}>
                          <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#333' }}>{k.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())}</label>
                          <input value={String(form[k] ?? '')} onChange={e => onChangeField(k, e.target.value)} style={{ padding: 10, borderRadius: 10, border: '1px solid #e6e6e6' }} />
                        </div>
                      ))}
                    </div>

                    <div className="profile-actions" style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                      <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
                      <button type="button" className="btn btn-outline" onClick={() => { setForm(profile); }}>Reset</button>
                      <button type="button" className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)} style={{ marginLeft: 'auto' }}>Delete Account</button>
                      <button type="button" className="btn btn-primary" onClick={() => navigate('/alumni/surveys')}>View Survey</button>
                    </div>
                  </form>
                ) : (
                  <div>No profile data.</div>
                )}
              </div>

              <aside className="profile-aside" style={{ width: 320, minWidth: 280, background: 'linear-gradient(180deg,#ffffff,#fbfbfb)', borderRadius: 12, padding: 18, boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div className="profile-aside-image" style={{ width: 160, height: 160, borderRadius: 12, overflow: 'hidden', background: '#f4f6f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {profile && profile.image ? (
                      <img
                        src={profile.image}
                        alt="Profile"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }}
                        role="button"
                        tabIndex={0}
                        aria-label="Open profile image"
                        onClick={() => setZoomedImage(profile.image)}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setZoomedImage(profile.image); } }}
                      />
                    ) : (
                      <div style={{ color: '#999' }}>No image</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>{profile && (profile.full_name || profile.name || profile.username)}</div>
                    <div style={{ color: '#666', fontSize: 13 }}>{profile && profile.email}</div>
                  </div>

                  <div style={{ width: '100%' }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 700 }}>Profile Image</label>
                    <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button className="btn btn-primary" onClick={handleImageUpload} disabled={loading || !imageFile} style={{ flex: 1 }}>Upload</button>
                      <button className="btn btn-outline" onClick={() => { setImageFile(null); }} disabled={!imageFile}>Clear</button>
                      <button className="btn btn-outline" onClick={() => refreshProfile()} title="Refresh avatar/profile">
                        {loading ? (
                          <svg width="16" height="16" viewBox="0 0 50 50" style={{ animation: 'spin 800ms linear infinite' }}>
                            <circle cx="25" cy="25" r="20" fill="none" stroke="#111827" strokeWidth="4" strokeLinecap="round" strokeDasharray="31.4 31.4" transform="rotate(-90 25 25)" />
                          </svg>
                        ) : 'Refresh Avatar'}
                      </button>
                    </div>
                  </div>
                  {/* Password management card */}
                  <div style={{ width: '100%', marginTop: 16, borderTop: '1px solid #eef2f7', paddingTop: 12 }}>
                    <div style={{ fontWeight: 800, marginBottom: 8 }}>Manage Password</div>
                    <form onSubmit={handleChangePassword}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ position: 'relative' }}>
                          <input type={showCurrent ? 'text' : 'password'} placeholder="Current password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={{ padding: '10px 46px 10px 12px', borderRadius: 8, border: '1px solid #e6e6e6', width: '100%', boxSizing: 'border-box', height: 40 }} />
                          <button type="button" aria-label={showCurrent ? 'Hide current password' : 'Show current password'} onClick={() => setShowCurrent(s => !s)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: '#fff', border: '1px solid #e6e6e6', padding: 6, cursor: 'pointer', borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 28, width: 34, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                            {showCurrent ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                <path d="M3 3l18 18" stroke="#374151" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M10.58 10.58a3 3 0 104.24 4.24" stroke="#374151" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                <circle cx="12" cy="12" r="3" stroke="#374151" strokeWidth="1.2" fill="none" />
                              </svg>
                            )}
                          </button>
                        </div>
                        <div style={{ position: 'relative' }}>
                          <input type={showNew ? 'text' : 'password'} placeholder="New password (min 8 chars)" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ padding: '10px 46px 10px 12px', borderRadius: 8, border: '1px solid #e6e6e6', width: '100%', boxSizing: 'border-box', height: 40 }} />
                          <button type="button" aria-label={showNew ? 'Hide new password' : 'Show new password'} onClick={() => setShowNew(s => !s)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: '#fff', border: '1px solid #e6e6e6', padding: 6, cursor: 'pointer', borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 28, width: 34, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                            {showNew ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                <path d="M3 3l18 18" stroke="#374151" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M10.58 10.58a3 3 0 104.24 4.24" stroke="#374151" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                <circle cx="12" cy="12" r="3" stroke="#374151" strokeWidth="1.2" fill="none" />
                              </svg>
                            )}
                          </button>
                        </div>
                        <div style={{ position: 'relative' }}>
                          <input type={showConfirm ? 'text' : 'password'} placeholder="Confirm new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ padding: '10px 46px 10px 12px', borderRadius: 8, border: '1px solid #e6e6e6', width: '100%', boxSizing: 'border-box', height: 40 }} />
                          <button type="button" aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'} onClick={() => setShowConfirm(s => !s)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: '#fff', border: '1px solid #e6e6e6', padding: 6, cursor: 'pointer', borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 28, width: 34, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                            {showConfirm ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                <path d="M3 3l18 18" stroke="#374151" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M10.58 10.58a3 3 0 104.24 4.24" stroke="#374151" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                <circle cx="12" cy="12" r="3" stroke="#374151" strokeWidth="1.2" fill="none" />
                              </svg>
                            )}
                          </button>
                        </div>
                        {passwordError && <div style={{ color: '#b91c1c', fontSize: 13 }}>{passwordError}</div>}
                        {passwordSuccess && <div style={{ color: '#065f46', fontSize: 13 }}>{passwordSuccess}</div>}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={changingPassword}>{changingPassword ? 'Saving...' : 'Change password'}</button>
                          <button type="button" className="btn btn-outline" onClick={() => { setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setPasswordError(''); setPasswordSuccess(''); }} disabled={changingPassword}>Reset</button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>
      {/* Zoom overlay */}
      {zoomedImage && (
        <div onClick={() => setZoomedImage(null)} role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000 }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, overflow: 'hidden' }}>
            <button onClick={() => setZoomedImage(null)} aria-label="Close image" className="btn btn-outline" style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>✕</button>
            <img src={zoomedImage} alt="Profile large" style={{ display: 'block', maxWidth: '90vw', maxHeight: '90vh', width: 'auto', height: 'auto', objectFit: 'contain', borderRadius: 6 }} />
          </div>
        </div>
      )}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4200 }}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 10, minWidth: 360 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Delete account</div>
            <div style={{ marginBottom: 12 }}>Delete your account? This cannot be undone.</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-outline">Cancel</button>
              <button onClick={async () => { setShowDeleteConfirm(false); await handleDelete(); }} className="btn btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AlumniProfilePanel;
