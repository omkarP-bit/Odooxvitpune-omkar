import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/expenseApi';
import { getInitials, capitalize } from '../../utils/formatters';

const ROLES = ['employee', 'manager', 'finance', 'director', 'cfo'];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee', managerId: '' });

  const fetchUsers = () => {
    setLoading(true);
    authApi
      .getUsers()
      .then((res) => setUsers(res.data.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error('Name, email, and password are required');
      return;
    }
    setCreating(true);
    try {
      await authApi.createUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        managerId: form.managerId || undefined,
      });
      toast.success('User created!');
      setShowCreate(false);
      setForm({ name: '', email: '', password: '', role: 'employee', managerId: '' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await authApi.changeRole(userId, newRole);
      toast.success('Role updated');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update role');
    }
  };

  const managers = users.filter((u) => u.role === 'manager' || u.role === 'admin');

  const handleManagerAssign = async (userId, managerId) => {
    try {
      await authApi.assignManager(userId, managerId);
      toast.success('Manager assigned');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to assign manager');
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-sub">Manage employees, roles, and manager assignments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {/* Create User Form */}
      {showCreate && (
        <div className="card fade-in" style={{ padding: '20px', marginBottom: '20px' }}>
          <div className="card-title" style={{ marginBottom: '14px' }}>Create New User</div>
          <div className="form-grid">
            <div className="form-group">
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@company.com" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => <option key={r} value={r}>{capitalize(r)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Manager (optional)</label>
              <select value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })}>
                <option value="">— None —</option>
                {managers.map((m) => (
                  <option key={m.public_id || m.id} value={m.public_id || m.id}>{m.name} ({m.role})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex-end mt-2">
            <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Manager</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="text-center" style={{ padding: '24px', color: 'var(--text-muted)' }}>
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center" style={{ padding: '24px', color: 'var(--text-muted)' }}>
                  No users found
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.public_id || u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '30px', height: '30px', borderRadius: '8px',
                          background: u.role === 'admin' ? 'var(--slate-900)' : u.role === 'manager' ? 'var(--slate-700)' : 'var(--coral-500)',
                          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 700,
                        }}
                      >
                        {getInitials(u.name)}
                      </div>
                      <strong>{u.name}</strong>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                  <td>
                    <select
                      className="filter-select"
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.public_id || u.id, e.target.value)}
                      style={{ padding: '4px 8px', fontSize: '0.76rem' }}
                    >
                      {['admin', ...ROLES].map((r) => (
                        <option key={r} value={r}>{capitalize(r)}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="filter-select"
                      value={u.manager_id || u.managerId || ''}
                      onChange={(e) => handleManagerAssign(u.public_id || u.id, e.target.value)}
                      style={{ padding: '4px 8px', fontSize: '0.76rem' }}
                    >
                      <option value="">— None —</option>
                      {managers.filter((m) => (m.public_id || m.id) !== (u.public_id || u.id)).map((m) => (
                        <option key={m.public_id || m.id} value={m.public_id || m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
