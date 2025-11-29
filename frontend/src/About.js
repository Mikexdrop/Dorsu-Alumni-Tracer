import React, { useState, useEffect, useRef } from 'react';
import FacebookIcon from './components/icons/FacebookIcon';
import InstagramIcon from './components/icons/InstagramIcon';
import GmailIcon from './components/icons/GmailIcon';

const NAV_KEYS = ['mandate', 'vision_mission', 'quality_policy', 'core_values', 'dorsu_hymn'];

function VideoWithFallback({ src, previewSrc, style, poster = '/Dorsu-Hymn-poster.jpg' }) {
  const [error, setError] = React.useState(false);
  const [canPlay, setCanPlay] = React.useState(false);
  const [noVisual, setNoVisual] = React.useState(false);
  const [previewAvailable, setPreviewAvailable] = React.useState(false);
  const vidRef = React.useRef(null);

  React.useEffect(() => {
    setError(false);
    setCanPlay(false);
    setNoVisual(false);
  }, [src]);

  // Probe preview source if provided so we can autoplay a muted preview loop
  React.useEffect(() => {
    if (!previewSrc) {
      setPreviewAvailable(false);
      return undefined;
    }
    let cancelled = false;
    let available = false;
    const p = document.createElement('video');
    p.muted = true;
    p.playsInline = true;
    p.preload = 'metadata';
    p.src = previewSrc;
    const onCan = () => { if (!cancelled) { available = true; setPreviewAvailable(true); } };
    const onErr = () => { if (!cancelled) setPreviewAvailable(false); };
    p.addEventListener('canplay', onCan);
    p.addEventListener('error', onErr);
    // try to load
    p.load();
    const t = setTimeout(() => {
      // if canplay didn't fire in 2s assume unavailable
      if (!cancelled && !available) setPreviewAvailable(false);
    }, 2000);
    return () => { cancelled = true; clearTimeout(t); p.removeEventListener('canplay', onCan); p.removeEventListener('error', onErr); };
  }, [previewSrc]);

  const handleCanPlay = () => {
    setCanPlay(true);
    // some files are audio-only or report zero video dimensions; detect and fall back
    try {
      const v = vidRef.current;
      if (v) {
        // delay slightly so dimensions populate
        setTimeout(() => {
          try {
            const w = v.videoWidth || 0;
            const h = v.videoHeight || 0;
            if (w === 0 && h === 0) {
              setNoVisual(true);
            }
          } catch (_) {}
        }, 120);
      }
    } catch (_) {}
  };

  return (
    <div style={{ width: '100%', background: '#000', borderRadius: 12, overflow: 'hidden', position: 'relative', ...style }}>
      {/* Preview autoplay (muted loop) when available */}
      {previewAvailable ? (
        <div style={{ position: 'relative' }}>
          <video
            src={previewSrc}
            muted
            autoPlay
            loop
            playsInline
            preload="auto"
            style={{ width: '100%', display: 'block', objectFit: 'cover', background: '#000' }}
            onError={() => setPreviewAvailable(false)}
          />
          {/* small overlay CTA to open full video */}
          <div style={{ position: 'absolute', right: 12, bottom: 12 }}>
            <button onClick={() => window.open(src, '_blank')} style={{ background: '#ffd600', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', fontWeight: 700 }}>Open full</button>
          </div>
        </div>
      ) : (!error && !noVisual ? (
        <video
          ref={vidRef}
          controls
          playsInline
          preload="metadata"
          controlsList="nodownload"
          style={{ width: '100%', display: 'block', background: '#000' }}
          onCanPlay={handleCanPlay}
          onError={() => setError(true)}
        >
          <source src={src} type="video/mp4" />
          Your browser does not support the video element.
        </video>
      ) : null)}

      {noVisual && (
        <div role="button" tabIndex={0} onClick={() => window.open(src, '_blank')} onKeyPress={(e) => { if (e.key === 'Enter') window.open(src, '_blank'); }} style={{ width: '100%', display: 'block', cursor: 'pointer' }}>
          <div style={{ width: '100%', paddingTop: '40%', position: 'relative', background: 'linear-gradient(180deg,#0f4b6d,#062635)', display: 'block' }}>
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', color: '#fff', textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5v14l11-7z" fill="#ffd600"/></svg>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Audio-only / No visual track</div>
              <div style={{ color: '#cbd5e1', marginBottom: 8 }}>Click to open the file in a new tab and listen or download.</div>
              <div style={{ color: '#ffd600', fontWeight: 700 }}>Open video in a new tab</div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ padding: 28, textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: 18, marginBottom: 8 }}>Video unavailable</div>
          <div style={{ color: '#cbd5e1' }}>The video could not be loaded. You can <a href={src} style={{ color: '#ffd600' }} target="_blank" rel="noreferrer">download or open it in a new tab</a>.</div>
        </div>
      )}

      {!error && !canPlay && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ color: '#fff', background: 'rgba(0,0,0,0.4)', padding: '6px 10px', borderRadius: 6 }}>Loading…</div>
        </div>
      )}
    </div>
  );
}

