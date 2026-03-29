"use client";
import { useState } from "react";

const CONDITION_TYPES = ["all", "percentage", "specific", "hybrid"];
const ROLE_OPTIONS    = ["manager", "finance", "director", "cfo", "admin"];
const SLA_ACTIONS     = ["escalate", "auto-reject", "reassign", "notify"];

interface Step {
  sequenceNo: number;
  roleSlots: string[];
  conditionType: string;
  percentageThreshold?: number;
  specificApproverRole?: string;
  slaHours: number;
  slaAction: string;
}

const DEFAULT_STEPS: Step[] = [
  { sequenceNo: 1, roleSlots: ["manager"],  conditionType: "all",    slaHours: 24, slaAction: "escalate" },
  { sequenceNo: 2, roleSlots: ["finance"],  conditionType: "all",    slaHours: 24, slaAction: "auto-reject" },
  { sequenceNo: 3, roleSlots: ["director"], conditionType: "hybrid", percentageThreshold: 60, specificApproverRole: "cfo", slaHours: 48, slaAction: "reassign" },
];

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

export default function ApprovalRules() {
  const [steps, setSteps]             = useState<Step[]>(DEFAULT_STEPS);
  const [managerApprover, setManagerApprover] = useState(true);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);

  const addStep = () => setSteps((p) => [...p, { sequenceNo: p.length + 1, roleSlots: ["manager"], conditionType: "all", slaHours: 24, slaAction: "escalate" }]);
  const removeStep = (idx: number) => setSteps((p) => p.filter((_, i) => i !== idx).map((s, i) => ({ ...s, sequenceNo: i + 1 })));
  const updateStep = (idx: number, key: string, value: string | number | string[]) =>
    setSteps((p) => p.map((s, i) => i === idx ? { ...s, [key]: value } : s));

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Approval Rules</h1>
          <p className="page-sub">Configure multi-step approval workflow & SLA</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost" onClick={addStep}>+ Add Step</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Rules"}
          </button>
        </div>
      </div>

      {/* Manager Approver Toggle */}
      <div className="card" style={{ padding: "16px 20px", marginBottom: "16px" }}>
        <div className="toggle-row">
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text)" }}>Is Manager Approver</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
              When enabled, expense is first sent to employee&apos;s direct manager before configured steps.
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={managerApprover}
              onChange={(e) => setManagerApprover(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "var(--cyber)", cursor: "pointer" }}
            />
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: managerApprover ? "var(--cyber)" : "var(--text-muted)" }}>
              {managerApprover ? "Enabled" : "Disabled"}
            </span>
          </label>
        </div>
      </div>

      {/* Approval Flow Visualization */}
      <div className="card" style={{ padding: "20px", marginBottom: "16px" }}>
        <div className="card-title" style={{ marginBottom: "14px" }}>Flow Preview</div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {managerApprover && (
            <>
              <span className="badge badge-cyber">Manager</span>
              <span style={{ color: "var(--text-muted)" }}>→</span>
            </>
          )}
          {steps.map((step, idx) => (
            <span key={idx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="badge badge-cyber">
                Step {step.sequenceNo}: {cap(step.roleSlots[0])}
                {step.conditionType !== "all" && ` (${cap(step.conditionType)})`}
              </span>
              {idx < steps.length - 1 && <span style={{ color: "var(--text-muted)" }}>→</span>}
            </span>
          ))}
          <span style={{ color: "var(--text-muted)" }}>→</span>
          <span className="badge badge-green">✓ Approved</span>
        </div>
      </div>

      {/* Steps */}
      <div className="flow-box">
        {steps.map((step, idx) => (
          <div key={idx} className="flow-row" style={{ flexWrap: "wrap", gap: "10px", padding: "16px" }}>
            <div className="flow-num">{step.sequenceNo}</div>
            <div style={{ flex: 1, minWidth: "140px" }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>Role</div>
              <select className="filter-select" value={step.roleSlots?.[0] ?? "manager"} onChange={(e) => updateStep(idx, "roleSlots", [e.target.value])} style={{ width: "100%" }}>
                {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{cap(r)}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: "120px" }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>Condition</div>
              <select className="filter-select" value={step.conditionType} onChange={(e) => updateStep(idx, "conditionType", e.target.value)} style={{ width: "100%" }}>
                {CONDITION_TYPES.map((c) => <option key={c} value={c}>{cap(c)}</option>)}
              </select>
            </div>
            {(step.conditionType === "percentage" || step.conditionType === "hybrid") && (
              <div style={{ minWidth: "80px" }}>
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>Threshold %</div>
                <input type="number" className="filter-select" value={step.percentageThreshold ?? 60} onChange={(e) => updateStep(idx, "percentageThreshold", parseInt(e.target.value))} style={{ width: "80px", fontWeight: 700 }} />
              </div>
            )}
            {(step.conditionType === "specific" || step.conditionType === "hybrid") && (
              <div style={{ minWidth: "110px" }}>
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>Specific Role</div>
                <select className="filter-select" value={step.specificApproverRole ?? "cfo"} onChange={(e) => updateStep(idx, "specificApproverRole", e.target.value)} style={{ width: "100%" }}>
                  {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{cap(r)}</option>)}
                </select>
              </div>
            )}
            <div style={{ minWidth: "70px" }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>SLA (hrs)</div>
              <input type="number" className="filter-select" value={step.slaHours} onChange={(e) => updateStep(idx, "slaHours", parseInt(e.target.value))} style={{ width: "70px", fontWeight: 700 }} />
            </div>
            <div style={{ minWidth: "110px" }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>On Timeout</div>
              <select className="filter-select" value={step.slaAction} onChange={(e) => updateStep(idx, "slaAction", e.target.value)} style={{ width: "100%" }}>
                {SLA_ACTIONS.map((a) => <option key={a} value={a}>{cap(a)}</option>)}
              </select>
            </div>
            <button className="btn btn-danger btn-xs" onClick={() => removeStep(idx)} style={{ alignSelf: "flex-end", marginBottom: "2px" }}>✕</button>
          </div>
        ))}
        {steps.length === 0 && (
          <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
            No steps configured. Click &quot;Add Step&quot; to begin.
          </div>
        )}
      </div>

      {/* Rule Engine Info */}
      <div className="rule-applied mt-2">
        <div className="rule-applied-title">⚡ Conditional Rule Engine</div>
        <div className="rule-applied-text">
          <strong>All</strong> — every approver must approve &nbsp;|&nbsp;
          <strong>Percentage</strong> — e.g. 60% threshold &nbsp;|&nbsp;
          <strong>Specific</strong> — e.g. CFO auto-approves &nbsp;|&nbsp;
          <strong>Hybrid</strong> — 60% OR CFO (combine both)
        </div>
      </div>

      <div className="callout info mt-1">
        <strong>SLA System:</strong> Each step has a timeout. On expiry: <strong>Escalate</strong> / <strong>Auto-reject</strong> / <strong>Reassign</strong> / <strong>Notify</strong>. Timer is visible to approvers in the approval queue.
      </div>
    </div>
  );
}
