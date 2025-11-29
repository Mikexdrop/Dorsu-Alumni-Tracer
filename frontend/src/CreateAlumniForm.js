import React, { useState } from 'react';

function CreateAlumniForm({
  username,
  setUsername,
  password,
  setPassword,
  editProgramCourse,
  setEditProgramCourse,
  handleCreateUser,
  setShowCreateForm,
  setUserType,
  setError,
  programs = []
}) {
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [mi, setMi] = useState('');
  const [email, setEmail] = useState('');
  const [yearGraduated, setYearGraduated] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingExtra, setPendingExtra] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    // Basic validation similar to SignupPanel
    setError && setError('');
    if (!username || !password || !name || !surname || !email || !confirmPassword) {
      setError && setError('Please fill in all required fields');
      return;
    }
    // simple email validation
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    if (!emailRe.test(email)) {
      setError && setError('Please enter a valid email address');
      return;
    }
    if (password.length < 8) {
      setError && setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError && setError('Passwords do not match');
      return;
    }
  // Prepare payload and show inline confirmation modal
    const extra = {
      full_name: name && surname ? `${name} ${surname}` : '',
      name,
      surname,
      mi,
      email,
      program_course: editProgramCourse,
      year_graduated: yearGraduated || null,
      status: 'pending'
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
      // call handleCreateUser with a dummy event object to avoid relying on a real event
      await handleCreateUser({ preventDefault: () => {} }, username, password, 'alumni', setShowCreateForm, setUsername, setPassword, setUserType, pendingExtra, setError);
      // clear local signup fields on success
      setName(''); setSurname(''); setMi(''); setEmail(''); setConfirmPassword('');
  setYearGraduated('');
      setPendingExtra(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    try {
      setShowCreateForm && setShowCreateForm(false);
    } catch (_) {}
    setUsername && setUsername('');
    setPassword && setPassword('');
    setUserType && setUserType('admin');
    setEditProgramCourse && setEditProgramCourse('');
  setYearGraduated('');
    // also dispatch the shared cancel event for consistency
    if (typeof window !== 'undefined' && window.CustomEvent) {
      try { window.dispatchEvent(new CustomEvent('CreateProgramHeadFormCancel', { detail: {} })); } catch (_) {}
      try { document.dispatchEvent && document.dispatchEvent(new CustomEvent('CreateProgramHeadFormCancel', { detail: {} })); } catch (_) {}
    }
  };

  return (
    <form onSubmit={submit} style={{ position: 'relative', zIndex: 3 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ color: '#6b7280', fontSize: 12 }}>Username</div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername && setUsername(e.target.value)}
            required
            style={{ padding: 10, width: '100%', borderRadius: 8, border: '1px solid #e6edf3' }}
          />
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
              onClick={() => setShowCreatePassword(s => !s)}
              style={{ position: 'absolute', right: 8, top: 8, border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              {showCreatePassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ color: '#6b7280', fontSize: 12 }}>First Name</div>
          <input value={name} onChange={e => setName && setName(e.target.value)} required style={{ padding: 10, width: '100%', borderRadius: 8, border: '1px solid #e6edf3' }} />
        </div>
        <div>
          <div style={{ color: '#6b7280', fontSize: 12 }}>Last Name</div>
          <input value={surname} onChange={e => setSurname && setSurname(e.target.value)} required style={{ padding: 10, width: '100%', borderRadius: 8, border: '1px solid #e6edf3' }} />
        </div>
        <div>
          <div style={{ color: '#6b7280', fontSize: 12 }}>M.I.</div>
          <input value={mi} onChange={e => setMi && setMi(e.target.value)} maxLength={2} style={{ padding: 10, width: '100%', borderRadius: 8, border: '1px solid #e6edf3' }} />
        </div>
        <div>
          <div style={{ color: '#6b7280', fontSize: 12 }}>Email</div>
          <input type="email" value={email} onChange={e => setEmail && setEmail(e.target.value)} required placeholder="name@institution.com" style={{ padding: 10, width: '100%', borderRadius: 8, border: '1px solid #e6edf3' }} />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ color: '#6b7280', fontSize: 12 }}>Confirm Password</div>
        <div style={{ position: 'relative' }}>
          <input type={showCreatePassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword && setConfirmPassword(e.target.value)} required style={{ padding: 10, width: '100%', borderRadius: 8, border: '1px solid #e6edf3' }} />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ color: '#6b7280', fontSize: 12 }}>Program / course</div>
        <input
          list="programs-list"
          type="text"
          value={editProgramCourse}
          onChange={e => setEditProgramCourse && setEditProgramCourse(e.target.value)}
          placeholder="Start typing to search..."
          style={{ padding: 10, width: '100%', borderRadius: 8, border: '1px solid #e6edf3' }}
        />
        <datalist id="programs-list">
          {programs.map(p => (<option key={p} value={p} />))}
        </datalist>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ color: '#6b7280', fontSize: 12 }}>Year Graduated</div>
        <input
          type="number"
          inputMode="numeric"
          value={yearGraduated}
          onChange={e => setYearGraduated && setYearGraduated(e.target.value)}
          placeholder="e.g. 2018"
          style={{ padding: 10, width: '100%', borderRadius: 8, border: '1px solid #e6edf3' }}
        />
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

        <button
          className="btn-cancel"
          type="button"
          aria-label="Back"
          title="Back"
          onClick={(e) => { e && e.stopPropagation && e.stopPropagation(); handleBack && handleBack(); }}
          style={{ position: 'relative', zIndex: 9999, pointerEvents: 'auto', background: 'transparent', border: 'none', color: '#374151', padding: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
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
            <div style={{ fontSize: 14, color: '#111827', padding: '12px 0', minHeight: 50 }}>Are you sure you want to create this Alumni account?</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={() => { setShowConfirm(false); setPendingExtra(null); }} className="btn btn-outline">Cancel</button>
              <button onClick={performCreate} className="btn btn-primary">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

export default CreateAlumniForm;