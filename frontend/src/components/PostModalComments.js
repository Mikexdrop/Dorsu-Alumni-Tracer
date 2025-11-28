import React, { useState, useEffect, useCallback } from 'react';
import './responsive.css';

export default function PostModalComments({ comments, isAuthenticated, commentText, setCommentText, submitComment, currentUser, onDeleteComment }) {
  const currentUserName = currentUser ? (currentUser.full_name || currentUser.name || null) : null;
  const currentInitial = currentUserName ? currentUserName.charAt(0) : 'U';

  const resolveImage = useCallback((val) => {
    try {
      const base = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ? process.env.REACT_APP_API_BASE : (typeof window !== 'undefined' && window.location ? window.location.origin : '');
      if (!val) return null;
      let s = null;
      if (typeof val === 'string') s = val.trim();
      else if (typeof val === 'object') {
        if (typeof val.url === 'string') s = val.url.trim();
        else if (typeof val.image === 'string') s = val.image.trim();
        else if (val && val.profile && typeof val.profile.image === 'string') s = val.profile.image.trim();
        else if (val && val.profile && val.profile.image && typeof val.profile.image.url === 'string') s = val.profile.image.url.trim();
      }
      if (!s) return null;
      if (s.startsWith('/')) return `${base}${s}`;
      return s;
    } catch (_) { return null; }
  }, []);

  const [authorImages, setAuthorImages] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const openDeleteConfirm = useCallback((id) => { setPendingDeleteId(id); setConfirmOpen(true); }, []);
  const cancelDelete = useCallback(() => { setPendingDeleteId(null); setConfirmOpen(false); }, []);
  const confirmDelete = useCallback(async () => {
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    setConfirmOpen(false);
    if (!id) return;
    try { if (onDeleteComment) await onDeleteComment(id); } catch (_) {}
  }, [pendingDeleteId, onDeleteComment]);

  const getCommentAuthorImage = useCallback((c) => {
    const id = c && (c.author_id || (c.author && (c.author.id || c.author.user_id)) || c.user_id || null);
    if (id && authorImages && authorImages[id]) return authorImages[id];
    if (!c) return null;
    const candidates = [c.author_image, c.image, c.profile && c.profile.image, c.author && c.author.profile && c.author.profile.image, c.author && c.author.image];
    for (const cand of candidates) {
      const resolved = resolveImage(cand);
      if (resolved) return resolved;
    }
    return null;
  }, [authorImages, resolveImage]);

  useEffect(() => {
    let mounted = true;
    const base = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ? process.env.REACT_APP_API_BASE : (typeof window !== 'undefined' && window.location ? window.location.origin : '');
    const idsToFetch = new Set();
    try {
      (comments || []).forEach(c => {
        const already = getCommentAuthorImage(c);
        if (!already) {
          const id = c && (c.author_id || (c.author && (c.author.id || c.author.user_id)) || c.user_id || null);
          if (id && !authorImages[id]) idsToFetch.add(id);
        }
      });
    } catch (_) {}

    if (idsToFetch.size === 0) return () => { mounted = false; };

    (async () => {
      for (const id of Array.from(idsToFetch)) {
        try {
          const token = (() => { try { return localStorage.getItem('token'); } catch (_) { return null; } })();
          const headers = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Token ${token}`;
          const res = await fetch(`${base}/api/alumni/${id}/`, { headers });
          if (!mounted) return;
          if (res && res.ok) {
            const data = await res.json().catch(() => null);
            if (data) {
              const img = resolveImage(data.image || (data.profile && data.profile.image) || data.profile_image || null);
              if (img) setAuthorImages(prev => ({ ...(prev || {}), [id]: img }));
            }
          }
        } catch (_) { }
      }
    })();

    return () => { mounted = false; };
  }, [comments, getCommentAuthorImage, resolveImage, authorImages]);

  const debugAvatars = (() => {
    try { const url = new URL(window.location.href); if (url.searchParams.get('debugAvatars') === '1') return true; } catch (_) {}
    try { return localStorage && localStorage.getItem && localStorage.getItem('debugAvatar') === '1'; } catch (_) { return false; }
  })();

  return (
    <aside className="comments-aside">
      {debugAvatars && (
        <div className="comments-debug">
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Avatar debug</div>
          <div style={{ fontSize: 12, color: '#0b1220', marginBottom: 6 }}>currentUser: <pre style={{ display: 'inline', margin: 0 }}>{JSON.stringify(currentUser || null)}</pre></div>
          <div style={{ fontSize: 12, color: '#0b1220' }}>resolved comment images:</div>
          <div style={{ maxHeight: 120, overflowY: 'auto', fontSize: 12, color: '#0b1220' }}>
            {comments && comments.length > 0 ? comments.map((c, i) => (<div key={i} style={{ padding: 4, borderBottom: '1px solid #fff', fontSize: 12 }}>{i}: {String(getCommentAuthorImage(c) || '')}</div>)) : (<div style={{ padding: 4 }}>no comments</div>)}
          </div>
        </div>
      )}

      <div className="comments-title">Comments</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {isAuthenticated ? (
          <div className="comment-input-row">
            <div className="comment-avatar">
              {currentUser && currentUser.image ? (
                <img src={currentUser.image} alt={currentUser.full_name || currentUser.name || 'avatar'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>{currentInitial}</div>
              )}
            </div>
            <div className="comment-input">
              <input id="comment-input" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." />
              <button onClick={submitComment} className="comment-send-btn">Send</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
            <div className="comment-no">Sign in to comment or like posts.</div>
          </div>
        )}
      </div>

      <div className="comments-list">
        {comments && comments.length > 0 ? (
          comments.map((c, i) => (
            <div key={c.id || i} className="comment-item">
              <div className="comment-avatar">
                {(() => {
                  const authorImage = getCommentAuthorImage(c);
                  if (authorImage) {
                    return (
                      <img
                        src={authorImage}
                        alt={c.author_full_name || c.author_name || 'avatar'}
                        onError={(e) => { try { e.currentTarget.onerror = null; e.currentTarget.src = '/default-avatar.svg'; } catch (_) {} }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    );
                  }
                  return (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>{(c.author_full_name || c.author_name || 'U').charAt(0)}</div>
                  );
                })()}
              </div>
              <div className="comment-body">
                <div className="comment-author">{c.author_full_name || c.author_name || 'Unknown'}</div>
                <div className="comment-text">{c.text}</div>
                <div className="comment-time">{c.created_at ? new Date(c.created_at).toLocaleString() : ''}</div>
              </div>
              {currentUser && (String(currentUser.id) === String(c.author_id) || String(currentUser.id) === String(c.author && (c.author.id || c.author.user_id))) && (
                <div className="comment-menu">
                  <button onClick={(e) => { e.stopPropagation(); openDeleteConfirm(c.id); }} className="icon-btn" title="More">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="1.6" xmlns="http://www.w3.org/2000/svg"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="comment-no">No comments yet</div>
        )}
      </div>

      {confirmOpen && (
        <div className="confirm-overlay">
          <div className="confirm-backdrop" onClick={cancelDelete} />
          <div role="dialog" aria-modal="true" className="confirm-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="confirm-warning-badge">!</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Delete this comment?</div>
                <div style={{ color: '#cbd5e1', fontSize: 13, marginTop: 4 }}>This action cannot be undone. The comment will be removed from the post for everyone.</div>
              </div>
            </div>
            <div className="confirm-actions">
              <button onClick={cancelDelete} className="btn-cancel">Cancel</button>
              <button onClick={confirmDelete} className="btn-delete">Delete</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
