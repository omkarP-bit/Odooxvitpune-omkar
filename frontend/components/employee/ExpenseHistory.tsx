"use client";
import { useEffect, useState } from "react";
import { api, Expense, fmtDate } from "@/lib/api";
import Badge from "@/components/Badge";

export default function ExpenseHistory() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 15;

  useEffect(() => {
    setLoading(true);
    api.getExpenses({ limit: 100 })
      .then((r) => setExpenses(r.expenses))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = expenses
    .filter((e) => {
      if (statusFilter !== "all" && e.status.toLowerCase() !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (e.description || "").toLowerCase().includes(q) ||
               (e.category || "").toLowerCase().includes(q) ||
               (e.vendor || "").toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalPages = Math.ceil(filtered.length / limit);
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Expenses</h1>
          <p className="page-sub">{filtered.length} reimbursement{filtered.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="searchbar">
        <input className="search-input" placeholder="Search description, category, vendor..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select className="filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Description</th><th>Category</th><th>Date</th><th>Original</th><th>Converted</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center" style={{ padding: "24px", color: "var(--text-muted)" }}>Loading...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={6} className="text-center" style={{ padding: "24px", color: "var(--text-muted)" }}>No expenses found</td></tr>
            ) : paginated.map((e) => (
              <tr key={e.publicId}>
                <td style={{ color: "var(--text)", fontWeight: 600 }}>{e.description || e.vendor || "—"}</td>
                <td><span className="badge badge-grey">{e.category}</span></td>
                <td style={{ color: "var(--text-muted)" }}>{fmtDate(e.expenseDate)}</td>
                <td className="mono" style={{ color: "var(--cyber)" }}>{e.currencyOriginal} {parseFloat(e.amountOriginal).toFixed(2)}</td>
                <td className="mono">{e.amountConverted ? `${e.currencyCompany} ${parseFloat(e.amountConverted).toFixed(2)}` : "—"}</td>
                <td><Badge status={e.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              {(page - 1) * limit + 1}–{Math.min(page * limit, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button className="btn btn-ghost btn-xs" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", padding: "4px 8px" }}>{page}/{totalPages}</span>
              <button className="btn btn-ghost btn-xs" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
