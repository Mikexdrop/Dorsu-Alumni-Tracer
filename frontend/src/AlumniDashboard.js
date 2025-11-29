import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import PostModal from './components/PostModal';
// getAlumniSections was previously used to render dynamic content sections,
// but the current dashboard renders `MainBody` directly. Keep import removed
// to avoid unused-variable ESLint warnings.
import Footer from './Footer';
import MainBody from './MainBody';
import Academics from './Academics';
import About from './About';
import Contact from './Contact';
import AlumniProfilePanel from './AlumniProfilePanel';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';


// ContentCard removed (was defined but not used) to fix ESLint no-unused-vars warnings.

function AlumniDashboard({ user, onLogout }) {
	const [activeSection, setActiveSection] = useState('home');
	// Previously used to get section title/content; not needed when rendering MainBody
	const location = useLocation();
	const navigate = useNavigate();
	const hideNav = location && typeof location.pathname === 'string' && location.pathname.includes('/surveys');

	const [showMenu, setShowMenu] = useState(false);
	// ref to the menu button / menu area so we can detect outside clicks
	const menuRef = useRef(null);
    // ref for the mobile hamburger container
    const hamburgerRef = useRef(null);
	// ref to the floating menu element (when rendered fixed) so we can measure it
	const menuElRef = useRef(null);
	// ref for the notifications button + dropdown wrapper (removed)
    // ref for the inline search input
    const searchRef = useRef(null);
	// placeholder for removed notifications UI to avoid runtime ReferenceErrors
	// eslint-disable-next-line no-unused-vars
	const [showNotifications, setShowNotifications] = useState(false);
	// computed style for the floating menu to keep it inside the viewport
	// eslint-disable-next-line no-unused-vars
	const [menuStyle, setMenuStyle] = useState(null);

	// portal positioning for the menu dropdown (avoid clipping by sticky nav)
	const [menuPortalStyle, setMenuPortalStyle] = useState(null);

	// update portal position based on button bounding rect
	useEffect(() => {
		function updatePositions() {
			try {
				// notification button removed; keep only menu portal positioning
				if (menuRef && menuRef.current) {
					const btn2 = menuRef.current.querySelector('button') || menuRef.current;
					const r2 = btn2.getBoundingClientRect();
					setMenuPortalStyle({ position: 'fixed', top: r2.bottom + 8 + 'px', left: Math.max(8, r2.right - 220) + 'px', zIndex: 2200 });
				}
			} catch (e) {
				// ignore
			}
		}
		if (showMenu) updatePositions();
		window.addEventListener('resize', updatePositions);
		window.addEventListener('scroll', updatePositions, true);
		return () => {
			window.removeEventListener('resize', updatePositions);
			window.removeEventListener('scroll', updatePositions, true);
		};
	}, [showMenu]);

	// Close the top-right menu or the notifications dropdown when clicking/tapping outside
	useEffect(() => {
		if (!showMenu) return;

		const onDocClick = (e) => {
			try {
				// If click is inside the avatar/menu wrapper or inside the floating menu element, do nothing
				if (menuRef && menuRef.current && menuRef.current.contains(e.target)) return;
				if (menuElRef && menuElRef.current && menuElRef.current.contains(e.target)) return;
				// notifications feature removed — treat clicks as falling through to close menu
				// otherwise close only the profile menu; keep notifications visible unless user closes it explicitly
				setShowMenu(false);
			} catch (err) {
				// swallow errors
			}
		};

		// Use both click and touchend for broader mobile support
		document.addEventListener('click', onDocClick, true);
		document.addEventListener('touchend', onDocClick, true);

		return () => {
			document.removeEventListener('click', onDocClick, true);
			document.removeEventListener('touchend', onDocClick, true);
		};
	}, [showMenu]);
	// notifications feature removed
	// setDarkMode is intentionally unused here (darkMode remains read-only for styling)
	// eslint-disable-next-line no-unused-vars
	const [darkMode, setDarkMode] = useState(false);
	const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
	// responsive flag (used to adjust modal layout on small viewports)
	const [isMobileConfirm, setIsMobileConfirm] = useState(() => {
		try { return typeof window !== 'undefined' && window.innerWidth <= 520; } catch (e) { return false; }
	});
	useEffect(() => {
		function onResize() {
			try { setIsMobileConfirm(window.innerWidth <= 520); } catch (e) { }
		}
		window.addEventListener('resize', onResize);
		onResize();
		return () => window.removeEventListener('resize', onResize);
	}, []);
	const [showConsent, setShowConsent] = useState(false);
	// Safe logout helper: call onLogout if provided, otherwise fallback to clearing local state
	const safeLogout = () => {
		if (typeof onLogout === 'function') {
			onLogout();
		} else {
			// Fallback behavior: clear stored user and reload to landing
			try {
				localStorage.removeItem('currentUser');
				localStorage.removeItem('userType');
			} catch (err) {
				console.warn('safeLogout fallback failed to clear storage', err);
			}
			window.location.href = '/';
		}
	};

	// Refresh avatar/profile helper (used by header refresh control)
	const [refreshingAvatar, setRefreshingAvatar] = useState(false);

	function refreshAvatarHeader() {
		try {
			const id = (currentUserState && (currentUserState.id || currentUserState.user_id)) || localStorage.getItem('userId');
			if (!id) return;
			setRefreshingAvatar(true);
			fetchProfileById(id).then(u => {
				if (u) {
					setCurrentUserState(u);
					try { localStorage.setItem('currentUser', JSON.stringify(u)); } catch (_) {}
					setAvatarError(false);
				}
			}).catch(_ => {}).finally(() => { try { setRefreshingAvatar(false); } catch(_){} });
		} catch (_) { try { setRefreshingAvatar(false); } catch(_){} }
	}
	
	const [showSearch, setShowSearch] = useState(false);
	// Inline icon-triggered search (separate from the full-screen search modal)
	const [showInlineSearch, setShowInlineSearch] = useState(false);
	// transient search button animation trigger
	const [searchAnim, setSearchAnim] = useState(false);
	// honor user's reduced-motion preference
	const prefersReducedMotionRef = useRef(false);
	useEffect(() => {
		try {
			const mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
			if (mq) {
				prefersReducedMotionRef.current = !!mq.matches;
				const onChange = () => { prefersReducedMotionRef.current = !!mq.matches; };
				mq.addEventListener ? mq.addEventListener('change', onChange) : mq.addListener(onChange);
				return () => { try { mq.removeEventListener ? mq.removeEventListener('change', onChange) : mq.removeListener(onChange); } catch(_){} };
			}
		} catch(_) {}
	}, []);
	// mobile nav panel
	const [showMobileNav, setShowMobileNav] = useState(false);
	const [searchValue, setSearchValue] = useState('');
	const [showSearchMsg, setShowSearchMsg] = useState(false);
	// transient animation flag for profile entrance
	const [profileAnim, setProfileAnim] = useState(false);
	// autocomplete state
	const SUGGESTIONS = [
		{ key: 'academics', label: 'Academics' },
		{ key: 'about', label: 'About' },
		{ key: 'contact', label: 'Contact' },
		// notifications removed from UI; omit from suggestions
		{ key: 'profile', label: 'Profile' },
		{ key: 'privacy', label: 'Data Privacy Notice' },
		{ key: 'dashboard', label: 'Dashboard' }
	];
	const [filteredSuggestions, setFilteredSuggestions] = useState([]);
	const [suggestOpen, setSuggestOpen] = useState(false);
	const [suggestIndex, setSuggestIndex] = useState(-1);

	// Post modal state and form (moved here so JSX sees these variables)
	const [showPostModal, setShowPostModal] = useState(false);
	const [postText, setPostText] = useState('');
	const [postImage, setPostImage] = useState(null);
	const [postImagePreview, setPostImagePreview] = useState(null);

	function handlePostImage(e) {
		const file = e.target.files && e.target.files[0];
		if (!file) return;
		setPostImage(file);
		const reader = new FileReader();
		reader.onload = () => setPostImagePreview(reader.result);
		reader.readAsDataURL(file);
	}

	function resetPostModal() {
		setShowPostModal(false);
		setPostText('');
		setPostImage(null);
		setPostImagePreview(null);
	}

	function submitPost() {
		// placeholder: actual submit should POST to backend
		console.log('submit post', { postText, postImage });
		resetPostModal();
	}

	// Avatar handling: keep an internal currentUserState so header can update when
	// profile panel writes to localStorage/currentUser and dispatches events.
	const [avatarError, setAvatarError] = useState(false);
	const [currentUserState, setCurrentUserState] = useState(() => {
		try {
			// prefer the `user` prop (fresh from parent) but fall back to stored value
			if (user) return user;
			const raw = localStorage.getItem('currentUser');
			return raw ? JSON.parse(raw) : null;
		} catch (err) {
			return user || null;
		}
	});

	// keep in sync when parent prop changes
// helper to detect whether a user object contains an image
function hasImage(u) {
	if (!u) return false;
	try {
		if (typeof u.image === 'string' && u.image.trim() !== '') return true;
		if (u.image && typeof u.image === 'object' && typeof u.image.url === 'string' && u.image.url.trim() !== '') return true;
		if (typeof u.profile_image === 'string' && u.profile_image.trim() !== '') return true;
		if (u.profile_image && typeof u.profile_image === 'object' && typeof u.profile_image.url === 'string' && u.profile_image.url.trim() !== '') return true;
		if (u.profile && typeof u.profile.image === 'string' && u.profile.image.trim() !== '') return true;
		if (u.profile && u.profile.image && typeof u.profile.image.url === 'string' && u.profile.image.url.trim() !== '') return true;
	} catch (e) {}
	return false;
}

// Fetch profile by id (tries token formats then unauthenticated)
const fetchProfileById = useCallback(async function (id) {
	if (!id) return null;
	const base = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';
	// try token formats
	let token = localStorage.getItem('token');
	const maxPoll = 3;
	for (let i = 0; i < maxPoll && !token; i++) {
		// eslint-disable-next-line no-await-in-loop
		await new Promise(r => setTimeout(r, 250));
		token = localStorage.getItem('token');
	}
	const url = `${base}/api/alumni/${id}/`;
	if (token) {
		try {
			let res = await fetch(url, { headers: { Authorization: `Token ${token}` } });
			if (res && res.ok) return ensureAbsImage(await res.json(), base);
		} catch (_) {}
		try {
			let res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
			if (res && res.ok) return ensureAbsImage(await res.json(), base);
		} catch (_) {}
	}
	// last resort: unauthenticated
	try {
		let res = await fetch(url);
		if (res && res.ok) {
			const data = await res.json();
			return ensureAbsImage(data, base);
		}
	} catch (_) {}
	return null;
	}, []);

// Ensure any image fields on the profile-like object are absolute URLs
function ensureAbsImage(obj, base) {
	if (!obj) return obj;
	base = base || (process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000');
	try {
		if (typeof obj.image === 'string') {
			const s = obj.image.trim();
			if (s && s.startsWith('/')) obj.image = `${base}${s}`;
		} else if (obj.image && typeof obj.image === 'object' && typeof obj.image.url === 'string') {
			const s = obj.image.url.trim();
			obj.image = s.startsWith('/') ? `${base}${s}` : s;
		}
		if (obj.profile && typeof obj.profile === 'object') {
			if (typeof obj.profile.image === 'string') {
				const s2 = obj.profile.image.trim();
				if (s2 && s2.startsWith('/')) obj.profile.image = `${base}${s2}`;
			} else if (obj.profile.image && typeof obj.profile.image === 'object' && typeof obj.profile.image.url === 'string') {
				const s2 = obj.profile.image.url.trim();
				obj.profile.image = s2.startsWith('/') ? `${base}${s2}` : s2;
			}
		}
	} catch (_) {}
	return obj;
}

// helpers for read/unread persistence (per-user)

// viewPost modal state (notifications removed — keep post modal state)
const [viewPostModalOpen, setViewPostModalOpen] = useState(false);
const [viewPostSelected, setViewPostSelected] = useState(null);
const [viewModalLightboxIndex, setViewModalLightboxIndex] = useState(null);

// Simple confirmation toast state
const [showToast, setShowToast] = useState(false);
// setToastMessage is intentionally unused in this file for now (kept for future toast updates)
// eslint-disable-next-line no-unused-vars
const [toastMessage, setToastMessage] = useState('');

React.useEffect(() => {
    if (!showToast) return undefined;
    const t = setTimeout(() => setShowToast(false), 3000);
    return () => clearTimeout(t);
}, [showToast]);

useEffect(() => {
	// try to ensure the canonical currentUserState has an image when possible
	async function ensureUserState() {
		try {
			if (!user) {
				// if parent provides no user, prefer stored currentUser if any
				const raw = localStorage.getItem('currentUser');
				if (raw) {
					setCurrentUserState(JSON.parse(raw));
				}
				return;
			}

			// if the incoming user already has an image, use and persist it
			if (hasImage(user)) {
				setCurrentUserState(user);
				try { localStorage.setItem('currentUser', JSON.stringify(user)); } catch (_) {}
				return;
			}

			// if we have a stored currentUser for the same id with an image, prefer that
			try {
				const raw = localStorage.getItem('currentUser');
				if (raw) {
					const stored = JSON.parse(raw);
					if (stored && (stored.id === user.id || stored.user_id === user.id || stored.id === (user.user_id)) && hasImage(stored)) {
						setCurrentUserState(stored);
						return;
					}
				}
			} catch (_) {}

			// otherwise attempt to fetch the full profile from the API.
			// Robustness: retry a few times waiting for token to appear, try both
			// `Token` and `Bearer` header formats, and fall back to unauthenticated fetch.
			try {
				const id = user.id || user.user_id || localStorage.getItem('userId');
				if (id) {
					const base = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';

					async function fetchProfileWithAuth(token) {
						const url = `${base}/api/alumni/${id}/`;
						// try Token
						try {
							let res = await fetch(url, { headers: { Authorization: `Token ${token}` } });
							if (res && res.ok) return await res.json();
						} catch (e) { /* ignore */ }
						// try Bearer
						try {
							let res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
							if (res && res.ok) return await res.json();
						} catch (e) { /* ignore */ }
						return null;
					}

					// If token isn't available yet, poll a few times (common during fast login flows)
					let token = localStorage.getItem('token');
					const maxPoll = 4;
					for (let attempt = 0; attempt < maxPoll; attempt++) {
						if (token) break;
						// wait 300ms then re-check
						// eslint-disable-next-line no-await-in-loop
						await new Promise(r => setTimeout(r, 300));
						token = localStorage.getItem('token');
					}

					let updated = null;
					if (token) {
						try {
							updated = await fetchProfileWithAuth(token);
						} catch (e) {
							// ignore
						}
					}

					// If auth fetch failed or no token, try unauthenticated fetch as a last resort
					if (!updated) {
						try {
							const res = await fetch(`${base}/api/alumni/${id}/`);
							if (res && res.ok) updated = await res.json();
						} catch (e) {
							// ignore
						}
					}

					if (updated) {
						// Persist richer profile if it contains more fields
						setCurrentUserState(updated);
						try { localStorage.setItem('currentUser', JSON.stringify(updated)); } catch (_) {}
						return;
					}
				}
			} catch (e) {
				// ignore but log for diagnostics
				try { console.debug('AlumniDashboard: profile fetch error', e); } catch (_) {}
			}

			// fallback to whatever parent gave us
			setCurrentUserState(user);
		} catch (err) {
			// ignore and keep previous state
		}
	}
	ensureUserState();
}, [user, fetchProfileById]);

// Close inline search when clicking outside or pressing Escape
useEffect(() => {
	if (!showInlineSearch) return undefined;
	function onDoc(e) {
		try {
			if (searchRef && searchRef.current && searchRef.current.contains && searchRef.current.contains(e.target)) return;
			// click outside -> close
			setShowInlineSearch(false);
			setSuggestOpen(false);
		} catch (_) {}
	}
	function onKey(e) {
		if (e.key === 'Escape') {
			setShowInlineSearch(false);
			setSuggestOpen(false);
		}
	}
	document.addEventListener('click', onDoc, true);
	document.addEventListener('keydown', onKey, true);
	return () => {
		document.removeEventListener('click', onDoc, true);
		document.removeEventListener('keydown', onKey, true);
	};
}, [showInlineSearch]);

// Close mobile nav on outside click or Escape
useEffect(() => {
	if (!showMobileNav) return undefined;
	function onDoc(e) {
		try {
			if (hamburgerRef && hamburgerRef.current && hamburgerRef.current.contains && hamburgerRef.current.contains(e.target)) return;
			setShowMobileNav(false);
		} catch (_) {}
	}
	function onKey(e) {
		if (e.key === 'Escape') setShowMobileNav(false);
	}
	document.addEventListener('click', onDoc, true);
	document.addEventListener('touchend', onDoc, true);
	document.addEventListener('keydown', onKey, true);
	return () => {
		document.removeEventListener('click', onDoc, true);
		document.removeEventListener('touchend', onDoc, true);
		document.removeEventListener('keydown', onKey, true);
	};
}, [showMobileNav]);

	// read-notifications persistence removed

	// robust avatar derivation from the canonical currentUserState
	// Try multiple common keys and preload each candidate; pick the first that loads.
	const [avatarSrc, setAvatarSrc] = React.useState(null);
	// debug state: enable by setting localStorage.debugAvatar = 'true'
	const debugAvatar = (() => {
		try { return localStorage.getItem('debugAvatar') === 'true'; } catch (_) { return false; }
	})();
	const [debugInfo, setDebugInfo] = useState({});
	React.useEffect(() => {
		setAvatarSrc(null);
		setAvatarError(false);
		const u = currentUserState;
		if (!u) return;

		const base = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';

		// helper to normalize candidate into absolute URLs to try
		function toUrl(candidate) {
			if (!candidate) return null;
			if (typeof candidate === 'object') {
				// nested shapes: look for common properties
				for (const k of ['url', 'image', 'src', 'path']) {
					if (candidate[k] && typeof candidate[k] === 'string') return toUrl(candidate[k]);
				}
				return null;
			}
			const s = String(candidate).trim();
			if (!s) return null;
			if (/^https?:\/\//i.test(s) || s.startsWith('data:')) return s;
			if (s.startsWith('/')) return `${base}${s}`;
			return `${base}/${s}`;
		}

		// collect many potential fields where an avatar might be stored
		const candidates = [];
		try {
			// top-level common keys
			for (const k of ['image', 'profile_image', 'avatar', 'photo', 'picture', 'image_url', 'img']) {
				if (k in u) candidates.push(u[k]);
			}
			// nested user.profile or profile.image
			if (u.profile && typeof u.profile === 'object') {
				for (const k of ['image', 'avatar', 'photo', 'picture']) {
					if (k in u.profile) candidates.push(u.profile[k]);
				}
			}
			// some APIs nest user under `user` or `data`
			if (u.user && typeof u.user === 'object') {
				for (const k of ['image', 'profile_image', 'avatar']) {
					if (k in u.user) candidates.push(u.user[k]);
				}
				if (u.user.profile && typeof u.user.profile === 'object') {
					for (const k of ['image', 'avatar']) if (k in u.user.profile) candidates.push(u.user.profile[k]);
				}
			}
		} catch (_) {}

		// Also allow a string that may contain the full object as JSON
		if (typeof u === 'string') {
			try { const parsed = JSON.parse(u); if (parsed) { for (const k of ['image','profile_image']) if (parsed[k]) candidates.push(parsed[k]); } } catch(_){}
		}

		// Final fallback: if the stored currentUser has id and no image, attempt fetch by id
		if (candidates.length === 0) {
			const id = u.id || u.user_id || localStorage.getItem('userId');
			if (id) candidates.push(`${base}/api/alumni/${id}/image`);
		}

		const urls = candidates.map(toUrl).filter(Boolean);
		// capture debug info for inspection
		if (debugAvatar) {
			try { setDebugInfo({ rawUser: u, candidates, urls }); console.debug('Avatar debug: user', u, 'candidates', candidates, 'urls', urls); } catch (_) {}
		}
		if (urls.length === 0) {
			setAvatarSrc(null);
			setAvatarError(false);
			return;
		}

		let cancelled = false;
		// Try to preload each URL sequentially; first that loads wins
		(async () => {
			for (const url of urls) {
				if (cancelled) return;
				try {
					await new Promise((resolve, reject) => {
						const img = new Image();
						img.onload = () => resolve(true);
						img.onerror = () => reject(new Error('failed'));
						img.src = url;
					});
					if (!cancelled) {
						setAvatarSrc(url);
						setAvatarError(false);
						if (debugAvatar) { try { setDebugInfo(prev => ({ ...prev, chosen: url })); console.debug('Avatar debug: chosen', url); } catch(_){} }
						return;
					}
				} catch (_) {
					// try next
					if (debugAvatar) { try { setDebugInfo(prev => ({ ...prev, failed: [...(prev.failed||[]), url] })); console.debug('Avatar debug: failed', url); } catch(_){} }
				}
			}
			if (!cancelled) {
				// All preloads failed. As a safer fallback, set avatarSrc to the first
				// candidate URL anyway (it may still render even if Image preloading
				// reported an error in some environments). This prevents the avatar
				// disappearing on refresh in common setups where relative -> absolute
				// normalization is sufficient but preloading can be flaky.
				if (urls && urls.length > 0) {
					setAvatarSrc(urls[0]);
					setAvatarError(false);
					if (debugAvatar) { try { setDebugInfo(prev => ({ ...prev, chosen: null, fallbackUsed: urls[0] })); console.debug('Avatar debug: none preloaded; using fallback', urls[0]); } catch(_){} }
				} else {
					setAvatarSrc(null);
					setAvatarError(true);
					if (debugAvatar) { try { setDebugInfo(prev => ({ ...prev, chosen: null })); console.debug('Avatar debug: none of the urls worked'); } catch(_){} }
				}
			}
		})();

		return () => { cancelled = true; };
	}, [currentUserState, setAvatarError, debugAvatar]);

// Notifications removed; fetch effect deleted

	// Listen for profile updates made by AlumniProfilePanel (same-tab) and also
	// handle cross-tab storage events. Reset avatarError when updates occur.
	React.useEffect(() => {
		function onUserUpdated(e) {
			try {
				const updated = e && e.detail ? e.detail : null;
				// if detail not provided, try reading from localStorage
				if (!updated) {
					const raw = localStorage.getItem('currentUser');
					if (raw) {
						setCurrentUserState(JSON.parse(raw));
						setAvatarError(false);
						return;
					}
					return;
				}
				setCurrentUserState(updated);
				setAvatarError(false);
			} catch (err) {
				// ignore
			}
		}

		function onStorage(e) {
			try {
				if (e.key === 'currentUser') {
					if (!e.newValue) {
						setCurrentUserState(null);
						setAvatarError(false);
						return;
					}
					setCurrentUserState(JSON.parse(e.newValue));
					setAvatarError(false);
				}
				// when token is stored (login finished), try fetching a richer profile
				if (e.key === 'token') {
					try {
						// read the stored currentUser or fallback to userId; avoid using
						// currentUserState closure reference so effect deps can be []
						let id = null;
						try {
							const raw = localStorage.getItem('currentUser');
							if (raw) {
								const parsed = JSON.parse(raw);
								id = parsed && (parsed.id || parsed.user_id) ? (parsed.id || parsed.user_id) : null;
							}
						} catch (_) {}
						if (!id) id = localStorage.getItem('userId');
						if (id) {
							fetchProfileById(id).then(updated => {
								if (updated) {
									setCurrentUserState(updated);
									try { localStorage.setItem('currentUser', JSON.stringify(updated)); } catch (_) {}
								}
							});
						}
					} catch (_) {}
				}
			} catch (_) {}
		}

			window.addEventListener('user-updated', onUserUpdated);
			window.addEventListener('storage', onStorage);
			return () => {
				window.removeEventListener('user-updated', onUserUpdated);
				window.removeEventListener('storage', onStorage);
			};
	}, [fetchProfileById]);

	// Header collapse behavior removed: header will use static (non-collapsed) styles

	// Sync activeSection with the current pathname so /Academics etc show the right panel
	useEffect(() => {
		try {
			let p = (location && location.pathname) ? location.pathname : '';
			// normalize: strip leading /alumni if present and lowercase for comparison
			if (p.toLowerCase().startsWith('/alumni/')) {
				p = p.slice('/alumni'.length);
			}
			const np = p.toLowerCase();
			if (np.startsWith('/academics') || np === '/academics') setActiveSection('academics');
			else if (np.startsWith('/about') || np === '/about') setActiveSection('about');
			else if (np.startsWith('/contact') || np === '/contact') setActiveSection('contact');
			else if (np.startsWith('/profile') || np === '/profile') setActiveSection('profile');
			else setActiveSection('home');
		} catch (_) {
			setActiveSection('home');
		}
	}, [location]);

// Trigger a small entrance animation when the profile section becomes active
useEffect(() => {
	try {
		const p = (location && location.pathname) ? String(location.pathname).toLowerCase() : '';
		const isProfile = activeSection === 'profile' || p.includes('/profile');
		if (!isProfile) return;
		if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			// user prefers reduced motion — do not animate
			return;
		}
	setProfileAnim(true);
	const t = setTimeout(() => setProfileAnim(false), 4200);
		return () => clearTimeout(t);
	} catch (_) {}
}, [activeSection, location]);

	// performSearch: interpret a user query and navigate/open the matching section
	const performSearch = (rawQuery) => {
		const q = (rawQuery || searchValue || '').toString().trim().toLowerCase();
		if (!q) {
			setShowSearchMsg(true);
			return;
		}
		try {
			if (q.includes('academ')) {
				setActiveSection('academics');
				setSearchValue('');
				navigate('/alumni/Academics');
				return;
			}
			if (q.includes('about')) {
				setActiveSection('about');
				setSearchValue('');
				navigate('/alumni/About');
				return;
			}
			if (q.includes('contact')) {
				setActiveSection('contact');
				setSearchValue('');
				navigate('/alumni/Contact');
				return;
			}
			if (q.includes('notif') || q.includes('inbox') || q.includes('notification')) {
				// Notifications UI removed; suggest profile as a fallback
				setShowSearchMsg(true);
				setSearchValue('');
				return;
			}
			if (q.includes('profile') || q.includes('account') || q.includes('my profile')) {
				setActiveSection('profile');
				setSearchValue('');
				try { navigate('/alumni/profile'); } catch (_) { window.location.href = '/alumni/profile'; }
				return;
			}
			if (q.includes('privacy') || q.includes('data privacy') || q.includes('privac') || q.includes('privacity')) {
				// open external data privacy notice
				window.open('https://www.privacy.gov.ph/data-privacy-act/', '_blank');
				setSearchValue('');
				return;
			}
			if (q.includes('home') || q.includes('dashboard')) {
				setActiveSection('home');
				setSearchValue('');
				navigate('/alumni/Dashboard');
				return;
			}
		} catch (e) {
			console.warn('search navigation failed', e);
		}
		// fallback: show a small message for no results
		setShowSearchMsg(true);
	};
		   return (
			   <div style={{
				   minHeight: '100vh',
				   display: 'flex',
				   flexDirection: 'column',
				   paddingBottom: 16,
				   background: darkMode ? '#181818' : '#f7f7f7',
				   color: darkMode ? '#fff' : '#222',
				   fontFamily: 'Arial, sans-serif',
				   transition: 'background 0.3s, color 0.3s'
			   }}>
				   <style>{`
					   @media (max-width: 800px) {
						   .alumni-header {
							   flex-direction: column !important;
							   align-items: flex-start !important;
							   padding: 0 8px !important;
							   min-height: 70px !important;
						   }
						   .alumni-logo-title {
							   flex-direction: row !important;
							   align-items: center !important;
							   margin-bottom: 0 !important;
						   }
						   .alumni-logo-title img {
							   height: 48px !important;
							   width: 48px !important;
							   margin-right: 12px !important;
						   }
						   .alumni-title-main {
							   font-size: 18px !important;
						   }
						   .alumni-title-sub {
							   font-size: 12px !important;
						   }
						   .alumni-content {
							   padding: 12px 4px !important;
						   }
						   .alumni-bottom-nav {
							   height: 54px !important;
							   padding: 6px 0 !important;
						   }
						   .alumni-bottom-nav button {
							   font-size: 11px !important;
							   min-width: 48px;
						   }
						   .alumni-header-right {
							   flex-direction: row !important;
							   align-items: center !important;
							   justify-content: flex-end !important;
							   width: 100% !important;
							   margin-top: 8px !important;
						   }
					   }

					   @media (max-width: 500px) {
						   .alumni-header {
							   min-height: 48px !important;
						   }
						   .alumni-logo-title img {
							   height: 32px !important;
							   width: 32px !important;
						   }
					   }
					   @media (max-width: 480px) {
						   .alumni-header { padding: 6px 6px !important; }
						   .alumni-logo-title img { height: 28px !important; width: 28px !important; margin-right: 8px !important; }
						   .alumni-title-main { font-size: 14px !important; }
						   .alumni-title-sub { display: none !important; }
						   .alumni-header-right { margin-top: 6px !important; gap: 6px !important; }
						   .alumni-content { padding: 8px !important; }
					   }

					/* Mobile nav: show hamburger and hide centered links */
					@media (max-width: 800px) {
						.alumni-nav-links { display: none !important; }
						.alumni-hamburger { display: block !important; }
						.alumni-mobile-panel { position: relative; }
					}

					/* ContentCard entrance */
					.content-card { opacity: 0; transform: translateY(8px) scale(0.996); }
					.content-card.entered { opacity: 1; transform: translateY(0) scale(1); }
					@media (prefers-reduced-motion: reduce) {
						.content-card, .content-card.entered { transition: none !important; transform: none !important; }
					}

						/* Nav link styles (from Header.js) */
						.nav-link {
							color: #fff;
							font-weight: bold;
							font-size: 18px;
							text-decoration: none;
							letter-spacing: 1px;
							transition: color 0.2s, background 0.2s, box-shadow 0.2s;
							padding: 8px 18px;
							border-radius: 8px;
							cursor: pointer;
							background: transparent;
							border: 1px solid transparent;
						}
						.nav-link.active {
							background: #ffd600;
							color: #222 !important;
							box-shadow: 0 2px 8px #ffd60044;
						}
						.nav-link:hover { background: #ffd600; color: #222 !important; box-shadow: 0 2px 8px #ffd60044; }

						/* search button click animation */
						.search-btn { transition: transform 160ms ease; }
						.search-anim { animation: search-pop 360ms ease forwards; }
						@keyframes search-pop {
							0% { transform: scale(1); }
							40% { transform: scale(1.14); }
							70% { transform: scale(0.96); }
							100% { transform: scale(1); }
						}

						@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

						/* Profile panel entrance animation */
						.profile-enter { opacity: 0; transform: translateY(10px) scale(0.995); }
						.profile-enter.profile-enter-active { opacity: 1; transform: translateY(0) scale(1); transition: transform 420ms cubic-bezier(.2,.8,.2,1), opacity 360ms ease; }

						/* Slide profile left --> right over 4s */
						@keyframes profile-slide-lr { 0% { opacity: 0; transform: translateX(-24px) scale(0.995); } 50% { opacity: 0.6; transform: translateX(8px) scale(1.002); } 100% { opacity: 1; transform: translateX(0) scale(1); } }
						.profile-animate .profile-section { animation: profile-slide-lr 4s cubic-bezier(.2,.8,.2,1) both; }

						@media (prefers-reduced-motion: reduce) {
							.profile-enter, .profile-enter.profile-enter-active { transition: none !important; transform: none !important; }
						}

						@media (prefers-reduced-motion: reduce) {
							.search-anim { animation: none !important; }
							.search-btn { transition: none !important; transform: none !important; }
						}

						/* Sticky header and secondary nav */
						.alumni-header { position: sticky; top: 0; z-index: 1100; backdrop-filter: blur(4px); }
						.alumni-secondary-nav { position: sticky; top: 90px; z-index: 1090; }

						@media (max-width: 800px) {
							.alumni-secondary-nav { top: 70px; }
						}
						@media (max-width: 480px) {
							.alumni-secondary-nav { top: 56px; }
						}
				   `}</style>
				   <style>{`
					/* Home fullscreen helper: make the home content occupy the viewport height on small screens */
					.alumni-content.home-fullscreen { min-height: calc(100vh - 160px); display: flex; flex-direction: column; }
					@media (max-width: 800px) {
						.alumni-content.home-fullscreen { min-height: calc(100vh - 120px); }
					}
					@media (max-width: 480px) {
						.alumni-content.home-fullscreen { min-height: calc(100vh - 104px); }
					}
				   `}</style>
					{/* University Header */}
					<div className="alumni-header" style={{
						width: '100%',
						background: 'linear-gradient(90deg, #222 70%, #1976d2 100%)',
						color: '#fff',
						display: 'block',
						padding: 0,
						minHeight: 90,
						transition: 'min-height 280ms ease, padding 280ms ease, background 420ms ease',
						top: 0,
						zIndex: 100
					}}>
						{/* inner container aligns header content with page body/footer */}
						<div className="alumni-header-inner">
						   <div className="alumni-logo-title" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
							<img src="/image.png" alt="DORSU Logo" style={{ height: 80, width: 80, marginRight: 24, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 8px #0002', transition: 'width 280ms ease, height 280ms ease, margin 280ms ease' }} />
							   <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
								<span className="alumni-title-main" style={{ fontSize: 32, fontWeight: 'bold', color: '#ffd600', letterSpacing: 2, lineHeight: 1, transition: 'font-size 280ms ease' }}>DAVAO ORIENTAL STATE UNIVERSITY</span>
								<span className="alumni-title-sub" style={{ fontSize: 18, fontWeight: 'bold', color: '#fff', marginTop: 2, letterSpacing: 1, transition: 'font-size 280ms ease, margin 280ms ease' }}>
									   GUANG-GUANG, DAHICAN, CITY OF MATI, 8200 DAVAO ORIENTAL, PHILIPPINES
								   </span>
							   </div>
						   </div>
						   <div className="alumni-header-right" style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
							   {/* Profile avatar replaces hamburger icon: shows user's image or placeholder */}

							   {/* (Notification bell and search moved into the secondary nav for layout) */}
							   <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
								   <button
									   onClick={() => setShowMenu(m => !m)}
									   aria-label="Open menu"
									   style={{
										   padding: 0,
										   background: 'transparent',
										   border: 'none',
										   cursor: 'pointer',
										   marginRight: 24,
										   marginLeft: 4,
										   display: 'flex',
										   alignItems: 'center',
										   justifyContent: 'center'
									   }}
								   >
									   <div style={{
										   width: 60,
										   height: 60,
										   borderRadius: '50%',
										   overflow: 'hidden',
										   display: 'inline-block',
										   boxShadow: '0 2px 8px #0002',
										   background: '#fff'
									   }}>
										   {avatarSrc && !avatarError ? (
											   <img src={avatarSrc} alt="Profile" onError={() => setAvatarError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
										   ) : (
											   <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e6eef8' }}>
												   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
													   <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#1976d2" />
												   </svg>
											   </div>
										   )}
									   </div>
								   </button>
													  {/* small refresh icon near avatar (less prominent) */}
													  <button aria-label="Refresh avatar" title="Refresh avatar" onClick={() => { try { refreshAvatarHeader(); } catch(_){} }} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', position: 'absolute', right: 8, top: 6, width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
														  {refreshingAvatar ? (
															  <svg width="14" height="14" viewBox="0 0 50 50" style={{ animation: 'spin 800ms linear infinite' }}>
																  <circle cx="25" cy="25" r="20" fill="none" stroke="#1976d2" strokeWidth="4" strokeLinecap="round" strokeDasharray="31.4 31.4" transform="rotate(-90 25 25)" />
															  </svg>
														  ) : (
															  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 12a9 9 0 10-3.2 6.6" stroke="#1976d2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 3v6h-6" stroke="#1976d2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
														  )}
													  </button>
                                        {showMenu && (
                                        		ReactDOM.createPortal(
                                        			<div ref={menuElRef} style={{...(menuPortalStyle || {}), zIndex: 2200, background: darkMode ? '#222' : '#fff', border: '1px solid #eee', borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.12)', minWidth: 220, padding: '8px 0', color: darkMode ? '#fff' : '#222'}}>
										   <button
											   onClick={() => {
												   setActiveSection('profile');
												   setShowMenu(false);
												   try { navigate('/alumni/profile'); } catch (_) {}
											   }}
											   style={{
												   display: 'block',
												   width: '100%',
												   padding: '10px 24px',
												   background: 'none',
												   border: 'none',
												   textAlign: 'left',
												   cursor: 'pointer',
												   color: darkMode ? '#fff' : '#222',
												   fontSize: '16px'
											   }}
										   >
											   Manage Profile
										   </button>
										   <button
											   onClick={() => {
												   window.open('https://www.privacy.gov.ph/data-privacy-act/', '_blank');
												   setShowMenu(false);
											   }}
											   style={{
												   display: 'block',
												   width: '100%',
												   padding: '10px 24px',
												   background: 'none',
												   border: 'none',
												   textAlign: 'left',
												   cursor: 'pointer',
												   color: darkMode ? '#fff' : '#222',
												   fontSize: '16px'
											   }}
										   >
											   Data Privacy Notice
										   </button>
											{/* Dark Mode toggle removed from the avatar menu per request */}
										   <button
											   onClick={() => {
												   setShowLogoutConfirm(true);
												   setShowMenu(false);
											   }}
											   style={{
												   display: 'block',
												   width: '100%',
												   padding: '10px 24px',
												   background: 'none',
												   border: 'none',
												   textAlign: 'left',
												   cursor: 'pointer',
												   color: '#f44336',
												   fontSize: '16px'
											   }}
										   >
											   Logout
										   </button>
										   {/* Reduced to three buttons only: Manage Profile, Data Privacy Notice, Logout */}
										</div>, document.body
									)
									)}
							   </div>
						   </div>
							  </div>
							  <style>{`
								.alumni-header-inner { max-width: 1200px; margin: 0 auto; width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; box-sizing: border-box; }
								@media (max-width: 800px) {
									.alumni-header-inner { padding: 0 12px; }
								}
								@media (max-width: 480px) {
									.alumni-header-inner { padding: 0 8px; }
									.alumni-title-main { font-size: 18px !important; }
									.alumni-title-sub { display: none !important; }
								}
							`}</style>
						  </div>
						  {/* Secondary navigation bar placed below the header */}
					{!hideNav && (
						<div className="alumni-secondary-nav" style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							gap: 12,
							padding: '10px 16px',
							background: '#0b2b2b',
							boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
						}}>
							{/* Desktop links: hidden on small screens via CSS */}
							<div className="alumni-nav-links" style={{display:'flex', alignItems:'center', gap:8, flex: 1, justifyContent: 'center'}}>
								<span className={`nav-link home${activeSection === 'home' ? ' active' : ''}`} onClick={() => { setActiveSection('home'); try { window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }); } catch (_) {} navigate('/alumni/Dashboard'); }} style={{ marginRight: 8 }}>Home</span>
								<span className={`nav-link${activeSection === 'academics' ? ' active' : ''}`} onClick={() => { setActiveSection('academics'); try { window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }); } catch (_) {} navigate('/alumni/Academics'); }} style={{ marginRight: 8 }}>Academics</span>
								<span className={`nav-link${activeSection === 'about' ? ' active' : ''}`} onClick={() => { setActiveSection('about'); try { window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }); } catch (_) {} navigate('/alumni/About'); }} style={{ marginRight: 8 }}>About</span>
								<span className={`nav-link${activeSection === 'contact' ? ' active' : ''}`} onClick={() => { setActiveSection('contact'); try { window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }); } catch (_) {} navigate('/alumni/Contact'); }} style={{ marginRight: 8 }}>Contact</span>
							</div>

							{/* Mobile hamburger button (visible on small screens) */}
							<div ref={hamburgerRef} className="alumni-hamburger" style={{display:'none', position:'relative'}}>
								<button aria-label="Open navigation" onClick={() => setShowMobileNav(m => !m)} style={{background:'transparent', border:'none', color:'#fff', width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}>
									<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18M3 12h18M3 18h18" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
								</button>
								{showMobileNav && (
									<div className="alumni-mobile-panel" style={{position:'absolute', top:'4px', left:'calc(100% + 8px)', background:'#0b2b2b', zIndex:1200, padding:12, boxShadow:'0 8px 32px rgba(0,0,0,0.24)', minWidth:220, borderRadius:8}}>
										<div style={{display:'flex', flexDirection:'column', gap:8}}>
											{['Home','Academics','About','Contact'].map(label => {
												const key = label.toLowerCase();
												return (
													<span key={key} className={`nav-link${activeSection === key ? ' active' : ''}`} onClick={() => { setActiveSection(key === 'home' ? 'home' : key); setShowMobileNav(false); try { if (key === 'home') navigate('/alumni/Dashboard'); else navigate(`/alumni/${label}`); } catch(_){} }} style={{display:'block', padding: '8px 12px'}}>{label}</span>
												);
											})}

										</div>
									</div>
								)}
							</div>
							<div style={{display:'flex', alignItems:'center', gap:8}}>
								{/* notification removed */}
								{/* Search icon-only: toggles an expanding inline input */}
								<div style={{position:'relative', display:'flex', alignItems:'center'}}>
									<button
											aria-label="open search"
											title="Search"
											onClick={() => {
												// trigger a small pop animation unless the user prefers reduced motion
												try { if (!prefersReducedMotionRef.current) setSearchAnim(true); } catch(_){}
												setShowInlineSearch(s => !s);
												if (!showInlineSearch) { setTimeout(() => { try { searchRef && searchRef.current && searchRef.current.focus(); } catch(_){} }, 60); }
											}}
											onAnimationEnd={() => { try { setSearchAnim(false); } catch(_){} }}
											className={`search-btn${searchAnim ? ' search-anim' : ''}`}
											style={{
												display: 'inline-flex',
												alignItems: 'center',
												justifyContent: 'center',
												width: 40,
												height: 40,
												padding: 8,
												background: 'transparent',
												border: 'none',
												cursor: 'pointer'
											}}
										>
										<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
											<circle cx="11" cy="11" r="6" stroke="#fff" strokeWidth="1.8" fill="none" />
											<path d="M21 21l-4.35-4.35" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
										</svg>
									</button>
									{showInlineSearch && (
										<div style={{position:'relative', marginLeft:8}}>
											<input
												ref={el => { window.__ad_search_ref = el; if (searchRef) searchRef.current = el; }}
												type="text"
												value={searchValue}
												onChange={e => {
													const v = e.target.value;
													setSearchValue(v);
													if (!v || v.trim() === '') {
														setFilteredSuggestions([]);
														setSuggestOpen(false);
														setSuggestIndex(-1);
														return;
													}
													const q = v.trim().toLowerCase();
													const matches = SUGGESTIONS.filter(s => s.key.includes(q) || s.label.toLowerCase().includes(q));
													setFilteredSuggestions(matches);
													setSuggestOpen(matches.length > 0);
													setSuggestIndex(-1);
												}}
												onKeyDown={e => {
													if (!suggestOpen) {
														if (e.key === 'Escape') { setShowSearch(false); setSuggestOpen(false); }
														return;
													}
													if (e.key === 'ArrowDown') {
														e.preventDefault();
														setSuggestIndex(i => Math.min(i + 1, filteredSuggestions.length - 1));
													} else if (e.key === 'ArrowUp') {
														e.preventDefault();
														setSuggestIndex(i => Math.max(i - 1, 0));
													} else if (e.key === 'Enter') {
														if (suggestIndex >= 0 && filteredSuggestions[suggestIndex]) {
															performSearch(filteredSuggestions[suggestIndex].label);
															setSuggestOpen(false);
														} else {
															performSearch(searchValue);
														}
														e.preventDefault();
													}
												}}
												placeholder="Search"
												style={{
													border: '1px solid rgba(255,255,255,0.08)',
													borderRadius: 18,
													padding: '8px 12px',
													minWidth: 160,
													background: 'rgba(255,255,255,0.04)',
													color: '#fff'
												}}
											/>
											{suggestOpen && (
												<div role="listbox" aria-label="Search suggestions" style={{ position: 'absolute', top: 46, left: 0, background: darkMode ? '#111' : '#fff', border: '1px solid #eee', borderRadius: 8, boxShadow: '0 6px 24px rgba(0,0,0,0.12)', zIndex: 400, minWidth: 200 }}>
												{filteredSuggestions.map((s, i) => (
													<div
														key={s.key}
														role="option"
														aria-selected={i === suggestIndex}
														onMouseDown={ev => { ev.preventDefault(); performSearch(s.label); setSuggestOpen(false); setShowSearch(false); }}
														onMouseEnter={() => setSuggestIndex(i)}
														style={{ padding: '8px 12px', cursor: 'pointer', background: i === suggestIndex ? (darkMode ? '#111' : '#f3f4f6') : 'transparent', color: darkMode ? '#fff' : '#000' }}
													>
														{s.label}
													</div>
												))}
												</div>
											)}
										</div>
									)}
								</div>
							</div>
						</div>
					)}

			
					<div className={`alumni-content${profileAnim ? ' profile-animate' : ''}${activeSection === 'home' ? ' home-fullscreen' : ''}`} style={{
						marginBottom: 0
						}}>
							{/* DEBUG BANNER REMOVED */}
						<Outlet />
						{!hideNav && (
							<div>
								{activeSection === 'home' && <MainBody onGetStarted={() => setShowConsent(true)} />}
								{activeSection === 'academics' && <Academics />}
								{activeSection === 'about' && <About />}
								{activeSection === 'contact' && <Contact />}
								{activeSection === 'profile' && !(location && location.pathname && String(location.pathname).toLowerCase().includes('/profile')) && (
									<div className={`profile-enter${profileAnim ? ' profile-enter-active' : ''}`}>
										<AlumniProfilePanel userId={(currentUserState && (currentUserState.id || currentUserState.user_id)) || localStorage.getItem('userId')} />
									</div>
								)}
								{/* Fallback visible box to avoid an empty white screen in case routing or bundle
								   fails to render components. This is temporary and helpful for debugging. */}
								{activeSection !== 'home' && activeSection !== 'academics' && activeSection !== 'about' && activeSection !== 'contact' && activeSection !== 'profile' && (
									<div style={{padding:40, textAlign:'center', color: darkMode ? '#ddd' : '#333'}}>
										<h2>Welcome to the Alumni Dashboard</h2>
										<p>If you see this message the dashboard couldn't determine which section to show. Try using the navigation links above or reloading the page.</p>
									</div>
								)}
							</div>
						)}
			 		</div>
					{/* Logout Confirm Modal (Admin-style) */}
															{showLogoutConfirm && (
																<div
																	role="dialog"
																	aria-modal="true"
																	aria-label="Confirm logout"
																	style={{
																		position: 'fixed',
																		inset: 0,
																		background: 'rgba(0,0,0,0.45)',
																		display: 'flex',
																		alignItems: isMobileConfirm ? 'stretch' : 'center',
																		justifyContent: isMobileConfirm ? 'flex-start' : 'center',
																		zIndex: 15000,
																		padding: 0
																	}}
																>
																	<div
																		style={{
																			width: isMobileConfirm ? '100%' : 'min(520px, 94%)',
																			height: isMobileConfirm ? '100%' : 'auto',
																			background: '#fff',
																			borderRadius: isMobileConfirm ? 0 : 10,
																			padding: isMobileConfirm ? 0 : (isMobileConfirm ? 14 : 18),
																			boxShadow: isMobileConfirm ? 'none' : '0 18px 60px rgba(2,6,23,0.3)',
																			position: 'relative',
																			display: 'flex',
																			flexDirection: 'column',
																			justifyContent: 'center',
																			alignItems: 'stretch'
																		}}
																	>
																		<div style={{ padding: isMobileConfirm ? '18px 16px 12px' : undefined }}>
																			<h3 style={{ marginTop: 0, fontSize: isMobileConfirm ? 18 : 20, textAlign: 'center' }}>Confirm Logout</h3>
																			<p style={{ marginTop: 8, color: '#333', fontSize: isMobileConfirm ? 15 : 16, textAlign: 'center' }}>Are you sure you want to logout?</p>
																		</div>
																		<div style={{ flex: 1 }} />
																		<div style={{ display: 'flex', flexDirection: isMobileConfirm ? 'column-reverse' : 'row', gap: isMobileConfirm ? 0 : 10, marginTop: 0 }}>
																			<button
																				onClick={() => setShowLogoutConfirm(false)}
																				className="btn btn-outline"
																				style={{ width: isMobileConfirm ? '100%' : 'auto', borderRadius: isMobileConfirm ? 0 : undefined }}
																			>
																				Cancel
																			</button>
																			<button
																				onClick={() => { setShowLogoutConfirm(false); try { safeLogout(); } catch(e){} }}
																				className="btn btn-danger"
																				style={{ width: isMobileConfirm ? '100%' : 'auto', borderRadius: isMobileConfirm ? 0 : undefined }}
																			>
																				Logout
																			</button>
																		</div>
																	</div>
																</div>
															)}
					{/* Create Post Modal (Facebook-like) */}
					{showPostModal && (
						<div style={{
							position: 'fixed',
							inset: 0,
							background: 'rgba(0,0,0,0.35)',
							zIndex: 2200,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center'
						}}>
							<div style={{
								width: 'min(760px, 96%)',
								background: '#fff',
								borderRadius: 12,
								boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
								padding: 0,
								overflow: 'hidden'
							}}>
								<div style={{display:'flex', alignItems:'center', gap:12, padding:16, borderBottom:'1px solid #eee'}}>
									<div style={{width:48, height:48, borderRadius:24, overflow:'hidden', background:'#e6eef8'}}>
										{avatarSrc && !avatarError ? (
											<img src={avatarSrc} alt="me" style={{width:'100%', height:'100%', objectFit:'cover'}} />
										) : (
											<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#1976d2"/></svg>
										)}
										{viewPostModalOpen && viewPostSelected && (
											<PostModal
													selectedPost={viewPostSelected}
													onClose={() => { setViewPostModalOpen(false); setViewPostSelected(null); }}
													lightboxIndex={viewModalLightboxIndex}
													setLightboxIndex={setViewModalLightboxIndex}
												/>
										)}
										{/* Avatar debug panel (opt-in) */}
										{debugAvatar && (
											<div style={{position:'fixed', right:12, bottom:12, zIndex:3500, background:'#fff', border:'1px solid #eee', borderRadius:8, padding:12, boxShadow:'0 8px 30px rgba(0,0,0,0.12)', maxWidth:360}}>
												<div style={{fontWeight:700, marginBottom:8}}>Avatar Debug</div>
												<div style={{fontSize:12, color:'#444', marginBottom:8}}><strong>avatarSrc:</strong> {String(avatarSrc)}</div>
												<div style={{fontSize:12, color:'#444', marginBottom:8}}><strong>avatarError:</strong> {String(avatarError)}</div>
												<div style={{fontSize:12, color:'#444', maxHeight:220, overflow:'auto'}}>
													<pre style={{whiteSpace:'pre-wrap', fontSize:11, margin:0}}>{JSON.stringify(debugInfo, null, 2)}</pre>
												</div>
												<div style={{display:'flex', gap:8, marginTop:8}}>
													<button onClick={() => { try { localStorage.removeItem('debugAvatar'); window.location.reload(); } catch(_){} }} style={{flex:1}}>Disable</button>
													<button onClick={() => { try { const id = (currentUserState && (currentUserState.id || currentUserState.user_id)) || localStorage.getItem('userId'); if (id) fetchProfileById(id).then(u => { if (u) { setCurrentUserState(u); try { localStorage.setItem('currentUser', JSON.stringify(u)); } catch(_){} setAvatarError(false); } }); } catch(_){} }} style={{flex:1}}>Refresh</button>
												</div>
											</div>
										)}
									</div>
									<textarea value={postText} onChange={e=>setPostText(e.target.value)} placeholder="What's on your mind?" style={{flex:1, minHeight: 96, resize:'vertical', border:'none', outline:'none', fontSize:16, padding:'8px 12px'}} />
								</div>
								{/* preview image if attached */}
								{postImagePreview && (
									<div style={{padding:12}}>
										<img src={postImagePreview} alt="preview" style={{width:'100%', borderRadius:8, maxHeight:360, objectFit:'cover'}} />
									</div>
								)}
								<div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:12, borderTop:'1px solid #eee'}}>
									<div style={{display:'flex', gap:8, alignItems:'center'}}>
										<label style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer', color:'#1976d2'}}>
											<input type="file" accept="image/*" onChange={handlePostImage} style={{display:'none'}} />
											<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 19V5a2 2 0 0 0-2-2H5c-1.1 0-2 .9-2 2v14" stroke="#1976d2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
											<span style={{fontSize:14}}>Photo</span>
										</label>
									</div>
									<div style={{display:'flex', gap:12}}>
										<button onClick={resetPostModal} style={{padding:'8px 12px', borderRadius:8, border:'1px solid #ddd', background:'#fff', cursor:'pointer'}}>Cancel</button>
										<button onClick={submitPost} style={{padding:'8px 14px', borderRadius:8, border:'none', background:'#1976d2', color:'#fff', cursor:'pointer', fontWeight:700}}>Post</button>
									</div>
								</div>
							</div>
						</div>
					)}
					   {/* Search Modal */}
					   {showSearch && (
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
								   background: darkMode ? '#222' : '#fff',
								   color: darkMode ? '#fff' : '#222',
								   borderRadius: 12,
								   boxShadow: '0 4px 24px #0004',
								   padding: '32px 28px',
								   minWidth: 320,
								   textAlign: 'center',
								   border: '1px solid #eee'
							   }}>
								   <h2 style={{marginBottom: 18}}>Search</h2>
								   <input
									   type="text"
									   value={searchValue}
									   onChange={e => setSearchValue(e.target.value)}
									   placeholder="Type to search..."
									   style={{
										   width: '90%',
										   padding: '10px',
										   fontSize: '16px',
										   borderRadius: 6,
										   border: '1px solid #ccc',
										   marginBottom: 18
									   }}
								   />
								   <div style={{display: 'flex', justifyContent: 'center', gap: 24}}>
									   <button
										   onClick={() => setShowSearch(false)}
										   style={{
											   padding: '8px 24px',
											   background: darkMode ? '#444' : '#eee',
											   color: darkMode ? '#fff' : '#222',
											   border: 'none',
											   borderRadius: 6,
											   fontWeight: 'bold',
											   fontSize: '16px',
											   cursor: 'pointer',
											   boxShadow: '0 2px 8px #0002'
										   }}
									   >Close</button>
									   <button
										   onClick={() => {
											   setShowSearch(false);
										   }}
										   style={{
											   padding: '8px 24px',
											   background: '#1976d2',
											   color: '#fff',
											   border: 'none',
											   borderRadius: 6,
											   fontWeight: 'bold',
											   fontSize: '16px',
											   cursor: 'pointer',
											   boxShadow: '0 2px 8px #1976d222'
										   }}
									   >Search</button>
								   </div>
							   </div>
						   </div>
					   )}
					   {showSearchMsg && (
						   <div style={{position: 'fixed', left:0, top:0, right:0, bottom:0, background:'rgba(0,0,0,0.25)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2100}}>
							   <div style={{ background: '#fff', color: '#222', padding: 20, borderRadius: 10, minWidth: 320, textAlign: 'center' }}>
								   <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Search</div>
								   <div style={{ marginBottom: 12 }}>Searching for: {searchValue}</div>
								   <div style={{ display: 'flex', justifyContent: 'center' }}>
									   <button onClick={() => setShowSearchMsg(false)} className="btn btn-outline">OK</button>
								   </div>
							   </div>
						   </div>
					   )}
					{/* Confirmation toast */}
					{showToast && (
						<div onClick={() => setShowToast(false)} style={{position:'fixed', right:16, bottom:20, zIndex:3000, background:'#111827', color:'#fff', padding:'10px 14px', borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,0.24)', cursor:'pointer'}}>
							<div style={{fontWeight:700, fontSize:14}}>{toastMessage}</div>
						</div>
					)}
					{/* Privacy Consent Modal shown when user clicks Get Started */}
					{showConsent && (
						<div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems: isMobileConfirm ? 'flex-start' : 'center', justifyContent: 'center', paddingTop: isMobileConfirm ? 12 : 0, zIndex:3500}}>
							<div role="dialog" aria-modal="true" style={{
								width: isMobileConfirm ? '100%' : 'min(820px,96%)',
								maxHeight: '90vh',
								overflowY: 'auto',
								background: darkMode ? '#111' : '#fff',
								color: darkMode ? '#fff' : '#111',
								borderRadius: isMobileConfirm ? 0 : 12,
								boxShadow: isMobileConfirm ? 'none' : '0 12px 48px rgba(0,0,0,0.4)',
								padding: isMobileConfirm ? '14px 12px' : 20,
								boxSizing: 'border-box'
							}}>
								<h2 style={{marginTop:0, fontSize: isMobileConfirm ? 18 : 22}}>Privacy Notice and Consent Statement</h2>
								<p style={{lineHeight:1.6, fontSize: isMobileConfirm ? 15 : 16}}>
									You are invited to take part in the DOrSU Alumni Tracer Survey. Participation is completely voluntary. If you decide to proceed, you will be asked to answer a short survey, which will take about 5 to 10 minutes to complete.
								</p>
								<div style={{display:'flex', justifyContent: isMobileConfirm ? 'stretch' : 'flex-end', gap:12, marginTop:18, flexDirection: isMobileConfirm ? 'column-reverse' : 'row'}}>
									<button onClick={() => setShowConsent(false)} style={{padding:isMobileConfirm ? '14px 12px' : '8px 14px', borderRadius:isMobileConfirm ? 6 : 8, border:isMobileConfirm ? '1px solid rgba(0,0,0,0.12)' : '1px solid #111', background:isMobileConfirm ? (darkMode ? '#222' : '#fff') : 'transparent', color:isMobileConfirm ? (darkMode ? '#fff' : '#111') : '#111', cursor:'pointer', width: isMobileConfirm ? '100%' : 'auto'}}>Disagree</button>
									<button onClick={() => { setShowConsent(false); setActiveSection('surveys'); try { navigate('/alumni/surveys'); } catch (_) { window.location.href = '/alumni/surveys'; } }} style={{padding:isMobileConfirm ? '14px 12px' : '8px 14px', borderRadius:isMobileConfirm ? 6 : 8, border:'none', background:'#1976d2', color:'#fff', cursor:'pointer', width: isMobileConfirm ? '100%' : 'auto'}}>Agree</button>
								</div>
							</div>
						</div>
					)}
					<Footer />
			   </div>
		   );
}

export default AlumniDashboard;
