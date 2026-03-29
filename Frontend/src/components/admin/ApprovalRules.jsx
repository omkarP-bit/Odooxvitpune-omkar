import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { approvalApi } from '../../api/expenseApi';
import { capitalize } from '../../utils/formatters';

const CONDITION_TYPES = ['all', 'percentage', 'specific', 'hybrid'];
const ROLE_OPTIONS = ['manager', 'finance', 'director', 'cfo', 'admin'];

export default function ApprovalRules() {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    approvalApi
      .getRules()
      .then((res) => {
        const data = res.data.data || res.data;
        if (data?.steps) setSteps(data.steps);
        else if (Array.isArray(data)) setSteps(data);
      })
      .catch(() => {
        // Default steps if none configured
        setSteps([
          { sequenceNo: 1, roleSlots: ['manager'], conditionType: 'all', slaHours: 24 },
          { sequenceNo: 2, roleSlots: ['finance'], conditionType: 'all', slaHours: 24 },
          { sequenceNo: 3, roleSlots: ['director'], conditionType: 'hybrid', percentageThreshold: 60, specificApproverRole: 'cfo', slaHours: 24 },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      { sequenceNo: prev.length + 1, roleSlots: ['manager'], conditionType: 'all', slaHours: 24 },
    ]);
  };

  const removeStep = (idx) => {
    setSteps((prev) => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, sequenceNo: i + 1 })));
  };

  const updateStep = (idx, key, value) => {
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, [key]: value } : s)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await approvalApi.setRules({ steps });
      toast.success('Approval rules saved!');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save rules');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Approval Rules</h1>
          <p className="page-sub">Configure multi-step approval workflow</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost" onClick={addStep}>+ Add Step</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Rules'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <div className="flow-box">
          {steps.map((step, idx) => (
            <div key={idx} className="flow-row" style={{ flexWrap: 'wrap', gap: '10px', padding: '16px' }}>
              <div className="flow-num">{step.sequenceNo}</div>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Role</div>
                <select
                  className="filter-select"
                  value={step.roleSlots?.[0] || 'manager'}
                  onChange={(e) => updateStep(idx, 'roleSlots', [e.target.value])}
                  style={{ width: '100%' }}
                >
                  {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{capitalize(r)}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Condition</div>
                <select
                  className="filter-select"
                  value={step.conditionType}
                  onChange={(e) => updateStep(idx, 'conditionType', e.target.value)}
                  style={{ width: '100%' }}
                >
                  {CONDITION_TYPES.map((c) => <option key={c} value={c}>{capitalize(c)}</option>)}
                </select>
              </div>
              {(step.conditionType === 'percentage' || step.conditionType === 'hybrid') && (
                <div style={{ minWidth: '80px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Threshold %</div>
                  <input
                    type="number"
                    className="filter-select"
                    value={step.percentageThreshold || 60}
                    onChange={(e) => updateStep(idx, 'percentageThreshold', parseInt(e.target.value))}
                    style={{ width: '80px', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              )}
              {(step.conditionType === 'specific' || step.conditionType === 'hybrid') && (
                <div style={{ minWidth: '120px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Specific Role</div>
                  <select
                    className="filter-select"
                    value={step.specificApproverRole || 'cfo'}
                    onChange={(e) => updateStep(idx, 'specificApproverRole', e.target.value)}
                    style={{ width: '100%' }}
                  >
                    {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{capitalize(r)}</option>)}
                  </select>
                </div>
              )}
              <div style={{ minWidth: '70px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>SLA (hrs)</div>
                <input
                  type="number"
                  className="filter-select"
                  value={step.slaHours || 24}
                  onChange={(e) => updateStep(idx, 'slaHours', parseInt(e.target.value))}
                  style={{ width: '70px', fontFamily: 'var(--font-mono)' }}
                />
              </div>
              <button
                className="btn btn-danger btn-xs"
                onClick={() => removeStep(idx)}
                style={{ alignSelf: 'flex-end', marginBottom: '2px' }}
              >
                ✕
              </button>
            </div>
          ))}
          {steps.length === 0 && (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No steps configured. Click "Add Step" to begin.
            </div>
          )}
        </div>
      )}

      <div className="callout info mt-2">
        <strong>Condition types:</strong> All (everyone must approve), Percentage (threshold% must approve),
        Specific (one specific role), Hybrid (percentage OR specific role).
      </div>
    </div>
  );
}
