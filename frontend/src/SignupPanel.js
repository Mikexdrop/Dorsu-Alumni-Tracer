import React, { useState } from 'react';
import programs from './programs';

import { useNavigate } from 'react-router-dom';

function SignupPanel({ onBack, setSignupStep, setShowLogin }) {
  const navigate = useNavigate();
  const [animate, setAnimate] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  React.useEffect(() => {
    setTimeout(() => setAnimate(true), 100);
  }, []);
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  user_type: 'alumni',
  name: '',
  surname: '',
  mi: '',
  email: '',
  programCourse: '',
  yearGraduated: ''
  });
  // Removed course, year, and options
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  // Removed image upload and drag state

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Removed image upload and drag handlers

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
      // Validate email with a reasonable regex (allows most common TLDs)
      const email = (form.email || '').trim();
      // This regex checks for a local part, an '@', a domain and a TLD of 2+ characters.
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
      if (!email || !emailRe.test(email)) {
        setError('Please enter a valid email address (e.g., user@example.com)');
        return;
      }
      // normalize email back into the form for subsequent use
      form.email = email;
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!form.username || !form.name || !form.surname || !form.email || !form.password || !form.confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }
    // Year Graduated is required now
    const currentYear = new Date().getFullYear();
    if (!form.yearGraduated) {
      setError('Please select your Year Graduated');
      return;
    }
    const yr = Number(form.yearGraduated);
    if (!Number.isFinite(yr) || Number.isNaN(yr) || yr < 1950 || yr > currentYear) {
      setError(`Year Graduated must be a valid year between 1950 and ${currentYear}`);
      return;
    }
    // Prepare form data for backend
    try {
  let apiUrl = 'http://127.0.0.1:8000/api/' + (form.user_type === 'programhead' ? 'program-heads' : 'alumni') + '/';
      let payload = {
        username: form.username,
        password: form.password,
        email: form.email,
        full_name: form.name + ' ' + form.surname + (form.mi ? ' ' + form.mi : ''),
        program_course: form.programCourse || '',
  year_graduated: Number(form.yearGraduated)
      };
      if (form.user_type === 'programhead') {
        payload.department = '';
      }
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      let data = null;
      try {
        data = await response.json();
      } catch (parseErr) {
        // ignore parse error
      }
      if (response.ok && data && data.id) {
        setSuccess(true);
      } else {
        // Build a friendly error message from backend response
        let msg = 'Signup failed';
        if (data) {
          if (data.error) {
            msg = data.error;
          } else if (typeof data === 'object') {
            const parts = [];
            for (const k of Object.keys(data)) {
              const v = data[k];
              if (Array.isArray(v)) parts.push(`${k}: ${v.join(', ')}`);
              else if (typeof v === 'object') parts.push(`${k}: ${JSON.stringify(v)}`);
              else parts.push(`${k}: ${v}`);
            }
            if (parts.length) msg = parts.join('\n');
          } else if (typeof data === 'string') {
            msg = data;
          }
        } else {
          msg = `Signup failed (status ${response.status} ${response.statusText})`;
        }
        setError(msg);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  if (success) {
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
        
        {/* Success Card */}
        <div style={{ 
          position: 'relative', 
          zIndex: 1, 
          width: 400, 
          minHeight: 240, 
          background: 'rgba(255, 255, 255, 0.95)', 
          borderRadius: '20px', 
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)', 
          padding: '32px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          opacity: animate ? 1 : 0, 
          transform: animate ? 'translateY(0)' : 'translateY(40px)', 
          transition: 'opacity 0.7s, transform 0.7s'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: '#4caf50',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            boxShadow: '0 4px 10px rgba(76, 175, 80, 0.3)'
          }}>
            <span style={{ color: 'white', fontSize: '32px' }}>✓</span>
          </div>
          
          <h1 style={{ 
            fontWeight: '600', 
            fontSize: '24px', 
            color: '#4caf50', 
            margin: '0 0 12px 0',
            textAlign: 'center'
          }}>Sign Up Successful!</h1>
          
          <p style={{ 
            color: '#666', 
            fontSize: '14px', 
            margin: '0 0 24px 0',
            textAlign: 'center'
          }}>Your account has been created successfully</p>

          <button 
            onClick={() => navigate('/login', { state: { prefillUsername: form.username } })} 
            style={{ 
              padding: '10px 32px', 
              fontSize: '14px', 
              background: '#4caf50', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '10px', 
              fontWeight: '600', 
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)', 
              cursor: 'pointer', 
              transition: 'all 0.3s'
            }}
            onMouseOver={e => e.target.style.background = '#43a047'}
            onMouseOut={e => e.target.style.background = '#4caf50'}
          >
            Back to Main
          </button>
        </div>
      </div>
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
      `}</style>

      {/* Sign Up Card */}
      <div style={{ 
        position: 'relative', 
        zIndex: 1, 
        width: '100%',
        maxWidth: 520,
        minHeight: 520,
        background: 'rgba(255, 255, 255, 0.95)', 
        borderRadius: '20px', 
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)', 
        padding: '24px 32px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        opacity: animate ? 1 : 0, 
        transform: animate ? 'translateY(0)' : 'translateY(40px)', 
        transition: 'opacity 0.7s, transform 0.7s'
      }}>
        {/* Logo/Header Section */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          marginBottom: '20px',
          width: '100%'
  }} className="af-card">
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1976d2, #0d47a1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '15px',
            boxShadow: '0 4px 10px rgba(25, 118, 210, 0.3)',
            overflow: 'hidden'
          }}>
            <img src="/image.png" alt="Logo" style={{ width: '64px', height: '64px', objectFit: 'cover' }} />
          </div>
          <h1 style={{ 
            fontWeight: '600', 
            fontSize: '20px', 
            color: '#1976d2', 
            margin: '0 0 4px 0',
            textAlign: 'center'
          }}>Create Your Account</h1>
          <p style={{ 
            color: '#666', 
            fontSize: '14px', 
            margin: 0,
            textAlign: 'center'
          }}>Please fill in your information below</p>
        </div>

        <form onSubmit={handleSignup} style={{ 
          width: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 20, 
          alignItems: 'stretch', 
          justifyContent: 'flex-start' 
        }}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ 
              fontWeight: '600', 
              color: '#1976d2', 
              marginBottom: '8px', 
              fontSize: '16px',
              letterSpacing: '0.5px' 
            }}>Personal Information</div>
            
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
              <input 
                type="text" 
                name="username" 
                placeholder="Choose a username" 
                value={form.username} 
                onChange={handleChange} 
                required 
                style={{ 
                  width: '100%',
                  padding: '8px 12px', 
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

            {/* Name Field */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                color: '#555', 
                fontWeight: '500' 
              }}>
                First Name
              </label>
              <input 
                type="text" 
                name="name" 
                placeholder="Enter your first name" 
                value={form.name} 
                onChange={handleChange} 
                required 
                style={{ 
                  width: '100%',
                  padding: '8px 12px', 
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

            {/* Surname Field */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                color: '#555', 
                fontWeight: '500' 
              }}>
                Last Name
              </label>
              <input 
                type="text" 
                name="surname" 
                placeholder="Enter your last name" 
                value={form.surname} 
                onChange={handleChange} 
                required 
                style={{ 
                  width: '100%',
                  padding: '8px 12px', 
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

            {/* Middle Initial Field */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                color: '#555', 
                fontWeight: '500' 
              }}>
                Middle Initial
              </label>
              <input 
                type="text" 
                name="mi" 
                placeholder="M.I." 
                value={form.mi} 
                onChange={e => {
                  const val = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
                  if (val.length <= 1) setForm(f => ({ ...f, mi: val }));
                }}
                maxLength={1}
                style={{ 
                  width: '100%',
                  padding: '8px 12px', 
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

            {/* Email Field */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                color: '#555', 
                fontWeight: '500' 
              }}>
                Email Address
              </label>
              <input 
                type="email" 
                name="email" 
                placeholder="Enter your email" 
                value={form.email} 
                onChange={handleChange} 
                required 
                style={{ 
                  width: '100%',
                  padding: '8px 12px', 
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
              <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                Use a valid email address (e.g., <em>user@example.com</em>). 
              </div>
            </div>

            {/* Program/Course Field (select) */}
            <div style={{ position: 'relative' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                color: '#555', 
                fontWeight: '500' 
              }}>
                Program / Course
              </label>
              <div style={{ position: 'relative' }}>
                {/* Search icon inside input */}
                <span style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#888',
                  pointerEvents: 'none'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 21l-4.35-4.35" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <input
                  type="text"
                  name="programCourse"
                  list="programs-list"
                  value={form.programCourse}
                  onChange={handleChange}
                  placeholder="Type to search or select a program"
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
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
                <datalist id="programs-list">
                  {programs.map(p => (<option key={p} value={p} />))}
                </datalist>
              </div>
            </div>

              {/* Year Graduated Field */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  color: '#555', 
                  fontWeight: '500' 
                }}>
                  Year Graduated
                </label>
                <select
                  name="yearGraduated"
                  value={form.yearGraduated}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
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
                >
                  <option value="">Select year</option>
                  {(() => {
                    const years = [];
                    const current = new Date().getFullYear();
                    for (let y = current; y >= 1989; y--) years.push(y);
                    return years.map(y => <option key={y} value={y}>{y}</option>);
                  })()}
                </select>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                  Enter the year you graduated (optional).
                </div>
              </div>
          </div>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ 
              fontWeight: '600', 
              color: '#1976d2', 
              marginBottom: '8px', 
              fontSize: '16px',
              letterSpacing: '0.5px' 
            }}>Set Password</div>

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
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  name="password" 
                  placeholder="Create a password" 
                  value={form.password} 
                  onChange={handleChange} 
                  required 
                  style={{ 
                    width: '100%',
                    padding: '8px 45px 8px 12px', 
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

            {/* Confirm Password Field */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                color: '#555', 
                fontWeight: '500' 
              }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  name="confirmPassword" 
                  placeholder="Confirm your password" 
                  value={form.confirmPassword} 
                  onChange={handleChange} 
                  required 
                  style={{ 
                    width: '100%',
                    padding: '8px 45px 8px 12px', 
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
                  onClick={() => setShowConfirmPassword(v => !v)} 
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
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
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

            {/* Sign Up Button */}
            <button 
              type="submit" 
              style={{ 
                padding: '10px', 
                fontSize: '13px', 
                background: '#1976d2', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '10px', 
                fontWeight: '600', 
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)', 
                cursor: 'pointer', 
                transition: 'all 0.3s',
                marginTop: '10px',
                width: '100%'
              }}
              onMouseOver={e => e.target.style.background = '#1565c0'}
              onMouseOut={e => e.target.style.background = '#1976d2'}
            >
              Create Account
            </button>

            {/* Google Sign Up removed per request */}
          </div>
        </form>

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
              setSignupStep('none');
              setShowLogin(true);
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
          ← Back
        </button>
      </div>
    </div>
  );
}
export default SignupPanel;