function QualityPolicy({ animate }) {
  return (
    <>
      <style>{`
        .slide-right {
          opacity: 0;
          transform: translateX(-60px);
          transition: opacity 1.2s cubic-bezier(.4,2,.6,1), transform 1.2s cubic-bezier(.4,2,.6,1);
        }
        .slide-right.active {
          opacity: 1;
          transform: translateX(0);
        }
      `}</style>
      <div className={`slide-right${animate ? ' active' : ''}`} style={{ 
        maxWidth: 800, 
        margin: '0 auto', 
        textAlign: 'left', 
        color: 'rgba(255, 255, 255, 0.9)', 
        fontSize: 18, 
        lineHeight: 1.7,
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        padding: '32px'
      }}>
        <h2 style={{ color: '#ffd600', fontSize: 32, marginBottom: 18, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Quality Policy Statement</h2>
        <p>
          DAVAO ORIENTAL STATE UNIVERSITY is an educational institutional established and sustained by quality education. It seeks to successfully implement and improve its Quality Management System in order to better serve its students and community, further contributing to the nation-building.
        </p>
        <p>To sustain this culture of quality, DOrSU is committed to:</p>
        <ul style={{ marginLeft: 24 }}>
          <li><b><i style={{color: '#ffd600'}}>D</i></b>eliver quality education, research, and extension and progressive leadership to its stakeholders;</li>
          <li><b><i style={{color: '#ffd600'}}>O</i></b>ffer relevant value-adding programs and products responsive to the Sustainable Development Goals;</li>
          <li><b><i style={{color: '#ffd600'}}>S</i></b>ustain conducive environment for learning, research, and extension through continuous professional development and providing state-of-the-art technologies, facilities and infrastructure;</li>
          <li><b><i style={{color: '#ffd600'}}>C</i></b>omply with all applicable statutory and regulatory requirements;</li>
          <li><b><i style={{color: '#ffd600'}}>S</i></b>erve its stakeholders better by implementing value-adding improvements using different tools such as Risk Management and 5S; and</li>
          <li><b><i style={{color: '#ffd600'}}>T</i></b>ransfer organizational knowledge and QMS expertise to other institution</li>
        </ul>
      </div>
    </>
  );
}

function VisionMission({ animate }) {
  return (
    <>
      <style>{`
        .slide-right {
          opacity: 0;
          transform: translateX(-60px);
          transition: opacity 1.2s cubic-bezier(.4,2,.6,1), transform 1.2s cubic-bezier(.4,2,.6,1);
        }
        .slide-right.active {
          opacity: 1;
          transform: translateX(0);
        }
      `}</style>
      <div className={`slide-right${animate ? ' active' : ''}`} style={{ 
        maxWidth: 800, 
        margin: '0 auto', 
        textAlign: 'left', 
        color: 'rgba(255, 255, 255, 0.9)', 
        fontSize: 18, 
        lineHeight: 1.7,
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        padding: '32px'
      }}>
        <h2 style={{ color: '#ffd600', fontSize: 32, marginBottom: 18, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Vision</h2>
        <ul style={{ marginLeft: 24, marginBottom: 32 }}>
          <li>A university of excellence, innovation and inclusion.</li>
        </ul>
        <h2 style={{ color: '#ffd600', fontSize: 32, marginBottom: 18, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Mission</h2>
        <ul style={{ marginLeft: 24 }}>
          <li>To elevate knowledge generation, utilization and distribution</li>
          <li>To promote inclusive sustainable development through R&D-based higher quality education, technical-vocational skills, responsive to the needs of local and global community</li>
          <li>To produce holistic, creative, and inclusive human resource who are responsive and resilient to global challenges while maintaining a strong sense of nationhood</li>
        </ul>
      </div>
    </>
  );
}

function UniversityMandate({ animate }) {
  return (
    <>
      <style>{`
        .slide-right {
          opacity: 0;
          transform: translateX(-60px);
          transition: opacity 1.2s cubic-bezier(.4,2,.6,1), transform 1.2s cubic-bezier(.4,2,.6,1);
        }
        .slide-right.active {
          opacity: 1;
          transform: translateX(0);
        }
      `}</style>
      <div className={`slide-right${animate ? ' active' : ''}`} style={{ 
        maxWidth: 800, 
        margin: '0 auto', 
        textAlign: 'left', 
        color: 'rgba(255, 255, 255, 0.9)', 
        fontSize: 18, 
        lineHeight: 1.7,
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        padding: '32px'
      }}>
        <h2 style={{ color: '#ffd600', fontSize: 32, marginBottom: 18, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>University Mandate</h2>
        <p>
          The University is mandated to provide academic programs in science and technology, agriculture, engineering, teacher education, technical education and other areas as may be instituted on the basis of national, regional and local development goals. It is also mandated to provide research and extension services to its primary clientele – the province of Davao Oriental and outwards.
        </p>
        <p>The University is commissioned to:</p>
        <ul style={{ marginLeft: 24 }}>
          <li>
            provide higher quality tertiary education
            <ul style={{ marginLeft: 18 }}>
              <li>characterized by cultural sensitivity and inter-disciplinary approach</li>
              <li>informed by active research, community connection and institutional collaboration</li>
              <li>providing the lifelong diverse needs of students and their parents</li>
            </ul>
          </li>
          <li>
            advance knowledge by research and community involvement
            <ul style={{ marginLeft: 18 }}>
              <li>to standards achieving national recognition</li>
              <li>throughout its subject range</li>
            </ul>
          </li>
          <li>support national and regional economic development agenda and directions</li>
          <li>build vigorously its close ties within the region, the nation and continue to develop wider international relationships.</li>
        </ul>
      </div>
    </>
  );
}

function CoreValues({ animate }) {
  return (
    <>
      <style>{`
        .slide-right {
          opacity: 0;
          transform: translateX(-60px);
          transition: opacity 1.2s cubic-bezier(.4,2,.6,1), transform 1.2s cubic-bezier(.4,2,.6,1);
        }
        .slide-right.active {
          opacity: 1;
          transform: translateX(0);
        }
      `}</style>
      <div className={`slide-right${animate ? ' active' : ''}`} style={{ 
        maxWidth: 800, 
        margin: '0 auto', 
        textAlign: 'left', 
        color: 'rgba(255, 255, 255, 0.9)', 
        fontSize: 18, 
        lineHeight: 1.7,
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        padding: '32px'
      }}>
        <h2 style={{ color: '#ffd600', fontSize: 32, marginBottom: 18, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Core Values</h2>
        <ul style={{ marginLeft: 24, fontSize: 20 }}>
          <li>God-centered and Humane</li>
          <li>Critical Thinking and Creativity</li>
          <li>Discipline and Competence</li>
          <li>Commitment and Collaboration</li>
          <li>Resilience and Sustainability</li>
        </ul>
      </div>
    </>
  );
}

function DorsuHymn({ animate }) {
  return (
    <>
      <style>{`
        .slide-right {
          opacity: 0;
          transform: translateX(-60px);
          transition: opacity 1.2s cubic-bezier(.4,2,.6,1), transform 1.2s cubic-bezier(.4,2,.6,1);
        }
        .slide-right.active {
          opacity: 1;
          transform: translateX(0);
        }
        .dorsu-lyrics {
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          margin: 24px auto 0 auto;
          padding: 24px 18px 18px 18px;
          max-width: 600px;
          color: #ffd600;
          font-size: 17px;
          line-height: 1.8;
          white-space: pre-line;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .dorsu-lyrics-title {
          color: #ffd600;
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 8px;
        }
      `}</style>
      <div className={`slide-right${animate ? ' active' : ''}`} style={{ 
        maxWidth: 800, 
        margin: '0 auto', 
        textAlign: 'center', 
        color: 'rgba(255, 255, 255, 0.9)', 
        fontSize: 18, 
        lineHeight: 1.7,
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        padding: '32px'
      }}>
        <h2 style={{ color: '#ffd600', fontSize: 32, marginBottom: 18, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Dorsu Hymn</h2>
        {/* Improved video: add playsInline, preload, controlsList and error handling + black bg */}
        <VideoWithFallback src="/Dorsu-Hymn.mp4" style={{ maxWidth: 1000, margin: '0 auto 24px auto', borderRadius: 12, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' }} />
        <div className="dorsu-lyrics" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          margin: '24px auto 0 auto',
          padding: '24px 18px 18px 18px',
          maxWidth: '600px',
          color: '#ffd600',
          fontSize: '17px',
          lineHeight: 1.8,
          whiteSpace: 'pre-line',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div className="dorsu-lyrics-title" style={{ color: '#ffd600', fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
            " DAVAO ORIENTAL STATE UNIVERSITY "<br/><i>Words by : Harold Chang & Jillian Sitchon<br/>Music by : Harold Chang</i>
          </div>
          <br></br>
          Precious Gem of Davao Orient seas, Davao Oriental State University
          <br></br><br></br>
          Pillar of success, Fountain of wisdom and creativity
          <br></br><br></br>
          In every battle together we will fight, Thy army pledge it's loyalty
          <br></br><br></br>
          With virtue of love to God and humanity, Let's stand with pride and dignity
          <br></br><br></br>
          <i>Chorus</i>
          <br></br><br></br>
          Davao Oriental State University
          <br></br><br></br>
          Raise your banner proud and mighty
          <br></br><br></br>
          Keep a heart that nurtures life
          <br></br><br></br>
          Move forward in every fight
          <br></br><br></br>
          Davao Oriental State University Go forth bearer of truth and integrity
          <br></br><br></br>
          Emblem the seal in our hearts and minds
          <br></br><br></br>
          Lit our lamp with light and warmth,
          <br></br><br></br>
          DOrSU our Alma Matter dear
          <br></br><br></br>
          Precious gem of Davao Orient Seas, Davao Oriental State University
          <br></br><br></br>
          We unite to include everyone, all praise and salute to thee
          <br></br><br></br>
          Your light shall shine over hills and plains, And every ocean strand
          <br></br><br></br>
          For the Divine hath favored thy greatness, together we will stand
          <br></br><br></br>
          <i>Chorus</i>
          <br></br><br></br>
          Davao Oriental State University
          <br></br><br></br>
          Raise your banner proud and mighty
          <br></br><br></br>
          Keep a heart that nurtures life
          <br></br><br></br>
          Move forward in every fight (transpose to F)
          <br></br><br></br>
          Davao Oriental State University
          <br></br><br></br>
          Go forth bearer of truth and integrity
          <br></br><br></br>
          Emblem the seal in our hearts and minds
          <br></br><br></br>
          Lit our lamp with light and warmth,
          <br></br><br></br>
          DORSU our Alma Matter dear
          <br></br><br></br>
          DORSU our Alma Matter dear
        </div>
      </div>
    </>
  );
}

const About = () => {
  const [section, setSection] = useState('default');
  const [animateMandate, setAnimateMandate] = useState(false);
  const [animateVisionMission, setAnimateVisionMission] = useState(false);
  const [animateQualityPolicy, setAnimateQualityPolicy] = useState(false);
  const [animateCoreValues, setAnimateCoreValues] = useState(false);
  const [animateDorsuHymn, setAnimateDorsuHymn] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Close the sidebar by default on narrow/mobile viewports to improve mobile UX
    try {
      if (typeof window !== 'undefined') return window.innerWidth > 768;
    } catch (_) {}
    return true;
  });
  // Sidebar sizing constants (kept in component so styles can reference them)
  const SIDEBAR_OPEN_WIDTH = 260;
  const SIDEBAR_CLOSED_WIDTH = 56;
  // Nav link slide-in visibility state (staggered animation)
  const [linkVisible, setLinkVisible] = useState(NAV_KEYS.map(() => false));
  const linkTimers = useRef([]);
  const observerRef = useRef(null);
  // mount animation state
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // small stagger so the entrance feels deliberate
    const t = setTimeout(() => setMounted(true), 60);
    return () => { clearTimeout(t); setMounted(false); };
  }, []);

  // Ensure sidebar is closed on first mount for mobile widths (fallback for SSR/hydration)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
    // run only on mount
  }, []);

  // helper to navigate to a section and scroll to top
  const handleNavClick = (key) => {
    setSection(key);
    // ensure viewport starts at top of the content area
    if (typeof window !== 'undefined' && window.scrollTo) {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      } catch (e) {
        // fallback for older browsers
        window.scrollTo(0, 0);
      }
    }
  };

  // Section-specific entrance animations (staggered per section change)
  useEffect(() => {
    let timer;
    if (section === 'mandate') {
      setAnimateMandate(false);
      timer = setTimeout(() => setAnimateMandate(true), 50);
    } else if (section === 'vision_mission') {
      setAnimateVisionMission(false);
      timer = setTimeout(() => setAnimateVisionMission(true), 50);
    } else if (section === 'quality_policy') {
      setAnimateQualityPolicy(false);
      timer = setTimeout(() => setAnimateQualityPolicy(true), 50);
    } else if (section === 'core_values') {
      setAnimateCoreValues(false);
      timer = setTimeout(() => setAnimateCoreValues(true), 50);
    } else if (section === 'dorsu_hymn') {
      setAnimateDorsuHymn(false);
      timer = setTimeout(() => setAnimateDorsuHymn(true), 50);
    }
    return () => clearTimeout(timer);
  }, [section]);

  // Staggered slide-in for sidebar nav items when sidebarOpen toggles
  React.useEffect(() => {
    // clear any existing timers
    linkTimers.current.forEach(t => clearTimeout(t));
    linkTimers.current = [];
    if (sidebarOpen) {
      // stagger appearance (slower stagger to feel more deliberate)
      NAV_KEYS.forEach((_, i) => {
        const t = setTimeout(() => {
          setLinkVisible(prev => {
            const copy = [...prev];
            copy[i] = true;
            return copy;
          });
        }, i * 300 + 100);
        linkTimers.current.push(t);
      });
    } else {
      // hide instantly when closing
      setLinkVisible(NAV_KEYS.map(() => false));
    }
    return () => {
      linkTimers.current.forEach(t => clearTimeout(t));
      linkTimers.current = [];
    };
  }, [sidebarOpen]);

  // Observe author figures and add 'in-view' class when they enter viewport
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('in-view');
      });
    }, { threshold: 0.24 });
    observerRef.current = observer;
    const nodes = document.querySelectorAll('.author-figure');
    nodes.forEach(n => observer.observe(n));
    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0f2c3e 0%, #1a4b6d 50%, #2a6b97 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>{`
        /* Entrance animations for About page */
        .about-enter-sidebar {
          transform: translateX(-24px) scale(0.98);
          opacity: 0;
          transition: transform 560ms cubic-bezier(.2,.9,.3,1), opacity 560ms ease;
        }
        .about-enter-sidebar.active {
          transform: translateX(0) scale(1);
          opacity: 1;
        }
        .about-enter-main {
          transform: translateY(14px) scale(0.998);
          opacity: 0;
          transition: transform 640ms cubic-bezier(.2,.9,.3,1), opacity 640ms ease;
        }
        .about-enter-main.active {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
      `}</style>
      {/* Background decorative elements */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 15% 25%, rgba(37, 85, 124, 0.3) 0%, transparent 20%),
          radial-gradient(circle at 85% 65%, rgba(255, 215, 0, 0.2) 0%, transparent 20%),
          radial-gradient(circle at 50% 40%, rgba(25, 118, 210, 0.2) 0%, transparent 30%)
        `,
        zIndex: 0
      }} />
      
      {/* Subtle grid pattern overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        zIndex: 0
      }} />
      
      {/* Animated floating elements */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '5%',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255, 215, 0, 0.15) 0%, transparent 70%)',
        animation: 'float 15s ease-in-out infinite',
        zIndex: 0
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

      {/* Sidebar (now fixed so it stays visible while scrolling) */}
      <aside className={`about-enter-sidebar${mounted ? ' active' : ''}`} style={{
        width: sidebarOpen ? SIDEBAR_OPEN_WIDTH : SIDEBAR_CLOSED_WIDTH,
      
        color: '#ffd600',
        padding: sidebarOpen ? '150px 0 0 0' : '150px 0 0 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.3)',
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        zIndex: 50,
        transition: 'width 0.32s cubic-bezier(.4,2,.6,1), padding 0.32s cubic-bezier(.4,2,.6,1)',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        overflowY: 'auto'
      }}>
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'space-between' : 'center', padding: sidebarOpen ? '0 1px 0 18px' : '0' }}>
          {sidebarOpen && <h2 style={{ fontSize: 28, marginBottom: 32, color: '#ffd600', letterSpacing: 4, flex: 2, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>About</h2>}
          <button
            aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            onClick={() => setSidebarOpen(o => !o)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#ffd600',
              fontSize: 28,
              cursor: 'pointer',
              marginLeft: sidebarOpen ? 8 : 0,
              marginBottom: sidebarOpen ? 32 : 0,
              outline: 'none',
              transition: 'all 0.3s ease',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            tabIndex={0}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            {sidebarOpen ? <span>&#9776;</span> : <span>&#10095;</span>}
          </button>
        </div>
        {sidebarOpen && (
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%', alignItems: 'center' }}>
            <style>{`
              .about-nav-link {
                color: #fff;
                text-decoration: none;
                font-weight: bold;
                font-size: 18px;
                padding: 12px 0;
                width: 90%;
                text-align: center;
                border-radius: 8px;
                transition: all 0.3s ease;
                display: block;
                cursor: pointer;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                opacity: 0;
                transform: translateX(-18px);
                transition: opacity 360ms cubic-bezier(.2,.9,.2,1), transform 360ms cubic-bezier(.2,.9,.2,1);
              }
              .about-nav-link:hover {
                background: rgba(255, 215, 0, 0.2);
                transform: translateX(5px);
              }
              .about-nav-link.active {
                background: rgba(255, 215, 0, 0.3);
                color: #ffd600;
                border-color: rgba(255, 215, 0, 0.5);
                transform: translateX(5px);
              }
              .about-nav-link.show {
                opacity: 1;
                transform: translateX(0);
              }
            `}</style>
            <span className={`about-nav-link${section === 'mandate' ? ' active' : ''}${linkVisible[0] ? ' show' : ''}`} onClick={() => handleNavClick('mandate')}>University Mandate</span>
            <span className={`about-nav-link${section === 'vision_mission' ? ' active' : ''}${linkVisible[1] ? ' show' : ''}`} onClick={() => handleNavClick('vision_mission')}>Vision & Mission</span>
            <span className={`about-nav-link${section === 'quality_policy' ? ' active' : ''}${linkVisible[2] ? ' show' : ''}`} onClick={() => handleNavClick('quality_policy')}>Quality Policy Statement</span>
            <span className={`about-nav-link${section === 'core_values' ? ' active' : ''}${linkVisible[3] ? ' show' : ''}`} onClick={() => handleNavClick('core_values')}>Core Values</span>
            <span className={`about-nav-link${section === 'dorsu_hymn' ? ' active' : ''}${linkVisible[4] ? ' show' : ''}`} onClick={() => handleNavClick('dorsu_hymn')}>Dorsu Hymn</span>
          </nav>
        )}
      </aside>
      
      {/* Main Content */}
      <main className={`about-enter-main${mounted ? ' active' : ''}`} style={{ 
        flex: 1, 
        padding: '48px 24px', 
        textAlign: 'center', 
        color: '#fff', 
        transition: 'margin-left 0.32s cubic-bezier(.4,2,.6,1), width 0.32s cubic-bezier(.4,2,.6,1)',
        position: 'relative',
        zIndex: 1,
        marginLeft: sidebarOpen ? SIDEBAR_OPEN_WIDTH : SIDEBAR_CLOSED_WIDTH
      }}>
        <style>{`
          .social-icon-link { display:inline-block; transition: transform 180ms ease, opacity 180ms ease; }
          .social-icon-link:hover { transform: translateY(-4px) scale(1.08); opacity: 0.95; }
          .social-icons-row { display:flex; justify-content:center; gap:12px; margin-top:8px }

          /* Author figure entrance animation (from down -> up) */
          .author-figure { transform: translateY(28px); opacity: 0; transition: transform 4000ms cubic-bezier(.2,.9,.2,1), opacity 4000ms cubic-bezier(.2,.9,.2,1); }
          .author-figure.in-view { transform: translateY(0); opacity: 1; }

          /* Hover-zoom for author images */
          /* Slightly zoomed-in by default for a tighter crop, expands more on hover */
          /* Use viewport units for responsive image height, with sensible bounds */
          .author-image { display: block; width: 100%; height: 30vh; min-height: 180px; max-height: 420px; object-fit: cover; border-radius: 8px; box-shadow: 0 6px 18px rgba(0,0,0,0.3); transform: scale(1.02); transition: transform 420ms cubic-bezier(.2,.9,.2,1), box-shadow 420ms ease, filter 420ms ease; cursor: pointer; will-change: transform; }
          .author-figure:hover .author-image { transform: scale(1.12) translateY(-8px); box-shadow: 0 16px 36px rgba(0,0,0,0.45); }

          /* Responsive tweaks: reduce zoom on smaller screens */
          @media (max-width: 768px) {
            .author-image { transform: scale(1.01); height: 28vh; max-height: 360px; }
            .author-figure:hover .author-image { transform: scale(1.08) translateY(-6px); }
            .author-figure { transition-delay: 0ms !important; }
          }
          @media (max-width: 480px) {
            .author-image { transform: scale(1); height: 24vh; max-height: 300px; }
            .author-figure:hover .author-image { transform: scale(1.04) translateY(-4px); }
            .author-figure { width: 100% !important; max-width: 320px; }
          }
        `}</style>
        {section === 'mandate' ? (
          <UniversityMandate animate={animateMandate} />
        ) : section === 'vision_mission' ? (
          <VisionMission animate={animateVisionMission} />
        ) : section === 'quality_policy' ? (
          <QualityPolicy animate={animateQualityPolicy} />
        ) : section === 'core_values' ? (
          <CoreValues animate={animateCoreValues} />
        ) : section === 'dorsu_hymn' ? (
          <DorsuHymn animate={animateDorsuHymn} />
        ) : (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            padding: '48px 32px',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            <h1 style={{ color: '#ffd600', fontSize: 40, marginBottom: 24, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>About Dorsu</h1>
            <h2 style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 20, marginBottom: 32, lineHeight: 1.6 }}>
              The Davao Oriental State University is a state-funded research-based coeducational higher education institution in Mati City, Davao Oriental, Philippines. It was founded on December 13, 1989.
            </h2>
            <video controls width="100%" style={{ maxWidth: 800, margin: '0 auto 24px auto', borderRadius: 12, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' }}>
              <source src="/DORSU-Promotional-Video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            {/* Author images row */}
            <div style={{ maxWidth: 980, margin: '18px auto 0 auto', paddingTop: 18, paddingBottom: 22, borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ color: '#ffd600', fontSize: 30, margin: '0 0 12px 0', letterSpacing: 1.2 }}>Authors</h3>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 8, flexWrap: 'wrap' }}>
              <figure className="author-figure" style={{ width: 260, margin: 0, textAlign: 'center', transitionDelay: '0ms' }}>
                <img className="author-image" src="/kristine.jpg" alt="author 1" style={{ width: '100%', objectFit: 'cover', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.3)' }} />
                  <figcaption style={{ marginTop: 8, color: 'rgba(255,255,255,0.9)' , fontSize: '20px'}}><b> Kristine Mae Bonotan</b></figcaption>
                <figcaption style={{ marginTop: 8, color: 'rgba(255,255,255,0.9)' , fontSize: '15px'}}><b> <i>Researcher</i></b></figcaption>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8 }}>
                  <a className="social-icon-link" style={{ color: '#1877F2' }} href="https://www.facebook.com/profile.php?id=100009575901705" target="_blank" rel="noreferrer" title="Facebook"><FacebookIcon size={44} style={{ display: 'block' }} /></a>
                  <a className="social-icon-link" style={{ color: '#8134af' }} href="https://instagram.com" target="_blank" rel="noreferrer" title="Instagram"><InstagramIcon size={44} style={{ display: 'block' }} /></a>
                  <a className="social-icon-link" style={{ color: '#D44638' }} href="mailto:harold@example.com" title="Email"><GmailIcon size={44} style={{ display: 'block' }} /></a>
                </div>
              </figure>
              <figure className="author-figure" style={{ width: 260, margin: 0, textAlign: 'center', transitionDelay: '120ms' }}>
                <img className="author-image" src="/mike.jpg" alt="author 2" style={{ width: '100%', objectFit: 'cover', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.3)' }} />
                  <figcaption style={{ marginTop: 8, color: 'rgba(255,255,255,0.9)' , fontSize: '20px'}}><b> Mike Misoles</b></figcaption>
                <figcaption style={{ marginTop: 8, color: 'rgba(255,255,255,0.9)' , fontSize: '15px'}}><b> <i>frontend and Backend Developer</i></b></figcaption>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8 }}>
                  <a className="social-icon-link" style={{ color: '#1877F2' }} href="https://www.facebook.com/mike.albacite.misoles" target="_blank" rel="noreferrer" title="Facebook"><FacebookIcon size={44} style={{ display: 'block' }} /></a>
                  <a className="social-icon-link" style={{ color: '#8134af' }} href="https://instagram.com" target="_blank" rel="noreferrer" title="Instagram"><InstagramIcon size={44} style={{ display: 'block' }} /></a>
                  <a className="social-icon-link" style={{ color: '#D44638' }} href="mailto:jillian@example.com" title="Email"><GmailIcon size={44} style={{ display: 'block' }} /></a>
                </div>
              </figure>
              <figure className="author-figure" style={{ width: 260, margin: 0, textAlign: 'center', transitionDelay: '240ms' }}>
                <img className="author-image" src="/Kenneth.png" alt="author 3" style={{ width: '100%', objectFit: 'cover', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.3)' }} />
                <figcaption style={{ marginTop: 8, color: 'rgba(255,255,255,0.9)' , fontSize: '20px'}}><b> Kenneth Jay Paragoso</b></figcaption>
                <figcaption style={{ marginTop: 8, color: 'rgba(255,255,255,0.9)' , fontSize: '15px'}}><b> <i>UX-Designer</i></b></figcaption>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8 }}>
                  <a className="social-icon-link" style={{ color: '#1877F2' }} href="https://www.facebook.com/KeiParagoso" target="_blank" rel="noreferrer" title="Facebook"><FacebookIcon size={44} style={{ display: 'block' }} /></a>
                  <a className="social-icon-link" style={{ color: '#8134af' }} href="https://instagram.com" target="_blank" rel="noreferrer" title="Instagram"><InstagramIcon size={44} style={{ display: 'block' }} /></a>
                  <a className="social-icon-link" style={{ color: '#D44638' }} href="mailto:harold@example.com" title="Email"><GmailIcon size={44} style={{ display: 'block' }} /></a>
                </div>
              </figure>
             
                 <figure className="author-figure" style={{ width: 260, marginTop: 50, textAlign: 'center', transitionDelay: '120ms' }}>
                <img className="author-image" src="/sir.png" alt="author 2" style={{ width: '100%', objectFit: 'cover', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.3)' }} />
                  <figcaption style={{ marginTop: 8, color: 'rgba(255,255,255,0.9)' , fontSize: '20px'}}><b> Prof. Jonathan S. Cabrera</b></figcaption>
                <figcaption style={{ marginTop: 8, color: 'rgba(255,255,255,0.9)' , fontSize: '15px'}}><b> <i>Capstone Adviser</i></b></figcaption>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8 }}>
                  <a className="social-icon-link" style={{ color: '#1877F2' }} href="https://www.facebook.com" target="_blank" rel="noreferrer" title="Facebook"><FacebookIcon size={44} style={{ display: 'block' }} /></a>
                  <a className="social-icon-link" style={{ color: '#8134af' }} href="https://instagram.com" target="_blank" rel="noreferrer" title="Instagram"><InstagramIcon size={44} style={{ display: 'block' }} /></a>
                  <a className="social-icon-link" style={{ color: '#D44638' }} href="mailto:jillian@example.com" title="Email"><GmailIcon size={44} style={{ display: 'block' }} /></a>
                </div>
              </figure>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default About;