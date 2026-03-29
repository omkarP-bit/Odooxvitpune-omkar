"use client";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

interface Props {
  activeTab: string;
  onTabChange: (href: string) => void;
}

const ROLE_TABS: Record<string, { href: string; label: string }[]> = {
  EMPLOYEE: [
    { href: "/dashboard", label: "👤 Employee" },
  ],
  MANAGER: [
    { href: "/dashboard", label: "👤 Employee" },
    { href: "/approvals", label: "🗂 Manager" },
  ],
  ADMIN: [
    { href: "/dashboard", label: "👤 Employee" },
    { href: "/approvals", label: "🗂 Manager" },
    { href: "/approvals", label: "⚙️ Admin" },
  ],
};

export default function TopBar({ activeTab, onTabChange }: Props) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const tabs = ROLE_TABS[user?.role ?? "EMPLOYEE"] ?? [];

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
            key={t.label}
            className={`topbar-tab ${activeTab === t.href ? "active" : ""}`}
            onClick={() => onTabChange(t.href)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <button
        className="btn btn-ghost btn-xs"
        style={{ color: "#94A3B8", borderColor: "#334155" }}
        onClick={handleLogout}
      >
        Log out
      </button>
    </header>
  );
}
