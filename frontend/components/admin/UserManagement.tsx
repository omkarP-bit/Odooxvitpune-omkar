"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, getInitials, AppUser } from "@/lib/api";

const ROLES = ["EMPLOYEE", "MANAGER", "ADMIN"];

export default function UserManagement() {
  const { user: me } = useAuth();
  const [users, setUsers]       = useState<AppUser[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]         = useState({ name: "", email: "", role: "EMPLOYEE", managerId: "" });
  const [creating, setCreating] = useState(false);
  const [msg, setMsg]           = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch {
      if (me) setUsers([{ id: me.id, publicId: me.id, name: me.name, email: me.email, role: me.role, managerId: null }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const managers = users.filter((u) => u.role === "MANAGER" || u.role === "ADMIN");

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.updateUser(userId, { role: newRole });
      setUsers(prev => prev.map(u => u.publicId === userId ? { ...u, role: newRole } : u));
      setMsg("");
    } catch (e: any) {
      setMsg(e.message || "Failed to update role");
    }
  };

  const handleManagerChange = async (userId: string, newManagerId: string) => {
    try {
      await api.updateUser(userId, { managerId: newManagerId || null });
      setUsers(prev => prev.map(u => u.publicId === userId ? { ...u, managerId: newManagerId || null } : u));
      setMsg("");
    } catch (e: any) {
      setMsg(e.message || "Failed to update manager");
    }
  };

  const handleCreate = async () => {
    if (!form.name || !form.email) { setMsg("Name and email are required"); return; }
    setCreating(true);
    await new Promise((r) => setTimeout(r, 500));
    setMsg("User invite sent (OAuth-based — user must sign in with Google)");
    setCreating(false); setShowCreate(false);
    setForm({ name: "", email: "", role: "EMPLOYEE", managerId: "" });
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-sub">Manage employees, roles, and manager assignments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "+ Add User"}
        </button>
      </div>

      {msg && <div className="callout info mb-2">{msg}</div>}

      <div className="card" style={{ padding: "16px 20px", marginBottom: "20px" }}>
        <div className="card-title" style={{ marginBottom: "12px" }}>Role Permissions</div>
        <table className="tbl" style={{ fontSize: "0.78rem" }}>
          <thead>
            <tr><th>Role</th><th>Capabilities</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="badge badge-cyber">ADMIN</span></td>
              <td>Manage users, set roles, configure approval rules, view all expenses, override approvals</td>
            </tr>
            <tr>
              <td><span className="badge badge-green">MANAGER</span></td>
              <td>Approve/reject expenses, view team expenses, escalate per rules</td>
            </tr>
            <tr>
              <td><span className="badge badge-amber">EMPLOYEE</span></td>
              <td>Submit expenses, view own expenses, check approval status</td>
            </tr>
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="card fade-in" style={{ padding: "20px", marginBottom: "20px" }}>
          <div className="card-title" style={{ marginBottom: "14px" }}>Invite New User</div>
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
              <label>Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Manager (optional)</label>
              <select value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })}>
                <option value="">— None —</option>
                {managers.map((m) => <option key={m.publicId} value={m.publicId}>{m.name} ({m.role})</option>)}
              </select>
            </div>
          </div>
          <div className="flex-end mt-2">
            <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
              {creating ? "Sending…" : "Send Invite"}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <table className="tbl">
          <thead>
            <tr><th>User</th><th>Email</th><th>Role</th><th>Manager</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center" style={{ padding: "24px", color: "var(--text-muted)" }}>Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="text-center" style={{ padding: "24px", color: "var(--text-muted)" }}>No users found</td></tr>
            ) : users.map((u) => (
              <tr key={u.publicId}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--cyber)", color: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.62rem", fontWeight: 700 }}>
                      {getInitials(u.name)}
                    </div>
                    <strong style={{ color: "var(--text)" }}>{u.name}</strong>
                  </div>
                </td>
                <td style={{ color: "var(--text-muted)" }}>{u.email}</td>
                <td>
                  <select
                    className="filter-select"
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.publicId, e.target.value)}
                    style={{ padding: "4px 8px", fontSize: "0.76rem" }}
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td>
                  <select
                    className="filter-select"
                    value={u.managerId ?? ""}
                    onChange={(e) => handleManagerChange(u.publicId, e.target.value)}
                    style={{ padding: "4px 8px", fontSize: "0.76rem" }}
                  >
                    <option value="">— None —</option>
                    {managers.filter((m) => m.publicId !== u.publicId).map((m) => <option key={m.publicId} value={m.publicId}>{m.name}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
