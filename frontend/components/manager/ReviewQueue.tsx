"use client";
import { useEffect, useState, useCallback } from "react";
import { api, Approval, fmtDate, slaRemaining } from "@/lib/api";
import Badge from "@/components/Badge";

export default function ReviewQueue({ onCountChange }: { onCountChange?: (n: number) => void }) {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<Approval | null>(null);
  const [comment, setComment]     = useState("");
  const [deciding, setDeciding]   = useState(false);
  const [decideError, setDecideError] = useState("");

  const fetchPending = useCallback(() => {
    setLoading(true);
    api.getApprovals({ status: "PENDING", limit: 50 })
      .then((r) => { setApprovals(r.approvals); onCountChange?.(r.approvals.length); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [onCountChange]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleDecision = async (decision: "APPROVED" | "REJECTED") => {
    if (!selected) return;
    setDeciding(true); setDecideError("");
    try {
      await api.decide(selected.publicId, decision, comment || undefined);
      setSelected(null); setComment("");
      fetchPending();
    } catch (err: unknown) {
      setDecideError(err instanceof Error ? err.message : `Failed to ${decision.toLowerCase()}`);
    } finally {
      setDeciding(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Approval Queue</h1>
          <p className="page-sub">{approvals.length} expense{approvals.length !== 1 ? "s" : ""} awaiting your review</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "1fr", gap: "16px" }}>
        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th>Employee</th><th>Description</th><th>Category</th><th>Amount</th><th>SLA</th><th>Step</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center" style={{ padding: "24px", color: "var(--text-muted)" }}>Loading...</td></tr>
              ) : approvals.length === 0 ? (
                <tr><td colSpan={7} className="text-center" style={{ padding: "24px", color: "var(--text-muted)" }}>🎉 No pending approvals</td></tr>
              ) : approvals.map((a) => {
                const isSelected = selected?.publicId === a.publicId;
                const sla = a.slaDeadline ? slaRemaining(a.slaDeadline) : null;
                return (
                  <tr
                    key={a.publicId}
                    style={{ cursor: "pointer", background: isSelected ? "rgba(253,224,71,0.04)" : undefined }}
                    onClick={() => { setSelected(isSelected ? null : a); setComment(""); setDecideError(""); }}
                  >
                    <td style={{ color: "var(--text)", fontWeight: 600 }}>{a.expense?.user?.name ?? "—"}</td>
                    <td>{a.expense?.description || a.expense?.vendor || "—"}</td>
                    <td><span className="badge badge-grey">{a.expense?.category ?? "—"}</span></td>
                    <td className="mono" style={{ color: "var(--cyber)" }}>
                      {a.expense?.amountConverted
                        ? `${a.expense.currencyCompany} ${parseFloat(a.expense.amountConverted).toFixed(2)}`
                        : `${a.expense?.currencyOriginal} ${parseFloat(a.expense?.amountOriginal ?? "0").toFixed(2)}`}
                    </td>
                    <td>
                      {sla ? <span className={`sla-timer ${sla.level}`}>⏱ {sla.text}</span> : "—"}
                    </td>
                    <td><span className="badge badge-cyber" style={{ fontSize: "0.64rem" }}>Step {a.stepOrder}</span></td>
                    <td><Badge status={a.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        {selected && (() => {
          const sla = selected.slaDeadline ? slaRemaining(selected.slaDeadline) : null;
          return (
            <div className="card slide-in" style={{ padding: "22px", alignSelf: "start", position: "sticky", top: "72px" }}>
              {/* Header */}
              <div style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>
                  {selected.expense?.category ?? "Expense"}
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text)", marginBottom: "6px" }}>
                  {selected.expense?.description || selected.expense?.vendor || "—"}
                </div>
                <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--cyber)", letterSpacing: "-1px" }}>
                  {selected.expense?.amountConverted
                    ? `${selected.expense.currencyCompany} ${parseFloat(selected.expense.amountConverted).toFixed(2)}`
                    : `${selected.expense?.currencyOriginal} ${parseFloat(selected.expense?.amountOriginal ?? "0").toFixed(2)}`}
                </div>
                {/* Multi-currency display */}
                {selected.expense?.amountConverted && (
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    Original: {selected.expense.currencyOriginal} {parseFloat(selected.expense.amountOriginal).toFixed(2)}
                  </div>
                )}
                <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  By {selected.expense?.user?.name ?? "—"} · {selected.expense?.expenseDate ? fmtDate(selected.expense.expenseDate) : "—"}
                </div>
              </div>

              {/* SLA Timer Display */}
              {sla && (
                <div style={{ marginBottom: "14px" }}>
                  <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>SLA Timer</div>
                  <span className={`sla-timer ${sla.level}`} style={{ fontSize: "0.82rem", padding: "6px 14px" }}>
                    ⏱ {sla.text} {sla.level === "overdue" ? "" : "remaining"}
                  </span>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "6px" }}>
                    Deadline: {fmtDate(selected.slaDeadline!)} · On timeout: escalate → auto-reject
                  </div>
                </div>
              )}

              {/* Approval Flow Visualization */}
              <div style={{ marginBottom: "14px" }}>
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Approval Flow</div>
                <div className="approval-trail">
                  {[1, 2, 3].map((step) => {
                    const isCurrent = step === selected.stepOrder;
                    const isDone = step < selected.stepOrder;
                    const state = isDone ? "done" : isCurrent ? "current" : "waiting";
                    const labels = ["Manager", "Finance", "Director"];
                    return (
                      <div key={step} className="approval-step" style={{ padding: "8px 0" }}>
                        <div className={`step-circle ${state}`} style={{ width: 26, height: 26, fontSize: "0.62rem" }}>{isDone ? "✓" : step}</div>
                        <div className="step-info">
                          <div className="step-name" style={{ fontSize: "0.78rem" }}>{labels[step - 1]}</div>
                          <div className="step-meta">{isDone ? "Approved" : isCurrent ? "Awaiting decision" : "Pending"}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rule Applied */}
              <div className="rule-applied" style={{ marginBottom: "14px" }}>
                <div className="rule-applied-title">⚡ Rule Applied</div>
                <div className="rule-applied-text">
                  Step {selected.stepOrder}: {selected.stepOrder === 3 ? "Hybrid — 60% OR CFO override" : "All approvers must approve"}
                </div>
              </div>

              {/* Comment + Actions */}
              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label>Comment</label>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a note..." style={{ minHeight: "56px" }} />
              </div>

              {decideError && <div className="callout danger" style={{ marginBottom: "12px" }}>{decideError}</div>}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <button className="btn btn-success" disabled={deciding} onClick={() => handleDecision("APPROVED")} style={{ justifyContent: "center" }}>
                  {deciding ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "✓ Approve"}
                </button>
                <button className="btn btn-danger" disabled={deciding} onClick={() => handleDecision("REJECTED")} style={{ justifyContent: "center" }}>
                  {deciding ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "✕ Reject"}
                </button>
              </div>
              <button onClick={() => { setSelected(null); setComment(""); }} style={{ width: "100%", marginTop: "10px", fontSize: "0.72rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>
                Close panel
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
