import { useState } from 'react';
import Sidebar from '../components/common/Sidebar';
import ReviewQueue from '../components/manager/ReviewQueue';
import ExpenseHistory from '../components/employee/ExpenseHistory';

export default function ManagerPage({ activeRole }) {
  const [tab, setTab] = useState('queue');

  const renderTab = () => {
    switch (tab) {
      case 'history': return <ExpenseHistory />;
      default: return <ReviewQueue />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activeRole={activeRole} activeTab={tab} onTabChange={setTab} />
      <main className="main-content">{renderTab()}</main>
    </div>
  );
}
