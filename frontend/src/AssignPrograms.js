import React, { useState, useEffect } from 'react';
import Select from 'react-select';

const AVAILABLE_PROGRAMS = [
  { value: 'Bachelor of Elementary Education (BEED)', label: 'Bachelor of Elementary Education (BEED)' },
  { value: 'Bachelor of Early Childhood Education (BCED)', label: 'Bachelor of Early Childhood Education (BCED)' },
  { value: 'Bachelor of Special Needs Education (BSNED)', label: 'Bachelor of Special Needs Education (BSNED)' },
  { value: 'Bachelor Physical Education (BPED)', label: 'Bachelor Physical Education (BPED)' },
  { value: 'Bachelor of Technology and Livelihood Education (BTLED)', label: 'Bachelor of Technology and Livelihood Education (BTLED)' },
  { value: 'Bachelor of Secondary Education major in English (BSED English)', label: 'Bachelor of Secondary Education major in English (BSED English)' },
  { value: 'Bachelor of Secondary Education major in Filipino (BSED Filipino)', label: 'Bachelor of Secondary Education major in Filipino (BSED Filipino)' },
  { value: 'Bachelor of Secondary Education major in Mathematics (BSED Mathematics)', label: 'Bachelor of Secondary Education major in Mathematics (BSED Mathematics)' },
  { value: 'Bachelor of Secondary Education major in Science (BSED Science)', label: 'Bachelor of Secondary Education major in Science (BSED Science)' },
  { value: 'Bachelor of Science in Agribusiness Management (BSAM)', label: 'Bachelor of Science in Agribusiness Management (BSAM)' },
  { value: 'Bachelor of Science in Agriculture (BSA)', label: 'Bachelor of Science in Agriculture (BSA)' },
  { value: 'Bachelor of Science in Biology (BSBio)', label: 'Bachelor of Science in Biology (BSBio)' },
  { value: 'Bachelor of Science in Environmental Science (BSES)', label: 'Bachelor of Science in Environmental Science (BSES)' },
  { value: 'Bachelor in Industrial Technology Management major in Automotive Technology (BITM)', label: 'Bachelor in Industrial Technology Management major in Automotive Technology (BITM)' },
  { value: 'Bachelor of Science in Civil Engineering (BSCE)', label: 'Bachelor of Science in Civil Engineering (BSCE)' },
  { value: 'Bachelor of Science in Information Technology (BSIT)', label: 'Bachelor of Science in Information Technology (BSIT)' },
  { value: 'Bachelor of Science in Mathematics (BSMath)', label: 'Bachelor of Science in Mathematics (BSMath)' },
  { value: 'Bachelor of Science in Nursing (BSN)', label: 'Bachelor of Science in Nursing (BSN)' },
  { value: 'Bachelor of Science in Criminology (BSC)', label: 'Bachelor of Science in Criminology (BSC)' },
  { value: 'Bachelor of Science in Business Administration major of Financial Management (BSBA)', label: 'Bachelor of Science in Business Administration major of Financial Management (BSBA)' },
  { value: 'Bachelor of Science in Hospitality Management (BSHM)', label: 'Bachelor of Science in Hospitality Management (BSHM)' },
  { value: 'Bachelor of Arts Political Science (BA PolSci)', label: 'Bachelor of Arts Political Science (BA PolSci)' },
  { value: 'Bachelor of Science in Development Communication (BSDevCom)', label: 'Bachelor of Science in Development Communication (BSDevCom)' },
  { value: 'Bachelor of Science in Psychology (BS Psychology)', label: 'Bachelor of Science in Psychology (BS Psychology)' }
];

