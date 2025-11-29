import React from 'react';
import { useNavigate } from 'react-router-dom';

function GetStartedModal({ open, onClose, onConfirm, title = 'Are you an Alumni of DOrSU?', description }) {
  const dialogRef = React.useRef(null);
  const yesRef = React.useRef(null);
  const prevActiveRef = React.useRef(null);
  const navigate = useNavigate();

  // Small helper to read CSS variables and provide a fallback.
  const getCssVar = (name, fallback) => {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name);
      return (v || '').trim() || fallback;
    } catch (_) {
      return fallback;
    }
  };

  // Theme-aware colors (will pick up values from theme.css if available)
  const bg = getCssVar('--card-bg', '#fff');
  const textColor = getCssVar('--text', '#111827');
  const descColor = getCssVar('--muted-text', '#374151');
  const overlay = getCssVar('--modal-overlay', 'rgba(0,0,0,0.5)');
  const boxShadow = getCssVar('--modal-shadow', '0 18px 50px rgba(2,6,23,0.35)');
  const closeColor = getCssVar('--muted-text', '#6b7280');
  const primaryBg = getCssVar('--accent', '#06b6d4');
  const primaryText = getCssVar('--accent-contrast', '#ffffff');

  React.useEffect(() => {
    if (!open) return;
    prevActiveRef.current = document.activeElement;
    // small timeout so layout stabilizes
    const t = setTimeout(() => {
      try {
        if (yesRef.current) yesRef.current.focus();
        else dialogRef.current && dialogRef.current.focus();
      } catch (_) {}
    }, 0);

    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose && onClose();
      }
      if (e.key === 'Tab') {
        // simple focus trap
        const nodes = dialogRef.current ? Array.from(dialogRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(n => !n.disabled) : [];
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      try { prevActiveRef.current && prevActiveRef.current.focus && prevActiveRef.current.focus(); } catch (_) {}
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gs-title"
      aria-describedby="gs-desc"
      style={{ position: 'fixed', inset: 0, zIndex: 22000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={() => onClose && onClose()}
    >
      <style>{`
        @keyframes gsFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes gsScale { from { transform: translateY(8px) scale(0.98); opacity: 0 } to { transform: translateY(0) scale(1); opacity: 1 } }
      `}</style>
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: overlay, animation: 'gsFade 200ms ease' }} />

      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 460,
          maxWidth: '96%',
          background: bg,
          borderRadius: 12,
          padding: 20,
          boxShadow: boxShadow,
          position: 'relative',
          animation: 'gsScale 220ms cubic-bezier(.2,.9,.2,1) both',
          color: textColor
        }}
      >
        <button
          aria-label="Close dialog"
          onClick={() => onClose && onClose()}
          style={{ position: 'absolute', right: 10, top: 10, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: closeColor }}
        >
          ✕
        </button>

        <h3 id="gs-title" style={{ marginTop: 4, marginBottom: 8 }}>{title}</h3>
        <p id="gs-desc" style={{ marginTop: 0, color: descColor }}>{description || 'Please tell us if you are a DOrSU graduate so we can route you to the right signup flow.'}</p>

        {/* Live region to announce prompt to assistive tech */}
        <div aria-live="polite" style={{ position: 'absolute', left: -9999, top: 'auto', width: 1, height: 1, overflow: 'hidden' }}>{title} {description || ''}</div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 18 }}>
          <button onClick={() => onClose && onClose()} className="btn btn-outline">No</button>
          <button
            ref={yesRef}
            onClick={() => { onClose && onClose(); onConfirm && onConfirm(); try { navigate('/claim-account'); } catch(_){} }}
            className="btn btn-primary"
            style={{ minWidth: 96, display: 'inline-flex', alignItems: 'center', gap: 8, background: primaryBg, color: primaryText, border: 'none', padding: '8px 12px', borderRadius: 6 }}
          >
            {/* Decorative check icon */}
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Yes</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default GetStartedModal;
