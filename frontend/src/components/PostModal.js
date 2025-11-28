import React, { useState, useEffect } from 'react';
import './responsive.css';
import PostModalMedia from './PostModalMedia';
import PostModalComments from './PostModalComments';

export default function PostModal({ selectedPost, onClose, prevPost, nextPost, lightboxIndex, setLightboxIndex }) {
  // (removed unused onShowSignupChoicePanel prop)
  const [likes, setLikes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('postLikes') || '{}'); } catch (_) { return {}; }
  });
  // local mutable copy of the selected post so we can refresh fields like likes_count/liked
  const [postState, setPostState] = useState(selectedPost || null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch (_) { return null; }
  });
  // Consider a user authenticated if a `token` or `currentUser` exists in localStorage
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!(localStorage.getItem('token') || localStorage.getItem('currentUser')));

  // keep auth state in sync across tabs and in-page changes to localStorage
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'token') setIsAuthenticated(!!e.newValue);
      if (e.key === 'currentUser') setIsAuthenticated(!!e.newValue);
      if (e.key === 'userType') setIsAuthenticated(!!localStorage.getItem('currentUser') || !!localStorage.getItem('token'));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  // In some flows the app dispatches a custom event when the user logs in or updates
  // their profile (`user-updated`). Also, localStorage.setItem does not fire the
  // 'storage' event in the same tab, so add a listener + short polling fallback
  // to catch same-tab logins.
  useEffect(() => {
    const onUserUpdated = (e) => {
      try {
        // If event provides a detail object, prefer that; otherwise check localStorage
        const detail = e && e.detail ? e.detail : null;
        if (detail && (detail.token || detail.currentUser)) {
          setIsAuthenticated(!!(detail.token || detail.currentUser || localStorage.getItem('currentUser')));
          try { setCurrentUser(detail.currentUser || (detail && detail.currentUser) || JSON.parse(localStorage.getItem('currentUser') || 'null')); } catch (_) {}
          return;
        }
      } catch (_) {}
      setIsAuthenticated(!!(localStorage.getItem('token') || localStorage.getItem('currentUser')));
      try { setCurrentUser(JSON.parse(localStorage.getItem('currentUser') || 'null')); } catch (_) {}
    };

    window.addEventListener('user-updated', onUserUpdated);

    // Short polling fallback while the modal is open to detect token set in same tab
    let polls = 0;
    const maxPolls = 20; // 20 * 250ms = 5s max
    const pollInterval = setInterval(() => {
      polls += 1;
      const hasToken = !!localStorage.getItem('token');
      const hasUser = !!localStorage.getItem('currentUser');
      if (hasToken || hasUser) setIsAuthenticated(true);
      if (hasUser) {
        try { setCurrentUser(JSON.parse(localStorage.getItem('currentUser') || 'null')); } catch (_) {}
      }
      if (hasToken || hasUser || polls >= maxPolls) clearInterval(pollInterval);
    }, 250);

    return () => {
      window.removeEventListener('user-updated', onUserUpdated);
      clearInterval(pollInterval);
    };
  }, []);
  // stable id for dependency array to satisfy eslint hooks rule
  const selectedPostId = selectedPost ? selectedPost.id : null;

  // keep a local copy in sync when the prop changes
  useEffect(() => {
    setPostState(selectedPost || null);
  }, [selectedPost]);

  // fetch the freshest post data (likes_count, liked, images, etc.) when modal opens
  useEffect(() => {
    let mounted = true;
    async function fetchPost() {
      if (!selectedPostId) return;
      try {
        const res = await fetch(`/api/posts/${selectedPostId}/`);
        if (!mounted) return;
        if (res && res.ok) {
          const data = await res.json().catch(() => null);
          if (data) setPostState(data);
        }
      } catch (e) {
        // ignore fetch failures; we'll continue to show the supplied selectedPost
      }
    }
    fetchPost();
    return () => { mounted = false; };
  }, [selectedPostId]);

  // fetch comments for selectedPost from backend
  useEffect(() => {
    let mounted = true;
    async function fetchComments() {
      if (!selectedPostId) {
        setComments([]);
        return;
      }
      try {
        const res = await fetch(`/api/posts/${selectedPostId}/comments/`);
        if (!mounted) return;
        if (res && res.ok) {
          const data = await res.json().catch(() => []);
          setComments(Array.isArray(data) ? data : []);
        } else {
          setComments([]);
        }
      } catch (err) {
        console.warn('Failed to fetch comments', err);
        setComments([]);
      }
    }
    fetchComments();
    return () => { mounted = false; };
  }, [selectedPostId]);

  const toggleLike = (postId) => {
    if (!isAuthenticated) {
      // guide user to sign in
      try { window.alert('Please sign in to like posts'); } catch (_) {}
      try { window.location.href = '/login'; } catch (_) {}
      return;
    }
    // Prefer server-backed toggle if API is available
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('currentUser');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Token ${token}`;
        const res = await fetch(`/api/posts/${postId}/likes/toggle/`, { method: 'POST', headers, body: JSON.stringify({ user_id: user && JSON.parse(user).id }) });
        if (res && res.ok) {
          const body = await res.json().catch(() => ({}));
          // update local post state from server response if available
          if (body) {
            // if server returns updated post object, use it; otherwise update liked/likes_count
            if (body.id && (body.likes_count !== undefined || body.liked !== undefined)) {
              setPostState(prev => ({ ...(prev || {}), ...body }));
            } else {
              // best-effort update — use previous postState.liked to compute delta
              setPostState(prev => {
                if (!prev) return prev;
                const liked = !!body.liked;
                const prevLiked = !!prev.liked;
                const likesCount = (typeof prev.likes_count === 'number') ? prev.likes_count : 0;
                let newCount = likesCount;
                if (!prevLiked && liked) newCount = likesCount + 1;
                else if (prevLiked && !liked) newCount = Math.max(0, likesCount - 1);
                return { ...prev, liked, likes_count: newCount };
              });
            }
          }
          // update local likes map for compatibility UI
          setLikes(prev => { const next = { ...prev, [postId]: !!(body && body.liked) }; try { localStorage.setItem('postLikes', JSON.stringify(next)); } catch (_) {} return next; });
          return;
        }
      } catch (err) {
        console.warn('Like API failed, falling back to local toggle', err);
      }

      // Fallback: local-only toggle (keeps existing behavior for offline or legacy server)
      setLikes(prev => {
        const next = { ...prev, [postId]: !prev[postId] };
        try { localStorage.setItem('postLikes', JSON.stringify(next)); } catch (_) {}
        // also update postState counts locally using previous prev.liked to avoid double-counts
        setPostState(prev => {
          if (!prev) return prev;
          const prevLiked = !!prev.liked;
          const liked = !prevLiked;
          const likesCount = (typeof prev.likes_count === 'number') ? prev.likes_count : 0;
          const newCount = liked ? (likesCount + 1) : Math.max(0, likesCount - 1);
          return { ...prev, liked, likes_count: newCount };
        });
        return next;
      });
    })();
  };

  const submitComment = async (postId) => {
    const text = (commentText || '').trim();
    if (!text || !postId) return;
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Token ${token}`;
      // Attach author attribution when available so backend can persist richer data
      const currentUserRaw = localStorage.getItem('currentUser');
      let bodyObj = { text };
      try {
        if (currentUserRaw) {
          const cu = JSON.parse(currentUserRaw);
          if (cu && cu.id) bodyObj.author_id = cu.id;
          if (cu && (cu.full_name || cu.fullName || cu.name)) bodyObj.author_name = cu.full_name || cu.fullName || cu.name;
        }
      } catch (_) {}

      const res = await fetch(`/api/posts/${postId}/comments/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyObj)
      });
        if (res && res.ok) {
          const created = await res.json();
          // prepend (server returns newest first) so UI matches server ordering
          setComments(prev => [created, ...prev]);
          setCommentText('');
        } else {
          // optimistic local fallback: append locally if API fails
          const currentUserRaw = localStorage.getItem('currentUser');
          let cu = null;
          try { cu = currentUserRaw ? JSON.parse(currentUserRaw) : null; } catch (_) { cu = null; }
          const optimistic = {
            text,
            created_at: new Date().toISOString(),
            author_image: cu && (cu.image || cu.avatar || cu.profile_image) ? (cu.image || cu.avatar || cu.profile_image) : null,
            author_full_name: cu && (cu.full_name || cu.name) ? (cu.full_name || cu.name) : null,
            author_id: cu && cu.id ? cu.id : null
          };
          setComments(prev => [optimistic, ...prev]);
          setCommentText('');
        }
    } catch (err) {
      console.warn('Failed to post comment', err);
      const currentUserRaw = localStorage.getItem('currentUser');
      let cu = null;
      try { cu = currentUserRaw ? JSON.parse(currentUserRaw) : null; } catch (_) { cu = null; }
      const fallback = {
        text,
        created_at: new Date().toISOString(),
        author_image: cu && (cu.image || cu.avatar || cu.profile_image) ? (cu.image || cu.avatar || cu.profile_image) : null,
        author_full_name: cu && (cu.full_name || cu.name) ? (cu.full_name || cu.name) : null,
        author_id: cu && cu.id ? cu.id : null
      };
      setComments(prev => [fallback, ...prev]);
      setCommentText('');
    }
  };

  const deleteComment = async (commentId) => {
    if (!commentId) return;
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Token ${token}`;
      // include current user's id in the body as a best-effort fallback for
      // servers that permit author-based deletion without token auth
      const currentUserRaw = localStorage.getItem('currentUser');
      let cu = null;
      try { cu = currentUserRaw ? JSON.parse(currentUserRaw) : null; } catch (_) { cu = null; }
      const body = cu && cu.id ? JSON.stringify({ author_id: cu.id }) : undefined;
      const res = await fetch(`/api/posts/${selectedPostId}/comments/${commentId}/`, { method: 'DELETE', headers, body });
      if (res && (res.ok || res.status === 204)) {
        setComments(prev => prev.filter(c => String(c.id) !== String(commentId)));
        return true;
      }
      // server returned error
      console.warn('Delete comment failed', res && res.status);
      return false;
    } catch (err) {
      console.warn('Failed to delete comment', err);
      return false;
    }
  };

  if (!selectedPost) return null;

  const displayPost = postState || selectedPost;
  // computed liked state: prefer server-provided value; fall back to local postLikes only for authenticated users
  const computedLiked = (displayPost && (typeof displayPost.liked === 'boolean')) ? !!displayPost.liked : !!(isAuthenticated && likes && likes[displayPost.id]);
  const computedLikesCount = (displayPost && typeof displayPost.likes_count === 'number') ? displayPost.likes_count : (computedLiked ? 1 : 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 12000, padding: 20, overflowX: 'hidden' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="post-modal"
        style={{ width: '100%', maxWidth: 1100, maxHeight: '92vh', overflow: 'hidden', background: '#ffffff', borderRadius: 12, color: '#0b1220', padding: 0, boxShadow: '0 12px 40px rgba(2,6,23,0.35)', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 0, alignItems: 'stretch', boxSizing: 'border-box', position: 'relative' }}
      >
        {/* floating close button in modal corner */}
        <button className="close-btn" aria-label="Close" onClick={onClose} title="Close">✕</button>
        <style>{`
          .post-modal { font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; }
          .post-modal .modal-panel { padding: 20px; }
          .post-modal .modal-media { background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%); }
          .post-modal .modal-right { border-left: 1px solid rgba(15,23,42,0.04); background: #fbfdff; }
          .post-modal .muted { color: #475569; font-size: 13px; }
          .post-modal h2 { margin: 0; font-size: 20px; color: #0b1220; font-weight: 600; }
          .post-modal .meta-row { display:flex; align-items:center; gap:8px; justify-content:space-between; }
          .post-modal .icon-btn { background: transparent; border: none; cursor: pointer; padding: 6px; border-radius: 8px; }
          .post-modal .icon-btn:hover { background: rgba(2,6,23,0.04); }
          /* absolute close button in modal corner */
          .post-modal .close-btn { position: absolute; top: 12px; right: 12px; background: #ffffff; color: #000; border: none; width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; box-shadow: 0 6px 18px rgba(2,6,23,0.12); cursor: pointer; z-index: 13000; }
          .post-modal .close-btn:hover { background: #f3f4f6; }
          .post-modal .primary-btn { background: #0ea5a0; color: white; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; }
          .post-modal img.responsive { width: 100%; height: auto; display: block; border-radius: 8px; }
          /* Constrain tall images so the description remains visible below the media */
          .post-modal .media-wrapper img.responsive { max-height: 48vh; width: auto; max-width: 100%; object-fit: contain; }
          /* ensure long descriptions wrap and preserve newlines */
          .post-modal .post-content { white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; hyphens: auto; color: #334155; font-size: 14px; line-height: 1.5; }
          @media (max-width: 880px) {
            .post-modal { grid-template-columns: 1fr; max-width: 760px; }
            .post-modal .modal-right { border-left: none; border-top: 1px solid rgba(15,23,42,0.04); }
          }
        `}</style>

  {/* Left: Media + Content */}
  <div className="modal-panel modal-media" style={{ padding: 20, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <h2 title={displayPost.title}>{displayPost.title || 'Untitled post'}</h2>
              <div className="muted" style={{ marginTop: 6 }}>{displayPost.created_at ? new Date(displayPost.created_at).toLocaleString() : ''}</div>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={() => toggleLike(displayPost.id)}
                aria-pressed={computedLiked}
                aria-label="Like"
                title={isAuthenticated ? (computedLiked ? 'Unlike' : 'Like') : 'Sign in to like'}
                className="icon-btn"
                disabled={!isAuthenticated}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                {computedLiked ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444" xmlns="http://www.w3.org/2000/svg"><path d="M12 21s-7.5-4.35-10-7.35C-.5 9.65 3 4 7.5 6.5 10 8 12 10 12 10s2-2 4.5-3.5C21 4 24.5 9.65 22 13.65 19.5 16.65 12 21 12 21z"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="1.4" xmlns="http://www.w3.org/2000/svg"><path d="M12 21s-7.5-4.35-10-7.35C-.5 9.65 3 4 7.5 6.5 10 8 12 10 12 10s2-2 4.5-3.5C21 4 24.5 9.65 22 13.65 19.5 16.65 12 21 12 21z"/></svg>
                )}
                <div className="muted" style={{ fontSize: 13 }}>{computedLikesCount}</div>
              </button>
              {/* Only heart button remains; close icon removed */}
              {/* Sign Up button removed per request */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={(e) => { e.stopPropagation(); prevPost(); }} className="primary-btn" aria-label="Previous post">Prev</button>
                <button onClick={(e) => { e.stopPropagation(); nextPost(); }} className="primary-btn" aria-label="Next post">Next</button>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, alignItems: 'start', minWidth: 0 }}>
      <div className="media-wrapper" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '28vh', maxHeight: '48vh', boxSizing: 'border-box', minWidth: 0, overflow: 'hidden' }}>
        <PostModalMedia images={displayPost.images} lightboxIndex={lightboxIndex} setLightboxIndex={setLightboxIndex} />
      </div>

            {/* scrollable content area: make description more prominent */}
            <div style={{ position: 'relative', overflowY: 'auto', maxHeight: '36vh', padding: '12px', boxSizing: 'border-box' }}>
              <div className="post-content" style={{ padding: 12, fontSize: 16, lineHeight: 1.7, background: '#f8fafc', borderRadius: 8, color: '#0b1220', boxShadow: 'inset 0 0 0 1px rgba(15,23,42,0.02)', marginBottom: 8 }}>{displayPost.content || '—'}</div>
              {/* subtle bottom fade to indicate scroll */}
              <div style={{ pointerEvents: 'none', position: 'sticky', bottom: 0, height: 28, marginTop: -28, background: 'linear-gradient(180deg, rgba(248,250,252,0), rgba(248,250,252,1))' }} />
            </div>

            
          </div>
        </div>

        {/* Right: Comments and meta */}
        <div className="modal-panel modal-right" style={{ padding: 18, overflowY: 'auto', minWidth: 0, maxHeight: '92vh' }}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
              <PostModalComments comments={comments} isAuthenticated={isAuthenticated} commentText={commentText} setCommentText={setCommentText} submitComment={() => submitComment(displayPost.id)} currentUser={currentUser} onDeleteComment={deleteComment} />
          </div>
        </div>
      </div>
    </div>
  );
}
