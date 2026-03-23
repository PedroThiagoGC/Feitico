import { useState } from "react";
import { type Session } from "@supabase/supabase-js";
import { LogOut } from "lucide-react";
import SuperAdminDashboard from "./SuperAdminDashboard";
import SuperAdminTenants from "./SuperAdminTenants";
import SuperAdminTenantDetail from "./SuperAdminTenantDetail";
import SuperAdminTenantNew from "./SuperAdminTenantNew";
import SuperAdminPlans from "./SuperAdminPlans";
import SuperAdminUsers from "./SuperAdminUsers";
import SuperAdminAudit from "./SuperAdminAudit";
import SuperAdminFinancial from "./SuperAdminFinancial";

type Tab = "dashboard" | "tenants" | "tenant-detail" | "tenant-new" | "plans" | "users" | "audit" | "financial";

const tabs: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "tenants", label: "Tenants" },
  { id: "plans", label: "Planos" },
  { id: "users", label: "Usuários" },
  { id: "audit", label: "Audit Logs" },
  { id: "financial", label: "Financeiro" },
];

interface Props {
  session: Session;
  onLogout: () => void;
}

export default function SuperAdminLayout({ session, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  const navigateToTenantDetail = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setActiveTab("tenant-detail");
  };

  const navigateToNewTenant = () => {
    setActiveTab("tenant-new");
  };

  const renderPage = () => {
    switch (activeTab) {
      case "dashboard":
        return <SuperAdminDashboard onViewTenant={navigateToTenantDetail} />;
      case "tenants":
        return <SuperAdminTenants onViewTenant={navigateToTenantDetail} onNewTenant={navigateToNewTenant} />;
      case "tenant-detail":
        return <SuperAdminTenantDetail tenantId={selectedTenantId} onBack={() => setActiveTab("tenants")} />;
      case "tenant-new":
        return <SuperAdminTenantNew onSuccess={() => setActiveTab("tenants")} onCancel={() => setActiveTab("tenants")} />;
      case "plans":
        return <SuperAdminPlans />;
      case "users":
        return <SuperAdminUsers />;
      case "audit":
        return <SuperAdminAudit />;
      case "financial":
        return <SuperAdminFinancial />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-8 h-14 bg-card border-b border-border">
        <div className="font-display text-lg font-semibold">
          <span className="text-primary">Feitico</span> SuperAdmin
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider">
            SUPERADMIN
          </span>
          <span>{session.user.email}</span>
          <button onClick={onLogout} className="text-muted-foreground hover:text-primary transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex gap-1 px-8 pt-4 bg-background">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg border border-transparent border-b-0 transition-all ${
              activeTab === tab.id
                ? "text-primary bg-card border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-card"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-8 py-6 max-w-[1400px]">
        {renderPage()}
      </div>
    </div>
  );
}
