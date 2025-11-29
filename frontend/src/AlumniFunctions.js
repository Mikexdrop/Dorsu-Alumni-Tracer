import React from 'react';
// AlumniFunctions.js
// Contains alumni navigation and section rendering logic
import { useNavigate } from 'react-router-dom';

import AlumniInboxPanel from './AlumniInboxPanel';
import AlumniProfilePanel from './AlumniProfilePanel';
import AlumniSurveysPanel from './AlumniSurveysPanel';

// Consent modal and home page component
function ConsentHome({ user }) {
  const navigate = useNavigate();
  const [showConsent, setShowConsent] = React.useState(false);
  const [showConsentMsg, setShowConsentMsg] = React.useState(false);
  const [alumniCount, setAlumniCount] = React.useState(1200);
  const sectionRef = React.useRef(null);
  const totalAlumniRef = React.useRef(null);
  const [totalAlumniVisible, setTotalAlumniVisible] = React.useState(false);
  const [visible, setVisible] = React.useState(false);

  const consentText = `Davao Oriental State University is conducting the Alumni Tracer Survey to understand the career paths and educational outcomes of our alumni. Your participation is voluntary and will take around 5–10 minutes.\n\nYour personal data will be handled securely, retained only as long as needed, and disposed of responsibly in line with the Data Privacy Act of 2012.\n\nBy proceeding, you consent to the collection and processing of your information for this purpose.`;

  // Fetch alumni count on mount and update state
  React.useEffect(() => {
    let mounted = true;
    async function fetchAlumniCount() {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/alumni/');
        const data = await res.json().catch(() => null);
        let count = null;
        if (data && typeof data === 'object') {
          if (typeof data.count === 'number') count = data.count;
          else if (Array.isArray(data.results)) count = data.results.length;
          else if (Array.isArray(data)) count = data.length;
        }
        if (mounted && typeof count === 'number') setAlumniCount(count);
      } catch (err) {
        console.warn('Failed to fetch alumni count', err);
      }
    }
    fetchAlumniCount();
    return () => { mounted = false; };
  }, []);

  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return setVisible(true);
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      });
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // IntersectionObserver for the Total Alumni tile to animate it sliding in from the right
  React.useEffect(() => {
    const el = totalAlumniRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return setTotalAlumniVisible(true);
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          setTotalAlumniVisible(true);
          io.disconnect();
        }
      });
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #0f2c3e 0%, #1a4b6d 50%, #2a6b97 100%)'
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
      <section ref={sectionRef} style={{ 
        position: 'relative',
        width: '100%', 
        maxWidth: 1600, // increased max width
        minHeight: '420px', 
        color: '#fff', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: 0, 
        boxSizing: 'border-box', 
        overflow: 'hidden', 
        marginTop: '48px',
        zIndex: 1,
        transform: visible ? 'translateX(0)' : 'translateX(30px)',
        opacity: visible ? 1 : 0,
        transition: 'transform 3000ms cubic-bezier(.2,.8,.2,1), opacity 3000ms ease'
      }}>
        <div className="mainbody-content" style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: '100%',
            maxWidth: 1400, // increased max width
            margin: '0 auto', 
            gap: 32,
            position: 'relative',
            zIndex: 2
        }}>
          <style>{`
            .mainbody-content::-webkit-scrollbar {
              width: 10px;
              background: rgba(255,255,255,0.08);
            }
            .mainbody-content::-webkit-scrollbar-thumb {
              background: #1976d2;
              border-radius: 8px;
            }
          `}</style>
          {/* Article Section (Left) */}
          <div className="mainbody-article mainbody-animate-left" style={{ 
            flex: 1, 
            minWidth: 320, 
            maxWidth: 500, 
            textAlign: 'left', 
            opacity: 1, 
            color: '#fff',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            padding: '32px'
          }}>
            <h1 style={{ fontSize: '2.5rem', color: '#fff', fontWeight: 800, marginBottom: 18, lineHeight: 1.1 }}>DOrSU<br />Alumni Dashboard</h1>
            <p style={{ fontSize: '1.15rem', color: 'rgba(255, 255, 255, 0.9)', marginBottom: 32, lineHeight: 1.5 }}>
              Welcome, {user.username}! This dashboard provides you with the latest alumni statistics, program updates, and survey results. Stay connected and explore opportunities tailored for DOrSU graduates.
            </p>
            <style>{`
              .af-btn { padding: 12px 32px; border-radius: 8px; font-weight: 700; font-size: 1rem; cursor: pointer; transition: all 200ms ease; border: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
              .af-btn:focus { outline: 3px solid rgba(25,118,210,0.18); outline-offset: 2px; }
              .af-btn--primary { background: #33691e; color: #fff; box-shadow: 0 6px 16px rgba(0,0,0,0.14); }
              .af-btn--primary:hover { background: #3e7d22; transform: translateY(-2px); box-shadow: 0 10px 24px rgba(0,0,0,0.18); }
              .af-btn--ghost { background: transparent; color: #fff; border: 2px solid rgba(255,255,255,0.16); }
              .af-btn--ghost:hover { background: rgba(255,255,255,0.06); transform: translateY(-2px); border-color: rgba(255,255,255,0.24); }
              .af-btn--muted { background: #eee; color: #1976d2; border: 1px solid #1976d2; }
            `}</style>
            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
              <button className="af-btn af-btn--primary" onClick={() => setShowConsent(true)}>Get Started</button>
              <button className="af-btn af-btn--ghost">Learn More</button>
            </div>
          </div>
          {/* Logo Section (Right) */}
          <div className="mainbody-carousel mainbody-animate-right" style={{ 
            flex: 1, 
            minWidth: 320, 
            maxWidth: 600, 
            height: '420px', 
            position: 'relative', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: 18,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden', 
            opacity: 1,
            zIndex: 2
          }}>
            <style>{`
              .alumni-logo-img { transition: transform 300ms cubic-bezier(.2,.8,.2,1), box-shadow 300ms ease; cursor: pointer; will-change: transform; }
              .alumni-logo-img:hover { transform: translateY(-8px) scale(1.06); box-shadow: 0 18px 40px rgba(0,0,0,0.28); }
            `}</style>
            <img
              src={process.env.PUBLIC_URL + '/image.png'}
              alt="DOrSU Logo"
              className="alumni-logo-img"
              style={{
                width: '80%',
                height: '80%',
                objectFit: 'contain',
                borderRadius: 12,
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
              }}
            />
          </div>
        </div>
        {/* Add space between article/image and dashboard */}
        <div style={{ height: 100 }} />
        {/* Dashboard Section (Animated) */}
        <style>{`
          .mainbody-dashboard-number { transition: transform 350ms cubic-bezier(.2,.8,.2,1), box-shadow 350ms ease, text-shadow 350ms ease; will-change: transform; }
          .mainbody-dashboard-number:hover { transform: translateY(-8px) scale(1.06); text-shadow: 0 10px 30px rgba(0,0,0,0.25); }
        `}</style>
        <div className="mainbody-dashboard mainbody-animate-up" style={{ 
          width: '100%', 
          maxWidth: 1200, 
          margin: '0 auto 0', 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 64, 
          flexWrap: 'wrap', 
          opacity: 1,
          position: 'relative',
          zIndex: 2,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          marginBottom: '48px'
        }}>
          <div ref={totalAlumniRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 22, marginBottom: 16, minWidth: 120, color: '#fff', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', transform: totalAlumniVisible ? 'translateX(0)' : 'translateX(30px)', opacity: totalAlumniVisible ? 1 : 0, transition: 'transform 3000ms cubic-bezier(.2,.8,.2,1), opacity 3000ms ease' }}>
            <div style={{ fontSize: 18, marginBottom: 6, color: 'rgba(255, 255, 255, 0.8)' }}>Total Alumni</div>
            <div className="mainbody-dashboard-number" style={{ fontSize: 48, fontWeight: 900, color: '#1976d2', transition: 'transform 0.3s cubic-bezier(.77,.2,.25,1)' }}>{alumniCount}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 22, marginBottom: 16, minWidth: 120, color: '#fff', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', transition: 'all 0.3s ease' }}>
            <div style={{ fontSize: 18, marginBottom: 6, color: 'rgba(255, 255, 255, 0.8)' }}>Active Programs</div>
            <div className="mainbody-dashboard-number" style={{ fontSize: 48, fontWeight: 900, color: '#388e3c', transition: 'transform 0.3s cubic-bezier(.77,.2,.25,1)' }}>8</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 22, marginBottom: 16, minWidth: 120, color: '#fff', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', transition: 'all 0.3s ease' }}>
            <div style={{ fontSize: 18, marginBottom: 6, color: 'rgba(255, 255, 255, 0.8)' }}>Surveys Completed</div>
            <div className="mainbody-dashboard-number" style={{ fontSize: 48, fontWeight: 900, color: '#d32f2f', transition: 'transform 0.3s cubic-bezier(.77,.2,.25,1)' }}>320</div>
          </div>
        </div>
        {/* Consent Modal */}
        {showConsent && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.25)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              background: '#fff',
              color: '#222',
              borderRadius: 18,
              boxShadow: '0 6px 32px #0002',
              padding: '36px 28px',
              maxWidth: 600,
              width: '90%',
              textAlign: 'left',
              position: 'relative'
            }}>
              <h2 style={{ color: '#1976d2', marginBottom: 18, fontSize: '2rem', fontWeight: 900, fontFamily: 'Segoe UI, Arial, sans-serif', letterSpacing: '0.5px' }}>Privacy Notice & Consent</h2>
              <div style={{
                maxHeight: '220px',
                overflowY: 'auto',
                background: 'rgba(25, 118, 210, 0.07)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: 24,
                boxShadow: '0 2px 8px rgba(25,118,210,0.08)'
              }}>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '1.25rem', color: '#222', margin: 0, fontWeight: 600, fontFamily: 'Segoe UI, Arial, sans-serif', lineHeight: 1.6 }}>{consentText}</pre>
                <style>{`
                  .mainbody-content pre::-webkit-scrollbar {
                    width: 8px;
                    background: rgba(25,118,210,0.08);
                  }
                  .mainbody-content pre::-webkit-scrollbar-thumb {
                    background: #1976d2;
                    border-radius: 8px;
                  }
                `}</style>
              </div>
              <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 18 }}>
                <button
                  className="af-btn af-btn--primary"
                  onClick={() => { 
                    setShowConsent(false);
                    // Navigate to surveys section
                    navigate('/alumni/surveys');
                  }}
                >Agree</button>
                <button
                  className="af-btn af-btn--muted"
                  onClick={() => { setShowConsent(false); setTimeout(() => setShowConsentMsg(true), 0); }}
                >Disagree</button>
              </div>
            </div>
          </div>
        )}
        {/* Small feedback modal for Disagree */}
        {typeof showConsent !== 'undefined' && (
          <React.Fragment>
            {/* We'll render a transient message when the user disagrees */}
            {showConsentMsg && (
              <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2200 }}>
                <div style={{ background: '#fff', padding: 20, borderRadius: 10, minWidth: 320, textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Consent</div>
                  <div style={{ marginBottom: 12 }}>You disagreed with the consent.</div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button onClick={() => setShowConsentMsg(false)} className="af-btn af-btn--ghost">OK</button>
                  </div>
                </div>
              </div>
            )}
          </React.Fragment>
        )}
      </section>
    </div>
  );
}

