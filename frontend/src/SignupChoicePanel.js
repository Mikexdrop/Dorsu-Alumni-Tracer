import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function SignupChoicePanel({ onChoose, onBack, setSignupStep, setShowLogin }) {
  const [animate, setAnimate] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setAnimate(true), 100);
  }, []);

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
      `}</style>

      {/* Signup Choice Card */}
      <div style={{ 
        position: 'relative', 
        zIndex: 1, 
        width: '100%', 
        maxWidth: 400, 
        minHeight: 240, 
        background: 'rgba(255, 255, 255, 0.95)', 
        borderRadius: '20px', 
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)', 
        padding: '12px 30px 12px', 
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
          marginBottom: '20px',
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
          }}>Create an Account</h1>
          <p style={{ 
            color: '#666', 
            fontSize: '14px', 
            margin: 0,
            textAlign: 'center'
          }}>Choose your role to get started</p>
        </div>

        {/* Choice Buttons */}
        <button 
          onClick={() => {
            // Do not call onChoose here to avoid any external '/signup' redirects.
            try { if (typeof setSignupStep === 'function') setSignupStep('program_head'); } catch(_){}
            try { navigate('/programhead_sign'); } catch(_) { window.location.href = '/programhead_sign'; }
          }} 
          style={{ 
            width: '100%', 
            padding: '12px', 
            fontSize: '14px', 
            marginBottom: '12px', 
            borderRadius: '10px', 
            border: '1px solid #ddd',
            background: '#fff', 
            color: '#444', 
            fontWeight: '600', 
            cursor: 'pointer', 
            transition: 'all 0.3s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10
          }}
          onMouseOver={e => {
            e.target.style.background = '#f5f5f5';
            e.target.style.borderColor = '#1976d2';
          }}
          onMouseOut={e => {
            e.target.style.background = '#fff';
            e.target.style.borderColor = '#ddd';
          }}
        >
          {/* program head icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" fill="#1976d2" />
            <path d="M4 20c0-3.314 4.03-6 8-6s8 2.686 8 6" stroke="#1976d2" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 14c1-1 3-2 5-2s4 1 5 2" stroke="#1976d2" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
          </svg>
          Program Head
        </button>
        
        <button 
          onClick={() => onChoose('alumni')} 
          style={{ 
            width: '100%', 
            padding: '12px', 
            fontSize: '14px', 
            borderRadius: '10px', 
            border: '1px solid #ddd',
            background: '#fff', 
            color: '#444', 
            fontWeight: '600', 
            cursor: 'pointer', 
            transition: 'all 0.3s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10
          }}
          onMouseOver={e => {
            e.target.style.background = '#f5f5f5';
            e.target.style.borderColor = '#1976d2';
          }}
          onMouseOut={e => {
            e.target.style.background = '#fff';
            e.target.style.borderColor = '#ddd';
          }}
        >
          {/* graduation cap icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M12 2l9 4-9 4-9-4 9-4z" fill="#1976d2" />
            <path d="M3 9v4c0 5 4 8 9 8s9-3 9-8v-4" stroke="#1976d2" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 13v7" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Alumni
        </button>

        {/* Login Link */}
        <div style={{
          marginTop: '15px',
          textAlign: 'center',
          fontSize: '13px',
          color: '#666'
        }}>
          Already have an account?{' '}
          <button
            onClick={() => {
              try { if (typeof setSignupStep === 'function') setSignupStep('none'); } catch(_){}
              try { if (typeof setShowLogin === 'function') setShowLogin(true); } catch(_){ }
              try { navigate('/login'); } catch(_) { window.location.href = '/login'; }
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
            Login
          </button>
        </div>

        {/* Back Button */}
        <button 
          onClick={onBack} 
          style={{ 
            marginTop: '20px', 
            padding: '8px 16px', 
            fontSize: '13px', 
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
          ← Back
        </button>
      </div>
    </div>
  );
}

export default SignupChoicePanel;
