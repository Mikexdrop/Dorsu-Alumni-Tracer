import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PostModal from './components/PostModal';

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // lightbox index for viewing multiple images inside this post
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function fetchPost() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/posts/${id}/`);
        if (!mounted) return;
        if (res && res.ok) {
          const data = await res.json().catch(() => null);
          setPost(data);
        } else {
          setError('Failed to load post');
        }
      } catch (err) {
        setError(String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchPost();
    // If this page was opened from a notification, notify other tabs (dashboard)
    // that a notification should be marked as read. We write to localStorage so
    // other tabs receive the storage event.
    try {
      const params = new URLSearchParams(window.location.search || '');
      const fromNotif = params.get('fromNotif');
      const notifId = params.get('notifId');
      if (fromNotif && notifId) {
        // write a timestamped marker so that storage event fires even if same id
        const key = 'notification:markRead';
        const payload = JSON.stringify({ notifId: String(notifId), ts: Date.now() });
        localStorage.setItem(key, payload);
      }
    } catch (_) {}
    return () => { mounted = false; };
  }, [id]);

  // After the post has loaded, if opened from a notification, focus and
  // smooth-scroll the post container for visibility, then remove the query
  // params so reloading doesn't re-trigger the mark-read flow.
  useEffect(() => {
    if (!post) return;
    try {
      const params = new URLSearchParams(window.location.search || '');
      if (params.get('fromNotif')) {
        const root = document.getElementById('post-detail-root');
        try {
          if (root && typeof root.focus === 'function') root.focus();
          if (root && typeof root.scrollIntoView === 'function') root.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (_) {}
        // remove the helper query params
        try {
          params.delete('fromNotif');
          params.delete('notifId');
          const search = params.toString();
          const newUrl = window.location.pathname + (search ? `?${search}` : '');
          window.history.replaceState({}, document.title, newUrl);
        } catch (_) {}
      }
    } catch (_) {}
  }, [post]);

  if (loading) return <div style={{padding: 24}}>Loading post…</div>;
  if (error) return <div style={{padding: 24, color: '#d32f2f'}}>Error loading post: {String(error)}</div>;
  if (!post) return <div style={{padding: 24}}>Post not found</div>;

  return (
    <div>
      <div id="post-detail-root" tabIndex={-1} style={{ outline: 'none' }} />
      {/* Render the PostModal as a full-page dialog-like view. Provide prev/next no-ops and pass lightbox handlers so images can be viewed. */}
      <PostModal
        selectedPost={post}
        onClose={() => navigate(-1)}
        prevPost={() => {}}
        nextPost={() => {}}
        lightboxIndex={lightboxIndex}
        setLightboxIndex={setLightboxIndex}
      />

      {/* Lightbox overlay for image zoom with navigation (same behaviour as in MainBody) */}
      {post && lightboxIndex !== null && post.images && (
        <div role="dialog" aria-modal="true" onClick={() => setLightboxIndex(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 13000 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '95vw', maxHeight: '95vh', position: 'relative' }}>
            <img src={post.images[lightboxIndex].image} alt={`lightbox-${lightboxIndex}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            <button onClick={() => setLightboxIndex((i) => (i === 0 ? post.images.length - 1 : i - 1))} aria-label="Prev image" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', width: 48, height: 48, borderRadius: 24, cursor: 'pointer' }}>&lt;</button>
            <button onClick={() => setLightboxIndex((i) => (i === post.images.length - 1 ? 0 : i + 1))} aria-label="Next image" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', width: 48, height: 48, borderRadius: 24, cursor: 'pointer' }}>&gt;</button>
            <button onClick={() => setLightboxIndex(null)} aria-label="Close" style={{ position: 'absolute', right: 10, top: 10, background: 'rgba(255,255,255,0.06)', color: '#fff', border: 'none', width: 36, height: 36, borderRadius: 18, cursor: 'pointer' }}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
