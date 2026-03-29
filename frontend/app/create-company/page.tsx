"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

interface CountryData { name: { common: string }; currencies?: Record<string, { name: string; symbol: string }> }

export default function CreateCompanyPage() {
  const { user, loading, isNew, setUser } = useAuth();
  const router = useRouter();
  const [countries, setCountries] = useState<{ name: string; currency: string }[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.replace("/"); return; }
    if (!loading && user && !isNew) { router.replace("/dashboard"); return; }
  }, [user, loading, isNew, router]);

  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all?fields=name,currencies")
      .then((r) => r.json())
      .then((data: CountryData[]) => {
        const list = data
          .map((c) => {
            const cur = c.currencies ? Object.keys(c.currencies)[0] : "";
            return { name: c.name.common, currency: cur };
          })
          .filter((c) => c.currency)
          .sort((a, b) => a.name.localeCompare(b.name));
        setCountries(list);
        if (list.length > 0) {
          const india = list.find((c) => c.name === "India");
          const def = india || list[0];
          setCountry(def.name);
          setCurrency(def.currency);
        }
      })
      .catch(() => {
        setCountries([
          { name: "India", currency: "INR" }, { name: "United States", currency: "USD" },
          { name: "United Kingdom", currency: "GBP" }, { name: "Germany", currency: "EUR" },
        ]);
        setCountry("India");
        setCurrency("INR");
      })
      .finally(() => setFetching(false));
  }, []);

  const handleCountryChange = (name: string) => {
    setCountry(name);
    const c = countries.find((c) => c.name === name);
    if (c) setCurrency(c.currency);
  };

  const handleSubmit = async () => {
    if (!companyName.trim()) { setError("Company name is required"); return; }
    setSubmitting(true); setError("");
    try {
      const updated = await api.setupCompany({
        companyName: companyName.trim(),
        country,
        currency,
      });
      // Update auth context with new user data (now has companyName + ADMIN role)
      setUser(updated);
      router.replace("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create company. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || fetching) return (
    <div className="auth-layout"><span className="spinner" style={{ width: 24, height: 24 }} /></div>
  );

  return (
    <div className="auth-layout">
      <div className="auth-card fade-in" style={{ maxWidth: 480 }}>
        <div className="auth-brand">
          <span className="brand-dot" />
          ReimburseFlow
        </div>
        <p className="auth-subtitle">Set up your company to get started</p>

        <div style={{ marginBottom: "20px", padding: "12px 16px", background: "rgba(253,224,71,0.05)", borderRadius: "12px", border: "1px solid rgba(253,224,71,0.1)" }}>
          <p style={{ fontSize: "0.76rem", color: "var(--cyber)", margin: 0, fontWeight: 600 }}>
            👋 Welcome, {user?.name}! You&apos;ll be assigned as Admin.
          </p>
        </div>

        <div className="auth-form">
          <div className="form-group">
            <label>Company Name</label>
            <input
              placeholder="e.g. Acme Technologies Pvt Ltd"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Country</label>
            <select value={country} onChange={(e) => handleCountryChange(e.target.value)}>
              {countries.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Default Currency (auto-detected)</label>
            <input
              readOnly
              value={currency}
              style={{ background: "rgba(253,224,71,0.05)", color: "var(--cyber)", fontWeight: 700, letterSpacing: "0.05em", cursor: "default" }}
            />
          </div>

          {error && <div className="callout danger">{error}</div>}

          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
            style={{ justifyContent: "center", padding: "14px", width: "100%", fontSize: "0.88rem" }}
          >
            {submitting ? <><span className="spinner" style={{ width: 14, height: 14, borderTopColor: "var(--ink)" }} /> Creating...</> : "Create Company & Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
}
