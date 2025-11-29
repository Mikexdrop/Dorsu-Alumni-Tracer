import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Simple protected route wrapper for role-based access
export default function ProtectedRoute({ children, requiredRole }) {
  const location = useLocation();
  const navigate = useNavigate();
  // Read tokens/user info from storage. These reads are safe at render time.
  const serverToken = sessionStorage.getItem('server_token');
  const rawUser = localStorage.getItem('currentUser');
  const userType = localStorage.getItem('userType');
  const hasUser = !!rawUser || !!serverToken;

  // Hooks must be called unconditionally at the top-level of the component.
  const [validating, setValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [validationRan, setValidationRan] = useState(false);

  // Validate server-issued token when present. The effect is always declared
  // but does nothing when no serverToken exists, which keeps hook order stable.
  useEffect(() => {
    if (!serverToken) {
      setValidationRan(false);
      setIsValid(false);
      setValidating(false);
      return;
    }
    let cancelled = false;
    const validate = async () => {
      setValidating(true);
      try {
        const resp = await fetch('/api/token/validate/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: serverToken })
        });
        const data = await resp.json();
        if (cancelled) return;
        if (data && data.valid) {
          setIsValid(true);
        } else {
          setIsValid(false);
        }
      } catch (e) {
        setIsValid(false);
      } finally {
        if (!cancelled) setValidating(false);
        if (!cancelled) setValidationRan(true);
      }
    };
    validate();
    return () => { cancelled = true; };
  }, [serverToken]);

  const showBlockedUI = (reason) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 24 }}>
      <div style={{ maxWidth: 720, width: '100%', background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 12px 30px rgba(2,6,23,0.08)', textAlign: 'center' }}>
        <h2 style={{ marginTop: 0 }}>{reason.title}</h2>
        <p style={{ color: '#374151' }}>{reason.message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 18 }}>
          <button
            onClick={() => {
              // Navigate to root and let App show login overlay; include original path in state
              try { navigate('/', { state: { from: (location && location.pathname ? location.pathname : '/') + (location && location.search ? location.search : '') } }); } catch(_){}
            }}
            className="btn btn-primary"
            style={{ padding: '10px 16px', borderRadius: 8 }}
          >
            Sign in
          </button>
          <button
            onClick={() => { try { navigate('/'); } catch(_){} }}
            className="btn btn-outline"
            style={{ padding: '10px 16px', borderRadius: 8 }}
          >
            Back to Home
          </button>
        </div>
        <div style={{ marginTop: 12, color: '#9ca3af', fontSize: 13 }}>
          If you believe you should have access, contact an administrator.
        </div>
      </div>
    </div>
  );

  try {
    // If not authenticated at all, show blocked UI (instead of immediate redirect)
    if (!hasUser) return showBlockedUI({ title: 'Sign in required', message: 'You must sign in to access this page.' });

    // Role mismatch check
    if (requiredRole && userType && String(userType).toLowerCase() !== String(requiredRole).toLowerCase()) {
      return showBlockedUI({ title: 'Access denied', message: 'You do not have permission to view this page.' });
    }

    // If there is a server token, we must validate it before granting access.
    if (serverToken) {
      if (validating) {
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 24 }}>
            <div style={{ maxWidth: 720, width: '100%', background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 12px 30px rgba(2,6,23,0.08)', textAlign: 'center' }}>
              <h2 style={{ marginTop: 0 }}>Verifying access…</h2>
              <p style={{ color: '#374151' }}>Checking your session with the server. This should be quick.</p>
            </div>
          </div>
        );
      }

      // If validation has run and the token is invalid, show blocked UI
      if (validationRan && !isValid) {
        try { sessionStorage.removeItem('server_token'); sessionStorage.removeItem('server_token_expires_at'); } catch(_){}
        return showBlockedUI({ title: 'Session expired', message: 'Your session is no longer valid. Please sign in again.' });
      }

      // If validation ran and token is valid, allow children. If validation hasn't run
      // yet (edge), show verifying UI above. This branch covers valid token case too.
      if (validationRan && isValid) return children;
    }

    // No server token present — fall back to allowing children (we already checked user/role above)
    return children;
  } catch (e) {
    return showBlockedUI({ title: 'Access blocked', message: 'Unable to verify authentication. Please sign in again.' });
  }
}
