/* eslint-disable react/jsx-pascal-case */
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
import SignupPanel from './SignupPanel';
import SignupChoicePanel from './SignupChoicePanel';
import ProgramHeadSignupPanel from './ProgramHeadSignupPanel';
import AdminDashboard from './AdminDashboard';
import ProgramHeadDashboard from './ProgramHeadDashboard';
import AlumniSurveysPanel from './AlumniSurveysPanel';
import AlumniProfilePanel from './AlumniProfilePanel';
import AlumniDashboard from './AlumniDashboard';
import ProtectedRoute from './ProtectedRoute';
import PostDetail from './PostDetail';
import ClaimAccount from './ClaimAccount';
import LoginPanel from './LoginPanel';
import { useNavigate, useLocation } from 'react-router-dom';

function LoginRouteWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const requestedFrom = (location && location.state && location.state.from) ? location.state.from : null;
  return (
    <LoginPanel
      onBack={() => { try { navigate('/'); } catch(_){} }}
      setSignupStep={() => {}}
      onLoginSuccess={(user, type) => {
        try { localStorage.setItem('currentUser', JSON.stringify(user)); } catch(_){}
        try { localStorage.setItem('userType', type); } catch(_){}
        try {
          if (user && user.token) {
            sessionStorage.setItem('server_token', user.token);
            sessionStorage.setItem('server_token_expires_at', String(user.token_expires_at || (Date.now() + (10 * 60 * 1000))));
          }
        } catch(_){}
        // Redirect based on user type
        const t = String(type || '').toLowerCase();
        if (t === 'admin') navigate(requestedFrom || '/Admin_panel');
        else if (t === 'program_head') navigate(requestedFrom || '/Program_head_panel');
        else if (t === 'alumni') navigate(requestedFrom || '/alumni/Dashboard');
        else navigate(requestedFrom || '/');
      }}
    />
  );
}
// FacultyPlaceholder routes removed — deep links handled by App

function AppRouter() {
  return (
    <Router>
      <Routes>
  <Route path="/" element={<App />} />
  {/* Support /Home url used by some links/screenshots */}
  <Route path="/Home" element={<App />} />
  {/* Capitalized-friendly routes (support /Dashboard and capitalized page paths) */}
  <Route path="/Dashboard" element={<App />} />
  {/* Allow deep links under the capitalized /Dashboard path (e.g. /Dashboard/Alumni_signup) */}
  <Route path="/Dashboard/*" element={<App />} />
  {/* Explicit deep link directly to the alumni signup panel (diagnostic/fix) */}
  <Route path="/Dashboard/Alumni_signup" element={<SignupPanel onBack={() => { try { window.history.back(); } catch(_){} }} setSignupStep={() => {}} setShowLogin={() => {}} />} />
  <Route path="/Dashboard/Program_head_signup" element={<ProgramHeadSignupPanel onBack={() => { try { window.history.back(); } catch(_){} }} setSignupStep={() => {}} setShowLogin={() => {}} />} />
  {/* Explicit canonical signup route */}
  <Route path="/signup" element={<SignupPanel onBack={() => { try { window.history.back(); } catch(_){} }} setSignupStep={() => {}} setShowLogin={() => {}} />} />
  {/* Signup choice (select user role) canonical route */}
  <Route path="/select_user" element={<SignupChoicePanel onChoose={() => { try { window.location.href = '/signup'; } catch(_){} }} onBack={() => { try { window.history.back(); } catch(_){} }} setSignupStep={() => {}} setShowLogin={() => {}} />} />
  {/* Program Head canonical signup route */}
  <Route path="/programhead_signup" element={<ProgramHeadSignupPanel onBack={() => { try { window.history.back(); } catch(_){} }} setSignupStep={() => {}} setShowLogin={() => {}} />} />
  {/* Program Head alternate canonical route (alias) */}
  <Route path="/programhead_sign" element={<ProgramHeadSignupPanel onBack={() => { try { window.history.back(); } catch(_){} }} setSignupStep={() => {}} setShowLogin={() => {}} />} />
  <Route path="/Academics" element={<App />} />
  <Route path="/About" element={<App />} />
  <Route path="/Contact" element={<App />} />
  {/* Admin panel - protected route */}
  <Route path="/Admin_panel" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
  {/* Program Head panel - protected route */}
  <Route path="/Program_head_panel" element={<ProtectedRoute requiredRole="program_head"><ProgramHeadDashboard /></ProtectedRoute>} />
        {/* Post detail route (renders a full-page view of a post) */}
        <Route path="/posts/:id" element={<PostDetail />} />
  <Route path="/claim-account" element={<ClaimAccount />} />
  {/* Public surveys route (allow visitors to fill survey without an alumni account) */}
  <Route path="/surveys" element={<AlumniSurveysPanel />} />
  {/* Login route wrapper uses navigate to redirect after persisting login data */}
  <Route path="/login" element={<LoginRouteWrapper />} />
        <Route path="/alumni/Dashboard" element={<AlumniDashboard />} />
        <Route path="/alumni/Academics" element={<AlumniDashboard />} />
        <Route path="/alumni/About" element={<AlumniDashboard />} />
        <Route path="/alumni/Contact" element={<AlumniDashboard />} />
        <Route path="/alumni" element={<ProtectedRoute requiredRole="alumni"><AlumniDashboard /></ProtectedRoute>}>
          <Route path="surveys" element={<AlumniSurveysPanel />} />
          <Route path="profile" element={<AlumniProfilePanel />} />
        </Route>
  {/* Render the main App for these paths so Header/Footer remain mounted; App will show the correct inner page based on the URL */}
  <Route path="/academics" element={<App />} />
  {/* Route deep links back to the main App so the Academics page renders inside the shell */}
  <Route path="/academics/:slug" element={<App />} />
  <Route path="/about" element={<App />} />
  <Route path="/contact" element={<App />} />
        {/* Add more routes as needed */}
      </Routes>
    </Router>
  );
}

export default AppRouter;
