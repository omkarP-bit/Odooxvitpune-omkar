import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { approvalApi } from '../../api/expenseApi';
import { formatINR, formatDate } from '../../utils/formatters';
import Badge from '../common/Badge';

export default function ReviewQueue() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState('');
  const [deciding, setDeciding] = useState(false);

  const fetchPending = () => {
    setLoading(true);
    approvalApi
      .getPending()
      .then((res) => setPending(res.data.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPending(); }, []);

  const handleDecision = async (expenseId, decision) => {
    setDeciding(true);
    try {
      await approvalApi.decide(expenseId, decision, comment);
      toast.success(`Expense ${decision}`);
      setSelected(null);
      setComment('');
      fetchPending();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || `Failed to ${decision}`);
    } finally {
      setDeciding(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pending Approvals</h1>
          <p className="page-sub">{pending.length} expense{pending.length !== 1 ? 's' : ''} awaiting your review</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 340px' : '1fr', gap: '20px' }}>
        {/* Table */}
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
                  <td colSpan="6" className="text-center" style={{ padding: '24px', color: 'var(--text-muted)' }}>
                    Loading...
                  </td>
                </tr>
              ) : pending.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center" style={{ padding: '24px', color: 'var(--text-muted)' }}>
                    🎉 No pending approvals — you're all caught up!
                  </td>
                </tr>
              ) : (
                pending.map((exp) => (
                  <tr
                    key={exp.public_id || exp.id}
                    style={{ cursor: 'pointer', background: selected?.public_id === exp.public_id ? 'var(--coral-50)' : undefined }}
                    onClick={() => setSelected(exp)}
                  >
                    <td><strong>{exp.user_name || exp.employee_name || '—'}</strong></td>
                    <td>{exp.description || '—'}</td>
                    <td><span className="badge badge-grey">{exp.category || '—'}</span></td>
                    <td className="mono">{formatINR(exp.amount_converted || exp.amount)}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(exp.date || exp.created_at)}</td>
                    <td><Badge status="pending" /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="card slide-in" style={{ padding: '22px', alignSelf: 'start', position: 'sticky', top: '72px' }}>
            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {selected.category || 'Expense'}
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
                {selected.description || '—'}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', fontWeight: 600, color: 'var(--coral-500)', letterSpacing: '-1px' }}>
                {formatINR(selected.amount_converted || selected.amount)}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                By {selected.user_name || selected.employee_name || '—'} · {formatDate(selected.date || selected.created_at)}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label>Comment (optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a note..."
                style={{ minHeight: '60px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                className="btn btn-success"
                disabled={deciding}
                onClick={() => handleDecision(selected.public_id || selected.id, 'approved')}
                style={{ justifyContent: 'center' }}
              >
                ✓ Approve
              </button>
              <button
                className="btn btn-danger"
                disabled={deciding}
                onClick={() => handleDecision(selected.public_id || selected.id, 'rejected')}
                style={{ justifyContent: 'center' }}
              >
                ✕ Reject
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
