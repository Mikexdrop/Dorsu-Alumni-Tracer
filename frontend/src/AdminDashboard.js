
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement } from 'chart.js';
import { useToast } from './Toast';
import PostModal from './components/PostModal';
import {
  fetchUsers,
  handleCreateUser,
  handleUpdateUser,
  handleDeleteUser,
  startEdit,
  cancelEdit
} from './AdminDashboardUtils';
import UserManagementPanel from './UserManagementPanel';
import { AssignProgramsView } from './AssignPrograms';
import AdminNotification from './AdminNotification';
import AddPost from './AddPost';
import AdminPostToolbar from './AdminPostToolbar';
import EvaluationReports from './EvaluationReports';
import MiniPieCard from './MiniPieCard';
import ManageProfileCreateAdmin from './ManageProfile';
import programs from './programs';
import SurveyResultsPanel from './SurveyResultsPanel';


ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement);


function AdminDashboard({ user, onLogout }) {
  // Simple CountUp component using requestAnimationFrame
  const CountUp = ({ end, duration = 1200, format = v => String(v) }) => {
    const [value, setValue] = useState(0);
    const rafRef = useRef(null);
    const startRef = useRef(null);

    useEffect(() => {
      // Respect reduced motion preference
      const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        setValue(end);
        return;
      }

      const start = performance.now();
      startRef.current = start;

      const loop = (ts) => {
        const elapsed = ts - startRef.current;
        const t = Math.min(1, elapsed / duration);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - t, 3);
        const current = Math.round(end * eased);
        setValue(current);
        if (t < 1) rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
      rafRef.current = requestAnimationFrame(loop);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }, [end, duration, format]);

    return <span>{format(value)}</span>;
  };
  useEffect(() => {
    let mounted = true;
    const base = process.env.REACT_APP_API_BASE || '';

    const applyAggregates = (d) => {
      if (!mounted || !d) return;
      try {
        if (typeof d.count === 'number') setSurveyCount(d.count);
        else if (typeof d.total_count === 'number') setSurveyCount(d.total_count);
        if (typeof d.surveys_this_month === 'number') setSurveysThisMonth(d.surveys_this_month);
        setEmploymentSourceCounts(d.sources || {});
        setEmployedWithinCounts(d.employed || {});
        setWorkPerformanceCounts(d.performance || {});
        setProgramCounts(d.programs || {});
        setPromotedCounts(d.promoted || {});
        setJobsRelatedCounts(d.jobs_related || {});
        setSelfEmploymentCounts(d.self_employment || {});
        setJobDifficultiesCounts(d.job_difficulties || {});
      } catch (err) {}
    };

    const fetchAgg = async () => {
      try {
        const res = await fetch(`${base}/api/survey-aggregates/`);
        if (!res.ok) return;
        const d = await res.json().catch(() => null);
        if (d) applyAggregates(d);
      } catch (e) {
        // ignore
      }
    };

    fetchAgg();

    const onAggUpdate = (e) => {
      try {
        const d = e && e.detail ? e.detail : null;
        if (d) applyAggregates(d);
      } catch (err) {}
    };
    window.addEventListener && window.addEventListener('survey-aggregates-updated', onAggUpdate);

    return () => { mounted = false; window.removeEventListener && window.removeEventListener('survey-aggregates-updated', onAggUpdate); };
  }, []);

  // Basic dashboard UI state (ensure defined before effects)
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('admin');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewUserToOpen, setViewUserToOpen] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [badgePulse, setBadgePulse] = useState(false);
  

  // Dashboard counts
  const [alumniCount, setAlumniCount] = useState(0);
  const [surveysThisMonth, setSurveysThisMonth] = useState(0);
  const [activeProgramCount, setActiveProgramCount] = useState(0);

  // small helpers for charts
  const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#ec4899', '#60a5fa', '#34d399', '#f97316'];
  const pickColors = (n) => { const colors = []; for (let i=0;i<n;i++) colors.push(CHART_COLORS[i % CHART_COLORS.length]); return colors; };
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 700, easing: 'easeOutQuart' },
    plugins: {
      legend: { labels: { boxWidth: 12, padding: 12 } },
      tooltip: {
        callbacks: {
          label: function(context) {
            const raw = (context.raw !== undefined) ? context.raw : (context.parsed !== undefined ? context.parsed : 0);
            const ds = context.dataset || context.chart.data.datasets[context.datasetIndex];
            const data = ds && ds.data ? ds.data : [];
            const total = data.reduce((s, v) => s + (v || 0), 0);
            const pct = total ? ` (${((raw / total) * 100).toFixed(1)}%)` : '';
            const label = context.label || ds.label || '';
            return label ? `${label}: ${raw}${pct}` : `${raw}${pct}`;
          }
        }
      }
    }
  };

    // Chart control state (declare before effects that reference them)
    const [chartsAnimated, setChartsAnimated] = useState(false);
    const [rotationIndex, setRotationIndex] = useState(0);

  // auto-rotate charts when playing
  useEffect(() => {
    if (!chartsAnimated) return;
    const id = setInterval(() => {
      setRotationIndex(i => (i + 1) % 8);
    }, 5000);
    return () => clearInterval(id);
  }, [chartsAnimated]);

  // survey aggregates state (mirrors EvaluationReports.js)
  const [employedWithinCounts, setEmployedWithinCounts] = useState({ yes: 0, no: 0 });
  const [employmentSourceCounts, setEmploymentSourceCounts] = useState({});
  const [workPerformanceCounts, setWorkPerformanceCounts] = useState({});
  const [programCounts, setProgramCounts] = useState({});
  const [jobDifficultiesCounts, setJobDifficultiesCounts] = useState({});
  const [jobsRelatedCounts, setJobsRelatedCounts] = useState({});
  const [promotedCounts, setPromotedCounts] = useState({});
  const [selfEmploymentCounts, setSelfEmploymentCounts] = useState({});
  const [surveyCount, setSurveyCount] = useState(null);

  // Chart control state (already declared above)

  // memoized aggregate key for stable dependency
  const aggregatesDepsKey = useMemo(() => JSON.stringify({ employmentSourceCounts, employedWithinCounts, workPerformanceCounts, jobDifficultiesCounts, jobsRelatedCounts, promotedCounts, selfEmploymentCounts, programCounts }), [employmentSourceCounts, employedWithinCounts, workPerformanceCounts, jobDifficultiesCounts, jobsRelatedCounts, promotedCounts, selfEmploymentCounts, programCounts]);

  // reset carousel when aggregates change
  useEffect(() => {
    setRotationIndex(0);
  }, [aggregatesDepsKey]);
  // top-level loading for shared refresh actions (not rendered directly in this component)

  // Shared top-level refresh that other panels can call or listen for
  const handleRefreshAll = async () => {
    try {
      // indicate refresh started (not used in UI)
      // reuse existing fetchUsers helper to refresh global users
      await fetchUsers(setUsers, setError, setLoading);
      // broadcast an event so child panels can react (e.g., refresh paged alumni)
      try { window && window.dispatchEvent && window.dispatchEvent(new CustomEvent('admin-refresh-all')); } catch (_) {}
    } catch (e) {
      console.error('AdminDashboard: handleRefreshAll failed', e);
      setError && setError('Failed to refresh admin data');
    } finally {
      // refresh finished
    }
  };
  // Manage Profile local form state
  const [profileFullName, setProfileFullName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  // Avatar state (client-side preview & storage)
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  // Add post toolbar state
  const [postSearch, setPostSearch] = useState('');
  const postSearchRef = useRef(postSearch);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [showAddPostModal, setShowAddPostModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  // Number of posts authored by the current admin
  const adminPostCount = (myPosts || []).length;
  const [myPostsLoading, setMyPostsLoading] = useState(false);
  const [searchResultPost, setSearchResultPost] = useState(null);
  // Post viewer state (uses existing PostModal component)
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostViewer, setShowPostViewer] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const sidebarWidth = 250;
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const isMobile = windowWidth <= 800;
  const headerHeight = isMobile ? 56 : 64; // px

  // Confirmation modal state for destructive admin actions
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('Delete this item? This action cannot be undone.');
  const pendingDeleteActionRef = useRef(null);
  // Show a confirmation overlay when admin clicks Logout (don't logout immediately)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  // Use global toast provider
  const { show } = useToast();
  const showToast = useCallback((type, message, timeout = 3200) => {
    try {
      // global show accepts message, opts
      show(message || '', { type: type || 'info', duration: timeout });
    } catch (_) {}
  }, [show]);

  // Safe logout helper: clears auth data and calls parent handler or redirects to landing
  const safeLogout = () => {
    try {
      // clear common keys
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userType');
      // optional program head notifications storage
      try { localStorage.removeItem('programHeadNotifications'); } catch(_) {}
    } catch (err) {
      // ignore storage errors
    }
    if (typeof onLogout === 'function') {
      try { onLogout(); return; } catch (e) { /* ignore */ }
    }
    // fallback: redirect to root/login
    try { window.location.href = '/'; } catch (e) { /* ignore */ }
  };

  const openDeleteConfirm = (id, action, message) => {
    setPendingDeleteId(id);
    pendingDeleteActionRef.current = action || null;
    setConfirmMessage(message || 'Delete this item? This action cannot be undone.');
    setConfirmOpen(true);
  };

  const cancelDelete = () => {
    setPendingDeleteId(null);
    pendingDeleteActionRef.current = null;
    setConfirmOpen(false);
  };

  const confirmDelete = async () => {
    const id = pendingDeleteId;
    const action = pendingDeleteActionRef.current;
    setPendingDeleteId(null);
    pendingDeleteActionRef.current = null;
    setConfirmOpen(false);
    if (action) {
      try { await action(id); } catch (e) { console.warn('confirmDelete action failed', e); }
    }
  };

  useEffect(() => {
    // populate Manage Profile form when opened or when user changes
    if (activeSection === 'manage_profile') {
      try {
        const cu = user || (typeof window !== 'undefined' && localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')) : null) || {};
        setProfileFullName(cu.full_name || cu.fullName || cu.name || '');
        setProfileEmail(cu.email || '');
  setProfilePassword('');
        // load client-side avatar if available (fallback to any cu.image)
        try {
          const localKey = cu && cu.id ? `adminAvatar_${cu.id}` : null;
          const cached = localKey ? localStorage.getItem(localKey) : null;
          if (cached) {
            setProfileImagePreview(cached);
            setProfileImageFile(null);
          } else if (cu && (cu.image || cu.avatar)) {
            // if backend supplies an image URL on the currentUser object, use it
            setProfileImagePreview(cu.image || cu.avatar);
            setProfileImageFile(null);
          } else {
            setProfileImagePreview(null);
          }
        } catch (e) {
          // ignore localStorage errors
          setProfileImagePreview(null);
        }
      } catch (e) {
        // ignore parse errors
      }
    }
  }, [activeSection, user]);

  // keep a live ref for postSearch so long-lived effects can read current value without adding it to deps
  useEffect(() => {
    postSearchRef.current = postSearch;
  }, [postSearch]);


  // Fetch dashboard counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Fetch total alumni count
        const alumniRes = await fetch('http://127.0.0.1:8000/api/alumni/');
        if (alumniRes.ok) {
          const alumniData = await alumniRes.json();
          setAlumniCount(alumniData.length || 0);
        }

        // Fetch survey aggregates (server will compute totals and this-month count)
        try {
          const base = '';
          const aggRes = await fetch(`${base}/api/survey-aggregates/`);
          if (aggRes.ok) {
            const agg = await aggRes.json().catch(() => null);
            if (agg) {
              if (typeof agg.total_count === 'number') setSurveyCount(agg.total_count);
              else if (typeof agg.count === 'number') setSurveyCount(agg.count);
              if (typeof agg.surveys_this_month === 'number') setSurveysThisMonth(agg.surveys_this_month);
              // set employment source counts (matches EvaluationReports' `sources` field)
              if (agg.sources && typeof agg.sources === 'object') setEmploymentSourceCounts(agg.sources);
            }
          }
        } catch (e) {
          // fall back silently
        }

        // Fetch recent posts count (last 7 days) - ignored here (display uses recentPosts array)
        const postsRes = await fetch('http://127.0.0.1:8000/api/recent-posts/');
        if (postsRes.ok) {
          // intentionally parse response to consume body; result handled elsewhere
          await postsRes.json().catch(() => null);
        }

        // Active programs: prefer the local `programs.js` list as authoritative for the frontend
        try {
          if (Array.isArray(programs)) {
            setActiveProgramCount(programs.length || 0);
          } else if (programs && typeof programs === 'object') {
            const keys = Object.keys(programs || {});
            setActiveProgramCount(keys.length || 0);
          } else {
            setActiveProgramCount(0);
          }
        } catch (e) {
          setActiveProgramCount(0);
        }
      } catch (error) {
        console.error('Error fetching dashboard counts:', error);
      }
    };

    fetchCounts();

    // Refresh counts every 5 minutes
    const interval = setInterval(fetchCounts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch posts authored by current admin for the sidebar 'My Posts'
  useEffect(() => {
    let mounted = true;
    const base = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';
    const loadMyPosts = async () => {
      setMyPostsLoading(true);
      try {
        const cuRaw = localStorage.getItem('currentUser');
        const token = localStorage.getItem('token');
        const cu = cuRaw ? JSON.parse(cuRaw) : null;
        if (!cu || !cu.id) {
          if (mounted) setMyPosts([]);
          return;
        }
        // Try common query param 'author_id' first, fallback to 'author'
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        let res = await fetch(`${base}/api/posts/?author_id=${cu.id}`, { headers });
        if (!res.ok) {
          res = await fetch(`${base}/api/posts/?author=${cu.id}`, { headers });
        }
        if (!res.ok) throw new Error('Failed to load my posts');
        const data = await res.json().catch(() => null);
        const list = Array.isArray(data) ? data : (Array.isArray(data.results) ? data.results : []);
        if (mounted) setMyPosts(list);
      } catch (e) {
        console.warn('AdminDashboard: failed to fetch my posts', e);
        if (mounted) setMyPosts([]);
      } finally {
        if (mounted) setMyPostsLoading(false);
      }
    };

    loadMyPosts();

    const onRefresh = () => loadMyPosts();
    window.addEventListener && window.addEventListener('admin-refresh-posts', onRefresh);
    return () => {
      mounted = false;
      window.removeEventListener && window.removeEventListener('admin-refresh-posts', onRefresh);
    };
  }, []);


  useEffect(() => {
    let mounted = true;
    // Minimum welcome animation duration (ms)
    const MIN_WELCOME_MS = 3000;

    // Start fetch and the minimum-delay timer in parallel and wait for both
    const minDelay = new Promise(res => setTimeout(res, MIN_WELCOME_MS));
    const fetchPromise = fetchUsers(setUsers, setError, setLoading).catch(err => {
      // Let the caller handle setError; we still want the welcome to finish
      console.error('AdminDashboard: fetchUsers failed during initial load', err);
    });

    Promise.all([fetchPromise, minDelay]).then(() => {
      if (mounted) setInitialLoading(false);
    }).catch(() => {
      if (mounted) setInitialLoading(false);
    });

    return () => { mounted = false; };
  // Removed fetchAlumniUsers and fetchProgramHeadUsers calls since setAlumniUsers and setProgramHeadUsers are no longer defined
  }, []);

  // initialize notificationsCount from localStorage (if available)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem('programHeadNotifications');
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) {
            setNotificationsCount(arr.length);
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // handler passed to AdminNotification so it can report count changes
  const handleNotificationsCountChange = (count) => {
    try {
      setNotificationsCount(count || 0);
    } catch (e) {
      console.error('Failed to update notifications count', e);
    }
  };

  // When the bell is clicked, mark all notifications as read and clear the badge,
  // When the bell is clicked, just open the Notifications section without
  // marking all as read. Read-state should be changed per-item (e.g. when
  // the admin clicks View) so unread counts remain until individually handled.
  const handleOpenNotifications = () => {
    setActiveSection('notification');
  };

  // Search handler used by the Add Post panel: searches titles in `myPosts` first
  const handleSearchTrigger = (q) => {
    const query = (typeof q === 'string' ? q : postSearch || '').trim();
    if (!query) {
      // clear selection and trigger refresh
      setSelectedPostId(null);
      setSelectedPost(null);
      setSearchResultPost(null);
      window.dispatchEvent && window.dispatchEvent(new CustomEvent('admin-refresh-posts'));
      return;
    }
    const lc = query.toLowerCase();
    const found = (myPosts || []).find(p => p && p.title && p.title.toLowerCase().includes(lc));
    if (found) {
      setSelectedPostId(found.id);
      setSelectedPost(found);
      setSearchResultPost(found);
      return;
    }
    // fallback: try recentPosts if any (kept for robustness)
    const found2 = (recentPosts || []).find(p => p && p.title && p.title.toLowerCase().includes(lc));
    if (found2) {
      setSelectedPostId(found2.id);
      setSelectedPost(found2);
      setSearchResultPost(found2);
      return;
    }
    setSearchResultPost(null);
    try { window.alert(`No posts found matching "${query}"`); } catch (_) {}
  };

  // Fetch recent posts for the Add Post admin view
  useEffect(() => {
    // use a ref to avoid setting state after unmount
    let mounted = true;
    const base = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';

    // expose a loader we can call from handlers (immediate search)
    const loadRecentPosts = async (q) => {
  // indicate network activity via other state if needed
      try {
        const url = q ? `${base}/api/posts/?q=${encodeURIComponent(q)}` : `${base}/api/recent-posts/`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed');
        const list = await res.json();
        if (!mounted) return;
        // handle paginated or plain list responses
        const arr = Array.isArray(list) ? list : (Array.isArray(list.results) ? list.results : []);
        setRecentPosts(arr);
      } catch (e) {
        console.warn('AdminDashboard: failed to load recent posts', e);
        if (mounted) setRecentPosts([]);
      } finally {
        // no-op: removed recentPostsLoading to avoid unused var
      }
    };

    // initial load
    loadRecentPosts();

  // refresh should reload default recent posts (avoid closing over postSearch)
    const onRefresh = () => loadRecentPosts();
    const onSearch = (ev) => {
      try {
        const q = ev && ev.detail && ev.detail.q;
        if (typeof q === 'string') setPostSearch(q);
      } catch (_) {}
    };

    window.addEventListener && window.addEventListener('admin-refresh-posts', onRefresh);
    window.addEventListener && window.addEventListener('admin-search-posts', onSearch);

    // handle admin-edit-post and admin-delete-post events
    const onEdit = async (ev) => {
      try {
        const postId = ev && ev.detail && ev.detail.postId;
        if (!postId) return;
        const base = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';
        const res = await fetch(`${base}/api/posts/${postId}/`);
        if (!res.ok) return;
        const post = await res.json();
        setEditingPost(post);
        setShowAddPostModal(true);
      } catch (e) {
        console.warn('admin-edit-post handler failed', e);
      }
    };

    const onDelete = async (ev) => {
      try {
        const postId = ev && ev.detail && ev.detail.postId;
        if (!postId) return;
        // open modal and run deletion only if confirmed
        openDeleteConfirm(postId, async (id) => {
          try {
            const base = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await fetch(`${base}/api/posts/${id}/`, { method: 'DELETE', headers });
            if (res && (res.ok || res.status === 204)) {
              // refresh lists
              window.dispatchEvent(new CustomEvent('admin-refresh-posts'));
              setSelectedPostId(null);
              setSelectedPost(null);
            } else {
              try { showToast('error','Failed to delete post'); } catch(_){ }
            }
          } catch (e2) {
            console.warn('admin-delete-post failed', e2);
            try { showToast('error','Error deleting post'); } catch(_){ }
          }
        }, 'Delete this post? This action cannot be undone.');
      } catch (e) {
        console.warn('admin-delete-post failed', e);
      }
    };

  window.addEventListener && window.addEventListener('admin-edit-post', onEdit);
  window.addEventListener && window.addEventListener('admin-delete-post', onDelete);

    // listen for admin-view-post events (fetch post by id to avoid stale closures)
    const onView = async (ev) => {
      try {
        const postId = ev && ev.detail && ev.detail.postId;
        if (!postId) return;
        const base = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';
        try {
          const res = await fetch(`${base}/api/posts/${postId}/`);
          if (!res.ok) return;
          const found = await res.json();
          setSelectedPost(found);
          setLightboxIndex(0);
          setShowPostViewer(true);
        } catch (err) {
          console.warn('admin-view-post fetch failed', err);
        }
      } catch (e) {
        console.warn('admin-view-post handler failed', e);
      }
    };
    window.addEventListener && window.addEventListener('admin-view-post', onView);

    // allow other UI to trigger an immediate search (avoid waiting for debounce)
    const onSearchImmediate = (ev) => {
      try {
        const q = ev && ev.detail && ev.detail.q;
        loadRecentPosts(typeof q === 'string' ? q : postSearchRef.current);
      } catch (_) {}
    };
    window.addEventListener && window.addEventListener('admin-search-posts-immediate', onSearchImmediate);

    return () => {
      mounted = false;
      window.removeEventListener && window.removeEventListener('admin-refresh-posts', onRefresh);
      window.removeEventListener && window.removeEventListener('admin-search-posts', onSearch);
      window.removeEventListener && window.removeEventListener('admin-search-posts-immediate', onSearchImmediate);
      window.removeEventListener && window.removeEventListener('admin-view-post', onView);
      window.removeEventListener && window.removeEventListener('admin-edit-post', onEdit);
      window.removeEventListener && window.removeEventListener('admin-delete-post', onDelete);
    };
  }, [showToast]);

  // keep resize listener in its own effect
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Debounce server-side search for posts
  useEffect(() => {
    let mounted = true;
    const base = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';
    if (!mounted) return;
    const id = setTimeout(async () => {
      try {
        if (!postSearch) {
          // if empty, load default recent posts
          const res = await fetch(`${base}/api/recent-posts/`);
          if (!res.ok) throw new Error('Failed');
          const list = await res.json();
          setRecentPosts(Array.isArray(list) ? list : []);
          return;
        }
        const res = await fetch(`${base}/api/posts/?q=${encodeURIComponent(postSearch)}`);
        if (!res.ok) {
          setRecentPosts([]);
          return;
        }
        const data = await res.json();
        const arr = Array.isArray(data) ? data : (Array.isArray(data.results) ? data.results : []);
        setRecentPosts(arr);
      } catch (e) {
        console.warn('Search posts failed', e);
        setRecentPosts([]);
      }
    }, 420);

    return () => clearTimeout(id);
  }, [postSearch]);

  // pulse the badge briefly when the notifications count increases (not on initial load)
  const prevNotificationsRef = useRef(notificationsCount);
  const hasMountedRef = useRef(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      // skip animation on first mount; initialize previous count
      hasMountedRef.current = true;
      prevNotificationsRef.current = notificationsCount;
      return;
    }

    if (notificationsCount > prevNotificationsRef.current) {
      setBadgePulse(true);
      const t = setTimeout(() => setBadgePulse(false), 800);
      return () => clearTimeout(t);
    }
    prevNotificationsRef.current = notificationsCount;
  }, [notificationsCount]);

  // Listen for CreateProgramHeadFormCancel events dispatched by the form so
  // AdminDashboard can close the create modal even if it doesn't receive the
  // setter directly (robust for multiple parent renderers).
  useEffect(() => {
    const onCancel = () => {
      try {
        try { console.debug && console.debug('AdminDashboard: CreateProgramHeadFormCancel received'); } catch (_) {}
        setShowCreateForm(false);
      } catch (_) {}
    };

    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('CreateProgramHeadFormCancel', onCancel);
    }

    return () => {
      if (typeof window !== 'undefined' && window.removeEventListener) {
        window.removeEventListener('CreateProgramHeadFormCancel', onCancel);
      }
    };
  }, [setShowCreateForm]);



  const Sidebar = () => (
    <div
      className={`admin-sidebar${sidebarOpen ? ' open' : ''}`}
      style={{
        width: sidebarWidth,
        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        color: 'white',
        padding: '20px 0',
        transition: 'transform 0.3s',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 200,
        height: '100vh',
        transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
        boxShadow: isMobile ? (sidebarOpen ? '0 2px 16px #0006' : 'none') : 'none',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <img src="/image.png" alt="Admin logo" style={{ width: 120, maxWidth: '60%', height: 'auto', display: 'inline-block', borderRadius: 8 }} />
      </div>
      <nav>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: 10 }}>
              <button
              onClick={() => setActiveSection('dashboard')}
              style={{
                width: '100%',
                padding: '15px 20px',
                background: activeSection === 'dashboard' ? '#4CAF50' : 'transparent',
                border: 'none',
                color: 'white',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              <span aria-hidden style={{ marginRight: 10, display: 'inline-flex', verticalAlign: 'middle' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <rect x="3" y="3" width="5" height="18" rx="1" fill="currentColor" />
                  <rect x="10" y="8" width="5" height="13" rx="1" fill="currentColor" />
                  <rect x="17" y="13" width="4" height="8" rx="1" fill="currentColor" />
                </svg>
              </span>
              Dashboard
            </button>
          </li>
          <li style={{ marginBottom: 10 }}>
            <button
              onClick={() => setActiveSection('user_management')}
              style={{
                width: '100%',
                padding: '15px 20px',
                background: activeSection === 'user_management' ? '#4CAF50' : 'transparent',
                border: 'none',
                color: 'white',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              <span aria-hidden style={{ marginRight: 10, display: 'inline-flex', verticalAlign: 'middle' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M12 12a5 5 0 100-10 5 5 0 000 10z" fill="currentColor" />
                  <path d="M3 21a9 9 0 0118 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </span>
              User Management
            </button>
          </li>
          <li style={{ marginBottom: 10 }}>
            <button
              onClick={() => setActiveSection('manage_profile')}
              style={{
                width: '100%',
                padding: '15px 20px',
                background: activeSection === 'manage_profile' ? '#4CAF50' : 'transparent',
                border: 'none',
                color: 'white',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}
            >
              <span aria-hidden style={{ marginRight: 10, display: 'inline-flex', verticalAlign: 'middle' }}>
                {/* user/profile icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" fill="currentColor" />
                  <path d="M4 20a8 8 0 0116 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </span>
              Manage Profile
            </button>
          </li>
          <li style={{ marginBottom: 10 }}>
            <button
              onClick={() => setActiveSection('notification')}
              style={{
                width: '100%',
                padding: '15px 20px',
                background: activeSection === 'notification' ? '#4CAF50' : 'transparent',
                border: 'none',
                color: 'white',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '16px'
              }}

            >
              <span aria-hidden style={{ marginRight: 10, display: 'inline-flex', verticalAlign: 'middle' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M15 17H9a3 3 0 006 0z" fill="currentColor" />
                  <path d="M18 8a6 6 0 10-12 0v4l-2 2v1h18v-1l-2-2V8z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </span>
              Notification
            </button>
          </li>
          <li style={{ marginBottom: 10 }}>
            <button
              onClick={() => setActiveSection('addpost')}
              style={{
                width: '100%',
                padding: '15px 20px',
                background: activeSection === 'addpost' ? '#4CAF50' : 'transparent',
                border: 'none',
                color: 'white',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              <span aria-hidden style={{ marginRight: 10, display: 'inline-flex', verticalAlign: 'middle' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M3 8l9 6 9-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
                </svg>
              </span>
              Add Post
            </button>
          </li>
          <li style={{ marginBottom: 10 }}>
            <button
              onClick={() => setActiveSection('survey')}
              style={{
                width: '100%',
                padding: '15px 20px',
                background: activeSection === 'survey' ? '#4CAF50' : 'transparent',
                border: 'none',
                color: 'white',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              <span aria-hidden style={{ marginRight: 10, display: 'inline-flex', verticalAlign: 'middle' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <circle cx="12" cy="8" r="3" fill="currentColor" />
                  <path d="M3 21c3-4 6-6 9-6s6 2 9 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </span>
              Survey Results
            </button>
          </li>
          {/* Program Assignment removed from sidebar per request */}
          <li style={{ marginBottom: 10 }}>
            <button
              onClick={() => setActiveSection('export')}
              style={{
                width: '100%',
                padding: '15px 20px',
                background: activeSection === 'export' ? '#4CAF50' : 'transparent',
                border: 'none',
                color: 'white',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              <span aria-hidden style={{ marginRight: 10, display: 'inline-flex', verticalAlign: 'middle' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <rect x="6" y="3" width="12" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
                  <path d="M6 15v6h12v-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <rect x="9" y="10" width="6" height="5" rx="1" fill="currentColor" />
                </svg>
              </span>
              Evaluation Reports
            </button>
          </li>
        </ul>
      </nav>
      {/* My Posts removed from sidebar — rendered inside Add Post panel instead */}
    </div>
  );

  // Chart animation state: triggers when dashboard is active (declared earlier)

  // Trigger chart animations when dashboard becomes active
  useEffect(() => {
    if (activeSection === 'dashboard') {
      // small delay so entrance animations finish first
      const t = setTimeout(() => setChartsAnimated(true), 420);
      return () => clearTimeout(t);
    } else {
      setChartsAnimated(false);
    }
  }, [activeSection]);

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div>
            <h2 style={{ marginTop: 0 }}> </h2>
  
            {/* Top stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 18 }} className="enter-rows">
              <div className="card-anim" style={{ background: 'linear-gradient(135deg,#6366f1 0%,#06b6d4 100%)', color: 'white', padding: 18, borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                    <path d="M12 12a5 5 0 100-10 5 5 0 000 10z" fill="currentColor" />
                    <path d="M3 21a9 9 0 0118 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>TOTAL ALUMNI</div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}><CountUp end={alumniCount} format={(v)=>v.toLocaleString()} duration={1400} /></div>
              </div>

              <div className="card-anim" style={{ background: 'linear-gradient(135deg,#06b6d4 0%,#10b981 100%)', color: 'white', padding: 18, borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
                    <path d="M9 5a2 2 0 114 0v2H9V5z" stroke="currentColor" strokeWidth="1.6" fill="none"/>
                    <path d="M8 12h8M8 16h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>SURVEY RESPONSES</div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}><CountUp end={surveyCount} format={(v)=>v.toLocaleString()} duration={1200} /></div>
                <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>Surveys this month <strong style={{ display: 'block' }}>{surveysThisMonth || '0'}</strong></div>
              </div>

              <div className="card-anim" style={{ background: 'linear-gradient(135deg,#fb7185 0%,#f97316 100%)', color: 'white', padding: 18, borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                    <path d="M21 15a2 2 0 01-2 2h-1v3l-4-3H7a2 2 0 01-2-2V7a2 2 0 012-2h11a2 2 0 012 2v8z" stroke="currentColor" strokeWidth="1.6" fill="none"/>
                    <path d="M8 10h8M8 13h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                  <div style={{ fontSize: 12, opacity: 0.95 }}>RECENT POSTS/TRACKS</div>
                </div>
                  <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }} aria-live="polite" aria-atomic="true">
                    {/* show spinner when posts are loading */}
                    {myPostsLoading ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <svg width="20" height="20" viewBox="0 0 50 50" style={{ marginRight: 8 }} aria-hidden>
                          <circle cx="25" cy="25" r="20" stroke="rgba(255,255,255,0.6)" strokeWidth="4" fill="none"/>
                          <path d="M45 25a20 20 0 00-20-20" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none">
                            <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
                          </path>
                        </svg>
                        <span style={{ opacity: 0.95 }}>Loading…</span>
                      </span>
                    ) : (
                      <CountUp end={adminPostCount} format={(v)=>v.toLocaleString()} duration={900} />
                    )}
                  </div>

                <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
                  POSTS AUTHORED
                  <strong style={{ display: 'block' }}>
                    {adminPostCount > 0 ? `${adminPostCount} ${adminPostCount === 1 ? 'post' : 'posts'}` : '0 — none yet'}
                  </strong>
                  
                </div>
              </div>

              <div className="card-anim" style={{ background: 'linear-gradient(135deg,#34d399 0%,#60a5fa 100%)', color: 'white', padding: 18, borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                    <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    <circle cx="8" cy="7" r="1" fill="currentColor"/>
                    <circle cx="16" cy="12" r="1" fill="currentColor"/>
                    <circle cx="10" cy="17" r="1" fill="currentColor"/>
                  </svg>
                                    <div style={{ fontSize: 12, opacity: 0.9 }}>ACTIVE PROGRAMS</div>

                  {/* label removed per design request */}
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}><CountUp end={activeProgramCount} format={(v)=>v.toLocaleString()} duration={900} /></div>
                {/* small caption removed per design request */}
              </div>
            </div>

            {/* Charts area: left large line chart, right vertical bar chart */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginTop: 18, alignItems: 'start' }} className="enter-charts">
              <div className="card-anim" style={{ background: '#0b1220', color: 'white', padding: 18, borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>EVALUATION REPORTS OVERVIEW</div>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>Rotating summary of survey aggregates</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      title={chartsAnimated ? 'Pause carousel' : 'Play carousel'}
                      onClick={() => setChartsAnimated(a => !a)}
                      style={{ width: 44, height: 44, borderRadius: 22, background: '#0ea5a4', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none' }}
                    >
                      {chartsAnimated ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                          <rect x="6" y="5" width="4" height="14" fill="#fff" rx="1" />
                          <rect x="14" y="5" width="4" height="14" fill="#fff" rx="1" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                          <path d="M5 3v18l15-9L5 3z" fill="#fff" />
                        </svg>
                      )}
                    </button>
                    <button
                      title="Next chart"
                      onClick={() => { setRotationIndex(i => (i + 1) % 8); setChartsAnimated(true); }}
                      style={{ width: 44, height: 44, borderRadius: 22, background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <path d="M8 5l8 7-8 7V5z" fill="#fff" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 12, height: 300 }} className="chart-area">
                  {/* Rotating charts using the same datasets as EvaluationReports */}
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    {(() => {
                      // prepare datasets
                      const employedData = {
                        labels: ['Yes', 'No'],
                        datasets: [{ label: 'Employed within 6 months', data: [ (employedWithinCounts && employedWithinCounts.yes) || 0, (employedWithinCounts && employedWithinCounts.no) || 0 ], backgroundColor: pickColors(2), borderRadius: 6 }]
                      };

                      const perfLabels = Object.keys(workPerformanceCounts || {}).sort((a,b)=> (workPerformanceCounts[b]||0) - (workPerformanceCounts[a]||0));
                      const perfData = { labels: perfLabels, datasets: [{ data: perfLabels.map(l => workPerformanceCounts[l] || 0), backgroundColor: pickColors(perfLabels.length) }] };

                      const jobDifficultyLabels = Object.keys(jobDifficultiesCounts || {}).sort((a,b)=> (jobDifficultiesCounts[b]||0)-(jobDifficultiesCounts[a]||0));
                      const jobDifficultyData = { labels: jobDifficultyLabels, datasets: [{ data: jobDifficultyLabels.map(l => jobDifficultiesCounts[l] || 0), backgroundColor: pickColors(jobDifficultyLabels.length), borderRadius: 6 }] };

                      const jobsRelatedLabels = Object.keys(jobsRelatedCounts || {}).sort((a,b)=> (jobsRelatedCounts[b]||0)-(jobsRelatedCounts[a]||0));
                      const jobsRelatedData = { labels: jobsRelatedLabels, datasets: [{ data: jobsRelatedLabels.map(l => jobsRelatedCounts[l] || 0), backgroundColor: pickColors(jobsRelatedLabels.length) }] };

                      const sourceLabels = Object.keys(employmentSourceCounts || {}).sort((a,b)=> (employmentSourceCounts[b]||0)-(employmentSourceCounts[a]||0));
                      const sourceData = { labels: sourceLabels, datasets: [{ label: 'Number of Alumni', data: sourceLabels.map(l => employmentSourceCounts[l] || 0), backgroundColor: pickColors(sourceLabels.length), borderRadius: 6 }] };

                      const selfEmpLabels = Object.keys(selfEmploymentCounts || {}).sort((a,b)=> (selfEmploymentCounts[b]||0)-(selfEmploymentCounts[a]||0));
                      const selfEmpData = { labels: selfEmpLabels, datasets: [{ data: selfEmpLabels.map(l => selfEmploymentCounts[l] || 0), backgroundColor: pickColors(selfEmpLabels.length) }] };

                      const promotedLabels = Object.keys(promotedCounts || {}).sort((a,b)=> (promotedCounts[b]||0)-(promotedCounts[a]||0));
                      const promotedData = { labels: promotedLabels, datasets: [{ data: promotedLabels.map(l => promotedCounts[l] || 0), backgroundColor: pickColors(promotedLabels.length) }] };

                      const programLabels = Object.keys(programCounts || {}).sort((a,b)=> (programCounts[b]||0)-(programCounts[a]||0)).slice(0,8);
                      const programData = { labels: programLabels, datasets: [{ label: 'Responses', data: programLabels.map(l => programCounts[l] || 0), backgroundColor: pickColors(programLabels.length), borderRadius: 6 }] };

                      const charts = [
                        { key: 'employed', label: 'Employed within 6 months', node: <Bar key="employed" data={employedData} options={{ ...commonOptions, indexAxis: 'y', plugins: { ...commonOptions.plugins, legend: { display: false } } }} /> },
                        { key: 'performance', label: 'Work Performance', node: <Pie key="performance" data={perfData} options={{ ...commonOptions, plugins: { ...commonOptions.plugins, legend: { position: 'bottom', labels: { padding: 12 } } } }} /> },
                        { key: 'job_difficulties', label: 'Job Difficulties', node: <Bar key="job_difficulties" data={jobDifficultyData} options={{ ...commonOptions, indexAxis: 'y', plugins: { ...commonOptions.plugins, legend: { display: false } } }} /> },
                        { key: 'jobs_related', label: 'Jobs Related to Experience', node: <Pie key="jobs_related" data={jobsRelatedData} options={{ ...commonOptions, plugins: { ...commonOptions.plugins, legend: { position: 'bottom' } } }} /> },
                        { key: 'source', label: 'Source of First Employment', node: <Bar key="source" data={sourceData} options={{ ...commonOptions, indexAxis: 'y', plugins: { ...commonOptions.plugins, legend: { display: false } }, scales: { x: { beginAtZero: true } } }} /> },
                        { key: 'self_emp', label: 'Self-Employment', node: <Pie key="self_emp" data={selfEmpData} options={{ ...commonOptions, plugins: { ...commonOptions.plugins, legend: { position: 'bottom' } } }} /> },
                        { key: 'promoted', label: 'Promoted in Current Job', node: <Pie key="promoted" data={promotedData} options={{ ...commonOptions, plugins: { ...commonOptions.plugins, legend: { position: 'bottom' } } }} /> },
                        { key: 'programs', label: 'Top Programs', node: <Bar key="programs" data={programData} options={{ ...commonOptions, indexAxis: 'y', plugins: { ...commonOptions.plugins, legend: { display: false } }, scales: { x: { beginAtZero: true } } }} /> }
                      ];

                      const cur = charts[rotationIndex % charts.length] || charts[0];

                      return (
                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{cur.label}</div>
                            <div style={{ fontSize: 12, opacity: 0.7 }}>Responses: {surveyCount || '—'}</div>
                          </div>
                          <div style={{ flex: 1 }}>
                            {cur.node}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="card-anim panel-right" style={{ background: 'white', padding: 12, borderRadius: 10, boxShadow: '0 8px 24px rgba(2,6,23,0.06)', minHeight: 200 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Source of First Employment</div>

                <MiniPieCard sourceMap={employmentSourceCounts} animated={chartsAnimated} />
              </div>
            </div>
          </div>
        );
      case 'user_management':
        return (
          <UserManagementPanel
            users={users}
            setUsers={setUsers}
            error={error}
            setError={setError}
            loading={loading}
            setLoading={setLoading}
            username={username}
            setUsername={setUsername}
            password={password}
            setPassword={setPassword}
            userType={userType}
            setUserType={setUserType}
            showCreateForm={showCreateForm}
            setShowCreateForm={setShowCreateForm}
            editingUser={editingUser}
            setEditingUser={setEditingUser}
            handleCreateUser={handleCreateUser}
            handleUpdateUser={handleUpdateUser}
            handleDeleteUser={handleDeleteUser}
            startEdit={startEdit}
            cancelEdit={cancelEdit}
            fetchUsers={fetchUsers}
            refreshAll={handleRefreshAll}
            viewUserToOpen={viewUserToOpen}
          />
        );
      case 'manage_profile':
        {
          // current user fallback (safe parse)
          let cu = user;
          try {
            if (!cu && typeof window !== 'undefined') cu = JSON.parse(localStorage.getItem('currentUser') || 'null') || null;
          } catch (e) { cu = cu || null; }

          const handleSaveProfile = async (ev) => {
            ev && ev.preventDefault && ev.preventDefault();
            if (!cu || !cu.id) return setError && setError('No current user available');
            const payload = { full_name: profileFullName, email: profileEmail };
            if (profilePassword) payload.password = profilePassword;
            try {
              await handleUpdateUser(cu.id, payload, undefined, () => fetchUsers(setUsers, setError, setLoading), setError, 'admin');
              try { showToast('success','Profile updated'); } catch (_) {}
            } catch (err) {
              console.error('Profile save failed', err);
            }
          };

          // Note: admin creation is now handled by the separate <ManageProfileCreateAdmin /> component
          // which calls the shared `handleCreateUser` helper and dispatches events to update the UI.

          return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 18 }}>
              <div style={{ background: '#fff', padding: 18, borderRadius: 12, boxShadow: '0 8px 20px rgba(2,6,23,0.04)', border: '1px solid #eef3fb' }}>
                <h3 style={{ marginTop: 0, marginBottom: 6 }}>Manage Profile</h3>
                <form onSubmit={handleSaveProfile}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ width: 140, textAlign: 'center' }}>
                      <div className="avatar-frame">
                        {profileImagePreview ? (
                          <img src={profileImagePreview} alt="avatar" className="avatar-img" />
                        ) : (
                          <div className="avatar-initial">{(cu && (cu.full_name || cu.username) ? (cu.full_name || cu.username).charAt(0) : 'A')}</div>
                        )}
                      </div>
                      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                        <input id="admin-avatar-input" type="file" accept="image/*" onChange={async (e) => {
                          try {
                            const f = e.target.files && e.target.files[0];
                            if (!f) return;
                            setProfileImageFile(f);
                            // generate data URL for preview
                            const reader = new FileReader();
                            reader.onload = () => {
                              setProfileImagePreview(reader.result);
                            };
                            reader.readAsDataURL(f);
                          } catch (err) {
                            console.warn('Failed to read avatar file', err);
                          }
                        }} style={{ display: 'none' }} />
                        <label htmlFor="admin-avatar-input" className="btn btn-outline" style={{ padding: '8px 12px', borderRadius: 10, cursor: 'pointer' }}>Choose Image</label>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button type="button" className="btn btn-outline" onClick={async () => {
                            try {
                              if (!cu || !cu.id) { try { showToast('error','No current user to update'); } catch(_){}; return; }
                              // If a file was chosen, upload it; otherwise try to upload a blob from preview (data URL)
                              let fd = null;
                              if (profileImageFile) {
                                fd = new FormData();
                                fd.append('image', profileImageFile);
                              } else if (profileImagePreview && profileImagePreview.startsWith('data:')) {
                                // Convert data URL to blob
                                const res = await fetch(profileImagePreview);
                                const blob = await res.blob();
                                fd = new FormData();
                                // give it a sensible filename
                                fd.append('image', blob, `${cu.username || 'avatar'}.png`);
                              } else {
                                try { showToast('error','No image selected'); } catch(_){ }
                                return;
                              }

                              // call handleUpdateUser which now supports FormData and will set headers accordingly
                              await handleUpdateUser(cu.id, fd, undefined, () => fetchUsers(setUsers, setError, setLoading), setError, 'admin');
                              try { showToast('success','Avatar uploaded'); } catch(_){ }
                              // Refresh the single admin from the server so we pick up the image URL and update localStorage
                              try {
                                const base = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';
                                const token = localStorage.getItem('token');
                                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                                const res = await fetch(`${base}/api/admins/${cu.id}/`, { headers });
                                if (res.ok) {
                                  const updated = await res.json().catch(() => null);
                                  if (updated) {
                                    try {
                                      localStorage.setItem('currentUser', JSON.stringify(updated));
                                      // reflect server image URL in preview
                                      if (updated.image) setProfileImagePreview(updated.image);
                                    } catch (e) { /* ignore storage errors */ }
                                  }
                                }
                              } catch (e) {
                                // ignore refresh errors
                              }
                            } catch (e) {
                              console.error('Upload avatar failed', e);
                              try { showToast('error','Upload failed: ' + (e && e.message)); } catch(_){ }
                            }
                          }} style={{ padding: '8px 12px', height: 36, lineHeight: '20px', fontSize: 13, borderRadius: 10 }}>Upload</button>
                          <button type="button" className="btn btn-danger" onClick={() => {
                            // open confirmation modal and perform removal in the confirmed action
                            if (!cu || !cu.id) { try { showToast('error','No current user to update'); } catch(_){}; return; }
                            openDeleteConfirm(cu.id, async (id) => {
                              try {
                                // using handleUpdateUser with JSON payload to clear image
                                await handleUpdateUser(id, { image: null }, undefined, () => fetchUsers(setUsers, setError, setLoading), setError, 'admin');
                              } catch (err) {
                                console.warn('Server remove avatar failed', err);
                                try { showToast('error','Failed to remove avatar on server'); } catch(_){ }
                                return;
                              }

                              // clear client-side preview and localStorage
                              const localKey = id ? `adminAvatar_${id}` : null;
                              if (localKey) localStorage.removeItem(localKey);
                              setProfileImagePreview(null);
                              setProfileImageFile(null);

                              // refresh currentUser in localStorage from server
                              try {
                                const base = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';
                                const token = localStorage.getItem('token');
                                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                                const res = await fetch(`${base}/api/admins/${id}/`, { headers });
                                if (res.ok) {
                                  const updated = await res.json().catch(() => null);
                                  if (updated) {
                                    try { localStorage.setItem('currentUser', JSON.stringify(updated)); } catch (e) {}
                                  }
                                }
                              } catch (e) { /* ignore refresh errors */ }

                              try { showToast('success','Avatar removed'); } catch(_){ }
                            }, 'Are you sure you want to remove your avatar? This will remove it from your profile.');
                          }} style={{ padding: '8px 12px', height: 36, lineHeight: '20px', fontSize: 13, borderRadius: 10 }}>Remove</button>
                        </div>
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: 10 }}>
                        <label style={{ display: 'block', fontSize: 13, color: '#374151', marginBottom: 6 }}>Username</label>
                        <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #eef3fb', color: '#0f172a', fontWeight: 600 }}>{cu && cu.username ? cu.username : '(unknown)'}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, color: '#374151', marginBottom: 6 }}>Full name</label>
                      <input value={profileFullName} onChange={e=>setProfileFullName(e.target.value)} className="form-input" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, color: '#374151', marginBottom: 6 }}>Email</label>
                      <input value={profileEmail} onChange={e=>setProfileEmail(e.target.value)} className="form-input" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, color: '#374151', marginBottom: 6 }}>Change password</label>
                      <input type="password" value={profilePassword} onChange={e=>setProfilePassword(e.target.value)} placeholder="Leave blank to keep current" className="form-input" />
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
                      <button type="button" onClick={() => {
                        const full = cu ? (cu.full_name || cu.fullName || cu.name || '') : '';
                        const emailVal = cu ? (cu.email || '') : '';
                        setProfileFullName(full);
                        setProfileEmail(emailVal);
                        setProfilePassword('');
                      }} className="btn btn-outline" style={{ padding: '8px 12px', borderRadius: 10 }}>Reset</button>
                      <button type="submit" className="btn btn-primary" style={{ padding: '8px 14px', borderRadius: 10 }}>Save Profile</button>
                    </div>
                  </div>
                </form>
              </div>

              <div style={{ background: '#fff', padding: 16, borderRadius: 10 }}>
                <ManageProfileCreateAdmin fetchUsers={() => fetchUsers(setUsers, setError, setLoading)} onCreated={() => fetchUsers(setUsers, setError, setLoading)} />
              </div>
              
              {/* Defaults box showing current user info (read-only) */}
              <div style={{ background: '#fff', padding: 16, borderRadius: 10 }}>
                <h3 style={{ marginTop: 0 }}>Defaults</h3>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: 13 }}>Username</label>
                  <input value={cu && (cu.username || '')} readOnly style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eefb', background: '#f8fafc' }} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: 13 }}>Full name</label>
                  <input value={cu && (cu.full_name || cu.fullName || '')} readOnly style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eefb', background: '#f8fafc' }} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: 13 }}>Email</label>
                  <input value={cu && (cu.email || '')} readOnly style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6eefb', background: '#f8fafc' }} />
                </div>
              </div>
            </div>
          );
        }
      case 'employment':
        return <AssignProgramsView />;
      case 'addpost':
        return (
          <div>
            {/* Toolbar (extracted to AdminPostToolbar component) */}
            <AdminPostToolbar
              postSearch={postSearch}
              setPostSearch={setPostSearch}
              handleSearchTrigger={handleSearchTrigger}
              setShowAddPostModal={setShowAddPostModal}
              isMobile={isMobile}
              setSelectedPostId={setSelectedPostId}
            />

            {/* My Posts (authored by current admin) */}
            <div style={{ marginTop: 6 }}>
              {/* If a single search result was found, show it prominently */}
              {searchResultPost && (
                <div style={{ marginBottom: 10, background: '#eef2ff', borderRadius: 8, padding: 10, border: '1px solid #c7d2fe' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      {searchResultPost.images && searchResultPost.images.length > 0 ? (
                        <img src={searchResultPost.images[0].image} alt={searchResultPost.title || 'thumb'} style={{ width: 72, height: 56, objectFit: 'cover', borderRadius: 6 }} loading="lazy" />
                      ) : (
                        <div style={{ width: 72, height: 56, borderRadius: 6, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>{(searchResultPost.title || 'P').charAt(0)}</div>
                      )}
                      <div>
                        <div style={{ fontWeight: 800 }}>{searchResultPost.title || '(No title)'}</div>
                        <div style={{ color: '#64748b', fontSize: 12 }}>{searchResultPost.created ? new Date(searchResultPost.created).toLocaleDateString() : ''}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={async () => { setSelectedPostId(searchResultPost.id); setSelectedPost(searchResultPost); setLightboxIndex(0); setShowPostViewer(true); }} className="btn" style={{ padding: '6px 8px', background: '#fff', color: '#111827' }}>View</button>
                      <button onClick={async () => { setSelectedPostId(searchResultPost.id); setEditingPost(searchResultPost); setShowAddPostModal(true); }} className="btn" style={{ padding: '6px 8px', background: '#f3f4f6', color: '#111827' }}>Edit</button>
                      <button onClick={async () => {
                        openDeleteConfirm(searchResultPost.id, async (id) => {
                          setSelectedPostId(null);
                          try {
                            const base = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';
                            const token = localStorage.getItem('token');
                            const headers = token ? { Authorization: `Token ${token}` } : {};
                            const res = await fetch(`${base}/api/posts/${id}/`, { method: 'DELETE', headers });
                            if (res && (res.ok || res.status === 204)) {
                              window.dispatchEvent(new CustomEvent('admin-refresh-posts'));
                              setSearchResultPost(null);
                            } else {
                              try { showToast('error','Failed to delete post'); } catch(_){ }
                            }
                          } catch (e) {
                            console.warn('delete failed', e);
                            try { window.alert('Error deleting post'); } catch(_){ }
                          }
                        }, 'Delete this post?');
                      }} className="btn btn-danger" style={{ padding: '6px 8px' }}>Delete</button>
                    </div>
                  </div>
                </div>
              )}
              <h3 style={{ margin: '6px 0 8px 0' }}>My Posts</h3>
              <div style={{ background: '#fff', borderRadius: 8, padding: 10, boxShadow: '0 6px 18px rgba(2,6,23,0.04)', marginBottom: 12 }}>
                {myPostsLoading ? (
                  <div style={{ padding: 12, color: '#64748b' }}>Loading your posts…</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(!myPosts || myPosts.length === 0) && <div style={{ color: '#475569' }}>You have not posted yet.</div>}
                        {myPosts && myPosts.map(p => (
                          <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: 12, background: selectedPostId === p.id ? '#f8fbff' : '#fff', boxShadow: '0 6px 20px rgba(2,6,23,0.04)', border: '1px solid #eef6fc' }}>
                            <div style={{ display: 'flex', gap: 14, alignItems: 'center', overflow: 'hidden' }}>
                              {/* Thumbnail: use first image if present */}
                              {p.images && p.images.length > 0 ? (
                                <img src={p.images[0].image} alt={p.title || 'thumb'} style={{ width: 84, height: 60, objectFit: 'cover', borderRadius: 8, flex: '0 0 84px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }} loading="lazy" />
                              ) : (
                                <div style={{ width: 84, height: 60, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', flex: '0 0 84px', fontWeight: 700 }}>{(p.title || 'P').charAt(0)}</div>
                              )}
                              <div style={{ overflow: 'hidden', minWidth: 0 }}>
                                <div style={{ fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: 520 }}>{p.title || '(No title)'}</div>
                                <div style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>{p.created ? new Date(p.created).toLocaleDateString() : ''}</div>
                                <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 8, maxWidth: 640, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.excerpt || (p.body && p.body.substring(0, 120)) || ''}</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginLeft: 12, alignItems: 'center' }}>
                              <button onClick={async () => {
                                setSelectedPostId(p.id);
                                // Try to find the post object in existing lists first
                                let found = p;
                                if (!found) {
                                  const base = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';
                                  try {
                                    const token = localStorage.getItem('token');
                                    const headers = token ? { Authorization: `Token ${token}` } : {};
                                    const res = await fetch(`${base}/api/posts/${p.id}/`, { headers });
                                    if (res.ok) found = await res.json();
                                  } catch (_) {}
                                }
                                setSelectedPost(found || p);
                                setLightboxIndex(0);
                                setShowPostViewer(true);
                              }} className="btn btn-outline" style={{ padding: '8px 10px', background: '#fff', color: '#111827', borderRadius: 8 }}>View</button>
                              <button onClick={async () => { setSelectedPostId(p.id); setEditingPost(p); setShowAddPostModal(true); }} className="btn" style={{ padding: '8px 10px', background: '#f3f4f6', color: '#111827', borderRadius: 8 }}>Edit</button>
                              <button onClick={async () => {
                                openDeleteConfirm(p.id, async (id) => {
                                  setSelectedPostId(null);
                                  try {
                                    const base = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';
                                    const token = localStorage.getItem('token');
                                    const headers = token ? { Authorization: `Token ${token}` } : {};
                                    const res = await fetch(`${base}/api/posts/${id}/`, { method: 'DELETE', headers });
                                      if (res && (res.ok || res.status === 204)) {
                                        window.dispatchEvent(new CustomEvent('admin-refresh-posts'));
                                      } else {
                                        try { showToast('error','Failed to delete post'); } catch(_){ }
                                      }
                                  } catch (e) {
                                    console.warn('delete failed', e);
                                    try { showToast('error','Error deleting post'); } catch(_){ }
                                  }
                                }, 'Delete this post?');
                              }} className="btn btn-danger" style={{ padding: '8px 10px', borderRadius: 8 }}>Delete</button>
                            </div>
                          </div>
                        ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Posts removed per request - sidebar simplified */}

            {/* lightweight Add Post modal stub: if AddPost prefers a modal trigger, it can listen for the event or use props */}
            {showAddPostModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2200 }}>
                <div style={{ width: 'min(900px, 96%)', background: '#fff', borderRadius: 8, padding: 12, maxHeight: '70vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ margin: 0 }}>Add Post</h3>
                    <button onClick={() => setShowAddPostModal(false)} className="btn">Close</button>
                  </div>
                  <AddPost
                    initialPost={editingPost}
                    onCreated={(d) => { setShowAddPostModal(false); setEditingPost(null); window.dispatchEvent(new CustomEvent('admin-refresh-posts')); }}
                    onUpdated={(d) => { setShowAddPostModal(false); setEditingPost(null); window.dispatchEvent(new CustomEvent('admin-refresh-posts')); }}
                    onClose={() => { setShowAddPostModal(false); setEditingPost(null); }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      case 'program':
        return (
          <div>
            <h2>Program Assignment</h2>
            <p>Manage program assignments for alumni and program heads.</p>
            <div style={{
              background: '#f3e5f5',
              padding: 20,
              borderRadius: 8,
              marginTop: 20
            }}>
              <h3>Program Management</h3>
              <p>Program assignment features would be implemented here.</p>
            </div>
          </div>
        );
      case 'notification':
        return <AdminNotification onSend={(title, message) => { console.log('Send notification', title, message); }} onViewUser={(ident) => {
          // ident = { username, email }
          try {
            // Switch to the User Management section and tell it which user to open
            setActiveSection('user_management');
            setViewUserToOpen(ident);
          } catch (e) {
            console.error('AdminDashboard: onViewUser failed', e);
          }
        }} onCountChange={handleNotificationsCountChange} />;
      case 'survey':
        return (
          <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
            <SurveyResultsPanel surveyCount={surveyCount} />
          </div>
        );
      case 'export':
        return <EvaluationReports />;
      default:
        return (
          <div>
            <h2>Admin Dashboard</h2>
            <p>Welcome, {user.username}! You have admin privileges.</p>
          </div>
        );
    }
  };

  if (initialLoading) {
    // Clean single-root welcome/loading skeleton to avoid JSX parse errors
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg,#eef7ff, #ffffff)', padding: 24 }}>
        <div style={{ maxWidth: 960, width: '100%', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <div style={{ height: 10, flex: 1, background: '#eef2ff', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '40%', background: 'linear-gradient(90deg,#60a5fa,#10b981)', borderRadius: 999, transition: 'width 900ms ease' }} />
              </div>
              <div style={{ width: 10, height: 10, borderRadius: 999, background: '#60a5fa', animation: 'pulse 1000ms infinite linear' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ background: '#f8fafc', borderRadius: 10, padding: 12, minHeight: 80, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ height: 12, width: '60%', background: '#e6eefb', borderRadius: 6, marginBottom: 8 }} />
                  <div style={{ height: 10, width: '40%', background: '#e6eefb', borderRadius: 6, marginBottom: 6 }} />
                  <div style={{ height: 8, width: '80%', background: '#f1f5f9', borderRadius: 6, marginTop: 6 }} />
                  <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)', backgroundSize: '200px 100%', animation: 'shimmer 1200ms linear infinite' }} />
                </div>
              ))}
            </div>

            <div style={{ marginTop: 18, color: '#94a3b8', fontSize: 13 }}>This screen will transition to the admin panel shortly...</div>
          </div>

          <div style={{ width: 360 }}>
            <div style={{ background: '#ffffff', borderRadius: 12, padding: 16, boxShadow: '0 8px 20px rgba(2,6,23,0.06)' }}>
              <div style={{ height: 12, width: '80%', background: '#e6eefb', borderRadius: 6, marginBottom: 8 }} />
              <div style={{ height: 10, width: '60%', background: '#e6eefb', borderRadius: 6, marginBottom: 6 }} />
              <div style={{ height: 8, width: '90%', background: '#f1f5f9', borderRadius: 6, marginTop: 6 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-root" style={{ display: 'flex', minHeight: '100vh', background: '#f7f7f7', fontFamily: 'Inter, Arial, sans-serif' }}>
      <style>{`
        @media (max-width: 800px) {
          .admin-hamburger {
            display: block !important;
            position: fixed;
            top: 16px;
            left: 16px;
            z-index: 300;
            background: #333;
            color: #ffd600;
            border: none;
            font-size: 32px;
            border-radius: 8px;
            width: 48px;
            height: 48px;
            cursor: pointer;
            box-shadow: 0 2px 8px #0004;
          }
          .admin-sidebar {
            width: 220px !important;
            min-height: 100vh !important;
            padding: 20px 0 !important;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 200;
            background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%) !important;
            transform: translateX(-100%);
            transition: transform 0.3s;
            box-shadow: none;
            display: block !important;
          }
          .admin-sidebar.open {
            transform: translateX(0) !important;
            box-shadow: 0 2px 16px #0006;
          }
        }
        @media (min-width: 801px) {
          .admin-hamburger {
            display: none !important;
          }
        }
        /* Modern theme additions */
        .app-root {
          background: radial-gradient(1200px 400px at 10% 10%, rgba(99,102,241,0.06), transparent 8%), radial-gradient(900px 300px at 90% 90%, rgba(16,185,129,0.04), transparent 8%), linear-gradient(180deg, #f7fbff 0%, #f1f5f9 35%, #ffffff 100%);
          color: #0f172a;
          position: relative;
          overflow: hidden;
        }

        /* floating decorative shapes */
        .app-root::before, .app-root::after {
          content: '';
          position: absolute;
          border-radius: 50%;
          filter: blur(36px);
          opacity: 0.28;
          pointer-events: none;
        }
        .app-root::before { width: 420px; height: 420px; left: -120px; top: -80px; background: linear-gradient(180deg,#6366f1,#06b6d4); transform: rotate(12deg); }
        .app-root::after { width: 320px; height: 320px; right: -80px; bottom: -80px; background: linear-gradient(180deg,#34d399,#60a5fa); }

        /* entrance animations */
        .enter-rows > div, .enter-charts > div { opacity: 0; transform: translateY(12px) scale(0.998); }
        .enter-rows .card-anim, .enter-charts .card-anim { animation: popIn 560ms cubic-bezier(.2,.9,.3,1) forwards; }
        @keyframes popIn { from { opacity: 0; transform: translateY(18px) scale(0.994); } to { opacity: 1; transform: translateY(0) scale(1); } }

        /* stagger children */
        .enter-rows .card-anim:nth-child(1) { animation-delay: 80ms; }
        .enter-rows .card-anim:nth-child(2) { animation-delay: 160ms; }
        .enter-rows .card-anim:nth-child(3) { animation-delay: 240ms; }
        .enter-rows .card-anim:nth-child(4) { animation-delay: 320ms; }
        .enter-charts .card-anim:nth-child(1) { animation-delay: 360ms; }
        .enter-charts .card-anim:nth-child(2) { animation-delay: 440ms; }

        /* chart area subtle reveal */
        .chart-area { opacity: 0; transform: translateY(12px) scale(0.998); animation: fadeUp 720ms 420ms cubic-bezier(.2,.9,.3,1) forwards; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

        /* right panel slight scale */
        .panel-right { opacity: 0; transform: translateY(12px); animation: panelIn 720ms 480ms cubic-bezier(.2,.9,.3,1) forwards; }
        @keyframes panelIn { from { opacity: 0; transform: translateY(18px) scale(.996); } to { opacity: 1; transform: translateY(0) scale(1); } }

        /* subtle background pulse when dashboard is active */
        @keyframes bgPulse { 0% { transform: scale(1); opacity: 0.28 } 50% { transform: scale(1.02); opacity: 0.34 } 100% { transform: scale(1); opacity: 0.28 } }
        .app-root.active-pulse::before { animation: bgPulse 6s ease-in-out infinite; }

        .topbar {
          background: linear-gradient(180deg, #111827 0%, #0f172a 100%);
          backdrop-filter: blur(6px);
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
          border-bottom: 1px solid rgba(0,0,0,0.06);
          color: white;
        }

        .main-content {
          padding: 20px;
          min-height: calc(100vh - 64px);
        }

        .card {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 12px 30px rgba(2,6,23,0.08);
          padding: 20px;
          transition: transform 220ms cubic-bezier(.2,.8,.2,1), box-shadow 220ms ease;
        }
        .card:hover, .card:focus-within {
          transform: translateY(-6px);
          box-shadow: 0 22px 42px rgba(2,6,23,0.12);
        }

        .admin-sidebar {
          background: linear-gradient(180deg, #111827 0%, #0f172a 100%);
          box-shadow: 2px 0 18px rgba(2,6,23,0.08);
        }
        /* Button styles and animations (aligned with UserManagementPanel) */
        .btn {
          display: inline-block;
          padding: 8px 14px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: transform 180ms cubic-bezier(.2,.8,.2,1), box-shadow 180ms ease, background-color 160ms ease, color 120ms ease;
          background: transparent;
          color: #0f172a;
        }
        .btn:focus { outline: 3px solid rgba(59,130,246,0.18); outline-offset: 2px; }
        .btn:hover { transform: translateY(-3px); }
        /* Primary (green) - used for Add / Save / Edit */
  .btn-primary { background: #10b981; color: white; box-shadow: 0 8px 20px rgba(16,185,129,0.12); border: none; }
  .btn-primary:hover { filter: brightness(0.88); transform: translateY(-2px); }
        /* Danger (red) - destructive actions */
        .btn-danger { background: #ef4444; color: white; box-shadow: 0 8px 20px rgba(239,68,68,0.12); border: none; }
        .btn-danger:hover { filter: brightness(0.96); }
        /* Outline style used throughout UserManagementPanel for secondary actions */
        .btn-outline {
          background: #ffffff;
          border: 1px solid #e6edf3;
          color: #0f172a;
          box-shadow: none;
        }
        .btn-outline:hover { background: #f8fafc; transform: translateY(-2px); }
        /* badge pulse animation when new notifications arrive */
        @keyframes badge-pulse { 0% { transform: scale(1); box-shadow: 0 0 0 rgba(239,68,68,0.4); } 50% { transform: scale(1.18); box-shadow: 0 6px 18px rgba(239,68,68,0.22); } 100% { transform: scale(1); box-shadow: 0 0 0 rgba(239,68,68,0); } }
        .badge-pulse { animation: badge-pulse 720ms ease-in-out; }
        /* floating animation used by Academics background elements */
        @keyframes float { 0% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-20px) rotate(5deg); } 100% { transform: translateY(0) rotate(0deg); } }

  /* Manage Profile custom styles */
  .avatar-frame { width: 100px; height: 100px; margin: 0 auto; border-radius: 999px; overflow: hidden; background: linear-gradient(180deg,#f8fafc,#eef2ff); display:flex; align-items:center; justify-content:center; border: 1px solid #e6eefb; }
  .avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .avatar-initial { font-size: 36px; color: #64748b; font-weight: 700; }
  .form-input { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #eef3fb; background: #fff; box-shadow: inset 0 1px 0 rgba(255,255,255,0.6); }
      `}</style>
      {/* Decorative overlay copied from Academics.js for visual consistency */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: `
        radial-gradient(circle at 10% 20%, rgba(37, 85, 124, 0.03) 0%, transparent 20%),
        radial-gradient(circle at 90% 70%, rgba(51, 105, 30, 0.03) 0%, transparent 20%),
        radial-gradient(circle at 50% 30%, rgba(25, 118, 210, 0.02) 0%, transparent 30%)
      `, zIndex: 0, pointerEvents: 'none' }} />
      {/* subtle grid pattern overlay */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `
        linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
      `, backgroundSize: '40px 40px', zIndex: 0, pointerEvents: 'none' }} />
      {/* animated floating elements */}
      <div style={{ position: 'absolute', top: '15%', left: '5%', width: '80px', height: '80px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(51, 105, 30, 0.06) 0%, transparent 70%)', animation: 'float 15s ease-in-out infinite', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '60%', right: '10%', width: '120px', height: '120px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(25, 118, 210, 0.05) 0%, transparent 70%)', animation: 'float 18s ease-in-out infinite reverse', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '20%', left: '15%', width: '60px', height: '60px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(211, 47, 47, 0.04) 0%, transparent 70%)', animation: 'float 12s ease-in-out infinite', zIndex: 0, pointerEvents: 'none' }} />
      {/* Hamburger menu for mobile */}
      <button
        className="admin-hamburger"
        aria-label="Toggle sidebar"
        onClick={() => setSidebarOpen(o => !o)}
      >
        {sidebarOpen ? <span>&#10005;</span> : <span>&#9776;</span>}
      </button>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: '0', marginLeft: isMobile ? 0 : sidebarWidth, height: '100vh', overflowY: 'auto' }}>
        <div className="topbar" style={{
          position: 'fixed',
          left: isMobile ? 0 : sidebarWidth,
          right: 0,
          top: 0,
          height: headerHeight,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px',
          zIndex: 500
        }}>
          <h1 style={{ fontSize: '1.7rem', margin: 0 }}>Admin Dashboard</h1>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* Notification bell */}
            <button
              aria-label="Notifications"
              title="Notifications"
              onClick={handleOpenNotifications}
                style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 10,
                borderRadius: 8,
                position: 'relative',
                color: '#ffffff' // make the bell white for contrast on dark topbar
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M15 17H9a3 3 0 006 0z" fill="currentColor" />
                <path d="M18 8a6 6 0 10-12 0v4l-2 2v1h18v-1l-2-2V8z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              {/* numeric badge (show when notificationsCount > 0) */}
              {notificationsCount > 0 && (
                <span className={badgePulse ? 'badge-pulse' : ''} style={{ position: 'absolute', right: 4, top: 4, minWidth: 18, height: 18, borderRadius: 999, background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px', fontSize: 11, fontWeight: 700, boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                  {notificationsCount > 99 ? '99+' : notificationsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="btn btn-danger"
            >
              Logout
            </button>
          </div>
        </div>
  <div className="main-content" style={{ flex: 1, marginTop: headerHeight + 40 }}>
          {error && <div style={{ color: 'red', marginBottom: 20 }}>{error}</div>}
          {renderContent()}
          {/* Post viewer modal (reused across admin area) */}
          {showPostViewer && selectedPost && (
            <PostModal
              selectedPost={selectedPost}
              onClose={() => { setShowPostViewer(false); setSelectedPost(null); setSelectedPostId(null); }}
              lightboxIndex={lightboxIndex}
              setLightboxIndex={setLightboxIndex}
              prevPost={() => {
                // combine myPosts + recentPosts preserving order and find index
                const combined = Array.from(new Map([...(myPosts || []), ...(recentPosts || [])].map(p => [p.id, p])).values());
                const idx = combined.findIndex(p => p.id === selectedPost.id);
                if (idx > 0) {
                  const prev = combined[idx - 1];
                  setSelectedPost(prev);
                  setSelectedPostId(prev.id);
                }
              }}
              nextPost={() => {
                const combined = Array.from(new Map([...(myPosts || []), ...(recentPosts || [])].map(p => [p.id, p])).values());
                const idx = combined.findIndex(p => p.id === selectedPost.id);
                if (idx >= 0 && idx < combined.length - 1) {
                  const nx = combined[idx + 1];
                  setSelectedPost(nx);
                  setSelectedPostId(nx.id);
                }
              }}
            />
          )}
          {/* Only render UserManagementPanel in the 'User Management' section */}
        </div>
      </div>
      {/* Admin confirmation modal (reusable pattern) */}
      {confirmOpen && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 13000 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,6,23,0.45)' }} onClick={cancelDelete} />
          <div role="dialog" aria-modal="true" style={{ width: '100%', maxWidth: 520, background: '#1f2937', color: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 18px 40px rgba(2,6,23,0.5)', zIndex: 13001, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#92400e', fontWeight: 800 }}>!</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>Confirm action</div>
                <div style={{ color: '#cbd5e1', fontSize: 14, marginTop: 4 }}>{confirmMessage}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
              <button onClick={cancelDelete} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#cbd5e1', padding: '8px 12px', borderRadius: 8 }}>Cancel</button>
              <button onClick={confirmDelete} style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '8px 14px', borderRadius: 8 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
      {/* Logout confirmation overlay (Admin) */}
      {showLogoutConfirm && (
        <div role="dialog" aria-modal="true" aria-label="Confirm logout" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 15000 }}>
          <div style={{ width: 'min(520px, 94%)', background: '#fff', borderRadius: 10, padding: 18, boxShadow: '0 18px 60px rgba(2,6,23,0.3)', position: 'relative' }}>
            <h3 style={{ marginTop: 0 }}>Confirm Logout</h3>
            <p style={{ marginTop: 8, color: '#333' }}>Are you sure you want to logout?</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button onClick={() => setShowLogoutConfirm(false)} className="btn btn-outline">Cancel</button>
              <button onClick={() => { setShowLogoutConfirm(false); try { safeLogout(); } catch(e){} }} className="btn btn-danger">Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
