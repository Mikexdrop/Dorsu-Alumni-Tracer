import React, { useState, useEffect } from 'react';

const FacultyShell = ({
  item,
  selectedIndex,
  currentFaculty,
  AGRICULTURE_PERSONNEL,
  CRIMINAL_PERSONNEL,
  COMPUTING_PERSONNEL,
  TEACHER_PERSONNEL,
  NURSING_PERSONNEL,
  BUSINESS_PERSONNEL,
  HUMANITIES_PERSONNEL,
  programsImg,
  PUBLIC_URL,
}) => {
  const [subTab, setSubTab] = useState('faculty');
  const [programsImageLoaded, setProgramsImageLoaded] = useState(false);
  const [programsImageError, setProgramsImageError] = useState(false);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxActive, setLightboxActive] = useState(false);

  useEffect(() => {
    if (!lightboxVisible) return;
    function onKey(e) {
      if (e.key === 'Escape') {
        setLightboxActive(false);
        setTimeout(() => setLightboxVisible(false), 260);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxVisible]);

  const PersonnelTable = ({ list = [] }) => (
    <div style={{ width: '100%', marginTop: 18 }}>
      <div className="personnel-wrapper" style={{ overflowX: 'auto' }}>
        <style>{`
          .personnel-wrapper { border-radius: 10px; box-shadow: 0 8px 24px rgba(16,24,40,0.06); background: #ffffff; }
          .personnel-table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 720px; }
          .personnel-table thead th { text-transform: uppercase; letter-spacing: 0.04em; font-size: 13px; padding: 12px 16px; font-weight: 700; }
          .personnel-table tbody td { padding: 14px 18px; vertical-align: top; color: #102030; font-size: 14px; }
          .personnel-row { border-bottom: 1px solid rgba(16,24,40,0.06); transition: background 160ms ease; }
          .personnel-row:hover { background: rgba(16,24,40,0.02); }
          .personnel-table thead tr th:first-child { border-top-left-radius: 10px; }
          .personnel-table thead tr th:last-child { border-top-right-radius: 10px; }
          @media (max-width: 480px) {
            .personnel-table thead th { font-size: 12px; padding: 10px 12px; }
            .personnel-table tbody td { padding: 10px 12px; font-size: 13px; }
          }
        `}</style>
        <table className="personnel-table" style={{ background: '#fff' }}>
          <thead>
            <tr style={{ background: item.bgColor, color: '#fff' }}>
              <th style={{ textAlign: 'left' }}>DESIGNATED PERSONNEL</th>
              <th style={{ textAlign: 'left' }}>DEPARTMENT</th>
              <th style={{ textAlign: 'left' }}>CONTACT INFO.</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r, i) => (
              <tr key={i} className="personnel-row">
                <td>{r.person}</td>
                <td>{r.dept}</td>
                <td>{r.contact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const AgriculturePrograms = () => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 12 }}>
      <div style={{ maxWidth: 820, width: '100%', textAlign: 'center' }}>
        <div style={{ marginBottom: 12, color: '#0b2540', fontSize: 18, lineHeight: 1.6, textAlign: 'justify' }}>
          <img
            src={`${PUBLIC_URL}/FALS_LOGO.jpg`}
            alt="FALS logo"
            className="fals-logo"
            style={{ width: 120, height: 120, objectFit: 'contain', float: 'right', marginLeft: 16, marginBottom: 8, borderRadius: 6 }}
          />
          <style>{`@media (max-width: 720px) { .fals-logo { float: none !important; display: block; margin: 0 0 12px 0; width: 96px; height: auto; } }`}</style>
          <p style={{ margin: '0 0 10px 0' }}>
            The Faculty of Agriculture and Life Sciences offers comprehensive programs spanning crop science, animal production, and sustainable resource management. Students engage in hands-on laboratory and fieldwork, participate in applied research projects, and gain practical experience through internships and community extension activities. Our curriculum emphasizes sustainability, food security, and resilient farming systems tailored to local and regional needs.
          </p>
          <p style={{ margin: 0 }}>
            Graduates are prepared for diverse careers across agricultural industries, research institutions, government extension services, and non-governmental organizations. The faculty fosters industry partnerships, applied research collaborations, and experiential learning opportunities that help students transition from the classroom into impactful professional roles that support environmental stewardship and rural development.
          </p>
        </div>

        <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
          {!programsImageLoaded && !programsImageError && (
            <div style={{ background: 'linear-gradient(90deg,#f3f4f6,#e6eef1)', paddingTop: '56.25%' }} />
          )}
          {programsImageError && (
            <div style={{ padding: 24, color: '#b91c1c' }}>Image failed to load.</div>
          )}
          <img
            src={programsImg}
            alt="Faculty of Agriculture and Life Sciences programs"
            onLoad={() => setProgramsImageLoaded(true)}
            onError={() => setProgramsImageError(true)}
            style={{ display: programsImageLoaded ? 'block' : 'none', width: '88%', maxWidth: 720, height: 'auto', margin: '0 auto', cursor: 'zoom-in', borderRadius: 6 }}
            onClick={() => {
              setLightboxVisible(true);
              setTimeout(() => setLightboxActive(true), 20);
            }}
          />
        </div>

        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 12 }}>
          <div style={{ color: '#374151', fontSize: 14 }}>Programs overview — click image to enlarge</div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{ overflowX: 'auto' }}>
            <style>{`
              .programs-panel { background: #fff; border-radius: 10px; box-shadow: 0 10px 30px rgba(2,6,23,0.06); padding: 8px; }
              .programs-table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 620px; }
              .programs-table thead th { color: #fff; font-weight: 800; font-size: 14px; padding: 14px 18px; letter-spacing: 0.04em; text-transform: uppercase; }
              .programs-table th:first-child { border-top-left-radius: 8px; }
              .programs-table th:last-child { border-top-right-radius: 8px; }
              .programs-table tbody td { padding: 14px 18px; vertical-align: top; color: #102030; font-size: 14px; }
              .programs-table tbody td:nth-child(2) { text-align: justify; }
              .programs-table tbody tr:nth-child(odd) { background: #fbfdfe; }
              .programs-table tbody tr:hover { background: #f1f7fb; }
              .programs-table td + td { max-width: 60%; }
            `}</style>
            <div className="programs-panel">
              <table className="programs-table" style={{ background: 'transparent' }}>
                <thead>
                  <tr style={{ background: item.bgColor }}>
                    <th>PROGRAM</th>
                    <th>COURSE DESCRIPTION</th>
                    <th>ACCREDITATION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 700 }}>BSAM</td>
                    <td>Bachelor of Science in Agribusiness Management</td>
                    <td style={{ whiteSpace: 'nowrap' }}></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>BSA</td>
                    <td>
                      Bachelor of Science in Biology major in Animal Biology<br />
                      Bachelor of Science in Agriculture major in Animal Science<br />
                      Bachelor of Science in Agriculture major in Crop Science
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>BSBio</td>
                    <td>
                      Bachelor of Science in Biology<br />
                      Bachelor of Science in Biology major in Animal Biology<br />
                      Bachelor of Science in Biology major in Ecology
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}></td>
                  </tr>
                     <tr>
                    <td style={{ fontWeight: 700 }}>BSES</td>
                    <td>
                      Bachelor of Science in Environmental Science
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <a
            href="https://www.facebook.com/ialspythonssociety"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Faculty Facebook"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#0b2540' }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <rect width="24" height="24" rx="4" fill="#1877F2" />
              <path d="M15.121 8.5h-1.219c-.272 0-.652.137-.652.672v1.008h1.812l-.237 1.848h-1.575V18h-2.036v-6.98H9.72V9.172h1.647V7.78c0-1.63 1.0-3.028 3.08-3.028.87 0 1.62.064 1.84.093v2.657z" fill="#fff" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 700 }}>Follow us on Facebook</span>
          </a>

          <a
            href="mailto:ialsinstitute22@gmail.com"
            aria-label="Faculty email"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#0b2540' }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <rect width="24" height="24" rx="4" fill="#D44638" />
              <path d="M4.5 7.5v9c0 .828.672 1.5 1.5 1.5h12c.828 0 1.5-.672 1.5-1.5v-9c0-.828-.672-1.5-1.5-1.5h-12c-.828 0-1.5.672-1.5 1.5z" fill="#fff" />
              <path d="M20.5 7.5l-8 5-8-5" stroke="#D44638" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 700 }}>ialsinstitute22@gmail.com</span>
          </a>

          <a
            href="https://dorsu.edu.ph/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Learn more"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#0b2540', padding: '6px 10px', borderRadius: 8, background: 'rgba(11,37,64,0.04)', fontWeight: 700 }}
          >
            Learn more
          </a>
        </div>

        {lightboxVisible && (
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => {
              setLightboxActive(false);
              setTimeout(() => setLightboxVisible(false), 260);
            }}
            className={`lightbox-overlay ${lightboxActive ? 'active' : ''}`}
            style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
          >
            <style>{`
              .lightbox-overlay { background: rgba(2,6,23,0); transition: background 260ms ease; }
              .lightbox-overlay.active { background: rgba(2,6,23,0.72); }
              .lightbox-content { transform: scale(.96); opacity: 0; transition: transform 260ms cubic-bezier(.2,.9,.2,1), opacity 220ms ease; }
              .lightbox-overlay.active .lightbox-content { transform: scale(1); opacity: 1; }
            `}</style>
            <div onClick={e => e.stopPropagation()} className="lightbox-content" style={{ maxWidth: '90%', maxHeight: '90%' }}>
              <img src={programsImg} alt="Programs large" style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
              <div style={{ marginTop: 8, textAlign: 'right' }}>
                <button onClick={() => { setLightboxActive(false); setTimeout(() => setLightboxVisible(false), 260); }} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#111827', color: '#fff' }}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const CriminalPrograms = () => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 12 }}>
      <div style={{ maxWidth: 820, width: '100%', textAlign: 'center' }}>
        <div style={{ marginBottom: 12, color: '#0b2540', fontSize: 18, lineHeight: 1.6, textAlign: 'justify' }}>
          <img
            src={`${PUBLIC_URL}/CRIM.jpg`}
            alt="Faculty of Criminal Justice and Education logo"
            className="crim-logo"
            style={{ width: 120, height: 120, objectFit: 'contain', float: 'right', marginLeft: 16, marginBottom: 8, borderRadius: 6 }}
          />
          <style>{`@media (max-width: 720px) { .crim-logo { float: none !important; display: block; margin: 0 0 12px 0; width: 96px; height: auto; } }`}</style>
          <p style={{ margin: '0 0 10px 0' }}>
            The Faculty of Criminal Justice and Education provides integrated programs that prepare students for careers in law enforcement, public safety, corrections, and basic education. Our curriculum blends theoretical foundations in criminology and pedagogy with practical training, fieldwork, and community engagement to build competent, ethical professionals.
          </p>
          <p style={{ margin: 0 }}>
            Students benefit from simulated exercises, partnerships with local public safety agencies, and supervised practicum placements. The faculty emphasizes leadership, research-informed practice, and a multidisciplinary approach to public safety and education.
          </p>
          <img
            src={`${PUBLIC_URL}/CRIMS.jpg`}
            alt="Faculty of Criminal Justice and Education banner"
            className="crims-logo"
            style={{ width: '100%', maxWidth: 880, height: 'auto', display: 'block', margin: '12px auto 0 auto', borderRadius: 8 }}
          />
          <style>{`@media (max-width: 720px) { .crims-logo { width: 100% !important; height: auto; margin: 12px 0 0 0; } }`}</style>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{ overflowX: 'auto' }}>
            <style>{`
              .programs-panel { background: #fff; border-radius: 10px; box-shadow: 0 10px 30px rgba(2,6,23,0.06); padding: 8px; }
              .programs-table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 620px; }
              .programs-table thead th { color: #fff; font-weight: 800; font-size: 14px; padding: 14px 18px; letter-spacing: 0.04em; text-transform: uppercase; }
              .programs-table th:first-child { border-top-left-radius: 8px; }
              .programs-table th:last-child { border-top-right-radius: 8px; }
              .programs-table tbody td { padding: 14px 18px; vertical-align: top; color: #102030; font-size: 14px; }
              .programs-table tbody td:nth-child(2) { text-align: justify; }
              .programs-table tbody tr:nth-child(odd) { background: #fbfdfe; }
              .programs-table tbody tr:hover { background: #f1f7fb; }
              .programs-table td + td { max-width: 60%; }
            `}</style>
            <div className="programs-panel">
              <table className="programs-table" style={{ background: 'transparent' }}>
                <thead>
                  <tr style={{ background: item.bgColor }}>
                    <th>PROGRAM</th>
                    <th>COURSE DESCRIPTION</th>
                    <th>ACCREDITATION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 700 }}>BS Criminology</td>
                    <td>Bachelor of Science in Criminology</td>
                    <td style={{ whiteSpace: 'nowrap' }}></td>
                  </tr>
              
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* Bottom area: social links and provided image for Criminal Justice */}
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <a
            href="https://www.facebook.com/profile.php?id=61561379619059"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="FCJE Facebook"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#0b2540' }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <rect width="24" height="24" rx="4" fill="#1877F2" />
              <path d="M15.121 8.5h-1.219c-.272 0-.652.137-.652.672v1.008h1.812l-.237 1.848h-1.575V18h-2.036v-6.98H9.72V9.172h1.647V7.78c0-1.63 1.0-3.028 3.08-3.028.87 0 1.62.064 1.84.093v2.657z" fill="#fff" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 700 }}>Visit FCJE Facebook</span>
          </a>

          <a
            href="mailto:fcje@dorsu.edu.ph"
            aria-label="FCJE email"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#0b2540' }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <rect width="24" height="24" rx="4" fill="#D44638" />
              <path d="M4.5 7.5v9c0 .828.672 1.5 1.5 1.5h12c.828 0 1.5-.672 1.5-1.5v-9c0-.828-.672-1.5-1.5-1.5h-12c-.828 0-1.5.672-1.5 1.5z" fill="#fff" />
              <path d="M20.5 7.5l-8 5-8-5" stroke="#D44638" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 700 }}>fcje@dorsu.edu.ph</span>
          </a>

          <a
            href="https://dorsu.edu.ph/academic-faculty/#ibpa"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="FCJE Learn more"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#0b2540', padding: '6px 10px', borderRadius: 8, background: 'rgba(11,37,64,0.04)', fontWeight: 700 }}
          >
            Learn more
          </a>
        </div>

        {/* Provided screenshot/image placed at the bottom of Programs for Criminal Justice.
            Please add the file to your public folder (for example: frontend/public/CRIM_BOTTOM.png)
            so it can be referenced via PUBLIC_URL. If you prefer a different filename, update the path below. */}
        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <img
            src={`${PUBLIC_URL}/CRIM_BOTTOM.png`}
            alt="FCJE extra"
            style={{ width: '88%', maxWidth: 720, height: 'auto', margin: '0 auto', borderRadius: 8 }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      </div>
    </div>
  );

  const TeacherPrograms = () => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 12 }}>
      <div style={{ maxWidth: 820, width: '100%', textAlign: 'center' }}>
        <div style={{ marginBottom: 12, color: '#0b2540', fontSize: 18, lineHeight: 1.6, textAlign: 'justify' }}>
          <img
            src={`${PUBLIC_URL}/FTED.jpg`}
            alt="Faculty of Teacher Education logo"
            className="teach-logo"
            style={{ width: 120, height: 120, objectFit: 'contain', float: 'right', marginLeft: 16, marginBottom: 8, borderRadius: 6 }}
          />
          <style>{`@media (max-width: 720px) { .teach-logo { float: none !important; display: block; margin: 0 0 12px 0; width: 96px; height: auto; } }`}</style>
          <p style={{ margin: '0 0 10px 0' }}>
            The Faculty of Teacher Education prepares future educators with a strong foundation in pedagogy, curriculum development, and supervised practicum experiences. Our programs emphasize inclusive teaching practices and community engagement.
          </p>
          <p style={{ margin: 0 }}>
            Students participate in classroom teaching, lesson planning, and mentorship programs that develop practical teaching skills and professional competence for diverse educational settings.
          </p>
          <img
            src={`${PUBLIC_URL}/FTEDS.jpg`}
            alt="Faculty of Teacher Education banner"
            className="teachs-logo"
            style={{ width: '100%', maxWidth: 880, height: 'auto', display: 'block', margin: '12px auto 0 auto', borderRadius: 8 }}
          />
          <style>{`@media (max-width: 720px) { .teachs-logo { width: 100% !important; height: auto; margin: 12px 0 0 0; } }`}</style>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{ overflowX: 'auto' }}>
            <style>{`
              .programs-panel { background: #fff; border-radius: 10px; box-shadow: 0 10px 30px rgba(2,6,23,0.06); padding: 8px; }
              .programs-table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 620px; }
              .programs-table thead th { color: #fff; font-weight: 800; font-size: 14px; padding: 14px 18px; letter-spacing: 0.04em; text-transform: uppercase; }
              .programs-table th:first-child { border-top-left-radius: 8px; }
              .programs-table th:last-child { border-top-right-radius: 8px; }
              .programs-table tbody td { padding: 14px 18px; vertical-align: top; color: #102030; font-size: 14px; }
              .programs-table tbody td:nth-child(2) { text-align: justify; }
              .programs-table tbody tr:nth-child(odd) { background: #fbfdfe; }
              .programs-table tbody tr:hover { background: #f1f7fb; }
              .programs-table td + td { max-width: 60%; }
            `}</style>
            <div className="programs-panel">
              <table className="programs-table" style={{ background: 'transparent' }}>
                <thead>
                  <tr style={{ background: item.bgColor }}>
                    <th>PROGRAM</th>
                    <th>COURSE DESCRIPTION</th>
                    <th>ACCREDITATION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 700 }}>BEED</td>
                    <td>Bachelor in Elementary Education</td>
                    <td style={{ whiteSpace: 'nowrap' }}></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>BCED</td>
                    <td>Bachelor of Early Childhood Education</td>
                    <td style={{ whiteSpace: 'nowrap' }}></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>BSNED</td>
                    <td>Bachelor of Special Needs Education</td>
                    <td style={{ whiteSpace: 'nowrap' }}></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>BPED</td>
                    <td>Bachelor Physical Education</td>
                    <td style={{ whiteSpace: 'nowrap' }}></td>
                  </tr>
                   <tr>
                    <td style={{ fontWeight: 700 }}>BTLED</td>
                 <td>Bachelor of Technology and Livelihood Education major in Home Economics<br />
                 BacheBachelor of Technology and Livelihood Education major in Industrial Arts</td>
                    <td style={{ whiteSpace: 'nowrap' }}></td>
                  </tr>
                   <tr>
                    <td style={{ fontWeight: 700 }}>BSED – English</td>
                    <td>Bachelor of Secondary Education major in English</td>
                    <td style={{ whiteSpace: 'nowrap' }}></td>
                  </tr>
                   <tr>
                    <td style={{ fontWeight: 700 }}>BSED – Filipino</td>
                    <td>Bachelor of Secondary Education major in Filipino</td>
                    <td style={{ whiteSpace: 'nowrap' }}></td>
                  </tr>
                      <tr>
                    <td style={{ fontWeight: 700 }}>BSED – Mathematics</td>
                    <td>Bachelor of Secondary Education major in Mathematics</td>
                    <td style={{ whiteSpace: 'nowrap' }}></td>
                  </tr>
                      <tr>
                    <td style={{ fontWeight: 700 }}>BSED – Science</td>
                    <td>Bachelor of Secondary Education major in Science</td>
                    <td style={{ whiteSpace: 'nowrap' }}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bottom area: social links and provided image for Teacher Education */}
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <a
            href="https://www.facebook.com/IETTofficial"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Teacher Faculty Facebook"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#0b2540' }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <rect width="24" height="24" rx="4" fill="#1877F2" />
              <path d="M15.121 8.5h-1.219c-.272 0-.652.137-.652.672v1.008h1.812l-.237 1.848h-1.575V18h-2.036v-6.98H9.72V9.172h1.647V7.78c0-1.63 1.0-3.028 3.08-3.028.87 0 1.62.064 1.84.093v2.657z" fill="#fff" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 700 }}>Visit IETTofficial</span>
          </a>

          <a
            href="https://www.facebook.com/IETTofficial"
            aria-label="Teacher Faculty email"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#0b2540' }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <rect width="24" height="24" rx="4" fill="#D44638" />
              <path d="M4.5 7.5v9c0 .828.672 1.5 1.5 1.5h12c.828 0 1.5-.672 1.5-1.5v-9c0-.828-.672-1.5-1.5-1.5h-12c-.828 0-1.5.672-1.5 1.5z" fill="#fff" />
              <path d="M20.5 7.5l-8 5-8-5" stroke="#D44638" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 700 }}>teacher.IETTofficial</span>
          </a>

          <a
            href="https://dorsu.edu.ph/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Teacher Learn more"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#0b2540', padding: '6px 10px', borderRadius: 8, background: 'rgba(11,37,64,0.04)', fontWeight: 700 }}
          >
            Learn more
          </a>
        </div>

        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <img
            src={`${PUBLIC_URL}/TEACH_BOTTOM.png`}
            alt="Teacher Faculty extra"
            style={{ width: '88%', maxWidth: 720, height: 'auto', margin: '0 auto', borderRadius: 8 }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      </div>
    </div>
  );

  const NursingPrograms = () => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 12 }}>
      <div style={{ maxWidth: 820, width: '100%', textAlign: 'center' }}>
        <div style={{ marginBottom: 12, color: '#0b2540', fontSize: 18, lineHeight: 1.6, textAlign: 'justify' }}>
          <img
            src={`${PUBLIC_URL}/FNAHS.jpg`}
            alt="Faculty of Nursing and Allied Health Sciences logo"
            className="nurs-logo"
            style={{ width: 120, height: 120, objectFit: 'contain', float: 'right', marginLeft: 16, marginBottom: 8, borderRadius: 6 }}
          />
          <style>{`@media (max-width: 720px) { .nurs-logo { float: none !important; display: block; margin: 0 0 12px 0; width: 96px; height: auto; } }`}</style>
          <p style={{ margin: '0 0 10px 0' }}>
            The Faculty of Nursing and Allied Health Sciences offers clinical and community-focused programs that prepare students for careers in nursing, allied health services, and healthcare management. Clinical placements and skills laboratories are integrated into the curriculum.
          </p>
          <p style={{ margin: 0 }}>
            Students gain hands-on patient care experience, theoretical foundations in health sciences, and opportunities for public health engagement and research.
          </p>
          <img
            src={`${PUBLIC_URL}/FNAHSS.jpg`}
            alt="Faculty of Nursing banner"
            className="nurss-logo"
            style={{ width: '100%', maxWidth: 880, height: 'auto', display: 'block', margin: '12px auto 0 auto', borderRadius: 8 }}
          />
          <style>{`@media (max-width: 720px) { .nurss-logo { width: 100% !important; height: auto; margin: 12px 0 0 0; } }`}</style>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{ overflowX: 'auto' }}>
            <style>{`
              .programs-panel { background: #fff; border-radius: 10px; box-shadow: 0 10px 30px rgba(2,6,23,0.06); padding: 8px; }
              .programs-table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 620px; }
              .programs-table thead th { color: #fff; font-weight: 800; font-size: 14px; padding: 14px 18px; letter-spacing: 0.04em; text-transform: uppercase; }
              .programs-table th:first-child { border-top-left-radius: 8px; }
              .programs-table th:last-child { border-top-right-radius: 8px; }
              .programs-table tbody td { padding: 14px 18px; vertical-align: top; color: #102030; font-size: 14px; }
              .programs-table tbody td:nth-child(2) { text-align: justify; }
              .programs-table tbody tr:nth-child(odd) { background: #fbfdfe; }
              .programs-table tbody tr:hover { background: #f1f7fb; }
              .programs-table td + td { max-width: 60%; }
            `}</style>
            <div className="programs-panel">
              <table className="programs-table" style={{ background: 'transparent' }}>
                <thead>
                  <tr style={{ background: item.bgColor }}>
                    <th>PROGRAM</th>
                    <th>COURSE DESCRIPTION</th>
                    <th>ACCREDITATION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 700 }}>BS Nursing</td>
                    <td>Bachelor of Science in Nursing</td>
                    <td style={{ whiteSpace: 'nowrap' }}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bottom area: social links and image for Nursing */}
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <a
            href="https://www.facebook.com/fnahspulsodorsu"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Nursing Faculty Facebook"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#0b2540' }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <rect width="24" height="24" rx="4" fill="#1877F2" />
              <path d="M15.121 8.5h-1.219c-.272 0-.652.137-.652.672v1.008h1.812l-.237 1.848h-1.575V18h-2.036v-6.98H9.72V9.172h1.647V7.78c0-1.63 1.0-3.028 3.08-3.028.87 0 1.62.064 1.84.093v2.657z" fill="#fff" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 700 }}>Visit fnahspulsodorsu</span>
          </a>

          <a
            href="dorsu.fnahs@gmail.com"
            aria-label="Nursing Faculty email"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#0b2540' }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <rect width="24" height="24" rx="4" fill="#D44638" />
              <path d="M4.5 7.5v9c0 .828.672 1.5 1.5 1.5h12c.828 0 1.5-.672 1.5-1.5v-9c0-.828-.672-1.5-1.5-1.5h-12c-.828 0-1.5.672-1.5 1.5z" fill="#fff" />
              <path d="M20.5 7.5l-8 5-8-5" stroke="#D44638" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 700 }}>dorsu.fnahs@gmail.com</span>
          </a>

          <a
            href="https://dorsu.edu.ph/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Nursing Learn more"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#0b2540', padding: '6px 10px', borderRadius: 8, background: 'rgba(11,37,64,0.04)', fontWeight: 700 }}
          >
            Learn more
          </a>
        </div>

        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <img
            src={`${PUBLIC_URL}/NURS_BOTTOM.png`}
            alt="Nursing Faculty extra"
            style={{ width: '88%', maxWidth: 720, height: 'auto', margin: '0 auto', borderRadius: 8 }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      </div>
    </div>
  );

  const BusinessPrograms = () => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 12 }}>
      <div style={{ maxWidth: 820, width: '100%', textAlign: 'center' }}>
        <div style={{ marginBottom: 12, color: '#0b2540', fontSize: 18, lineHeight: 1.6, textAlign: 'justify' }}>
          <img
            src={`${PUBLIC_URL}/FBM.jpg`}
            alt="Faculty of Business and Management logo"
            className="bus-logo"
            style={{ width: 120, height: 120, objectFit: 'contain', float: 'right', marginLeft: 16, marginBottom: 8, borderRadius: 6 }}
          />
          <style>{`@media (max-width: 720px) { .bus-logo { float: none !important; display: block; margin: 0 0 12px 0; width: 96px; height: auto; } }`}</style>
          <p style={{ margin: '0 0 10px 0' }}>
            The Faculty of Business and Management offers programs in accounting, business administration, entrepreneurship, and management. Our curriculum combines theory and applied learning to prepare students for industry careers and leadership roles.
          </p>
          <p style={{ margin: 0 }}>
            Students engage in internships, case studies, and industry collaborations to develop practical skills in finance, operations, and strategic management.
          </p>
          <img
            src={`${PUBLIC_URL}/FBMS.jpg`}
            alt="Faculty of Business banner"
            className="buss-logo"
            style={{ width: '100%', maxWidth: 880, height: 'auto', display: 'block', margin: '12px auto 0 auto', borderRadius: 8 }}
          />
          <style>{`@media (max-width: 720px) { .buss-logo { width: 100% !important; height: auto; margin: 12px 0 0 0; } }`}</style>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{ overflowX: 'auto' }}>
            <style>{`
              .programs-panel { background: #fff; border-radius: 10px; box-shadow: 0 10px 30px rgba(2,6,23,0.06); padding: 8px; }
              .programs-table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 620px; }
              .programs-table thead th { color: #fff; font-weight: 800; font-size: 14px; padding: 14px 18px; letter-spacing: 0.04em; text-transform: uppercase; }
              .programs-table th:first-child { border-top-left-radius: 8px; }
              .programs-table th:last-child { border-top-right-radius: 8px; }
              .programs-table tbody td { padding: 14px 18px; vertical-align: top; color: #102030; font-size: 14px; }
              .programs-table tbody td:nth-child(2) { text-align: justify; }
              .programs-table tbody tr:nth-child(odd) { background: #fbfdfe; }
              .programs-table tbody tr:hover { background: #f1f7fb; }
              .programs-table td + td { max-width: 60%; }
            `}</style>
            <div className="programs-panel">
              <table className="programs-table" style={{ background: 'transparent' }}>
                <thead>
                  <tr style={{ background: item.bgColor }}>
                    <th>PROGRAM</th>
                    <th>COURSE DESCRIPTION</th>
                    <th>ACCREDITATION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 700 }}>BSHM</td>
                    <td>Bachelor of Science in Hospitality Management<br />
                    major in Financial Management</td>
                    <td style={{ whiteSpace: 'nowrap' }}></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>BSBA</td>
                    <td>Bachelor of Science in Business Administration</td>
                    <td style={{ whiteSpace: 'nowrap' }}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bottom area: social links and image for Business */}
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <a
            href="https://www.facebook.com/profile.php?id=61578887008442"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Business Faculty Facebook"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#0b2540' }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <rect width="24" height="24" rx="4" fill="#1877F2" />
              <path d="M15.121 8.5h-1.219c-.272 0-.652.137-.652.672v1.008h1.812l-.237 1.848h-1.575V18h-2.036v-6.98H9.72V9.172h1.647V7.78c0-1.63 1.0-3.028 3.08-3.028.87 0 1.62.064 1.84.093v2.657z" fill="#fff" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 700 }}>Visit Business Facebook</span>
          </a>

          <a
            href="dorsufbmso@gmail.com"
            aria-label="Business Faculty email"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#0b2540' }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <rect width="24" height="24" rx="4" fill="#D44638" />
              <path d="M4.5 7.5v9c0 .828.672 1.5 1.5 1.5h12c.828 0 1.5-.672 1.5-1.5v-9c0-.828-.672-1.5-1.5-1.5h-12c-.828 0-1.5.672-1.5 1.5z" fill="#fff" />
              <path d="M20.5 7.5l-8 5-8-5" stroke="#D44638" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 700 }}>
