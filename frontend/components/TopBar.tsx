"use client";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

interface Props { activeRole: string; onRoleChange: (r: string) => void; }

export default function TopBar({ activeRole, onRoleChange }: Props) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const userRole = user?.role ?? "EMPLOYEE";

  const tabs = [
    { key: "EMPLOYEE", label: "📋 My Expenses" },
    ...(userRole === "MANAGER" || userRole === "ADMIN" ? [{ key: "MANAGER", label: "✅ Approvals" }] : []),
    ...(userRole === "ADMIN" ? [{ key: "ADMIN", label: "⚙️ Admin" }] : []),
  ];

  const handleLogout = () => { logout(); router.replace("/"); };

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="brand-dot" />
        ReimburseFlow
      </div>
      <div className="topbar-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`topbar-tab ${activeRole === t.key ? "active" : ""}`}
            onClick={() => onRoleChange(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <button className="btn btn-ghost btn-xs" onClick={handleLogout}>
        Log out
      </button>
    </header>
  );
}
