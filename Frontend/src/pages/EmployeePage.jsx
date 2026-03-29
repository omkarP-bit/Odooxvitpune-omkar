import { useState } from 'react';
import Sidebar from '../components/common/Sidebar';
import Dashboard from '../components/employee/Dashboard';
import SubmitExpense from '../components/employee/SubmitExpense';
import ExpenseHistory from '../components/employee/ExpenseHistory';

export default function EmployeePage({ activeRole }) {
  const [tab, setTab] = useState('dash');

  const renderTab = () => {
    switch (tab) {
      case 'submit': return <SubmitExpense onNavigate={setTab} />;
      case 'history': return <ExpenseHistory />;
      default: return <Dashboard onNavigate={setTab} />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activeRole={activeRole} activeTab={tab} onTabChange={setTab} />
      <main className="main-content">{renderTab()}</main>
    </div>
  );
}
