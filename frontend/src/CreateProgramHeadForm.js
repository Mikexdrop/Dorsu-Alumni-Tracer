import React, { useState } from 'react';
import { useToast } from './Toast';

function CreateProgramHeadForm({
  username,
  setUsername,
  password,
  setPassword,
  createName,
  setCreateName,
  createSurname,
  setCreateSurname,
  createMI,
  setCreateMI,
  createGender,
  setCreateGender,
  createContact,
  setCreateContact,
  createEmail,
  setCreateEmail,
  createFaculty,
  setCreateFaculty,
  createProgram,
  setCreateProgram,
  showCreatePassword,
  setShowCreatePassword,
  handleCreateUser,
  setShowCreateForm,
  setError,
  setUsers,
  facultyPrograms = {}
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingExtra, setPendingExtra] = useState(null);
  const toast = useToast();
  const [showCreatedMsg, setShowCreatedMsg] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!username || !password || !createName || !createSurname || !createGender || !createFaculty || !createProgram) {
      setError && setError('Please fill in all required fields');
      return;
    }

    if (createEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createEmail)) {
      setError && setError('Please enter a valid email address');
      return;
    }

    // Prepare payload and show inline confirmation modal
    const extra = {
      full_name: createName && createSurname ? `${createName} ${createSurname}` : '',
      name: createName,
      surname: createSurname,
      mi: createMI,
      gender: createGender,
      contact: createContact,
      email: createEmail,
      faculty: createFaculty,
      program: createProgram,
      status: 'approved'
    };

    setPendingExtra(extra);
    setShowConfirm(true);
    return;
  };

  const performCreate = async () => {
    setShowConfirm(false);
    if (!pendingExtra) return;
    setIsSubmitting(true);
    try {
      const created = await handleCreateUser({ preventDefault: () => {} }, username, password, 'program_head', setShowCreateForm, setUsername, setPassword, undefined, pendingExtra, setError);

      // If backend returned the created object, append it to users table for immediate UI feedback
      if (created && typeof setUsers === 'function') {
        try {
          setUsers(prev => ([...(prev || []), created]));
        } catch (_) {}
      }

      // show toast instead of alert
      if (toast && typeof toast.show === 'function') {
        toast.show('Program Head account created successfully!');
      } else {
        // show a small non-blocking modal instead of native alert
        setShowCreatedMsg(true);
      }

      // Clear form and close
      setShowCreateForm && setShowCreateForm(false);
      setUsername && setUsername('');
      setPassword && setPassword('');
      setCreateName && setCreateName('');
      setCreateSurname && setCreateSurname('');
      setCreateMI && setCreateMI('');
      setCreateGender && setCreateGender('');
      setCreateContact && setCreateContact('');
      setCreateEmail && setCreateEmail('');
      setCreateFaculty && setCreateFaculty('');
      setCreateProgram && setCreateProgram('');
      setPendingExtra(null);
    } catch (err) {
      setError && setError(err?.message || 'Failed to create Program Head account');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Robust cancel handler: prefer the setter passed from parent; if it's not provided
  // dispatch a DOM CustomEvent so a parent component may listen and react.
  const handleCancel = () => {
    try {
      // debug: log that cancel was invoked
      try { console.debug && console.debug('CreateProgramHeadForm: handleCancel invoked'); } catch (_) {}
      // Prefer direct setter to close modal if provided
      if (typeof setShowCreateForm === 'function') {
        try { setShowCreateForm(false); } catch (_) {}
      }

      // Clear fields if setters are available
      setUsername && setUsername('');
      setPassword && setPassword('');
      setCreateName && setCreateName('');
      setCreateSurname && setCreateSurname('');
      setCreateMI && setCreateMI('');
      setCreateGender && setCreateGender('');
      setCreateContact && setCreateContact('');
      setCreateEmail && setCreateEmail('');
      setCreateFaculty && setCreateFaculty('');
      setCreateProgram && setCreateProgram('');
      setError && setError('');

      // Always dispatch an event so parents that listen can react (works even if setter not provided)
      if (typeof window !== 'undefined' && window.CustomEvent) {
        try { window.dispatchEvent(new CustomEvent('CreateProgramHeadFormCancel', { detail: {} })); } catch (_) {}
        try { console.debug && console.debug('CreateProgramHeadForm: CreateProgramHeadFormCancel dispatched'); } catch (_) {}
      }
    } catch (err) {
      /* eslint-disable no-console */
      console.error('Error in handleCancel', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 3 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ color: '#6b7280', fontSize: 12 }}>Username</div>
          <input type="text" value={username} onChange={(e) => setUsername && setUsername(e.target.value)} required style={{ padding: 10, width: '100%', borderRadius: 8, border: '1px solid #e6edf3' }} />
        </div>
        <div>
          <div style={{ color: '#6b7280', fontSize: 12 }}>Password</div>
          <div style={{ position: 'relative' }}>
            <input
              aria-label="password"
              type={showCreatePassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword && setPassword(e.target.value)}
              required
              style={{ padding: 10, width: '100%', borderRadius: 8, border: '1px solid #e6edf3' }}
            />
            <button
              type="button"
              aria-label={showCreatePassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowCreatePassword && setShowCreatePassword(s => !s)}
              style={{ position: 'absolute', right: 8, top: 8, border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              {showCreatePassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 8 }}>Personal & Contact</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ color: '#6b7280', fontSize: 12 }}>Name</div>
            <input value={createName} onChange={e => setCreateName && setCreateName(e.target.value)} required style={{ padding: 10, width: '100%', borderRadius: 8, border: '1px solid #e6edf3' }} />
          </div>
          <div>
            <div style={{ color: '#6b7280', fontSize: 12 }}>Surname</div>
            <input value={createSurname} onChange={e => setCreateSurname && setCreateSurname(e.target.value)} required style={{ padding: 10, width: '100%', borderRadius: 8, border: '1px solid #e6edf3' }} />
          </div>
          <div>
            <div style={{ color: '#6b7280', fontSize: 12 }}>M.I.</div>
            <input value={createMI} onChange={e => setCreateMI && setCreateMI(e.target.value)} maxLength={2} style={{ padding: 10, width: '100%', borderRadius: 8, border: '1px solid #e6edf3' }} />
          </div>
          <div>
            <div style={{ color: '#6b7280', fontSize: 12 }}>Gender</div>
            <select value={createGender} onChange={e => setCreateGender && setCreateGender(e.target.value)} required style={{ padding: 10, width: '100%', borderRadius: 8, border: '1px solid #e6edf3' }}>
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <div>
            <div style={{ color: '#6b7280', fontSize: 12 }}>Contact</div>
            <input value={createContact} onChange={e => setCreateContact && setCreateContact(e.target.value)} placeholder="e.g., 09123456789" style={{ padding: 10, width: '100%', borderRadius: 8, border: '1px solid #e6edf3' }} />
          </div>
          <div>
            <div style={{ color: '#6b7280', fontSize: 12 }}>Email</div>
            <input type="email" value={createEmail} onChange={e => setCreateEmail && setCreateEmail(e.target.value)} placeholder="name@institution.com" required style={{ padding: 10, width: '100%', borderRadius: 8, border: '1px solid #e6edf3' }} />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ color: '#6b7280', fontSize: 12 }}>Faculty</div>
          <select value={createFaculty} onChange={e => { setCreateFaculty && setCreateFaculty(e.target.value); setCreateProgram && setCreateProgram(''); }} required style={{ padding: 10, width: '100%', borderRadius: 8, border: '1px solid #e6edf3' }}>
            <option value="">Select Faculty</option>
            {Object.keys(facultyPrograms).map(f => (<option key={f} value={f}>{f}</option>))}
          </select>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ color: '#6b7280', fontSize: 12 }}>Program</div>
          <select value={createProgram} onChange={e => setCreateProgram && setCreateProgram(e.target.value)} required disabled={!createFaculty} style={{ padding: 10, width: '100%', borderRadius: 8, border: '1px solid #e6edf3', background: !createFaculty ? '#f3f4f6' : '#fff' }}>
            <option value="">{createFaculty ? 'Select Program' : 'Select Faculty First'}</option>
            {createFaculty && (facultyPrograms[createFaculty] || []).map(pr => (<option key={pr} value={pr}>{pr}</option>))}
          </select>
        </div>
      </div>

      <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
        <button
          className="btn-create"
          type="submit"
          disabled={isSubmitting}
          style={{ padding: '10px 16px', background: isSubmitting ? '#9ca3af' : '#10b981', color: '#fff', border: 'none', borderRadius: 8, cursor: isSubmitting ? 'not-allowed' : 'pointer', fontWeight: 700 }}
        >
          {isSubmitting ? 'Creating...' : 'Create'}
        </button>

        {/* Lightweight text cancel to match screenshot: no background, subtle hover, small font */}
        <button
          className="btn-cancel"
          type="button"
          aria-label="Back"
          title="Back"
          onClick={(e) => { e && e.stopPropagation && e.stopPropagation(); handleCancel && handleCancel(); }}
          style={{
            position: 'relative',
            zIndex: 9999,
            pointerEvents: 'auto',
            background: 'transparent',
            border: 'none',
            color: '#374151',
            padding: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none'
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = '#111827'; e.currentTarget.style.textDecoration = 'underline'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = '#374151'; e.currentTarget.style.textDecoration = 'none'; }}
        >
          Back
        </button>
      </div>
      {showConfirm && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(2,6,23,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6000 }}>
          <div style={{ width: 420, maxWidth: '95%', background: '#fff', borderRadius: 12, boxShadow: '0 12px 40px rgba(2,6,23,0.35)', padding: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Confirm create</div>
            <div style={{ fontSize: 14, color: '#111827', padding: '12px 0', minHeight: 50 }}>Are you sure you want to create this Program Head account?</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={() => { setShowConfirm(false); setPendingExtra(null); }} className="btn btn-outline">Cancel</button>
              <button onClick={performCreate} className="btn btn-primary">Confirm</button>
            </div>
          </div>
        </div>
      )}
      {showCreatedMsg && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(2,6,23,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6000 }}>
          <div style={{ width: 420, maxWidth: '95%', background: '#fff', borderRadius: 12, boxShadow: '0 12px 40px rgba(2,6,23,0.35)', padding: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Created</div>
            <div style={{ fontSize: 14, color: '#111827', padding: '12px 0', minHeight: 50 }}>Program Head account created successfully!</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={() => setShowCreatedMsg(false)} className="btn btn-primary">OK</button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

export default CreateProgramHeadForm;