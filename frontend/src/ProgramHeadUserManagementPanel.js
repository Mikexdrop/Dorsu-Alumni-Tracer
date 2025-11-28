import React from 'react';

// ProgramHeadUserManagementPanel: a focused user-management UI for Program Head role
// This is adapted from UserManagementPanel but defaults to showing only program_head users
// and exposes the same handler props (handleCreateUser, handleUpdateUser, handleDeleteUser, fetchUsers, etc.).

function ProgramHeadUserManagementPanel({
  error, setError, loading, setLoading,
  username, setUsername, password, setPassword,
  userType, setUserType,
  showCreateForm, setShowCreateForm,
  editingUser, setEditingUser,
  handleCreateUser, handleUpdateUser, handleDeleteUser,
  fetchUsers, startEdit, cancelEdit,
  users, setUsers, viewUserToOpen
}) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [viewUser, setViewUser] = React.useState(null);
  const [rowLoading, setRowLoading] = React.useState({});
  const [confirmDialog, setConfirmDialog] = React.useState({ open: false, title: '', message: '', onConfirm: null });
  const [fullImageSrc, setFullImageSrc] = React.useState(null);

  // Ensure we operate on program_head users (implicit in filtering below)

  React.useEffect(() => {
    try { console.debug && console.debug('ProgramHeadUserManagementPanel: received users prop', users); } catch (_) {}
  }, [users]);

  React.useEffect(() => {
    if (!viewUserToOpen) return;
    try {
      const { username: uName, email: uEmail } = viewUserToOpen || {};
      if (!uName && !uEmail) return;
      const found = (users || []).find(u => u && ((u.username && u.username === uName) || (u.email && u.email === uEmail)));
      if (found) setViewUser(found);
      else setError && setError('Could not locate the requested user.');
    } catch (e) {
      console.error('ProgramHeadUserManagementPanel: viewUserToOpen handling failed', e);
    }
  }, [viewUserToOpen, users, setError]);

  // Provide fallback fetch for program heads if parent didn't supply users
  React.useEffect(() => {
    let aborted = false;
    const controller = new AbortController();
    const hasProgramHeads = Array.isArray(users) && users.some(u => u && (u.user_type === 'program_head' || (u.user_type || '').toLowerCase() === 'program_head'));
    if (hasProgramHeads) return undefined;

    async function fetchFallback() {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/program-heads/', { signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json();
        if (aborted) return;
        const normalized = (Array.isArray(data) ? data : []).map(item => ({
          id: item.id ?? item.pk ?? null,
          username: item.username ?? item.user_name ?? item.email ?? '',
          email: item.email ?? '',
          full_name: item.full_name ?? item.name ?? '',
          program_course: item.program ?? item.program_course ?? '',
          user_type: 'program_head',
          status: item.status ?? item.user_status ?? 'pending',
          ...item
        }));
        if (normalized.length && typeof setUsers === 'function') {
          setUsers(prev => {
            const existingIds = new Set((prev || []).map(u => u && u.id));
            const merged = [...(prev || [])];
            normalized.forEach(n => { if (!existingIds.has(n.id)) merged.push(n); });
            return merged;
          });
        }
      } catch (err) {
        if (err && err.name === 'AbortError') return;
        console.error('ProgramHeadUserManagementPanel: fallback fetch failed', err);
      }
    }

    if (typeof setUsers === 'function') fetchFallback();
    return () => { aborted = true; controller.abort(); };
  }, [users, setUsers]);

  // Helpers
  const openConfirm = (message, onConfirm, title = 'Confirm') => setConfirmDialog({ open: true, title, message, onConfirm });
  const closeConfirm = () => setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });

  const filteredUsers = (users || []).filter(u => u && (u.user_type === 'program_head' || (u.user_type || '').toLowerCase() === 'program_head') && ((searchQuery || '').trim() === '' || (u.username || '').toLowerCase().includes((searchQuery || '').trim().toLowerCase()) || (u.full_name || '').toLowerCase().includes((searchQuery || '').trim().toLowerCase())));

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f7', padding: 24 }}>
      <style>{`
        .user-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
        .user-table th { padding: 12px 16px; font-size: 13px; font-weight: 600; color: #1e293b; text-align: left; border-bottom: 2px solid #e2e8f0; background: linear-gradient(to bottom, #f8fafc, #f1f5f9); }
        .user-table td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #334155; }
      `}</style>

      <div style={{ display: 'flex', gap: 12, marginBottom: 18, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ fontWeight: 700 }}>Program Heads</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setShowCreateForm(true)} className="btn btn-primary">+ Add Program Head</button>
          <button onClick={async () => { try { if (typeof setLoading === 'function') setLoading(true); if (typeof fetchUsers === 'function') await fetchUsers(); } catch (e) { console.error(e); setError && setError('Failed to refresh users'); } finally { if (typeof setLoading === 'function') setLoading(false); } }} className="btn btn-outline">Refresh</button>
          <input type="text" placeholder="Search username or name" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc', width: 260 }} />
          <button onClick={() => setSearchQuery('')} className="btn btn-outline">Clear</button>
        </div>
      </div>

      <div style={{ background: 'linear-gradient(to bottom, #ffffff, #f8fafc)', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: 18 }}>
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Full Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>{u.full_name}</td>
                <td>
                  <select value={u.status || 'pending'} onChange={async (e) => {
                    const newStatus = e.target.value;
                    setRowLoading(prev => ({ ...prev, [u.id]: true }));
                    const prevStatus = u.status;
                    if (typeof setUsers === 'function') setUsers(prev => (prev || []).map(x => x.id === u.id ? { ...x, status: newStatus } : x));
                    try { if (typeof handleUpdateUser === 'function') await handleUpdateUser(u.id, { status: newStatus }, undefined, fetchUsers, setError, 'program_head'); } catch (err) { console.error(err); if (typeof setUsers === 'function') setUsers(prev => (prev || []).map(x => x.id === u.id ? { ...x, status: prevStatus } : x)); setError && setError('Failed to update status'); } finally { setRowLoading(prev => ({ ...prev, [u.id]: false })); }
                  }} className="status-select" disabled={!!rowLoading[u.id]}>
                    <option value="pending">pending</option>
                    <option value="approved">approved</option>
                    <option value="reject">reject</option>
                  </select>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setViewUser(u)} className="btn btn-outline">View</button>
                    {typeof handleDeleteUser === 'function' && (
                      <button onClick={(e) => {
                        e && e.stopPropagation && e.stopPropagation();
                        openConfirm('Are you sure you want to delete this user?', async () => {
                          try {
                            await handleDeleteUser(u.id, fetchUsers, setError);
                            if (typeof setUsers === 'function') setUsers(prev => (prev || []).filter(x => x && x.id !== u.id));
                          } catch (err) {
                            console.error('ProgramHeadUserManagementPanel: failed to delete user', err);
                            setError && setError('Failed to delete user');
                          } finally {
                            closeConfirm();
                          }
                        }, 'Delete user');
                      }} className="btn btn-danger">Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View modal */}
      {viewUser && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', padding: 20, borderRadius: 12, maxWidth: 880, width: '95%', maxHeight: '90%', overflow: 'auto' }}>
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ width: 180, textAlign: 'center' }}>
                {(viewUser.image || viewUser.avatar_url) ? (
                  <img src={viewUser.image || viewUser.avatar_url} alt="avatar" style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover' }} onClick={() => setFullImageSrc(viewUser.image || viewUser.avatar_url)} />
                ) : (
                  <div style={{ width: 120, height: 120, borderRadius: '50%', background: '#eef6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>{(viewUser.full_name || '').split(' ').map(n => n[0]).slice(0,2).join('')}</div>
                )}
                <div style={{ fontWeight: 700, marginTop: 8 }}>{viewUser.full_name || viewUser.username}</div>
                <div style={{ color: '#6b7280', fontSize: 13 }}>{viewUser.email || ''}</div>
              </div>

              <div style={{ flex: 1 }}>
                <h2 style={{ marginTop: 0 }}>User Details</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ color: '#6b7280', fontSize: 12 }}>Username</div>
                    <div style={{ fontWeight: 600 }}>{viewUser.username}</div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', fontSize: 12 }}>Email</div>
                    <div>{viewUser.email || '-'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', fontSize: 12 }}>Status</div>
                    <div style={{ display: 'inline-block', padding: '6px 10px', borderRadius: 8, background: viewUser.status === 'approved' ? '#ecfdf5' : viewUser.status === 'reject' ? '#fff1f2' : '#f8fafc', color: viewUser.status === 'approved' ? '#059669' : viewUser.status === 'reject' ? '#ef4444' : '#374151', fontWeight: 700 }}>{viewUser.status || 'pending'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', fontSize: 12 }}>User type</div>
                    <div>{viewUser.user_type || '-'}</div>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  {Object.keys(viewUser || {}).filter(k => !['password', 'id', 'username', 'email', 'full_name', 'user_type', 'program_course', 'status'].includes(k)).map(k => (
                    <div key={k} style={{ display: 'flex', gap: 12, padding: '6px 0', alignItems: 'center', borderTop: '1px solid #f3f4f6' }}>
                      <div style={{ minWidth: 160, color: '#6b7280', fontSize: 12 }}>{k.replace(/_/g, ' ')}</div>
                      <div style={{ flex: 1 }}>{String(viewUser[k] ?? '')}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                  <button onClick={() => { if (typeof startEdit === 'function') startEdit(viewUser, setEditingUser, setUsername, setUserType); setViewUser(null); }} className="btn btn-primary">Edit</button>
                  <button onClick={() => setViewUser(null)} className="btn btn-outline">Close</button>
                </div>
              </div>
            </div>

            {fullImageSrc && (
              <div onClick={() => setFullImageSrc(null)} style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                <img src={fullImageSrc} alt="full" style={{ maxWidth: '95%', maxHeight: '95%' }} />
                <button onClick={() => setFullImageSrc(null)} className="btn btn-outline" style={{ position: 'fixed', right: 24, top: 24 }}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      {confirmDialog.open && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1400 }}>
          <div style={{ width: 420, maxWidth: '95%', background: '#fff', borderRadius: 10, boxShadow: '0 12px 40px rgba(2,6,23,0.35)', padding: 18 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{confirmDialog.title}</div>
            <div style={{ fontSize: 14, color: '#111827', padding: '12px 0', minHeight: 50 }}>{confirmDialog.message}</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8 }}>
              <button onClick={() => { if (typeof confirmDialog.onConfirm === 'function') confirmDialog.onConfirm(); }} className="btn btn-primary">Yes</button>
              <button onClick={() => { closeConfirm(); }} className="btn btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ProgramHeadUserManagementPanel;