export function getAlumniSections(activeSection, user) {
  switch (activeSection) {
    case 'home':
      return {
        content: (
          <ConsentHome user={user} />
        )
      };
    case 'profile':
      return {
        content: <AlumniProfilePanel />
      };
    case 'inbox':
      return {
        title: 'Messages',
        content: <AlumniInboxPanel />
      };
    case 'jobs':
      return {
        title: 'Job Opportunities',
        content: (
          <>
            <p>Browse job listings and career opportunities.</p>
            <div style={{ background: '#fff8e1', padding: 20, borderRadius: 8, marginTop: 20 }}>
              <h3>Featured Jobs</h3>
              <p>Check out the latest job postings.</p>
            </div>
          </>
        )
      };
    case 'applications':
      return {
        title: 'My Applications',
        content: (
          <>
            <p>Track your job applications and status.</p>
            <div style={{ background: '#fce4ec', padding: 20, borderRadius: 8, marginTop: 20 }}>
              <h3>Application Status</h3>
              <p>View the status of your submitted applications.</p>
            </div>
          </>
        )
      };
    case 'surveys':
      return {
        content: <AlumniSurveysPanel />
      };
    default:
      return {
        title: 'Alumni Dashboard',
        content: (
          <>
            <p>Welcome, {user.username}! Alumni specific content goes here.</p>
          </>
        )
      };
  }
}