"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

function CallbackInner() {
  const params = useSearchParams();
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const token = params.get("token");
    if (!token) { router.replace("/"); return; }
    login(token)
      .then((user) => {
        // New user = no companyName set yet → go to create company
        if (!user.companyName) {
          router.replace("/create-company");
        } else {
          router.replace("/dashboard");
        }
      })
      .catch(() => router.replace("/"));
  }, [params, login, router]);

  return (
    <div className="auth-layout">
      <div style={{ textAlign: "center" }}>
        <span className="spinner" style={{ width: 28, height: 28, marginBottom: 16, display: "block", marginInline: "auto" }} />
        <p style={{ color: "var(--text)", fontWeight: 700, fontSize: "0.9rem", marginBottom: 4 }}>Signing you in…</p>
        <p style={{ color: "var(--text-muted)", fontSize: "0.76rem" }}>Please wait</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="auth-layout">
        <span className="spinner" style={{ width: 24, height: 24 }} />
      </div>
    }>
      <CallbackInner />
    </Suspense>
  );
}
