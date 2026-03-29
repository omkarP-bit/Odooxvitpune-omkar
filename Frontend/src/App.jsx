import { useState } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import TopBar from './components/common/TopBar';
import EmployeePage from './pages/EmployeePage';
import ManagerPage from './pages/ManagerPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import './index.css';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeRole, setActiveRole] = useState(null);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}>
        Loading...
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const role = (activeRole || user.role || 'EMPLOYEE').toUpperCase();
  switch (role) {
    case 'MANAGER': return <ManagerPage activeRole={role} />;
    case 'ADMIN': return <AdminPage activeRole={role} />;
    default: return <EmployeePage activeRole={role} />;
  }

  return (
    <>
      <TopBar activeRole={role} onRoleChange={setActiveRole} />
      {renderPage()}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
