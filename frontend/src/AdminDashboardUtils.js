// Utility functions for AdminDashboard

export async function fetchUsers(setUsers, setError, setLoading) {
  // Robust fetch that tolerates partial failures and normalizes different endpoint shapes.
  try {
    setLoading && setLoading(true);

    // Only query the type-specific endpoints that exist on the backend.
    // The backend exposes: /api/alumni/, /api/admins/, /api/program-heads/
    const endpoints = [
      { url: '/api/alumni/', type: 'alumni' },
      { url: '/api/admins/', type: 'admin' },
      { url: '/api/program-heads/', type: 'program_head' }
    ];

    const results = [];
    for (const ep of endpoints) {
      try {
        const resp = await fetch(ep.url);
        if (!resp.ok) {
          console.debug && console.debug(`fetchUsers: ${ep.url} returned ${resp.status}`);
          continue;
        }
        const data = await resp.json();
        if (!Array.isArray(data)) continue;
        // Normalize entries
        const normalized = data.map(item => {
          const id = item.id ?? item.pk ?? null;
          const username = item.username ?? item.user_name ?? item.email ?? '';
          const email = item.email ?? '';
          const full_name = (item.full_name ?? [item.first_name, item.middle_name, item.last_name].filter(Boolean).join(' ')) || item.name || item.displayName || '';
          const program_course = item.program_course ?? item.program ?? '';
          const status = item.status ?? item.user_status ?? 'pending';
          const inferredType = ep.type || (item.user_type ?? item.type ?? (item.is_admin ? 'admin' : undefined));
          const user_type = (inferredType || '').toString().toLowerCase() || null;
          return {
            ...item,
            id,
            username,
            email,
            full_name,
            program_course,
            status,
            user_type
          };
        });
        results.push(...normalized);
      } catch (e) {
        console.debug && console.debug('fetchUsers: error fetching', ep.url, e && e.message);
        continue;
      }
    }

    // Remove duplicates by id (keeping first seen)
    const seen = new Set();
    const unique = [];
    for (const u of results) {
      if (u && u.id != null) {
        if (seen.has(u.id)) continue;
        seen.add(u.id);
        unique.push(u);
      } else {
        // keep entries without id as well (append)
        unique.push(u);
      }
    }

    // If nothing found, return empty array rather than null
    const finalUsers = unique.length ? unique : [];
    setUsers && setUsers(finalUsers);
    setError && setError('');
    return finalUsers;
  } catch (err) {
    setError && setError('Failed to load users: ' + (err && err.message));
    return [];
  } finally {
    setLoading && setLoading(false);
  }
}

export async function fetchAlumniUsers(setAlumniUsers) {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/alumni/');
    if (response.ok) {
      const data = await response.json();
      setAlumniUsers(data);
    }
  } catch (err) {}
}

export async function fetchProgramHeadUsers(setProgramHeadUsers) {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/program-heads/');
    if (response.ok) {
      const data = await response.json();
      setProgramHeadUsers(data);
    }
  } catch (err) {}
}

