import { useState, useEffect } from 'react';
import { expenseApi } from '../../api/expenseApi';
import { formatINR, formatDate } from '../../utils/formatters';
import Badge from '../common/Badge';

export default function Dashboard({ onNavigate }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    expenseApi
      .getMyExpenses()
      .then((res) => setExpenses(res.data.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const approved = expenses.filter((e) => e.status === 'approved');
  const pending = expenses.filter((e) => e.status === 'pending');
  const rejected = expenses.filter((e) => e.status === 'rejected');
  const totalConverted = expenses.reduce((s, e) => s + (e.amount_converted || e.amount || 0), 0);
  const approvedTotal = approved.reduce((s, e) => s + (e.amount_converted || e.amount || 0), 0);
  const pendingTotal = pending.reduce((s, e) => s + (e.amount_converted || e.amount || 0), 0);
  const rejectedTotal = rejected.reduce((s, e) => s + (e.amount_converted || e.amount || 0), 0);

  const recent = [...expenses].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Dashboard</h1>
          <p className="page-sub">
            {pending.length > 0
              ? `You have ${pending.length} expense${pending.length > 1 ? 's' : ''} awaiting approval`
              : 'All caught up!'}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => onNavigate('submit')}>
            + New Expense
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card featured">
          <div className="stat-card-decor" />
          <div className="stat-label">Total Submitted</div>
          <div className="stat-value">{loading ? '...' : formatINR(totalConverted)}</div>
          <div className="stat-delta">
            <span>{expenses.length}</span> total expenses
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-decor" />
          <div className="stat-label">Approved</div>
          <div className="stat-value">{loading ? '...' : formatINR(approvedTotal)}</div>
          <div className="stat-delta">
            <span className="delta-up">{approved.length}</span> expenses cleared
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-decor" />
          <div className="stat-label">Pending</div>
          <div className="stat-value">{loading ? '...' : formatINR(pendingTotal)}</div>
          <div className="stat-delta">
            <span style={{ color: 'var(--amber-600)', fontWeight: 700 }}>{pending.length}</span> in review
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-decor" />
          <div className="stat-label">Rejected</div>
          <div className="stat-value">{loading ? '...' : formatINR(rejectedTotal)}</div>
          <div className="stat-delta">
            <span className="delta-down">{rejected.length}</span> declined
          </div>
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Recent Expenses</div>
            <div className="card-sub">Showing last 5 submissions</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('history')}>
            View all
          </button>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
              <th>INR</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center" style={{ padding: '24px', color: 'var(--text-muted)' }}>
                  Loading...
                </td>
              </tr>
            ) : recent.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center" style={{ padding: '24px', color: 'var(--text-muted)' }}>
                  No expenses yet. Submit your first one!
                </td>
              </tr>
            ) : (
              recent.map((exp) => (
                <tr key={exp.public_id || exp.id}>
                  <td>
                    <strong>{exp.description || '—'}</strong>
                  </td>
                  <td>
                    <span className="badge badge-grey">{exp.category || '—'}</span>
                  </td>
                  <td className="mono">
                    {exp.currency_original || '₹'}
                    {exp.amount_original ?? exp.amount}
                  </td>
                  <td className="mono">{formatINR(exp.amount_converted || exp.amount)}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{formatDate(exp.date || exp.created_at)}</td>
                  <td>
                    <Badge status={exp.status} />
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
