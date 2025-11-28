import React, { useEffect, useState } from 'react';

export default function AdminPostToolbar({ postSearch, setPostSearch, handleSearchTrigger, setShowAddPostModal, isMobile, setSelectedPostId }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // small entrance animation trigger
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`admin-post-toolbar ${mounted ? 'addpost-anim' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <style>{`
        .addpost-anim { animation: slideIn 360ms cubic-bezier(.2,.9,.3,1) both; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .addpost-btn { transition: transform 160ms ease, filter 160ms ease; }
        .addpost-btn:hover { filter: brightness(0.92); transform: translateY(-2px); }
      `}</style>

      {/* left placeholder - reserved for future actions */}
      <div style={{ display: 'block', minWidth: 8 }} />

      {/* middle: flexible search area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
        <input
          type="search"
          placeholder="Search posts..."
          value={postSearch}
          onChange={e => setPostSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearchTrigger(postSearch); }}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', width: '100%', minWidth: 160 }}
        />

        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', marginLeft: 6 }}>
          {postSearch && (
            <button
              onClick={() => { setPostSearch(''); handleSearchTrigger(''); }}
              title="Clear search"
              className="btn btn-outline"
              style={{ padding: '6px 8px', borderRadius: 8 }}
            >
              ✖
            </button>
          )}

          <button
            onClick={() => handleSearchTrigger(postSearch)}
            title="Search posts"
            className="btn btn-outline"
            style={{ padding: 8, borderRadius: 8 }}
          >
            🔍
          </button>
        </div>
      </div>

      {/* right: Add Post (always visible) */}
      <div style={{ marginLeft: 12, display: 'block' }}>
        <button
          className="btn btn-primary addpost-btn"
          onClick={() => setShowAddPostModal(true)}
          title="Add a new post"
          style={{ padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M10 4v12M4 10h12" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontWeight: 700 }}>Add Post</span>
        </button>
      </div>
    </div>
  );
}
