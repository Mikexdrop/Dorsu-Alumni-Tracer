import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useToast } from './Toast';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import programs from './programs';
import './SurveyResultsPanel.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement);

export default function SurveyResultsPanel({ surveyCount }) {
  const { show } = useToast() || { show: () => {} };
  // Normalize self_employment aggregates returned by the API so keys are consistently 'yes'/'no'
  const normalizeSelfEmploymentCounts = (obj) => {
    const out = { yes: 0, no: 0 };
    if (!obj || typeof obj !== 'object') return out;
    Object.entries(obj).forEach(([k, v]) => {
      const s = String(k).toLowerCase();
      const n = Number(v || 0);
      if (['yes', 'y', 'true', '1'].includes(s)) out.yes += n;
      else if (['no', 'n', 'false', '0'].includes(s)) out.no += n;
      else {
        // If API uses other labels (e.g. 'Has business'), try to interpret
        if (s.includes('yes') || s.includes('true')) out.yes += n;
        else if (s.includes('no') || s.includes('false')) out.no += n;
        else out[s] = (out[s] || 0) + n; // preserve unknown buckets
      }
    });
    return out;
  };
  const [, setLoading] = useState(true);
  // local count for server-reported responses matching current filters
  const [surveyCountLocal, setSurveyCountLocal] = useState(null);
  const [surveyTotalCount, setSurveyTotalCount] = useState(null);
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [programQuery, setProgramQuery] = useState('');
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);
  // focus index state removed (unused)

  // Aggregates
  const [employedWithinCounts, setEmployedWithinCounts] = useState({ yes: 0, no: 0 });
  const [employmentSourceCounts, setEmploymentSourceCounts] = useState({});
  const [workPerformanceCounts, setWorkPerformanceCounts] = useState({});
  const [programCounts, setProgramCounts] = useState({});
  const [jobDifficultiesCounts, setJobDifficultiesCounts] = useState({});
  const [jobsRelatedCounts, setJobsRelatedCounts] = useState({});
  const [promotedCounts, setPromotedCounts] = useState({});
  const [selfEmploymentCounts, setSelfEmploymentCounts] = useState({});
  // detailed survey rows to display in a table
  const [surveyRows, setSurveyRows] = useState([]);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [rowsError, setRowsError] = useState(null);
  const [rowsLimit, setRowsLimit] = useState(200); // how many rows to fetch/show initially
  const [refreshKey, setRefreshKey] = useState(0);
  const [deletingIds, setDeletingIds] = useState([]);

  // Determine acting role from localStorage (admin only can delete)
  const getActingRole = () => {
    try {
      const stored = localStorage.getItem('currentUser');
      if (!stored) return null;
      const obj = JSON.parse(stored);
      return (obj && (obj.user_type || obj.role || obj.acting_user_type || obj.acting_role || '')).toLowerCase();
    } catch { return null; }
  };
  const actingRole = getActingRole();

  // Fetch server-side aggregates whenever filters change. This avoids transferring
  // all survey rows to the client and lets the backend do the heavy lifting.
  useEffect(() => {
    let mounted = true;
    const fetchAggregates = async () => {
      setLoading(true);
      try {
        const base = process.env.REACT_APP_API_BASE || '';
        const params = new URLSearchParams();
        if (selectedYear && selectedYear !== 'all') params.set('year', selectedYear);
        if (selectedProgram && selectedProgram !== 'all') params.set('program', selectedProgram);
        const url = `${base}/api/survey-aggregates/${params.toString() ? ('?' + params.toString()) : ''}`;
        const res = await fetch(url);
        if (!res.ok) {
          console.warn('survey-aggregates endpoint returned', res.status);
          setLoading(false);
          return;
        }
        const d = await res.json();
        if (!mounted) return;

        setEmployedWithinCounts(d.employed || {});
        setEmploymentSourceCounts(d.sources || {});
        setWorkPerformanceCounts(d.performance || {});
        setProgramCounts(d.programs || {});
        setPromotedCounts(d.promoted || {});
        setJobsRelatedCounts(d.jobs_related || {});
        setSelfEmploymentCounts(normalizeSelfEmploymentCounts(d.self_employment || d.has_own_business || {}));
        setJobDifficultiesCounts(d.job_difficulties || {});
  if (typeof d.count === 'number') setSurveyCountLocal(d.count);
  if (typeof d.total_count === 'number') setSurveyTotalCount(d.total_count);
      } catch (err) {
        console.error('Failed to fetch survey aggregates', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

  fetchAggregates();
  // also fetch the detailed survey rows for the table whenever filters change
    const fetchRows = async () => {
      setRowsLoading(true);
      setRowsError(null);
      try {
        const base = process.env.REACT_APP_API_BASE || '';
        const params = new URLSearchParams();
        if (selectedYear && selectedYear !== 'all') params.set('year', selectedYear);
        if (selectedProgram && selectedProgram !== 'all') params.set('program', selectedProgram);
        if (rowsLimit) params.set('limit', String(rowsLimit));
        const url = `${base}/api/users_alumnisurvey/${params.toString() ? ('?' + params.toString()) : ''}`;
        const res = await fetch(url);
        if (!res.ok) {
          setRowsError(`server returned ${res.status}`);
          setRowsLoading(false);
          return;
        }
        const data = await res.json();
        if (!mounted) return;
        // expect an array of objects; if backend returns {results: []} handle that
        const rows = Array.isArray(data) ? data : (Array.isArray(data.results) ? data.results : []);
        setSurveyRows(rows);
      } catch (err) {
        console.error('Failed to fetch survey rows', err);
        setRowsError(String(err));
      } finally {
        if (mounted) setRowsLoading(false);
      }
    };
    fetchRows();
    return () => { mounted = false; };
  }, [selectedYear, selectedProgram, rowsLimit, refreshKey]);

  // Delete a survey row by id (calls backend detail endpoint). After delete, refresh aggregates and rows.
  const handleDeleteSurvey = async (id) => {
    if (!id) return;
    if (deletingIds.includes(id)) return;
    if (!window.confirm('Delete this survey response? This action cannot be undone.')) return;
    setDeletingIds(ids => [...ids, id]);
    try {
      const base = process.env.REACT_APP_API_BASE || '';
      const token = localStorage.getItem('token');
      const url = `${base}/api/alumni-surveys/${id}/`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.status === 204 || res.ok) {
        setSurveyRows(prev => prev.filter(r => Number(r.id) !== Number(id)));
        setRefreshKey(k => k + 1);
        show('Survey deleted.', { type: 'success', duration: 3200 });
      } else {
        let msg = `HTTP ${res.status}`;
        try { const d = await res.json(); msg = d.detail || JSON.stringify(d); } catch(_) { try { msg = await res.text(); } catch(_) {} }
        show('Delete failed: ' + msg, { type: 'error', duration: 4200 });
      }
    } catch (err) {
      console.error('Failed to delete survey', err);
      show('Failed to delete survey: ' + (err && err.message ? err.message : String(err)), { type: 'error', duration: 4200 });
    } finally {
      setDeletingIds(ids => ids.filter(x => x !== id));
    }
  };

  // year options from 1989 up to max(2025, currentYear+1)
  const yearOptions = useMemo(() => {
    const start = 1989;
    const end = Math.max(2025, new Date().getFullYear() + 1);
    const arr = [];
    for (let y = end; y >= start; y--) arr.push(String(y));
    return arr;
  }, []);

  const [yearQuery, setYearQuery] = useState('');
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const yearInputRef = useRef(null);
  const programInputRef = useRef(null);
  // unused list refs removed

  // debounce commit of programQuery into selectedProgram (450ms)
  useEffect(() => {
    const handle = setTimeout(() => {
      if (!programQuery) {
        setSelectedProgram('all');
      } else if (programs.some(p => p.toLowerCase() === programQuery.trim().toLowerCase())) {
        const exact = programs.find(p => p.toLowerCase() === programQuery.trim().toLowerCase());
        if (exact) setSelectedProgram(exact);
      } else {
        // non-exact query becomes a contains filter applied server-side
        setSelectedProgram(programQuery.trim());
      }
    }, 450);
    return () => clearTimeout(handle);
  }, [programQuery]);

  // Reset filters handler
  const resetFilters = () => {
    setSelectedYear('all');
    setYearQuery('');
    setSelectedProgram('all');
    setProgramQuery('');
  };

  // Aggregates are now fetched from the server; local survey list removed.

  // Use database-derived aggregates only (no sample fallbacks). Charts will show zeros if there are no responses.
  const employedWithinCountsFinal = employedWithinCounts || { yes: 0, no: 0 };
  const employmentSourceCountsFinal = employmentSourceCounts || {};
  const workPerformanceCountsFinal = workPerformanceCounts || {};
  const programCountsFinal = programCounts || {};
  const jobDifficultiesCountsFinal = jobDifficultiesCounts || {};
  const jobsRelatedCountsFinal = jobsRelatedCounts || {};
  const promotedCountsFinal = promotedCounts || {};
  const selfEmploymentCountsFinal = selfEmploymentCounts || {};

  // Plugin to draw percentage labels inside bars and pie slices
  const dataLabelPlugin = {
    id: 'datalabelsPlugin',
    afterDatasetsDraw: (chart, args, options) => {
      const { ctx } = chart;
      chart.data.datasets.forEach((dataset, dsIndex) => {
        const meta = chart.getDatasetMeta(dsIndex);
        const total = dataset.data.reduce((s, v) => s + (v || 0), 0);
        meta.data.forEach((element, idx) => {
          const value = dataset.data[idx] || 0;
          if (!total || value === 0) return;
          const pct = ((value / total) * 100).toFixed(1) + '%';
          ctx.save();
          ctx.fillStyle = options.color || '#fff';
          ctx.font = `${options.fontSize || 12}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          // position depending on element type
          if (element.tooltipPosition) {
            const pos = element.tooltipPosition();
            ctx.fillText(pct, pos.x, pos.y);
          } else if (element.x !== undefined && element.y !== undefined) {
            // fallback for bar elements
            ctx.fillText(pct, element.x, (element.y + (element.base || 0)) / 2);
          }
          ctx.restore();
        });
      });
    }
  };

  // Prepare chart data
  // color palette for consistency
  const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#ec4899', '#60a5fa', '#34d399', '#f97316'];

  const pickColors = (n) => {
    const colors = [];
    for (let i = 0; i < n; i++) colors.push(CHART_COLORS[i % CHART_COLORS.length]);
    return colors;
  };

  // animation & common options including tooltip percentage callback
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 700, easing: 'easeOutQuart' },
    plugins: {
      legend: { labels: { boxWidth: 12, padding: 12 } },
      tooltip: {
        callbacks: {
          label: function(context) {
            // value for current item
            const raw = (context.raw !== undefined) ? context.raw : (context.parsed !== undefined ? context.parsed : 0);
            const ds = context.dataset || context.chart.data.datasets[context.datasetIndex];
            const data = ds && ds.data ? ds.data : [];
            const total = data.reduce((s, v) => s + (v || 0), 0);
            const pct = total ? ` (${((raw / total) * 100).toFixed(1)}%)` : '';
            const label = context.label || ds.label || '';
            return label ? `${label}: ${raw}${pct}` : `${raw}${pct}`;
          }
        }
      },
      // include the data label plugin with defaults
      datalabelsPlugin: { color: '#ffffff', fontSize: 11 }
    }
  };

  // register the plugin locally with ChartJS if not already registered globally
  try {
    ChartJS.register && ChartJS.register(dataLabelPlugin);
  } catch (e) {
    // ignore if already registered
  }

  const employedData = {
    labels: ['Yes', 'No'],
    datasets: [{ label: 'Employed within 6 months', data: [employedWithinCountsFinal.yes, employedWithinCountsFinal.no], backgroundColor: pickColors(2), borderRadius: 6 }]
  };

  // sort performance labels by value descending for better visual ordering
  const perfLabels = Object.keys(workPerformanceCountsFinal).sort((a,b)=> (workPerformanceCountsFinal[b]||0) - (workPerformanceCountsFinal[a]||0));
  const perfData = {
    labels: perfLabels,
    datasets: [{ data: perfLabels.map(l => workPerformanceCountsFinal[l] || 0), backgroundColor: pickColors(perfLabels.length) }]
  };

  const sourceLabels = Object.keys(employmentSourceCountsFinal).sort((a,b)=> (employmentSourceCountsFinal[b]||0) - (employmentSourceCountsFinal[a]||0));
  const sourceData = {
    labels: sourceLabels,
    datasets: [{ label: 'Number of Alumni', data: sourceLabels.map(l => employmentSourceCountsFinal[l] || 0), backgroundColor: pickColors(sourceLabels.length), borderRadius: 6 }]
  };

  const programLabels = Object.keys(programCountsFinal).sort((a,b)=> (programCountsFinal[b]||0)-(programCountsFinal[a]||0)).slice(0,8);
  const programData = {
    labels: programLabels,
    datasets: [{ label: 'Responses', data: programLabels.map(l => programCountsFinal[l] || 0), backgroundColor: pickColors(programLabels.length), borderRadius: 6 }]
  };

  // additional datasets from AlumniSurveysPanel fields
  const jobDifficultyLabels = Object.keys(jobDifficultiesCountsFinal).sort((a,b)=> (jobDifficultiesCountsFinal[b]||0)-(jobDifficultiesCountsFinal[a]||0));
  const jobDifficultyData = {
    labels: jobDifficultyLabels,
    datasets: [{ data: jobDifficultyLabels.map(l => jobDifficultiesCountsFinal[l] || 0), backgroundColor: pickColors(jobDifficultyLabels.length), borderRadius: 6 }]
  };

  const jobsRelatedLabels = Object.keys(jobsRelatedCountsFinal).sort((a,b)=> (jobsRelatedCountsFinal[b]||0)-(jobsRelatedCountsFinal[a]||0));
  const jobsRelatedData = {
    labels: jobsRelatedLabels,
    datasets: [{ data: jobsRelatedLabels.map(l => jobsRelatedCountsFinal[l] || 0), backgroundColor: pickColors(jobsRelatedLabels.length), borderRadius: 6 }]
  };

  const promotedLabels = Object.keys(promotedCountsFinal).sort((a,b)=> (promotedCountsFinal[b]||0)-(promotedCountsFinal[a]||0));
  const promotedData = {
    labels: promotedLabels,
    datasets: [{ data: promotedLabels.map(l => promotedCountsFinal[l] || 0), backgroundColor: pickColors(promotedLabels.length), borderRadius: 6 }]
  };

  const selfEmpKeys = Object.keys(selfEmploymentCountsFinal).sort((a,b)=> (selfEmploymentCountsFinal[b]||0)-(selfEmploymentCountsFinal[a]||0));
  const selfEmpLabels = selfEmpKeys.map(k => (k === 'yes' ? 'Yes' : (k === 'no' ? 'No' : k)));
  const selfEmpData = {
    labels: selfEmpLabels,
    datasets: [{ data: selfEmpKeys.map(l => selfEmploymentCountsFinal[l] || 0), backgroundColor: pickColors(selfEmpKeys.length), borderRadius: 6 }]
  };

  // Build a CSV string from current aggregates (privacy-preserving: aggregates only)
  const buildCsvString = () => {
    const lines = [];
    // header with filters
    lines.push([`Filters: year=${selectedYear || 'all'}`, `program=${selectedProgram || 'all'}`].join(','));
    lines.push([]);

    const pushSection = (title, obj) => {
      lines.push([title]);
      lines.push(['label', 'count']);
      Object.keys(obj || {}).forEach(k => lines.push([`"${String(k).replace(/"/g, '""')}"`, String(obj[k] || 0)]));
      lines.push([]);
    };

    pushSection('Employed within 6 months', { Yes: employedWithinCountsFinal.yes || 0, No: employedWithinCountsFinal.no || 0 });
    pushSection('Source of First Employment', employmentSourceCountsFinal);
    pushSection('Work Performance', workPerformanceCountsFinal);
    pushSection('Job Difficulties', jobDifficultiesCountsFinal);
    pushSection('Jobs Related to Experience', jobsRelatedCountsFinal);
    pushSection('Promoted in Current Job', promotedCountsFinal);
    pushSection('Self-Employment (Has business)', selfEmploymentCountsFinal);
    pushSection('Top Programs', programCountsFinal);

    return lines.map(r => Array.isArray(r) ? r.join(',') : r).join('\n');
  };

  const downloadCsv = () => {
    try {
      const csv = buildCsvString();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const fname = `survey_aggregates_${selectedYear || 'all'}_${(selectedProgram || 'all').replace(/\s+/g,'_')}.csv`;
      const a = document.createElement('a');
      a.href = url;
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to build/download CSV', e);
      alert('Failed to build CSV');
    }
  };

  // Helper to format individual values for CSV / table (normalize booleans/legacy values)
  const formatValueForExport = (key, val) => {
    if (val === null || val === undefined || val === '') return '';
    // arrays -> joined
    if (Array.isArray(val)) return val.join('; ');
    // booleans
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    // textual yes/no variants -> normalized
    const s = String(val).toLowerCase();
    if (s === 'yes' || s === 'y' || s === 'true' || s === '1') return 'Yes';
    if (s === 'no' || s === 'n' || s === 'false' || s === '0') return 'No';
    return String(val);
  };

  // Build CSV from the detailed survey rows (current table)
  const buildRowsCsv = () => {
    if (!surveyRows || surveyRows.length === 0) return null;
    // exclude heavy or sensitive columns from row export
    const excludedCheck = (c) => {
      const lc = String(c).toLowerCase();
      if (lc === 'employment_records' || lc === 'created_at' || lc === 'self_employment') return true;
      if (lc.includes('alumni')) return true; // covers 'alumni', 'alumni_info', etc.
      return false;
    };

    // Friendly header labels and preferred column order
    const preferredOrder = [
      'last_name', 'first_name', 'middle_name',
      'year_graduated', 'course_program', 'student_number',
      'birth_year', 'birth_month', 'birth_day', 'age', 'gender',
      'home_address', 'telephone_number', 'mobile_number', 'email',
      'current_job_position', 'company_affiliation', 'company_address', 'approximate_monthly_salary',
      'employed_after_graduation', 'employment_source', 'job_difficulties', 'jobs_related_to_experience',
      'has_own_business', 'has_been_promoted', 'work_performance_rating', 'improvement_suggestions'
    ];

    const friendlyLabels = {
      last_name: 'Last name', first_name: 'First name', middle_name: 'Middle name',
      year_graduated: 'Year Graduated', course_program: 'Program / Course', student_number: 'Student Number',
      birth_year: 'Birth Year', birth_month: 'Birth Month', birth_day: 'Birth Day', age: 'Age', gender: 'Gender',
      home_address: 'Home Address', telephone_number: 'Telephone', mobile_number: 'Mobile Number', email: 'Email',
      current_job_position: 'Current Job Position', company_affiliation: 'Company Affiliation', company_address: 'Company Address', approximate_monthly_salary: 'Approx. Monthly Salary',
      employed_after_graduation: 'Employed within 6 months', employment_source: 'Employment Source', job_difficulties: 'Job Difficulties', jobs_related_to_experience: 'Jobs Related to Experience',
      has_own_business: 'Has own business', has_been_promoted: 'Has Been Promoted', work_performance_rating: 'Work Performance Rating', improvement_suggestions: 'Improvement Suggestions'
    };

    // derive columns: take preferred order if present, then append any remaining keys (except excluded)
    const presentKeys = Object.keys(surveyRows[0]).filter(k => !excludedCheck(k));
    const ordered = [];
    preferredOrder.forEach(k => { if (presentKeys.includes(k)) ordered.push(k); });
    // append any other keys that weren't in preferredOrder
    presentKeys.forEach(k => { if (!ordered.includes(k)) ordered.push(k); });

    const cols = ordered;
    const lines = [];
    // header with friendly labels when available
    lines.push(cols.map(c => `"${String(friendlyLabels[c] || c).replace(/"/g, '""')}"`).join(','));
    // rows
    surveyRows.forEach(r => {
      const row = cols.map(c => {
        const raw = r[c] === null || r[c] === undefined ? '' : r[c];
        const formatted = formatValueForExport(c, raw);
        return `"${String(formatted).replace(/"/g, '""')}"`;
      }).join(',');
      lines.push(row);
    });
    return lines.join('\n');
  };

  const downloadRowsCsv = () => {
    try {
      const csv = buildRowsCsv();
      if (!csv) { alert('No rows available to download.'); return; }
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const fname = `survey_rows_${selectedYear || 'all'}_${(selectedProgram || 'all').replace(/\s+/g,'_')}.csv`;
      const a = document.createElement('a');
      a.href = url;
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download rows CSV', e);
      alert('Failed to download CSV');
    }
  };

  

  // Determine whether server aggregates are empty; fall back to samples if so
  const totalAggregates = Object.values(employmentSourceCounts || {}).reduce((s, v) => s + (v || 0), 0) + Object.values(employedWithinCounts || {}).reduce((s, v) => s + (v || 0), 0);
  const hasResponses = totalAggregates > 0;

  return (
    <div className="srp-container">
      <h2 className="srp-title">Employment Survey Results</h2>
      <div className="srp-header-row">
        <div aria-live="polite" className="srp-subtle">{hasResponses ? 'Displaying survey results from the database.' : 'No survey responses available yet.'}</div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div className="srp-count" aria-live="polite">{
            (surveyCountLocal === null && surveyTotalCount === null) ? '' : (
              surveyTotalCount === null ? `Showing ${surveyCountLocal} response${surveyCountLocal === 1 ? '' : 's'}` : `Showing ${surveyCountLocal} of ${surveyTotalCount} response${surveyTotalCount === 1 ? '' : 's'}`
            )
          }</div>
          <button type="button" className="srp-download-btn" onClick={downloadCsv} title="Download aggregates as CSV">Download CSV</button>
          <button type="button" className="srp-reset-btn" onClick={resetFilters}>Reset filters</button>
        </div>
      </div>

      {/* Year filter */}
      <div className="srp-filters">
        <label htmlFor="yearFilter" className="srp-filter-label">Filter by Graduation Year:</label>
  <div className="srp-filter srp-filter--year">
          <input
            id="yearFilter"
            ref={yearInputRef}
            aria-label="Filter by graduation year"
            aria-haspopup="listbox"
            aria-controls="year-options-listbox"
            value={yearQuery || (selectedYear === 'all' ? '' : selectedYear)}
            onChange={e => { setYearQuery(e.target.value); setShowYearDropdown(true); }}
            onFocus={() => setShowYearDropdown(true)}
            onKeyDown={e => { if (e.key === 'ArrowDown') setShowYearDropdown(true); }}
            onBlur={() => setTimeout(() => setShowYearDropdown(false), 120)}
            placeholder="Year"
            className="srp-input srp-input--year"
          />
          {showYearDropdown && (
            <div id="year-options-listbox" role="listbox" aria-label="Year options" className="srp-listbox">
              <div role="option" aria-selected={selectedYear === 'all'} tabIndex={0} className="srp-option" onMouseDown={() => { setSelectedYear('all'); setYearQuery(''); setShowYearDropdown(false); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedYear('all'); setYearQuery(''); setShowYearDropdown(false); } }}>All years</div>
              {yearOptions.filter(y => (yearQuery ? y.includes(yearQuery) : true)).map(y => (
                <div key={y} role="option" aria-selected={selectedYear === y} tabIndex={0} className="srp-option" onMouseDown={() => { setSelectedYear(y); setYearQuery(y); setShowYearDropdown(false); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedYear(y); setYearQuery(y); setShowYearDropdown(false); } }}>{y}</div>
              ))}
            </div>
          )}
        </div>
        <label htmlFor="programFilter" className="srp-filter-label">Program / Course:</label>
        <div className="srp-filter srp-filter--program">
          <input
            id="programFilter"
            ref={programInputRef}
            aria-label="Filter by program or course"
            aria-haspopup="listbox"
            aria-controls="program-options-listbox"
            value={programQuery || (selectedProgram === 'all' ? '' : selectedProgram)}
            onChange={e => { setProgramQuery(e.target.value); setShowProgramDropdown(true); }}
            onFocus={() => setShowProgramDropdown(true)}
            onKeyDown={e => { if (e.key === 'ArrowDown') setShowProgramDropdown(true); }}
            onBlur={() => setTimeout(() => setShowProgramDropdown(false), 120)}
            placeholder="Type to search programs or leave empty for all"
            className="srp-input srp-input--program"
          />
          {showProgramDropdown && (
            <div id="program-options-listbox" role="listbox" aria-label="Program options" className="srp-listbox">
              <div role="option" aria-selected={selectedProgram === 'all'} tabIndex={0} className="srp-option" onMouseDown={() => { setSelectedProgram('all'); setProgramQuery(''); setShowProgramDropdown(false); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedProgram('all'); setProgramQuery(''); setShowProgramDropdown(false); } }}>All programs</div>
              {programs.filter(p => (programQuery ? p.toLowerCase().includes(programQuery.toLowerCase()) : true)).map(p => (
                <div key={p} role="option" aria-selected={selectedProgram === p} tabIndex={0} className="srp-option" onMouseDown={() => { setSelectedProgram(p); setProgramQuery(p); setShowProgramDropdown(false); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedProgram(p); setProgramQuery(p); setShowProgramDropdown(false); } }}>{p}</div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Employment Charts Grid */}
      <div className="srp-grid">
        <div className="srp-card">
          <h3>Employment After Graduation</h3>
          <div className="srp-chart">
            <Bar data={employedData} options={{ ...commonOptions, indexAxis: 'y', plugins: { ...commonOptions.plugins, legend: { display: false } } }} />
          </div>
        </div>

        <div className="srp-card">
          <h3>Work Performance Rating</h3>
          <div className="srp-chart srp-chart--large">
            <Pie data={perfData} options={{ ...commonOptions, plugins: { ...commonOptions.plugins, legend: { position: 'bottom', labels: { padding: 12 } } } }} />
          </div>
        </div>

        <div className="srp-card">
          <h3>Job Difficulties (first job)</h3>
          <div className="srp-chart">
            <Bar data={jobDifficultyData} options={{ ...commonOptions, indexAxis: 'y', plugins: { ...commonOptions.plugins, legend: { display: false } } }} />
          </div>
        </div>

        <div className="srp-card">
          <h3>Jobs Related to Experience</h3>
          <div className="srp-chart srp-chart--large">
            <Pie data={jobsRelatedData} options={{ ...commonOptions, plugins: { ...commonOptions.plugins, legend: { position: 'bottom' } } }} />
          </div>
        </div>

        <div className="srp-card srp-card--full">
          <h3>Source of First Employment</h3>
          <div className="srp-chart srp-chart--large">
            <Bar data={sourceData} options={{ ...commonOptions, indexAxis: 'y', plugins: { ...commonOptions.plugins, legend: { display: false } }, scales: { x: { beginAtZero: true } } }} />
          </div>
        </div>

        <div className="srp-card">
          <h3>Self-Employment (Has business)</h3>
          <div className="srp-chart srp-chart--large">
            <Pie data={selfEmpData} options={{ ...commonOptions, plugins: { ...commonOptions.plugins, legend: { position: 'bottom' } } }} />
          </div>
        </div>

        <div className="srp-card">
          <h3>Promoted in Current Job</h3>
          <div className="srp-chart srp-chart--large">
            <Pie data={promotedData} options={{ ...commonOptions, plugins: { ...commonOptions.plugins, legend: { position: 'bottom' } } }} />
          </div>
        </div>

        <div className="srp-card srp-card--full">
          <h3>Top Programs</h3>
          <div className="srp-chart srp-chart--large">
            <Bar data={programData} options={{ ...commonOptions, indexAxis: 'y', plugins: { ...commonOptions.plugins, legend: { display: false } }, scales: { x: { beginAtZero: true } } }} />
          </div>
        </div>

      </div>
      {/* Detailed survey rows table */}
      <div className="srp-table-card" style={{ marginTop: 18 }}>
        <h3>Survey Responses (detailed)</h3>
        <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ color: '#555' }}>{rowsLoading ? 'Loading rows...' : (rowsError ? `Error: ${rowsError}` : `${surveyRows.length} rows`)}</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="srp-download-btn" onClick={downloadRowsCsv} title="Download current table as CSV">Download Rows CSV</button>
            <button className="srp-reset-btn" onClick={() => { setRowsLimit(200); }}>Show 200</button>
            <button className="srp-reset-btn" onClick={() => { setRowsLimit(1000); }}>Show 1000</button>
            <button className="srp-reset-btn" onClick={() => { setRowsLimit(0); }}>Show all</button>
            <button className="srp-reset-btn" onClick={() => { setSurveyRows([]); setRowsError(null); }}>Clear</button>
          </div>
        </div>
        <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8, padding: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }}>
          {surveyRows && surveyRows.length > 0 ? (
            (() => {
              // Exclude certain columns from the displayed table (employment_records, created_at, alumni-related)
              const excludedCheck = (c) => {
                const lc = String(c).toLowerCase();
                if (lc === 'employment_records' || lc === 'created_at' || lc === 'self_employment') return true;
                if (lc.includes('alumni')) return true;
                return false;
              };
              const cols = Object.keys(surveyRows[0]).filter(c => !excludedCheck(c));
              return (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      {cols.map(c => (
                        <th key={c} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #eee' }}>
                          {c === 'has_own_business' ? 'Has own business' : c}
                        </th>
                      ))}
                      <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #eee' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {surveyRows.map((r, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : '#fbfbfd' }}>
                        {cols.map(c => {
                          const raw = r[c] === null || r[c] === undefined ? '' : r[c];
                          const display = formatValueForExport(c, raw);
                          return (
                            <td key={c} style={{ padding: '8px 10px', borderBottom: '1px solid #f3f3f6', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{display}</td>
                          );
                        })}
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid #f3f3f6', whiteSpace: 'nowrap' }}>
                          {actingRole === 'admin' ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteSurvey(r.id)}
                              style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 8px', borderRadius: 6, cursor: deletingIds.includes(r.id) ? 'not-allowed' : 'pointer', opacity: deletingIds.includes(r.id) ? 0.6 : 1 }}
                              title="Delete survey"
                              disabled={deletingIds.includes(r.id)}
                            >
                              {deletingIds.includes(r.id) ? 'Deleting...' : 'Delete'}
                            </button>
                          ) : null}
                        </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()
          ) : (
            <div style={{ padding: 18, color: '#666' }}>{rowsLoading ? 'Loading...' : (rowsError ? `Error loading rows: ${rowsError}` : 'No rows found for the current filters.')}</div>
          )}
        </div>
      </div>
      {/* Analysis sections removed per request */}
    </div>
  );
}
