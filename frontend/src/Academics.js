import React, { useState, useEffect, useRef } from 'react';
import FacultyShell from './FacultyShell';

const NAV_ITEMS = [
  { label: 'FACULTY OF AGRICULTURE AND LIFE SCIENCES', path: '/academics/agriculture-life-sciences', bgColor: '#1b5e20', description: 'Programs and research in agriculture, aquaculture, horticulture, and life sciences. Focus on sustainable practices and community extension.' },
  { label: 'FACULTY OF CRIMINAL JUSTICE AND EDUCATION', path: '/academics/criminal-justice-education', bgColor: '#f10519ff', description: 'Offers degrees in criminal justice, public safety, and education programs for future teachers and law enforcement professionals.' },
  { label: 'FACULTY OF COMPUTING, ENGINEERING AND TECHNOLOGY', path: '/academics/computing-engineering-technology', bgColor: '#f3aa0cff', description: 'Computer science, information technology, and engineering programs focused on practical skills and applied research.' },
  { label: 'FACULTY OF TEACHER EDUCATION', path: '/academics/teacher-education', bgColor: '#0c1bf5ff', description: 'Initial teacher education, pedagogy, curriculum development, and practicum opportunities for future educators.' },
  { label: 'FACULTY OF NURSING AND ALLIED HEALTH SCIENCES', path: '/academics/nursing-allied-health', bgColor: '#e7f526ff', description: 'Nursing and allied health courses with clinical placements and community health initiatives.' },
  { label: 'FACULTY OF BUSINESS AND MANAGEMENT', path: '/academics/business-management', bgColor: '#a5a204ff', description: 'Business administration, accounting, entrepreneurship, and management programs designed to develop industry-ready graduates.' },
  { label: 'FACULTY OF HUMANITIES, SOCIAL SCIENCES, AND COMMUNICATION', path: '/academics/humanities-social-sciences-communication', bgColor: '#e00bd6ff', description: 'Humanities, social sciences, communication, and cultural studies with emphasis on regional development and public engagement.' }
];