export async function handleCreateUser(
  e,
  username,
  password,
  userType,
  setShowCreateForm,
  setUsername,
  setPassword,
  setUserType,
  // The 9th argument historically was `fetchUsers`, but some callers pass an `extra` object here.
  // Accept either: (fetchUsers) OR (extra) in this position. The next arg may be (extra) or (setError).
  fetchUsersOrExtra,
  extraOrSetError,
  setErrorMaybe
) {
  e.preventDefault();

  // Normalize arguments: determine which param is fetchUsers, extra payload, and setError
  let fetchUsers = undefined;
  let extra = undefined;
  let setError = undefined;

  if (typeof fetchUsersOrExtra === 'function') {
    fetchUsers = fetchUsersOrExtra;
    if (typeof extraOrSetError === 'object' && extraOrSetError !== null) {
      extra = extraOrSetError;
      setError = setErrorMaybe;
    } else {
      setError = extraOrSetError;
    }
  } else if (typeof fetchUsersOrExtra === 'object' && fetchUsersOrExtra !== null) {
    // Caller passed extra in the 9th position and setError as 10th
    extra = fetchUsersOrExtra;
    setError = extraOrSetError;
  } else {
    // Neither function nor object — treat second-to-last as setError
    setError = extraOrSetError || setErrorMaybe;
  }

  try {
    const body = Object.assign({ username, password, user_type: userType }, extra || {});

    // Build prioritized candidate endpoints. Prefer type-specific endpoints when possible.
  const candidates = [];
  const t = (userType || '').toString().toLowerCase();
  if (t === 'alumni') candidates.push('http://127.0.0.1:8000/api/alumni/');
  else if (t === 'admin') candidates.push('http://127.0.0.1:8000/api/admins/');
  else if (t === 'program_head' || t === 'programhead' || t === 'program-head') candidates.push('http://127.0.0.1:8000/api/program-heads/');

  // Fallback: if type unknown, use program-heads as default for administrative flows
  if (candidates.length === 0) candidates.push('http://127.0.0.1:8000/api/program-heads/');

    let lastErr = null;
    for (const url of candidates) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
          },
          body: JSON.stringify(body)
        });

        if (response.ok) {
          // Try to parse created resource JSON; some backends return 201 with body
          let data = null;
          try { data = await response.json(); } catch (_) { data = null; }
          setShowCreateForm && setShowCreateForm(false);
          setUsername && setUsername('');
          setPassword && setPassword('');
          setUserType && setUserType('admin');
          fetchUsers && typeof fetchUsers === 'function' && fetchUsers();
          return data;
        }

        // If 404, try the next candidate; otherwise record error and stop
        if (response.status === 404) {
          continue;
        }

        let errMsg = `HTTP ${response.status} ${response.statusText}`;
        try {
          const data = await response.json();
          errMsg = data.detail || JSON.stringify(data);
        } catch (e) {
          try { const txt = await response.text(); errMsg = txt.slice(0, 1000); } catch (_) {}
        }

        lastErr = new Error(errMsg || `Failed to create user (status ${response.status})`);
        break;
      } catch (e) {
        lastErr = e;
        continue;
      }
    }

    if (lastErr) throw lastErr;
    throw new Error('Failed to create user: no endpoint succeeded');
  } catch (err) {
    setError && setError('Failed to create user: ' + (err.message || String(err)));
  }
}

export async function handleUpdateUser(userId, userData, setEditingUser, fetchUsers, setError, userType) {
  // Helper to run a PATCH against a base URL + userId
  async function tryPatch(base) {
    const url = `${base}${userId}/`;
    // If userData is a FormData instance (file upload), let the browser set Content-Type
    if (typeof FormData !== 'undefined' && userData instanceof FormData) {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: userData
      });
      return response;
    }

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify(userData)
    });
    return response;
  }

  try {
    // Build a prioritized list of candidate bases to try.
    // If a specific userType is provided, prefer its endpoint first.
    const candidates = [];
    if (userType) {
      const t = userType.toString().toLowerCase();
      if (t === 'alumni') candidates.push('http://127.0.0.1:8000/api/alumni/');
      else if (t === 'admin') candidates.push('http://127.0.0.1:8000/api/admins/');
      else if (t === 'program_head' || t === 'program-head' || t === 'programhead') candidates.push('http://127.0.0.1:8000/api/program-heads/');
    }
  // Prefer type-specific endpoints only (no generic /api/users/ in this backend)
  // Also add the other type-specific endpoints as fallbacks
  candidates.push('http://127.0.0.1:8000/api/alumni/');
  candidates.push('http://127.0.0.1:8000/api/admins/');
  candidates.push('http://127.0.0.1:8000/api/program-heads/');

    let lastErr = null;
    for (const base of candidates) {
      try {
        const response = await tryPatch(base);
        if (response.ok) {
          setEditingUser && setEditingUser(null);
          fetchUsers && fetchUsers();
          return true;
        }
        // If 404, keep trying other endpoints; otherwise, capture error info and break
        if (response.status === 404) {
          // try next candidate
          continue;
        } else {
          let errMsg = `HTTP ${response.status} ${response.statusText}`;
          try {
            const data = await response.json();
            errMsg = data.detail || JSON.stringify(data);
          } catch (e) {
            try { const txt = await response.text(); errMsg = txt.slice(0, 1000); } catch (_) {}
          }
          lastErr = new Error(errMsg || `Failed to update user (status ${response.status})`);
          break;
        }
      } catch (e) {
        // network-level or other fetch error: remember and try next candidate
        lastErr = e;
        continue;
      }
    }

    // If we get here, no candidate succeeded
    if (lastErr) throw lastErr;
    throw new Error('Failed to update user: not found on any endpoint');
  } catch (err) {
    setError && setError('Failed to update user: ' + (err.message || String(err)));
    throw err;
  }
}

