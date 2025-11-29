import React, { useEffect, useState } from 'react';

export default function AdminNotification({ onSend, onViewUser, onCountChange }) {
  const [notifications, setNotifications] = useState([]);
  const [hoveredId, setHoveredId] = useState(null);
  const [viewing, setViewing] = useState(null);
  // Backend notifications API (change if your backend uses a different path)
  const NOTIF_API = '/api/notifications/';

  // Stable key generator used across rendering, storage and deletion.
  const makeKey = (it) => {
    if (!it) return '';
    if (it.serverId) return String(it.serverId);
    if (it.id) return String(it.id);
    if (it._id) return String(it._id);
    if (it.title && it.created_at) return `${it.title}|${it.created_at}`;
    return JSON.stringify(it);
  };

  const loadNotifications = () => {
    // Merge strategy: keep any existing notifications until explicitly deleted.
    const getKey = (it) => (it && (it.serverId || it.id || it._id || (it.title && it.created_at && `${it.title}|${it.created_at}`))) || JSON.stringify(it || {});

    try {
      // load local storage snapshot
      let localArr = [];
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem('programHeadNotifications');
        if (raw) {
          try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) localArr = parsed; } catch (e) {}
        }
      }

      (async () => {
        try {
          const res = await fetch(NOTIF_API, { method: 'GET', headers: { 'Accept': 'application/json' } });
          let serverList = [];
          if (res && res.ok) {
            try { serverList = await res.json(); } catch (e) { serverList = []; }
          }

          setNotifications((prev = []) => {
            // build map starting from previous state to preserve user-deleted / read flags unless explicitly overwritten
            const map = new Map();
            const add = (item) => { const k = getKey(item); if (!k) return; const existing = map.get(k); if (existing) { map.set(k, { ...existing, ...item }); } else { map.set(k, item); } };

            // start with previous (so nothing vanishes by default)
            prev.forEach(add);
            // overlay server items
            if (Array.isArray(serverList)) serverList.forEach(s => add({ ...s, serverId: s.id || s.serverId }));
            // finally add any local-only items that might not be in prev
            (localArr || []).forEach(l => add(l));

            const merged = Array.from(map.values()).sort((a, b) => {
              const ta = new Date(a.created_at || a.date || 0).getTime();
              const tb = new Date(b.created_at || b.date || 0).getTime();
              return tb - ta;
            });

            try { localStorage.setItem('programHeadNotifications', JSON.stringify(merged)); } catch (e) {}
            return merged;
          });
          return;
        } catch (e) {
          // network error — fall back to localArr
        }

        // fallback: merge localArr with prev preserving prev
        setNotifications((prev = []) => {
          const map = new Map();
          const add = (item) => { const k = getKey(item); if (!k) return; const existing = map.get(k); if (existing) { map.set(k, { ...existing, ...item }); } else { map.set(k, item); } };
          prev.forEach(add);
          (localArr || []).forEach(add);
          const merged = Array.from(map.values()).sort((a,b) => new Date(b.created_at || b.date || 0) - new Date(a.created_at || a.date || 0));
          try { localStorage.setItem('programHeadNotifications', JSON.stringify(merged)); } catch (e) {}
          return merged;
        });
      })();
    } catch (e) {
      // fallback: keep existing notifications
      setNotifications((prev = []) => prev || []);
    }
  };

  // Try to sync local notifications to server: POST items without serverId
  const syncToServer = async (arr) => {
    if (!arr || !arr.length) return;
    try {
      const unsynced = arr.filter(i => !i.serverId);
      if (!unsynced.length) return;
      for (const item of unsynced) {
        try {
          const payload = { ...item };
          // remove local-only transient fields to avoid sending large objects
          delete payload.id;
          delete payload.serverId;
          const res = await fetch(NOTIF_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            try {
              const data = await res.json();
              // if backend returns an id, store it as serverId
              if (data && (data.id || data._id)) {
                item.serverId = data.id || data._id;
                // update localStorage copy
                try {
                  const raw = localStorage.getItem('programHeadNotifications');
                  const arr2 = raw ? JSON.parse(raw) : [];
                  const updated = (arr2 || []).map(x => (x.id === item.id ? { ...x, serverId: item.serverId } : x));
                  localStorage.setItem('programHeadNotifications', JSON.stringify(updated));
                } catch (e) {}
              }
            } catch (e) {
              // ignore JSON parse
            }
          }
        } catch (e) {
          // ignore per-item errors
        }
      }
    } catch (e) {
      // noop
    }
  };

  // Delete notification on server (if it has serverId). Returns true if deleted or server not reachable but treated as deleted.
  const deleteNotificationOnServer = async (item) => {
    if (!item) return false;
    const id = item.serverId || item.id || item._id;
    if (!id) return false;
    try {
      const url = NOTIF_API.endsWith('/') ? `${NOTIF_API}${id}/` : `${NOTIF_API}${id}`;
      const res = await fetch(url, { method: 'DELETE', headers: { 'Accept': 'application/json' } });
      // if server responds with success or 404 (already removed), treat as deleted
      if (res && (res.ok || res.status === 404)) return true;
      return false;
    } catch (e) {
      // network error — return false so caller can decide fallback
      return false;
    }
  };

  useEffect(() => {
    // initial load
    loadNotifications();

    // update when other tabs/windows change localStorage
    const storageHandler = (e) => {
      if (!e) return loadNotifications();
      if (e.key === 'programHeadNotifications' || !e.key) loadNotifications();
    };

    // custom event for same-window updates
    const customHandler = (e) => {
      loadNotifications();
    };

    window.addEventListener('storage', storageHandler);
    window.addEventListener('programHeadNotificationsUpdated', customHandler);

    return () => {
      window.removeEventListener('storage', storageHandler);
      window.removeEventListener('programHeadNotificationsUpdated', customHandler);
    };
  }, []);

  // notify parent of initial count and whenever notifications change
  useEffect(() => {
    try {
      if (typeof onCountChange === 'function') {
        const unread = (notifications || []).filter(n => !n.read).length;
        onCountChange(unread);
      }
    } catch (e) {}
  }, [notifications, onCountChange]);

  const persist = (arr) => {
    try {
      localStorage.setItem('programHeadNotifications', JSON.stringify(arr));
      // notify other listeners in same window
      try { window.dispatchEvent(new Event('programHeadNotificationsUpdated')); } catch (e) {}
      // Try to sync to backend (fire-and-forget)
      try { syncToServer(arr); } catch (e) {}
    } catch (e) {
      console.error('Failed to persist notifications', e);
    }
  };

  // Mark read and open view by index to avoid key collisions
  const handleView = (n, idx) => {
    if (!n) return;
    try {
      try {
        const updated = (notifications || []).map((x, i) => i === idx ? { ...x, read: true } : x);
        setNotifications(updated);
        persist(updated);
      } catch (e) {
        // ignore persistence errors
      }

      setViewing({ item: n, index: idx });
    } catch (e) {
      // ignore
    }
  };

  const handleClearOne = (keyOrIndex) => {
    try {
      if (typeof keyOrIndex === 'number') {
        // remove by index
        const item = (notifications || [])[keyOrIndex];
        // attempt server delete if possible, but always remove locally so UI is responsive
        (async () => {
          await deleteNotificationOnServer(item);
          // remove from local storage and state (UI remains responsive regardless of server response)
          const remaining = (notifications || []).filter((_, i) => i !== keyOrIndex);
          setNotifications(remaining);
          try {
            // update localStorage
            localStorage.setItem('programHeadNotifications', JSON.stringify(remaining));
            try { window.dispatchEvent(new Event('programHeadNotificationsUpdated')); } catch (e) {}
          } catch (e) {}
        })();
      } else {
        // remove by key
        const item = (notifications || []).find(n => makeKey(n) === keyOrIndex);
        (async () => {
          await deleteNotificationOnServer(item);
          const remaining = (notifications || []).filter(n => makeKey(n) !== keyOrIndex);
          setNotifications(remaining);
          try {
            localStorage.setItem('programHeadNotifications', JSON.stringify(remaining));
            try { window.dispatchEvent(new Event('programHeadNotificationsUpdated')); } catch (e) {}
          } catch (e) {}
        })();
      }
    } catch (e) {
      console.error('Failed to clear notification', e);
    }
  };

  const handleClearAll = () => {
    try {
      // attempt to delete all notifications on server (best-effort). If server is unavailable, keep a local copy.
      const arr = notifications || [];
      (async () => {
        let allDeleted = true;
        for (const it of arr) {
          const deleted = await deleteNotificationOnServer(it);
          if (!deleted) allDeleted = false;
        }
        if (allDeleted) {
          setNotifications([]);
          try { localStorage.removeItem('programHeadNotifications'); } catch (e) {}
          try { window.dispatchEvent(new Event('programHeadNotificationsUpdated')); } catch (e) {}
        } else {
          // server not fully reachable - mark all as read instead of deleting so they don't vanish across logouts
          try {
            const marked = arr.map(a => ({ ...a, read: true }));
            setNotifications(marked);
            localStorage.setItem('programHeadNotifications', JSON.stringify(marked));
            try { window.dispatchEvent(new Event('programHeadNotificationsUpdated')); } catch (e) {}
          } catch (e) {}
        }
      })();
    } catch (e) {
      console.error('Failed to clear notifications', e);
    }
  };

  return (
    <div style={{ 
        paddingTop: 24,
        background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
        minHeight: '100vh',
        padding: '24px 32px'
      }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0 }}>Notifications</h2>
          <p style={{ margin: '6px 0 0 0' }}>Manage system notifications and alerts sent to users.</p>
        </div>
        {(notifications && notifications.length) ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleClearAll} className="btn btn-outline">Clear All</button>
            <button onClick={() => {
              try {
                const updated = (notifications || []).map(x => ({ ...x, read: true }));
                setNotifications(updated);
                persist(updated);
                if (typeof onCountChange === 'function') onCountChange(0);
              } catch (e) {
                console.error('Failed to mark all as read', e);
              }
            }} className="btn btn-primary">Mark all</button>
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(notifications || []).map((n, i) => {
          const key = makeKey(n) || (`notif_${i}`);
          const isHovered = hoveredId === i;
          return (
            <div key={key + '_' + i}
              onMouseEnter={() => setHoveredId(i)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                background: 'linear-gradient(to right, #f8faff 0%, #ffffff 100%)',
                borderLeft: '4px solid #60a5fa',
                padding: 16,
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: isHovered ? '0 6px 16px rgba(0, 0, 0, 0.08)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
                cursor: 'default',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}>
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>{n.title || 'New Program Head Created'}</div>
                <div style={{ fontSize: 13, color: '#333', lineHeight: 1.5 }}>
                  <div><strong>Username:</strong> {n.username}</div>
                  <div><strong>Email:</strong> {n.email}</div>
                  <div><strong>Password:</strong> {n.password}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>Created at: {n.created_at ? new Date(n.created_at).toLocaleString() : ''}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleView(n, i)} className="btn btn-primary">View</button>
                <button onClick={() => handleClearOne(i)} className="btn">Clear</button>
              </div>
            </div>
          );
        })}

        {viewing && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
            <div style={{ background: '#fff', padding: 20, borderRadius: 12, width: 'min(720px, 92vw)', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
              <h3 style={{ marginTop: 0 }}>{(viewing && viewing.item && viewing.item.title) || 'Notification'}</h3>
              <div style={{ marginBottom: 12, color: '#333', lineHeight: 1.4 }}>
                {viewing.item && viewing.item.message && <div style={{ marginBottom: 8 }}><strong>Message:</strong><div style={{ whiteSpace: 'pre-wrap' }}>{viewing.item.message}</div></div>}
                {viewing.item && viewing.item.name && <div><strong>Name:</strong> {viewing.item.name}</div>}
                {viewing.item && viewing.item.email && <div><strong>Email:</strong> {viewing.item.email}</div>}
                {viewing.item && viewing.item.username && <div><strong>Username:</strong> {viewing.item.username}</div>}
                {viewing.item && viewing.item.password && <div><strong>Password:</strong> {viewing.item.password}</div>}
                {viewing.item && viewing.item.created_at && <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>Created at: {new Date(viewing.item.created_at).toLocaleString()}</div>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn" onClick={() => setViewing(null)}>Close</button>
                <button className="btn btn-primary" onClick={() => { const k = viewing.index; setViewing(null); handleClearOne(k); }}>Delete</button>
              </div>
            </div>
          </div>
        )}
        {(notifications || []).length === 0 && (
          <div style={{ 
            color: '#6b7280', 
            marginTop: 24,
            padding: 32,
            textAlign: 'center',
            background: 'linear-gradient(to right, #f8fafc 0%, #ffffff 100%)',
            borderRadius: 12,
            boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.03)',
            fontSize: 15
          }}>No notifications yet.</div>
        )}
      </div>
    </div>
  );
}
