import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import Academics from './Academics';
import About from './About';
import Footer from './Footer';
import Contact from './Contact';
import AlumniDashboard from './AlumniDashboard';
import AdminDashboard from './AdminDashboard';
import MainBody from './MainBody';
import SignupChoicePanel from './SignupChoicePanel';
import ProgramHeadSignupPanel from './ProgramHeadSignupPanel';
import ProgramHeadDashboard from './ProgramHeadDashboard';
import SignupPanel from './SignupPanel';
import LoginPanel from './LoginPanel';

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [signupStep, setSignupStep] = useState('none'); // none | choice | alumni | program_head
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [userType, setUserType] = useState(() => {
    return localStorage.getItem('userType') || null;
  });
  const [page, setPage] = useState('home'); // home | academics | about | contact
  const location = useLocation();
  const navigate = useNavigate();
  // If a ProtectedRoute redirected here, it may have set location.state.from to
  // the originally requested URL (so we can navigate back after login).
  const requestedFrom = (location && location.state && location.state.from) ? location.state.from : null;

  // helper: whether current URL is the admin route
  const isAdminRoute = (location && location.pathname && String(location.pathname).toLowerCase().startsWith('/admin'));

  // Keep page state in sync with the current URL so App works when mounted at multiple routes
  useEffect(() => {
    try {
      const p = (location && location.pathname) ? location.pathname.toLowerCase() : '/';
      if (p.startsWith('/academics')) setPage('academics');
      else if (p.startsWith('/about')) setPage('about');
      else if (p.startsWith('/contact')) setPage('contact');
      else setPage('home');
    } catch (_) {
      setPage('home');
    }
  }, [location]);

  // Keep localStorage in sync with login/logout
  useEffect(() => {
    if (currentUser && userType) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      localStorage.setItem('userType', userType);
      try {
        window.dispatchEvent(new CustomEvent('user-updated', { detail: { currentUser, userType } }));
      } catch (_) {}
    } else {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userType');
      try {
        window.dispatchEvent(new CustomEvent('user-updated', { detail: null }));
      } catch (_) {}
    }
  }, [currentUser, userType]);

  // Centralize render selection into a single return path to avoid conditional
  // hook invocation order issues. Compute the content to render and return it
  // at the end of the component.
  const handleLogout = () => {
    setCurrentUser(null);
    setUserType(null);
    try {
      sessionStorage.removeItem('server_token');
      sessionStorage.removeItem('server_token_expires_at');
      // also remove any legacy role tokens
      sessionStorage.removeItem('admin_access_token');
      sessionStorage.removeItem('admin_access_token_exp');
      sessionStorage.removeItem('program_head_access_token');
      sessionStorage.removeItem('program_head_access_token_exp');
      sessionStorage.removeItem('alumni_access_token');
      sessionStorage.removeItem('alumni_access_token_exp');
    } catch (_) {}
    try {
      // Also clear any persistent auth token in localStorage and currentUser/userType to be safe
      try { localStorage.removeItem('token'); } catch (_) {}
      try { localStorage.removeItem('auth_token'); } catch (_) {}
      try { localStorage.removeItem('access_token'); } catch (_) {}
      try { localStorage.removeItem('refresh_token'); } catch (_) {}
      try { localStorage.removeItem('currentUser'); localStorage.removeItem('userType'); } catch(_) {}
      // Fire a user-updated event for listeners
      try { window.dispatchEvent(new CustomEvent('user-updated', { detail: null })); } catch(_){ }
      // Use a full-page replace to ensure all mounted components unmount and any memory cached state is cleared
      try {
        window.location.replace('/');
      } catch (e) {
        try { navigate('/'); } catch(_){}
      }
    } catch(_){}
  };

  let content = null;

  // If user is logged in, choose the appropriate dashboard
  if (currentUser) {
    if (isAdminRoute && userType === 'admin') {
      content = <AdminDashboard user={currentUser} onLogout={handleLogout} />;
    } else if (userType === 'admin') {
      content = <AdminDashboard user={currentUser} onLogout={handleLogout} />;
    } else if (userType === 'program_head') {
      content = <ProgramHeadDashboard user={currentUser} onLogout={handleLogout} />;
    } else if (userType === 'alumni') {
      content = <AlumniDashboard user={currentUser} onLogout={handleLogout} />;
    }
  }

  // If not authenticated and trying to access admin route, show login panel first
  if (!content && isAdminRoute && !currentUser) {
    content = (
      <LoginPanel
        onBack={() => { try { navigate('/'); } catch(_){} }}
        setSignupStep={setSignupStep}
        onLoginSuccess={async (user, type) => {
          setCurrentUser(user);
          setUserType(type);
          setShowLogin(false);
          try {
            // If backend included a server-issued token, persist it for frontend validation
            try {
              if (user && user.token) {
                sessionStorage.setItem('server_token', user.token);
                sessionStorage.setItem('server_token_expires_at', String(user.token_expires_at || (Date.now() + (10 * 60 * 1000))));
              }
            } catch(_){}
            navigate(requestedFrom || '/Admin_panel');
          } catch (_) {}
        }}
      />
    );
  }

  // If showLogin overlay is triggered, render login panel
  if (!content && showLogin) {
    content = (
      <LoginPanel
        onBack={() => setShowLogin(false)}
        setSignupStep={setSignupStep}
        onLoginSuccess={async (user, type) => {
            if (type === 'alumni') {
            // Fetch full alumni profile; fall back to provided user if fetch fails
            try {
              const res = await fetch(`http://localhost/capstone%202%20Alumni/backend/alumni_user_profile.php?id=${user.id}`);
              const profile = await res.json();
              setCurrentUser(profile);
              setUserType(type);
              setShowLogin(false);
              try {
                // Issue a short-lived alumni session token to protect alumni-only deep links
                try {
                  if (user && user.token) {
                    sessionStorage.setItem('server_token', user.token);
                    sessionStorage.setItem('server_token_expires_at', String(user.token_expires_at || (Date.now() + (10 * 60 * 1000))));
                  }
                } catch(_){}
                navigate(requestedFrom || '/alumni/Dashboard');
              } catch (_) {}
            } catch (err) {
              setCurrentUser(user);
              setUserType(type);
              setShowLogin(false);
              try {
                try {
                  const token = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
                  const ttlMs = 10 * 60 * 1000; // 10 minutes
                  sessionStorage.setItem('alumni_access_token', token);
                  sessionStorage.setItem('alumni_access_token_exp', String(Date.now() + ttlMs));
                } catch(_){}
                navigate(requestedFrom || '/alumni/Dashboard');
              } catch (_) {}
            }
            } else {
            setCurrentUser(user);
            setUserType(type);
            setShowLogin(false);
            try {
              if (String(type).toLowerCase() === 'admin') {
                try {
                  if (user && user.token) {
                    sessionStorage.setItem('server_token', user.token);
                    sessionStorage.setItem('server_token_expires_at', String(user.token_expires_at || (Date.now() + (10 * 60 * 1000))));
                  }
                } catch(_){}
                navigate(requestedFrom || '/Admin_panel');
              } else if (String(type).toLowerCase() === 'program_head') {
                try {
                  if (user && user.token) {
                    sessionStorage.setItem('server_token', user.token);
                    sessionStorage.setItem('server_token_expires_at', String(user.token_expires_at || (Date.now() + (10 * 60 * 1000))));
                  }
                } catch(_){}
                navigate(requestedFrom || '/Program_head_panel');
              } else {
                navigate(requestedFrom || '/Dashboard');
              }
            } catch (_) {}
          }
        }}
      />
    );
  }

  // Signup panels
  const pLower = (location && location.pathname) ? location.pathname.toLowerCase() : '';
  const isAlumniSignupRoute = pLower.startsWith('/dashboard/alumni_signup');
  if (!content && signupStep === 'choice') {
    content = (
      <SignupChoicePanel
        onChoose={type => setSignupStep(type)}
        onBack={() => setSignupStep('none')}
        setSignupStep={setSignupStep}
        setShowLogin={setShowLogin}
      />
    );
  }
  if (!content && signupStep === 'program_head') {
    content = (
      <ProgramHeadSignupPanel
        onBack={() => setSignupStep('choice')}
        setSignupStep={setSignupStep}
        setShowLogin={setShowLogin}
      />
    );
  }
  if (!content && signupStep === 'alumni') {
    content = (
      <SignupPanel
        onBack={() => setSignupStep('choice')}
        setSignupStep={setSignupStep}
        setShowLogin={setShowLogin}
      />
    );
  }

  // Explicit route for alumni signup
  if (!content && isAlumniSignupRoute) {
    content = (
      <SignupPanel
        onBack={() => { try { navigate('/'); } catch(_){} }}
        setSignupStep={setSignupStep}
        setShowLogin={setShowLogin}
      />
    );
  }

  // If a specific content has been chosen (dashboards, login, signup panels), render it
  if (content) return content;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column' }}>
      <Header
        onLogin={() => setShowLogin(true)}
        onSignup={() => setSignupStep('choice')}
        onNavigate={nav => setPage(nav)}
        currentPage={page}
      />
      {page === 'home' && <MainBody onGetStarted={() => setSignupStep('choice')} />}
      {page === 'academics' && <Academics />}
      {page === 'about' && <About />}
      {page === 'contact' && <Contact />}
      <Footer onNavigate={nav => setPage(nav)} />
    </div>
  );
}
export default App;
