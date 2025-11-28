import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import './responsive.css';

function ResponsiveModal({ open, onClose, title, children, actions, fullBleedOnMobile = true, ariaLabel }) {
  const overlayRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    try { document.body.style.overflow = 'hidden'; } catch (_) {}
    return () => { try { document.body.style.overflow = prevOverflow; } catch (_) {} };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const prevActive = document.activeElement;
    // focus first focusable element in the modal
    try {
      const el = containerRef.current;
      if (el) {
        const focusable = el.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        (focusable || el).focus();
      }
    } catch (_) {}
    function onKey(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (typeof onClose === 'function') onClose();
      }
    }
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      try { prevActive && prevActive.focus && prevActive.focus(); } catch (_) {}
    };
  }, [open, onClose]);

  if (!open) return null;

  const overlayClick = (e) => {
    if (e.target === overlayRef.current) {
      if (typeof onClose === 'function') onClose();
    }
  };

  const containerClass = `responsive-modal-container ${fullBleedOnMobile ? 'full-bleed-mobile' : ''}`;

  return ReactDOM.createPortal(
    <div
      className="responsive-modal-overlay"
      ref={overlayRef}
      onMouseDown={overlayClick}
      role="presentation"
    >
      <div
        className={containerClass}
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || title || 'Dialog'}
        tabIndex={-1}
      >
        <div className="responsive-modal-header">
          {title ? <h3 className="responsive-modal-title">{title}</h3> : <div />}
          <button className="responsive-modal-close" aria-label="Close" onClick={() => typeof onClose === 'function' && onClose()}>×</button>
        </div>

        <div className="responsive-modal-body">
          {children}
        </div>

        {actions && (
          <div className="responsive-modal-actions">
            {actions}
          </div>
        )}
      </div>
    </div>,
    typeof document !== 'undefined' ? document.body : null
  );
}

export default ResponsiveModal;
