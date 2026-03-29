"use client";
import { useState, useRef, useEffect } from "react";
import { api, CURRENCIES, CATEGORIES, CreateExpenseBody, ConvertResponse, slaRemaining } from "@/lib/api";

const EMPTY: CreateExpenseBody = {
  amount: 0, currency: "INR", category: "Meals & Entertainment",
  vendor: "", description: "", receiptUrl: "",
  expenseDate: new Date().toISOString().split("T")[0],
};

export default function SubmitExpense({ onNavigate }: { onNavigate: (t: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm]             = useState<CreateExpenseBody>(EMPTY);
  const [file, setFile]             = useState<File | null>(null);
  const [dragging, setDragging]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [conversion, setConversion] = useState<ConvertResponse | null>(null);
  const [converting, setConverting] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrDone, setOcrDone]       = useState(false);
  const [dupWarning, setDupWarning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = (k: keyof CreateExpenseBody, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Currency conversion preview
  useEffect(() => {
    if (!form.amount || form.amount < 1 || form.currency === "INR") { setConversion(null); return; }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setConverting(true);
      api.convertCurrency(form.currency, "INR", form.amount)
        .then(setConversion).catch(() => setConversion(null)).finally(() => setConverting(false));
    }, 600);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [form.amount, form.currency]);

  // Duplicate detection (simple: same amount + same date)
  useEffect(() => {
    if (!form.amount || form.amount <= 0) { setDupWarning(false); return; }
    api.getExpenses({ limit: 20 })
      .then((r) => {
        const dup = r.expenses.some(
          (e) => Math.abs(parseFloat(e.amountOriginal) - form.amount) < 0.01 &&
                 e.expenseDate?.startsWith(form.expenseDate) &&
                 e.currencyOriginal === form.currency
        );
        setDupWarning(dup);
      })
      .catch(() => {});
  }, [form.amount, form.expenseDate, form.currency]);

  const handleFile = (f: File) => {
    setFile(f);
    set("receiptUrl", f.name);
  };

  // OCR Scan
  const handleOcr = async () => {
    if (!file) return;
    setOcrLoading(true); setOcrDone(false);
    try {
      const result = await api.processReceipt(file);
      if (result.amount) set("amount", result.amount);
      if (result.date) set("expenseDate", result.date);
      if (result.vendor) set("vendor", result.vendor);
      if (result.currency) set("currency", result.currency);
      setOcrDone(true);
    } catch {
      setError("OCR processing failed. Fill in details manually.");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.amount || form.amount <= 0) { setError("Amount must be greater than 0"); return; }
    setSubmitting(true); setError("");
    try {
      await api.createExpense(form);
      onNavigate("history");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Mock SLA for preview
  const mockSla = slaRemaining(new Date(Date.now() + 24 * 3600000).toISOString());

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Submit Expense</h1>
          <p className="page-sub">Upload receipt or fill manually — OCR auto-reads details</p>
        </div>
        <span className="badge badge-blue" style={{ fontSize: "0.78rem", padding: "5px 14px" }}>● Draft</span>
      </div>

      <div className="two-col">
        <div className="card" style={{ padding: "24px" }}>
          {/* Upload + OCR */}
          <div
            className={`upload-zone ${dragging ? "dragging" : ""}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
          >
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            <span className="uz-icon">{file ? "✅" : "📎"}</span>
            <div className="uz-text">
              {file ? (
                <><strong>{file.name}</strong> — Click to replace</>
              ) : (
                <><strong>Click to upload receipt</strong> or drag & drop<br />PNG, JPG, WEBP, PDF — OCR auto-reads amount, date, vendor</>
              )}
            </div>
          </div>

          {/* OCR Scan Button */}
          {file && (
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <button className="btn btn-primary btn-sm" onClick={handleOcr} disabled={ocrLoading} style={{ gap: "6px" }}>
                {ocrLoading ? <><span className="spinner" style={{ width: 12, height: 12, borderTopColor: "var(--ink)" }} /> Scanning...</> : "🔍 OCR Scan Receipt"}
              </button>
              {ocrDone && <span className="badge badge-green" style={{ fontSize: "0.72rem" }}>✓ Auto-filled from receipt</span>}
            </div>
          )}

          {/* Duplicate Warning */}
          {dupWarning && (
            <div className="dup-warning">
              <span className="dup-icon">⚠️</span>
              <span className="dup-text">Possible duplicate detected — an expense with the same amount, currency, and date already exists.</span>
            </div>
          )}

          {/* Currency Conversion Preview */}
          {(conversion || converting) && (
            <div className="callout info" style={{ marginBottom: "16px" }}>
              {converting ? "Converting…" : conversion
                ? <>💱 ≈ <strong>₹{conversion.converted.toFixed(2)}</strong> (rate: {conversion.rate.toFixed(4)})</>
                : null}
            </div>
          )}

          <div className="form-grid" style={{ marginTop: "4px" }}>
            <div className="form-group">
              <label>Description</label>
              <input type="text" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="e.g. Client Dinner — Taj Hotel" />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Amount</label>
              <div className="amount-row">
                <select value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="number" step="0.01" min="0.01" value={form.amount || ""} onChange={(e) => set("amount", parseFloat(e.target.value) || 0)} placeholder="0.00" />
              </div>
            </div>
            <div className="form-group">
              <label>Date of Expense</label>
              <input type="date" value={form.expenseDate} onChange={(e) => set("expenseDate", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Vendor / Merchant</label>
              <input type="text" value={form.vendor} onChange={(e) => set("vendor", e.target.value)} placeholder="e.g. Uber, Amazon, Marriott" />
            </div>
            <div className="form-group">
              <label>Converted (Company Currency)</label>
              <input readOnly value={form.currency === "INR" ? `₹ ${form.amount || "0"}` : conversion ? `₹ ${conversion.converted.toFixed(2)}` : "Auto-converted on submit"} style={{ background: "rgba(253,224,71,0.04)", color: "var(--cyber)", fontWeight: 700, cursor: "default" }} />
            </div>
            <div className="form-group full-width">
              <label>Remarks for approver</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Optional context, links, or notes..." />
            </div>
          </div>

          {error && <div className="callout danger" style={{ marginTop: "12px" }}>{error}</div>}

          <div className="flex-end mt-2" style={{ paddingTop: "18px", borderTop: "1px solid var(--border)" }}>
            <button className="btn btn-ghost" onClick={() => { setForm(EMPTY); setFile(null); setOcrDone(false); }}>Reset</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <><span className="spinner" style={{ width: 14, height: 14, borderTopColor: "var(--ink)" }} /> Submitting...</> : "Submit for Approval →"}
            </button>
          </div>
        </div>

        {/* Right Panel */}
        <div className="gap-col">
          {/* Approval Flow Visualization */}
          <div className="card" style={{ padding: "20px" }}>
            <div className="card-title" style={{ marginBottom: "14px" }}>Approval Flow</div>
            <div className="approval-trail">
              {[
                { label: "Manager", meta: "Step 1 — Direct manager review", state: "current", step: 1, badge: "Manager" },
                { label: "Finance Team", meta: "Step 2 — Finance verification", state: "waiting", step: 2 },
                { label: "Director", meta: "Step 3 — Final sign-off", state: "waiting", step: 3 },
              ].map(({ label, meta, state, step, badge }) => (
                <div key={step} className="approval-step">
                  <div className={`step-circle ${state}`}>{step}</div>
                  <div className="step-info">
                    <div className="step-name">
                      {label}
                      {badge && <span className="badge badge-cyber" style={{ fontSize: "0.6rem" }}>{badge}</span>}
                    </div>
                    <div className="step-meta">{meta}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rule Applied */}
          <div className="card" style={{ padding: "20px" }}>
            <div className="rule-applied">
              <div className="rule-applied-title">⚡ Rule Applied</div>
              <div className="rule-applied-text">
                Hybrid rule: Approved if <strong>60% threshold</strong> met OR <strong>CFO</strong> approves directly.
              </div>
            </div>
            <div className="rule-applied" style={{ marginBottom: 0 }}>
              <div className="rule-applied-title">⏱ SLA Timer</div>
              <div className="rule-applied-text">
                Each step has <strong>24h SLA</strong>. On timeout: escalate → auto-reject → reassign.
                <div style={{ marginTop: "6px" }}>
                  <span className={`sla-timer ${mockSla.level}`}>⏱ {mockSla.text} remaining</span>
                </div>
              </div>
            </div>
          </div>

          {/* Multi-currency Display */}
          <div className="card" style={{ padding: "20px" }}>
            <div className="card-title" style={{ marginBottom: "10px" }}>💱 Multi-Currency</div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-dim)", lineHeight: 1.7 }}>
              Submit in <strong style={{ color: "var(--cyber)" }}>any currency</strong>. Auto-converted to company currency. Both original + converted amounts stored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
