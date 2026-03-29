import { useState, useEffect } from 'react';
import { expenseApi } from '../../api/expenseApi';
import { formatINR, formatDate } from '../../utils/formatters';
import Badge from '../common/Badge';

export default function AllExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    expenseApi
      .getMyExpenses()
      .then((res) => setExpenses(res.data.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">All Expenses</h1>
          <p className="page-sub">Company-wide expense ledger</p>
        </div>
      </div>

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount (INR)</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center" style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading...</td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center" style={{ padding: '24px', color: 'var(--text-muted)' }}>No expenses found</td>
              </tr>
            ) : (
              expenses.map((exp) => (
                <tr key={exp.public_id || exp.id}>
                  <td><strong>{exp.user_name || exp.employee_name || '—'}</strong></td>
                  <td>{exp.description || '—'}</td>
                  <td><span className="badge badge-grey">{exp.category || '—'}</span></td>
                  <td className="mono">{formatINR(exp.amount_converted || exp.amount)}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{formatDate(exp.date || exp.created_at)}</td>
                  <td><Badge status={exp.status} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
