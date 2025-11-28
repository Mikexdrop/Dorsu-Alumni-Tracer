import React, { useEffect, useState } from 'react';
import './responsive.css';

export default function PostCard({ post, onOpen }) {
  const thumb = post.images && post.images.length > 0 ? post.images[0].image : null;
  const created = post.created_at ? new Date(post.created_at).toLocaleDateString() : '';
  const [likesMap, setLikesMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem('postLikes') || '{}'); } catch (_) { return {}; }
  });

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'postLikes') {
        try { setLikesMap(JSON.parse(e.newValue || '{}')); } catch (_) { setLikesMap({}); }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const likeCount = likesMap && likesMap[post.id] ? 1 : 0;
  const commentCount = post && post.comments && Array.isArray(post.comments) ? post.comments.length : 0;
  // If server provides likes_count, use that; otherwise fallback to local per-user map
  const serverLikeCount = typeof post.likes_count === 'number' ? post.likes_count : likeCount;
  // only respect local postLikes map when user appears authenticated
  const isAuthenticated = !!(localStorage.getItem('token') || localStorage.getItem('currentUser'));
  const serverLiked = typeof post.liked === 'boolean' ? post.liked : !!(isAuthenticated && likesMap && likesMap[post.id]);

  return (
    <article
      className="post-card"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
      style={{ background: 'transparent', borderRadius: 12, padding: 0, color: '#fff', display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', transition: 'transform 0.12s ease' }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-6px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
  <div className="post-card-thumb" style={{ width: 150, flexShrink: 0, position: 'relative' }}>
        <div style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
          borderRadius: 8,
          padding: 12,
          height: 140,
          boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {thumb ? (
            <img loading="lazy" src={thumb} alt={post.title} style={{ width: 128, height: 120, objectFit: 'cover', borderRadius: 8 }} />
          ) : (
            <div style={{ width: 128, height: 120, borderRadius: 8, background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}>No Image</div>
          )}
        </div>
        <div style={{ position: 'absolute', right: 10, top: 10, width: 22, height: 22, background: 'rgba(255,255,255,0.08)', transform: 'rotate(45deg)', borderRadius: 2 }} />
      </div>

  <div className="post-card-body" style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, color: '#fff' }}>{post.title}</h3>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.9)', margin: '10px 0', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.content || ''}</div>
        </div>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{created}</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'rgba(255,255,255,0.9)', fontSize: 13 }} onClick={(e) => { e.stopPropagation();
                // toggle like via API (non-blocking)
                (async () => {
                  try {
                    const base = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';
                    const token = localStorage.getItem('token');
                    const user = localStorage.getItem('currentUser');
                    const headers = { 'Content-Type': 'application/json' };
                    if (token) headers['Authorization'] = `Token ${token}`;
                    const res = await fetch(`${base}/api/posts/${post.id}/likes/toggle/`, { method: 'POST', headers, body: JSON.stringify({ user_id: user && JSON.parse(user).id }) });
                    if (res && (res.ok || res.status === 201)) {
                      // best-effort optimistic UI: update local storage map and the element visually
                      const body = await res.json().catch(() => ({}));
                      const next = { ...likesMap, [post.id]: !!body.liked };
                      try { localStorage.setItem('postLikes', JSON.stringify(next)); } catch(_){}
                      setLikesMap(next);
                      return;
                    }
                  } catch (_) {}
                  // fallback: toggle locally
                  const next = { ...likesMap, [post.id]: !likesMap[post.id] };
                  try { localStorage.setItem('postLikes', JSON.stringify(next)); } catch(_){}
                  setLikesMap(next);
                })();
              }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill={serverLiked ? '#e11d48' : 'none'} stroke="#fff" strokeWidth="1" xmlns="http://www.w3.org/2000/svg"><path d="M12 21s-7.5-4.35-10-7.35C-.5 9.65 3 4 7.5 6.5 10 8 12 10 12 10s2-2 4.5-3.5C21 4 24.5 9.65 22 13.65 19.5 16.65 12 21 12 21z" /></svg>
              <span>{serverLikeCount}</span>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span>{commentCount}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
