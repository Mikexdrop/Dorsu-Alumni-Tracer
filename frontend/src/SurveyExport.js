// SurveyExport.js
// Helper to open a printable export window for an alumni survey.
export function openSurveyExportWindow({ existingSurvey = null, html = '', showToast = () => {} } = {}) {
  try {
    // Try to locate an avatar URL from several possible sources
    const resolveAvatar = () => {
      try {
        if (existingSurvey) {
          if (existingSurvey.alumni_info && existingSurvey.alumni_info.image) return existingSurvey.alumni_info.image;
          if (existingSurvey.alumni && existingSurvey.alumni.image) return existingSurvey.alumni.image;
        }
        const cur = localStorage.getItem('currentUser');
        if (cur) {
          const obj = JSON.parse(cur);
          if (obj.image) return obj.image;
          if (obj.avatar) return obj.avatar;
          if (obj.profile && obj.profile.image) return obj.profile.image;
        }
      } catch (_){ }
      return null;
    };

    let avatarUrl = resolveAvatar();
    if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.startsWith('/')) {
      const base = process.env.REACT_APP_API_BASE || window.location.origin || '';
      avatarUrl = `${base}${avatarUrl}`;
    }

    const nameParts = [];
    if (existingSurvey) {
      if (existingSurvey.first_name) nameParts.push(existingSurvey.first_name);
      if (existingSurvey.middle_name) nameParts.push(existingSurvey.middle_name);
      if (existingSurvey.last_name) nameParts.push(existingSurvey.last_name);
    }
    if (nameParts.length === 0) {
      try {
        const cur = localStorage.getItem('currentUser');
        if (cur) {
          const obj = JSON.parse(cur);
          if (obj.full_name) nameParts.push(obj.full_name);
          else if (obj.username) nameParts.push(obj.username);
        }
      } catch (_) {}
    }

    const nameHtml = nameParts.length ? `<div style="font-size:18px;font-weight:700;color:#0f172a">${nameParts.join(' ')}</div>` : '';

    const headerHtml = `
      <div class='export-header'>
        ${avatarUrl ? `<img src="${avatarUrl}" alt="avatar" class='export-avatar'/>` : `<div class='export-avatar' style='background:#f3f4f6'></div>`}
        <div>
          ${nameHtml ? `<div class='export-title'>${nameParts.join(' ')}</div>` : ''}
        </div>
      </div>
      <hr />
    `;

    const printStyles = `
      body { font-family: Inter, Arial, sans-serif; color: #111827; background: #fff; }
      .export-container { max-width: 900px; margin: 12px auto; background: #ffffff; padding: 12px; border-radius: 6px; }
      .export-header { display:flex; gap:10px; align-items:center; margin-bottom:6px; }
      .export-avatar { width:56px; height:56px; border-radius:6px; object-fit:cover; border:1px solid #e6eefb; }
      .export-title { font-size:15px; font-weight:700; color:#0f172a; }
      .export-subtitle { color:#64748b; font-size:11px; margin-top:2px; }
      .export-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-top:6px; }
      .field-label { font-size:10px; color:#6b7280; margin-bottom:2px; }
      .field-value { font-size:12px; color:#0f172a; line-height:1.1; }
      .section { margin-top:6px; }
      .notes { white-space:pre-wrap; font-size:12px; }
      hr { border:none; border-top:1px solid #e6eefb; margin:10px 0; }
      .export-body .employment-history, .export-body .self-employment { margin-top:6px; font-size:12px; }
      .export-body ul { margin:6px 0 0 18px; padding:0; }
      .export-body li { margin-bottom:4px; }
      @page { size: auto; margin: 9mm; }
      body { counter-reset: pageTotal; }
      .print-footer { width: 100%; text-align: center; font-size: 11px; color: #6b7280; margin-top: 8px }
      .page-number:after { content: "Page " counter(page); }
      @media print {
        body { margin: 0; }
        .export-container { box-shadow: none; border-radius: 0; margin: 0; padding: 10px; }
        .export-container .survey-title, .export-container .survey-description { display: none !important; }
        .no-print { display:none !important; }
        .export-container button, .export-container .btn, .export-container .submit-button, .export-container input, .export-container select, .export-container textarea, .export-container a { display: none !important; }
        .export-container .icon, .export-container .fa, .export-container .material-icons { display: none !important; }
        .print-footer { position: fixed; bottom: 6mm; left: 0; right: 0; font-size: 11px; }
        .export-container, .export-container * { -webkit-print-color-adjust: exact; }
      }
    `;
    // Helper to escape text for HTML output
    const escapeHtml = (str) => {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    // If caller didn't provide ready-made HTML, build a readable HTML body from the survey JSON
    if ((!html || String(html).trim() === '') && existingSurvey) {
      const s = existingSurvey;
      const field = (label, value) => `<div style="margin-bottom:8px"><div style="font-size:11px;color:#6b7280;margin-bottom:2px">${escapeHtml(label)}</div><div style="font-size:13px;color:#0f172a">${escapeHtml(value === null || value === undefined || value === '' ? '-' : value)}</div></div>`;

      // Build grid two-column layout
      let body = '<div class="export-grid">';
      body += `<div style="grid-column:1/2">${field('Last name', s.last_name)}</div>`;
      body += `<div style="grid-column:2/3">${field('First name', s.first_name)}</div>`;
      body += `<div style="grid-column:1/2">${field('Middle name', s.middle_name)}</div>`;
      body += `<div style="grid-column:2/3">${field('Year graduated', s.year_graduated)}</div>`;
      body += `<div style="grid-column:1/2">${field('Program / Course', s.course_program)}</div>`;
      body += `<div style="grid-column:2/3">${field('Student number', s.student_number)}</div>`;
      body += `<div style="grid-column:1/2">${field('Birth year', s.birth_year)}</div>`;
      body += `<div style="grid-column:2/3">${field('Birth month', s.birth_month)}</div>`;
      body += `<div style="grid-column:1/2">${field('Birth day', s.birth_day)}</div>`;
      body += `<div style="grid-column:2/3">${field('Age', s.age)}</div>`;
      body += `<div style="grid-column:1/2">${field('Gender', s.gender)}</div>`;
      body += `<div style="grid-column:2/3">${field('Home address', s.home_address)}</div>`;
      body += `<div style="grid-column:1/2">${field('Telephone number', s.telephone_number)}</div>`;
      body += `<div style="grid-column:2/3">${field('Mobile number', s.mobile_number)}</div>`;
      body += `<div style="grid-column:1 / -1">${field('Email', s.email)}</div>`;
      body += `<div style="grid-column:1/2">${field('Current job position', s.current_job_position)}</div>`;
      body += `<div style="grid-column:2/3">${field('Company affiliation', s.company_affiliation)}</div>`;
      body += `<div style="grid-column:1/2">${field('Company address', s.company_address)}</div>`;
      body += `<div style="grid-column:2/3">${field('Approx. monthly salary', s.approximate_monthly_salary)}</div>`;
      body += `<div style="grid-column:1/2">${field('Employed after graduation', s.employed_after_graduation)}</div>`;
      const jobDifficulties = Array.isArray(s.job_difficulties) ? (s.job_difficulties.length ? s.job_difficulties.join(', ') : '-') : (s.job_difficulties ? String(s.job_difficulties) : '-');
      body += `<div style="grid-column:2/3">${field('Job difficulties', jobDifficulties)}</div>`;
      body += `<div style="grid-column:1/2">${field('Employment source', s.employment_source)}</div>`;
      body += `<div style="grid-column:2/3">${field('Jobs related to experience?', s.jobs_related_to_experience)}</div>`;
      body += `<div style="grid-column:1 / -1">${field('Improvement suggestions / Additional notes', s.improvement_suggestions)}</div>`;
      body += `<div style="grid-column:1/2">${field('Has been promoted', s.has_been_promoted)}</div>`;
      body += `<div style="grid-column:2/3">${field('Work performance rating', s.work_performance_rating)}</div>`;

      // Employment records
      if (Array.isArray(s.employment_records) && s.employment_records.length > 0) {
        body += `<div style="grid-column:1 / -1"><div style="font-size:11px;color:#6b7280;margin-bottom:6px">Employment history</div><ul style="margin:6px 0 0 18px;padding:0">`;
        for (let i = 0; i < s.employment_records.length; i++) {
          const r = s.employment_records[i];
          const text = `${r.company_name || '-'} — ${r.position_and_status || '-'}${r.date_employed ? (' (' + r.date_employed + ')') : ''}`;
          body += `<li style="margin-bottom:4px">${escapeHtml(text)}</li>`;
        }
        body += '</ul></div>';
      }

      // Self-employment first entry
      if (Array.isArray(s.self_employment) && s.self_employment.length > 0) {
        const se = s.self_employment[0];
        const seText = `${se.business_name || '-'} — ${se.nature_of_business || ''}`;
        let seDetails = '';
        if (se.role_in_business) seDetails += 'Role: ' + se.role_in_business;
        if (se.monthly_profit) seDetails += (seDetails ? ' • ' : '') + 'Profit: ' + se.monthly_profit;
        body += `<div style="grid-column:1 / -1"><div style="font-size:11px;color:#6b7280;margin-bottom:6px">Self-employment (first entry)</div><div style="font-size:13px;color:#0f172a">${escapeHtml(seText)}</div><div style="margin-top:4px;font-size:13px;color:#0f172a">${escapeHtml(seDetails)}</div></div>`;
      }

      body += '</div>'; // close export-grid
      html = `<div class="export-body">${body}</div>`;
    }
    const w = window.open('', '_blank');
    if (w) {
      w.document.write('<html><head><title>Survey Export</title><meta charset="utf-8"><style>' + printStyles + '</style></head><body>');
      w.document.write('<div class="export-container">');
      w.document.write(headerHtml);
      w.document.write('<div class="export-body">');
      w.document.write(html);
      w.document.write('</div>');
      const printedAt = (new Date()).toLocaleString();
      w.document.write(`<div class="print-footer">Printed: ${printedAt} • <span class="page-number"></span></div>`);
      w.document.write('</div>');
      w.document.write('</body></html>');
      w.document.close();
      w.focus();
      try { w.print(); } catch(_){ }
    } else {
      showToast('error', 'Unable to open print window');
    }
  } catch (err) {
    console.error('Export failed', err);
    try { showToast('error', 'Export failed'); } catch(_){ }
  }
}