export async function handleDeleteUser(userId, fetchUsers, setError) {
  // Confirmation should be handled by the caller (use the app's custom overlay).

  // Helper to try deleting against a base URL
  async function tryDelete(base) {
    // Build URL carefully:
    // - If base looks like a PHP endpoint, use query param `?id=` (common in legacy scripts)
    // - Otherwise join with a single slash between base and id and ensure trailing slash
    let url;
    const isPhp = (typeof base === 'string' && base.toLowerCase().includes('.php'));
    if (isPhp) {
      // preserve existing query string if any
      url = base.includes('?') ? `${base}&id=${encodeURIComponent(userId)}` : `${base}?id=${encodeURIComponent(userId)}`;
    } else {
      // ensure there's exactly one slash between base and id
      if (base.endsWith('/')) url = `${base}${userId}/`;
      else url = `${base}/${userId}/`;
    }

    console.debug && console.debug('tryDelete: attempting DELETE', url, { base, userId });

    const resp = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    });

    console.debug && console.debug('tryDelete: response', resp && resp.status, resp && resp.statusText);
    return resp;
  }

  try {
    // Try a richer set of candidate bases to be tolerant of different backends.
    // For each logical base we try both trailing-slash and non-trailing-slash forms
    // and also include a couple of legacy PHP endpoints that might exist in this
    // mixed backend environment.
    // Only attempt the endpoints that exist on the backend to avoid noisy 404s
    const logicalBases = [
      'http://127.0.0.1:8000/api/alumni',
      'http://127.0.0.1:8000/api/admins',
      'http://127.0.0.1:8000/api/program-heads'
    ];

    const candidates = [];
    for (const b of logicalBases) {
      // try with trailing slash first, then without
      candidates.push(b.endsWith('/') ? b : b + '/');
      candidates.push(b.replace(/\/$/, ''));
    }

    // legacy/local PHP endpoints sometimes used in this project (keep as fallback)
    candidates.push('http://localhost/capstone%202%20Alumni/backend/delete_user.php');
    candidates.push('http://localhost/capstone%202%20Alumni/backend/delete_program_head.php');

    let lastErr = null;
    for (const base of candidates) {
      try {
        const response = await tryDelete(base);
        if (response.ok) {
          // success
          fetchUsers && fetchUsers();
          setError && setError('');
          return true;
        }
        // if 404, try next candidate
        if (response.status === 404) {
          continue;
        }
        // other non-OK status: parse message and stop
        let errMsg = `HTTP ${response.status} ${response.statusText}`;
        try {
          const data = await response.json();
          errMsg = data.detail || JSON.stringify(data);
        } catch (e) {
          try { const txt = await response.text(); errMsg = txt.slice(0, 1000); } catch (_) {}
        }
        lastErr = new Error(errMsg || `Failed to delete user (status ${response.status})`);
        break;
      } catch (e) {
        lastErr = e;
        continue;
      }
    }

    if (lastErr) throw lastErr;
    throw new Error('Failed to delete user: not found on any endpoint');
  } catch (err) {
    setError && setError('Failed to delete user: ' + (err.message || String(err)));
    return false;
  }
}

export function startEdit(user, setEditingUser, setUsername, setUserType) {
  setEditingUser(user);
  setUsername(user.username);
  setUserType(user.user_type || 'admin');
}

export function cancelEdit(setEditingUser, setUsername, setPassword, setUserType) {
  setEditingUser(null);
  setUsername('');
  setPassword('');
  setUserType('admin');
}
