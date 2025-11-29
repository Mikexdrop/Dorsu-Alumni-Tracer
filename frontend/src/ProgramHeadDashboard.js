
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
// Chart components are used in SurveyResultsPanel; ProgramHeadDashboard renders that panel now
// ProgramHeadUserManagementPanel was used earlier during development; replaced by UserManagementPanel
import UserManagementPanel from './UserManagementPanel';
import programs from './programs';
import SurveyResultsPanel from './SurveyResultsPanel';
import EvaluationReports from './EvaluationReports';
import MiniPieCard from './MiniPieCard';
import {
	fetchUsers as fetchUsersUtil,
	handleCreateUser as handleCreateUserUtil,
	handleUpdateUser as handleUpdateUserUtil,
	handleDeleteUser as handleDeleteUserUtil,
	startEdit as startEditUtil,
	cancelEdit as cancelEditUtil
} from './AdminDashboardUtils';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement);

function ProgramHeadDashboard({ user, onLogout }) {
	// configurable count font size (px)
	const COUNT_FONT_SIZE = 20;
	// Simple CountUp component using requestAnimationFrame
	const CountUp = ({ end = 0, duration = 1200, format = v => String(v) }) => {
		const [count, setCount] = useState(0);
		useEffect(() => {
			let startTimestamp;
			const animate = timestamp => {
				if (!startTimestamp) startTimestamp = timestamp;
				const progress = timestamp - startTimestamp;
				setCount(Math.min(end * (progress / duration), end));
				if (progress < duration) {
					requestAnimationFrame(animate);
				}
			};
			requestAnimationFrame(animate);
		}, [end, duration]);
		return format(Math.round(count));
	};

	// (removed unused welcomeUsername variable — welcome overlay now reacts to `user` changes)

	// start on dashboard by default; when the logged-in user becomes available
	// we'll check localStorage and switch to the welcome screen if needed
	const [activeSection, setActiveSection] = useState('dashboard');
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
	const [alumniCount, setAlumniCount] = useState(0);
	const [surveyCount, setSurveyCount] = useState(0);
	const [employmentSourceCounts, setEmploymentSourceCounts] = useState({});
	// additional survey aggregate state (kept in sync with EvaluationReports)
	const [employedWithinCounts, setEmployedWithinCounts] = useState({ yes: 0, no: 0 });
	const [workPerformanceCounts, setWorkPerformanceCounts] = useState({});
	const [programCounts, setProgramCounts] = useState({});
	const [jobDifficultiesCounts, setJobDifficultiesCounts] = useState({});
	const [jobsRelatedCounts, setJobsRelatedCounts] = useState({});
	const [promotedCounts, setPromotedCounts] = useState({});
	const [selfEmploymentCounts, setSelfEmploymentCounts] = useState({});
	const [recentPostCount, setRecentPostCount] = useState(0);
	const [adminPostsCount, setAdminPostsCount] = useState(0);
	const [adminPostsLoading, setAdminPostsLoading] = useState(false);
	// admin-specific post counters removed — Program Head dashboard shows recent posts only
	const [activeProgramCount, setActiveProgramCount] = useState(0);
	const [notificationsCount, setNotificationsCount] = useState(0);

	// Manage Profile local form state (for Manage Profile panel)
	const [profileUsername, setProfileUsername] = useState('');
	const [profileEmail, setProfileEmail] = useState('');
	const [profileFullName, setProfileFullName] = useState('');
	const [profileProgramCourse, setProfileProgramCourse] = useState('');
	const [profileImageFile, setProfileImageFile] = useState(null);
	const [profileImagePreview, setProfileImagePreview] = useState(null);
	const [showChangePassword, setShowChangePassword] = useState(false);
	const [newPassword, setNewPassword] = useState('');
	const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
	const [passwordError, setPasswordError] = useState('');
	const [profileMessage, setProfileMessage] = useState('');
	const [profileLoading, setProfileLoading] = useState(false);
	// logout confirmation modal
	const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

	// Users state & create/edit form state (for user-management)
	const [users, setUsers] = useState([]);
	const [loadingUsers, setLoadingUsers] = useState(false);
	const [usersError, setUsersError] = useState('');
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [userType, setUserType] = useState('program_head');
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [editingUser, setEditingUser] = useState(null);
	// Chart animation / view state (copied from AdminDashboard design)
	const [chartsAnimated, setChartsAnimated] = useState(false);
	const [rotationIndex, setRotationIndex] = useState(0);
	// small helpers for charts (match AdminDashboard palette)
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
	// track previous user to detect login events
	const prevUserRef = useRef(null);
	// toggle between line and bar chart views (not used in Program Head)
	const isMobile = windowWidth <= 800;
	const sidebarWidth = 250;
	const headerHeight = isMobile ? 56 : 64;


	// Handler when the user continues from the welcome sign. Navigate to dashboard.
	// We intentionally do NOT persist any flag so the overlay will show on each login.
	const handleContinueFromWelcome = () => {
		setActiveSection('dashboard');
	};

	// Safe logout helper (shared behavior): clear local auth and call parent handler or redirect
	const safeLogout = () => {
		try {
			localStorage.removeItem('token');
			localStorage.removeItem('currentUser');
			localStorage.removeItem('userType');
		} catch (e) {
			// ignore
		}
		if (typeof onLogout === 'function') {
			try { onLogout(); return; } catch (e) { /* ignore */ }
		}
		try { window.location.href = '/'; } catch (e) { /* ignore */ }
	};

	useEffect(() => {
		const onResize = () => setWindowWidth(window.innerWidth);
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, []);

	// Show welcome overlay whenever a new user logs in. We detect a login event by
	// comparing the previous user to the current `user` prop. This ensures the overlay
	// appears on every successful login.
	useEffect(() => {
		try {
			const username = user && user.username ? user.username : null;
			const prevUsername = prevUserRef.current;
			// if there was no previous user (or different user) and now we have a username,
			// treat it as a login event and show the welcome overlay
			if (!prevUsername && username) {
				setActiveSection('welcome');
			} else if (prevUsername && prevUsername !== username && username) {
				// user switched accounts or re-logged in under different username
				setActiveSection('welcome');
			}
			prevUserRef.current = username;
		} catch (e) {}
	}, [user]);

	// If the `user` object is minimal (login sometimes stores only id/username),
	// try fetching the full program-head profile from the API to populate the
	// Manage Profile fields (and update localStorage.currentUser).
	useEffect(() => {
		if (!user || !user.id) return;
		// if we already have email/full_name/program_course, no need to fetch
		const hasEmail = !!(user.email || user.user_email || user.email_address);
		const hasFullName = !!(user.full_name || user.fullName || user.first_name || user.name || user.surname);
		const hasProgram = !!(user.program_course || user.program || user.programCourse);
		if (hasEmail && hasFullName && hasProgram && (user.image || user.avatar_url || user.profile_image)) return;

		let aborted = false;
		const fetchProfile = async () => {
			try {
				const token = localStorage.getItem('token');
				const base = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';
				const res = await fetch(`${base}/api/program-heads/${user.id}/`, {
					headers: {
						...(token ? { Authorization: 'Bearer ' + token } : {})
					}
				});
				if (!res.ok) return;
				const data = await res.json();
				if (aborted) return;
				const src = data || {};
				const email = src.email || src.user_email || src.email_address || src.contact_email || '';
				const fullName = src.full_name || src.fullName || [src.first_name, src.middle_name, src.last_name].filter(Boolean).join(' ') || [src.name, src.surname].filter(Boolean).join(' ') || src.display_name || '';
				const programCourse = src.program_course || src.program || src.programCourse || src.program_name || '';
				const usernameVal = src.username || src.user_name || src.name || user.username || '';
				setProfileUsername(usernameVal);
				setProfileEmail(email);
				setProfileFullName(fullName);
				setProfileProgramCourse(programCourse);
				setProfileImagePreview(src.image || src.avatar_url || src.profile_image || user.image || null);
				// merge into localStorage.currentUser so other parts of the app can reuse it
				try {
					const merged = Object.assign({}, user, src);
					localStorage.setItem('currentUser', JSON.stringify(merged));
				} catch (_) {}
			} catch (err) {
				// ignore fetch errors silently
			}
		};

		fetchProfile();
		return () => { aborted = true; };
	}, [user]);

	// Fetch dashboard counts (use same logic as AdminDashboard: fetch lists and count lengths)
	useEffect(() => {
		const fetchCounts = async () => {
			try {
				// Fetch total alumni (some backends expose a list endpoint)
				const alumniRes = await fetch('/api/alumni/');
				if (alumniRes.ok) {
					const alumniData = await alumniRes.json();
					setAlumniCount(Array.isArray(alumniData) ? alumniData.length : (alumniData.count || 0));
				} else {
					// fallback to a count endpoint if present
					try {
						const r = await fetch('/api/alumni/count/');
						if (r.ok) {
							const d = await r.json();
							setAlumniCount(d.count || 0);
						}
					} catch (_) {}
				}

				// Survey responses (use aggregates API for a privacy-preserving, single-count endpoint)
				try {
					const aggRes = await fetch('/api/survey-aggregates/');
					if (aggRes.ok) {
						const aggData = await aggRes.json();
						// prefer filtered `count` (current filters), then `total_count`, then fallback
						const c = aggData && (aggData.count || aggData.total_count || 0);
						setSurveyCount(Number(c) || 0);
						// populate employment/source breakdown if available
						if (aggData && aggData.sources && typeof aggData.sources === 'object') {
							setEmploymentSourceCounts(aggData.sources);
						}
					}
				} catch (_) {}

				// Recent posts
				try {
					const postsRes = await fetch('/api/recent-posts/');
					if (postsRes.ok) {
						const postsData = await postsRes.json();
						setRecentPostCount(Array.isArray(postsData) ? postsData.length : (postsData.count || 0));
					}
				} catch (_) {}



				// Active programs (fetched but we prefer the local `programs.js` list for authoritative count)
				try {
					const programsRes = await fetch('/api/active-programs/');
					if (programsRes.ok) {
						await programsRes.json().catch(() => null);
					}
				} catch (_) {}
			} catch (error) {
				console.error('Error fetching counts:', error);
			}
		};

		fetchCounts();
		// Auto-refresh every 5 minutes
		const interval = setInterval(fetchCounts, 5 * 60 * 1000);
		return () => clearInterval(interval);
	}, []);

	// Fetch survey aggregates and listen for EvaluationReports updates
	useEffect(() => {
		let mounted = true;
		const base = process.env.REACT_APP_API_BASE || '';

		const applyAggregates = (d) => {
			if (!mounted || !d) return;
			try {
				if (typeof d.count === 'number') setSurveyCount(d.count);
				else if (typeof d.total_count === 'number') setSurveyCount(d.total_count);
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

	// auto-rotate charts when playing
	useEffect(() => {
		if (!chartsAnimated) return;
		const id = setInterval(() => {
			setRotationIndex(i => (i + 1) % 8);
		}, 5000);
		return () => clearInterval(id);
	}, [chartsAnimated]);

	// memoized aggregate key to detect changes and reset carousel
	const aggregatesDepsKey = useMemo(() => JSON.stringify({ employmentSourceCounts, employedWithinCounts, workPerformanceCounts, jobDifficultiesCounts, jobsRelatedCounts, promotedCounts, selfEmploymentCounts, programCounts }), [employmentSourceCounts, employedWithinCounts, workPerformanceCounts, jobDifficultiesCounts, jobsRelatedCounts, promotedCounts, selfEmploymentCounts, programCounts]);

	useEffect(() => { setRotationIndex(0); }, [aggregatesDepsKey]);

	// trigger chart animations when dashboard becomes active
	useEffect(() => {
		if (activeSection === 'dashboard') {
			const t = setTimeout(() => setChartsAnimated(true), 420);
			return () => clearTimeout(t);
		} else {
			setChartsAnimated(false);
		}
	}, [activeSection]);

	// Fetch users on mount for user-management
	useEffect(() => {
		let mounted = true;
		const doFetch = async () => {
			try {
				setLoadingUsers(true);
				await fetchUsersUtil(setUsers, setUsersError, setLoadingUsers);
			} catch (e) {
				console.error('Failed to fetch users:', e);
			} finally {
				if (mounted) setLoadingUsers(false);
			}
		};
		doFetch();
		return () => { mounted = false; };
	}, []);

	// (duplicate) Fetch dashboard counts - ensure program head shows same totals as Admin dashboard
	useEffect(() => {
		const fetchCounts = async () => {
			try {
				const alumniRes = await fetch('/api/alumni/');
				if (alumniRes.ok) {
					const alumniData = await alumniRes.json();
					setAlumniCount(Array.isArray(alumniData) ? alumniData.length : (alumniData.count || 0));
				}
				// other counts are optional; replicate Admin's behavior
				try { const surveyRes = await fetch('/api/survey-responses/'); if (surveyRes.ok) { const surveyData = await surveyRes.json(); setSurveyCount(Array.isArray(surveyData) ? surveyData.length : (surveyData.count || 0)); } } catch(_) {}
				try { const postsRes = await fetch('/api/recent-posts/'); if (postsRes.ok) { const postsData = await postsRes.json(); setRecentPostCount(Array.isArray(postsData) ? postsData.length : (postsData.count || 0)); } } catch(_) {}
				try { const programsRes = await fetch('/api/active-programs/'); if (programsRes.ok) { await programsRes.json().catch(() => null); } } catch(_) {}
			} catch (error) {
				console.error('Error fetching counts:', error);
			}
		};

		fetchCounts();
		const interval = setInterval(fetchCounts, 5 * 60 * 1000);
		return () => clearInterval(interval);
	}, []);
	// Fetch posts authored by current admin for quick access/count
	useEffect(() => {
		let mounted = true;
		const base = process.env.REACT_APP_API_BASE || '';
		const loadMyPosts = async () => {
			if (!mounted) return;
			setAdminPostsLoading(true);
			try {
				const cuRaw = localStorage.getItem('currentUser');
				const token = localStorage.getItem('token');
				const cu = cuRaw ? JSON.parse(cuRaw) : null;
				if (!cu || !cu.id) {
					if (mounted) setAdminPostsCount(0);
					return;
				}
				const headers = token ? { Authorization: `Bearer ${token}` } : {};
				let res = await fetch(`${base}/api/posts/?author_id=${cu.id}`, { headers });
				if (!res.ok) res = await fetch(`${base}/api/posts/?author=${cu.id}`, { headers });
				if (!res.ok) throw new Error('Failed to load my posts');
				const data = await res.json().catch(() => null);
				const list = Array.isArray(data) ? data : (Array.isArray(data.results) ? data.results : []);
				if (mounted) setAdminPostsCount(list.length || 0);
			} catch (e) {
				console.warn('ProgramHeadDashboard: failed to fetch my posts', e);
				if (mounted) setAdminPostsCount(0);
			} finally {
				if (mounted) setAdminPostsLoading(false);
			}
		};

		loadMyPosts();
		const onRefresh = () => loadMyPosts();
		window.addEventListener && window.addEventListener('admin-refresh-posts', onRefresh);
		return () => { mounted = false; window.removeEventListener && window.removeEventListener('admin-refresh-posts', onRefresh); };
	}, []);

	// initialize notificationsCount from localStorage (if available)
	useEffect(() => {
		try {
			if (typeof window !== 'undefined' && window.localStorage) {
				const raw = localStorage.getItem('programHeadNotifications');
				if (raw) {
					const arr = JSON.parse(raw);
					if (Array.isArray(arr)) setNotificationsCount(arr.length);
				}
			}
		} catch (e) {}
	}, []);

	// Initialize active programs from local `programs.js` list so dashboard shows accurate count
	useEffect(() => {
		try {
			if (Array.isArray(programs)) setActiveProgramCount(programs.length);
		} catch (e) { /* ignore */ }
	}, []);

	// track previous notifications count (used for potential future UI updates)
	const prevNotificationsRef = useRef(notificationsCount);
	const hasMountedRef = useRef(false);
	useEffect(() => {
		if (!hasMountedRef.current) {
			hasMountedRef.current = true;
			prevNotificationsRef.current = notificationsCount;
			return;
		}
		// no-op currently; kept for future notification UI behavior
		prevNotificationsRef.current = notificationsCount;
	}, [notificationsCount]);

	// Prefill manage profile form when `user` prop is available
	useEffect(() => {
		// If user prop is missing some fields, try reading from localStorage.currentUser as a fallback
		const src = user || (() => {
			try {
				const raw = localStorage.getItem('currentUser');
				if (!raw) return null;
				return JSON.parse(raw);
			} catch (e) { return null; }
		})();
		if (!src) return;

		// Robust field mapping: backend shape may vary, try common keys
		const email = src.email || src.user_email || src.email_address || src.contact_email || '';
		const fullName = src.full_name
			|| src.fullName
			|| [src.first_name, src.middle_name, src.last_name].filter(Boolean).join(' ')
			|| [src.name, src.surname].filter(Boolean).join(' ')
			|| src.display_name
			|| '';
		const programCourse = src.program_course || src.program || src.programCourse || src.program_name || '';
		const usernameVal = src.username || src.user_name || src.name || '';

		setProfileUsername(usernameVal);
		setProfileEmail(email);
		setProfileFullName(fullName);
		setProfileProgramCourse(programCourse);
		setProfileImagePreview(src.image || src.avatar_url || src.profile_image || null);

		// Reset password-change UI when user data is prefilled
		setShowChangePassword(false);
		setNewPassword('');
		setNewPasswordConfirm('');
		setPasswordError('');
	}, [user]);

	const onProfileImageSelect = (file) => {
		if (!file) { setProfileImageFile(null); setProfileImagePreview(null); return; }
		setProfileImageFile(file);
		try {
			const reader = new FileReader();
			reader.onload = (e) => setProfileImagePreview(e.target.result);
			reader.readAsDataURL(file);
		} catch (e) { setProfileImagePreview(null); }
	};

	const resetProfileForm = () => {
		if (!user) return;
		setProfileUsername(user.username || '');
		setProfileEmail(user.email || '');
		setProfileFullName(user.full_name || '');
		setProfileProgramCourse(user.program_course || user.program || '');
		setProfileImageFile(null);
		setProfileImagePreview(user.image || null);
		// clear change-password state as well
		setShowChangePassword(false);
		setNewPassword('');
		setNewPasswordConfirm('');
		setPasswordError('');
		setProfileMessage('');
	};

	const saveProfile = async () => {
		setProfileLoading(true);
		setProfileMessage('');
		try {
			if (!user || !user.id) throw new Error('Missing user id');
			const token = localStorage.getItem('token');
			const base = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';
			const url = `${base}/api/program-heads/${user.id}/`;
			// Build payload object from form fields
			const payload = {
				username: profileUsername,
				email: profileEmail,
				full_name: profileFullName,
				program_course: profileProgramCourse
			};
			// If an image file is selected, use multipart/form-data
			if (profileImageFile) {
				// validate password change if requested
				if (showChangePassword) {
					if (!newPassword) throw new Error('New password is required');
					if (newPassword !== newPasswordConfirm) throw new Error('New passwords do not match');
				}
				const fd = new FormData();
				for (const [k, v] of Object.entries(payload)) {
					if (v == null) continue;
					fd.append(k, String(v));
				}
				if (showChangePassword && newPassword) fd.append('password', newPassword);
				fd.append('image', profileImageFile);
				const res = await fetch(url, {
					method: 'PATCH',
					headers: {
						...(token ? { Authorization: 'Bearer ' + token } : {})
					},
					body: fd
				});
				if (!res.ok) {
					let msg = `HTTP ${res.status}`;
					try { const d = await res.json(); msg = d.detail || JSON.stringify(d); } catch(_) { try { msg = await res.text(); } catch(_){} }
					throw new Error(msg);
				}
				const updated = await res.json();
				// Persist to localStorage currentUser and notify app
				try { localStorage.setItem('currentUser', JSON.stringify(updated)); window.dispatchEvent(new CustomEvent('user-updated', { detail: updated })); } catch(_){}
				setProfileMessage('Profile saved');
				return;
			} else {
				// validate password change if requested
				if (showChangePassword) {
					if (!newPassword) throw new Error('New password is required');
					if (newPassword !== newPasswordConfirm) throw new Error('New passwords do not match');
				}
				// Send JSON patch (do not include image)
				const body = { ...payload };
				if (showChangePassword && newPassword) body.password = newPassword;
				if ('image' in body) delete body.image;
				const res = await fetch(url, {
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
						...(token ? { Authorization: 'Bearer ' + token } : {})
					},
					body: JSON.stringify(body)
				});
				if (!res.ok) {
					let msg = `HTTP ${res.status}`;
					try { const d = await res.json(); msg = d.detail || JSON.stringify(d); } catch(_) { try { msg = await res.text(); } catch(_){} }
					throw new Error(msg);
				}
				const updated = await res.json();
				try { localStorage.setItem('currentUser', JSON.stringify(updated)); window.dispatchEvent(new CustomEvent('user-updated', { detail: updated })); } catch(_){}
				setProfileMessage('Profile saved');
				return;
			}
		} catch (e) {
			setProfileMessage('Failed to save profile: ' + (e && e.message ? e.message : String(e)));
		} finally {
			setProfileLoading(false);
		}
	};

	const confirmAndDeleteAccount = () => {
		if (!window.confirm('Delete your account? This cannot be undone.')) return;
		setProfileMessage('Account deletion requested (UI-only)');
	};

	// Sidebar component
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
				<img src="/image.png" alt="Dorsu logo" style={{ width: 120, maxWidth: '60%', height: 'auto', display: 'inline-block', borderRadius: 8 }} />
			</div>
			<nav>
				<ul style={{ listStyle: 'none', padding: 0 }}>
					<li style={{ marginBottom: 10 }}>
						<button onClick={() => setActiveSection('dashboard')} style={{ width: '100%', padding: '15px 20px', background: activeSection === 'dashboard' ? '#4CAF50' : 'transparent', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', fontSize: '16px' }}>
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
						<button onClick={() => setActiveSection('survey')} style={{ width: '100%', padding: '15px 20px', background: activeSection === 'survey' ? '#4CAF50' : 'transparent', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', fontSize: '16px' }}>
							<span aria-hidden style={{ marginRight: 10, display: 'inline-flex', verticalAlign: 'middle' }}>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
									<circle cx="12" cy="8" r="3" fill="currentColor" />
									<path d="M3 21c3-4 6-6 9-6s6 2 9 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
								</svg>
							</span>
							Survey Results
						</button>
					</li>
					<li style={{ marginBottom: 10 }}>
						<button onClick={() => setActiveSection('user-management')} style={{ width: '100%', padding: '15px 20px', background: activeSection === 'user-management' ? '#4CAF50' : 'transparent', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', fontSize: '16px' }}>
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
						<button onClick={() => setActiveSection('manage-profile')} style={{ width: '100%', padding: '15px 20px', background: activeSection === 'manage-profile' ? '#4CAF50' : 'transparent', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', fontSize: '16px' }}>
							<span aria-hidden style={{ marginRight: 10, display: 'inline-flex', verticalAlign: 'middle' }}>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
									<path d="M12 12a5 5 0 100-10 5 5 0 000 10z" fill="currentColor" />
									<path d="M3 21a9 9 0 0118 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
								</svg>
							</span>
							Manage Profile
						</button>
					</li>
					<li style={{ marginBottom: 10 }}>
						<button onClick={() => setActiveSection('evaluation')} style={{ width: '100%', padding: '15px 20px', background: activeSection === 'evaluation' ? '#4CAF50' : 'transparent', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', fontSize: '16px' }}>
							<span aria-hidden style={{ marginRight: 10, display: 'inline-flex', verticalAlign: 'middle' }}>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
									<path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
									<path d="M8 10h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</span>
							Evaluation Reports
						</button>
					</li>
					<li style={{ marginBottom: 10 }}>
						{/* Notifications item removed per request */}
					</li>
				</ul>
			</nav>
		</div>
	);

	// Content sections for each sidebar item
	const renderContent = () => {
		switch (activeSection) {

			case 'dashboard':
				return (
					<div>
						<h2 style={{ marginTop: 40}}> </h2>

						{/* Top stat cards (Admin-style) */}
						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 18 }} className="enter-rows">
							<div className="card-anim" style={{ background: 'linear-gradient(135deg,#6366f1 0%,#06b6d4 100%)', color: 'white', padding: 12, borderRadius: 8 }}>
								<div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
										<path d="M12 12a5 5 0 100-10 5 5 0 000 10z" fill="currentColor" />
										<path d="M3 21a9 9 0 0118 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
									</svg>
									<div style={{ fontSize: 12, opacity: 0.9 }}>TOTAL ALUMNI</div>
								</div>
								<div style={{ fontSize: COUNT_FONT_SIZE, fontWeight: 800, marginTop: 4 }}><CountUp end={alumniCount} format={(v)=>v.toLocaleString()} duration={1400} /></div>
								<div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
									<span style={{ visibility: 'hidden', height: 0, display: 'inline-block' }}>TOTAL VISITS</span>
									<strong style={{ display: 'block' }}>—</strong>
								</div>
							</div>

							<div className="card-anim" style={{ background: 'linear-gradient(135deg,#06b6d4 0%,#10b981 100%)', color: 'white', padding: 12, borderRadius: 8 }}>
								<div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
										<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
										<path d="M9 5a2 2 0 114 0v2H9V5z" stroke="currentColor" strokeWidth="1.6" fill="none"/>
										<path d="M8 12h8M8 16h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
									</svg>
									<div style={{ fontSize: 12, opacity: 0.9 }}>SURVEY RESPONSES</div>
								</div>
								<div style={{ fontSize: COUNT_FONT_SIZE, fontWeight: 800, marginTop: 4 }}><CountUp end={surveyCount} format={(v)=>v.toLocaleString()} duration={1200} /></div>
								<div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
									<span style={{ visibility: 'hidden', height: 0, display: 'inline-block' }}>TOTAL SURVEYS</span>
									<strong style={{ display: 'block' }}>—</strong>
								</div>
							</div>

							<div className="card-anim" style={{ background: 'linear-gradient(135deg,#fb7185 0%,#f97316 100%)', color: 'white', padding: 12, borderRadius: 8 }}>
								<div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
										<path d="M21 15a2 2 0 01-2 2h-1v3l-4-3H7a2 2 0 01-2-2V7a2 2 0 012-2h11a2 2 0 012 2v8z" stroke="currentColor" strokeWidth="1.6" fill="none"/>
										<path d="M8 10h8M8 13h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
									</svg>
									<div style={{ fontSize: 12, opacity: 0.9 }}>RECENT POSTS/TRACKS</div>
								</div>
								<div style={{ fontSize: COUNT_FONT_SIZE, fontWeight: 800, marginTop: 4 }} aria-live="polite" aria-atomic="true">
									{adminPostsLoading ? (
										<span style={{ opacity: 0.95 }}>Loading…</span>
									) : (
										<CountUp end={adminPostsCount || recentPostCount} format={(v)=>v.toLocaleString()} duration={900} />
									)}
								</div>
								<div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
									<span style={{ visibility: 'hidden', height: 0, display: 'inline-block' }}>POSTS AUTHORED</span>
									<div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
										<span style={{ visibility: 'hidden', height: 0, display: 'inline-block' }}>RECENT POSTS</span>
										<strong style={{ display: 'block' }}>—</strong>
									</div>
								</div>
							</div>

							<div className="card-anim" style={{ background: 'linear-gradient(135deg,#34d399 0%,#60a5fa 100%)', color: 'white', padding: 12, borderRadius: 8 }}>
								<div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
										<path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
										<circle cx="8" cy="7" r="1" fill="currentColor"/>
										<circle cx="16" cy="12" r="1" fill="currentColor"/>
										<circle cx="10" cy="17" r="1" fill="currentColor"/>
									</svg>
									<div style={{ fontSize: 12, opacity: 0.9 }}>ACTIVE PROGRAMS</div>
								</div>
								<div style={{ fontSize: COUNT_FONT_SIZE, fontWeight: 800, marginTop: 4 }}><CountUp end={activeProgramCount} format={(v)=>v.toLocaleString()} duration={900} /></div>
								<div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
									<span style={{ visibility: 'hidden', height: 0, display: 'inline-block' }}>ACTIVE PROGRAMS</span>
									<strong style={{ display: 'block' }}>—</strong>
								</div>
							</div>
						</div>

						{/* Charts area */}
						<div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginTop: 18, alignItems: 'start' }} className="enter-charts">
							<div className="card-anim" style={{ background: '#0b1220', color: 'white', padding: 12, borderRadius: 8 }}>
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
									<div style={{ position: 'relative', width: '100%', height: '100%' }}>
										{(() => {
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
			case 'survey':
				return (
					<div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
						<SurveyResultsPanel surveyCount={surveyCount} />
					</div>
				);
			case 'user-management':
				return (
					<UserManagementPanel
						readonlyForProgramHead={true}
						users={users}
						setUsers={setUsers}
						error={usersError}
						setError={setUsersError}
						loading={loadingUsers}
						setLoading={setLoadingUsers}
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
						handleCreateUser={(e, usernameArg, passwordArg, userTypeArg, setShowCreateFormArg, setUsernameArg, setPasswordArg, setUserTypeArg, fetchUsersOrExtra, extraOrSetError, setErrorMaybe) => handleCreateUserUtil(e, usernameArg, passwordArg, userTypeArg, setShowCreateFormArg, setUsernameArg, setPasswordArg, setUserTypeArg, fetchUsersOrExtra || (() => fetchUsersUtil(setUsers, setUsersError, setLoadingUsers)), extraOrSetError, setErrorMaybe)}
						handleUpdateUser={(userId, payload, setEditingUserArg, fetchUsersArg, setErrorArg, userTypeArg) => handleUpdateUserUtil(userId, payload, setEditingUserArg, fetchUsersArg || (() => fetchUsersUtil(setUsers, setUsersError, setLoadingUsers)), setErrorArg || setUsersError, userTypeArg)}
						handleDeleteUser={(userId, fetchUsersArg, setErrorArg) => handleDeleteUserUtil(userId, fetchUsersArg || (() => fetchUsersUtil(setUsers, setUsersError, setLoadingUsers)), setErrorArg || setUsersError)}
						fetchUsers={() => fetchUsersUtil(setUsers, setUsersError, setLoadingUsers)}
						startEdit={(u, setEditingUserArg, setUsernameArg, setUserTypeArg) => startEditUtil(u, setEditingUserArg || setEditingUser, setUsernameArg || setUsername, setUserTypeArg || setUserType)}
						cancelEdit={(setEditingUserArg, setUsernameArg, setPasswordArg, setUserTypeArg) => cancelEditUtil(setEditingUserArg || setEditingUser, setUsernameArg || setUsername, setPasswordArg || setPassword, setUserTypeArg || setUserType)}
						viewUserToOpen={null}
					/>
				);
			case 'manage-profile':
				return (
					<div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
						<h2 style={{ marginBottom: 8 }}>My Profile</h2>
						<p>Update your profile details and upload a profile image below.</p>

						<div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginTop: 18 }}>
							<div style={{ background: 'white', padding: 20, borderRadius: 10, boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }}>
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
									<div>
										<div style={{ color: '#6b7280', fontSize: 12 }}>Username</div>
										<input value={profileUsername} onChange={e => setProfileUsername(e.target.value)} style={{ padding: 10, width: '100%', borderRadius: 6, border: '1px solid #e6edf3' }} />
									</div>
									<div>
										<div style={{ color: '#6b7280', fontSize: 12 }}>Email</div>
										<input value={profileEmail} onChange={e => setProfileEmail(e.target.value)} style={{ padding: 10, width: '100%', borderRadius: 6, border: '1px solid #e6edf3' }} />
									</div>
									<div style={{ gridColumn: '1 / -1' }}>
										<div style={{ color: '#6b7280', fontSize: 12 }}>Full Name</div>
										<input value={profileFullName} onChange={e => setProfileFullName(e.target.value)} style={{ padding: 10, width: '100%', borderRadius: 6, border: '1px solid #e6edf3' }} />
									</div>
									<div style={{ gridColumn: '1 / -1' }}>
										<div style={{ color: '#6b7280', fontSize: 12 }}>Program Course</div>
										<input value={profileProgramCourse} onChange={e => setProfileProgramCourse(e.target.value)} style={{ padding: 10, width: '100%', borderRadius: 6, border: '1px solid #e6edf3' }} />
									</div>
									<div style={{ gridColumn: '1 / -1' }}>
										<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
											<div>
												<div style={{ color: '#6b7280', fontSize: 12 }}>Password</div>
												<div style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #e6edf3', background: '#fff' }}>{showChangePassword ? 'Changing password' : '********'}</div>
											</div>
											<div>
												{!showChangePassword ? (
													<button className="btn btn-outline" onClick={() => { setShowChangePassword(true); setPasswordError(''); }}>Change</button>
												) : (
													<button className="btn btn-outline" onClick={() => { setShowChangePassword(false); setNewPassword(''); setNewPasswordConfirm(''); setPasswordError(''); }}>Cancel</button>
												)}
											</div>
										</div>
									</div>
									{showChangePassword && (
										<>
											<div>
												<div style={{ color: '#6b7280', fontSize: 12 }}>New password</div>
												<input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ padding: 10, width: '100%', borderRadius: 6, border: '1px solid #e6edf3' }} />
											</div>
											<div>
												<div style={{ color: '#6b7280', fontSize: 12 }}>Confirm new password</div>
												<input type="password" value={newPasswordConfirm} onChange={e => setNewPasswordConfirm(e.target.value)} style={{ padding: 10, width: '100%', borderRadius: 6, border: '1px solid #e6edf3' }} />
											</div>
											{passwordError && <div style={{ color: '#ef4444', marginTop: 8 }}>{passwordError}</div>}
										</>
									)}
								</div>

								<div style={{ marginTop: 18, display: 'flex', gap: 12, alignItems: 'center' }}>
									<button className="btn btn-primary" onClick={saveProfile} disabled={profileLoading} style={{ padding: '10px 16px' }}>{profileLoading ? 'Saving...' : 'Save Changes'}</button>
									<button className="btn btn-outline" onClick={resetProfileForm}>Reset</button>
									<div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
										<button className="btn btn-danger" onClick={confirmAndDeleteAccount}>Delete Account</button>
										<button className="btn btn-outline" onClick={() => setActiveSection('user-management')}>Open User Management</button>
									</div>
								</div>

								{profileMessage && <div style={{ marginTop: 12, color: '#0b0b0b', fontWeight: 600 }}>{profileMessage}</div>}
							</div>

							<div style={{ background: 'white', padding: 18, borderRadius: 10, boxShadow: '0 8px 24px rgba(2,6,23,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
								<div style={{ width: 180, height: 180, borderRadius: 12, overflow: 'hidden', background: '#eef2f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
									{profileImagePreview ? (
										<img src={profileImagePreview} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
									) : (
										<div style={{ color: '#3b82f6', fontWeight: 700 }}>{(profileFullName || profileUsername || '').split(' ').map(n => n && n[0]).slice(0,2).join('').toUpperCase() || 'PH'}</div>
									)}
								</div>

								<div style={{ width: '100%' }}>
									<label style={{ display: 'block', marginBottom: 8, color: '#374151', fontWeight: 600 }}>Profile Image</label>
									<input type="file" accept="image/*" onChange={(e) => onProfileImageSelect(e.target.files && e.target.files[0])} />
									<div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
										<button className="btn btn-primary" onClick={() => { /* placeholder upload */ setProfileMessage('Image upload (UI-only)'); }}>Upload</button>
										<button className="btn btn-outline" onClick={() => { setProfileImageFile(null); setProfileImagePreview(null); }}>Clear</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				);
			case 'evaluation':
				return (
					<EvaluationReports />
				);
			case 'notifications':
				return (
					<div>
						<h2>Notifications</h2>
						<p>View important notifications and announcements.</p>
						<div style={{
							background: '#fce4ec',
							padding: 20,
							borderRadius: 8,
							marginTop: 20
						}}>
							<h3>Recent Notifications</h3>
							<p>Notification system would be implemented here.</p>
						</div>
					</div>
				);
			default:
				return (
					<div>
						<h2>Program Head Dashboard</h2>
						<p>Welcome, {user.username}! You have program head privileges.</p>
					</div>
				);
		}
	};

	return (
		<div className="app-root" style={{ display: 'flex', minHeight: '100vh', background: '#f7f7f7', fontFamily: 'Inter, Arial, sans-serif' }}>
			<style>{`
				@media (max-width: 800px) {
					.admin-hamburger { display: block !important; position: fixed; top: 16px; left: 16px; z-index: 300; background: #333; color: #ffd600; border: none; font-size: 32px; border-radius: 8px; width: 48px; height: 48px; cursor: pointer; box-shadow: 0 2px 8px #0004; }
					.admin-sidebar { width: 220px !important; min-height: 100vh !important; padding: 20px 0 !important; position: fixed; top: 0; left: 0; z-index: 200; background: #333 !important; transform: translateX(-100%); transition: transform 0.3s; box-shadow: none; display: block !important; }
					.admin-sidebar.open { transform: translateX(0) !important; box-shadow: 0 2px 16px #0006; }
				}
				@media (min-width: 801px) { .admin-hamburger { display: none !important; } }

				.app-root { background: linear-gradient(180deg, #f3f6fb 0%, #eef2f8 35%, #ffffff 100%); color: #0f172a; }
				.topbar { background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); backdrop-filter: blur(6px); box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08); border-bottom: 1px solid rgba(0,0,0,0.06); color: white; }
				.chart-container { animation: chart-enter 0.6s ease-out; transform-origin: top; }
						.main-content { padding: 20px; min-height: calc(100vh - 64px); }
						.card { background: #ffffff; border-radius: 12px; box-shadow: 0 12px 30px rgba(2,6,23,0.08); padding: 20px; }

					/* Admin dashboard additions (cards, animations, buttons) */
					.enter-rows > div, .enter-charts > div { opacity: 0; transform: translateY(12px) scale(0.998); }
					.enter-rows .card-anim, .enter-charts .card-anim { animation: popIn 560ms cubic-bezier(.2,.9,.3,1) forwards; }
					@keyframes popIn { from { opacity: 0; transform: translateY(18px) scale(0.994); } to { opacity: 1; transform: translateY(0) scale(1); } }
					.enter-rows .card-anim:nth-child(1) { animation-delay: 80ms; }
					.enter-rows .card-anim:nth-child(2) { animation-delay: 160ms; }
					.enter-rows .card-anim:nth-child(3) { animation-delay: 240ms; }
					.enter-rows .card-anim:nth-child(4) { animation-delay: 320ms; }
					.enter-charts .card-anim:nth-child(1) { animation-delay: 360ms; }
					.enter-charts .card-anim:nth-child(2) { animation-delay: 440ms; }
					.chart-area { opacity: 0; transform: translateY(12px) scale(0.998); animation: fadeUp 720ms 420ms cubic-bezier(.2,.9,.3,1) forwards; }
					@keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
					.panel-right { opacity: 0; transform: translateY(12px); animation: panelIn 720ms 480ms cubic-bezier(.2,.9,.3,1) forwards; }
					@keyframes panelIn { from { opacity: 0; transform: translateY(18px) scale(.996); } to { opacity: 1; transform: translateY(0) scale(1); } }
					@keyframes badge-pulse { 0% { transform: scale(1); box-shadow: 0 0 0 rgba(239,68,68,0.4); } 50% { transform: scale(1.18); box-shadow: 0 6px 18px rgba(239,68,68,0.22); } 100% { transform: scale(1); box-shadow: 0 0 0 rgba(239,68,68,0); } }
					.badge-pulse { animation: badge-pulse 720ms ease-in-out; }
					.btn { display: inline-block; padding: 8px 14px; border-radius: 8px; border: none; cursor: pointer; transition: transform 180ms cubic-bezier(.2,.8,.2,1), box-shadow 180ms ease, background-color 160ms ease, color 120ms ease; background: transparent; color: #0f172a; }
					.btn:focus { outline: 3px solid rgba(59,130,246,0.18); outline-offset: 2px; }
					.btn:hover { transform: translateY(-3px); }
					.btn-primary { background: #10b981; color: white; box-shadow: 0 8px 20px rgba(16,185,129,0.12); border: none; }
					.btn-danger { background: #ef4444; color: white; box-shadow: 0 8px 20px rgba(239,68,68,0.12); border: none; }
					.btn-outline { background: #ffffff; border: 1px solid #e6edf3; color: #0f172a; box-shadow: none; }
				`}</style>

			{/* Hamburger menu for mobile */}
			<button className="admin-hamburger" aria-label="Toggle sidebar" onClick={() => setSidebarOpen(o => !o)}>
				{sidebarOpen ? <span>&#10005;</span> : <span>&#9776;</span>}
			</button>

			<Sidebar />

			<div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: 0, marginLeft: isMobile ? 0 : sidebarWidth, height: '100vh', overflowY: 'auto' }}>
				<div className="topbar" style={{ position: 'fixed', left: isMobile ? 0 : sidebarWidth, right: 0, top: 0, height: headerHeight, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', zIndex: 500 }}>
					<h1 style={{ fontSize: '1.7rem', margin: 0 }}>Program Head Dashboard</h1>
					<div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
						{/* Notification bell removed per request */}

						<button onClick={() => setShowLogoutConfirm(true)} className="btn btn-danger">Logout</button>
					</div>
				</div>

				<div className="main-content" style={{ flex: 1, marginTop: headerHeight }}>
					{renderContent()}
				</div>
			</div>

			{/* Welcome overlay: appears above the page when activeSection === 'welcome' */}
			{activeSection === 'welcome' && (
				<div style={{ position: 'fixed', inset: 0, background: 'rgba(23, 2, 2, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 14000 }}>
					<div style={{ width: 'min(920px, 96%)', maxHeight: '86vh', overflowY: 'auto', background: '#c0cad8f8', borderRadius: 12, padding: 18, boxShadow: '0 18px 60px rgba(4, 0, 253, 0.6)', position: 'relative' }}>
						<button onClick={() => setActiveSection('dashboard')} style={{ position: 'absolute', right: 12, top: 12, border: 'none', color: '#000000ff',background: 'transparent', fontSize: 20, cursor: 'pointer' }} aria-label="Close">×</button>
						<div style={{ display: 'flex', gap: 18, alignItems: 'center', flexDirection: isMobile ? 'column' : 'row' }}>
							<div style={{ flex: '0 0 220px' }}>
								<img src="/logo_hanap.jpg" alt="Welcome" style={{ width: '100%', height: 'auto', borderRadius: 8, objectFit: 'cover' }} />
							</div>
							<div style={{ flex: 1 }}>
								<h2 style={{ margin: 0 }}>Welcome, {user && user.username ? user.username : 'Program Head'}!</h2>
								<p style={{ color: '#0b0b0cff', marginTop: 8 }}>You're signed in to the Program Head dashboard.</p>
								<div style={{ marginTop: 30, display: 'flex', gap: 20 }}>
									<button onClick={handleContinueFromWelcome} className="btn btn-outline" style={{ color: '#ffffffff', backgroundColor: '#0c51b1f8' }}>Continue to dashboard</button>
									
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Logout confirmation overlay */}
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

export default ProgramHeadDashboard;
