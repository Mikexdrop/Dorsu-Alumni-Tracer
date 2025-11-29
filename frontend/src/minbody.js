import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DataPrivacyConsentForm from './DataPrivacyConsentForm';

function LoginPanel({ onBack, onLoginSuccess, setSignupStep }) {
  const location = useLocation();
  const qs = typeof location?.search === 'string' ? new URLSearchParams(location.search) : new URLSearchParams(window.location.search);
  const initialPrefill = (location && location.state && location.state.prefillUsername) || qs.get('prefill') || '';
  const [username, setUsername] = useState(initialPrefill || '');
  const passwordRef = useRef(null);

  useEffect(() => {
    if (initialPrefill && passwordRef.current) {
      try { passwordRef.current.focus(); } catch (_) {}
    }
  }, [initialPrefill]);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  // userType select removed from UI; we'll attempt to detect user type by trying
  // login for each known role in order: alumni, program_head, admin.
  const [showPassword, setShowPassword] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConsentForm, setShowConsentForm] = useState(false);
  const [pendingLoginData, setPendingLoginData] = useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    setTimeout(() => setAnimate(true), 100);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const triedTypes = ['alumni', 'program_head', 'admin'];
      let successData = null;
      let successType = null;
      let lastError = null;

      for (const t of triedTypes) {
        // try relative endpoint first (works when frontend is proxied or deployed with same origin)
        const candidates = ['/api/login/', 'http://127.0.0.1:8000/api/login/'];
        let tried = false;
        for (const url of candidates) {
          try {
            const res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password, user_type: t })
            });
            tried = true;
            if (!res.ok) {
              const errBody = await res.text().catch(() => null);
              // try next candidate if available
              lastError = errBody || (`HTTP ${res.status}`);
              continue;
            }
            const d = await res.json().catch(() => ({ error: 'Invalid response' }));
            if (d && !d.error) {
              successData = d;
              successType = t;
              break;
            }
            lastError = d && d.error ? d.error : lastError;
          } catch (err) {
            lastError = err && err.message ? err.message : String(err);
            // try next candidate
            continue;
          }
        }
        if (successData) break;
        if (!tried) lastError = 'No network candidates attempted';
      }

      if (!successData) {
        setError(lastError === 'Invalid credentials' ? 'Invalid username or password.' : (lastError || 'Unable to authenticate. Check the server or your network.'));
        return;
      }

      const data = successData;
      const resolvedUser = data.user ?? data;
      const responseUserType = (data.user_type ?? resolvedUser.user_type ?? successType ?? '').toString().toLowerCase();

      // If the user is a program_head, ensure approved
      if (responseUserType === 'program_head') {
        const candidateKeys = ['status', 'user_status', 'is_approved', 'approval_status', 'approved', 'isApproved', 'user_approved'];
        let found;
        for (const k of candidateKeys) {
          if (k in data && data[k] !== undefined && data[k] !== null) { found = data[k]; break; }
        }
        if (found === undefined && resolvedUser && typeof resolvedUser === 'object') {
          for (const k of candidateKeys) {
            if (k in resolvedUser && resolvedUser[k] !== undefined && resolvedUser[k] !== null) { found = resolvedUser[k]; break; }
          }
        }
        if (found === undefined && resolvedUser && resolvedUser.profile && typeof resolvedUser.profile === 'object') {
          for (const k of candidateKeys) {
            if (k in resolvedUser.profile && resolvedUser.profile[k] !== undefined && resolvedUser.profile[k] !== null) { found = resolvedUser.profile[k]; break; }
          }
        }

        const status = found;
        if (status === undefined || status === null) {
          setError('Your account is pending approval by an administrator. You will be able to login once approved.');
          return;
        }

        const isApproved = (typeof status === 'boolean') ? status === true : (typeof status === 'number' ? status === 1 : (typeof status === 'string' ? (['approved','true','1','yes'].includes(status.trim().toLowerCase())) : false));
        if (!isApproved) {
          if (typeof status === 'string' && status.toLowerCase().includes('reject')) setError('Your account has been rejected. Contact an administrator for details.');
          else setError('Your account is pending approval by an administrator. You will be able to login once approved.');
          return;
        }
      }

      const finalUserType = data.user_type ?? resolvedUser.user_type ?? successType;
      if (finalUserType === 'alumni' && resolvedUser.first_login) {
        setShowConsentForm(true);
        setPendingLoginData({ user: resolvedUser, user_type: finalUserType });
      } else {
        // persist tokens and user info if provided
        try { localStorage.setItem('currentUser', JSON.stringify(resolvedUser)); } catch(_){}
        try { localStorage.setItem('userType', finalUserType); } catch(_){}
        try {
          if (resolvedUser && resolvedUser.token) {
            sessionStorage.setItem('server_token', resolvedUser.token);
            sessionStorage.setItem('server_token_expires_at', String(resolvedUser.token_expires_at || (Date.now() + (10 * 60 * 1000))));
          }
        } catch(_){}
        onLoginSuccess(resolvedUser, finalUserType);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showConsentForm && pendingLoginData) {
    // pendingLoginData stores the full resolved user under `.user` — ensure we pass the real id (or pk)
    const consentUserId = pendingLoginData.user?.id ?? pendingLoginData.user?.pk ?? pendingLoginData.user?.user_id ?? null;
    return (
      <DataPrivacyConsentForm
        userId={consentUserId}
        onAccept={() => {
          setShowConsentForm(false);
          // Pass the full user object saved earlier
          onLoginSuccess(pendingLoginData.user, pendingLoginData.user_type);
        }}
        onDecline={() => {
          setShowConsentForm(false);
          setError('You must accept the Data Privacy Consent to proceed.');
        }}
      />
    );
  }

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      minHeight: '100vh', 
      overflow: 'hidden', 
      background: 'linear-gradient(135deg, #0f2c3e 0%, #1a4b6d 50%, #2a6b97 100%)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      {/* Decorative elements */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 10% 20%, rgba(37, 85, 124, 0.3) 0%, transparent 20%),
          radial-gradient(circle at 90% 70%, rgba(51, 105, 30, 0.25) 0%, transparent 20%),
          radial-gradient(circle at 50% 30%, rgba(25, 118, 210, 0.2) 0%, transparent 30%)
        `,
        zIndex: 0
      }} />
      
      {/* Subtle grid pattern overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        zIndex: 0
      }} />
      
      {/* Animated floating elements */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '5%',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(51, 105, 30, 0.15) 0%, transparent 70%)',
        animation: 'float 15s ease-in-out infinite',
        zIndex: 0
      }} />
      
      <div style={{
        position: 'absolute',
        top: '60%',
        right: '10%',
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(25, 118, 210, 0.1) 0%, transparent 70%)',
        animation: 'float 18s ease-in-out infinite reverse',
        zIndex: 0
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '20%',
        left: '15%',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(211, 47, 47, 0.1) 0%, transparent 70%)',
        animation: 'float 12s ease-in-out infinite',
        zIndex: 0
      }} />
      
      <style>{`
        @keyframes float {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
      
      {/* Login Card */}
      <div style={{ 
        position: 'relative', 
        zIndex: 1, 
        width: '100%',
        maxWidth: 360,
        minHeight: 220, 
        background: 'rgba(255, 255, 255, 0.95)', 
        borderRadius: '20px', 
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)', 
        padding: '10px 22px 12px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        opacity: animate ? 1 : 0, 
        transform: animate ? 'translateY(0)' : 'translateY(40px)', 
        transition: 'opacity 0.7s, transform 0.7s'
      }} className="af-card">
        {/* Logo/Header Section */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          marginBottom: '15px',
          width: '100%'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
            boxShadow: '0 6px 14px rgba(25, 118, 210, 0.28)'
          }}>
            <img src="/image.png" alt="DOrSU logo" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
          <h1 style={{ 
            fontWeight: '600', 
            fontSize: '20px', 
            color: '#1976d2', 
            margin: '0 0 4px 0',
            textAlign: 'center'
          }}>DOrSU Alumni Portal</h1>
          <p style={{ 
            color: '#666', 
            fontSize: '14px', 
            margin: 0,
            textAlign: 'center'
          }}>Sign in to access your account</p>
        </div>

        <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* User Type Selector */}
          <div>
            {/* The explicit user-type selector was removed to simplify the UI.
                The login handler will automatically try each user_type in order
                (alumni → program_head → admin) until authentication succeeds. */}
          </div>

          {/* Username Field */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              color: '#555', 
              fontWeight: '500' 
            }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <span aria-hidden style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#1976d2', pointerEvents: 'none' }}>
                {/* user icon (uses currentColor) */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12a5 5 0 100-10 5 5 0 000 10z" fill="currentColor" />
                  <path d="M3 21a9 9 0 0118 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </span>
              <input 
                type="text" 
                placeholder="Enter your username" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                required 
                style={{ 
                  width: '100%',
                  padding: '8px 12px 8px 40px', 
                  borderRadius: '8px', 
                  border: '1px solid #ddd', 
                  fontSize: '13px', 
                  transition: 'all 0.3s',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: '#f9f9f9'
                }}
                onFocus={e => e.target.style.borderColor = '#1976d2'}
                onBlur={e => e.target.style.borderColor = '#ddd'}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              color: '#555', 
              fontWeight: '500' 
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <span aria-hidden style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#1976d2', pointerEvents: 'none' }}>
                {/* lock icon (uses currentColor) */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 11V8a5 5 0 10-10 0v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="3" y="11" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </span>
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="Enter your password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                ref={passwordRef}
                required 
                style={{ 
                  width: '100%',
                  padding: '8px 45px 8px 40px', 
                  borderRadius: '8px', 
                  border: '1px solid #ddd', 
                  fontSize: '13px', 
                  transition: 'all 0.3s',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: '#f9f9f9'
                }}
                onFocus={e => e.target.style.borderColor = '#1976d2'}
                onBlur={e => e.target.style.borderColor = '#ddd'}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(v => !v)} 
                style={{ 
                  position: 'absolute', 
                  right: '8px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer', 
                  color: '#666', 
                  fontSize: '11px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontWeight: '500'
                }}
                onMouseOver={e => e.target.style.color = '#1976d2'}
                onMouseOut={e => e.target.style.color = '#777'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{ 
              color: '#d32f2f', 
              backgroundColor: '#ffebee', 
              padding: '12px 16px', 
              borderRadius: '8px', 
              fontSize: '14px',
              border: '1px solid #ffcdd2'
            }}>
              {error}
            </div>
          )}

          {/* Login Button */}
          <button 
            type="submit" 
            disabled={isLoading}
            style={{ 
              padding: '10px', 
              fontSize: '13px', 
              background: isLoading ? '#ccc' : '#1976d2', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '10px', 
              fontWeight: '600', 
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)', 
              cursor: isLoading ? 'not-allowed' : 'pointer', 
              transition: 'all 0.3s',
              marginTop: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '100%'
            }}
            onMouseOver={e => !isLoading && (e.target.style.background = '#1565c0')}
            onMouseOut={e => !isLoading && (e.target.style.background = '#1976d2')}
          >
            {isLoading ? (
              <>
                <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid transparent', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                Signing in...
              </>
            ) : 'Sign In'}
          </button>

          {/* Google Sign In removed per request */}
        </form>

        {/* Sign Up Link */}
        <div style={{
          marginTop: '15px',
          textAlign: 'center',
          fontSize: '13px',
          color: '#666'
        }}>
          Don't have an account yet?{' '}
          <button
            onClick={() => {
              try { if (typeof setSignupStep === 'function') setSignupStep('choice'); } catch(_){}
              try { navigate('/select_user'); } catch(_) { window.location.href = '/select_user'; }
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              margin: 0,
              fontSize: '13px',
              color: '#1976d2',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline'
            }}
            onMouseOver={e => {
              e.target.style.textDecoration = 'underline';
              e.target.style.color = '#1565c0';
            }}
            onMouseOut={e => {
              e.target.style.textDecoration = 'none';
              e.target.style.color = '#1976d2';
            }}
          >
            Sign up
          </button>
          {/* New: Open login page anchor */}
          {/* 'Open login page' link removed to simplify UI */}
        </div>

        {/* Back Button */}
        <button 
          onClick={onBack} 
          style={{ 
            marginTop: '10px', 
            padding: '8px 16px', 
            fontSize: '14px', 
            background: 'transparent', 
            color: '#1976d2', 
            border: '1px solid #1976d2', 
            borderRadius: '8px', 
            fontWeight: '500', 
            cursor: 'pointer', 
            transition: 'all 0.3s'
          }}
          onMouseOver={e => {
            e.target.style.background = '#1976d2';
            e.target.style.color = 'white';
          }}
          onMouseOut={e => {
            e.target.style.background = 'transparent';
            e.target.style.color = '#1976d2';
          }}
        >
          ← Back to Home
        </button>

        {/* Additional Styles */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

export default LoginPanel;