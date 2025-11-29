import React from 'react';
import './responsive.css';

export default function PostModalMedia({ images, lightboxIndex, setLightboxIndex, children }) {
  const thumb = images && images.length > 0 ? (images[lightboxIndex] ? images[lightboxIndex].image : images[0].image) : null;
  return (
    <div className="media-grid" style={{ borderRadius: 12, overflow: 'hidden', overflowX: 'hidden', background: '#f8fafc', display: 'grid', gridTemplateColumns: '1fr 160px', gap: 12, alignItems: 'stretch', maxHeight: '72vh', minWidth: 0 }}>
      <div className="media-main" style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', maxHeight: '72vh', overflow: 'hidden', overflowX: 'hidden', minWidth: 0 }}>
        {thumb ? (
          // Use contain so the full image is visible (no cropping); constrain max dimensions
          <img
            src={thumb}
            alt="post"
            style={{
              width: 'auto',
              height: 'auto',
              maxWidth: '100%',
              maxHeight: '72vh',
              display: 'block',
              objectFit: 'contain'
            }}
            loading="lazy"
            onClick={() => { if (typeof setLightboxIndex === 'function') setLightboxIndex(0); }}
          />
        ) : (
          <div style={{ padding: 28, color: '#94a3b8' }}>No image available</div>
        )}
      </div>

      <div className="media-side" style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', overflowX: 'hidden', maxHeight: '72vh', minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
}
