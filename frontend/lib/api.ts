const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}
export function setToken(t: string) { localStorage.setItem("token", t); }
export function clearToken() { localStorage.removeItem("token"); }

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  if (!(init.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers as Record<string, string> ?? {}) },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? "Request failed");
  return json.data as T;
}

export const api = {
  getMe: () => req<User>("/api/auth/me"),

  // Company setup (first-time user)
  setupCompany: (body: { companyName: string; country: string; currency: string }) =>
    req<User>("/api/auth/setup-company", { method: "POST", body: JSON.stringify(body) }),

  // Expenses
  getExpenses: (p: ExpenseParams = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(p).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => [k, String(v)])
      )
    ).toString();
    return req<ExpenseListResponse>(`/api/expenses${qs ? "?" + qs : ""}`);
  },
  createExpense: (body: CreateExpenseBody) =>
    req<{ id: string; status: string }>("/api/expenses", { method: "POST", body: JSON.stringify(body) }),

  // Approvals
  getApprovals: (p: { page?: number; limit?: number; status?: string } = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(p).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
      )
    ).toString();
    return req<ApprovalListResponse>(`/api/approvals${qs ? "?" + qs : ""}`);
  },
  decide: (id: string, decision: "APPROVED" | "REJECTED", comments?: string) =>
    req<{ message: string }>(`/api/approvals/${id}/approve`, { method: "POST", body: JSON.stringify({ decision, comments }) }),

  // Currency
  convertCurrency: (from: string, to: string, amount: number) =>
    req<ConvertResponse>(`/api/currency/convert?from=${from}&to=${to}&amount=${amount}`),

  // OCR
  processReceipt: (file: File) => {
    const fd = new FormData();
    fd.append("receipt", file);
    return req<OcrResponse>("/api/ocr/process", { method: "POST", body: fd });
  },
};

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  companyId: string;
  companyName: string | null;
  currency?: string;
}

export interface Expense {
  publicId: string;
  amountOriginal: string;
  currencyOriginal: string;
  amountConverted?: string;
  currencyCompany?: string;
  category: string;
  vendor?: string;
  description?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  expenseDate: string;
  createdAt: string;
  user?: { name: string; email: string; publicId: string };
}

export interface ExpenseParams {
  page?: number;
  limit?: number;
  status?: string;
  from?: string;
  to?: string;
}

export interface ExpenseListResponse {
  expenses: Expense[];
  total: number;
  page: number;
  limit: number;
}

export interface Approval {
  publicId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ESCALATED" | "SKIPPED";
  stepOrder: number;
  comments?: string;
  decidedAt?: string;
  createdAt: string;
  slaDeadline?: string;
  expense: Expense;
  approver: { name: string; email: string };
}

export interface ApprovalListResponse {
  approvals: Approval[];
  total: number;
}

export interface CreateExpenseBody {
  amount: number;
  currency: string;
  category: string;
  vendor?: string;
  description?: string;
  receiptUrl?: string;
  expenseDate: string;
}

export interface ConvertResponse {
  from: string;
  to: string;
  amount: number;
  converted: number;
  rate: number;
}

export interface OcrResponse {
  amount?: number;
  date?: string;
  vendor?: string;
  currency?: string;
}

export const CURRENCIES = ["USD","EUR","GBP","INR","JPY","CAD","AUD","SGD","AED","CHF"];
export const CATEGORIES = [
  "Meals & Entertainment","Travel","Accommodation",
  "Software & Subscriptions","Office Supplies","Medical","Utilities","Miscellaneous",
];

export function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}
export function fmtMoney(n: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
}
export function getInitials(name?: string) {
  if (!name) return "U";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}
export function timeSince(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
export function slaRemaining(deadline: string): { text: string; level: "ok" | "warning" | "urgent" | "overdue" } {
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms < 0) return { text: "Overdue", level: "overdue" };
  const hrs = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (hrs < 4) return { text: `${hrs}h ${mins}m`, level: "urgent" };
  if (hrs < 24) return { text: `${hrs}h ${mins}m`, level: "warning" };
  return { text: `${hrs}h`, level: "ok" };
}
