import React, { useState, useCallback } from 'react';
// export/print helper removed — no longer needed
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';

import './AlumniSurveysPanel.css';

// list of programs used by the Program/Course datalist (same as SignupPanel)
const programs = [
  'Bachelor of Elementary Education (BEED)',
  'Bachelor of Early Childhood Education (BCED)',
  'Bachelor of Special Needs Education (BSNED)',
  'Bachelor Physical Education (BPED)',
  'Bachelor of Technology and Livelihood Education major in Home Economics (BTLED)',
  'Bachelor of Secondary Education major in English (BSED English)',
  'Bachelor of Secondary Education major in Filipino (BSED Filipino)',
  'Bachelor of Secondary Education major in Mathematics (BSED Mathematics)',
  'Bachelor of Secondary Education major in Science (BSED Science)',
  'Bachelor of Science in Agribusiness Management (BSAM)',
  'Bachelor of Science in Agriculture major in Horticulture (BSA)',
  'Bachelor of Science in Agriculture major in Animal Science (BSA)',
  'Bachelor of Science in Agriculture major in Crop Science (BSA)',
  'Bachelor of Science in Biology (BSBio)',
  'Bachelor of Science in Biology major in Animal Biology (BSBio)',
  'Bachelor of Science in Biology major in Ecology (BSBio)',
  'Bachelor of Science in Environmental Science (BSES)',
  'Bachelor in Industrial Technology Management major in Automotive Technology (BITM)',
  'Bachelor of Science in Civil Engineering (BSCE)',
  'Bachelor of Science in Information Technology (BSIT)',
  'Bachelor of Science in Mathematics (BSMath)',
  'Bachelor of Science in Mathematics with Research Statistics (BSMath)',
  'Bachelor of Science in Nursing (BSN)',
  'Bachelor of Science in Criminology (BSC)',
  'Bachelor of Science in Business Administration major of Financial Management (BSBA)',
  'Bachelor of Science in Hospitality Management (BSHM)',
  'Bachelor of Arts Political Science (BA PolSci)',
  'Bachelor of Science in Development Communication (BSDevCom)',
  'Bachelor of Science in Psychology (BS Psychology)'
];

const initialFormState = {
  lastName: '',
  firstName: '',
  middleName: '',
  yearGraduated: '2025',
  courseProgram: '',
  studentNumber: '',
  birthDate: '',
  age: '',
  gender: 'male',
  homeAddress: '',
  telephoneNumber: '',
  mobileNumber: '',
  email: '',
  currentJobPosition: '',
  companyAffiliation: '',
  companyAddress: '',
  approximateMonthlySalary: '',
  employedAfterGraduation: '',
  jobDifficulties: [],
  employmentSource: '',
  employmentRecords: [],
  jobsRelatedToExperience: '',
  improvementSuggestions: '',
  hasBeenPromoted: '',
  workPerformanceRating: '',
  hasOwnBusiness: '',
  selfEmployment: {
    businessName: '',
    natureOfBusiness: '',
    roleInBusiness: '',
    monthlyProfit: '',
    businessAddress: '',
    businessPhone: ''
  }
};

