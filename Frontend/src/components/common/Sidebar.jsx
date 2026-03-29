import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/formatters';

const NAV_ITEMS = {
  employee: [
    { key: 'dash', label: 'Overview', icon: 'grid' },
    { key: 'submit', label: 'New Expense', icon: 'plus' },
    { key: 'history', label: 'My Expenses', icon: 'file', badge: null },
  ],
  manager: [
    { key: 'queue', label: 'Pending Approvals', icon: 'inbox', badge: null },
    { key: 'history', label: 'My Expenses', icon: 'file' },
  ],
  admin: [
    { key: 'users', label: 'User Management', icon: 'users' },
    { key: 'rules', label: 'Approval Rules', icon: 'settings' },
    { key: 'expenses', label: 'All Expenses', icon: 'list' },
  ],
};

const ICONS = {
  grid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14m-7-7h14" />
    </svg>
  ),
  file: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  inbox: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
};

const ROLE_LABELS = {
  employee: 'Employee',
  manager: 'Manager',
  admin: 'Admin',
  finance: 'Finance',
  director: 'Director',
  cfo: 'CFO',
};

export default function Sidebar({ activeRole, activeTab, onTabChange }) {
  const { user } = useAuth();
  const role = activeRole || user?.role || 'employee';
  const items = NAV_ITEMS[role] || NAV_ITEMS.employee;
  const avatarClass = role === 'manager' ? 'mgr' : role === 'admin' ? 'adm' : 'emp';
  const chipClass = role === 'manager' ? 'chip-mgr' : role === 'admin' ? 'chip-adm' : 'chip-emp';

  return (
    <aside className="sidebar">
      <div className="sb-head">
        <div className="sb-company">{user?.companyName || 'Company'}</div>
        <div className="sb-user">
          <div className={`sb-avatar ${avatarClass}`}>{getInitials(user?.name)}</div>
          <div>
            <div className="sb-uname">{user?.name || 'User'}</div>
            <div className={`sb-role-chip ${chipClass}`}>{ROLE_LABELS[role] || role}</div>
          </div>
        </div>
      </div>
      <nav className="sb-nav">
        <div className="sb-section">Main</div>
        {items.map((item) => (
          <button
            key={item.key}
            className={`sb-link ${activeTab === item.key ? 'active' : ''}`}
            onClick={() => onTabChange(item.key)}
          >
            {ICONS[item.icon]}
            {item.label}
            {item.badge != null && <span className="sb-badge">{item.badge}</span>}
          </button>
        ))}
      </nav>
      <div className="sb-footer">
        <div className="sb-currency">
          Currency <span>₹ INR</span>
        </div>
      </div>
    </aside>
  );
}