dorsufbmso@gmail.com</span>
          </a>

          <a
            href="https://dorsu.edu.ph/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Business Learn more"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#0b2540', padding: '6px 10px', borderRadius: 8, background: 'rgba(11,37,64,0.04)', fontWeight: 700 }}
          >
            Learn more
          </a>
        </div>

        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <img
            src={`${PUBLIC_URL}/BUS_BOTTOM.png`}
            alt="Business Faculty extra"
            style={{ width: '88%', maxWidth: 720, height: 'auto', margin: '0 auto', borderRadius: 8 }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      </div>
    </div>
  );

  const HumanitiesPrograms = () => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 12 }}>
      <div style={{ maxWidth: 820, width: '100%', textAlign: 'center' }}>
        <div style={{ marginBottom: 12, color: '#0b2540', fontSize: 18, lineHeight: 1.6, textAlign: 'justify' }}>
          <img
            src={`${PUBLIC_URL}/FHU.jpg`}
            alt="Faculty of Humanities, Social Sciences, and Communication logo"
            className="hum-logo"
            style={{ width: 120, height: 120, objectFit: 'contain', float: 'right', marginLeft: 16, marginBottom: 8, borderRadius: 6 }}
          />
          <style>{`@media (max-width: 720px) { .hum-logo { float: none !important; display: block; margin: 0 0 12px 0; width: 96px; height: auto; } }`}</style>
          <p style={{ margin: '0 0 10px 0' }}>
            The Faculty of Humanities, Social Sciences, and Communication offers programs focused on political science, development communication, and psychology. Students gain theoretical foundations and practical skills in public policy, community engagement, media and communication, and psychological practice.
          </p>
          <p style={{ margin: 0 }}>
            Graduates are prepared for careers in public service, media and development communication, counseling and applied psychology, as well as research and advocacy roles that support community and national development.
          </p>
          <img
            src={`${PUBLIC_URL}/FHUS.jpg`}
            alt="Faculty of Humanities banner"
            className="hums-logo"
            style={{ width: '100%', maxWidth: 880, height: 'auto', display: 'block', margin: '12px auto 0 auto', borderRadius: 8 }}
          />
          <style>{`@media (max-width: 720px) { .hums-logo { width: 100% !important; height: auto; margin: 12px 0 0 0; } }`}</style>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{ overflowX: 'auto' }}>
            <style>{`
              .programs-panel { background: #fff; border-radius: 10px; box-shadow: 0 10px 30px rgba(2,6,23,0.06); padding: 8px; }
              .programs-table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 620px; }
              .programs-table thead th { color: #fff; font-weight: 800; font-size: 14px; padding: 14px 18px; letter-spacing: 0.04em; text-transform: uppercase; }
              .programs-table th:first-child { border-top-left-radius: 8px; }
              .programs-table th:last-child { border-top-right-radius: 8px; }
              .programs-table tbody td { padding: 14px 18px; vertical-align: top; color: #102030; font-size: 14px; }
              .programs-table tbody td:nth-child(2) { text-align: justify; }
              .programs-table tbody tr:nth-child(odd) { background: #fbfdfe; }
              .programs-table tbody tr:hover { background: #f1f7fb; }
              .programs-table td + td { max-width: 60%; }
            `}</style>
            <div className="programs-panel">
              <table className="programs-table" style={{ background: 'transparent' }}>
                <thead>
                  <tr style={{ background: item.bgColor }}>
                    <th>PROGRAM</th>
                    <th>COURSE DESCRIPTION</th>
                    <th>ACCREDITATION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 700 }}>BA PolSci</td>
                    <td>Bachelor of Arts in Political Science</td>
                    <td style={{ whiteSpace: 'nowrap' }}></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>BSDevCom</td>
                    <td>Bachelor of Science in Development Communication</td>
                    <td style={{ whiteSpace: 'nowrap' }}></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>BS Psychology</td>
                    <td>Bachelor of Science in Psychology</td>
                    <td style={{ whiteSpace: 'nowrap' }}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bottom area: social links and image for Humanities */}
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <a
            href="https://www.facebook.com/profile.php?id=61564268566694"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Humanities Faculty Facebook"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#0b2540' }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <rect width="24" height="24" rx="4" fill="#1877F2" />
              <path d="M15.121 8.5h-1.219c-.272 0-.652.137-.652.672v1.008h1.812l-.237 1.848h-1.575V18h-2.036v-6.98H9.72V9.172h1.647V7.78c0-1.63 1.0-3.028 3.08-3.028.87 0 1.62.064 1.84.093v2.657z" fill="#fff" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 700 }}>Visit Humanities Facebook</span>
          </a>

          <a
            href="fhusocom.liberalista@gmail.com"
            aria-label="Humanities Faculty email"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#0b2540' }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <rect width="24" height="24" rx="4" fill="#D44638" />
              <path d="M4.5 7.5v9c0 .828.672 1.5 1.5 1.5h12c.828 0 1.5-.672 1.5-1.5v-9c0-.828-.672-1.5-1.5-1.5h-12c-.828 0-1.5.672-1.5 1.5z" fill="#fff" />
              <path d="M20.5 7.5l-8 5-8-5" stroke="#D44638" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 700 }}>fhusocom.liberalista@gmail.com</span>
          </a>

          <a
            href="https://dorsu.edu.ph/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Humanities Learn more"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#0b2540', padding: '6px 10px', borderRadius: 8, background: 'rgba(11,37,64,0.04)', fontWeight: 700 }}
          >
            Learn more
          </a>
        </div>

        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <img
            src={`${PUBLIC_URL}/HUM_BOTTOM.png`}
            alt="Humanities Faculty extra"
            style={{ width: '88%', maxWidth: 720, height: 'auto', margin: '0 auto', borderRadius: 8 }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      </div>
    </div>
  );

  const ComputingPrograms = () => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 12 }}>
      <div style={{ maxWidth: 820, width: '100%', textAlign: 'center' }}>
        <div style={{ marginBottom: 12, color: '#0b2540', fontSize: 18, lineHeight: 1.6, textAlign: 'justify' }}>
          <img
            src={`${PUBLIC_URL}/COMP.jpg`}
            alt="Faculty of Computing, Engineering & Technology logo"
            className="comp-logo"
            style={{ width: 120, height: 120, objectFit: 'contain', float: 'right', marginLeft: 16, marginBottom: 8, borderRadius: 6 }}
          />
          <style>{`@media (max-width: 720px) { .comp-logo { float: none !important; display: block; margin: 0 0 12px 0; width: 96px; height: auto; } }`}</style>
          <p style={{ margin: '0 0 10px 0' }}>
            The Faculty of Computing, Engineering and Technology offers practical and industry-aligned programs in computing, engineering, and applied technology. Students gain hands-on experience, project-based learning, and opportunities to collaborate with industry partners.
          </p>
          <p style={{ margin: 0 }}>
            Our programs emphasize problem solving, software and systems development, engineering fundamentals, and applied mathematics to prepare graduates for technical careers and active contributions to regional innovation.
          </p>
          <img
            src={`${PUBLIC_URL}/COMPS.jpg`}
            alt="Faculty of Computing banner"
            className="comps-logo"
            style={{ width: '100%', maxWidth: 880, height: 'auto', display: 'block', margin: '12px auto 0 auto', borderRadius: 8 }}
          />
          <style>{`@media (max-width: 720px) { .comps-logo { width: 100% !important; height: auto; margin: 12px 0 0 0; } }`}</style>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{ overflowX: 'auto' }}>
            <style>{`
              .programs-panel { background: #fff; border-radius: 10px; box-shadow: 0 10px 30px rgba(2,6,23,0.06); padding: 8px; }
              .programs-table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 620px; }
              .programs-table thead th { color: #fff; font-weight: 800; font-size: 14px; padding: 14px 18px; letter-spacing: 0.04em; text-transform: uppercase; }
              .programs-table th:first-child { border-top-left-radius: 8px; }
              .programs-table th:last-child { border-top-right-radius: 8px; }
              .programs-table tbody td { padding: 14px 18px; vertical-align: top; color: #102030; font-size: 14px; }
              .programs-table tbody td:nth-child(2) { text-align: justify; }
              .programs-table tbody tr:nth-child(odd) { background: #fbfdfe; }
              .programs-table tbody tr:hover { background: #f1f7fb; }
              .programs-table td + td { max-width: 60%; }
            `}</style>
            <div className="programs-panel">
              <table className="programs-table" style={{ background: 'transparent' }}>
                <thead>
                  <tr style={{ background: item.bgColor }}>
                    <th>PROGRAM</th>
                    <th>COURSE DESCRIPTION</th>
                    <th>ACCREDITATION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 700 }}>BS Information Technology</td>
                    <td>Bachelor of Science in Information Technology</td>
                    <td style={{ whiteSpace: 'nowrap' }}></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>BS Civil Engineering</td>
                    <td>Bachelor of Science in Civil Engineering</td>
                    <td style={{ whiteSpace: 'nowrap' }}></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>BS Mathematics</td>
                    <td>Bachelor of Science in Mathematics</td>
                    <td style={{ whiteSpace: 'nowrap' }}></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>BS Industrial Technology</td>
                    <td>Bachelor in Industrial Technology Management major in Automotive Technology</td>
                    <td style={{ whiteSpace: 'nowrap' }}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bottom area: social links and image matching CriminalPrograms format */}
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          {/* TODO: replace this href with the faculty's Facebook page when available */}
          <a
            href="https://www.facebook.com/FaCETdorsu"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="FaCETdorsu"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#0b2540' }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <rect width="24" height="24" rx="4" fill="#1877F2" />
              <path d="M15.121 8.5h-1.219c-.272 0-.652.137-.652.672v1.008h1.812l-.237 1.848h-1.575V18h-2.036v-6.98H9.72V9.172h1.647V7.78c0-1.63 1.0-3.028 3.08-3.028.87 0 1.62.064 1.84.093v2.657z" fill="#fff" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 700 }}>FaCETdorsu</span>
          </a>

          <a
            href="mailto:ice.dean@dorsu.edu.ph"
            aria-label="Faculty email"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#0b2540' }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
              <rect width="24" height="24" rx="4" fill="#D44638" />
              <path d="M4.5 7.5v9c0 .828.672 1.5 1.5 1.5h12c.828 0 1.5-.672 1.5-1.5v-9c0-.828-.672-1.5-1.5-1.5h-12c-.828 0-1.5.672-1.5 1.5z" fill="#fff" />
              <path d="M20.5 7.5l-8 5-8-5" stroke="#D44638" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 700 }}>ice.dean@dorsu.edu.ph</span>
          </a>

          <a
            href="https://dorsu.edu.ph/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Learn more"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#0b2540', padding: '6px 10px', borderRadius: 8, background: 'rgba(11,37,64,0.04)', fontWeight: 700 }}
          >
            Learn more
          </a>
        </div>

        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <img
            src={`${PUBLIC_URL}/COMP_BOTTOM.png`}
            alt="Faculty computing extra"
            style={{ width: '88%', maxWidth: 720, height: 'auto', margin: '0 auto', borderRadius: 8 }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => setSubTab('faculty')}
          aria-pressed={subTab === 'faculty'}
          style={{
            padding: '12px 18px',
            borderRadius: 12,
            border: 'none',
            background: subTab === 'faculty' ? item.bgColor : '#6d6161ff',
            color: subTab === 'faculty' ? '#fff' : '#fefeffff',
            cursor: 'pointer',
            boxShadow: subTab === 'faculty' ? `0 8px 24px ${item.bgColor}33` : '0 6px 18px rgba(11,37,64,0.06)',
            fontWeight: 700,
            fontSize: 15,
            transition: 'transform 180ms ease, box-shadow 180ms ease',
          }}
        >
          Faculty
        </button>
        <button
          type="button"
          onClick={() => setSubTab('programs')}
          aria-pressed={subTab === 'programs'}
          style={{
            padding: '12px 18px',
            borderRadius: 12,
            border: 'none',
            background: subTab === 'programs' ? item.bgColor : '#6d6161ff',
            color: subTab === 'programs' ? '#fff' : '#fefeffff',
            cursor: 'pointer',
            boxShadow: subTab === 'programs' ? `0 8px 24px ${item.bgColor}33` : '0 6px 18px rgba(11,37,64,0.06)',
            fontWeight: 700,
            fontSize: 15,
            transition: 'transform 180ms ease, box-shadow 180ms ease',
          }}
        >
          Programs
        </button>
      </div>

      <div>
        {subTab === 'faculty' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <img
                src={(currentFaculty && currentFaculty[0] && currentFaculty[0].img) || `${PUBLIC_URL}/picture_1.jpg`}
                alt={(currentFaculty && currentFaculty[0] && currentFaculty[0].name) || 'Faculty head'}
                style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: '50%', display: 'block', boxShadow: '0 8px 20px rgba(16,24,40,0.08)' }}
              />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, color: '#0b2540', fontSize: 16 }}>{(currentFaculty && currentFaculty[0] && currentFaculty[0].name) || 'Head of Faculty'}</div>
                <div style={{ fontSize: 13, color: '#334155', marginTop: 4 }}>{(currentFaculty && currentFaculty[0] && currentFaculty[0].title) || ''}</div>
              </div>
            </div>

            {selectedIndex === 0 && <PersonnelTable list={AGRICULTURE_PERSONNEL} />}
            {selectedIndex === 1 && <PersonnelTable list={CRIMINAL_PERSONNEL} />}
            {selectedIndex === 2 && <PersonnelTable list={COMPUTING_PERSONNEL} />}
            {selectedIndex === 3 && <PersonnelTable list={TEACHER_PERSONNEL} />}
            {selectedIndex === 4 && <PersonnelTable list={NURSING_PERSONNEL} />}
            {selectedIndex === 5 && <PersonnelTable list={BUSINESS_PERSONNEL} />}
            {selectedIndex === 6 && <PersonnelTable list={HUMANITIES_PERSONNEL} />}
          </div>
        ) : (
          selectedIndex === 0 ? (
            <AgriculturePrograms />
          ) : selectedIndex === 1 ? (
            <CriminalPrograms />
          ) : selectedIndex === 2 ? (
            <ComputingPrograms />
          ) : selectedIndex === 3 ? (
            <TeacherPrograms />
          ) : selectedIndex === 4 ? (
            <NursingPrograms />
          ) : selectedIndex === 5 ? (
            <BusinessPrograms />
          ) : selectedIndex === 6 ? (
            <HumanitiesPrograms />
          ) : (
            <div style={{ padding: 12, color: '#0b2540', fontSize: 16, lineHeight: 1.6 }}>
              <p style={{ margin: 0 }}>{item.description}</p>
            </div>
          )
        )}
      </div>
    </>
  );
};

export default FacultyShell;
