import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { processReceipt } from '../../api/ocrApi';
import { expenseApi } from '../../api/expenseApi';

const CATEGORIES = [
  'Meals & Entertainment',
  'Travel',
  'Accommodation',
  'Software & Subscriptions',
  'Office Supplies',
  'Medical',
  'Utilities',
  'Miscellaneous',
];

const OCR_CATEGORY_MAP = {
  meals: 'Meals & Entertainment',
  travel: 'Travel',
  accommodation: 'Accommodation',
  office: 'Office Supplies',
  medical: 'Medical',
  utilities: 'Utilities',
  other: 'Miscellaneous',
};

export default function SubmitExpense({ onNavigate }) {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);

  const [form, setForm] = useState({
    description: '',
    category: CATEGORIES[0],
    amount: '',
    currency: 'INR',
    date: new Date().toISOString().split('T')[0],
    paidBy: 'Personal Card',
    remarks: '',
    receiptText: '',
  });

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  // ── OCR Upload ────────────────────────
  const handleFile = async (f) => {
    if (!f) return;
    setFile(f);
    setOcrLoading(true);
    setOcrResult(null);

    try {
      const res = await processReceipt(f);
      if (res.success && res.data) {
        const d = res.data;
        setOcrResult(d);

        // Auto-fill form fields
        if (d.amount) updateField('amount', String(d.amount));
        if (d.currency) updateField('currency', d.currency);
        if (d.date) {
          // Try to parse the OCR date into YYYY-MM-DD
          const parsed = new Date(d.date);
          if (!isNaN(parsed)) updateField('date', parsed.toISOString().split('T')[0]);
        }
        if (d.vendor_name) updateField('description', d.description || `${d.vendor_name}`);
        if (d.expense_type && OCR_CATEGORY_MAP[d.expense_type]) {
          updateField('category', OCR_CATEGORY_MAP[d.expense_type]);
        }
        if (d.raw_confidence > 70 && d.fields_missing?.length === 0) {
          toast.success('Receipt scanned — all fields auto-filled!');
        } else {
          toast('Receipt scanned — please verify highlighted fields', { icon: '⚠️' });
        }
      }
    } catch (err) {
      toast.error('OCR failed: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setOcrLoading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  // ── Submit ────────────────────────────
  const handleSubmit = async () => {
    if (!form.amount || !form.description) {
      toast.error('Please fill amount and description');
      return;
    }
    setSubmitting(true);
    try {
      await expenseApi.create({
        amount: parseFloat(form.amount),
        currency: form.currency,
        category: form.category,
        description: form.description,
        date: form.date,
        receiptText: form.receiptText || ocrResult?.raw_text || '',
      });
      toast.success('Expense submitted for approval!');
      onNavigate('history');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to submit expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Submit Expense</h1>
          <p className="page-sub">Upload a receipt — OCR will auto-fill details</p>
        </div>
        <span className="badge badge-blue" style={{ fontSize: '0.8rem', padding: '5px 12px' }}>
          ● Draft
        </span>
      </div>

      <div className="two-col">
        <div className="card" style={{ padding: '24px' }}>
          {/* Upload Zone */}
          <div
            className={`upload-zone ${dragging ? 'dragging' : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <span className="uz-icon">{ocrLoading ? '⏳' : file ? '✅' : '📎'}</span>
            <div className="uz-text">
              {ocrLoading ? (
                'Scanning receipt...'
              ) : file ? (
                <>
                  <strong>{file.name}</strong> — Click to replace
                </>
              ) : (
                <>
                  <strong>Click to upload receipt</strong> or drag & drop
                  <br />
                  PNG, JPG, WEBP, PDF — OCR auto-reads amount, date, vendor
                </>
              )}
            </div>
          </div>

          {/* OCR Confidence Callout */}
          {ocrResult && (
            <div
              className={`callout ${
                ocrResult.recommendation === 'auto_fill' ? 'success' : 'warning'
              }`}
            >
              {ocrResult.recommendation === 'auto_fill' ? (
                <>🟢 <strong>High confidence</strong> — All fields auto-filled from receipt</>
              ) : (
                <>⚠️ <strong>Manual review needed</strong> — Some fields couldn't be read clearly
                  {ocrResult.fields_missing?.length > 0 && (
                    <> (missing: {ocrResult.fields_missing.join(', ')})</>
                  )}
                </>
              )}
            </div>
          )}

          {/* Form Fields */}
          <div className="form-grid" style={{ marginTop: '20px' }}>
            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="e.g. Client Dinner — Taj Hotel"
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={form.category} onChange={(e) => updateField('category', e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Amount</label>
              <div className="amount-row">
                <select value={form.currency} onChange={(e) => updateField('currency', e.target.value)}>
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                  <option value="GBP">£ GBP</option>
                </select>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => updateField('amount', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Date of Expense</label>
              <input type="date" value={form.date} onChange={(e) => updateField('date', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Paid By</label>
              <select value={form.paidBy} onChange={(e) => updateField('paidBy', e.target.value)}>
                <option>Personal Card</option>
                <option>Company Card</option>
                <option>Cash</option>
              </select>
            </div>
            <div className="form-group">
              <label>Converted Amount (Company INR)</label>
              <input
                readOnly
                value={form.currency === 'INR' ? `₹ ${form.amount || '0'}` : 'Auto-converted on submit'}
                style={{ background: 'var(--slate-50)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}
              />
            </div>
            <div className="form-group full-width">
              <label>Remarks for approver</label>
              <textarea
                value={form.remarks}
                onChange={(e) => updateField('remarks', e.target.value)}
                placeholder="Optional context, links, or notes..."
              />
            </div>
          </div>

          <div className="flex-end mt-2" style={{ paddingTop: '18px', borderTop: '1px solid var(--border-light)' }}>
            <button className="btn btn-ghost">Save Draft</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit for Approval →'}
            </button>
          </div>
        </div>

        {/* Right Panel: Approval Preview */}
        <div className="gap-col">
          <div className="card" style={{ padding: '20px' }}>
            <div className="card-title" style={{ marginBottom: '14px' }}>
              Approval Route Preview
            </div>
            <div className="approval-trail">
              <div className="approval-step">
                <div className="step-circle current">1</div>
                <div className="step-info">
                  <div className="step-name">
                    Manager <span className="badge badge-blue" style={{ fontSize: '0.62rem' }}>Step 1</span>
                  </div>
                  <div className="step-meta">Your direct manager — first approval</div>
                </div>
              </div>
              <div className="approval-step">
                <div className="step-circle waiting">2</div>
                <div className="step-info">
                  <div className="step-name">Finance Team</div>
                  <div className="step-meta">Sequential — after Step 1</div>
                </div>
              </div>
              <div className="approval-step">
                <div className="step-circle waiting">3</div>
                <div className="step-info">
                  <div className="step-name">Director</div>
                  <div className="step-meta">Final sign-off (hybrid rule)</div>
                </div>
              </div>
            </div>
            <div className="callout info" style={{ marginTop: '14px', fontSize: '0.76rem' }}>
              Default rule: Manager → Finance → Director (60% or CFO)
            </div>
          </div>

          {/* OCR Details */}
          {ocrResult && (
            <div className="card" style={{ padding: '20px' }}>
              <div className="card-title" style={{ marginBottom: '10px' }}>OCR Scan Details</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <span>Vendor</span>
                  <strong>{ocrResult.vendor_name || '—'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <span>Confidence</span>
                  <strong>{ocrResult.raw_confidence}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <span>Type</span>
                  <strong>{ocrResult.expense_type || '—'}</strong>
                </div>
                {ocrResult.expense_lines?.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>Line Items:</div>
                    {ocrResult.expense_lines.map((li, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '0.76rem' }}>
                        <span>{li.description}</span>
                        <span className="mono">₹{li.total}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
