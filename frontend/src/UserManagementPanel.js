import React from 'react';
// useNavigate not required after removing 'View Survey' action
import programs from './programs';
import CreateProgramHeadForm from './CreateProgramHeadForm';
import CreateAlumniForm from './CreateAlumniForm';

function UserManagementPanel({ error, setError, loading, setLoading, username, setUsername, password, setPassword, userType, setUserType, showCreateForm, setShowCreateForm, editingUser, setEditingUser, handleCreateUser, handleUpdateUser, handleDeleteUser, fetchUsers, startEdit, cancelEdit, users, setUsers, viewUserToOpen, refreshAll, readonlyForProgramHead = false }) {
  // Only local state for filter
  const [filterType, setFilterType] = React.useState('alumni');
  // Normalize user type values from backend or mixed shapes into canonical tokens
  const normalizeType = (t) => {
    try {
      if (t === null || t === undefined) return '';
      const s = String(t).toLowerCase().trim();
      // replace spaces or hyphens with underscore and remove other non-alphanumerics
      const cleaned = s.replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, '');
      // accept flexible shapes that indicate program head
      if (cleaned.includes('program') && cleaned.includes('head')) return 'program_head';
      if (cleaned === 'programhead') return 'program_head';
      if (cleaned === 'admin' || cleaned === 'administrator' || cleaned === 'superuser') return 'admin';
      if (cleaned === 'alumni' || cleaned === 'student') return 'alumni';
      return cleaned;
    } catch (e) {
      try { return String(t).toLowerCase(); } catch (_) { return ''; }
    }
  };
  // Per-type search state
  const [searchQuery, setSearchQuery] = React.useState('');
  // Sorting state: key and order
  const [sortKey, setSortKey] = React.useState(null); // e.g. 'year_graduated' or 'username'
  const [sortOrder, setSortOrder] = React.useState('desc'); // 'asc' or 'desc'
  // Server-side pagination state for alumni
  const [alumniPage, setAlumniPage] = React.useState(1);
  const [alumniPageSize, setAlumniPageSize] = React.useState(50);
  const [alumniTotal, setAlumniTotal] = React.useState(null);
  const [alumniList, setAlumniList] = React.useState([]);
  const [alumniLoading, setAlumniLoading] = React.useState(false);
  // Download modal state & filters
  const [downloadModalOpen, setDownloadModalOpen] = React.useState(false);
  const [downloadYear, setDownloadYear] = React.useState('');
  const [downloadCourse, setDownloadCourse] = React.useState('');
  const [downloadLoading, setDownloadLoading] = React.useState(false);
  // Modal state for viewing a user
  const [viewUser, setViewUser] = React.useState(null);
  // Loading state for fetching a user's submitted survey for the View Survey action
  // Full-image viewer state
  const [fullImageSrc, setFullImageSrc] = React.useState(null);
  // navigate removed (no longer needed after removing 'View Survey')
  const [viewLoading] = React.useState(false);
  // Image natural dimension metadata for view modal and full-image overlay
  const [viewImageDims, setViewImageDims] = React.useState(null);
  const [fullImageDims, setFullImageDims] = React.useState(null);
  // Local edit form fields for richer edit UI
  const [editEmail, setEditEmail] = React.useState('');
  const [editFullName, setEditFullName] = React.useState('');
  const [editProgramCourse, setEditProgramCourse] = React.useState('');
  const [editStatus, setEditStatus] = React.useState('pending');
  // Per-row loading state map for async actions like status update
  const [rowLoading, setRowLoading] = React.useState({});
  // Confirmation dialog state for replace native confirm dialogs
  const [confirmDialog, setConfirmDialog] = React.useState({ open: false, title: '', message: '', onConfirm: null });
  // Temporary storage for pending edit payload (used when Save is confirmed)
  const [pendingEditPayload, setPendingEditPayload] = React.useState(null);
  // Create modal: choose which user type to create (alumni or program_head)
  const [createTypeModalOpen, setCreateTypeModalOpen] = React.useState(false);
  // Create form fields for Program Head (and shared fields)
  const [createName, setCreateName] = React.useState('');
  const [createSurname, setCreateSurname] = React.useState('');
  const [createMI, setCreateMI] = React.useState('');
  const [createGender, setCreateGender] = React.useState('');
  const [createContact, setCreateContact] = React.useState('');
  const [createEmail, setCreateEmail] = React.useState('');
  const [createFaculty, setCreateFaculty] = React.useState('');
  const [createProgram, setCreateProgram] = React.useState('');
  const [createConfirmPassword, setCreateConfirmPassword] = React.useState('');
  const [showCreatePassword, setShowCreatePassword] = React.useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = React.useState(false);
  // Faculty -> programs mapping (copied from ProgramHeadSignupPanel)
  const facultyPrograms = {
    'FALS': ['Bachelor of Science in Agriculture (BSA)', 'Bachelor of Science in Agribusiness Management (BSAM)', 'Bachelor of Science in Biology (BSBio)','Bachelor of Science in Environmental Science (BSES)'],
    'FBM': ['Bachelor of Science in Business Administration (BSBA)', 'Bachelor of Science in Hospitality Management (BSHM)'],
    'FTED': ['Bachelor of Elementary Education (BEED)', 'Bachelor of Early Childhood Education (BCED)', 'Bachelor of Special Needs Education (BSNED)', 'Bachelor Physical Education (BPED)', 'Bachelor of Technology and Livelihood Education (BTLED)', 'Bachelor of Technology and Livelihood Education major in Industrial Arts (BTLED)', 'Bachelor of Secondary Education major in English (BSED English)','Bachelor of Secondary Education major in Filipino (BSED Filipino)','Bachelor of Secondary Education major in Mathematics (BSED Mathematics)', 'Bachelor of Secondary Education major in Science (BSED Science)'],
    'FaCET': ['Bachelor of Science in Information Technology (BSIT)', 'Bachelor of Science in Civil Engineering (BSCE)', 'Bachelor in Industrial Technology Management (BITM)', 'Bachelor of Science in Mathematics (BSMath)'],
    'FNAHS': ['Bachelor of Science in Nursing (BSN)'],
    'FCJE': ['Bachelor of Science in Criminology (BSC)'],
    'FHuSoCom': ['Bachelor of Arts Political Science (BA PolSci)','Bachelor of Science in Development Communication (BSDevCom)', 'Bachelor of Science in Psychology (BS Psychology)'],
  };
  // Listen for CreateProgramHeadFormCancel events so the modal always closes when the form dispatches it
  React.useEffect(() => {
    function onCreateFormCancel() {
      try {
        try { console.debug && console.debug('UserManagementPanel: CreateProgramHeadFormCancel received'); } catch (_) {}
        setShowCreateForm(false);
      } catch (_) {}
    }
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('CreateProgramHeadFormCancel', onCreateFormCancel);
    }
    return () => {
      if (typeof window !== 'undefined' && window.removeEventListener) {
        window.removeEventListener('CreateProgramHeadFormCancel', onCreateFormCancel);
      }
    };
  }, [setShowCreateForm]);
  // Programs list is imported from frontend/src/programs.js

  // Debug: log incoming users prop to help diagnose empty alumni table
  React.useEffect(() => {
    try {
      console.debug && console.debug('UserManagementPanel: received users prop', users);
    } catch (_) {}
  }, [users]);

  // Ensure spin keyframes for inline spinner exist
  React.useEffect(() => {
    try {
      if (typeof document === 'undefined') return;
      if (document.getElementById('ump-spinner-style')) return;
      const style = document.createElement('style');
      style.id = 'ump-spinner-style';
      style.innerHTML = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
      document.head.appendChild(style);
    } catch (_) {}
  }, []);

  // If the parent asks us to open a particular user's view (e.g. from AdminNotification),
  // locate the user by username or email and open the view modal for that user.
  React.useEffect(() => {
    if (!viewUserToOpen) return;
    try {
      const { username: uName, email: uEmail } = viewUserToOpen || {};
      if (!uName && !uEmail) return;
      const found = (users || []).find(u => u && ((u.username && u.username === uName) || (u.email && u.email === uEmail)));
      if (found) {
        setViewUser(found);
      } else {
        // If not found, surface a non-blocking message so admin can refresh
        setError && setError('Could not locate the created user. Please refresh the users list.');
      }
    } catch (e) {
      console.error('UserManagementPanel: viewUserToOpen handling failed', e);
    }
  }, [viewUserToOpen, users, setError]);

  // Listen for global 'admin-created' events so newly-created admins are visible immediately
  React.useEffect(() => {
    function onAdminCreated(ev) {
      try {
        const created = ev && ev.detail;
        if (!created) return;
        if (typeof setUsers !== 'function') return;
        const newUser = {
          id: created.id ?? created.pk ?? null,
          username: created.username ?? created.user_name ?? created.email ?? '',
          email: created.email ?? '',
          full_name: created.full_name ?? created.name ?? '',
          user_type: 'admin',
          ...created
        };
        setUsers(prev => {
          const arr = Array.isArray(prev) ? prev.slice() : [];
          const exists = arr.some(u => (u && u.id != null && newUser.id != null && u.id === newUser.id) || (u && u.username && newUser.username && u.username === newUser.username));
          if (exists) return arr;
          arr.unshift(newUser);
          return arr;
        });
        // switch view to Admins and open the created user
        try { setFilterType && setFilterType('admin'); } catch (_) {}
        try { setViewUser && setViewUser(newUser); } catch (_) {}
      } catch (e) {
        console.error('admin-created handler failed', e);
      }
    }
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('admin-created', onAdminCreated);
    }
    return () => {
      if (typeof window !== 'undefined' && window.removeEventListener) {
        window.removeEventListener('admin-created', onAdminCreated);
      }
    };
  }, [setUsers, setFilterType, setViewUser]);

  // If no alumni are present in the `users` prop, try fetching `/api/alumni/` as a fallback
  React.useEffect(() => {
    let aborted = false;
    const controller = new AbortController();

    const hasAlumni = Array.isArray(users) && users.some(u => u && (u.user_type === 'alumni' || (u.user_type || '').toLowerCase() === 'alumni'));
    if (hasAlumni) return undefined; // nothing to do

    async function fetchAlumniFallback() {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/alumni/', { signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json();
        if (aborted) return;

        // Map possible backend shapes into the common user shape
        const normalized = (Array.isArray(data) ? data : []).map(item => ({
          id: item.id ?? item.pk ?? null,
          username: item.username ?? item.user_name ?? item.email ?? '',
          email: item.email ?? '',
          full_name: (item.full_name ?? [item.first_name, item.middle_name, item.last_name].filter(Boolean).join(' ')) || item.name || '',
          program_course: item.program_course ?? item.program ?? '',
          user_type: 'alumni',
          status: item.status ?? item.user_status ?? 'pending'
        }));

        if (normalized.length && typeof setUsers === 'function') {
          setUsers(prev => {
            // avoid duplicating or creating new array identity when nothing changed
            const prevList = Array.isArray(prev) ? prev : [];
            const existingIds = new Set(prevList.map(u => u && u.id));
            const toAdd = normalized.filter(n => !existingIds.has(n.id));
            if (toAdd.length === 0) {
              // no changes -> return previous reference to avoid re-render/effect retrigger
                
              return prevList;
            }
            return [...prevList, ...toAdd];
          });
        }
      } catch (err) {
        if (err && err.name === 'AbortError') return;
        console.error('UserManagementPanel: alumni fallback fetch failed', err);
      }
    }

    fetchAlumniFallback();

    return () => {
      aborted = true;
      controller.abort();
    };
  }, [users, setUsers]);

  // When Admin filter is selected and no admin users are present, try fetching them
  React.useEffect(() => {
    if (filterType !== 'admin') return undefined;
    let aborted = false;
    const controller = new AbortController();

    const hasAdmins = Array.isArray(users) && users.some(u => normalizeType(u.user_type || u.type) === 'admin');
    if (hasAdmins) return undefined;

    async function fetchAdminsFallback() {
      try {
        // Try common admin endpoints
        const tryUrls = ['/api/admins/', '/api/users/?user_type=admin', '/api/users/?role=admin'];
        let data = null;
        for (const url of tryUrls) {
          try {
            const res = await fetch(url, { signal: controller.signal });
            if (!res.ok) continue;
            const j = await res.json();
            // prefer array shapes
            if (Array.isArray(j)) { data = j; break; }
            if (Array.isArray(j.results)) { data = j.results; break; }
            // some endpoints return an object mapping or single item
            if (j && typeof j === 'object') {
              // try to extract an array-like field
              if (Array.isArray(j.items)) { data = j.items; break; }
              // otherwise, give up on this response
            }
          } catch (e) {
            if (e && e.name === 'AbortError') return;
            // try next url
          }
        }

        if (!data || !Array.isArray(data) || aborted) return;

        const normalized = data.map(item => ({
          id: item.id ?? item.pk ?? null,
          username: item.username ?? item.user_name ?? item.email ?? '',
          email: item.email ?? '',
          full_name: item.full_name ?? item.name ?? '',
          user_type: 'admin',
          status: item.status ?? item.user_status ?? 'active',
          image: item.image ?? item.avatar_url ?? null,
          ...item
        }));

        if (normalized.length && typeof setUsers === 'function') {
          setUsers(prev => {
            const prevList = Array.isArray(prev) ? prev.slice() : [];
            const existingIds = new Set(prevList.map(u => u && u.id));
            const toAdd = normalized.filter(n => !(n.id != null && existingIds.has(n.id)) && !(n.username && prevList.some(p => p && p.username === n.username)));
            if (toAdd.length === 0) return prevList;
            return [...prevList, ...toAdd];
          });
        }
      } catch (err) {
        if (err && err.name === 'AbortError') return;
        console.error('UserManagementPanel: admin fallback fetch failed', err);
      }
    }

    fetchAdminsFallback();

    return () => { aborted = true; controller.abort(); };
  }, [filterType, users, setUsers]);

  // NEW: When Program Head filter is selected and no program_head users are present, fetch them
  React.useEffect(() => {
    let aborted = false;
    const controller = new AbortController();

  const hasProgramHeads = Array.isArray(users) && users.some(u => u && normalizeType(u.user_type || u.type) === 'program_head');
    if (hasProgramHeads) return undefined; // already have program heads

    async function fetchProgramHeadsFallback() {
      try {
        // Prefer API for program heads
        const res = await fetch('http://127.0.0.1:8000/api/program-heads/', { signal: controller.signal });
        let data;
        if (!res.ok) return; // if program-heads API isn't available, don't try non-existent endpoints
        data = await res.json();
        if (aborted) return;

        // Normalize program_head-like shapes into the common user shape
        const items = Array.isArray(data) ? data : [];
        const normalized = items
          .map(item => {
            // determine if item is a program head record or map as program_head
            const maybeType = (item.user_type || item.type || '').toString().toLowerCase();
            const isPH = maybeType === 'program_head' || (item.program && (item.username || item.name || item.email));
            if (!isPH && res && res.ok === false) return null; // when we fetched /api/users/ maybe it contains mixed types

            const id = item.id ?? item.pk ?? null;
            const username = item.username ?? item.user_name ?? item.email ?? '';
            const email = item.email ?? '';
            const full_name = (item.full_name ?? [item.name, item.surname, item.mi].filter(Boolean).join(' ')) || [item.first_name, item.middle_name, item.last_name].filter(Boolean).join(' ') || item.name || '';
            const program_course = item.program ?? item.program_course ?? '';
            const status = item.status ?? item.user_status ?? 'pending';

            return {
              id,
              username,
              email,
              full_name,
              program_course,
              user_type: 'program_head',
              status
            };
          })
          .filter(Boolean);

        // Attempt to fetch legacy users_programhead rows (may not exist on all backends).
        // The server manages a legacy mirror table; try to read it and merge password/legacy fields
        // into the program_head objects by username or id.
        let legacyMap = new Map();
        try {
          const legacyRes = await fetch('http://127.0.0.1:8000/api/users_programhead/', { signal: controller.signal });
          if (legacyRes && legacyRes.ok) {
            const legacyData = await legacyRes.json();
            if (Array.isArray(legacyData)) {
              for (const row of legacyData) {
                const keyId = row.id ?? null;
                const keyUsername = (row.username || '').toString().toLowerCase();
                legacyMap.set(`id:${keyId}`, row);
                if (keyUsername) legacyMap.set(`user:${keyUsername}`, row);
              }
            }
          }
        } catch (e) {
          // ignore legacy fetch failures — it's optional
        }

        // If we have legacy rows, attach legacy_password (or password) to matching normalized items
        if (legacyMap.size > 0 && normalized.length) {
          for (const n of normalized) {
            const byId = n.id != null ? legacyMap.get(`id:${n.id}`) : null;
            const byUser = (n.username || '') ? legacyMap.get(`user:${(n.username || '').toString().toLowerCase()}`) : null;
            const match = byId || byUser;
            if (match && (match.password || match.legacy_password)) {
              // attach but don't overwrite an existing password field if present
              if (!n.password && !n.legacy_password) n.legacy_password = match.password || match.legacy_password;
            }
          }
        }

        if (normalized.length && typeof setUsers === 'function') {
          setUsers(prev => {
            const prevList = Array.isArray(prev) ? prev : [];
            // Build maps to detect both new items and updates (e.g., legacy_password added)
            const prevById = new Map(prevList.filter(Boolean).map(u => [u.id, u]));
            const newList = prevList.slice();

            let changed = false;

            for (const item of normalized) {
              if (item.id != null && prevById.has(item.id)) {
                // Possibly merge additional fields (e.g., legacy_password) into existing entry
                const existing = prevById.get(item.id) || {};
                const merged = { ...existing, ...item };
                // If legacy_password was added but previous didn't have it, mark changed
                if ((item.legacy_password || item.password) && !existing.legacy_password && !existing.password) {
                  changed = true;
                }
                // If other fields differ, mark changed
                if (!changed) {
                  const keys = Object.keys(merged);
                  for (const k of keys) {
                    if (String(merged[k]) !== String(existing[k] ?? '')) {
                      changed = true;
                      break;
                    }
                  }
                }
                if (changed) {
                  // replace in newList
                  const idx = newList.findIndex(u => u && u.id === item.id);
                  if (idx >= 0) newList[idx] = merged;
                }
              } else {
                // new item -> append
                newList.push(item);
                changed = true;
              }
            }

            return changed ? newList : prevList;
          });
        }
      } catch (err) {
        if (err && err.name === 'AbortError') return;
        console.error('UserManagementPanel: program head fallback fetch failed', err);
      }
    }

    // Only trigger if the current filter is program_head so we don't fetch unnecessarily
    if (typeof window !== 'undefined' && window.location && window.location.hash) {
      // noop (keeps linter happy)
    }

    if (typeof setUsers === 'function') {
      // start fetch only when the Program Head filter is visible/selected
      // we can't read filterType easily here, so attach a small watcher via DOM or the outer component - simpler: fetch once when component mounts if no PH present
      fetchProgramHeadsFallback();
    }

    return () => { aborted = true; controller.abort(); };
  }, [users, setUsers]);

  // When editingUser changes, populate local edit fields so the form can show them
  React.useEffect(() => {
    if (editingUser) {
      setUsername(editingUser.username || '');
      setUserType(editingUser.user_type || 'alumni');
      setEditEmail(editingUser.email || '');
      setEditFullName(editingUser.full_name || '');
      setEditProgramCourse(editingUser.program_course || '');
      setEditStatus(editingUser.status || 'pending');
    }
  }, [editingUser, setUsername, setUserType]);

  // helpers to open/close confirm dialog
  const openConfirm = (message, onConfirm, title = 'Confirm') => {
    setConfirmDialog({ open: true, title, message, onConfirm });
  };
  const closeConfirm = () => setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });
  // Helper to capitalize status/display strings (safe)
  const capitalize = (s) => {
    try {
      if (s === null || s === undefined) return '';
      const str = String(s);
      return str.charAt(0).toUpperCase() + str.slice(1);
    } catch (e) {
      return s;
    }
  };
  // Return background and foreground color for a given status
  const statusStyle = (s) => {
    const st = (s || 'pending').toString().toLowerCase();
    if (st === 'approved') return { background: '#ecfdf5', color: '#059669', border: '1px solid rgba(5,150,105,0.12)' };
    if (st === 'reject' || st === 'rejected') return { background: '#fff1f2', color: '#ef4444', border: '1px solid rgba(239,68,68,0.08)' };
    return { background: '#f8fafc', color: '#374151', border: '1px solid rgba(15,23,42,0.04)' };
  };

  // Responsive top offset for modals: measure header height or fallback to percentage
  const [modalTop, setModalTop] = React.useState(100);
  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let mounted = true;
    const selectors = ['#app-header', '.app-header', 'header', '.ProgramHeadHeader', '#header'];
    function compute() {
      try {
        let h = 0;
        for (const s of selectors) {
          const el = document.querySelector(s);
          if (el && el.getBoundingClientRect) {
            h = el.getBoundingClientRect().height || 0;
            if (h) break;
          }
        }
        if (!h) {
          // fallback to a percentage of viewport (12%) capped to 120px
          h = Math.min(window.innerHeight * 0.12, 120);
        }
        if (mounted) setModalTop(Math.ceil(h) + 12); // small extra gap
      } catch (e) {
        if (mounted) setModalTop(100);
      }
    }
    // compute immediately and on resize
    compute();
    window.addEventListener('resize', compute);
    return () => { mounted = false; window.removeEventListener('resize', compute); };
  }, []);

  // refreshUsers helper removed — Refresh button was removed and parent-provided
  // `fetchUsers` prop should be used by callers instead. Kept logic small to
  // avoid leaving unused functions that trigger ESLint warnings.

  // Toggle sort: when called without args, toggle between asc/desc for current key
  const toggleSort = (key) => {
    if (!key) return;
    if (sortKey === key) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  // Filter users by type and per-type search
  let filteredUsers = (users || []).filter(u => {
    // type filter (use normalizeType to accept variants)
    if (filterType && normalizeType(u.user_type || u.type) !== filterType) return false;
    // search behavior per type
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return true;
    if (filterType === 'alumni') {
      const idStr = (String(u.id || '')).toLowerCase();
      const username = (u.username || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const fullName = (u.full_name || '').toLowerCase();
      const programCourse = ((u.program_course || u.program || '')).toString().toLowerCase();
      const year = ((u.year_graduated ?? u.yearGraduated ?? u.yearGraduation) || '').toString().toLowerCase();
      return idStr.includes(q) || username.includes(q) || email.includes(q) || fullName.includes(q) || programCourse.includes(q) || year.includes(q);
    }
    // program_head and admin: search by username, email, id or name
    return (u.username || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (String(u.id || '')).toLowerCase().includes(q) || (u.full_name || '').toLowerCase().includes(q);
  });

  // Apply sorting if requested
  if (sortKey) {
    const key = sortKey;
    const order = sortOrder === 'asc' ? 1 : -1;
    filteredUsers = filteredUsers.slice().sort((a, b) => {
      // support numeric year_graduated
      if (key === 'year_graduated') {
        const va = Number(a.year_graduated ?? a.yearGraduated ?? a.yearGraduation ?? NaN);
        const vb = Number(b.year_graduated ?? b.yearGraduated ?? b.yearGraduation ?? NaN);
        // Treat NaN as very small so missing values sort last for desc
        const na = Number.isFinite(va) ? va : (order === 1 ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY);
        const nb = Number.isFinite(vb) ? vb : (order === 1 ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY);
        return (na - nb) * order;
      }
      // default to string comparison (username)
      const sa = String(a[key] ?? a.username ?? '').toLowerCase();
      const sb = String(b[key] ?? b.username ?? '').toLowerCase();
      if (sa < sb) return -1 * order;
      if (sa > sb) return 1 * order;
      return 0;
    });
  }
  // Prevent ESLint "no-unused-vars" for create-form state and helpers which are
  // consumed only in conditional JSX (modal). This is a harmless no-op that
  // documents why these variables exist and keeps the linter quiet.
  /* eslint-disable-next-line no-unused-vars */
  const __unused_create_vars = [CreateProgramHeadForm, CreateAlumniForm, createName, setCreateName, createSurname, setCreateSurname, createMI, setCreateMI, createGender, setCreateGender, createContact, setCreateContact, createEmail, setCreateEmail, createFaculty, setCreateFaculty, createProgram, setCreateProgram, createConfirmPassword, setCreateConfirmPassword, showCreatePassword, setShowCreatePassword, showCreateConfirm, setShowCreateConfirm, facultyPrograms];
  // compute displayed users for rendering: use server-fetched alumni page when on alumni filter
  let displayedUsers;
  if (filterType === 'alumni') {
  // If server returned a paged response (alumniTotal > alumniList.length) then alumniList is a single page
  // Otherwise, if alumniTotal is null or equals alumniList.length, assume server returned the full list and apply client-side slicing
  if (Array.isArray(alumniList) && (alumniTotal == null || alumniTotal === alumniList.length)) {
      // client-side paging fallback
      // apply client-side search filter across alumniList when searchQuery is present
      const q = (searchQuery || '').trim().toLowerCase();
      const filteredAlumni = q ? alumniList.filter(u => {
        const idStr = (String(u.id || '')).toLowerCase();
        const username = (u.username || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const fullName = (u.full_name || [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(' ')).toString().toLowerCase();
        const programCourse = ((u.program_course || u.program || '')).toString().toLowerCase();
        const year = ((u.year_graduated ?? u.yearGraduated ?? u.yearGraduation) || '').toString().toLowerCase();
        return idStr.includes(q) || username.includes(q) || email.includes(q) || fullName.includes(q) || programCourse.includes(q) || year.includes(q);
      }) : alumniList;

      const start = (alumniPage - 1) * (Number(alumniPageSize) || 50);
      displayedUsers = filteredAlumni.slice(start, start + (Number(alumniPageSize) || 50));
    } else {
      // assume alumniList already contains only the current page; still apply simple client-side filter for search
      const q = (searchQuery || '').trim().toLowerCase();
      if (q && Array.isArray(alumniList)) {
        displayedUsers = alumniList.filter(u => {
          const idStr = (String(u.id || '')).toLowerCase();
          const username = (u.username || '').toLowerCase();
          const email = (u.email || '').toLowerCase();
          const fullName = (u.full_name || [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(' ')).toString().toLowerCase();
          const programCourse = ((u.program_course || u.program || '')).toString().toLowerCase();
          const year = ((u.year_graduated ?? u.yearGraduated ?? u.yearGraduation) || '').toString().toLowerCase();
          return idStr.includes(q) || username.includes(q) || email.includes(q) || fullName.includes(q) || programCourse.includes(q) || year.includes(q);
        });
      } else {
        displayedUsers = alumniList;
      }
    }
  } else {
    displayedUsers = filteredUsers;
  }
  const showPager = filterType === 'alumni' && ((alumniTotal != null && alumniTotal > alumniPageSize) || (alumniTotal == null && Array.isArray(alumniList) && alumniList.length > alumniPageSize));

  // CSV export helper: accepts an array of alumni objects and triggers a download
  const downloadAlumniCsv = (rows) => {
    try {
      if (!Array.isArray(rows) || rows.length === 0) {
        // nothing to download
        return;
      }
      // choose columns to export (id, username, email, full_name, program_course, year_graduated, status)
      const cols = ['id', 'username', 'email', 'full_name', 'program_course', 'year_graduated', 'status'];
      const csvLines = [];
      csvLines.push(cols.join(','));
      for (const r of rows) {
        const values = cols.map(c => {
          const v = r[c] ?? r[c.replace('program_course','program')] ?? '';
          // escape quotes and commas
          const s = String(v).replace(/"/g, '""');
          return `"${s}"`;
        });
        csvLines.push(values.join(','));
      }
      const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const now = new Date();
      const ts = now.toISOString().slice(0,19).replace(/[:T]/g,'-');
      a.download = `alumni-export-${ts}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('CSV export failed', e);
    }
  };

  // Fetch all alumni from the server (handles several common pagination styles)
  const downloadAllAlumni = async () => {
    if (alumniLoading) return; // avoid double clicks
    setAlumniLoading(true);
    try {
      // If client already has full list, use it
      if (Array.isArray(alumniList) && alumniTotal != null && alumniList.length === alumniTotal) {
        downloadAlumniCsv(alumniList);
        return;
      }

      const base = '/api/alumni/';
      const collected = [];

      // Try limit/offset loop (most robust if supported)
      try {
        const limit = 1000;
        let offset = 0;
        let keep = true;
        while (keep) {
          const url = `${base}?limit=${limit}&offset=${offset}`;
          const res = await fetch(url);
          if (!res.ok) break;
          const data = await res.json();
          let page = null;
          if (Array.isArray(data)) page = data;
          else if (Array.isArray(data.results)) page = data.results;
          else if (Array.isArray(data.items)) page = data.items;
          else page = null;
          if (!page || page.length === 0) break;
          collected.push(...page);
          if (page.length < limit) break;
          offset += limit;
          // safety cap
          if (collected.length > 500000) break;
        }
      } catch (err) {
        // ignore and try next strategy
      }

      // If nothing collected, try page-based pagination
      if (collected.length === 0) {
        try {
          const pageSize = 1000;
          let page = 1;
          while (true) {
            const url = `${base}?page=${page}&page_size=${pageSize}`;
            const res = await fetch(url);
            if (!res.ok) break;
            const data = await res.json();
            const pageItems = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []));
            if (!pageItems || pageItems.length === 0) break;
            collected.push(...pageItems);
            if (pageItems.length < pageSize) break;
            page += 1;
            if (collected.length > 500000) break;
          }
        } catch (err) {
          // ignore and try next strategy
        }
      }

      // If still empty, try fetching base and following 'next' links if present
      if (collected.length === 0) {
        try {
          let url = base;
          while (url) {
            const res = await fetch(url);
            if (!res.ok) break;
            const data = await res.json();
            if (Array.isArray(data)) {
              collected.push(...data);
              break;
            }
            if (Array.isArray(data.results)) {
              collected.push(...data.results);
              // try to follow 'next' link (DRF)
              url = data.next || null;
              if (!url) break;
              // If 'next' is a full URL, keep it; otherwise prefix base origin
            } else {
              break;
            }
            if (collected.length > 500000) break;
          }
        } catch (err) {
          // give up
        }
      }

      // As a last resort, if collected is empty but alumniList exists and is larger than displayed page, use alumniList
      const rowsToExport = (collected.length > 0) ? collected : (Array.isArray(alumniList) && alumniList.length > 0 ? alumniList : displayedUsers || []);
      downloadAlumniCsv(rowsToExport);
    } finally {
      setAlumniLoading(false);
    }
  };

  // Download alumni with optional client-side filters (year, course)
  const downloadFilteredAlumni = async () => {
    if (downloadLoading) return;
    setDownloadLoading(true);
    try {
      let res = await fetch('/api/alumni/');
      if (!res.ok) {
        // fallback to absolute host
        try { res = await fetch('http://127.0.0.1:8000/api/alumni/'); } catch (_) { }
      }
      const json = await res.json().catch(() => null);
      let data = [];
      if (Array.isArray(json)) data = json;
      else if (json && Array.isArray(json.results)) data = json.results;
      else if (json && Array.isArray(json.alumni)) data = json.alumni;
      else if (json && Array.isArray(json.items)) data = json.items;
      data = data || [];

      const filtered = data.filter(item => {
        try {
          const yearVal = item.year_graduated ?? item.year ?? item.graduation_year ?? item.yearGraduated ?? '';
          const prog = (item.program_course ?? item.program ?? item.course_program ?? '') || '';
          if (downloadYear && String(downloadYear).trim() !== '') {
            if (!yearVal || String(yearVal) !== String(downloadYear)) return false;
          }
          if (downloadCourse && String(downloadCourse).trim() !== '') {
            if (!prog || !prog.toLowerCase().includes(String(downloadCourse).toLowerCase())) return false;
          }
          return true;
        } catch (_) { return true; }
      });

      // If no filters are applied, reuse the downloadAllAlumni CSV helper by passing all rows
      if (!downloadYear && !downloadCourse) {
        downloadAllAlumni();
      } else {
        // reuse download helper defined earlier
        try { downloadAlumniCsv(filtered); } catch (e) { console.error(e); }
      }

      setDownloadModalOpen(false);
    } catch (e) {
      console.error('downloadFilteredAlumni error', e);
      try { alert('Failed to download alumni.'); } catch(_){}
    } finally {
      setDownloadLoading(false);
    }
  };

  // Fetch a page of alumni from the server. Tries limit/offset then page-based params.
  const fetchAlumniPage = React.useCallback(async (page = 1) => {
    setAlumniLoading(true);
    try {
      const size = Number(alumniPageSize) || 50;
      const offset = (page - 1) * size;

      // prefer limit/offset style
      const base = '/api/alumni/';
      const tryUrls = [
        `${base}?limit=${size}&offset=${offset}`,
        `${base}?page=${page}&page_size=${size}`,
        // fallback to raw endpoint without params
        base
      ];

      let lastError = null;
      for (const url of tryUrls) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const data = await res.json();

          // DRF-style paginated response contains results and count
          if (data && Array.isArray(data.results)) {
            setAlumniList(data.results || []);
            setAlumniTotal(typeof data.count === 'number' ? data.count : (data.results || []).length);
            setAlumniPage(page);
            return { results: data.results || [], total: data.count || (data.results || []).length };
          }

          // If it's an array, treat as a page (server may already page)
          if (Array.isArray(data)) {
            setAlumniList(data);
            // try to read total from header
            const totalHeader = res.headers.get('X-Total-Count') || res.headers.get('X-Total') || null;
            setAlumniTotal(totalHeader ? Number(totalHeader) : data.length);
            setAlumniPage(page);
            return { results: data, total: totalHeader ? Number(totalHeader) : data.length };
          }

          // If server returned an object mapping ids, try to coerce
          if (data && typeof data === 'object') {
            // if object contains array-like values, attempt to use 'results' or 'items'
            const maybe = data.results || data.items || null;
            if (Array.isArray(maybe)) {
              setAlumniList(maybe);
              setAlumniTotal(typeof data.count === 'number' ? data.count : maybe.length);
              setAlumniPage(page);
              return { results: maybe, total: data.count || maybe.length };
            }
          }
        } catch (err) {
          lastError = err;
          // try next url
        }
      }

      // if we reached here, nothing worked; clear list
      setAlumniList([]);
      setAlumniTotal(0);
      console.warn('fetchAlumniPage: failed to fetch paged alumni', lastError);
      return { results: [], total: 0 };
    } finally {
      setAlumniLoading(false);
    }
  }, [alumniPageSize]);

  // When filter changes to alumni or search query changes, refresh the first page
  React.useEffect(() => {
    let mounted = true;
    if (filterType === 'alumni') {
      // basic debounce: wait briefly for search typing to settle
      const t = setTimeout(() => { if (mounted) fetchAlumniPage(1); }, 250);
      return () => { mounted = false; clearTimeout(t); };
    }
    return undefined;
  }, [filterType, searchQuery, fetchAlumniPage]);
  return (
  <div style={{ minHeight: '100vh', background: '#f7f7f7', padding: '32px 40px' }}>
    <style>{`
      .user-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        font-size: 13px;
      }
      .user-table th {
        padding: 12px 16px;
        font-size: 13px;
        font-weight: 600;
        color: #1e293b;
        text-align: left;
        border-bottom: 2px solid #e2e8f0;
        background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
        white-space: nowrap;
      }
      .user-table td {
        padding: 12px 16px;
        border-bottom: 1px solid #e2e8f0;
        color: #334155;
      }
      .user-table tr:hover {
        background-color: #f8fafc;
      }
      .user-table-container {
        background: linear-gradient(to bottom, #ffffff, #f8fafc);
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        padding: 24px;
        border: 1px solid rgba(0, 0, 0, 0.05);
        overflow: hidden;
      }
      .status-select {
        padding: 6px 10px;
        border-radius: 6px;
        border: 1px solid #e2e8f0;
        background: white;
        cursor: pointer;
        color: #1e293b;
        font-size: 13px;
      }
      .status-select:hover {
        border-color: #cbd5e1;
      }
      .status-select:focus {
        outline: none;
        border-color: #60a5fa;
        box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.1);
      }
    `}</style>
        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <button
            onClick={() => { setFilterType('alumni'); setSearchQuery(''); }}
            className={`btn ${filterType === 'alumni' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '8px 18px' }}
          >
            Alumni
          </button>
          <button
            onClick={() => { setFilterType('program_head'); setSearchQuery(''); }}
            className={`btn ${filterType === 'program_head' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '8px 18px' }}
          >
            Program Head
          </button>
          <button
            onClick={() => { setFilterType('admin'); setSearchQuery(''); }}
            className={`btn ${filterType === 'admin' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '8px 18px' }}
          >
            Admin
          </button>
          </div>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Add User button (modern) - always show; modal will limit create types for readonly program heads */}
            <button onClick={() => setCreateTypeModalOpen(true)} className="btn btn-primary">+ Add User</button>
            {/* Refresh button removed per UX request */}
            {/* Sort hint: click column headers to sort (Username always, Year Graduate for alumni) */}
            {/* Select / search input */}
            <input
              type="text"
              placeholder={filterType === 'alumni' ? 'Search ID, username, program or name' : 'Search ID or username'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc', width: 260 }}
            />
            <button onClick={() => setSearchQuery('')} className="btn btn-outline">Clear</button>
          </div>
        </div>
        {/* Table */}
        <div style={{ background: 'linear-gradient(to bottom, #ffffff, #f8fafc)', borderRadius: 12, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', padding: 24, border: '1px solid rgba(0, 0, 0, 0.05)' }}>
          {/* Pager / show-all control (placed outside the table to avoid invalid markup) */}
          {showPager && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ color: '#6b7280', fontSize: 13, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    className="btn"
                    onClick={() => setDownloadModalOpen(true)}
                    disabled={alumniLoading || downloadLoading}
                    style={{ padding: '6px 10px', background: '#0c35ebff', color: '#fff', border: 'none', borderRadius: 6, cursor: alumniLoading ? 'default' : 'pointer', opacity: alumniLoading ? 0.7 : 1 }}
                  >
                    {alumniLoading ? 'Downloading...' : 'Download Alumni'}
                  </button>
                  <div>Showing {displayedUsers.length} of {(alumniTotal != null ? alumniTotal : (Array.isArray(alumniList) ? alumniList.length : '...'))} alumni</div>
                </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="btn btn-outline" disabled={alumniPage <= 1 || alumniLoading} onClick={() => { if (alumniPage > 1) { fetchAlumniPage(alumniPage - 1); setAlumniPage(prev => Math.max(1, prev - 1)); } }} style={{ padding: '6px 10px' }}>Prev</button>
                <div style={{ color: '#6b7280', fontSize: 13 }}>Page</div>
                <div style={{ fontWeight: 700 }}>{alumniPage}</div>
                <button className="btn btn-outline" disabled={((alumniTotal != null && (alumniPage * alumniPageSize) >= alumniTotal) || (alumniTotal == null && Array.isArray(alumniList) && (alumniPage * alumniPageSize) >= alumniList.length)) || alumniLoading} onClick={() => { fetchAlumniPage(alumniPage + 1); setAlumniPage(prev => prev + 1); }} style={{ padding: '6px 10px' }}>Next</button>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select value={alumniPageSize} onChange={(e) => { const v = Number(e.target.value); setAlumniPageSize(v); setAlumniPage(1); fetchAlumniPage(1); }} style={{ padding: '6px 8px', borderRadius: 6 }}>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <div style={{ color: '#6b7280', fontSize: 13 }}>per page</div>
              </div>
            </div>
          )}

          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)' }}>
                <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: '600', color: '#1e293b', textAlign: 'left', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>ID</th>
                <th style={{ border: '1px solid #eee', padding: '6px 10px', width: 64, textAlign: 'center', fontSize: 13, fontWeight: '600' }}>Avatar</th>
                <th
                  style={{ border: '1px solid #eee', padding: '10px', fontSize: 14, fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleSort('username')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSort('username'); } }}
                >
                  Username
                  {sortKey === 'username' && <span style={{ marginLeft: 8, fontSize: 12, color: '#64748b' }}>{sortOrder === 'asc' ? '▲' : '▼'}</span>}
                </th>
                {/* Program / Course header - restored so columns align with row cells */}
                {filterType === 'alumni' && <th style={{ border: '1px solid #eee', padding: '10px', fontSize: 14, fontWeight: 'bold' }}>Program / Course</th>}
                {/* Year Graduate column inserted between Email and Full Name (alumni only) */}
                {filterType === 'alumni' && (
                  <th
                    style={{ border: '1px solid #eee', padding: '10px', cursor: 'pointer', userSelect: 'none' }}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleSort('year_graduated')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSort('year_graduated'); } }}
                  >
                    Year Graduate
                    {sortKey === 'year_graduated' && <span style={{ marginLeft: 8, fontSize: 12, color: '#64748b' }}>{sortOrder === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                )}
                {filterType === 'alumni' && <th style={{ border: '1px solid #eee', padding: '10px' }}>Full Name</th>}
                {/* Program Head dynamic columns (exclude faculty, status, and name parts; we'll render Full Name) */}
                {filterType === 'program_head' && (() => {
                            const keys = Array.from(new Set((users || [])
                              .filter(u => normalizeType(u.user_type || u.type) === 'program_head')
                              .flatMap(u => Object.keys(u || {}))));
                  // exclude sensitive and unwanted fields (also exclude name and surname variants and full_name)
                  // Exclude sensitive fields and media/avatar fields (don't render image column in the table)
                  const exclude = ['password', 'id', 'user_type', 'username', 'status', 'faculty', 'first_name', 'last_name', 'middle_name', 'mi', 'middle_initial', 'fname', 'lname', 'name', 'surname', 'full_name', 'email', 'phone', 'mobile', 'telephone', 'contact', 'contact_no', 'contact_number', 'phone_number', 'cellphone', 'program_course', 'image', 'avatar_url', 'year_graduated', 'yearGraduated', 'yearGraduation', 'graduation_year', 'year'];
                  const visible = keys.filter(k => !exclude.includes(k));
                  // Render Full Name first, then visible fields
                      return (
                    <>
                      <th key="full_name_ph" style={{ border: '1px solid #eee', padding: '10px', textTransform: 'none', fontSize: 14, fontWeight: 'bold' }}>Full Name</th>
                      {/* Add Program column for Program Head table */}
                      <th key="program_ph" style={{ border: '1px solid #eee', padding: '10px', textTransform: 'none', fontSize: 14, fontWeight: 'bold' }}>Program</th>
                      {visible.map(k => (
                        <th key={k} style={{ border: '1px solid #eee', padding: '10px', textTransform: 'capitalize', fontSize: 14, fontWeight: 'bold' }}>{k.replace(/_/g, ' ')}</th>
                      ))}
                      { !readonlyForProgramHead && (
                        <th key="status_ph" style={{ border: '1px solid #eee', padding: '10px', fontSize: 14, fontWeight: 'bold' }}>Status</th>
                      )}
                    </>
                  );
                })()}
                {/* 'Status' column removed for alumni table */}
                <th style={{ border: '1px solid #eee', padding: '10px', fontSize: 14, fontWeight: 'bold' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedUsers.map(user => (
                <tr key={user.id} style={{ background: '#ffffff', transition: 'background-color 0.2s ease', ':hover': { background: '#f8fafc' } }}>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#334155' }}>{user.id}</td>
                  <td style={{ border: '1px solid #eee', padding: '8px 10px', textAlign: 'center' }}>
                    { (user.image || user.avatar_url || (user.username && `/images/${user.username}.png`)) ? (
                      <img
                        src={user.image || user.avatar_url || `/images/${user.username}.png`}
                        alt="avatar"
                        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', display: 'inline-block', background: '#eef2ff' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eef2ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#0f172a', fontWeight: 700 }}>
                        {(user.full_name ? user.full_name.split(' ').map(n => n[0]).slice(0,2).join('') : (user.username || '').slice(0,2)).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#334155' }}>{user.username}</td>
                  {filterType === 'alumni' && <td style={{ border: '1px solid #eee', padding: '10px' }}>{user.program_course || user.program || '-'}</td>}
                  {/* Year Graduate cell: support different possible field names and fallback to '-' */}
                  {filterType === 'alumni' && (
                    <td style={{ border: '1px solid #eee', padding: '10px' }}>
                      {user.year_graduated ?? user.yearGraduated ?? user.yearGraduation ?? '-'}
                    </td>
                  )}
                  {filterType === 'alumni' && <td style={{ border: '1px solid #eee', padding: '10px' }}>{user.full_name}</td>}
                  {filterType === 'program_head' && (() => {
                    // Build Full Name as 'First Middle Last' using common field names
                    let first = user.first_name || user.fname || user.given_name || user.first || user.name || user.givenName || user.givenname || user['given-name'] || user.displayName || user.display_name || user.firstname || user.firstName || user.forename || '';
                    let mi = user.mi || user.middle_initial || user.middle_name || user.mname || user.middle || '';
                    let last = user.last_name || user.surname || user.family_name || user.lname || user.lastname || user.familyName || user.family_name || user['family-name'] || user.lastname || user.lastName || user.familyname || '';

                    // If first is missing, try splitting full_name or displayName
                    if (!first) {
                      const fn = user.full_name || user.displayName || user.display_name || '';
                      if (fn) {
                        // If name contains a comma, assume "Last, First [MI]" format
                        if (fn.includes(',')) {
                          const [left, right] = fn.split(',').map(s => s.trim());
                          if (left) last = left;
                          if (right) {
                            const rparts = right.split(/\s+/);
                            if (rparts.length >= 1) {
                              first = rparts.shift();
                              if (rparts.length) mi = mi || rparts.join(' ');
                            }
                          }
                        } else {
                          const parts = fn.trim().split(/\s+/);
                          if (parts.length === 1) {
                            first = parts[0];
                          } else if (parts.length === 2) {
                            first = parts[0];
                            last = last || parts[1];
                          } else if (parts.length > 2) {
                            first = parts[0];
                            mi = mi || parts.slice(1, parts.length - 1).join(' ');
                            last = last || parts[parts.length - 1];
                          }
                        }
                      }
                    }

                    // As a last resort, use username as first name
                    if (!first) {
                      const uname = user.username || '';
                      if (uname) {
                        first = uname.split(/[@._-]/)[0];
                      }
                    }

                    const nameParts = [];
                    if (first) nameParts.push(first);
                    if (mi) nameParts.push(mi);
                    if (last) nameParts.push(last);
                    const fullName = nameParts.join(' ').trim();

                    // Determine visible keys same as header
                    const keys = Array.from(new Set((users || [])
                      .filter(u => normalizeType(u.user_type || u.type) === 'program_head')
                      .flatMap(u => Object.keys(u || {}))));
                    // Exclude sensitive fields and media/avatar fields so images are not rendered as table cells
                    const exclude = ['password', 'id', 'user_type', 'username', 'status', 'faculty', 'first_name', 'last_name', 'middle_name', 'mi', 'middle_initial', 'fname', 'lname', 'name', 'surname', 'full_name', 'email', 'phone', 'mobile', 'telephone', 'contact', 'contact_no', 'contact_number', 'phone_number', 'cellphone', 'program_course', 'image', 'avatar_url', 'year_graduated', 'yearGraduated', 'yearGraduation', 'graduation_year', 'year'];
                    const visible = keys.filter(k => !exclude.includes(k));

                    return (
                      <>
                        <td key="full_name_val" style={{ border: '1px solid #eee', padding: '10px' }}>{fullName || ''}</td>
                        {/* Program column for Program Head rows */}
                        <td key="program_val" style={{ border: '1px solid #eee', padding: '10px' }}>{user.program || user.program_course || '-'}</td>
                        {visible.map(k => (
                          <td key={k} style={{ border: '1px solid #eee', padding: '10px' }}>{String(user[k] ?? '')}</td>
                        ))}
                        { !readonlyForProgramHead && (
                          <td key={`${user.id}-status`} style={{ border: '1px solid #eee', padding: '10px' }}>
                          <select
                            value={user.status || 'pending'}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              // optimistic update with per-row loading and rollback on failure
                              setRowLoading(prev => ({ ...prev, [user.id]: true }));
                              const prevStatus = user.status;
                              // apply optimistic local update immediately
                              if (typeof setUsers === 'function') {
                                setUsers(prev => (prev || []).map(u => u.id === user.id ? { ...u, status: newStatus } : u));
                              }
                              try {
                                if (typeof handleUpdateUser === 'function') {
                                  const _payload = { status: newStatus };
                                  if (readonlyForProgramHead) _payload.acting_user_type = 'program_head';
                                  await handleUpdateUser(user.id, _payload, undefined, undefined, setError, user.user_type);
                                }
                              } catch (err) {
                                console.error('Failed to update status', err);
                                // rollback
                                if (typeof setUsers === 'function') {
                                  setUsers(prev => (prev || []).map(u => u.id === user.id ? { ...u, status: prevStatus } : u));
                                }
                                setError && setError('Failed to update status');
                              } finally {
                                setRowLoading(prev => ({ ...prev, [user.id]: false }));
                              }
                            }}
                            style={{ padding: 6, borderRadius: 6, ...statusStyle(user.status) }}
                            disabled={!!rowLoading[user.id]}
                          >
                            <option value="pending">{`• ${capitalize('pending')}`}</option>
                            <option value="approved">{`• ${capitalize('approved')}`}</option>
                            <option value="reject">{`• ${capitalize('reject')}`}</option>
                          </select>
                          </td>
                        )}
                      </>
                    );
                  })()}
                  {/* Alumni row status cell removed from table rows */}
                  <td style={{ border: '1px solid #eee', padding: '10px' }}>
                    {filterType === 'program_head' ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setViewUser(user)} className="btn btn-outline" style={{ padding: '6px 10px' }}>View</button>
                        {!readonlyForProgramHead && (
                          <>
                            <button onClick={() => startEdit(user, setEditingUser, setUsername, setUserType)} className="btn btn-primary" style={{ padding: '6px 10px' }}>Edit</button>
                            <button
                              onClick={(e) => {
                                // prevent row-level click handlers from firing
                                e && e.stopPropagation && e.stopPropagation();
                                // open custom confirm dialog for delete
                                openConfirm('Are you sure you want to delete this user?', async () => {
                                  try {
                                    if (typeof handleDeleteUser === 'function') {
                                      await handleDeleteUser(user.id, fetchUsers, setError);
                                    }
                                    // locally remove user from list if setter available
                                    if (typeof setUsers === 'function') {
                                      setUsers(prev => (prev || []).filter(u => u && u.id !== user.id));
                                    }
                                  } catch (err) {
                                    console.error('Failed to delete user', err);
                                    setError && setError('Failed to delete user');
                                  } finally {
                                    closeConfirm();
                                  }
                                }, 'Delete user');
                              }}
                              className="btn btn-danger"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <div>
                        {filterType === 'alumni' ? (
                            <button onClick={() => setViewUser(user)} className="btn btn-outline" style={{ padding: '6px 12px' }}>View</button>
                        ) : (
                          <div>
                            {!readonlyForProgramHead && (
                              <>
                                <button onClick={() => startEdit(user, setEditingUser, setUsername, setUserType)} className="btn btn-primary" style={{ marginRight: 8 }}>Edit</button>
                                <button onClick={(e) => {
                                  e && e.stopPropagation && e.stopPropagation();
                                  openConfirm('Are you sure you want to delete this user?', async () => {
                                    try {
                                      if (typeof handleDeleteUser === 'function') await handleDeleteUser(user.id, fetchUsers, setError);
                                      if (typeof setUsers === 'function') setUsers(prev => (prev || []).filter(u => u && u.id !== user.id));
                                    } catch (err) {
                                      console.error('Failed to delete user', err);
                                      setError && setError('Failed to delete user');
                                    } finally {
                                      closeConfirm();
                                    }
                                  }, 'Delete user');
                                }} className="btn btn-danger">Delete</button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* View Modal */}
        {viewUser && (
          <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: `${modalTop}px 20px 20px` }}>
            <div style={{ background: 'linear-gradient(180deg,#ffffff, #fbfdff)', padding: 20, borderRadius: 12, maxWidth: 880, width: '95%', maxHeight: '90%', overflow: 'auto', boxShadow: '0 10px 30px rgba(15,23,42,0.15)' }}>
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                {/* Left: avatar + quick info */}
                <div style={{ width: 180, textAlign: 'center', padding: 8 }}>
                  {/* Avatar: show image when available (viewUser.image or public/images fallback), otherwise initials */}
                  { (viewUser.image || viewUser.avatar_url || (viewUser.username && `/images/${viewUser.username}.png`)) ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={viewUser.image || viewUser.avatar_url || `/images/${viewUser.username}.png`}
                        alt="avatar"
                        role="button"
                        onClick={() => {
                          const src = viewUser.image || viewUser.avatar_url || `/images/${viewUser.username}.png`;
                          setFullImageSrc(src);
                          // if we already measured the small image, reuse it for the full-image overlay
                          if (viewImageDims) setFullImageDims(viewImageDims);
                        }}
                        onLoad={(e) => {
                          try {
                            const img = e && e.target;
                            if (img && img.naturalWidth && img.naturalHeight) {
                              setViewImageDims({ width: img.naturalWidth, height: img.naturalHeight });
                            }
                          } catch (_) {}
                        }}
                        style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', marginBottom: 12, display: 'inline-block', background: '#e8f0ff', cursor: 'pointer' }}
                        onError={(e) => { /* hide broken image so initials fallback can show */ e.target.style.display = 'none'; }}
                      />
                      {viewImageDims && (
                        <div style={{ position: 'absolute', right: -6, top: -6, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 11, padding: '4px 6px', borderRadius: 8, zIndex: 2 }}>
                          {`${viewImageDims.width}×${viewImageDims.height}`}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ width: 120, height: 120, borderRadius: '50%', background: '#e8f0ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#27496d', marginBottom: 10 }}>
                      {viewUser.full_name ? viewUser.full_name.split(' ').map(n => n[0]).slice(0,2).join('') : (viewUser.username || '').slice(0,2).toUpperCase()}
                    </div>
                  )}
                  <div style={{ fontWeight: '600', fontSize: 14 }}>{viewUser.full_name || viewUser.username}</div>
                  <div style={{ color: '#6b7280', fontSize: 12 }}>{viewUser.email || ''}</div>
                  <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <div style={{ background: '#eef2ff', color: '#4f46e5', padding: '6px 10px', borderRadius: 999, fontSize: 13, fontWeight: 600 }}>{(viewUser.user_type || '').toUpperCase()}</div>
                  </div>
                </div>

                {/* Right: details */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: 16 }}>User Details</h2>
                    <div style={{ color: '#9ca3af', fontSize: 12 }}>ID #{viewUser.id}</div>
                  </div>

                  <div style={{ marginTop: 14, background: '#fff', borderRadius: 8, padding: 14, boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.02)' }}>
                    {/* two-column info rows */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <div style={{ color: '#6b7280', fontSize: 11 }}>Username</div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{viewUser.username}</div>
                      </div>
                      <div>
                        <div style={{ color: '#6b7280', fontSize: 11 }}>Email</div>
                        <div style={{ fontSize: 13 }}>{viewUser.email || '-'}</div>
                      </div>

                      <div>
                        <div style={{ color: '#6b7280', fontSize: 11 }}>Full name</div>
                        <div style={{ fontSize: 13 }}>{viewUser.full_name || '-'}</div>
                      </div>
                      {/* Program / course intentionally hidden in view modal per UI requirement */}

                      <div>
                        <div style={{ color: '#6b7280', fontSize: 11 }}>Status</div>
                        <div style={{ display: 'inline-block', padding: '5px 8px', background: viewUser.status === 'approved' ? '#ecfdf5' : viewUser.status === 'reject' ? '#fff1f2' : '#f8fafc', color: viewUser.status === 'approved' ? '#059669' : viewUser.status === 'reject' ? '#ef4444' : '#374151', borderRadius: 8, fontWeight: 600, fontSize: 12 }}>{capitalize(viewUser.status || 'pending')}</div>
                      </div>
                      <div>
                        <div style={{ color: '#6b7280', fontSize: 11 }}>User type</div>
                        <div style={{ fontSize: 13 }}>{viewUser.user_type || '-'}</div>
                      </div>
                    </div>

                    {/* extra fields (non-sensitive) */}
                    <div style={{ marginTop: 12 }}>
                      {(() => {
                        // Base exclusions for the view modal
                        const baseExcluded = ['password', 'id', 'username', 'email', 'full_name', 'user_type', 'program_course', 'status'];
                        // For program_head entries, hide alumni-specific fields like year/graduation
                        const programHeadExtra = ['year_graduated', 'year', 'graduation_year', 'yearGraduated'];
                        const excluded = (viewUser && String(viewUser.user_type || '').toLowerCase() === 'program_head') ? baseExcluded.concat(programHeadExtra) : baseExcluded;
                        return Object.keys(viewUser || {}).filter(k => !excluded.includes(k)).map(k => (
                          <div key={k} style={{ display: 'flex', gap: 12, padding: '6px 0', alignItems: 'center', borderTop: '1px solid #f3f4f6' }}>
                            <div style={{ minWidth: 160, color: '#6b7280', fontSize: 12 }}>{k.replace(/_/g, ' ')}</div>
                            <div style={{ flex: 1 }}>{String(viewUser[k] ?? '')}</div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* action buttons */}
                  <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    {/* Only allow Edit/Delete in the view modal when the current user is allowed (admins).
                        If readonlyForProgramHead is true (program head viewing), hide these for program_head entries. */}
                    {!(readonlyForProgramHead && (viewUser.user_type || '').toString().toLowerCase() === 'program_head') && (
                      <>
                        <button
                          onClick={() => {
                            if (typeof startEdit === 'function') startEdit(viewUser, setEditingUser, setUsername, setUserType);
                            setViewUser(null);
                          }}
                          disabled={viewLoading}
                          style={{ padding: '8px 14px', borderRadius: 8, background: viewLoading ? '#bfeefb' : '#0ea5e9', color: 'white', border: 'none', cursor: viewLoading ? 'default' : 'pointer', fontWeight: 600 }}
                        >
                          Edit
                        </button>

                        {/* 'View Survey' button removed */}

                        <button
                          onClick={(e) => {
                            e && e.stopPropagation && e.stopPropagation();
                            openConfirm('Are you sure you want to delete this user?', async () => {
                              try {
                                if (typeof handleDeleteUser === 'function') await handleDeleteUser(viewUser.id, fetchUsers, setError);
                                if (typeof setUsers === 'function') setUsers(prev => (prev || []).filter(u => u && u.id !== viewUser.id));
                                setViewUser(null);
                              } catch (err) {
                                console.error('Failed to delete user', err);
                                setError && setError('Failed to delete user');
                              } finally {
                                closeConfirm();
                              }
                            }, 'Delete user');
                          }}
                          disabled={viewLoading}
                          style={{ padding: '8px 14px', borderRadius: 8, background: viewLoading ? '#f7a8a8' : '#ef4444', color: 'white', border: 'none', cursor: viewLoading ? 'default' : 'pointer', fontWeight: 600 }}
                        >
                          Delete
                        </button>
                      </>
                    )}

                    <button onClick={() => setViewUser(null)} className="btn btn-outline">Close</button>
                  </div>
                </div>
              </div>

                {/* Full image overlay */}
              {fullImageSrc && (
                  <div onClick={() => { setFullImageSrc(null); setFullImageDims(null); }} style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                    <div style={{ position: 'relative', maxWidth: '95%', maxHeight: '95%' }} onClick={(e) => e.stopPropagation()}>
                      <img
                        src={fullImageSrc}
                        alt="full"
                        onLoad={(e) => {
                          try {
                            const img = e && e.target;
                            if (img && img.naturalWidth && img.naturalHeight) {
                              setFullImageDims({ width: img.naturalWidth, height: img.naturalHeight });
                            }
                          } catch (_) {}
                        }}
                        style={{ display: 'block', maxWidth: '100%', maxHeight: '100%', boxShadow: '0 8px 24px rgba(0,0,0,0.6)', borderRadius: 8 }}
                      />
                      {fullImageDims && (
                        <div style={{ position: 'absolute', right: 8, top: 8, background: 'rgba(0,0,0,0.72)', color: '#fff', fontSize: 12, padding: '6px 8px', borderRadius: 8, zIndex: 3 }}>
                          {`${fullImageDims.width}×${fullImageDims.height}`}
                        </div>
                      )}
                    </div>
                    <button onClick={() => { setFullImageSrc(null); setFullImageDims(null); }} className="btn btn-outline" style={{ position: 'fixed', right: 24, top: 24 }}>Close</button>
                  </div>
              )}
            </div>
          </div>
        )}
        {/* Custom confirm dialog */}
        {confirmDialog.open && (
          <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1400 }}>
            <div style={{ width: 420, maxWidth: '95%', background: '#fff', borderRadius: 10, boxShadow: '0 12px 40px rgba(2,6,23,0.35)', padding: 18, border: '1px solid #e6eef6' }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{confirmDialog.title}</div>
              <div style={{ fontSize: 14, color: '#111827', padding: '12px 0', minHeight: 50 }}>{confirmDialog.message}</div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8 }}>
                <button onClick={() => { if (typeof confirmDialog.onConfirm === 'function') confirmDialog.onConfirm(); }} className="btn btn-primary">Yes</button>
                <button onClick={() => { closeConfirm(); setPendingEditPayload(null); }} className="btn btn-outline">Cancel</button>
              </div>
            </div>
          </div>
        )}
        {/* Create/Edit forms */}
        {/* Create type chooser modal (appears when Add User is clicked) */}
        {createTypeModalOpen && (
          <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(2,6,23,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2200 }}>
            <div style={{ width: 420, maxWidth: '95%', background: 'white', borderRadius: 12, boxShadow: '0 12px 40px rgba(2,6,23,0.35)', padding: 20 }}>
              <h3 style={{ marginTop: 0 }}>Create account</h3>
              <div style={{ color: '#6b7280', marginBottom: 12 }}>Choose the account type to create:</div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
                <button
                  onClick={() => { setUserType('alumni'); setCreateTypeModalOpen(false); setShowCreateForm(true); }}
                  style={{ flex: 1, padding: '12px 14px', borderRadius: 10, border: '1px solid #e6edf3', background: '#fff', cursor: 'pointer', textAlign: 'center', fontWeight: 700, color: '#000' }}
                >
                  Alumni
                </button>
                {!readonlyForProgramHead && (
                  <button
                    onClick={() => { setUserType('program_head'); setCreateTypeModalOpen(false); setShowCreateForm(true); }}
                    style={{ flex: 1, padding: '12px 14px', borderRadius: 10, border: '1px solid #e6edf3', background: '#fff', cursor: 'pointer', textAlign: 'center', fontWeight: 700, color: '#000' }}
                  >
                    Program Head
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button onClick={() => setCreateTypeModalOpen(false)} className="btn btn-outline">Cancel</button>
              </div>
            </div>
          </div>
        )}
        {/* Download filter modal (open when admin clicks Download Alumni) */}
        {downloadModalOpen && (
          <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(2,6,23,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2200 }}>
            <div style={{ width: 520, maxWidth: '95%', background: 'white', borderRadius: 12, boxShadow: '0 12px 40px rgba(2,6,23,0.35)', padding: 20 }}>
              <h3 style={{ marginTop: 0 }}>Download Alumni</h3>
              <div style={{ color: '#6b7280', marginBottom: 12 }}>Select filters to limit the export. Leave blank to download all alumni.</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#6b7280', marginBottom: 6 }}>Year graduated</label>
                  <select value={downloadYear} onChange={(e) => setDownloadYear(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6 }}>
                    <option value="">— All years —</option>
                    {Array.from(new Set((alumniList || []).map(a => a.year_graduated || a.year || a.graduation_year || a.yearGraduated).filter(Boolean))).sort((a,b) => b - a).map(y => (
                      <option key={String(y)} value={String(y)}>{String(y)}</option>
                    ))}
                    {(!alumniList || alumniList.length === 0) && Array.from({ length: 46 }, (_, i) => 2025 - i).map(y => (<option key={y} value={y}>{y}</option>))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#6b7280', marginBottom: 6 }}>Program / Course</label>
                  <select value={downloadCourse} onChange={(e) => setDownloadCourse(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6 }}>
                    <option value="">— All programs —</option>
                    {(typeof programs !== 'undefined' ? programs : []).map(p => (<option key={p} value={p}>{p}</option>))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button className="btn btn-outline" onClick={() => { setDownloadModalOpen(false); setDownloadYear(''); setDownloadCourse(''); }}>Cancel</button>
                <button className="btn btn-primary" onClick={() => downloadFilteredAlumni()} disabled={downloadLoading}>
                  {downloadLoading ? 'Preparing...' : 'Download'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Create form modal (replaces inline form) */}
        {showCreateForm && (
          <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(2,6,23,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2200 }}>
            <div style={{ 
              width: 720, 
              maxWidth: '95%', 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.92))',
              backdropFilter: 'blur(10px)',
              borderRadius: 20, 
              boxShadow: '0 15px 35px rgba(2,6,23,0.2), inset 0 0 0 1px rgba(255,255,255,0.1)',
              padding: '28px 32px',
              border: '1px solid rgba(255,255,255,0.15)',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* Decorative gradient orbs */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                left: '-25%',
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(147,197,253,0.08) 0%, transparent 70%)',
                zIndex: 0,
                borderRadius: '50%'
              }} />
              <div style={{
                position: 'absolute',
                bottom: '-30%',
                right: '-20%',
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)',
                zIndex: 0,
                borderRadius: '50%'
              }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 700, 
                  marginBottom: 4,
                  background: 'linear-gradient(90deg, #1e40af, #3b82f6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block'
                }}>
                  Create New {userType === 'alumni' ? 'Alumni' : userType === 'program_head' ? 'Program Head' : 'User'}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: 24 }}>
                  {userType === 'program_head' ? 'Enter the details for the new program head account.' : 'Fill in the required information below.'}
                </div>
              </div>

              {/* Build create payload from fields and pass as extra payload to handleCreateUser */}
              {userType === 'program_head' ? (
                <CreateProgramHeadForm
                  username={username}
                  setUsername={setUsername}
                  password={password}
                  setPassword={setPassword}
                  createName={createName}
                  setCreateName={setCreateName}
                  createSurname={createSurname}
                  setCreateSurname={setCreateSurname}
                  createMI={createMI}
                  setCreateMI={setCreateMI}
                  createGender={createGender}
                  setCreateGender={setCreateGender}
                  createContact={createContact}
                  setCreateContact={setCreateContact}
                  createEmail={createEmail}
                  setCreateEmail={setCreateEmail}
                  createFaculty={createFaculty}
                  setCreateFaculty={setCreateFaculty}
                  createProgram={createProgram}
                  setCreateProgram={setCreateProgram}
                  createConfirmPassword={createConfirmPassword}
                  setCreateConfirmPassword={setCreateConfirmPassword}
                  showCreatePassword={showCreatePassword}
                  setShowCreatePassword={setShowCreatePassword}
                  showCreateConfirm={showCreateConfirm}
                  setShowCreateConfirm={setShowCreateConfirm}
                  handleCreateUser={handleCreateUser}
                  setShowCreateForm={setShowCreateForm}
                  setError={setError}
                  setUsers={setUsers}
                  facultyPrograms={facultyPrograms}
                />
              ) : userType === 'alumni' ? (
                <CreateAlumniForm
                  username={username}
                  setUsername={setUsername}
                  password={password}
                  setPassword={setPassword}
                  editProgramCourse={editProgramCourse}
                  setEditProgramCourse={setEditProgramCourse}
                  handleCreateUser={handleCreateUser}
                  setShowCreateForm={setShowCreateForm}
                  setUserType={setUserType}
                  setError={setError}
                  programs={programs}
                />
              ) : null}
            </div>
          </div>
        )}
        {editingUser && (
          <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(2,6,23,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
            <div style={{ width: '95%', maxWidth: 920, background: 'white', borderRadius: 12, boxShadow: '0 12px 40px rgba(2,6,23,0.35)', overflow: 'hidden', display: 'flex', gap: 0 }}>
              {/* Left: avatar & quick actions */}
              <div style={{ width: 260, padding: 16, background: 'linear-gradient(180deg,#fbfdff,#f3f7fb)' }}>
                {(editingUser.image || editingUser.avatar_url || (editingUser.username && `/images/${editingUser.username}.png`)) ? (
                  <img
                    src={editingUser.image || editingUser.avatar_url || `/images/${editingUser.username}.png`}
                    alt="avatar"
                    style={{ width: 140, height: 140, borderRadius: '50%', objectFit: 'cover', display: 'block', margin: '0 auto 10px', background: '#eef6ff' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                    onClick={() => setFullImageSrc(editingUser.image || editingUser.avatar_url || `/images/${editingUser.username}.png`)}
                  />
                ) : (
                  <div style={{ width: 140, height: 140, borderRadius: '50%', background: '#eef6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: '#0f172a', margin: '0 auto 10px' }}>{editingUser.full_name ? editingUser.full_name.split(' ').map(n => n[0]).slice(0,2).join('') : (editingUser.username || '').slice(0,2).toUpperCase()}</div>
                )}

                <div style={{ textAlign: 'center', fontWeight: 700, marginBottom: 6, fontSize: 14 }}>{editingUser.full_name || editingUser.username}</div>
                <div style={{ textAlign: 'center', color: '#6b7280', fontSize: 12, marginBottom: 10 }}>{editingUser.email || '-'}</div>

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                  <div style={{ background: '#eef2ff', color: '#4f46e5', padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{(editingUser.user_type || '').toUpperCase()}</div>
                  <div style={{ background: editingUser.status === 'approved' ? '#ecfdf5' : editingUser.status === 'reject' ? '#fff1f2' : '#f8fafc', color: editingUser.status === 'approved' ? '#059669' : editingUser.status === 'reject' ? '#ef4444' : '#374151', padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{capitalize(editingUser.status || 'pending')}</div>
                </div>

                <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button onClick={(e) => {
                    e && e.stopPropagation && e.stopPropagation();
                    openConfirm('Are you sure you want to delete this user?', async () => {
                      try {
                        if (typeof handleDeleteUser === 'function') await handleDeleteUser(editingUser.id, fetchUsers, setError);
                        if (typeof setUsers === 'function') setUsers(prev => (prev || []).filter(u => u && u.id !== editingUser.id));
                        setEditingUser(null);
                      } catch (err) {
                        console.error('Failed to delete user', err);
                        setError && setError('Failed to delete user');
                      } finally {
                        closeConfirm();
                      }
                    }, 'Delete user');
                  }} className="btn btn-danger">Delete</button>
                  <button onClick={() => { setEditingUser(null); setEditEmail(''); setEditFullName(''); setEditProgramCourse(''); setEditStatus('pending'); }} className="btn btn-outline">Close</button>
                </div>
              </div>

              {/* Right: form */}
              <div style={{ flex: 1, padding: 22 }}>
                <h3 style={{ marginTop: 0, marginBottom: 8 }}>Edit user</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  // Do not allow editing user_type from this form
                  const payload = { username };
                  if (typeof editEmail === 'string') payload.email = editEmail;
                  if (typeof editFullName === 'string') payload.full_name = editFullName;
                  if (userType === 'alumni' || editingUser.user_type === 'alumni') {
                    if (typeof editProgramCourse === 'string') payload.program_course = editProgramCourse;
                    if (typeof editStatus === 'string') payload.status = editStatus;
                  }
                  if (userType === 'program_head' || editingUser.user_type === 'program_head') {
                    if (typeof editStatus === 'string') payload.status = editStatus;
                  }

                  // store pending payload and open the custom confirm dialog
                  setPendingEditPayload(payload);
                  openConfirm('Save changes to this user?', async () => {
                    try {
                      // on confirm, call update
                      const usedPayload = pendingEditPayload || payload;
                      // Prefer calling the update endpoint matching the user's type and refresh from server
                      const fetcher = (typeof fetchUsers === 'function') ? (() => fetchUsers(setUsers, setError, setLoading)) : undefined;
                      const utype = (editingUser && (editingUser.user_type || editingUser.type)) || null;
                      await handleUpdateUser(editingUser.id, usedPayload, setEditingUser, fetcher, setError, utype);
                      // refresh local users state so tables update immediately (in case fetcher is not provided)
                      if (typeof setUsers === 'function' && typeof fetcher !== 'function') {
                        setUsers(prev => (prev || []).map(u => u.id === editingUser.id ? { ...u, ...usedPayload } : u));
                      }
                    } finally {
                      setPendingEditPayload(null);
                      closeConfirm();
                    }
                  }, 'Save changes');
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                    <div>
                      <div style={{ color: '#6b7280', fontSize: 12 }}>Username</div>
                      <input value={username} onChange={e => setUsername(e.target.value)} required style={{ padding: 10, width: '100%', borderRadius: 8, border: '1px solid #e6edf3' }} />
                    </div>
                  </div>

                  <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ color: '#6b7280', fontSize: 12 }}>Email</div>
                      <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} style={{ padding: 10, width: '100%', borderRadius: 8, border: '1px solid #e6edf3' }} />
                    </div>
                    <div>
                      <div style={{ color: '#6b7280', fontSize: 12 }}>Full name</div>
                      <input type="text" value={editFullName} onChange={e => setEditFullName(e.target.value)} style={{ padding: 10, width: '100%', borderRadius: 8, border: '1px solid #e6edf3' }} />
                    </div>
                  </div>

                  {(userType === 'alumni' || editingUser.user_type === 'alumni') && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ color: '#6b7280', fontSize: 12 }}>Program / course</div>
                      <input list="programs-list" type="text" value={editProgramCourse} onChange={e => setEditProgramCourse(e.target.value)} placeholder="Start typing to search..." style={{ padding: 10, width: '100%', borderRadius: 8, border: '1px solid #e6edf3' }} />
                      <datalist id="programs-list">
                        {programs.map(p => (<option key={p} value={p} />))}
                      </datalist>
                    </div>
                  )}

                  {(userType === 'alumni' || userType === 'program_head' || editingUser.user_type === 'alumni' || editingUser.user_type === 'program_head') && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ color: '#6b7280', fontSize: 12 }}>Status</div>
            <select value={editStatus} onChange={e => setEditStatus(e.target.value)} style={{ padding: 10, width: '100%', borderRadius: 8, ...statusStyle(editStatus) }}>
              <option value="pending">{`• ${capitalize('pending')}`}</option>
              <option value="approved">{`• ${capitalize('approved')}`}</option>
              <option value="reject">{`• ${capitalize('reject')}`}</option>
            </select>
                    </div>
                  )}

                  <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button type="submit" className="btn btn-primary">Save changes</button>
                    <button type="button" onClick={() => { cancelEdit(setEditingUser, setUsername, setPassword, setUserType); setEditEmail(''); setEditFullName(''); setEditProgramCourse(''); setEditStatus('pending'); }} className="btn btn-outline">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
            {/* full-image overlay while editing */}
            {fullImageSrc && (
              <div onClick={() => setFullImageSrc(null)} style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300 }}>
                <img src={fullImageSrc} alt="full" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '95%', maxHeight: '95%', boxShadow: '0 8px 24px rgba(0,0,0,0.6)', borderRadius: 8 }} />
                <button onClick={() => setFullImageSrc(null)} className="btn btn-outline" style={{ position: 'fixed', right: 24, top: 24 }}>Close</button>
              </div>
            )}
          </div>
        )}
    </div>
  );
}

export default UserManagementPanel;
