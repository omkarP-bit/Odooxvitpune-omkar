import { useState, useEffect } from 'react';
import { expenseApi } from '../../api/expenseApi';
import { formatINR, formatDate } from '../../utils/formatters';
import Badge from '../common/Badge';

export default function ExpenseHistory() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    expenseApi
      .getMyExpenses()
      .then((res) => setExpenses(res.data.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = expenses
    .filter((e) => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (e.description || '').toLowerCase().includes(q) ||
          (e.category || '').toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Expense History</h1>
          <p className="page-sub">All submitted reimbursements</p>
        </div>
      </div>

      <div className="searchbar">
        <input
          className="search-input"
          placeholder="Search by description, category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Description</th>
              <th>Category</th>
              <th>Date</th>
              <th>Original</th>
              <th>INR</th>
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
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center" style={{ padding: '24px', color: 'var(--text-muted)' }}>
                  No expenses found
                </td>
              </tr>
            ) : (
              filtered.map((exp) => (
                <tr key={exp.public_id || exp.id}>
                  <td>
                    <strong>{exp.description || '—'}</strong>
                  </td>
                  <td>
                    <span className="badge badge-grey">{exp.category || '—'}</span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{formatDate(exp.date || exp.created_at)}</td>
                  <td className="mono">
                    {exp.currency_original || ''} {exp.amount_original ?? exp.amount}
                  </td>
                  <td className="mono">{formatINR(exp.amount_converted || exp.amount)}</td>
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