const Academics = () => {
  const PUBLIC_URL = process.env.PUBLIC_URL || '';
  const AGRICULTURE_FACULTY = [
    { name: 'Prof. Emmanuel A. Doe', title: 'Dean, Faculty of Agriculture & Life Sciences', img: `${PUBLIC_URL}/empty.jpg` },
    { name: 'Dr. Jane Smith', title: 'Head of Department, Horticulture', img: `${PUBLIC_URL}/empty.jpg` },
    { name: 'Mrs. Alice Brown', title: 'Senior Lecturer, Aquaculture', img: `${PUBLIC_URL}/empty.jpg` }
  ];
  const AGRICULTURE_PERSONNEL = [
    { person: 'Ms. Lilibeth Gringco-Deligero', dept: 'Program Head, Bachelor of Science in Business Administration', contact: '' },
    { person: 'Dr. Nonilito O. Carpio', dept: 'Program Head, Bachelor of Science in Criminology', contact: '' },
    { person: 'Mr. Renante M. Andrada', dept: 'Program Head, Bachelor of Science in Hospitality Management', contact: '' },
     { person: 'Mr. Renante M. Andrada', dept: 'Program Head, Bachelor of Science in Hospitality Management', contact: '' }
  ];
  // Criminal Justice personnel table (placeholder entries — update with exact data/image if you have it)
  const CRIMINAL_PERSONNEL = [
    { person: 'Prof. John Dela Cruz', dept: 'Program Head, Bachelor of Science in Criminology', contact: '' }
   
  ];
  // Computing, Engineering & Technology personnel table (placeholder entries)
  const COMPUTING_PERSONNEL = [
    { person: 'Mr. Paul Andrian Pineda', dept: 'Program Head, Bachelor in Industrial Technology Management major in Automotive Technology', contact: '' },
    { person: 'Engr. Eric G. Awa-ao', dept: 'Program Head, Bachelor of Science in Civil Engineering', contact: '' },
    { person: 'Ms. Cindy A. Lasco', dept: 'Program Head, Bachelor of Science in Information Technology', contact: '' },
    { person: 'Dr. Rodrigo A. Salimaco Jr.', dept: 'Program Head, Bachelor of Science in Mathematics', contact: '' }
  ];
  // Teacher Education personnel (placeholder entries)
  const TEACHER_PERSONNEL = [
    { person: 'Mr. Carlos Jae D. Soliven', dept: 'Program Head, Bachelor in Elementary Education', contact: '' },
    { person: 'Ms. Sofia D. Huesca', dept: 'Program Head, Bachelor of Early Childhood Education', contact: '' },
    { person: 'Mr. Robie V. Catubigan', dept: 'Program Head, Bachelor of Special Needs Education', contact: '' },
    { person: 'Dr. Arvin A. Andacao', dept: 'Program Head, Bachelor Physical Education', contact: '' },
        { person: 'Dr. Arvin A. Andacao', dept: 'Program Head, Bachelor Physical Education', contact: '' },
    { person: 'Dr. Arvin A. Andacao', dept: 'Program Head, Bachelor Physical Education', contact: '' },
    { person: 'Dr. Arvin A. Andacao', dept: 'Program Head, Bachelor Physical Education', contact: '' },
    { person: 'Dr. Arvin A. Andacao', dept: 'Program Head, Bachelor Physical Education', contact: '' },
    { person: 'Dr. Arvin A. Andacao', dept: 'Program Head, Bachelor Physical Education', contact: '' }

  ];
  // Nursing and Allied Health Sciences personnel (from user's screenshot)
  const NURSING_PERSONNEL = [
    { person: 'Dr. Michelle Suzanne L. Tabotabo', dept: 'Bachelor of Science in Nursing', contact: '' }
  ];
  // Business and Management personnel (from user's screenshot)
  const BUSINESS_PERSONNEL = [
    { person: 'Mr. John R. De la Cruz', dept: 'Program Head, Bachelor of Science in Accountancy', contact: '' },
    { person: 'Ms. Anna Marie L. Reyes', dept: 'Program Head, Bachelor of Science in Business Administration', contact: '' }
  ];
  // Humanities, Social Sciences & Communication personnel (from user's screenshot)
  const HUMANITIES_PERSONNEL = [
    { person: 'Dr. Angela M. Santos', dept: 'Program Head, Bachelor of Arts in Communication', contact: '' },
    { person: 'Mr. Ramon C. Lopez', dept: 'Program Head, Bachelor of Arts in Social Sciences', contact: '' },
        { person: 'Mr. Ramon C. Lopez', dept: 'Program Head, Bachelor of Arts in Social Sciences', contact: '' }

  ];
  const programsImg = `${PUBLIC_URL}/FALS.jpg`;
  // image/lightbox state moved into FacultyShell
  const [visible, setVisible] = useState(NAV_ITEMS.map(() => false));
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [animate, setAnimate] = useState(false);
  // mobile hamburger state
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // Configuration
  const MIN_DESC_WIDTH = 0; // set to 0 to remove minimum width; change to number (px) if desired
  const TRANSITION_DURATION = 600; // ms
  const TRANSITION_EASING = 'cubic-bezier(.2,.9,.2,1)';
  const USE_PURE_CSS = false; // set true to use pure-CSS inline-block technique
  const H_MARGIN = 20; // horizontal margin in px (left + right will be H_MARGIN*2 when used in calc)
  const headingRef = useRef(null);
  const descRef = useRef(null);
  const contentRef = useRef(null);
  const [descWidth, setDescWidth] = useState(null);

  // derive a current faculty list for the selected item; fallback to a generic entry
  const currentFaculty = selectedIndex === 0 ? AGRICULTURE_FACULTY : [
    { name: NAV_ITEMS[selectedIndex].label.replace(/FACULTY OF /i, '').trim(), title: 'Head of Faculty', img: `${PUBLIC_URL}/empty.jpg` }
  ];

  useEffect(() => {
    // Staggered reveal when the component mounts (fires after navigating to Academics)
    const timers = [];
  NAV_ITEMS.forEach((_, i) => {
      const t = setTimeout(() => {
        setVisible(prev => {
          const copy = [...prev];
          copy[i] = true;
          return copy;
        });
      }, i * 140 + 80);
      timers.push(t);
    });
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  // Close mobile nav on outside click / Escape
  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    function onDoc(e) {
      try {
        // If the click/touch is inside the hamburger button or the mobile panel, ignore it
        if (e && e.target && e.target.closest) {
          if (e.target.closest('.academics-hamburger')) return;
          if (e.target.closest('.academics-mobile-panel')) return;
        }
        setMobileNavOpen(false);
      } catch (_) {}
    }
    function onKey(e) { if (e.key === 'Escape') setMobileNavOpen(false); }
    document.addEventListener('click', onDoc, true);
    document.addEventListener('touchend', onDoc, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('click', onDoc, true);
      document.removeEventListener('touchend', onDoc, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [mobileNavOpen]);

  // Trigger description animation when selectedIndex changes
  useEffect(() => {
    setAnimate(true);
    const t = setTimeout(() => setAnimate(false), 700);
  // reset any child tab state when switching faculties (handled inside FacultyShell)
    // update desc width to match heading when changing selection
    // measure after render
    setTimeout(() => {
      try {
        const headingW = headingRef.current ? headingRef.current.getBoundingClientRect().width : null;
        const containerW = contentRef.current ? contentRef.current.clientWidth : null;
        const cap = containerW ? Math.min(1100, containerW) : 1100;
        const finalW = headingW ? Math.min(headingW, cap) : null;
        setDescWidth(finalW ? Math.max(280, Math.round(finalW)) : null);
      } catch (e) {
        setDescWidth(null);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [selectedIndex]);

  // Add scroll shadow indicators for horizontally scrollable .desc-box elements
  React.useEffect(() => {
    const boxes = Array.from(document.querySelectorAll('.desc-box'));
    if (!boxes || boxes.length === 0) return undefined;
    const handlers = new Map();
    boxes.forEach(el => {
      const update = () => {
        try {
          const max = el.scrollWidth - el.clientWidth;
          const left = el.scrollLeft || 0;
          if (left > 4) el.classList.add('has-left-shadow'); else el.classList.remove('has-left-shadow');
          if (left < (max - 4)) el.classList.add('has-right-shadow'); else el.classList.remove('has-right-shadow');
        } catch (_) {}
      };
      // store and attach
      handlers.set(el, update);
      el.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      // initial update
      setTimeout(update, 0);
    });
    return () => {
      boxes.forEach(el => {
        const fn = handlers.get(el);
        if (fn) {
          el.removeEventListener('scroll', fn);
          window.removeEventListener('resize', fn);
        }
      });
    };
  }, [selectedIndex]);

  // update on window resize as well
  useEffect(() => {
    function onResize() {
      try {
        const headingW = headingRef.current ? headingRef.current.getBoundingClientRect().width : null;
        const containerW = contentRef.current ? contentRef.current.clientWidth : null;
        const cap = containerW ? Math.min(1100, containerW) : 1100;
        const finalW = headingW ? Math.min(headingW, cap) : null;
        setDescWidth(finalW ? Math.max(280, Math.round(finalW)) : null);
      } catch (e) {
        setDescWidth(null);
      }
    }
    window.addEventListener('resize', onResize);
    // initial
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', overflow: 'hidden', background: 'linear-gradient(135deg, #0f2c3e 0%, #1a4b6d 50%, #2a6b97 100%)' }}>
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
      background: 'radial-gradient(circle, rgba(51, 105, 30, 0.15) 0%, transparent 70%)',
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
    <style>{`
      @keyframes float {
        0% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(5deg); }
        100% { transform: translateY(0) rotate(0deg); }
      }
    `}</style>
  <div style={{ position: 'relative', zIndex: 1, color: '#fff', minHeight: '100vh', padding: '20px 0', textAlign: 'center' }}>
      {/* Left fixed sidebar (moved to screen edge) */}
      <style>{`
    .academics-fixed-sidebar { position: fixed; left: 12px; top: 100px; width: 200px; display: flex; flex-direction: column; gap: 10px; z-index: 60; padding-top: 60px; }
          .academics-content-offset { margin-left: 236px; }
          .academics-hamburger { display: none; }
          @media (max-width: 900px) {
            .academics-fixed-sidebar { display: none; }
            .academics-content-offset { margin-left: 0; }
            .academics-hamburger { display: block; position: relative; z-index: 80; margin-bottom: 12px; }
            .academics-mobile-panel { position: absolute; top: 44px; left: 12px; right: 12px; background: rgba(11,43,43,0.98); padding: 12px; border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.28); }
          }
        `}</style>

  {/* Mobile hamburger (appears only under 900px) */}
  <div className="academics-hamburger">
          <button aria-label="Open navigation" onClick={() => setMobileNavOpen(s => !s)} style={{ background: 'transparent', border: 'none', color: '#ffd600', fontSize: 22, cursor: 'pointer', padding: 8 }}>
            {mobileNavOpen ? '✕' : '☰'}
          </button>
          {mobileNavOpen && (
            <div className="academics-mobile-panel">
              {NAV_ITEMS.map((item, i) => (
                <button key={`m-${i}`} className={`academics-nav-link${visible[i] ? ' show' : ''}${selectedIndex === i ? ' active' : ''}`} onClick={() => { setSelectedIndex(i); setMobileNavOpen(false); try { window.history.pushState({}, '', item.path); } catch(_){} }} type="button" style={{ display: 'block', width: '100%', marginBottom: 6 }}>{item.label}</button>
              ))}
            </div>
          )}
        </div>

  <aside className="academics-fixed-sidebar">
  {/* Mobile hamburger toggle (hidden on desktop) */}
  <div style={{ display: 'none' }} className="academics-hamburger">
          <button aria-label="Open navigation" onClick={() => setMobileNavOpen(s => !s)} style={{ background: 'transparent', border: 'none', color: '#ffd600', fontSize: 22, cursor: 'pointer', padding: 8 }}>
            {mobileNavOpen ? '✕' : '☰'}
          </button>
          {mobileNavOpen && (
            <div className="academics-mobile-panel" style={{ position: 'absolute', top: 44, left: 0, background: 'rgba(11,43,43,0.98)', padding: 12, borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.28)', zIndex: 80 }}>
              {NAV_ITEMS.map((item, i) => (
                <button key={`m-${i}`} className={`academics-nav-link${visible[i] ? ' show' : ''}${selectedIndex === i ? ' active' : ''}`} onClick={() => { setSelectedIndex(i); setMobileNavOpen(false); try { window.history.pushState({}, '', item.path); } catch(_){} }} type="button" style={{ display: 'block', width: '100%', marginBottom: 6 }}>{item.label}</button>
              ))}
            </div>
          )}
        </div>
        <style>{`
          .academics-nav-link {
            color: #fff;
            text-decoration: none;
            font-weight: 700;
            font-size: 13px;
            padding: 8px 8px;
            width: 100%;
            text-align: center;
            border-radius: 8px;
            transition: opacity 260ms cubic-bezier(.2,.9,.2,1), transform 260ms cubic-bezier(.2,.9,.2,1);
            display: block;
            cursor: pointer;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.08);
            line-height: 1.05;
            white-space: normal;
            font-family: Inter, Arial, sans-serif;
            opacity: 0;
            transform: translateX(-12px);
          }
          .academics-nav-link.show { opacity: 1; transform: translateX(0); }
          .academics-nav-link:hover { background: rgba(255, 215, 0, 0.12); transform: translateX(4px); box-shadow: 0 6px 18px rgba(0,0,0,0.18); }
          .academics-nav-link:active { transform: translateX(2px); }
          .academics-nav-link.active { background: rgba(255, 215, 0, 0.2); color: #ffd600; border-color: rgba(255, 215, 0, 0.4); }
          .academics-nav-link:focus { outline: none; }
          .academics-nav-link:focus-visible { box-shadow: 0 0 0 3px rgba(255,215,0,0.18), 0 6px 18px rgba(0,0,0,0.16); border-color: rgba(255,215,0,0.6); }
        `}</style>
        {NAV_ITEMS.map((item, i) => (
          <button
            key={i}
            className={`academics-nav-link${visible[i] ? ' show' : ''}${selectedIndex === i ? ' active' : ''}`}
            onClick={() => {
              setSelectedIndex(i);
              try {
                window.history.pushState({}, '', item.path);
              } catch (e) {
                // ignore pushState errors in older browsers
              }
            }}
            aria-pressed={selectedIndex === i}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </aside>

      {/* Wrapper to center content and limit width */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div ref={contentRef} className="academics-content-offset" style={{ width: '100%', maxWidth: 1100, padding: '0 20px', boxSizing: 'border-box', display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Main content area — shows selected faculty description */}
          <main style={{ flex: 1, minWidth: 280, textAlign: 'left' }}>
            <h1 ref={headingRef} style={{ color: '#ffd600', fontSize: 28, margin: '8px 0 16px 0' }}>{NAV_ITEMS[selectedIndex].label}</h1>
            <div style={{ maxWidth: 760, margin: '0 0 24px 0' }}>
              <style>{`
                .desc-box { transition: width ${TRANSITION_DURATION}ms ${TRANSITION_EASING}, transform ${TRANSITION_DURATION}ms ${TRANSITION_EASING}, opacity ${TRANSITION_DURATION}ms ease; transform-origin: left center; }
               /* Make tables inside the description horizontally scrollable on narrow viewports */
               .desc-box { -webkit-overflow-scrolling: touch; }
               .desc-box table { width: 100%; border-collapse: collapse; }
               @media (max-width: 900px) {
                 .desc-box { overflow-x: auto; }
                 /* allow tables to be wider than container so users can drag horizontally */
                 .desc-box table { min-width: 720px; }
               }

               /* Thin visible scrollbar styling */
               .desc-box::-webkit-scrollbar { height: 8px; }
               .desc-box::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); border-radius: 6px; }
               .desc-box { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.18) transparent; }

               /* Gradient edge shadows to indicate horizontal overflow */
               .desc-box { position: relative; }
               .desc-box::before, .desc-box::after {
                 content: '';
                 position: absolute;
                 top: 0;
                 bottom: 0;
                 width: 36px;
                 pointer-events: none;
                 opacity: 0;
                 transition: opacity 200ms ease;
               }
               .desc-box::before { left: 0; background: linear-gradient(to right, rgba(0,0,0,0.12), rgba(0,0,0,0)); }
               .desc-box::after { right: 0; background: linear-gradient(to left, rgba(0,0,0,0.12), rgba(0,0,0,0)); }
               .desc-box.has-left-shadow::before { opacity: 1; }
               .desc-box.has-right-shadow::after { opacity: 1; }

                .desc-animate { transform: translateX(-6px) scale(0.995); opacity: 0.96; }
                /* Pure-CSS inline-block approach */
                .heading-inline { display: inline-block; }
                .desc-inline { display: inline-block; vertical-align: top; transition: max-width ${TRANSITION_DURATION}ms ${TRANSITION_EASING}; }
              `}</style>
              <div
                ref={descRef}
                className={`desc-box ${animate ? 'desc-animate' : ''} ${USE_PURE_CSS ? 'desc-inline' : ''}`}
                style={{ width: !USE_PURE_CSS && descWidth ? `calc(${Math.max(MIN_DESC_WIDTH, descWidth)}px - ${H_MARGIN * 2}px)` : undefined, maxWidth: USE_PURE_CSS ? '1100px' : undefined, background: '#ffffff', padding: 18, borderRadius: 12, color: '#000', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', borderLeft: `8px solid ${NAV_ITEMS[selectedIndex].bgColor || '#000'}`, overflowWrap: 'break-word', margin: `8px ${H_MARGIN}px` }}
              >
                {/* FacultyShell component encapsulates tabs, faculty portrait, programs and tables */}
                <FacultyShell
                  item={NAV_ITEMS[selectedIndex]}
                  selectedIndex={selectedIndex}
                  currentFaculty={currentFaculty}
                  AGRICULTURE_PERSONNEL={AGRICULTURE_PERSONNEL}
                  CRIMINAL_PERSONNEL={CRIMINAL_PERSONNEL}
                  COMPUTING_PERSONNEL={COMPUTING_PERSONNEL}
                  TEACHER_PERSONNEL={TEACHER_PERSONNEL}
                  NURSING_PERSONNEL={NURSING_PERSONNEL}
                  BUSINESS_PERSONNEL={BUSINESS_PERSONNEL}
                  HUMANITIES_PERSONNEL={HUMANITIES_PERSONNEL}
                  programsImg={programsImg}
                  PUBLIC_URL={PUBLIC_URL}
                />
              </div>
            </div>
        
          </main>
        </div>
      </div>
    </div>
  </div>
  );
};

export default Academics;
