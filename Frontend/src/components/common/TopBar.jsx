import { useAuth } from '../../context/AuthContext';

export default function TopBar({ activeRole, onRoleChange }) {
  const { logout } = useAuth();
  const roles = ['employee', 'manager', 'admin'];

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="brand-dot" />
        ReimburseFlow
      </div>
      <div className="topbar-tabs">
        {roles.map((r) => (
          <button
            key={r}
            className={`topbar-tab ${activeRole === r ? 'active' : ''}`}
            onClick={() => onRoleChange(r)}
          >
            {r === 'employee' ? '👤 ' : r === 'manager' ? '🗂 ' : '⚙️ '}
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>
      <button className="btn btn-ghost btn-xs" style={{ color: '#94A3B8', borderColor: '#334155' }} onClick={logout}>
        Log out
      </button>
    </header>
  );
}
