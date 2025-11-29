
import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';

const Header = ({ onLogin, onSignup, onNavigate, currentPage }) => {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  const pathname = location && typeof location.pathname === 'string' ? location.pathname : '';
  // If the current user is an alumni, prefer alumni-prefixed routes so the
  // alumni SPA shell (AlumniDashboard) stays mounted under /alumni/* paths.
  const alumniBase = (() => {
    try {
      return localStorage.getItem('userType') === 'alumni' ? '/alumni' : '';
    } catch (_) { return ''; }
  })();
  // ensure the viewport scrolls to top whenever the route changes (covers refresh and navigation)
  useEffect(() => {
    try { window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }); } catch (_) { /* noop */ }
  }, [pathname]);
  // hide nav links when on the surveys route to reduce distraction
  const hideNav = pathname.includes('/surveys');
  const navigate = useNavigate();

  const handleLoginClick = (e) => {
    try { if (typeof onLogin === 'function') onLogin(e); } catch (_) {}
    try { navigate('/login'); } catch (_) { window.location.href = '/login'; }
  };

  return (
    <header style={{
      width: '100%',
      background: 'linear-gradient(90deg, #222 70%, #1976d2 100%)',
      color: '#fff',
      boxShadow: '0 2px 8px #0002',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: 0,
    }}>
      <style>{`
        @media (max-width: 800px) {
          .header-row {
            flex-direction: column;
            align-items: flex-start !important;
            padding: 0 8px !important;
            min-height: 64px !important;
          }
          .header-logo-title {
            flex-direction: row !important;
            align-items: center !important;
            margin-bottom: 0 !important;
          }
          .header-logo-title img {
            height: 44px !important;
            width: 44px !important;
            margin-right: 10px !important;
          }
          .header-title-main {
            font-size: 16px !important;
            line-height: 1.1 !important;
          }
          .header-title-sub {
            font-size: 11px !important;
          }
          .header-btns {
            margin: 0 0 8px 0 !important;
            gap: 8px !important;
            flex-direction: row;
            width: 100%;
            justify-content: flex-end;
            position: relative;
          }
          .nav-toggle-btn {
            display: inline-block !important;
            order: 0;
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            margin-left: 0 !important;
          }
          .header-login-btn {
            order: 1;
          }
          .header-signup-btn {
            order: 2;
          }
        }
        @media (max-width: 600px) {
          .header-row { min-height: 48px !important; }
          .header-logo-title img { height: 40px !important; width: 40px !important; }
          .header-title-main { font-size: 14px !important; }
          .header-title-sub { display: none !important; }
        }
        .nav-toggle-btn {
          display: none;
          background: none;
          border: none;
          color: #ffd600;
          font-size: 32px;
          margin-left: 12px;
          cursor: pointer;
        }
        .nav-panel {
          display: flex;
          align-items: center;
          gap: 20px;
          justify-content: center;
          padding: 8px 0;
          border-top: 1px solid #444;
          background: rgba(25, 118, 210, 0.15);
        }
        .nav-panel.mobile {
          flex-direction: column;
          align-items: flex-start;
          gap: 0;
          padding: 0 0 6px 0;
          background: #222;
          border-top: none;
          box-shadow: 0 2px 8px #0002;
        }
        .nav-link {
          color: #fff;
          font-weight: bold;
          font-size: 16px;
          text-decoration: none;
          letter-spacing: 1px;
          transition: color 0.2s, background 0.2s, box-shadow 0.2s;
          padding: 6px 18px;
          border-radius: 6px;
          cursor: pointer;
        }
        .nav-link.active {
          background: #ffd600;
          color: #222 !important;
          box-shadow: 0 2px 8px #ffd60044;
        }
        .nav-link:hover {
          background: #ffd600;
          color: #222 !important;
          box-shadow: 0 2px 8px #ffd60044;
        }
        .nav-link.mobile {
          width: 100%;
          box-sizing: border-box;
          text-align: left;
          border-radius: 0;
          padding: 12px 18px;
          font-size: 16px;
          border-bottom: 1px solid #333;
        }
      `}</style>
      <div className="header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', minHeight: 90 }}>
        <div className="header-logo-title" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <img src="/image.png" alt="DORSU Logo" style={{ height: 80, width: 80, marginRight: 24, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 8px #0002' }} />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span className="header-title-main" style={{ fontSize: 32, fontWeight: 'bold', color: '#ffd600', letterSpacing: 2, lineHeight: 1 }}>DAVAO ORIENTAL STATE UNIVERSITY</span>
            <span className="header-title-sub" style={{ fontSize: 18, fontWeight: 'bold', color: '#fff', marginTop: 2, letterSpacing: 1 }}>
              GUANG-GUANG, DAHICAN, CITY OF MATI, 8200 DAVAO ORIENTAL, PHILIPPINES
            </span>
          </div>
        </div>
        <div className="header-btns" style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 0, marginRight: 32 }}>
          <button className="nav-toggle-btn" aria-label="Toggle navigation" onClick={() => setNavOpen(o => !o)}>
            {navOpen ? <span>&#10005;</span> : <span>&#9776;</span>}
          </button>
          <button onClick={handleLoginClick} className="header-login-btn" style={{
            padding: '6px 14px',
            fontSize: 14,
            background: '#ffd600',
            color: '#222',
            border: 'none',
            borderRadius: 6,
            fontWeight: 'bold',
            boxShadow: '0 2px 8px #ffd600',
            cursor: 'pointer',
            transition: 'background 0.3s'
          }}>Login</button>
          <button onClick={(e) => { try { if (typeof onSignup === 'function') onSignup(e); } catch(_){} try { navigate('/select_user'); } catch(_) { window.location.href = '/select_user'; } }} className="header-signup-btn" style={{
            padding: '6px 14px',
            fontSize: 14,
            background: '#fff',
            color: '#1976d2',
            border: '2px solid #ffd600',
            borderRadius: 6,
            fontWeight: 'bold',
            boxShadow: '0 2px 8px #ffd600',
            cursor: 'pointer',
            transition: 'background 0.3s, color 0.3s'
          }}>Signup</button>
        </div>
  </div>
      {/* Responsive nav: only show nav links on desktop or if navOpen on mobile. Hide completely on survey pages */}
      {!hideNav && (
        <nav
          className={`nav-panel${navOpen ? ' mobile' : ''}`}
          style={{
            ...(navOpen
              ? { flexDirection: 'column', alignItems: 'flex-start', gap: 0, padding: '0 0 8px 0', background: '#222', borderTop: 'none', boxShadow: '0 2px 8px #0002', display: 'flex' }
              : { display: 'flex' }),
            // Hide nav links on mobile unless navOpen
            ...(window.innerWidth <= 800 && !navOpen ? { display: 'none' } : {})
          }}
        >
          <Link to={alumniBase ? `${alumniBase}/Dashboard` : '/Dashboard'} className={`nav-link home${currentPage === 'home' ? ' active' : ''}${navOpen ? ' mobile' : ''}`} onClick={(e) => { setNavOpen(false); try { window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }); } catch (_) {} if (typeof onNavigate === 'function') onNavigate('home'); }}>Home</Link>
          <Link to={alumniBase ? `${alumniBase}/Academics` : '/Academics'} className={`nav-link${currentPage === 'academics' ? ' active' : ''}${navOpen ? ' mobile' : ''}`} onClick={(e) => { setNavOpen(false); try { window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }); } catch (_) {} if (typeof onNavigate === 'function') onNavigate('academics'); }}>Academics</Link>
          <Link to={alumniBase ? `${alumniBase}/About` : '/About'} className={`nav-link${currentPage === 'about' ? ' active' : ''}${navOpen ? ' mobile' : ''}`} onClick={(e) => { setNavOpen(false); try { window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }); } catch (_) {} if (typeof onNavigate === 'function') onNavigate('about'); }}>About</Link>
          <Link to={alumniBase ? `${alumniBase}/Contact` : '/Contact'} className={`nav-link${currentPage === 'contact' ? ' active' : ''}${navOpen ? ' mobile' : ''}`} onClick={(e) => { setNavOpen(false); try { window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }); } catch (_) {} if (typeof onNavigate === 'function') onNavigate('contact'); }}>Contact</Link>
        </nav>
      )}
    </header>
  );
}


export default Header;
