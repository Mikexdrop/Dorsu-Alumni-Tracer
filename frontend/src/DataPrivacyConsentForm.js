


import React, { useState } from 'react';

function DataPrivacyConsentForm({ onAccept, onDecline, userId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checked, setChecked] = useState(false);

  const handleProceed = async () => {
    if (!checked) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://127.0.0.1:8000/api/alumni/consent/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: userId, consent: true })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        onAccept();
      } else {
        setError(data.error || 'Failed to record consent. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%', overflow: 'hidden', background: 'linear-gradient(135deg, #0f2c3e 0%, #1a4b6d 50%, #2a6b97 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
      `}</style>
  <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 520, background: '#fff', borderRadius: 18, boxShadow: '0 6px 32px #0002', padding: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxSizing: 'border-box' }}>
        <h2 style={{ color: '#1976d2', marginBottom: 18 }}>Data Privacy and Consent Form</h2>
        <div style={{ textAlign: 'left', fontSize: 15, color: '#222', marginBottom: 24 }}>
          <p>
            By continuing, you acknowledge and consent to the collection, use, and processing of your personal data in accordance with the Data Privacy Act of 2012 and Davao Oriental State University's policies. Your information will be used solely for alumni tracking, employment surveys, and educational outcomes. You may withdraw consent at any time, but this may affect your access to alumni services.
          </p>
          <p>
            For more details, please read our <a href="https://www.privacy.gov.ph/data-privacy-act/" target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>Data Privacy Policy</a>.
          </p>
        </div>
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', marginBottom: 18 }}>
          <label style={{ display: 'flex', alignItems: 'center', fontSize: '1rem', color: '#1976d2', fontWeight: 'bold' }}>
            <input
              type="checkbox"
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
              style={{ marginRight: 10, width: 18, height: 18 }}
              disabled={loading}
            />
            I agree to the Data Privacy Policy and consent to the collection and processing of my personal data.
          </label>
        </div>
        <button
          onClick={handleProceed}
          disabled={!checked || loading}
          style={{
            padding: '10px 28px',
            background: checked ? '#1976d2' : '#aaa',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 'bold',
            fontSize: '1rem',
            cursor: !checked || loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            width: '100%'
          }}
        >
          {loading ? 'Processing...' : 'Proceed'}
        </button>
      </div>
    </div>
  );
}

export default DataPrivacyConsentForm;
