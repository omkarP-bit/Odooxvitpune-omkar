"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";

// Employee tabs
import Dashboard     from "@/components/employee/Dashboard";
import SubmitExpense from "@/components/employee/SubmitExpense";
import ExpenseHistory from "@/components/employee/ExpenseHistory";

// Manager tabs
import ReviewQueue from "@/components/manager/ReviewQueue";

// Admin tabs
import UserManagement from "@/components/admin/UserManagement";
import ApprovalRules  from "@/components/admin/ApprovalRules";
import AllExpenses    from "@/components/admin/AllExpenses";

const DEFAULT_TAB: Record<string, string> = {
  EMPLOYEE: "dash",
  MANAGER:  "queue",
  ADMIN:    "users",
};

export default function AppPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<string>("");
  const [activeTab,  setActiveTab]  = useState<string>("");
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) { router.replace("/"); return; }
    if (user) {
      setActiveRole(user.role);
      setActiveTab(DEFAULT_TAB[user.role] ?? "dash");
    }
  }, [user, loading, router]);

  const handleRoleChange = (role: string) => {
    setActiveRole(role);
    setActiveTab(DEFAULT_TAB[role] ?? "dash");
  };

  const handleTabChange = (tab: string) => setActiveTab(tab);

  if (loading || !user || !activeRole) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--ink)" }}>
        <span className="spinner" style={{ width: 24, height: 24 }} />
      </div>
    );
  }

  const renderContent = () => {
    if (activeRole === "ADMIN") {
      switch (activeTab) {
        case "rules":    return <ApprovalRules />;
        case "expenses": return <AllExpenses />;
        default:         return <UserManagement />;
      }
    }
    if (activeRole === "MANAGER") {
      switch (activeTab) {
        case "dash":    return <Dashboard onNavigate={handleTabChange} />;
        case "submit":  return <SubmitExpense onNavigate={handleTabChange} />;
        case "history": return <ExpenseHistory />;
        default:        return <ReviewQueue onCountChange={setPendingCount} />;
      }
    }
    // EMPLOYEE
    switch (activeTab) {
      case "submit":  return <SubmitExpense onNavigate={handleTabChange} />;
      case "history": return <ExpenseHistory />;
      default:        return <Dashboard onNavigate={handleTabChange} />;
    }
  };

  return (
    <>
      <TopBar activeRole={activeRole} onRoleChange={handleRoleChange} />
      <div className="app-layout">
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} pendingCount={pendingCount} />
        <main className="main-content fade-in" key={`${activeRole}-${activeTab}`}>
          {renderContent()}
        </main>
      </div>
    </>
  );
}