function AlumniSurveysPanel() {

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [existingSurvey, setExistingSurvey] = useState(null);
  const [editingExisting, setEditingExisting] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSubmittedModal, setShowSubmittedModal] = useState(false);
  const redirectTimerRef = React.useRef(null);
  // Clean up redirect timer when component unmounts
  React.useEffect(() => {
    return () => {
      try { if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current); } catch(_){}
    };
  }, []);
  // Local toast for this panel (keeps consistent notifications if global toast not mounted)
  const { show } = useToast();
  const showToast = useCallback((type, message, timeout = 3200) => {
    try { show(message || '', { type: type || 'info', duration: timeout }); } catch(_){}}
  , [show]);
  const navigate = useNavigate();
  // request-change flow removed; users can now edit their own submitted survey



  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    // Prevent automatic submission; show confirmation modal first
    e.preventDefault();
    if (alreadySubmitted && !editingExisting) {
      setErrorMessage('You have already submitted the survey. Use Edit to modify your submission.');
      return;
    }
    setShowConfirm(true);
  };

  const performCancel = () => {
    try {
      setFormData(initialFormState);
      setEditingExisting(false);
      setShowConfirm(false);
      setErrorMessage('');
      setSuccessMessage('');
    } catch (_) {}
    try { navigate(-1); } catch (e) { try { window.history.back(); } catch(_){} }
    setShowCancelConfirm(false);
  };

  // The real submit function that executes after confirmation
  const performSubmit = async () => {
    setShowConfirm(false);
    setSuccessMessage('');
    setErrorMessage('');
    setLoading(true);

    // derive birth year/month/day from single birthDate (YYYY-MM-DD)
    let birth_year = null, birth_month = null, birth_day = null;
    if (formData.birthDate) {
      const parts = String(formData.birthDate).split('-');
      if (parts.length === 3) {
        birth_year = parts[0];
        birth_month = parts[1];
        birth_day = parts[2];
      }
    }

    // Map frontend camelCase keys to backend snake_case field names
    const payload = {
      // If the user is logged in, include their alumni id so the survey links to the Alumni row
      ...(function(){
        try {
          // Avoid mixing || and && in one expression to satisfy ESLint no-mixed-operators
          const storedCurrentUser = localStorage.getItem('currentUser');
          const raw = localStorage.getItem('userId') || (storedCurrentUser && JSON.parse(storedCurrentUser).id);
          const id = raw ? (typeof raw === 'string' ? Number(raw) : raw) : null;
          return id ? { alumni: id } : {};
        } catch (_) { return {}; }
      })(),
      last_name: formData.lastName,
      first_name: formData.firstName,
      middle_name: formData.middleName,
      year_graduated: formData.yearGraduated,
      course_program: formData.courseProgram,
      student_number: formData.studentNumber,
      birth_year: birth_year,
      birth_month: birth_month,
      birth_day: birth_day,
      age: formData.age === '' ? null : Number(formData.age),
      gender: formData.gender,
      home_address: formData.homeAddress,
      telephone_number: formData.telephoneNumber,
      mobile_number: formData.mobileNumber,
      email: formData.email,
      current_job_position: formData.currentJobPosition,
      company_affiliation: formData.companyAffiliation,
      company_address: formData.companyAddress,
      approximate_monthly_salary: formData.approximateMonthlySalary,
      employed_after_graduation: formData.employedAfterGraduation,
      job_difficulties: formData.jobDifficulties || [],
      employment_source: formData.employmentSource,
      ...(formData.employmentRecords && formData.employmentRecords.length > 0 ? {
        employment_records: formData.employmentRecords.map(rec => ({
          company_name: rec.companyName || '',
          date_employed: rec.dateEmployed || '',
          position_and_status: rec.positionAndStatus || '',
          monthly_salary_range: rec.monthlySalaryRange || ''
        }))
      } : {}),
      jobs_related_to_experience: formData.jobsRelatedToExperience,
      improvement_suggestions: formData.improvementSuggestions,
      has_been_promoted: formData.hasBeenPromoted,
      work_performance_rating: formData.workPerformanceRating,
      // indicate whether the respondent has their own business
      has_own_business: (formData.hasOwnBusiness === 'yes'),
    };

    try {
      const base = process.env.REACT_APP_API_BASE || '';
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let resp;
      if (editingExisting && existingSurvey && existingSurvey.id) {
        // PATCH existing survey
        resp = await fetch(`${base}/api/alumni-surveys/${existingSurvey.id}/`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        // create new
        resp = await fetch(`${base}/api/alumni-surveys/`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }

      if (resp.ok) {
        const result = await resp.json().catch(() => null);
        if (editingExisting) {
          setSuccessMessage('Survey updated successfully.');
          if (result) {
            setExistingSurvey(result);
            setFormData(mapSurveyToForm(result));
          }
          setEditingExisting(false);
        } else {
          setSuccessMessage('Survey submitted successfully. Thank you!');
          setFormData(initialFormState);
          if (result) {
            setExistingSurvey(result);
            setAlreadySubmitted(true);
          }
          // Show a confirmation modal and redirect back to /Dashboard after a short delay
          try {
            setShowSubmittedModal(true);
            // clear any previous timer
            if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
            redirectTimerRef.current = setTimeout(() => {
              try { navigate('/Dashboard'); } catch (e) { try { window.location.href = '/Dashboard'; } catch(_){} }
            }, 2200);
          } catch (_) {}
        }
      } else {
        let bodyText = '';
        try {
          const json = await resp.json();
          bodyText = JSON.stringify(json, null, 2);
        } catch (jsonErr) {
          try { bodyText = await resp.text(); } catch (txtErr) { bodyText = '<unreadable response body>'; }
        }
        console.error('Survey submit failed', { status: resp.status, statusText: resp.statusText, body: bodyText });
        setErrorMessage(`Submission failed (status ${resp.status} ${resp.statusText}): ${bodyText}`);
      }
    } catch (err) {
      console.error('Network error submitting survey', err);
      setErrorMessage('Network error submitting the survey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If the current user already submitted a survey, load it and populate the form
  // Assumption: API supports filtering by alumni id via query param `?alumni=<id>` and returns an array or paged results
  const mapSurveyToForm = (s) => {
    const birthYear = s.birth_year || s.birthYear || null;
    const birthMonth = s.birth_month || s.birthMonth || null;
    const birthDay = s.birth_day || s.birthDay || null;
    let birthDate = '';
    if (birthYear && birthMonth && birthDay) {
      const mm = String(birthMonth).padStart(2, '0');
      const dd = String(birthDay).padStart(2, '0');
      birthDate = `${birthYear}-${mm}-${dd}`;
    }
    return {
      lastName: s.last_name || '',
      firstName: s.first_name || '',
      middleName: s.middle_name || '',
      yearGraduated: s.year_graduated || '',
      courseProgram: s.course_program || '',
      studentNumber: s.student_number || '',
      birthDate: birthDate,
      age: s.age !== null && s.age !== undefined ? String(s.age) : '',
      gender: s.gender || 'male',
      homeAddress: s.home_address || '',
      telephoneNumber: s.telephone_number || '',
      mobileNumber: s.mobile_number || '',
      email: s.email || '',
      currentJobPosition: s.current_job_position || '',
      companyAffiliation: s.company_affiliation || '',
      companyAddress: s.company_address || '',
      approximateMonthlySalary: s.approximate_monthly_salary || '',
      employedAfterGraduation: s.employed_after_graduation || '',
      jobDifficulties: Array.isArray(s.job_difficulties) ? s.job_difficulties : (s.job_difficulties ? [s.job_difficulties] : []),
      employmentSource: s.employment_source || '',
      employmentRecords: Array.isArray(s.employment_records) ? s.employment_records.map(r => ({
        companyName: r.company_name || '',
        dateEmployed: r.date_employed || '',
        positionAndStatus: r.position_and_status || '',
        monthlySalaryRange: r.monthly_salary_range || ''
      })) : [],
      jobsRelatedToExperience: s.jobs_related_to_experience || '',
      improvementSuggestions: s.improvement_suggestions || '',
      hasBeenPromoted: s.has_been_promoted || '',
      workPerformanceRating: s.work_performance_rating || '',
      // map legacy self_employment into simple yes/no flag
      selfEmployment: (Array.isArray(s.self_employment) && s.self_employment.length > 0) ? ({
        businessName: s.self_employment[0].business_name || '',
        natureOfBusiness: s.self_employment[0].nature_of_business || '',
        roleInBusiness: s.self_employment[0].role_in_business || '',
        monthlyProfit: s.self_employment[0].monthly_profit || '',
        businessAddress: s.self_employment[0].business_address || '',
        businessPhone: s.self_employment[0].business_phone || ''
      }) : {
        businessName: '', natureOfBusiness: '', roleInBusiness: '', monthlyProfit: '', businessAddress: '', businessPhone: ''
      },
      hasOwnBusiness: (Array.isArray(s.self_employment) && s.self_employment.length > 0) ? 'yes' : 'no'
    };
  };

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = localStorage.getItem('currentUser');
        const raw = localStorage.getItem('userId') || (stored && JSON.parse(stored).id);
        const id = raw ? (typeof raw === 'string' ? Number(raw) : raw) : null;
        if (!id) return;
        const base = process.env.REACT_APP_API_BASE || '';
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${base}/api/alumni-surveys/?alumni=${id}`, { headers });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const list = Array.isArray(data) ? data : (Array.isArray(data.results) ? data.results : []);
        if (mounted && Array.isArray(list) && list.length > 0) {
          const survey = list[0];
          setExistingSurvey(survey);
          setFormData(mapSurveyToForm(survey));
          setAlreadySubmitted(true);
          // Automatically open the previously submitted survey in edit mode
          setEditingExisting(true);
          setSuccessMessage('Loaded your previous submission — you can edit it.');
        }
      } catch (e) {
        // ignore failures — user can still submit
        console.warn('Failed to check existing alumni survey', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Listen for messages from the export window (so Edit button in export can trigger edit mode here)
  React.useEffect(() => {
    const handler = (e) => {
      try {
        const data = e && e.data;
        if (!data || data.action !== 'editSurvey') return;
        // If the message requests editing this survey, open edit mode
        // Only activate if the survey matches or no id provided
        if (!data.id || (existingSurvey && Number(data.id) === Number(existingSurvey.id))) {
          setEditingExisting(true);
          if (existingSurvey) setFormData(mapSurveyToForm(existingSurvey));
          window.scrollTo && window.scrollTo({ top: 0, behavior: 'smooth' });
          try { showToast('info', 'Edit mode opened from export window'); } catch (_) {}
        }
      } catch (_) {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [existingSurvey, showToast]);

  const renderReadOnlySurvey = () => {
    if (!existingSurvey) return null;
    const s = existingSurvey;
    return (
      <div style={{ background: '#fff', padding: 16, borderRadius: 10, boxShadow: '0 8px 24px rgba(2,6,23,0.06)' }}>
        <h3 className="no-print" style={{ marginTop: 0 }}>Your submitted survey</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: '#374151' }}>Last name</div>
            <div style={{ marginTop: 6 }}>{s.last_name || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#374151' }}>First name</div>
            <div style={{ marginTop: 6 }}>{s.first_name || '-'}</div>
          </div>

          <div>
            <div style={{ fontSize: 13, color: '#374151' }}>Middle name</div>
            <div style={{ marginTop: 6 }}>{s.middle_name || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#374151' }}>Year graduated</div>
            <div style={{ marginTop: 6 }}>{s.year_graduated || '-'}</div>
          </div>

          <div>
            <div style={{ fontSize: 13, color: '#374151' }}>Program / Course</div>
            <div style={{ marginTop: 6 }}>{s.course_program || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#374151' }}>Student number</div>
            <div style={{ marginTop: 6 }}>{s.student_number || '-'}</div>
          </div>

          <div>
            <div style={{ fontSize: 13, color: '#374151' }}>Birth year</div>
            <div style={{ marginTop: 6 }}>{s.birth_year || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#374151' }}>Birth month</div>
            <div style={{ marginTop: 6 }}>{s.birth_month || '-'}</div>
          </div>

          <div>
            <div style={{ fontSize: 13, color: '#374151' }}>Birth day</div>
            <div style={{ marginTop: 6 }}>{s.birth_day || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#374151' }}>Age</div>
            <div style={{ marginTop: 6 }}>{(s.age !== null && s.age !== undefined) ? String(s.age) : '-'}</div>
          </div>

          <div>
            <div style={{ fontSize: 13, color: '#374151' }}>Gender</div>
            <div style={{ marginTop: 6 }}>{s.gender || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#374151' }}>Home address</div>
            <div style={{ marginTop: 6 }}>{s.home_address || '-'}</div>
          </div>

          <div>
            <div style={{ fontSize: 13, color: '#374151' }}>Telephone number</div>
            <div style={{ marginTop: 6 }}>{s.telephone_number || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#374151' }}>Mobile number</div>
            <div style={{ marginTop: 6 }}>{s.mobile_number || '-'}</div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 13, color: '#374151' }}>Email</div>
            <div style={{ marginTop: 6 }}>{s.email || '-'}</div>
          </div>

          <div>
            <div style={{ fontSize: 13, color: '#374151' }}>Current job position</div>
            <div style={{ marginTop: 6 }}>{s.current_job_position || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#374151' }}>Company affiliation</div>
            <div style={{ marginTop: 6 }}>{s.company_affiliation || '-'}</div>
          </div>

          <div>
            <div style={{ fontSize: 13, color: '#374151' }}>Company address</div>
            <div style={{ marginTop: 6 }}>{s.company_address || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#374151' }}>Approx. monthly salary</div>
            <div style={{ marginTop: 6 }}>{s.approximate_monthly_salary || '-'}</div>
          </div>

          <div>
            <div style={{ fontSize: 13, color: '#374151' }}>Employed after graduation</div>
            <div style={{ marginTop: 6 }}>{s.employed_after_graduation || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#374151' }}>Job difficulties</div>
            <div style={{ marginTop: 6 }}>{Array.isArray(s.job_difficulties) ? (s.job_difficulties.length ? s.job_difficulties.join(', ') : '-') : (s.job_difficulties ? String(s.job_difficulties) : '-')}</div>
          </div>

          <div>
            <div style={{ fontSize: 13, color: '#374151' }}>Employment source</div>
            <div style={{ marginTop: 6 }}>{s.employment_source || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#374151' }}>Jobs related to experience?</div>
            <div style={{ marginTop: 6 }}>{s.jobs_related_to_experience || '-'}</div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 13, color: '#374151' }}>Improvement suggestions / Additional notes</div>
            <div style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{s.improvement_suggestions || '-'}</div>
          </div>

          <div>
            <div style={{ fontSize: 13, color: '#374151' }}>Has been promoted</div>
            <div style={{ marginTop: 6 }}>{s.has_been_promoted || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#374151' }}>Work performance rating</div>
            <div style={{ marginTop: 6 }}>{s.work_performance_rating || '-'}</div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            {Array.isArray(s.employment_records) && s.employment_records.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 13, color: '#374151' }}>Employment history</div>
                <ul style={{ marginTop: 6 }}>
                  {s.employment_records.map((r, i) => (
                    <li key={i}>{(r.company_name || '-') + ' — ' + (r.position_and_status || '-') + (r.date_employed ? (' (' + r.date_employed + ')') : '')}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            {Array.isArray(s.self_employment) && s.self_employment.length > 0 ? (
              <div>
                <div style={{ fontSize: 13, color: '#374151' }}>Self-employment (first entry)</div>
                <div style={{ marginTop: 6 }}>{(s.self_employment[0].business_name || '-') + ' — ' + (s.self_employment[0].nature_of_business || '')}</div>
                <div style={{ marginTop: 4 }}>{s.self_employment[0].role_in_business ? ('Role: ' + s.self_employment[0].role_in_business) : ''} {s.self_employment[0].monthly_profit ? (' • Profit: ' + s.self_employment[0].monthly_profit) : ''}</div>
              </div>
            ) : null}
          </div>
  </div>
          <div className="no-print" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
          <button type="button" className="btn btn-outline" onClick={() => {
            try { navigate('/'); } catch (e) { window.location.href = '/'; }
          }}>Back</button>
          <button type="button" className="btn btn-primary" onClick={() => {
            // switch to edit mode: prefill form, show toast confirmation, and scroll to form
            setFormData(mapSurveyToForm(existingSurvey));
            setEditingExisting(true);
            try { showToast('info', 'You are now editing your submitted survey', 2500); } catch(_){ }
            window.scrollTo && window.scrollTo({ top: 0, behavior: 'smooth' });
          }}>Edit survey</button>
        </div>
      </div>
    );
  };

  return (
    <div className="survey-container">
      <h2 className="survey-title" style={{ textAlign: 'center', width: '100%', marginBottom: 8 }}>Alumni Survey Form</h2>
      
      <p className="survey-description" style={{ textAlign: 'center', margin: '0 auto 18px', maxWidth: 900 }}>Please fill out this survey to help us improve our programs and services.</p>
      {/* Inline edit-mode banner */}
      {editingExisting && (
        <div style={{ maxWidth: 900, margin: '0 auto 12px', background: '#fffbeb', border: '1px solid #fef3c7', color: '#92400e', padding: '10px 12px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14 }}><strong>Editing mode:</strong> You are editing your submitted survey. Changes will update your existing submission.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-outline" onClick={() => {
              // revert to read-only view
              setEditingExisting(false);
              // scroll to top so read-only summary is visible
              window.scrollTo && window.scrollTo({ top: 0, behavior: 'smooth' });
              showToast('info', 'Edit cancelled');
            }}>Cancel Edit</button>
          </div>
        </div>
      )}
      
      <div className="survey-form-container">
        <form onSubmit={handleSubmit}>
          {alreadySubmitted && !editingExisting ? (
            <div style={{ marginBottom: 12 }}>
              {renderReadOnlySurvey()}
            </div>
          ) : (
            <fieldset className="no-print" style={{ border: 'none', padding: 0 }}>
          <div className="form-group">
            <label className="form-label"><span className="required-star">* </span>Last name</label>
            <input className="form-input" type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label className="form-label"><span className="required-star">* </span>First name</label>
            <input className="form-input" type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label className="form-label"><span className="required-star">* </span>Middle name</label>
            <input className="form-input" type="text" name="middleName" value={formData.middleName} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Year Graduated</label>
            <select className="form-input" name="yearGraduated" value={formData.yearGraduated} onChange={handleInputChange}>
              <option value="">- Select -</option>
              {Array.from({ length: 2025 - 1989 + 1 }, (_, i) => 2025 - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Program / Course</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#888',
                pointerEvents: 'none'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 21l-4.35-4.35" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <input
                type="text"
                name="courseProgram"
                list="programs-list"
                value={formData.courseProgram}
                onChange={handleInputChange}
                placeholder="Type to search or select a program"
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '13px',
                  transition: 'all 0.3s',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: '#fff'
                }}
              />
              <datalist id="programs-list">
                {programs.map(p => (<option key={p} value={p} />))}
              </datalist>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Student Number</label>
            <input className="form-input" type="text" name="studentNumber" value={formData.studentNumber} onChange={handleInputChange} />
          </div>

          <div className="form-group">
            <label className="form-label"><span className="required-star">* </span>Birth date</label>
            <input className="form-input" type="date" name="birthDate" value={formData.birthDate} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label className="form-label"><span className="required-star">* </span>Age</label>
            <input className="form-input" type="number" name="age" value={formData.age} onChange={handleInputChange} required min="0" />
          </div>

          <div className="form-group">
            <label className="form-label"><span className="required-star">* </span>Gender</label>
            <div className="flex-row">
              <label className="option-label"><input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={handleInputChange} required /> Male</label>
              <label className="option-label"><input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={handleInputChange} required /> Female</label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label"><span className="required-star">* </span>Home Address</label>
            <input className="form-input" type="text" name="homeAddress" value={formData.homeAddress} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Telephone Number</label>
            <input className="form-input" type="tel" name="telephoneNumber" value={formData.telephoneNumber} onChange={handleInputChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input className="form-input" type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} />
          </div>

          <div className="form-group">
            <label className="form-label"><span className="required-star">* </span>Email</label>
            <input className="form-input" type="email" name="email" value={formData.email} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Current Job Position</label>
            <input className="form-input" type="text" name="currentJobPosition" value={formData.currentJobPosition} onChange={handleInputChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Company Affiliation</label>
            <input className="form-input" type="text" name="companyAffiliation" value={formData.companyAffiliation} onChange={handleInputChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Company Address</label>
            <input className="form-input" type="text" name="companyAddress" value={formData.companyAddress} onChange={handleInputChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Approximate Monthly Salary</label>
            <input className="form-input" type="number" name="approximateMonthlySalary" value={formData.approximateMonthlySalary} onChange={handleInputChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Have you been employed immediately 6 months or less after graduation?</label>
            <div className="flex-row">
              <label className="option-label"><input type="radio" name="employedAfterGraduation" value="yes" checked={formData.employedAfterGraduation === 'yes'} onChange={handleInputChange} /> Yes</label>
              <label className="option-label"><input type="radio" name="employedAfterGraduation" value="no" checked={formData.employedAfterGraduation === 'no'} onChange={handleInputChange} /> No</label>
            </div>
          </div>

            <div className="form-group">
              <label style={{ 
                display: 'block', 
                marginBottom: '8px',
                color: '#666',
                fontSize: '0.9rem'
              }}>
                What difficulties did you encounter in your first job?
              </label>
              <div className="checkbox-group">
                {[
                  'Lack of Experience',
                  'Skills Mismatch',
                  'Networking/Connections',
                  'Location',
                  'Others'
                ].map((difficulty) => (
                  <label key={difficulty} className="option-label">
                    <input
                      type="checkbox"
                      name="jobDifficulties"
                      value={difficulty}
                      checked={formData.jobDifficulties.includes(difficulty)}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          jobDifficulties: e.target.checked 
                            ? [...prev.jobDifficulties, value]
                            : prev.jobDifficulties.filter(d => d !== value)
                        }));
                      }}
                    />
                    {difficulty}
                  </label>
                ))}
              </div>
            </div>

          <div className="form-group">
            <label className="form-label">In your first employment, which of the following has been your source?</label>
            <div className="radio-group">
              {[
                'DOrSU Job Fair',
                'Academic Department/Faculty Referral',
                'Guidance Placement Referral',
                'OJT site',
                'Classified Ads (Printed/Electronic)',
                'Walk-in Application',
                'Family and Friends Referral'
              ].map((source) => (
                <label key={source} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="radio"
                    name="employmentSource"
                    value={source}
                    checked={formData.employmentSource === source}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        employmentSource: value
                      }));
                    }}
                  />
                  {source}
                </label>
              ))}
            </div>
          </div>

          {/* Employment Record Section */}
          <div style={{ marginBottom: '32px', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px', background: '#fafafa' }}>
            <h3 style={{ 
              color: '#1976d2',
              marginBottom: '16px',
              fontSize: '1.2rem',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              Employment Record
            </h3>
            <p style={{ 
              fontSize: '0.9rem',
              color: '#666',
              fontStyle: 'italic',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              Begin with your first job after graduation
            </p>

            <div style={{ marginBottom: '20px' }}>
              {/* Header Row */}
              <div className="employment-grid employment-header">
                <div className="form-label">Name of the Company</div>
                <div className="form-label">Date Employed</div>
                <div className="form-label">Employment Position and Status</div>
                <div className="form-label">Approximate Monthly Salary Range</div>
              </div>

              {/* Employment Records */}
              {formData.employmentRecords.map((record, index) => (
                <div key={index} className="employment-record-row">
                  <input
                    className="form-input"
                    type="text"
                    value={record.companyName}
                    onChange={(e) => {
                      const newRecords = [...formData.employmentRecords];
                      newRecords[index] = { ...record, companyName: e.target.value };
                      setFormData(prev => ({ ...prev, employmentRecords: newRecords }));
                    }}
                  />
                  <input
                    className="form-input"
                    type="date"
                    value={record.dateEmployed}
                    onChange={(e) => {
                      const newRecords = [...formData.employmentRecords];
                      newRecords[index] = { ...record, dateEmployed: e.target.value };
                      setFormData(prev => ({ ...prev, employmentRecords: newRecords }));
                    }}
                  />
                  <input
                    className="form-input"
                    type="text"
                    value={record.positionAndStatus}
                    onChange={(e) => {
                      const newRecords = [...formData.employmentRecords];
                      newRecords[index] = { ...record, positionAndStatus: e.target.value };
                      setFormData(prev => ({ ...prev, employmentRecords: newRecords }));
                    }}
                  />
                  <select
                    className="form-input"
                    value={record.monthlySalaryRange}
                    onChange={(e) => {
                      const newRecords = [...formData.employmentRecords];
                      newRecords[index] = { ...record, monthlySalaryRange: e.target.value };
                      setFormData(prev => ({ ...prev, employmentRecords: newRecords }));
                    }}
                  >
                    <option value="">- Select -</option>
                    <option value="Below 10,000">Below 10,000</option>
                    <option value="10,000-15,000">10,000-15,000</option>
                    <option value="15,001-20,000">15,001-20,000</option>
                    <option value="20,001-25,000">20,001-25,000</option>
                    <option value="Above 25,000">Above 25,000</option>
                  </select>
                </div>
              ))}
            </div>

            {/* Add Employment Record Button */}
            <button
              type="button"
              className="add-record-btn"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  employmentRecords: [...prev.employmentRecords, {
                    companyName: '',
                    dateEmployed: '',
                    positionAndStatus: '',
                    monthlySalaryRange: ''
                  }]
                }));
              }}
            >
              + Add Employment Record
            </button>
            {/* hide add button when printing */}
            
          </div>

          {/* Additional Questions */}
          <div className="form-group">
            <label className="form-label">Do you think your getting jobs related to your experience, skills and knowledge learned in your University?</label>
            <div className="flex-row" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '20px' }}>
                <label className="option-label"><input type="radio" name="jobsRelatedToExperience" value="yes" checked={formData.jobsRelatedToExperience === 'yes'} onChange={handleInputChange} /> Yes</label>
                <label className="option-label"><input type="radio" name="jobsRelatedToExperience" value="no" checked={formData.jobsRelatedToExperience === 'no'} onChange={handleInputChange} /> No, please state your suggestions to improve our university</label>
              </div>
              {formData.jobsRelatedToExperience === 'no' && (
                <div style={{ flex: 1 }}>
                  <input className="form-input" type="text" name="improvementSuggestions" value={formData.improvementSuggestions} onChange={handleInputChange} />
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Have you been promoted in your current job?</label>
            <div className="flex-row">
              <label className="option-label"><input type="radio" name="hasBeenPromoted" value="yes" checked={formData.hasBeenPromoted === 'yes'} onChange={handleInputChange} /> Yes</label>
              <label className="option-label"><input type="radio" name="hasBeenPromoted" value="no" checked={formData.hasBeenPromoted === 'no'} onChange={handleInputChange} /> No</label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Based on the evaluation of your immediate superiors, how do they rate your work performance using the scale below?</label>
            <div className="radio-group" style={{ paddingLeft: '20px' }}>
              <label className="option-label"><input type="radio" name="workPerformanceRating" value="Exemplary" checked={formData.workPerformanceRating === 'Exemplary'} onChange={handleInputChange} /> <span className="rating-exemplary">Exemplary</span></label>
              <label className="option-label"><input type="radio" name="workPerformanceRating" value="Proficient" checked={formData.workPerformanceRating === 'Proficient'} onChange={handleInputChange} /> <span className="rating-proficient">Proficient</span></label>
              <label className="option-label"><input type="radio" name="workPerformanceRating" value="Needs Improvement" checked={formData.workPerformanceRating === 'Needs Improvement'} onChange={handleInputChange} /> <span className="rating-needs">Needs Improvement</span></label>
              <label className="option-label"><input type="radio" name="workPerformanceRating" value="Unsatisfactory" checked={formData.workPerformanceRating === 'Unsatisfactory'} onChange={handleInputChange} /> <span className="rating-unsat">Unsatisfactory</span></label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Do you have your own business?</label>
            <div className="flex-row">
              <label className="option-label"><input type="radio" name="hasOwnBusiness" value="yes" checked={formData.hasOwnBusiness === 'yes'} onChange={handleInputChange} /> Yes</label>
              <label className="option-label"><input type="radio" name="hasOwnBusiness" value="no" checked={formData.hasOwnBusiness === 'no'} onChange={handleInputChange} /> No</label>
            </div>
          </div>


            </fieldset>
          )}
          <div className="submit-row no-print" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center' }}>
            <button type="button" className="btn btn-outline" onClick={() => setShowCancelConfirm(true)}>Back</button>
            <button type="submit" className="submit-button" disabled={loading}>
              {editingExisting ? (loading ? 'Updating...' : 'Update Survey') : (loading ? 'Submitting...' : 'Submit Survey')}
            </button>
          </div>
          {successMessage && (
            <div className="no-print" style={{ marginTop: '12px', color: 'green' }}>{successMessage}</div>
          )}
          {errorMessage && (
            <div className="no-print" style={{ marginTop: '12px', color: 'red', whiteSpace: 'pre-wrap' }}>{errorMessage}</div>
          )}
          {/* temporary debug button removed */}
        </form>
        {showConfirm && (
          <div className="confirm-modal-overlay no-print">
            <div className="confirm-modal no-print">
              <p>Are you sure you want to submit the survey?</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '12px' }}>
                <button type="button" onClick={() => performSubmit()} className="submit-button">Yes</button>
                <button type="button" onClick={() => setShowConfirm(false)} className="submit-button">No</button>
              </div>
            </div>
          </div>
        )}
        {showCancelConfirm && (
          <div className="confirm-modal-overlay no-print">
            <div className="confirm-modal no-print">
              <p>Are you sure you want to cancel? Unsaved changes will be lost.</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '12px' }}>
                <button type="button" onClick={() => performCancel()} className="submit-button">Yes, cancel</button>
                <button type="button" onClick={() => setShowCancelConfirm(false)} className="submit-button">No</button>
              </div>
            </div>
          </div>
        )}
        {showSubmittedModal && (
          <div className="confirm-modal-overlay no-print">
            <div className="confirm-modal no-print">
              <p>Survey submitted successfully. Returning to Dashboard...</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '12px' }}>
                <button type="button" className="submit-button" onClick={() => {
                  try { if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current); } catch(_){}
                  setShowSubmittedModal(false);
                  try { navigate('/Dashboard'); } catch (e) { try { window.location.href = '/Dashboard'; } catch(_){} }
                }}>OK</button>
              </div>
            </div>
          </div>
        )}
        {/* request-change modal removed; users now edit directly */}
      </div>
    </div>
  );
}

  // (moved into component body; no-op here)

export default AlumniSurveysPanel;
