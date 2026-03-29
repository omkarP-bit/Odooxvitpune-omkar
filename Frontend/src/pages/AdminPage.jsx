import { useState } from 'react';
import Sidebar from '../components/common/Sidebar';
import UserManagement from '../components/admin/UserManagement';
import ApprovalRules from '../components/admin/ApprovalRules';
import AllExpenses from '../components/admin/AllExpenses';

export default function AdminPage({ activeRole }) {
  const [tab, setTab] = useState('users');

  const renderTab = () => {
    switch (tab) {
      case 'rules': return <ApprovalRules />;
      case 'expenses': return <AllExpenses />;
      default: return <UserManagement />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activeRole={activeRole} activeTab={tab} onTabChange={setTab} />
      <main className="main-content">{renderTab()}</main>
    </div>
  );
}
