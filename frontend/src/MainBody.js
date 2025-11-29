import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PostModal from './components/PostModal';
import SignupChoicePanel from './SignupChoicePanel';
import PostCard from './components/PostCard';
import programs from './programs';
import GetStartedModal from './components/GetStartedModal';
import ClaimAccount from './ClaimAccount';
import DataPrivacyConsentForm from './DataPrivacyConsentForm';

const images = [
  { src: '/logo_hanap.jpg', alt: 'Picture 1' },
  { src: '/picture_1.jpg', alt: 'Picture 2' }

]
const defaultDashboardItems = [
  { title: 'Total Alumni', value: 1200, color: '#1976d2' },
  { title: 'Active Programs', value: programs ? programs.length : 0, color: '#2e7d32' },
  { title: 'Surveys Completed', value: 320, color: '#d32f2f' }
];

const MainBody = ({ onGetStarted }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [animate, setAnimate] = useState(false);
  const [dashboardItems, setDashboardItems] = useState(defaultDashboardItems);

  const [dashboardAnimate, setDashboardAnimate] = useState(false);
  const dashboardRef = React.useRef(null);
  // Recent posts refs/state
  const recentRef = React.useRef(null);
  // Animation configuration (entrance animations removed; keep constants nearby if reintroducing)
  // (removed CARD_OPACITY_DURATION_MS as entrance opacity animations were removed)
  const [showLearnMore, setShowLearnMore] = useState(false);
  const learnMoreRef = React.useRef(null);

  // isLoggedIn helper removed — parent will handle consent flow via onGetStarted

  const navigate = useNavigate();

  const handleGetStartedClick = () => {
    // If the user appears logged in, send them to the alumni survey form
    try {
      const token = localStorage.getItem('token');
      const stored = localStorage.getItem('currentUser');
      let userId = localStorage.getItem('userId');
      if (!userId && stored) {
        try { userId = JSON.parse(stored).id; } catch (_) { userId = null; }
      }
      if (token || userId) {
        // store user id for consent POST and show privacy consent overlay
        try { setPrivacyUserId(userId || null); } catch (_) {}
        setShowPrivacyConsent(true);
        return;
      }
    } catch (_) {}

    // Not logged in: navigate to the Claim Account page (use route /claim-account)
    setShowGetStartedModal(false);
    try {
      navigate('/claim-account');
    } catch (e) {
      window.location.href = '/claim-account';
    }
  };

  // Accent color helpers: prefer category-defined accents, otherwise generate from id/title
  const CATEGORY_ACCENTS = {
    news: '#ff4444', // red-ish for news
    event: '#0ea5e9', // cyan
    announcement: '#00ffc2', // teal
    default: '#ef4444' // red fallback
  };

  const colorFromString = (str) => {
    if (!str) return CATEGORY_ACCENTS.default;
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h = h & h;
    }
    const hue = Math.abs(h) % 360;
    return `hsl(${hue},72%,48%)`;
  };

  // convert hex color (#rrggbb) to rgba string with alpha
  const hexToRgba = (hex, alpha = 1) => {
    if (!hex) return `rgba(124,58,237,${alpha})`;
    const h = hex.replace('#', '');
    const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const accentForPost = (post) => {
    if (!post) return CATEGORY_ACCENTS.default;
    if (post.category) {
      const key = String(post.category).toLowerCase();
      if (CATEGORY_ACCENTS[key]) return CATEGORY_ACCENTS[key];
    }
    // fallback: use id or title
    const seed = post.id ? String(post.id) : (post.title || 'post');
    return colorFromString(seed);
  };

  // Animation: change image every 5 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
        setFade(true);
      }, 400); // fade out duration
    }, 5000);
    return () => clearInterval(interval);
  }, [activeIndex]);

  // Slide-in animation on mount for article/image
  React.useEffect(() => {
    setTimeout(() => setAnimate(true), 100);
  }, []);

  // Fetch recent posts from backend
  const [posts, setPosts] = useState([]);
  // how many posts are visible in the Recent Posts grid (supports "Show more")
  const [visibleCount, setVisibleCount] = useState(6);
  // selectedIndex points to posts array; null means closed
  const [selectedIndex, setSelectedIndex] = useState(null);
  const selectedPost = selectedIndex !== null && posts[selectedIndex] ? posts[selectedIndex] : null;
  // lightbox for viewing a single image in fullscreen; stores image index within selectedPost.images
  const [lightboxIndex, setLightboxIndex] = useState(null);
  // ...existing code...
  // State to show signup choice panel
  const [showSignupChoicePanel, setShowSignupChoicePanel] = useState(false);
  // Modal shown when Get Started is clicked to ask if user is an alumni
  const [showGetStartedModal, setShowGetStartedModal] = useState(false);
  // When user confirms Get Started -> show Claim Account flow inline
  const [showClaimAccount, setShowClaimAccount] = useState(false);
  // Show privacy consent form for logged-in users before allowing survey access
  const [showPrivacyConsent, setShowPrivacyConsent] = useState(false);
  const [privacyUserId, setPrivacyUserId] = useState(null);
  useEffect(() => {
    let mounted = true;
    async function fetchPosts() {
      try {
        const res = await fetch('/api/posts/');
        const data = await res.json().catch(() => null);
          if (mounted && data) {
            // data may be a list or an object with results
            const list = Array.isArray(data) ? data : (Array.isArray(data.results) ? data.results : []);
            // keep the full list in state; the UI will control how many to show via `visibleCount`
            setPosts(list);
        }
      } catch (err) {
        console.warn('Failed to fetch posts', err);
      }
    }
    fetchPosts();
    return () => { mounted = false; };
  }, []);

  // Animate dashboard when it enters viewport
  React.useEffect(() => {
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDashboardAnimate(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (dashboardRef.current) {
      observer.observe(dashboardRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // NOTE: entrance animations for recent posts were intentionally removed to
  // prevent the "domino" bounce effect on page refresh. The cards will
  // render statically and retain hover interactions.

  // Helpers to navigate posts when modal is open
  const prevPost = useCallback(() => {
    setLightboxIndex(null);
    setSelectedIndex((i) => (i === null ? null : (i === 0 ? posts.length - 1 : i - 1)));
  }, [posts.length]);

  const nextPost = useCallback(() => {
    setLightboxIndex(null);
    setSelectedIndex((i) => (i === null ? null : (i === posts.length - 1 ? 0 : i + 1)));
  }, [posts.length]);

  // Keyboard navigation: Escape to close, arrows to navigate
  React.useEffect(() => {
    const onKey = (e) => {
      if (selectedIndex !== null) {
        if (e.key === 'Escape') {
          setSelectedIndex(null);
          setLightboxIndex(null);
        } else if (e.key === 'ArrowLeft') {
          prevPost();
        } else if (e.key === 'ArrowRight') {
          nextPost();
        }
      } else if (lightboxIndex !== null) {
        if (e.key === 'Escape') setLightboxIndex(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIndex, lightboxIndex, prevPost, nextPost]);

  // Fetch alumni count from backend on mount and update dashboard
  React.useEffect(() => {
    let mounted = true;
    async function fetchAlumniCount() {
      try {
        const res = await fetch('/api/alumni/');
        const data = await res.json().catch(() => null);
        let count = null;
        // Possible shapes: { count: N, results: [...] } (paginated), an array [...], or an object
        if (data && typeof data === 'object') {
          if (typeof data.count === 'number') count = data.count;
          else if (Array.isArray(data.results)) count = data.results.length;
          else if (Array.isArray(data)) count = data.length; // in some backends they return array directly
        }
        if (mounted && typeof count === 'number') {
          setDashboardItems(items => items.map(it => it.title === 'Total Alumni' ? { ...it, value: count } : it));
        }
      } catch (err) {
        // Leave default value if fetch fails
        console.warn('Failed to fetch alumni count', err);
      }
    }
    fetchAlumniCount();
    return () => { mounted = false; };
  }, []);

  // Fetch surveys completed count from backend and update dashboard item
  React.useEffect(() => {
    let mounted = true;
    async function fetchSurveysCount() {
      try {
        const res = await fetch('/api/survey-aggregates/');
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        let cnt = null;
        if (data && typeof data === 'object') {
          // Backend provides total_count (total rows) and count (filtered count)
          if (typeof data.total_count === 'number') cnt = data.total_count;
          else if (typeof data.count === 'number') cnt = data.count;
        }
        if (mounted && typeof cnt === 'number') {
          setDashboardItems(items => items.map(it => it.title === 'Surveys Completed' ? { ...it, value: cnt } : it));
        }
      } catch (err) {
        console.warn('Failed to fetch survey aggregates count', err);
      }
    }
    fetchSurveysCount();
    return () => { mounted = false; };
  }, []);

  const goToPrev = () => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  const goToNext = () => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

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
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      
      {/* Subtle grid pattern overlay (larger squares like attachment) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px)
        `,
        backgroundSize: '72px 72px',
        opacity: 0.9,
        mixBlendMode: 'overlay',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Bottom red band for footer-like shimmer (replaces previous purple) */}
      <div style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '72px',
        background: 'linear-gradient(180deg, rgba(34,8,16,0) 0%, rgba(34,8,16,0.5) 40%, rgba(239,68,68,0.95) 100%)',
        zIndex: 0,
        pointerEvents: 'none'
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
        zIndex: 0,
        pointerEvents: 'none'
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

      <section style={{ 
        position: 'relative',
        width: '100%', 
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
        zIndex: 1
      }}>
        <style>{`
          @keyframes slideInRight {
            from { opacity: 0; transform: translateX(200px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes slideInLeft {
            from { opacity: 0; transform: translateX(-200px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes slideInUp {
            from { opacity: 0; transform: translateY(120px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes float {
            0% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
            100% { transform: translateY(0) rotate(0deg); }
          }
          .mainbody-animate-right {
            animation: slideInRight 1.5s cubic-bezier(.77,.2,.25,1) 0s 1 both;
          }
          .mainbody-animate-left {
            animation: slideInLeft 1.5s cubic-bezier(.77,.2,.25,1) 0s 1 both;
          }
          .mainbody-animate-up {
            animation: slideInUp 1.5s cubic-bezier(.77,.2,.25,1) 0s 1 both;
          }
          @media (max-width: 900px) {
            .mainbody-content {
              flex-direction: column !important;
              align-items: center !important;
              justify-content: center !important;
              gap: 18px !important;
              padding: 12px !important;
            }
            .mainbody-article {
              width: 100% !important;
              max-width: 680px !important;
              margin: 0 auto 24px !important;
              text-align: center !important;
              height: auto !important;
              padding: 20px !important;
            }
            .mainbody-carousel {
              width: 100% !important;
              max-width: 680px !important;
              height: auto !important;
              min-height: 220px !important;
              padding: 0 !important;
            }
            .mainbody-carousel img {
              width: 100% !important;
              height: auto !important;
              max-height: 360px !important;
              object-fit: cover !important;
              border-radius: 12px !important;
            }
            .mainbody-carousel button {
              width: 44px !important;
              height: 44px !important;
              left: 8px !important;
              right: 8px !important;
            }
          }
          /* Extra-tight rules for small phones to avoid overflow and huge paddings */
          @media (max-width: 480px) {
            .mainbody-content { gap: 12px !important; padding: 8px 14px !important; }
            /* Make the welcome/article box narrower and centered on small phones */
            .mainbody-article {
              padding: 12px !important;
              border-radius: 12px !important;
              width: calc(100% - 40px) !important;
              max-width: 420px !important;
              margin: 8px auto !important;
              height: auto !important;
              /* ensure content is centered vertically and horizontally on very small screens */
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              justify-content: center !important;
              min-height: 260px !important;
            }
            .mainbody-article h1 { font-size: 1.6rem !important; }
            .mainbody-article p { font-size: 0.95rem !important; }
            .mainbody-article button { padding: 10px 16px !important; font-size: 0.9rem !important; }
            .mainbody-carousel { min-height: 180px !important; border-radius: 12px !important; }
            .mainbody-carousel img { max-height: 300px !important; border-radius: 12px !important; }
            .mainbody-carousel button { width: 40px !important; height: 40px !important; font-size: 22px !important; }
            .mainbody-dashboard-number { font-size: 40px !important; }
          }
          /* Cyberpunk neon barrier animations */
          @keyframes neonPulse {
            0% { box-shadow: 0 0 10px rgba(239,68,68,0.35), 0 0 22px rgba(14,165,233,0.12); opacity: 0.88; }
            50% { box-shadow: 0 0 30px rgba(239,68,68,0.95), 0 0 60px rgba(14,165,233,0.28); opacity: 1; }
            100% { box-shadow: 0 0 10px rgba(239,68,68,0.35), 0 0 22px rgba(14,165,233,0.12); opacity: 0.88; }
          }
          @keyframes imageLift {
            0% { transform: translateY(0) scale(1); filter: drop-shadow(0 6px 18px rgba(14,165,233,0.04)); }
            45% { transform: translateY(-8px) scale(1.02); filter: drop-shadow(0 20px 46px rgba(239,68,68,0.12)); }
            55% { transform: translateY(-6px) scale(1.015); filter: drop-shadow(0 18px 40px rgba(14,165,233,0.14)); }
            100% { transform: translateY(0) scale(1); filter: drop-shadow(0 6px 18px rgba(14,165,233,0.04)); }
          }
          @keyframes neonSweep {
            0% { background-position: 0% 50%; }
            100% { background-position: 200% 50%; }
          }
          @keyframes dotPulse {
            0% { transform: translateY(0) scale(1); box-shadow: 0 6px 18px rgba(14,165,233,0.12); }
            50% { transform: translateY(-6px) scale(1.12); box-shadow: 0 14px 36px rgba(14,165,233,0.28); }
            100% { transform: translateY(0) scale(1); box-shadow: 0 6px 18px rgba(14,165,233,0.12); }
          }
          /* Dashboard number lift for emphasis */
          @keyframes numberLift {
            0% { transform: translateY(0) scale(1); filter: drop-shadow(0 6px 12px rgba(0,0,0,0.12)); }
            30% { transform: translateY(-10px) scale(1.08); filter: drop-shadow(0 18px 36px rgba(14,165,233,0.12)); }
            60% { transform: translateY(-6px) scale(1.04); filter: drop-shadow(0 14px 28px rgba(14,165,233,0.10)); }
            100% { transform: translateY(0) scale(1); filter: drop-shadow(0 6px 12px rgba(0,0,0,0.12)); }
          }
          /* Recent posts neon pulse and lift for cyberpunk emphasis */
          @keyframes recentNeonPulse {
            0% { box-shadow: 0 6px 18px rgba(14,165,233,0.06), 0 0 0 rgba(239,68,68,0); }
            40% { box-shadow: 0 14px 36px rgba(239,68,68,0.12), 0 0 28px rgba(14,165,233,0.18); }
            100% { box-shadow: 0 6px 18px rgba(14,165,233,0.06), 0 0 0 rgba(239,68,68,0); }
          }
          @keyframes recentCardLift {
            0% { transform: translateY(0) scale(1); }
            30% { transform: translateY(-10px) scale(1.03); }
            60% { transform: translateY(-6px) scale(1.02); }
            100% { transform: translateY(0) scale(1); }
          }
          /* Neon outline for images inside recent post cards */
          .recent-post-card img {
            border-radius: 10px;
            border: 2px solid rgba(255,255,255,0.04);
            box-shadow: 0 10px 30px var(--accent, rgba(14,165,233,0.6));
            transition: transform 260ms ease, box-shadow 260ms ease, filter 260ms ease;
            will-change: transform, box-shadow;
          }
          .recent-post-card:hover img {
            transform: translateY(-6px) scale(1.03);
            box-shadow: 0 26px 70px var(--accent, rgba(14,165,233,0.85));
            filter: saturate(1.08) drop-shadow(0 10px 36px var(--accent, rgba(14,165,233,0.16)));
          }

          /* Additional responsive improvements */
          @media (max-width: 768px) {
            .mainbody-content { flex-direction: column; gap: 18px; padding: 12px; }
            .mainbody-article, .mainbody-carousel { width: 100% !important; max-width: 100% !important; height: auto !important; }
            .mainbody-carousel img { max-height: 440px !important; height: auto !important; }
            .mainbody-dashboard { gap: 18px; padding: 12px; }
            .mainbody-dashboard-number { font-size: 40px !important; }
            .recent-grid { grid-template-columns: 1fr !important; }
            .mainbody-article button, .mainbody-carousel button { width: 100%; padding: 12px 18px; font-size: 1rem; }
            .modal-shell { margin: 0 12px; max-width: 720px; width: calc(100% - 24px); }
          }

          @media (max-width: 480px) {
            .mainbody-content { gap: 12px !important; padding: 8px 12px !important; }
            .mainbody-article { padding: 16px !important; border-radius: 12px !important; width: calc(100% - 24px) !important; max-width: 420px !important; display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; min-height: 240px !important; }
            .mainbody-article h1 { font-size: 1.5rem !important; }
            .mainbody-article p { font-size: 0.95rem !important; }
            .mainbody-dashboard-number { font-size: 36px !important; }
            .recent-post-card { height: auto !important; min-height: 140px; }
            .modal-shell { max-width: 100% !important; width: 100% !important; height: 100vh !important; border-radius: 0 !important; margin: 0 !important; }
            .modal-shell > * { height: 100%; overflow: auto; }
            button { touch-action: manipulation; }
          }

          /* Learn More panel responsive helpers */
          .learn-more-panel { background: rgba(255,255,255,0.03); border-radius: 12px; padding: 20px; padding-bottom: 100px; position: relative; color: #fff; box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
          .learn-more-grid { display: flex; justify-content: space-between; align-items: stretch; gap: 12px; }
          .learn-more-content { flex: 1; padding-right: 12px; }
          .learn-more-aside { width: 360px; flex-shrink: 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
          .learn-more-aside img { width: 100%; height: 100%; object-fit: cover; display: block; }
          .learn-more-panel h2 { margin-top: 0; }
          .learn-more-panel p, .learn-more-panel ul, .learn-more-panel div { color: rgba(255,255,255,0.93); line-height: 1.6; }

          @media (max-width: 900px) {
            .learn-more-grid { flex-direction: column-reverse; gap: 14px; }
            .learn-more-aside { width: 100%; max-height: 300px; }
            .learn-more-content { padding-right: 0; }
          }

          @media (max-width: 480px) {
            .learn-more-panel { padding: 16px; padding-bottom: 120px; border-radius: 12px; }
            .learn-more-content h2 { font-size: 1.25rem; }
            .learn-more-content p { font-size: 0.95rem; }
            .learn-more-panel ul { font-size: 0.95rem; }
            .learn-more-aside { max-height: 220px; border-radius: 10px; }
            .learn-more-panel { padding-bottom: 140px; }
          }
        `}</style>
        
        <div className="mainbody-content" style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: '100%', 
          maxWidth: 1200, 
          margin: '0 auto', 
          gap: 32,
          position: 'relative',
          zIndex: 2
        }}>
          {/* Article Section (Left) */}
          <div className={`mainbody-article${animate ? ' mainbody-animate-left' : ''}`} style={{ 
            flex: 1, 
            minWidth: 320, 
            maxWidth: 500, 
            textAlign: 'center', 
            opacity: animate ? 1 : 0, 
            color: '#fff',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '18px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            padding: '32px',
            // match the carousel height/box model so both tiles appear as equal squares on desktop
            height: '420px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '0 auto'
          }}>
            <h1 style={{ fontSize: '2.5rem', color: '#fff', fontWeight: 800, marginBottom: 18, lineHeight: 1.1 }}> Welcome to DOrSU<br />Alumni Tracer</h1>
            <p style={{ fontSize: '1.15rem', color: 'rgba(255, 255, 255, 0.9)', marginBottom: 32, lineHeight: 1.5, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
              designed to collect information on the career and educational outcomes of our graduates. Specifically, we aim to assess how well our graduates are doing in their careers, including their employment status, relevance of their work to their field of study, starting salaries and more. 
            </p>
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                style={{ padding: '12px 32px', background: '#33691e', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', transition: 'all 0.3s ease' }}
                onClick={() => {
                  // Show the privacy consent form before navigating to surveys
                  try {
                    const stored = localStorage.getItem('currentUser');
                    let userId = localStorage.getItem('userId');
                    if (!userId && stored) {
                      try { userId = JSON.parse(stored).id; } catch (_) { userId = null; }
                    }
                    setPrivacyUserId(userId || null);
                  } catch (_) { setPrivacyUserId(null); }
                  setShowPrivacyConsent(true);
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#3e7d22'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#33691e'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)'; }}
              >Get Started</button>
              <button
                style={{ padding: '12px 32px', background: 'transparent', color: '#fff', border: '2px solid rgba(255, 255, 255, 0.3)', borderRadius: 8, fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.3s ease' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.borderColor = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                onClick={() => {
                  // reveal the Learn More section and smoothly center it in the viewport
                  setShowLearnMore(true);
                  setTimeout(() => {
                    try {
                      const el = learnMoreRef.current;
                      if (el && typeof window !== 'undefined') {
                        const rect = el.getBoundingClientRect();
                        const absTop = rect.top + window.pageYOffset;
                        const target = Math.max(0, Math.floor(absTop - (window.innerHeight / 2) + (rect.height / 2)));
                        window.scrollTo({ top: target, behavior: 'smooth' });
                      }
                    } catch (_) { }
                  }, 140);
                }}
              >Learn More</button>
            </div>
          </div>
          
          {/* Carousel Section (Right) */}
          <div className={`mainbody-carousel${animate ? ' mainbody-animate-right' : ''}`} style={{ 
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
            opacity: animate ? 1 : 0,
            zIndex: 2,
            boxSizing: 'border-box'
          }}>
            <button onClick={goToPrev} style={{ 
              position: 'absolute', 
              left: 18, 
              top: '50%', 
              transform: 'translateY(-50%)', 
              fontSize: 32, 
              background: 'rgba(0, 0, 0, 0.3)', 
              border: 'none', 
              color: '#fff', 
              cursor: 'pointer', 
              zIndex: 2,
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              transition: 'all 0.2s ease'
            }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'}>&lt;</button>
            
            <img
              src={images[activeIndex].src}
              alt={images[activeIndex].alt}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 18,
                opacity: fade ? 1 : 0,
                transition: 'opacity 0.4s ease, transform 400ms ease',
                animation: animate ? 'imageLift 6s ease-in-out infinite' : 'none'
              }}
            />
            
            <button onClick={goToNext} style={{ 
              position: 'absolute', 
              right: 18, 
              top: '50%', 
              transform: 'translateY(-50%)', 
              fontSize: 32, 
              background: 'rgba(0, 0, 0, 0.3)', 
              border: 'none', 
              color: '#fff', 
              cursor: 'pointer', 
              zIndex: 2,
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              transition: 'all 0.2s ease'
            }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'}>&gt;</button>
            
            <div style={{ position: 'absolute', bottom: 18, left: 0, width: '100%', display: 'flex', justifyContent: 'center', gap: 10, zIndex: 2 }}>
              {images.map((img, idx) => (
                <span
                  key={img.src}
                  onClick={() => setActiveIndex(idx)}
                  style={{
                    display: 'inline-block',
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    border: '2px solid rgba(255, 255, 255, 0.7)',
                    background: idx === activeIndex ? '#fff' : 'transparent',
                    cursor: 'pointer',
                    boxShadow: idx === activeIndex ? '0 0 8px rgba(255, 255, 255, 0.7)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        
  {/* Add space between article/image and dashboard */}
        <div style={{ height: 100 }} />

        {/* Inline Learn More section (revealed when Learn More clicked) */}
        <div ref={learnMoreRef} className="learn-more-wrapper" style={{ width: '100%', maxWidth: 1200, margin: '0 auto 24px', padding: showLearnMore ? 24 : 0, transition: 'all 0.35s ease', overflow: 'hidden' }}>
          {showLearnMore && (
            <div className="learn-more-panel">
              <div className="learn-more-grid">
                <div className="learn-more-content">
                  <h2>About DOrSU Alumni Tracer</h2>
                  <p>
                    The Alumni Tracer tracks graduate outcomes and helps the university measure employment, further education, and career relevance. Use the dashboard to explore aggregated program statistics, survey results, and contact alumni for follow-ups.
                  </p>
                  <ul>
                    <li>Track employment rates and job placement per program.</li>
                    <li>View survey completion trends and insights.</li>
                    <li>Export anonymized reports for accreditation and planning.</li>
                  </ul>
                  <div style={{ marginTop: 12 }}>
                    The DOrSU Alumni Tracer will also serve as a strategic tool for institutional development. The data gathered will provide evidence-based insights into the effectiveness of academic programs, enabling the university to refine its curriculum, enhance teaching methods, and design relevant training opportunities. Moreover, the tracer will allow the institution to monitor trends in employability, workforce demands, and professional growth, ensuring that graduates are well-prepared to meet the evolving needs of society and industry.
                  </div>
                </div>
                <aside className="learn-more-aside">
                  <img src="/1ni.jpg" alt="About DOrSU" />
                </aside>
              </div>

              {/* Floating bottom-centered quick action pill */}
              <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 12, zIndex: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 999, background: 'linear-gradient(90deg, rgba(14,165,233,0.04), rgba(59,130,246,0.04))', backdropFilter: 'blur(6px)', boxShadow: '0 8px 24px rgba(2,6,23,0.12)' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      aria-label="Back to top"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 14px',
                        borderRadius: 999,
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 800,
                        color: '#fff',
                        background: 'linear-gradient(90deg,#0ea5e9,#3b82f6)',
                        boxShadow: '0 8px 24px rgba(59,130,246,0.14)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(59,130,246,0.18)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(59,130,246,0.14)'; }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5v14M5 12l7-7 7 7" stroke="rgba(255,255,255,0.95)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Back to top
                    </button>

                    <button
                      aria-label="Close learn more"
                      onClick={() => { setShowLearnMore(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 12px',
                        borderRadius: 999,
                        border: '1px solid rgba(255,255,255,0.12)',
                        background: 'transparent',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: 700,
                        transition: 'background 0.12s ease, transform 0.12s ease'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6l12 12" stroke="rgba(255,255,255,0.95)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </div>
              </div>
              </div>
            )}
        </div>
        
        {/* Dashboard Section (Animated) */}
        <div ref={dashboardRef} className={`mainbody-dashboard${dashboardAnimate ? ' mainbody-animate-up' : ''}`} style={{ 
          width: '100%', 
          maxWidth: 1200, 
          margin: '0 auto 0', 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 64, 
          flexWrap: 'wrap', 
          opacity: dashboardAnimate ? 1 : 0,
          position: 'relative',
          zIndex: 2,
          background: 'transparent',
          backdropFilter: 'none',
          borderRadius: '0px',
          border: 'none',
          boxShadow: 'none',
          marginBottom: '48px'
        }}>
          {dashboardItems.map((item, idx) => (
            <div
              key={item.title}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: 22,
                marginBottom: 16,
                minWidth: 180,
                color: '#fff',
                padding: '18px 28px',
                // frosted glass box that closely resembles the attachment
                background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02))',
                borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 8px 28px rgba(2,6,23,0.5), inset 0 1px 0 rgba(255,255,255,0.02)',
                transition: 'all 0.28s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))';
                e.currentTarget.style.transform = 'translateY(-6px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02))';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 6, color: 'rgba(255, 255, 255, 0.8)' }}>{item.title}</div>
              <div
                className="mainbody-dashboard-number"
                style={{
                  fontSize: 56,
                  fontWeight: 900,
                  color: item.color,
                  textShadow: `0 6px 18px ${hexToRgba(item.color, 0.22)}, 0 0 24px ${hexToRgba(item.color, 0.12)}`,
                  transition: 'transform 0.28s cubic-bezier(.77,.2,.25,1), text-shadow 0.28s ease',
                  animation: dashboardAnimate ? 'numberLift 1.6s cubic-bezier(.2,.8,.2,1) both' : 'none',
                  padding: '6px 8px',
                  borderRadius: 8,
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.35)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Recent Posts Section */}
  <section ref={recentRef} style={{ width: '100%', maxWidth: 1200, margin: '24px auto 80px', zIndex: 3, pointerEvents: 'auto' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <h1 style={{ color: '#f0f8ff', margin: 0, fontSize: '1.9rem', fontWeight: 900, letterSpacing: '0.5px', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>Recent Posts</h1>
          <div
            aria-hidden
            style={{
              flex: 1,
              height: 8,
              borderRadius: 8,
              background: 'linear-gradient(90deg, rgba(255,0,255,0.06), rgba(14,165,233,0.12), rgba(0,255,200,0.06))',
              backgroundSize: '200% 100%',
              animation: 'neonSweep 3.2s linear infinite, neonPulse 1.8s ease-in-out infinite',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)'
            }}
          />
          <div
            aria-hidden
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              background: 'linear-gradient(180deg, #ff00ff, #0ea5e9)',
              boxShadow: '0 8px 28px rgba(14,165,233,0.28), 0 0 18px rgba(255,0,255,0.18)',
              transformOrigin: 'center',
              animation: 'dotPulse 2.1s ease-in-out infinite'
            }}
          />
        </div>
  {/* Featured Latest Post (full-width tile above the grid) */}
  {posts && posts.length > 0 && (
    <div style={{ marginBottom: 18 }}>
      {(() => {
        const latest = posts[0];
        const thumb = latest.images && latest.images.length ? latest.images[0].image : null;
        return (
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1, minHeight: 320, borderRadius: 12, overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, rgba(12,30,60,0.96), rgba(10,18,34,0.96))', boxShadow: '0 10px 36px rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.04)' }}>
              {thumb ? <div style={{ width: '100%', height: 320, overflow: 'hidden' }}><img src={thumb} alt={latest.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.62)' }} /></div> : null}
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 12 }}>
                <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 18, fontWeight: 800, textShadow: '0 4px 12px rgba(0,0,0,0.6)' }}>{latest.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.85)', marginTop: 6, maxWidth: '80%', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{latest.content || ''}</div>
                <div style={{ marginTop: 14 }}>
                  <button onClick={() => setSelectedIndex(0)} style={{ padding: '8px 12px', borderRadius: 8, background: 'linear-gradient(90deg,#ff00ff,#0ea5e9)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 800 }}>Read more</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  )}

  <div className="recent-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {posts.length === 0 && (
            <div style={{ color: 'rgba(255,255,255,0.8)' }}>No posts yet.</div>
          )}
          {posts.slice(0, visibleCount).map((post, idx) => {
            const globalIndex = posts.indexOf(post);
            return (
              <div
                key={post.id}
                style={{
                  transform: 'translateY(0)',
                  opacity: 1,
                  transition: 'none',
                  willChange: 'auto'
                }}
              >
                <div
                  className="recent-post-card"
                  style={{
                    background: 'linear-gradient(135deg, rgba(12,30,60,0.95), rgba(10,18,34,0.95))',
                    borderRadius: 12,
                    padding: 12,
                    border: '1px solid rgba(255,255,255,0.04)',
                    boxShadow: '0 8px 30px rgba(2,6,23,0.45), inset 0 1px 0 rgba(255,255,255,0.02)',
                    // per-card accent left border
                    borderLeft: `6px solid ${accentForPost(post)}`,
                    // expose accent as CSS variable for nested selectors (image neon)
                    '--accent': accentForPost(post),
                    // entrance animation removed; keep hover/neon effects handled by CSS when hovered
                    animation: 'none',
                    transition: 'box-shadow 220ms ease, transform 220ms ease',
                    // enforce consistent card height and clip overflowing content
                    height: 220,
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'stretch'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(255,0,255,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(2,6,23,0.25)'; }}
                >
                  {/* subtle corner marker */}
                  <div style={{ position: 'absolute', marginTop: -6, marginLeft: -6, width: 14, height: 14, transform: 'rotate(45deg)', background: accentForPost(post), opacity: 0.08, borderRadius: 3 }} />
                  <PostCard post={post} onOpen={() => setSelectedIndex(globalIndex)} />
                </div>
              </div>
            );
          })}
        </div>
        {/* Show more / Show less control */}
        {posts.length > visibleCount && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
            <button
              onClick={() => setVisibleCount((c) => Math.min(posts.length, c + 6))}
              style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: 'linear-gradient(90deg,#0ea5e9,#3b82f6)',
                  color: '#fff',
                  fontWeight: 700
                }}
            >
              Show more
            </button>
          </div>
        )}
        {posts.length > 6 && visibleCount >= posts.length && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
            <button
              onClick={() => setVisibleCount(6)}
              style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.12)',
                  cursor: 'pointer',
                  background: 'transparent',
                  color: '#fff',
                  fontWeight: 700
                }}
            >
              Show less
            </button>
          </div>
        )}
      </section>
      {/* Post Viewer Modal (extracted to PostModal component) */}
      {/* Show SignupChoicePanel if triggered, otherwise show PostModal */}
      {showSignupChoicePanel ? (
        <SignupChoicePanel
          onChoose={() => setShowSignupChoicePanel(false)}
          onBack={() => setShowSignupChoicePanel(false)}
          setSignupStep={() => {}}
          setShowLogin={() => {}}
        />
      ) : (
        <PostModal
          selectedPost={selectedPost}
          onClose={() => setSelectedIndex(null)}
          prevPost={prevPost}
          nextPost={nextPost}
          lightboxIndex={lightboxIndex}
          setLightboxIndex={setLightboxIndex}
          onShowSignupChoicePanel={() => {
            try { navigate('/claim-account'); } catch (_) { window.location.href = '/claim-account'; }
          }}
        />
      )}

      {/* Get Started modal asking if the visitor is an alumni */}
      <GetStartedModal
        open={showGetStartedModal}
        onClose={() => setShowGetStartedModal(false)}
        onConfirm={() => { 
          // close the simple confirmation and defer to the same handler as the main button
          setShowGetStartedModal(false);
          try { handleGetStartedClick(); } catch (_) {}
        }}
      />

      {/* Inline Claim Account overlay (shown after Get Started confirmation) */}
      {showClaimAccount && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 14000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 18, right: 18, zIndex: 14010 }}>
            <button aria-label="Close claim account" onClick={() => setShowClaimAccount(false)} style={{ padding: 8, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer' }}>✕</button>
          </div>
          <div className="modal-shell" style={{ width: '100%', maxWidth: 840, margin: '0 16px', zIndex: 14005 }}>
            <ClaimAccount />
          </div>
        </div>
      )}

      {/* Privacy consent overlay for logged-in users before accessing surveys */}
      {showPrivacyConsent && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 15000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 18, right: 18, zIndex: 15010 }}>
            <button aria-label="Close consent" onClick={() => setShowPrivacyConsent(false)} style={{ padding: 8, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer' }}>✕</button>
          </div>
          <div className="modal-shell" style={{ width: '100%', maxWidth: 840, margin: '0 16px', zIndex: 15005 }}>
            <DataPrivacyConsentForm
              userId={privacyUserId}
              onAccept={() => { setShowPrivacyConsent(false); try { navigate('/surveys'); } catch (_) { window.location.href = '/surveys'; } }}
              onDecline={() => { setShowPrivacyConsent(false); }}
            />
          </div>
        </div>
      )}

      {/* Lightbox overlay for image zoom with navigation */}
      {selectedPost && lightboxIndex !== null && selectedPost.images && (
        <div role="dialog" aria-modal="true" onClick={() => setLightboxIndex(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 13000 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '95vw', maxHeight: '95vh', position: 'relative' }}>
            <img src={selectedPost.images[lightboxIndex].image} alt={`lightbox-${lightboxIndex}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            <button onClick={() => setLightboxIndex((i) => (i === 0 ? selectedPost.images.length - 1 : i - 1))} aria-label="Prev image" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', width: 48, height: 48, borderRadius: 24, cursor: 'pointer' }}>&lt;</button>
            <button onClick={() => setLightboxIndex((i) => (i === selectedPost.images.length - 1 ? 0 : i + 1))} aria-label="Next image" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', width: 48, height: 48, borderRadius: 24, cursor: 'pointer' }}>&gt;</button>
            <button onClick={() => setLightboxIndex(null)} aria-label="Close" style={{ position: 'absolute', right: 10, top: 10, background: 'rgba(255,255,255,0.06)', color: '#fff', border: 'none', width: 36, height: 36, borderRadius: 18, cursor: 'pointer' }}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainBody;
