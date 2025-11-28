import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement } from 'chart.js';
import programs from './programs';
import './EvaluationReports.css';
import './EvaluationReports.trend.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement);

// Lightweight Evaluation Reports that fetches the same aggregates as SurveyResultsPanel
// and allows selecting which single chart to display via a dropdown.
export default function EvaluationReports() {
  const [loading, setLoading] = useState(true);
  const [surveyCountLocal, setSurveyCountLocal] = useState(null);

  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [programQuery, setProgramQuery] = useState('');
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);

  const [employedWithinCounts, setEmployedWithinCounts] = useState({ yes: 0, no: 0 });
  const [employmentSourceCounts, setEmploymentSourceCounts] = useState({});
  const [workPerformanceCounts, setWorkPerformanceCounts] = useState({});
  const [programCounts, setProgramCounts] = useState({});
  const [jobDifficultiesCounts, setJobDifficultiesCounts] = useState({});
  const [jobsRelatedCounts, setJobsRelatedCounts] = useState({});
  const [promotedCounts, setPromotedCounts] = useState({});
  const [selfEmploymentCounts, setSelfEmploymentCounts] = useState({});

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
        if (s.includes('yes') || s.includes('true')) out.yes += n;
        else if (s.includes('no') || s.includes('false')) out.no += n;
        else out[s] = (out[s] || 0) + n;
      }
    });
    return out;
  };

  const programInputRef = useRef(null);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);

  // year options from 1989 up to current year
  const yearOptions = useMemo(() => {
    const start = 1989;
    const end = new Date().getFullYear();
    const arr = [];
    for (let y = end; y >= start; y--) arr.push(String(y));
    return arr;
  }, []);

  // fetch aggregates similar to SurveyResultsPanel
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
        // notify other parts of the app (e.g., AdminDashboard) about fresh aggregates
        try {
          const payload = {
            employed: d.employed || {},
            sources: d.sources || {},
            performance: d.performance || {},
            programs: d.programs || {},
            promoted: d.promoted || {},
            jobs_related: d.jobs_related || {},
            self_employment: d.self_employment || {},
            job_difficulties: d.job_difficulties || {},
            count: (typeof d.count === 'number') ? d.count : (typeof d.total_count === 'number' ? d.total_count : null),
            selectedYear: selectedYear,
            selectedProgram: selectedProgram
          };
          window && window.dispatchEvent && window.dispatchEvent(new CustomEvent('survey-aggregates-updated', { detail: payload }));
        } catch (err) {}
      } catch (err) {
        console.error('Failed to fetch survey aggregates', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAggregates();
    return () => { mounted = false; };
  }, [selectedYear, selectedProgram]);

  // debounce programQuery -> selectedProgram (450ms)
  useEffect(() => {
    const handle = setTimeout(() => {
      if (!programQuery) setSelectedProgram('all');
      else if (programs.some(p => p.toLowerCase() === programQuery.trim().toLowerCase())) {
        const exact = programs.find(p => p.toLowerCase() === programQuery.trim().toLowerCase());
        if (exact) setSelectedProgram(exact);
      } else {
        setSelectedProgram(programQuery.trim());
      }
    }, 450);
    return () => clearTimeout(handle);
  }, [programQuery]);

  // filtered suggestions for autocomplete
  const filteredSuggestions = useMemo(() => {
    const q = (programQuery || '').toString().trim().toLowerCase();
    if (!q) return programs.slice(0, 100);
    return programs.filter(p => p.toLowerCase().includes(q)).slice(0, 100);
  }, [programQuery]);

  const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#ec4899', '#60a5fa', '#34d399', '#f97316'];
  const pickColors = (n) => { const colors = []; for (let i=0;i<n;i++) colors.push(CHART_COLORS[i % CHART_COLORS.length]); return colors; };

  // basic chart options
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

  // prepare datasets
  const employedData = {
    labels: ['Yes', 'No'],
    datasets: [{ label: 'Employed within 6 months', data: [employedWithinCounts.yes || 0, employedWithinCounts.no || 0], backgroundColor: pickColors(2), borderRadius: 6 }]
  };

  const perfLabels = Object.keys(workPerformanceCounts || {}).sort((a,b)=> (workPerformanceCounts[b]||0) - (workPerformanceCounts[a]||0));
  const perfData = { labels: perfLabels, datasets: [{ data: perfLabels.map(l => workPerformanceCounts[l] || 0), backgroundColor: pickColors(perfLabels.length) }] };

  const jobDifficultyLabels = Object.keys(jobDifficultiesCounts || {}).sort((a,b)=> (jobDifficultiesCounts[b]||0)-(jobDifficultiesCounts[a]||0));
  const jobDifficultyData = { labels: jobDifficultyLabels, datasets: [{ data: jobDifficultyLabels.map(l => jobDifficultiesCounts[l] || 0), backgroundColor: pickColors(jobDifficultyLabels.length), borderRadius: 6 }] };

  const jobsRelatedLabels = Object.keys(jobsRelatedCounts || {}).sort((a,b)=> (jobsRelatedCounts[b]||0)-(jobsRelatedCounts[a]||0));
  const jobsRelatedData = { labels: jobsRelatedLabels, datasets: [{ data: jobsRelatedLabels.map(l => jobsRelatedCounts[l] || 0), backgroundColor: pickColors(jobsRelatedLabels.length) }] };

  const sourceLabels = Object.keys(employmentSourceCounts || {}).sort((a,b)=> (employmentSourceCounts[b]||0)-(employmentSourceCounts[a]||0));
  const sourceData = { labels: sourceLabels, datasets: [{ label: 'Number of Alumni', data: sourceLabels.map(l => employmentSourceCounts[l] || 0), backgroundColor: pickColors(sourceLabels.length), borderRadius: 6 }] };

  const selfEmpKeys = Object.keys(selfEmploymentCounts || {}).sort((a,b)=> (selfEmploymentCounts[b]||0)-(selfEmploymentCounts[a]||0));
  const selfEmpLabels = selfEmpKeys.map(k => (k === 'yes' ? 'Yes' : (k === 'no' ? 'No' : k)));
  const selfEmpData = { labels: selfEmpLabels, datasets: [{ data: selfEmpKeys.map(l => selfEmploymentCounts[l] || 0), backgroundColor: pickColors(selfEmpKeys.length) }] };

  const promotedLabels = Object.keys(promotedCounts || {}).sort((a,b)=> (promotedCounts[b]||0)-(promotedCounts[a]||0));
  const promotedData = { labels: promotedLabels, datasets: [{ data: promotedLabels.map(l => promotedCounts[l] || 0), backgroundColor: pickColors(promotedLabels.length) }] };

  const programLabels = Object.keys(programCounts || {}).sort((a,b)=> (programCounts[b]||0)-(programCounts[a]||0)).slice(0,8);
  const programData = { labels: programLabels, datasets: [{ label: 'Responses', data: programLabels.map(l => programCounts[l] || 0), backgroundColor: pickColors(programLabels.length), borderRadius: 6 }] };

  const buildCsvString = useCallback(() => {
    const lines = [];
    lines.push([`Filters: year=${selectedYear || 'all'}`, `program=${selectedProgram || 'all'}`].join(','));
    lines.push([]);
    const pushSection = (title, obj) => { lines.push([title]); lines.push(['label','count']); Object.keys(obj||{}).forEach(k=>lines.push([`"${String(k).replace(/"/g,'""')}"`,String(obj[k]||0)])); lines.push([]); };
    pushSection('Employed within 6 months', { Yes: employedWithinCounts.yes || 0, No: employedWithinCounts.no || 0 });
    pushSection('Source of First Employment', employmentSourceCounts);
    pushSection('Work Performance', workPerformanceCounts);
    pushSection('Job Difficulties', jobDifficultiesCounts);
    pushSection('Jobs Related to Experience', jobsRelatedCounts);
    pushSection('Promoted in Current Job', promotedCounts);
    pushSection('Self-Employment (Has business)', selfEmploymentCounts);
    pushSection('Top Programs', programCounts);
    return lines.map(r => Array.isArray(r) ? r.join(',') : r).join('\n');
  }, [selectedYear, selectedProgram, employedWithinCounts, employmentSourceCounts, workPerformanceCounts, jobDifficultiesCounts, jobsRelatedCounts, promotedCounts, selfEmploymentCounts, programCounts]);

  const downloadCsv = () => {
    try {
      const csv = buildCsvString();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const fname = `survey_aggregates_${selectedYear || 'all'}_${(selectedProgram || 'all').replace(/\s+/g,'_')}.csv`;
      const a = document.createElement('a'); a.href = url; a.download = fname; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (e) { console.error('Failed to build/download CSV', e); alert('Failed to build CSV'); }
  };

  const chartOptions = [
    { key: 'employed', label: 'Employment After Graduation' },
    { key: 'performance', label: 'Work Performance' },
    { key: 'job_difficulties', label: 'Job Difficulties' },
    { key: 'jobs_related', label: 'Jobs Related to Experience' },
    { key: 'source', label: 'Source of First Employment' },
    { key: 'self_emp', label: 'Self-Employment' },
    { key: 'promoted', label: 'Promoted in Current Job' },
    { key: 'programs', label: 'Top Programs' }
  ];

  const [selectedChart, setSelectedChart] = useState(chartOptions[0].key);
  // year sort order for trend/chart display: 'desc' = most recent first, 'asc' = oldest first
  const [yearSortOrder] = useState('desc');

  // --- Analysis state: decision tree, program-job matching, trends ---
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [programJobMatches, setProgramJobMatches] = useState([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendData, setTrendData] = useState({ labels: [], values: [] });
  const [trendSummary, setTrendSummary] = useState('');
  const [decisionTree, setDecisionTree] = useState([]);
  const [decisionTreeNodes, setDecisionTreeNodes] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const tokenize = (s) => (s || '').toString().toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const tokenScore = (a, b) => {
    const at = tokenize(a);
    const bt = tokenize(b);
    if (!at.length || !bt.length) return 0;
    let score = 0;
    at.forEach(t => {
      if (bt.includes(t)) score += 3;
      else if (bt.some(x => x.includes(t) || t.includes(x))) score += 1;
    });
    return score;
  };

  // improved text similarity helpers
  const normalize = s => (s || '').toString().toLowerCase().replace(/[^a-z0-9\s]+/g, '').trim();
  const ngrams = (s, n=3) => {
    const t = normalize(s).replace(/\s+/g, ' ');
    const out = new Set();
    for (let i=0;i+ n <= t.length;i++) out.add(t.slice(i,i+n));
    return out;
  };
  const trigramSim = (a,b) => {
    const A = ngrams(a,3); const B = ngrams(b,3);
    if (!A.size || !B.size) return 0;
    let inter = 0; for (const x of A) if (B.has(x)) inter++;
    const uni = new Set([...A,...B]).size;
    return uni ? inter/uni : 0;
  };
  const jaccardTokens = (a,b) => {
    const A = new Set(tokenize(a)); const B = new Set(tokenize(b));
    if (!A.size || !B.size) return 0;
    let inter = 0; for (const x of A) if (B.has(x)) inter++;
    const uni = new Set([...A,...B]).size;
    return uni ? inter/uni : 0;
  };
  const combinedScore = (a,b,count=0) => {
    // combine heuristics into a 0-100 score
    const tscore = tokenScore(a,b); // integer
    const j = jaccardTokens(a,b);
    const tri = trigramSim(a,b);
    const cntFactor = Math.log1p(Math.max(0, Number(count)||0));
    // weights tuned heuristically
    const raw = (tscore * 2.5) + (j * 30) + (tri * 30) + (cntFactor * 5);
    return Math.round(Math.max(0, Math.min(100, raw)));
  };

  // small HTML-escape helper for printable/exported content
  const escapeHtml = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // run deeper analysis (decision rules + improved program→job matching)
  const runAnalysis = () => {
    setAnalysisLoading(true);
    setTimeout(() => {
      try {
        const results = [];

        // Employment rate analysis
        const yes = Number((employedWithinCounts && employedWithinCounts.yes) || 0);
        const no = Number((employedWithinCounts && employedWithinCounts.no) || 0);
        const totalEmployed = yes + no;
        const employedPct = totalEmployed > 0 ? Math.round((yes / totalEmployed) * 100) : null;
        if (employedPct !== null) results.push(`Approximately ${employedPct}% employed within 6 months (based on ${totalEmployed} responses).`);
        else results.push('Not enough data to estimate employment timing.');

        // Performance summary
        const perfEntries = Object.entries(workPerformanceCounts || {}).sort((a,b)=>b[1]-a[1]);
        if (perfEntries.length) {
          const [bestPerf, bestPerfCnt] = perfEntries[0];
          results.push(`Most common work performance: ${bestPerf} (${bestPerfCnt} responses).`);
        }

        // Promotions & self-employment cues
        const promotedYes = Number(promotedCounts.yes || 0);
        const selfEmpYes = Number(selfEmploymentCounts.yes || 0);
        if (promotedYes) results.push(`${promotedYes} respondents reported promotions in their current job.`);
        if (selfEmpYes) results.push(`${selfEmpYes} respondents reported self-employment / running a business.`);

        // Top programs
        const programEntries = Object.entries(programCounts || {}).sort((a,b)=>b[1]-a[1]);
        if (programEntries.length) {
          const totalProgResp = programEntries.reduce((s,p)=>s+(p[1]||0),0) || 1;
          const [topProg, topCnt] = programEntries[0];
          const topPct = Math.round((topCnt / totalProgResp) * 100);
          results.push(`Top program: ${topProg} — ${topCnt} responses (${topPct}% of program responses).`);
        }

        // Program -> Job matching with improved scoring
        const jobLabels = Object.keys(jobsRelatedCounts || {});
        const programMatches = [];
        programEntries.slice(0, 12).forEach(([prog, cnt]) => {
          let best = { job: null, score: 0, count: 0 };
          jobLabels.forEach(j => {
            const score = combinedScore(prog, j, jobsRelatedCounts[j] || 0);
            if (score > best.score) best = { job: j, score, count: Number(jobsRelatedCounts[j] || 0) };
          });
          programMatches.push({ program: prog, programCount: cnt, matchJob: best.job, confidence: best.score, matchCount: best.count });
        });

        if (programMatches.length) {
          results.push('Generated program→job match suggestions (with confidence scores).');
        }

        // Build a structured decision tree and recommendations
        const nodes = [];
        const recs = [];

        if (employedPct === null) {
          nodes.push({ rule: 'Insufficient data', outcome: 'Unable to determine employment level' });
          recs.push('Collect more survey responses to enable reliable analysis.');
        } else {
          if (employedPct >= 80) {
            nodes.push({ rule: `employedWithin% >= 80 (${employedPct}%)`, outcome: 'High employment' });
            recs.push('Highlight successful placement practices and continue employer engagement.');
          } else if (employedPct >= 50) {
            nodes.push({ rule: `50 <= employedWithin% < 80 (${employedPct}%)`, outcome: 'Moderate employment' });
            recs.push('Consider targeted career workshops for lower-performing programs to improve placement.');
          } else {
            nodes.push({ rule: `employedWithin% < 50 (${employedPct}%)`, outcome: 'Low employment' });
            recs.push('Recommend a review of curriculum relevance and employer outreach; prioritize professional development and internship pipelines.');
          }
        }

        // Use performance and promotion signals to refine recommendations
        if (perfEntries.length) {
          const [bestPerf] = perfEntries[0];
          if (bestPerf.toLowerCase().includes('poor') || bestPerf.toLowerCase().includes('below')) {
            recs.push('Work performance ratings are low — consider soft-skills and technical upskilling programs.');
          }
        }
        if (promotedYes > 0) recs.push('Promotion data suggests career progression for some alumni; capture employer success stories for outreach.');
        if (selfEmpYes > 0) recs.push('Self-employment presence — consider entrepreneurship support and incubation linkages.');

        // save structured outputs
        setProgramJobMatches(programMatches);
        setAnalysisResults(results);
        setDecisionTree(nodes.map(n => `${n.rule} => ${n.outcome}`));
        setDecisionTreeNodes(nodes);
        setRecommendations(recs);
      } catch (err) {
        console.error('Analysis failed', err);
        setAnalysisResults(['Analysis failed — see console for details.']);
      } finally {
        setAnalysisLoading(false);
      }
    }, 80);
  };

  // clipboard copy removed: Export PDF is the supported export action for the decision tree

  // Export a printable HTML view and trigger the browser Print dialog (user can Save as PDF)
  const exportDecisionTreePdf = () => {
    try {
  // Build a concise title: omit 'all' placeholders so we don't show "Decision tree — all — all"
  let title = 'Analysis Results';
  const extras = [];
  if (selectedProgram && selectedProgram !== 'all') extras.push(selectedProgram);
  if (selectedYear && selectedYear !== 'all') extras.push(selectedYear);
  if (extras.length) title += ' — ' + extras.join(' — ');
      const analysisHtml = (analysisResults && analysisResults.length) ? `<ul>${analysisResults.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul>` : '<div>None</div>';
      const dtText = (decisionTree && decisionTree.length) ? escapeHtml(decisionTree.join('\n')) : 'Decision tree: insufficient data';
      const recHtml = (recommendations && recommendations.length) ? `<ol>${recommendations.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ol>` : '<div>None</div>';
      const matchesHtml = (programJobMatches && programJobMatches.length) ? `
        <table style="width:100%;border-collapse:collapse;border:1px solid #eee;margin-top:6px">
          <thead><tr><th style="border:1px solid #eee;padding:8px;text-align:left">Program</th><th style="border:1px solid #eee;padding:8px;text-align:left">Job</th><th style="border:1px solid #eee;padding:8px;text-align:left">Confidence</th><th style="border:1px solid #eee;padding:8px;text-align:left">Responses</th></tr></thead>
          <tbody>
            ${programJobMatches.map(pm => `<tr><td style="border:1px solid #eee;padding:8px">${escapeHtml(pm.program)}</td><td style="border:1px solid #eee;padding:8px">${escapeHtml(pm.matchJob||'—')}</td><td style="border:1px solid #eee;padding:8px">${pm.confidence||0}%</td><td style="border:1px solid #eee;padding:8px">${pm.programCount||0}</td></tr>`).join('')}
          </tbody>
        </table>
      ` : '<div>No matches available.</div>';

      const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
        <style>body{font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111;background:#fff;padding:20px}h1{font-size:18px;margin:0}h2{font-size:14px;margin-top:12px;margin-bottom:6px}.muted{color:#6b7280;font-size:13px}table{font-size:13px}</style>
        </head><body>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
          <img src="/image.png" alt="DOrSU logo" style="height:48px;width:auto;border-radius:6px;object-fit:contain" />
          <div>
            <h1>${escapeHtml(title)}</h1>
            <div class="muted">Generated by DOrSU Alumni Tracer</div>
          </div>
        </div>
        <h2>Analysis</h2>
        ${analysisHtml}
        <h2>Decision tree</h2>
        <pre style="background:#f6f8fa;padding:10px;border-radius:6px;white-space:pre-wrap">${dtText}</pre>
        <h2>Recommendations</h2>
        ${recHtml}
        <h2>Program → Job Matches</h2>
        ${matchesHtml}
        </body></html>`;

      const w = window.open('', '_blank');
      if (!w) { try { window && window.alert && window.alert('Please allow popups to export PDF'); } catch (e) {} return; }
      w.document.open();
      w.document.write(html);
      w.document.close();
      // give browser a moment to render before invoking print
      setTimeout(() => { try { w.focus(); w.print(); } catch (e) { console.error('Print failed', e); } }, 500);
    } catch (err) {
      console.error('Export PDF failed', err);
      try { window && window.alert && window.alert('Export PDF failed'); } catch (e) {}
    }
  };

  // trend analysis: compute employment-rate trend across last N years (can be reused)
  const analyzeTrends = useCallback(async (years = 5) => {
    setTrendLoading(true);
    try {
      const base = process.env.REACT_APP_API_BASE || '';
      const currentYear = new Date().getFullYear();
      let labels = [];
      const yearParams = [];
      for (let i = years - 1; i >= 0; i--) {
        const y = String(currentYear - i);
        labels.push(y);
        const params = new URLSearchParams();
        params.set('year', y);
        if (selectedProgram && selectedProgram !== 'all') params.set('program', selectedProgram);
        yearParams.push(params.toString());
      }
      const fetches = yearParams.map(p => fetch(`${base}/api/survey-aggregates/?${p}`).then(r => r.ok ? r.json() : null).catch(() => null));
      const responses = await Promise.all(fetches);
      const values = responses.map(d => {
        if (!d) return null;
        const yes = Number((d.employed && d.employed.yes) || 0);
        const no = Number((d.employed && d.employed.no) || 0);
        return (yes + no) > 0 ? Math.round((yes / (yes + no)) * 100) : null;
      });

      // Respect requested year sort order for labels/values
      if (yearSortOrder === 'desc') {
        labels = labels.slice().reverse();
        values.reverse();
      }

      setTrendData({ labels, values });

      const pts = values.map((v, idx) => ({ x: idx, y: v })).filter(p => p.y !== null && !isNaN(p.y));
      if (pts.length >= 2) {
        const n = pts.length;
        const sumX = pts.reduce((s,p) => s + p.x, 0);
        const sumY = pts.reduce((s,p) => s + p.y, 0);
        const sumXY = pts.reduce((s,p) => s + p.x * p.y, 0);
        const sumXX = pts.reduce((s,p) => s + p.x * p.x, 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
        const direction = slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'flat';
        setTrendSummary(`Employment rate trend over last ${years} years is ${direction} (slope ${slope.toFixed(2)}).`);
      } else {
        setTrendSummary('Not enough yearly data to compute a trend.');
      }
    } catch (err) {
      console.error('Trend analysis failed', err);
      setTrendSummary('Trend analysis failed.');
    } finally {
      setTrendLoading(false);
    }
  }, [selectedProgram, yearSortOrder]);

  // auto-run analysis when aggregates change to keep results fresh
  useEffect(() => {
    runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(employedWithinCounts), JSON.stringify(programCounts), JSON.stringify(jobsRelatedCounts), JSON.stringify(workPerformanceCounts)]);

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: 12 }}>
      <h2>Evaluation Reports</h2>
      <p>Choose a chart to display from the current survey aggregates.</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="er-controls">
            <div className="er-control er-control--chart">
              <label className="er-label">Chart:</label>
              <select className="er-select er-select--chart" value={selectedChart} onChange={e => setSelectedChart(e.target.value)}>
                {chartOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
              </select>
            </div>

            <div className="er-control er-control--year" style={{ minWidth: 120 }}>
              <label className="er-label">Year:</label>
              <select className="er-select er-select--year" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                <option value="all">All years</option>
                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="er-control er-control--program" style={{ minWidth: 180 }}>
              <label className="er-label">Program:</label>
              <div className="er-autocomplete">
                <input
                  ref={programInputRef}
                  className="er-input"
                  placeholder="Search or select a program"
                  value={programQuery}
                  onChange={e => { setProgramQuery(e.target.value); setShowProgramDropdown(true); setSuggestionIndex(-1); }}
                  onFocus={() => setShowProgramDropdown(true)}
                  onKeyDown={e => {
                    if (e.key === 'ArrowDown') { e.preventDefault(); setSuggestionIndex(i => Math.min(i + 1, filteredSuggestions.length - 1)); setShowProgramDropdown(true); }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); setSuggestionIndex(i => Math.max(i - 1, 0)); }
                    else if (e.key === 'Enter') { e.preventDefault(); if (suggestionIndex >= 0 && filteredSuggestions[suggestionIndex]) { const s = filteredSuggestions[suggestionIndex]; setProgramQuery(s); setSelectedProgram(s); setShowProgramDropdown(false); setSuggestionIndex(-1); } }
                    else if (e.key === 'Escape') { setShowProgramDropdown(false); setSuggestionIndex(-1); }
                  }}
                />

                {showProgramDropdown && filteredSuggestions && filteredSuggestions.length > 0 && (
                  <div className="er-suggestions" role="listbox">
                    <div className={`er-suggestion ${selectedProgram === 'all' ? 'active' : ''}`} onMouseDown={() => { setProgramQuery(''); setSelectedProgram('all'); setShowProgramDropdown(false); }}>
                      All programs
                    </div>
                    {filteredSuggestions.map((s, i) => (
                      <div
                        key={s}
                        className={`er-suggestion ${i === suggestionIndex ? 'active' : ''}`}
                        onMouseDown={() => { setProgramQuery(s); setSelectedProgram(s); setShowProgramDropdown(false); setSuggestionIndex(-1); }}
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
    
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={downloadCsv} className="btn btn-outline">Download CSV</button>
          <button onClick={() => { setSelectedYear('all'); setSelectedProgram('all'); setProgramQuery(''); }} className="btn btn-outline">Reset filters</button>
        </div>
      </div>

      <div style={{ background: '#fff', padding: 12, borderRadius: 10, minHeight: 320 }}>
        {loading ? (
          <div>Loading…</div>
        ) : (
          <div style={{ height: 380 }}>
            {selectedChart === 'employed' && <Bar data={employedData} options={{ ...commonOptions, indexAxis: 'y', plugins: { ...commonOptions.plugins, legend: { display: false } } }} />}
            {selectedChart === 'performance' && <Pie data={perfData} options={{ ...commonOptions, plugins: { ...commonOptions.plugins, legend: { position: 'bottom', labels: { padding: 12 } } } }} />}
            {selectedChart === 'job_difficulties' && <Bar data={jobDifficultyData} options={{ ...commonOptions, indexAxis: 'y', plugins: { ...commonOptions.plugins, legend: { display: false } } }} />}
            {selectedChart === 'jobs_related' && <Pie data={jobsRelatedData} options={{ ...commonOptions, plugins: { ...commonOptions.plugins, legend: { position: 'bottom' } } }} />}
            {selectedChart === 'source' && <Bar data={sourceData} options={{ ...commonOptions, indexAxis: 'y', plugins: { ...commonOptions.plugins, legend: { display: false } }, scales: { x: { beginAtZero: true } } }} />}
            {selectedChart === 'self_emp' && <Pie data={selfEmpData} options={{ ...commonOptions, plugins: { ...commonOptions.plugins, legend: { position: 'bottom' } } }} />}
            {selectedChart === 'promoted' && <Pie data={promotedData} options={{ ...commonOptions, plugins: { ...commonOptions.plugins, legend: { position: 'bottom' } } }} />}
            {selectedChart === 'programs' && <Bar data={programData} options={{ ...commonOptions, indexAxis: 'y', plugins: { ...commonOptions.plugins, legend: { display: false } }, scales: { x: { beginAtZero: true } } }} />}
          </div>
        )}
      </div>

      {/* Analysis panel: card/grid professional layout */}
      <div className="er-analysis">
        <div className="er-card">
          <div className="er-card__header">
            <div>
              <div className="er-card__title">Deeper analysis</div>
              <div className="er-card__meta">Quick insights from the current aggregates</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline" onClick={() => runAnalysis()} disabled={analysisLoading}>{analysisLoading ? 'Running…' : 'Run analysis'}</button>
              <button className="btn btn-outline" onClick={() => analyzeTrends(5)} disabled={trendLoading}>{trendLoading ? 'Computing…' : 'Compute trend'}</button>
            </div>
          </div>

          {analysisLoading ? (
            <div>Running analysis…</div>
          ) : (
            <div>
              <div className="er-stats">
                {/* employment pct */}
                <div className="er-stat">
                  <div className="er-stat__label">Employed within 6 months</div>
                  <div className="er-stat__value">{(() => {
                    const yes = Number((employedWithinCounts && employedWithinCounts.yes) || 0);
                    const no = Number((employedWithinCounts && employedWithinCounts.no) || 0);
                    const pct = (yes + no) > 0 ? Math.round((yes / (yes + no)) * 100) + '%' : 'n/a';
                    return pct;
                  })()}</div>
                </div>

                {/* sample size */}
                <div className="er-stat">
                  <div className="er-stat__label">Responses (filtered)</div>
                  <div className="er-stat__value">{surveyCountLocal || '—'}</div>
                </div>

                {/* top program (clickable to filter) */}
                <button
                  type="button"
                  className="er-stat er-clickable"
                  onClick={() => {
                    const entries = Object.entries(programCounts || {}).sort((a,b)=>b[1]-a[1]);
                    if (!entries.length) return;
                    const [name] = entries[0];
                    setProgramQuery(name);
                    setSelectedProgram(name);
                    setShowProgramDropdown(false);
                  }}
                >
                  <div className="er-stat__label">Top program</div>
                  <div className="er-stat__value button-like">{(() => {
                    const entries = Object.entries(programCounts || {}).sort((a,b)=>b[1]-a[1]);
                    if (!entries.length) return '—';
                    const total = entries.reduce((s,e)=>s+(e[1]||0),0) || 1;
                    const [name, cnt] = entries[0];
                    const pct = Math.round((cnt/total)*100);
                    return `${name} (${pct}%)`;
                  })()}</div>
                </button>
              </div>

              <div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Analysis</div>
                <ul>
                  {analysisResults.map((r, i) => <li key={i} style={{ marginBottom: 6 }}>{r}</li>)}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="er-card">
          <div className="er-card__header">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <svg className="er-card__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3v18h18" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 7h.01" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 7h.01" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M17 7h.01" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <div>
                <div className="er-card__title">Program → Job matches</div>
                <div className="er-card__meta">Top programs mapped to job-category labels</div>
              </div>
            </div>
          </div>

          <div className="er-match-list">
            {programJobMatches && programJobMatches.length > 0 ? (
              programJobMatches.map((pm, i) => (
                <div key={i} className="er-match-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600 }}>{pm.program}</div>
                    <div style={{ color: '#6b7280' }}>{pm.programCount || 0} responses</div>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div style={{ color: '#374151' }}>{pm.matchJob || '—'}</div>
                      <div style={{ fontSize: 13, color: '#6b7280' }}>{pm.confidence ? `confidence ${pm.confidence}%` : ''} {pm.matchCount ? ` · ${pm.matchCount} in that job` : ''}</div>
                    </div>
                    {typeof pm.confidence === 'number' && (
                      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 6, marginTop: 8 }}>
                        <div style={{ width: `${pm.confidence}%`, height: '100%', background: pm.confidence > 60 ? '#10b981' : '#f59e0b', borderRadius: 6 }} />
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div>No matches available.</div>
            )}
          </div>
        </div>

        <div className="er-card">
          <div className="er-card__header">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <svg className="er-card__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3h18v6H3z" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 13h10v8H7z" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <div>
                <div className="er-card__title">Evaluation Reports</div>
                <div className="er-card__meta">Simple textual decision rules derived from aggregates</div>
              </div>
            </div>
              <div className="er-card__actions">
                <button
                  className="er-btn-ghost er-btn-primary"
                  style={{ background: '#2563eb', color: '#fff', border: '1px solid rgba(37,99,235,0.9)', padding: '6px 10px', borderRadius: 6 }}
                  onClick={exportDecisionTreePdf}
                  aria-label="Export analysis PDF"
                >
                  Export PDF
                </button>
              </div>
          </div>

          <div className="er-dt">
            {decisionTreeNodes && decisionTreeNodes.length ? (
              <div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Summary</div>
                <ul>
                  {decisionTreeNodes.map((n, idx) => <li key={idx} style={{ marginBottom: 6 }}><strong>{n.outcome}</strong> — <span style={{ color: '#374151' }}>{n.rule}</span></li>)}
                </ul>

                {recommendations && recommendations.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Recommendations</div>
                    <ol>
                      {recommendations.map((r, i) => <li key={i} style={{ marginBottom: 6 }}>{r}</li>)}
                    </ol>
                  </div>
                )}
              </div>
            ) : (
              <div>Decision tree: insufficient data</div>
            )}
          </div>
        </div>
      </div>

      {/* Trend summary and small line chart (styled via CSS) */}
      <section className="er-trend-card">
        <div className="er-trend-header">
          <strong>Employment trend (last 5 years)</strong>
          <div>
            <button className="btn btn-outline" onClick={() => analyzeTrends(5)} disabled={trendLoading}>{trendLoading ? 'Computing…' : 'Refresh trend'}</button>
          </div>
        </div>

        <div className="er-trend-body">
          {trendLoading ? (
            <div className="er-trend-loading">Computing trend…</div>
          ) : (
            <div className="er-trend-chart">
              {trendData && trendData.labels && trendData.labels.length > 0 ? (
                <>
                  <Line data={{ labels: trendData.labels, datasets: [{ label: 'Employed within 6 months (%)', data: trendData.values.map(v => v === null ? null : v), borderColor: '#60a5fa', backgroundColor: 'rgba(96,165,250,0.12)', tension: 0.2 }] }} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } }, plugins: { legend: { display: false } } }} />
                  <div className="er-trend-summary">{trendSummary}</div>
                </>
              ) : (
                <div className="er-trend-no-data">{trendSummary || 'No trend data available.'}</div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
