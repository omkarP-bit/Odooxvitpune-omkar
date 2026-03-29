"use client";
import { useEffect, useState } from "react";
import { api, Expense, fmtDate, fmtMoney, timeSince } from "@/lib/api";
import Badge from "@/components/Badge";

export default function Dashboard({ onNavigate }: { onNavigate: (t: string) => void }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.getExpenses({ limit: 50 })
      .then((r) => setExpenses(r.expenses))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const approved  = expenses.filter((e) => e.status === "APPROVED");
  const pending   = expenses.filter((e) => e.status === "PENDING");
  const rejected  = expenses.filter((e) => e.status === "REJECTED");
  const totalAmt  = expenses.reduce((s, e) => s + parseFloat(e.amountOriginal), 0);
  const approvedAmt = approved.reduce((s, e) => s + parseFloat(e.amountOriginal), 0);
  const pendingAmt  = pending.reduce((s, e) => s + parseFloat(e.amountOriginal), 0);
  const rejectedAmt = rejected.reduce((s, e) => s + parseFloat(e.amountOriginal), 0);
  const recent = [...expenses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">
            {pending.length > 0
              ? `${pending.length} expense${pending.length > 1 ? "s" : ""} awaiting approval`
              : "All caught up — no pending expenses"}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate("submit")}>+ New Expense</button>
      </div>

      <div className="stat-grid">
        <div className="stat-card featured">
          <div className="stat-label">Total Submitted</div>
          <div className="stat-value">{loading ? "…" : fmtMoney(totalAmt)}</div>
          <div className="stat-delta"><span>{expenses.length}</span> total expenses</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Approved</div>
          <div className="stat-value" style={{ color: "var(--green)" }}>{loading ? "…" : fmtMoney(approvedAmt)}</div>
          <div className="stat-delta"><span className="delta-up">{approved.length}</span> cleared</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-value" style={{ color: "var(--amber)" }}>{loading ? "…" : fmtMoney(pendingAmt)}</div>
          <div className="stat-delta"><span style={{ color: "var(--amber)", fontWeight: 700 }}>{pending.length}</span> in review</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Rejected</div>
          <div className="stat-value" style={{ color: "var(--red)" }}>{loading ? "…" : fmtMoney(rejectedAmt)}</div>
          <div className="stat-delta"><span className="delta-down">{rejected.length}</span> declined</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "16px" }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Expenses</div>
              <div className="card-sub">Last 5 submissions</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate("history")}>View all →</button>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Description</th><th>Category</th><th>Amount</th><th>Converted</th><th>Date</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center" style={{ padding: "24px", color: "var(--text-muted)" }}>Loading...</td></tr>
              ) : recent.length === 0 ? (
                <tr><td colSpan={6} className="text-center" style={{ padding: "24px", color: "var(--text-muted)" }}>No expenses yet</td></tr>
              ) : recent.map((e) => (
                <tr key={e.publicId}>
                  <td style={{ color: "var(--text)", fontWeight: 600 }}>{e.description || e.vendor || "—"}</td>
                  <td><span className="badge badge-grey">{e.category}</span></td>
                  <td className="mono" style={{ color: "var(--cyber)" }}>{e.currencyOriginal} {parseFloat(e.amountOriginal).toFixed(2)}</td>
                  <td className="mono">{e.amountConverted ? `${e.currencyCompany} ${parseFloat(e.amountConverted).toFixed(2)}` : "—"}</td>
                  <td style={{ color: "var(--text-muted)" }}>{fmtDate(e.expenseDate)}</td>
                  <td><Badge status={e.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="gap-col">
          <div className="card" style={{ padding: "20px" }}>
            <div className="card-title" style={{ marginBottom: "14px" }}>Activity</div>
            {loading ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>Loading...</p>
            ) : recent.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>No activity yet</p>
            ) : recent.map((e) => (
              <div key={e.publicId} style={{ display: "flex", gap: "10px", padding: "10px 0", borderBottom: "1px solid var(--border-light)" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: e.status === "APPROVED" ? "var(--green)" : e.status === "REJECTED" ? "var(--red)" : "var(--amber)", marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", fontWeight: 600 }}>{e.description || e.vendor || "Expense"}</div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{e.currencyOriginal} {parseFloat(e.amountOriginal).toFixed(2)} · {timeSince(e.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: "20px" }}>
            <div className="card-title" style={{ marginBottom: "10px" }}>Quick Actions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button className="btn btn-primary btn-sm" onClick={() => onNavigate("submit")} style={{ justifyContent: "center", width: "100%" }}>+ Submit Expense</button>
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate("history")} style={{ justifyContent: "center", width: "100%" }}>View History</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