// View component for the Assign Programs / Employment Reports page.
// This is the JSX that used to live inside AdminDashboard's `case 'employment'`.
export function AssignProgramsView() {
  // We only need the setters here because the UI table was removed per request.
  // Skip the first tuple item to avoid eslint 'no-unused-vars' warnings.
  const [, setPrograms] = useState([]);
  const [, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [programName, setProgramName] = useState('');
  const [programHead, setProgramHead] = useState('');
  const [programHeads, setProgramHeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchPrograms = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/programs/');
      if (!response.ok) throw new Error('Failed to fetch programs');
      const data = await response.json();
      // Deduplicate programs by program_name to avoid showing repeated rows
      if (Array.isArray(data)) {
        const seen = new Set();
        const deduped = [];
        for (const p of data) {
          const name = (p.program_name || '').trim();
          if (!seen.has(name)) {
            seen.add(name);
            deduped.push(p);
          }
        }
        setPrograms(deduped);
      } else {
        setPrograms([]);
      }
    } catch (err) {
      console.error('Error fetching programs:', err);
      setError('Failed to load programs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  // NOTE: Developer helper removed (was used to create a BEED example).

  // Fetch program heads when the form is shown
  useEffect(() => {
    const fetchProgramHeads = async () => {
      if (!showAddForm) return;
      
      setLoading(true);
      setError(null); // Clear any previous errors
      
      try {
        const response = await fetch('/api/program-heads/', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch program heads (${response.status})`);
        }
        
        const data = await response.json();
        // Normalize and filter only approved program heads
        const approvedHeads = Array.isArray(data)
          ? data
              .filter(head => head.status === 'approved')
              .map(head => {
                // handle different possible name fields from API
                const name = head.name || head.first_name || head.given_name || '';
                const surname = head.surname || head.last_name || head.family_name || '';
                return {
                  // keep original id and status
                  id: head.id,
                  status: head.status,
                  // normalized fields
                  name,
                  surname,
                  full_name: `${name}${surname ? ' ' + surname : ''}`.trim(),
                  // include any other useful props
                  email: head.email || head.username || ''
                };
              })
          : [];

        setProgramHeads(approvedHeads);
        if (approvedHeads.length === 0) {
          setError('No approved program heads available.');
        }
      } catch (err) {
        console.error('Error fetching program heads:', err);
        setError('Could not load program heads. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProgramHeads();
  }, [showAddForm]);

  const handleSave = (e) => {
    e && e.preventDefault && e.preventDefault();
    if (!programName || !programHead) {
      setError('Please fill in all fields');
      return;
    }
    setShowConfirmation(true);
  };

  const confirmSave = async () => {
    try {
      const response = await fetch('/api/programs/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          program_name: programName,
          program_head: programHead
        })
      });
      
      if (!response.ok) throw new Error('Failed to save program');
      
      // Refresh the programs list
      await fetchPrograms();

  // Show a transient success message (uses setSuccessMsg to avoid eslint unused-var)
  setSuccessMsg('Program saved successfully.');
  setTimeout(() => setSuccessMsg(null), 4000);
      
      // Clear form and close modals
      setProgramName('');
      setProgramHead('');
      setShowConfirmation(false);
      setShowAddForm(false);
    } catch (err) {
      console.error('Error saving program:', err);
      setError('Failed to save program. Please try again.');
      setShowConfirmation(false);
    }
  };

  const handleCancel = () => {
    setProgramName('');
    setProgramHead('');
    setShowAddForm(false);
  };

  return (
    <div>
      <div style={{ marginTop: 28 }}>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddForm(true)}
          style={{ marginBottom: 12 }}
        >
          Add Programs
        </button>
        {/* Create BEED Example button removed per user request */}
        {successMsg && <div style={{ color: '#0f5132', marginTop: 8 }}>{successMsg}</div>}
      </div>

      {/* Programs Table */}
      <div style={{ 
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflowX: 'auto'
      }}>
        <table style={{ 
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.95rem'
        }}>
          <thead>
            <tr style={{ 
              backgroundColor: '#f8f9fa',
              borderBottom: '2px solid #dee2e6'
            }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Program Name</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Program Head</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {/* Table contents removed per request */}
          </tbody>
        </table>
      </div>

      {showConfirmation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: '#fff',
            padding: 24,
            borderRadius: 8,
            width: '100%',
            maxWidth: 400,
            textAlign: 'center',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
          }}>
            <h4 style={{ marginTop: 0, marginBottom: 16, color: '#1976d2' }}>Confirm Save</h4>
            <p style={{ marginBottom: 24, color: '#666' }}>
              Are you sure you want to save this program assignment?
              <br />
              <strong style={{ color: '#333' }}>{programName}</strong>
              <br />
              Program Head: <strong style={{ color: '#333' }}>
                {programHeads.find(h => h.id === parseInt(programHead))?.name || ''} {programHeads.find(h => h.id === parseInt(programHead))?.surname || ''}
              </strong>
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                type="button"
                className="btn"
                onClick={() => setShowConfirmation(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  backgroundColor: '#fff',
                  color: '#666',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={confirmSave}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: 6,
                  backgroundColor: '#1976d2',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                Confirm Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <>
          {/* Modal overlay */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }} onClick={() => setShowAddForm(false)}>
            {/* Modal content */}
            <div style={{
              background: '#fff',
              padding: 24,
              borderRadius: 8,
              width: '100%',
              maxWidth: 480,
              position: 'relative',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
            }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Add Program</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="btn"
                  style={{ padding: '4px 8px', minWidth: 'auto' }}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSave}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Program Name:</label>
                  <Select
                    value={AVAILABLE_PROGRAMS.find(option => option.value === programName)}
                    onChange={option => setProgramName(option ? option.value : '')}
                    options={AVAILABLE_PROGRAMS}
                    isClearable
                    isSearchable
                    placeholder="Search or select a program"
                    styles={{
                      control: (baseStyles) => ({
                        ...baseStyles,
                        borderColor: '#ddd',
                        borderRadius: 6,
                        minHeight: 42,
                        boxShadow: 'none',
                        '&:hover': {
                          borderColor: '#1976d2'
                        }
                      }),
                      placeholder: (baseStyles) => ({
                        ...baseStyles,
                        color: '#666'
                      }),
                      input: (baseStyles) => ({
                        ...baseStyles,
                        color: '#333'
                      }),
                      option: (baseStyles, { isFocused, isSelected }) => ({
                        ...baseStyles,
                        backgroundColor: isSelected 
                          ? '#1976d2'
                          : isFocused 
                          ? '#e3f2fd'
                          : undefined,
                        color: isSelected ? 'white' : '#333',
                        ':active': {
                          backgroundColor: '#1976d2',
                          color: 'white'
                        }
                      })
                    }}
                  />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Program head to be assign:</label>
                  {loading ? (
                    <div style={{ padding: '8px 0' }}>Loading program heads...</div>
                  ) : error ? (
                    <div style={{ color: '#e53e3e', padding: '8px 0' }}>{error}</div>
                  ) : (
                    <select
                      value={programHead}
                      onChange={e => setProgramHead(e.target.value)}
                      style={{ 
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: '1px solid #ddd',
                        fontSize: '1rem',
                        backgroundColor: '#fff'
                      }}
                    >
                      <option value="">Select a program head</option>
                      {programHeads.map(head => (
                        <option key={head.id} value={head.id}>
                          {head.full_name || `${head.name} ${head.surname}`}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* show a small helper list of approved program heads for quick reference */}
                  {programHeads && programHeads.length > 0 && (
                    <div style={{ marginTop: 8, fontSize: 13, color: '#374151' }}>
                      <strong>Approved Program Heads:</strong>
                      <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {programHeads.map(h => (
                          <div key={h.id} style={{ background: '#eef2ff', padding: '6px 8px', borderRadius: 6, fontSize: 12 }}>
                            {h.full_name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                  <button type="button" className="btn" onClick={handleCancel}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Program
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Reusable sidebar item for the "Assign Programs" section.
// Props:
// - activeSection: current active section string
// - setActiveSection: setter that activates a section
function AssignPrograms({ activeSection, setActiveSection }) {
  const handleActivate = () => {
    // centralize the activation logic here so it can be extended later
    setActiveSection('employment');
  };

  return (
    <button
      onClick={handleActivate}
      style={{
        width: '100%',
        padding: '15px 20px',
        background: activeSection === 'employment' ? '#4CAF50' : 'transparent',
        border: 'none',
        color: 'white',
        textAlign: 'left',
        cursor: 'pointer',
        fontSize: '16px'
      }}
    >
      <span aria-hidden style={{ marginRight: 10, display: 'inline-flex', verticalAlign: 'middle' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M3 5a2 2 0 012-2h14v16a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M7 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="sidebar-item-label">Assign Programs</span>
    </button>
  );
}

export default AssignPrograms;
