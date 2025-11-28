import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './components/responsive.css';
import programs from './programs';

function ClaimAccount() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const debounceRef = useRef(null);
  const nameInputRef = useRef(null);
  const usernameRef = useRef(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const confirmYesRef = useRef(null);
  const [confirmPos, setConfirmPos] = useState(null);
  const confirmPanelRef = useRef(null);
  const verifyCourseRef = useRef(null);
  const verifyYearRef = useRef(null);
  const [programSuggestions, setProgramSuggestions] = useState([]);
  const [showProgramSuggestions, setShowProgramSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const [verifyCourse, setVerifyCourse] = useState('');
  const [verifyYear, setVerifyYear] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [usernameValid, setUsernameValid] = useState(null); // null=unknown, true/false
  const [passwordValid, setPasswordValid] = useState(null);
  const [confirmValid, setConfirmValid] = useState(null);
  const pwdPressRef = useRef(null);
  const confirmPressRef = useRef(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [autoLoggingIn, setAutoLoggingIn] = useState(false);

  const searchAlumni = async () => {
    setError('');
    setResults([]);
    setSelected(null);
    if (!name && !year) {
      setError('Please enter a name or year to search');
      return;
    }
  setLoading(true);
  setStatusText('Searching...');
    try {
      const q = encodeURIComponent(name || '');
      const y = encodeURIComponent(year || '');

      // Try a few likely server endpoints: absolute dev host then relative
      const hostCandidates = ['', 'http://127.0.0.1:8000'];
      const pathCandidates = [
        `/api/alumni/?search=${q}&year_graduated=${y}`,
        `/api/alumni/?q=${q}&year_graduated=${y}`,
        `/api/alumni/?full_name=${q}&year_graduated=${y}`,
        `/api/alumni/search/?q=${q}&year=${y}`,
        `/api/alumni/` // fallback: get list and filter client-side
      ];

      let data = null;
      for (const host of hostCandidates) {
        for (const path of pathCandidates) {
          const url = `${host}${path}`;
          try {
            const res = await fetch(url);
            if (!res.ok) continue;
            const json = await res.json().catch(() => null);
            if (!json) continue;
            if (Array.isArray(json)) { data = json; break; }
            if (Array.isArray(json.results)) { data = json.results; break; }
            if (Array.isArray(json.alumni)) { data = json.alumni; break; }
            // for single object, try to detect a list-like property
            const maybe = json.results || json.items || json.alumni || null;
            if (Array.isArray(maybe)) { data = maybe; break; }
          } catch (e) {
            // continue to next candidate
            continue;
          }
        }
        if (data) break;
      }

      // If server didn't return results, try fetching all alumni then filter locally
      if (!data || data.length === 0) {
        try {
          const res = await fetch('http://127.0.0.1:8000/api/alumni/');
          if (res.ok) {
            const json = await res.json().catch(() => null);
            let all = Array.isArray(json) ? json : (Array.isArray(json.results) ? json.results : (Array.isArray(json.alumni) ? json.alumni : []));
            // normalize to simple objects and filter by name/year
            const qLower = (name || '').toLowerCase().trim();
            const yVal = year ? String(year).trim() : '';
            const filtered = all.filter(a => {
              const full = ((a.full_name || a.name || [a.first_name, a.middle_name, a.last_name].filter(Boolean).join(' ')) || '').toLowerCase();
              const matchesName = qLower === '' ? true : full.includes(qLower);
              const ay = (a.year_graduated || a.year || '').toString();
              const matchesYear = yVal === '' ? true : ay === yVal;
              return matchesName && matchesYear;
            });
            data = filtered;
          }
        } catch (_) {
          // ignore
        }
      }

      data = data || [];
      // Normalize results into shape expected by UI
      // IMPORTANT: only include records that have an explicit full name (item.full_name or item.name).
      const normalized = data
        .map(item => {
          const fn = (item.full_name ?? item.name ?? '').toString().trim();
          return {
            id: item.id ?? item.pk ?? item.alumni_id ?? null,
            full_name: fn,
            program_course: item.program_course ?? item.program ?? item.course_program ?? '',
            year_graduated: item.year_graduated ?? item.year ?? item.graduation_year ?? '',
            raw: item
          };
        })
        .filter(n => n.full_name && n.full_name.length > 0); // drop records without an explicit full name

      // Filter results to only the user input and rank them by relevance (with fuzzy matching)
      const qLower = (name || '').toLowerCase().trim();
      const yVal = year ? String(year).trim() : '';
  const scored = rankResultsWithFuzzy(normalized, qLower, yVal);

      setResults(scored);
      if (scored.length === 0) {
        setError('No matching alumni found. Try adjusting spelling or year.');
        setStatusText('No matches');
      } else {
        // Do NOT auto-select a result. Allow the user to click the desired record.
        setError('');
        setStatusText(`${scored.length} match${scored.length>1?'es':''}`);
        // scroll the first item into view after render so user sees results
        setTimeout(() => {
          try {
            const el = document.querySelector('#claim-result-0');
            if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } catch (_) {}
        }, 80);
      }
    } catch (err) {
      console.error('ClaimAccount.searchAlumni error', err);
      setError('Search failed. Please try again later.');
      setStatusText('Search error');
    } finally {
      setLoading(false);
    }
  };

  // Helper to detect whether a record already has login credentials on file
  const recordHasCredentials = (r) => {
    if (!r) return false;
    const raw = r.raw || {};
    return !!(
      r.username ||
      raw.username ||
      raw.user_name ||
      raw.has_account ||
      raw.password
    );
  };

  // Simple Levenshtein distance for fuzzy matching
  const levenshtein = (a = '', b = '') => {
    const al = a.length, bl = b.length;
    if (al === 0) return bl;
    if (bl === 0) return al;
    const matrix = Array.from({ length: al + 1 }, () => new Array(bl + 1).fill(0));
    for (let i = 0; i <= al; i++) matrix[i][0] = i;
    for (let j = 0; j <= bl; j++) matrix[0][j] = j;
    for (let i = 1; i <= al; i++) {
      for (let j = 1; j <= bl; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    return matrix[al][bl];
  };

  // Enhanced ranking which includes fuzzy distance
  const rankResultsWithFuzzy = (normalized, qLower, yVal) => {
    return normalized
          .map(n => {
            const nameLower = (n.full_name || '').toLowerCase();
            let score = 0;

            if (qLower) {
              // exact name match -> highest score
              if (nameLower === qLower) score += 500;
              // starts-with -> strong match
              else if (nameLower.startsWith(qLower)) score += 300;
              // includes -> decent match
              else if (nameLower.includes(qLower)) score += 150;
            }

            // Fuzzy fallback: allow short typos when reasonable similarity exists
            if (qLower && nameLower && qLower.length > 2 && score === 0) {
              const dist = levenshtein(nameLower, qLower);
              const maxLen = Math.max(nameLower.length, qLower.length);
              const allowed = Math.floor(maxLen * 0.35); // allow up to 35% difference
              if (dist <= allowed) {
                // smaller distance -> higher score
                score += Math.max(80, Math.floor((1 - dist / Math.max(1, maxLen)) * 200));
              }
            }

            return { score, item: n };
          })
          // only keep items with positive score
          .filter(s => s.score > 0)
          .sort((a, b) => b.score - a.score)
          .map(s => s.item);
  };

  // Debounced search handler
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  // Focus management and Escape handling for confirm and create overlays
  useEffect(() => {
    let t;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        // If verification step is open, ignore Escape so the modal can't be dismissed
        if (showVerify) {
          return;
        }
        // Close create modal first, then confirmation, then selection
        if (showCreate) {
          setShowCreate(false);
          setUsername(''); setPassword(''); setConfirm('');
        } else if (showConfirm) {
          setShowConfirm(false);
          setSelected(null);
        }
      }
    };

    if (showVerify) {
      try {
        t = setTimeout(() => {
          if (verifyCourseRef.current && verifyCourseRef.current.focus) verifyCourseRef.current.focus();
        }, 40);
      } catch (_) {}
      document.addEventListener('keydown', onKey);
      return () => { clearTimeout(t); document.removeEventListener('keydown', onKey); };
    }

    if (showConfirm) {
      try {
        t = setTimeout(() => {
          if (confirmYesRef.current && confirmYesRef.current.focus) confirmYesRef.current.focus();
        }, 40);
      } catch (_) {}
      document.addEventListener('keydown', onKey);
      return () => { clearTimeout(t); document.removeEventListener('keydown', onKey); };
    }

    if (showCreate) {
      try {
        t = setTimeout(() => {
          if (usernameRef.current && usernameRef.current.focus) usernameRef.current.focus();
        }, 40);
      } catch (_) {}
      document.addEventListener('keydown', onKey);
      return () => { clearTimeout(t); document.removeEventListener('keydown', onKey); };
    }

    // If neither overlay is open, ensure no lingering listener
    return () => { if (t) clearTimeout(t); document.removeEventListener('keydown', onKey); };
  }, [showConfirm, showCreate, showVerify]);

  // Close the positioned confirm/create popover when clicking outside.
  // NOTE: the verification step intentionally does NOT close on outside click per UX requirement.
  useEffect(() => {
    if (!(showConfirm || showCreate)) return;
    const onDown = (e) => {
      try {
        if (confirmPanelRef.current && !confirmPanelRef.current.contains(e.target)) {
          // Only close confirm/create overlays; do not touch verification here
          setShowConfirm(false);
          setShowCreate(false);
          setConfirmPos(null);
          setSelected(null);
        }
      } catch (_) {}
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showConfirm, showCreate]);

  // Keep the confirm popover inside the viewport: measure after render and adjust
  useEffect(() => {
    if (!(showConfirm || showVerify) || !confirmPos) return;
    const node = confirmPanelRef.current;
    if (!node) return;

    const adjust = () => {
      try {
        const pr = node.getBoundingClientRect();
        const padding = 8;
        let newTop = confirmPos.top;
        let newLeft = confirmPos.left;

        // If popover spills off the right edge, move it left
        if (pr.right > window.innerWidth - padding) {
          newLeft = Math.max(padding, window.innerWidth - pr.width - padding);
        }
        // If popover spills off the left edge, move it right
        if (pr.left < padding) {
          newLeft = padding;
        }
        // If popover spills off the bottom, try to flip above the target
        if (pr.bottom > window.innerHeight - padding) {
          // place above by subtracting the popover height plus a small gap
          newTop = Math.max(padding, confirmPos.top - (pr.height + 16));
        }
        // If popover is too high (negative), clamp
        if (newTop < padding) newTop = padding;

        // Only update if position changed meaningfully
        if (Math.abs(newTop - confirmPos.top) > 1 || Math.abs(newLeft - confirmPos.left) > 1) {
          setConfirmPos({ ...confirmPos, top: newTop, left: newLeft });
        }
      } catch (_) {}
    };

    // adjust once immediately
    adjust();
    // adjust on resize to handle viewport changes
    window.addEventListener('resize', adjust);
    return () => window.removeEventListener('resize', adjust);
  }, [showConfirm, showVerify, confirmPos]);

  const scheduleSearch = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Read debounce from CSS var if available
    let ms = 350;
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--debounce-ms');
      const n = Number((v || '').trim());
      if (!Number.isNaN(n) && n > 0) ms = n;
    } catch (_) {}
    debounceRef.current = setTimeout(() => {
      searchAlumni();
    }, ms);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      searchAlumni();
    }
  };

  const submitRegistration = async () => {
    setError('');
    setSuccess('');
    if (!selected) { setError('Please select your record first'); return; }
    if (!username) { setError('Please enter a username'); return; }
    if (!password) { setError('Please enter a password'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    try {
      // Update the existing alumni row so credentials are stored in users_alumni table
      const payload = { username, password };
      const url = `/api/alumni/${selected.id}/`;
      const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        // Try to extract friendly message from backend
        const msg = (json && (json.detail || json.error || (json.non_field_errors && json.non_field_errors.join(', ')))) || 'Failed to save credentials. The username may already be taken.';
        setError(msg);
        return;
      }

      // Success: update local selected snapshot and show feedback
      setSelected(prev => ({ ...prev, username }));
      setSuccess('Account created successfully. Signing you in...');
      // Attempt automatic login so user doesn't have to re-enter credentials
      try {
        setAutoLoggingIn(true);
        const tried = ['/api/login/','http://127.0.0.1:8000/api/login/'];
        let loginResp = null;
        let loginJson = null;
        for (const url of tried) {
          try {
            const r = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password, user_type: 'alumni' })
            });
            if (!r.ok) continue;
            loginResp = r;
            loginJson = await r.json().catch(() => null);
            break;
          } catch (e) { continue; }
        }

        if (loginResp && loginJson) {
          const data = loginJson;
          const resolvedUser = data.user ?? data;
          const finalUserType = (data.user_type ?? 'alumni').toString();
          try { localStorage.setItem('currentUser', JSON.stringify(resolvedUser)); } catch(_){}
          try { localStorage.setItem('userType', finalUserType); } catch(_){}
          try {
            if (resolvedUser && resolvedUser.token) {
              sessionStorage.setItem('server_token', resolvedUser.token);
              sessionStorage.setItem('server_token_expires_at', String(resolvedUser.token_expires_at || (Date.now() + (10 * 60 * 1000))));
            }
          } catch(_){}
          // Notify other components that the user was updated
          try { window.dispatchEvent(new CustomEvent('user-updated', { detail: { currentUser: resolvedUser, userType: finalUserType } })); } catch(_){}
          // Navigate to alumni dashboard
          try { navigate('/alumni/Dashboard'); } catch (e) { window.location.href = '/alumni/Dashboard'; }
          return;
        }
      } catch (err) {
        // ignore login errors and fall back to manual login
      } finally {
        setAutoLoggingIn(false);
      }

      // Fallback: inform user and redirect to login page so they can sign in
      setSuccess('Account created successfully. Please login to continue. Redirecting to login...');
      setTimeout(() => {
        try { navigate('/login', { state: { prefillUsername: username } }); } catch (_) { window.location.href = '/login?prefill=' + encodeURIComponent(username); }
      }, 900);
    } catch (err) {
      setError(String(err));
    }
  };

  return (
    <div className="claim-shell">
      {/* Decorative radial highlights (visual parity with MainBody) */}
      <div className="claim-decor" />
      {/* subtle grid overlay */}
      <div className="claim-grid-overlay" />

  <div className="claim-card">
        {/* Back button: returns user to main page */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button aria-label="Back to main" onClick={() => { try { navigate('/'); } catch (_) { window.location.href = '/'; } }} className="claim-back-btn">Back</button>
          {/* Sign Up button: goes to SignupPanel (route '/signup') */}
          <button aria-label="Sign up" onClick={() => { try { navigate('/signup'); } catch (_) { window.location.href = '/signup'; } }} className="btn btn-secondary claim-signup-btn">Sign Up</button>
        </div>
      <h2>Find your alumni record</h2>
      <p>Enter your full name and year graduated to locate your record. Select it and create your account.</p>
      <div className="claim-search-row">
        <input
          ref={nameInputRef}
          className="claim-search-input"
          placeholder="Full name"
          value={name}
          onChange={e => { setName(e.target.value); scheduleSearch(); }}
          onKeyDown={onKeyDown}
        />
        <input
          className="claim-year-input"
          placeholder="Year graduated"
          value={year}
          onChange={e => { setYear(e.target.value); scheduleSearch(); }}
          onKeyDown={onKeyDown}
        />
        <button className="claim-search-btn" onClick={searchAlumni} disabled={loading}>{loading ? 'Searching...' : 'Search'}</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {loading && <div className="inline-spinner" aria-hidden="true" />}
        <div className="claim-status-text" style={{ color: loading ? '#444' : (statusText ? '#333' : '#666') }}>{statusText || (error ? '' : 'Type a name and press Enter or click Search')}</div>
      </div>
      {error && <div style={{ color: 'crimson', marginBottom: 8 }}>{error}</div>}

      <div>
        {results.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Select your record</div>
            <ul className="claim-results-list">
              {results.map((r, idx) => (
                <li id={`claim-result-${idx}`} key={r.id} className={`claim-result ${selected && selected.id === r.id ? 'selected' : ''}`} onClick={(e) => {
                  // position the confirm popover near the clicked item
                  const el = e.currentTarget;
                  const rect = el.getBoundingClientRect();
                  setSelected(r); setShowConfirm(true); setShowCreate(false);
                  setConfirmPos({ top: rect.bottom + 8, left: Math.max(8, rect.left), width: rect.width });
                }}>
                            <div className="claim-result-left">
                                          <div className="claim-avatar" aria-hidden="true" />
                                          <div>
                                            <div className="claim-name">{r.full_name}</div>
                                            {/* program and year intentionally hidden here to avoid exposing additional personal details in the search results */}
                                          </div>
                                        </div>
                                        <div className="claim-result-right">
                                          <span
                                            className={`claim-badge ${recordHasCredentials(r) ? 'has-account' : 'no-account'}`}
                                            aria-hidden="true"
                                            title={recordHasCredentials(r) ? 'Record has an account' : 'No account on file'}
                                          >
                                            {recordHasCredentials(r) ? 'Has account' : 'No account'}
                                          </span>
                                        </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* If the search returned no matches, suggest signing up */}
        {(!loading && results.length === 0 && statusText === 'No matches') && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: '#fffbf0', border: '1px solid #fde2b0' }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Can't find your name?</div>
            <div style={{ marginBottom: 8 }}>If you can't find your full name in the results, you can create a new account by signing up.</div>
            <div>
              <button className="btn btn-primary" onClick={() => { try { navigate('/signup'); } catch (_) { window.location.href = '/signup'; } }}>Sign up</button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation overlay (centered) — also hosts create form when showCreate is true */}
  {selected && (showConfirm || showCreate || showVerify) && (
        <div
          ref={confirmPanelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="claim-confirm-title"
          aria-describedby="claim-confirm-desc"
          className={"claim-panel fade-slide-enter"}
        >
          {showConfirm && (
            <>
              <div className="claim-confirm-header">
                <svg className="claim-icon" width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="11" fill="#FFF9E6" stroke="#FFB74D" strokeWidth="1" />
                  <path d="M12 7v6" stroke="#7A4B00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="16.2" r="0.8" fill="#7A4B00" />
                </svg>
                <h3 id="claim-confirm-title">Are you sure this is you?</h3>
              </div>
              <div id="claim-confirm-desc">
                <div className="claim-name">{selected.full_name}</div>
                {/* program and year intentionally hidden on confirmation to avoid exposing additional personal details during verification */}
              </div>
              <div className="claim-actions">
                <button className="btn btn-outline" onClick={() => { setSelected(null); setShowConfirm(false); setConfirmPos(null); }}>No</button>
                {!recordHasCredentials(selected) ? (
                  <button ref={confirmYesRef} className="btn btn-primary" onClick={() => { setShowConfirm(false); setShowVerify(true); setConfirmPos(null); }}>Yes</button>
                ) : (
                  <button className="btn btn-primary" onClick={() => { setShowConfirm(false); setConfirmPos(null); try { navigate('/login'); } catch (_) { window.location.href = '/login'; } }}>Go to login</button>
                )}
              </div>
            </>
          )}

          {/* Verification step: ask for program/course and year to verify identity before allowing account creation */}
          {showVerify && (
            <div>
              <div className="claim-confirm-header">
                <h3 id="claim-verify-title">Verify your identity</h3>
              </div>
              <div style={{ marginTop: 8 }}>
                <div style={{ marginBottom: 8 }}>Please confirm the program/course and year you graduated from. This helps us ensure only the real alumni may create an account for this record.</div>
                <div style={{ display: 'flex', gap: 25, marginBottom: 8 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      ref={verifyCourseRef}
                      placeholder="Program / Course"
                      value={verifyCourse}
                      onChange={e => {
                        const v = e.target.value;
                        setVerifyCourse(v);
                        // update suggestions
                        try {
                          const q = (v || '').toLowerCase().trim();
                          if (!q) {
                            setProgramSuggestions([]); setShowProgramSuggestions(false); setSuggestionIndex(-1);
                          } else {
                            const matched = programs.filter(p => p.toLowerCase().includes(q)).slice(0, 8);
                            setProgramSuggestions(matched);
                            setShowProgramSuggestions(matched.length > 0);
                            setSuggestionIndex(-1);
                          }
                        } catch (_) { setProgramSuggestions([]); setShowProgramSuggestions(false); }
                      }}
                      onKeyDown={(e) => {
                        if (!showProgramSuggestions) return;
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setSuggestionIndex(i => Math.min((programSuggestions.length - 1), i + 1));
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setSuggestionIndex(i => Math.max(-1, i - 1));
                        } else if (e.key === 'Enter') {
                          if (suggestionIndex >= 0 && suggestionIndex < programSuggestions.length) {
                            e.preventDefault();
                            const pick = programSuggestions[suggestionIndex];
                            setVerifyCourse(pick);
                            setProgramSuggestions([]); setShowProgramSuggestions(false); setSuggestionIndex(-1);
                          }
                        } else if (e.key === 'Escape') {
                          setShowProgramSuggestions(false); setSuggestionIndex(-1);
                        }
                      }}
                      style={{ width: '100%', padding: 8, borderRadius: 6 }}
                    />

                    {showProgramSuggestions && programSuggestions.length > 0 && (
                      <ul className="program-suggestions" role="listbox" aria-label="Program suggestions" style={{ position: 'absolute', zIndex: 60, left: 0, right: 0, marginTop: 6, background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 6, maxHeight: 220, overflowY: 'auto', boxShadow: '0 6px 18px rgba(0,0,0,0.08)', padding: 0, listStyle: 'none' }}>
                        {programSuggestions.map((p, i) => (
                          <li
                            key={p}
                            role="option"
                            aria-selected={i === suggestionIndex}
                            onMouseDown={(ev) => { ev.preventDefault(); /* prevent blur */ setVerifyCourse(p); setProgramSuggestions([]); setShowProgramSuggestions(false); setSuggestionIndex(-1); }}
                            onMouseEnter={() => setSuggestionIndex(i)}
                            style={{ padding: '8px 10px', cursor: 'pointer', background: i === suggestionIndex ? '#f3f4f6' : 'transparent' }}
                          >
                            {p}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <input ref={verifyYearRef} placeholder="Year graduated" value={verifyYear} onChange={e => setVerifyYear(e.target.value)} style={{ width: 140, padding: 8, borderRadius: 6 }} />
                </div>
                {verifySuccess && <div role="status" aria-live="polite" style={{ color: 'green', marginBottom: 8 }}>{verifySuccess}</div>}
                {verifyError && <div style={{ color: 'crimson', marginBottom: 8 }}>{verifyError}</div>}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
                  <button className="btn btn-outline" onClick={() => { setShowVerify(false); setVerifyCourse(''); setVerifyYear(''); setVerifyError(''); setSelected(null); setConfirmPos(null); }}>Cancel</button>
                  <button className="btn btn-primary" onClick={() => {
                    // perform verification
                    try { setVerifyError(''); } catch(_){}
                    const providedCourse = (verifyCourse || '').toString().trim().toLowerCase();
                    const providedYear = (verifyYear || '').toString().trim();
                    const rec = selected && selected.raw ? selected.raw : selected;
                    const recCourse = ((rec && (rec.program_course || rec.program || rec.course_program)) || '').toString().trim().toLowerCase();
                    const recYear = (rec && (rec.year_graduated || rec.year || rec.graduation_year || rec.yearGraduated)) ? String(rec.year_graduated || rec.year || rec.graduation_year || rec.yearGraduated) : '';
                    // Basic checks: year must match exactly (if provided), course must be substring-equal
                    if (!providedCourse || !providedYear) {
                      setVerifyError('Both program/course and year are required for verification.');
                      return;
                    }
                    const yearMatches = providedYear === recYear;
                    const courseMatches = recCourse && providedCourse && (recCourse.includes(providedCourse) || providedCourse.includes(recCourse));
                    if (yearMatches && courseMatches) {
                      // verified: show a short success alert then proceed to create form
                      setVerifySuccess('Verification successful');
                      // clear any previous error
                      setVerifyError('');
                      setTimeout(() => {
                        setVerifySuccess('');
                        setShowVerify(false);
                        setShowCreate(true);
                        // clear verify fields
                        setVerifyCourse(''); setVerifyYear(''); setVerifyError('');
                      }, 800);
                    } else {
                      setVerifyError('Verification failed. The program/course or year did not match our records.');
                    }
                  }}>Verify</button>
                </div>
              </div>
            </div>
          )}

          {showCreate && (
            <div>
              {recordHasCredentials(selected) ? (
                <div>
                  <h3 id="claim-create-title" className="claim-create-header">Account exists for {selected.full_name}</h3>
                  <div className="claim-create-desc">
                    This alumni record already has credentials on file. For privacy and security the username and password are hidden. If this is you, please use the login page or request a password reset.
                  </div>
                  <div className="claim-create-actions">
                    <button className="btn btn-primary" onClick={() => { try { navigate('/login'); } catch (_) { window.location.href = '/login'; } }}>Go to login</button>
                    <button className="btn btn-outline" onClick={() => { setSelected(null); setShowCreate(false); setUsername(''); setPassword(''); setConfirm(''); }}>Close</button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 id="claim-create-title" className="claim-create-header">Create username and password for {selected.full_name}</h3>
                  <div id="claim-create-desc" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    <label style={{ display: 'none' }} htmlFor="claim-username">Username</label>
                    <div className="claim-input">
                      <span className="claim-input-icon" aria-hidden="true">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" style={{ color: '#6b7280' }}>
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M4 20c0-2.21 3.58-4 8-4s8 1.79 8 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <input className="claim-input-field" id="claim-username" aria-describedby="claim-username-hint" ref={usernameRef} placeholder="Username" value={username} onChange={e => { setUsername(e.target.value); setUsernameValid(null); }} />
                      <span className="validation-icon" aria-hidden="true">{usernameValid === true ? '✔' : usernameValid === false ? '✖' : ''}</span>
                    </div>
                    <div id="claim-username-hint" className="muted claim-hint">Pick a unique username (letters and numbers, 3-20 characters).</div>

                    <label style={{ display: 'none' }} htmlFor="claim-password">Password</label>
                    <div className="claim-input">
                      <span className="claim-input-icon" aria-hidden="true">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" style={{ color: '#6b7280' }}>
                          <rect x="3" y="11" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
                          <path d="M7 11V8a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <input className="claim-input-field" id="claim-password" aria-describedby="claim-password-hint" placeholder="Password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setPasswordValid(null); }} />
                      <span className="validation-icon" aria-hidden="true">{passwordValid === true ? '✔' : passwordValid === false ? '✖' : ''}</span>
                      <button type="button" className="eye-button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(s => !s)} onMouseDown={() => { pwdPressRef.current = setTimeout(() => setShowPassword(true), 450); }} onMouseUp={() => { clearTimeout(pwdPressRef.current); }} onMouseLeave={() => { clearTimeout(pwdPressRef.current); }} onTouchStart={() => { pwdPressRef.current = setTimeout(() => setShowPassword(true), 350); }} onTouchEnd={() => { clearTimeout(pwdPressRef.current); setShowPassword(false); }}>
                        {showPassword ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3-11-7 1.02-2.27 2.85-4.11 5.06-5.18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        )}
                      </button>
                    </div>
                    <div id="claim-password-hint" className="muted claim-hint">Use at least 8 characters including a number and a symbol for better security.</div>

                    <label style={{ display: 'none' }} htmlFor="claim-confirm">Confirm password</label>
                    <div className="claim-input">
                      <span className="claim-input-icon" aria-hidden="true">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" style={{ color: '#6b7280' }}>
                          <path d="M20 7l-8.5 8.5L9 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </svg>
                      </span>
                      <input className="claim-input-field" id="claim-confirm" aria-describedby="claim-confirm-hint" placeholder="Confirm password" type={showConfirmPwd ? 'text' : 'password'} value={confirm} onChange={e => { setConfirm(e.target.value); setConfirmValid(null); }} />
                      <span className="validation-icon" aria-hidden="true">{confirmValid === true ? '✔' : confirmValid === false ? '✖' : ''}</span>
                      <button type="button" className="eye-button" aria-label={showConfirmPwd ? 'Hide confirmation password' : 'Show confirmation password'} onClick={() => setShowConfirmPwd(s => !s)} onMouseDown={() => { confirmPressRef.current = setTimeout(() => setShowConfirmPwd(true), 450); }} onMouseUp={() => { clearTimeout(confirmPressRef.current); }} onMouseLeave={() => { clearTimeout(confirmPressRef.current); }} onTouchStart={() => { confirmPressRef.current = setTimeout(() => setShowConfirmPwd(true), 350); }} onTouchEnd={() => { clearTimeout(confirmPressRef.current); setShowConfirmPwd(false); }}>
                        {showConfirmPwd ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3-11-7 1.02-2.27 2.85-4.11 5.06-5.18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        )}
                      </button>
                    </div>
                    <div id="claim-confirm-hint" className="muted claim-hint">Re-enter your password to confirm. Both entries must match.</div>

                    <div className="claim-create-actions">
                      <button className="btn btn-primary" onClick={submitRegistration} disabled={autoLoggingIn}>{autoLoggingIn ? 'Creating...' : 'Create account'}</button>
                      <button className="btn btn-outline" onClick={() => { setSelected(null); setShowConfirm(false); setShowCreate(false); setUsername(''); setPassword(''); setConfirm(''); }}>Cancel</button>
                    </div>
                    {success && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {autoLoggingIn && <span className="inline-spinner" aria-hidden="true" />}
                        <div className="success-badge">{success}</div>
                      </div>
                    )}
                    {error && <div style={{ color: 'crimson' }}>{error}</div>}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  </div>
  );
}

export default ClaimAccount;
