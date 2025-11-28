import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ProgramHeadSignupPanel({ onBack, setSignupStep, setShowLogin }) {
  const [animate, setAnimate] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  React.useEffect(() => {
    setTimeout(() => setAnimate(true), 100);
  }, []);
  const [form, setForm] = useState({
    username: '',
    name: '',
    surname: '',
    mi: '',
    gender: '',
    contact: '',
    email: '',
    faculty: '',
    program: '',
    password: '',
    confirmPassword: '',
    userType: 'Program Head',
  });
  const facultyPrograms = {
  'FALS': ['Bachelor of Science in Agriculture (BSA)', 'Bachelor of Science in Agribusiness Management (BSAM)', 'Bachelor of Science in Biology (BSBio)','Bachelor of Science in Environmental Science (BSES)'],
    'FBM': ['Bachelor of Science in Business Administration (BSBA)', 'Bachelor of Science in Hospitality Management (BSHM)'],
    'FTED': ['Bachelor of Elementary Education (BEED)', 'Bachelor of Early Childhood Education (BCED)', 'Bachelor of Special Needs Education (BSNED)', 'Bachelor Physical Education (BPED)', 'Bachelor of Technology and Livelihood Education (BTLED)', 'Bachelor of Technology and Livelihood Education major in Industrial Arts (BTLED)', 'Bachelor of Secondary Education major in English (BSED English)','Bachelor of Secondary Education major in Filipino (BSED Filipino)','Bachelor of Secondary Education major in Mathematics (BSED Mathematics)', 'Bachelor of Secondary Education major in Science (BSED Science)'],
    'FaCET': ['Bachelor of Science in Information Technology (BSIT)', 'Bachelor of Science in Civil Engineering (BSCE)', 'Bachelor in Industrial Technology Management (BITM)', 'Bachelor of Science in Mathematics (BSMath)'],
    'FNAHS': ['Bachelor of Science in Nursing (BSN)'],
    'FCJE': ['Bachelor of Science in Criminology (BSC)'],
    'FHuSoCom': ['Bachelor of Arts Political Science (BA PolSci)','Bachelor of Science in Development Communication (BSDevCom)', 'Bachelor of Science in Psychology (BS Psychology)'],
  };
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };


  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    // Validate email with a reasonable regex (allows most common TLDs)
    const email = (form.email || '').trim();
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
    // Philippine contact number validation: must be 11 digits, start with '09', numbers only
    const contactPattern = /^09\d{9}$/;
    if (!contactPattern.test(form.contact)) {
      setError('Contact number must be a valid Philippine number (e.g., 09XXXXXXXXX)');
      return;
    }
    if (!form.username || !form.name || !form.surname || !form.gender || !form.contact || !form.email || !form.faculty || !form.program || !form.password || !form.confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }
    try {
      const response = await fetch('http://127.0.0.1:8000/api/program-heads/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          name: form.name,
          surname: form.surname,
          mi: form.mi,
          gender: form.gender,
          contact: form.contact,
          email: form.email,
          faculty: form.faculty,
          program: form.program,
          password: form.password
        }),
      });
      let data = {};
      try {
        data = await response.json();
      } catch (e) {
        // Non-JSON response
        data = {};
      }

      if (response.ok && data && data.id) {
        // Persist created credentials briefly so AdminNotification can read them
        try {
          const creds = { username: form.username, email: form.email, password: form.password };
          try {
            const raw = localStorage.getItem('programHeadNotifications');
            const arr = raw ? JSON.parse(raw) : [];
            const note = { id: `ph_${Date.now()}`, username: creds.username, email: creds.email, password: creds.password, created_at: new Date().toISOString(), title: 'New Program Head Created' };
            // Prepend newest first
            const updated = [note].concat(Array.isArray(arr) ? arr : []);
            localStorage.setItem('programHeadNotifications', JSON.stringify(updated));
            try { window.dispatchEvent(new Event('programHeadNotificationsUpdated')); } catch (e) {}
          } catch (e) {
            try {
              localStorage.setItem('programHeadNotifications', JSON.stringify([{ id: `ph_${Date.now()}`, username: creds.username, email: creds.email, password: creds.password, created_at: new Date().toISOString(), title: 'New Program Head Created' }]));
              try { window.dispatchEvent(new Event('programHeadNotificationsUpdated')); } catch (e2) {}
            } catch (e2) {}
          }
        } catch (e) {
          // ignore storage errors
        }
        setSuccess(true);
        return;
      }

      // Build a friendly message from the API envelope
      if (data && data.error) {
        // If the API provides field-level details, turn them into a readable string
        if (data.details && typeof data.details === 'object') {
          const parts = [];
          Object.keys(data.details).forEach(key => {
            const val = data.details[key];
            if (Array.isArray(val)) {
              parts.push(`${key}: ${val.join('; ')}`);
            } else {
              parts.push(`${key}: ${String(val)}`);
            }
          });
          setError(`${data.error} - ${parts.join(' | ')}`);
        } else {
          setError(data.error);
        }
      } else {
        setError('Signup failed. Please check your inputs and try again.');
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
          }}>Your account has been created successfully!!. We will notify you once we confim your identity.</p>

          <button 
            onClick={() => { setSignupStep && setSignupStep('none'); setShowLogin && setShowLogin(false); try { navigate('/Dashboard'); } catch (_) { window.location.href = '/Dashboard'; } }} 
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
          }}>Program Head Registration</h1>
          <p style={{ 
            color: '#666', 
            fontSize: '14px', 
            margin: '0 0 16px 0',
            textAlign: 'center',
            maxWidth: '400px',
            lineHeight: '1.5'
          }}>Register as a Program Head to manage and oversee your department's alumni records and activities</p>
          <div style={{
            backgroundColor: '#e3f2fd',
            borderRadius: '8px',
            padding: '16px',
            margin: '0 auto',
            maxWidth: '450px'
          }}>
            <div style={{ 
              fontSize: '14px', 
              color: '#1565c0', 
              fontWeight: '600',
              marginBottom: '8px'
            }}>As a Program Head, you will be able to:</div>
            <ul style={{ 
              margin: '0',
              paddingLeft: '24px',
              color: '#1976d2',
              fontSize: '13px',
              lineHeight: '1.6'
            }}>
              <li>Access and manage alumni records for your specific program</li>
              <li>Generate reports on alumni employment and achievements</li>
              <li>Communicate with program graduates</li>
              <li>Track career progression of your alumni</li>
            </ul>
          </div>
        </div>
        <form 
          onSubmit={handleSignup} 
          style={{ 
            width: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 20, 
            alignItems: 'stretch', 
            justifyContent: 'flex-start' 
          }}
        >
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ 
              fontWeight: '600', 
              color: '#1976d2', 
              marginBottom: '16px', 
              fontSize: '16px',
              letterSpacing: '0.5px' 
            }}>Personal Information</div>
            <h2 style={{
              fontWeight: '600',
              color: '#1976d2',
              marginBottom: '16px',
              fontSize: '16px',
              letterSpacing: '0.5px'
            }}>Personal & Professional Details</h2>
            <p style={{
              fontSize: '13px',
              color: '#666',
              margin: '-4px 0 8px 0'
            }}>Please provide your accurate information for identification</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span title="Username">👤</span>
              <input type="text" name="username" placeholder="Username" value={form.username || ''} onChange={handleChange} required style={{ padding: '6px', borderRadius: 8, border: '1px solid #1976d2', fontSize: 14, width: '100%', transition: 'border 0.3s', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span title="Name">📝</span>
              <input type="text" name="name" placeholder="Name" value={form.name} onChange={handleChange} required style={{ padding: '6px', borderRadius: 8, border: '1px solid #1976d2', fontSize: 14, width: '100%', transition: 'border 0.3s', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span title="Surname">👪</span>
              <input type="text" name="surname" placeholder="Surname" value={form.surname} onChange={handleChange} required style={{ padding: '6px', borderRadius: 8, border: '1px solid #1976d2', fontSize: 14, width: '100%', transition: 'border 0.3s', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span title="Middle Initial">🔤</span>
              <input type="text" name="mi" placeholder="M.I." value={form.mi} onChange={e => {
                const val = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
                if (val.length <= 1) setForm(f => ({ ...f, mi: val }));
              }} maxLength={1} style={{ padding: '6px', borderRadius: 8, border: '1px solid #1976d2', fontSize: 14, width: '100%', transition: 'border 0.3s', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span title="Gender">🚻</span>
              <select name="gender" value={form.gender} onChange={handleChange} required style={{ padding: '6px', borderRadius: 8, border: '1px solid #1976d2', fontSize: 14, width: '100%', marginBottom: 2, transition: 'border 0.3s' }}>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            {/* Contact Information Help Text */}
            <div style={{
              backgroundColor: '#f5f5f5',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <p style={{
                fontSize: '12px',
                color: '#666',
                margin: 0,
                lineHeight: '1.5'
              }}>
                Please provide your active contact details. Your contact information will be used for account verification and important communications.
              </p>
            </div>
            
            {/* Contact Fields */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span title="Contact Number">📱</span>
              <div style={{ width: '100%' }}>
                <input 
                  type="text" 
                  name="contact" 
                  placeholder="Enter your mobile number (e.g., 09123456789)" 
                  value={form.contact} 
                  onChange={handleChange} 
                  required 
                  style={{ 
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #1976d2',
                    fontSize: '13px',
                    transition: 'border 0.3s',
                    outline: 'none',
                    backgroundColor: '#f9f9f9'
                  }} 
                />
                <div style={{ 
                  fontSize: '11px',
                  color: '#666',
                  marginTop: '4px',
                  paddingLeft: '4px'
                }}>
                  Format: 11 digits starting with 09
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span title="Email">✉️</span>
              <div style={{ width: '100%' }}>
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Enter your institutional email" 
                  value={form.email} 
                  onChange={handleChange} 
                  required 
                  style={{ 
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #1976d2',
                    fontSize: '13px',
                    transition: 'border 0.3s',
                    outline: 'none',
                    backgroundColor: '#f9f9f9'
                  }} 
                />
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                    Use your official email address (e.g., <em>name@institution.com</em>). 
                  </div>
              </div>
            </div>
            {/* Faculty Section */}
            <div style={{
              backgroundColor: '#f5f5f5',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <div style={{
                fontSize: '13px',
                color: '#1976d2',
                fontWeight: '600',
                marginBottom: '8px'
              }}>Faculty & Program Assignment</div>
              <p style={{
                fontSize: '12px',
                color: '#666',
                marginBottom: '12px',
                lineHeight: '1.5'
              }}>
                Select your faculty and the specific program you will be managing. This will determine your access and responsibilities in the system.
              </p>
            </div>
            {/* Faculty Combo Box */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span title="Faculty">🏫</span>
              <select 
                name="faculty" 
                value={form.faculty} 
                onChange={handleChange} 
                required 
                style={{ 
                  padding: '6px', 
                  borderRadius: 8, 
                  border: '1px solid #1976d2', 
                  fontSize: 14, 
                  width: '100%', 
                  marginBottom: 2, 
                  transition: 'border 0.3s',
                  backgroundColor: '#f9f9f9'
                }}
              >
                <option value="">Select Faculty</option>
                {Object.keys(facultyPrograms).map(faculty => (
                  <option key={faculty} value={faculty}>{faculty}</option>
                ))}
              </select>
            </div>
            {/* Program Combo Box, shown only if faculty is selected */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span title="Program">🎓</span>
              <select name="program" value={form.program} onChange={handleChange} required disabled={!form.faculty} style={{ padding: '6px', borderRadius: 8, border: '1px solid #1976d2', fontSize: 14, width: '100%', marginBottom: 2, transition: 'border 0.3s', background: !form.faculty ? '#eee' : '#fff' }}>
                <option value="">{form.faculty ? 'Select Program' : 'Select Faculty First'}</option>
                {form.faculty && facultyPrograms[form.faculty].map(program => (
                  <option key={program} value={program}>{program}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ 
              fontWeight: '600', 
              color: '#1976d2', 
              marginBottom: '8px', 
              fontSize: '16px',
              letterSpacing: '0.5px' 
            }}>Security Information</div>
            <p style={{
              fontSize: '13px',
              color: '#666',
              margin: '-4px 0 8px 0'
            }}>Create a strong password to secure your account</p>
            <div style={{
              backgroundColor: '#e3f2fd',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '12px',
              fontSize: '12px',
              color: '#1565c0'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>Password Requirements:</div>
              <ul style={{ margin: '0', paddingLeft: '20px' }}>
                <li>At least 8 characters long</li>
                <li>Include both letters and numbers</li>
                <li>Include at least one special character</li>
              </ul>
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
              Create Program Head Account
            </button>
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
              try { if (typeof setSignupStep === 'function') setSignupStep('none'); } catch(_){}
              try { if (typeof setShowLogin === 'function') setShowLogin(true); } catch(_){}
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
export default ProgramHeadSignupPanel;
