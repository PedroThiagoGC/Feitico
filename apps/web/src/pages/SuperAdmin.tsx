import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import SuperAdminTenants from "@/pages/SuperAdminTenants";
import SuperAdminBranding from "@/pages/SuperAdminBranding";
import SuperAdminPlans from "@/pages/SuperAdminPlans";
import SuperAdminModules from "@/pages/SuperAdminModules";
import SuperAdminFinancial from "@/pages/SuperAdminFinancial";
import SuperAdminUsers from "@/pages/SuperAdminUsers";
import SuperAdminAudit from "@/pages/SuperAdminAudit";
import { superadminApi } from "@/services/superadminApi";

interface SuperAdminUser {
  id: string;
  email: string;
  role?: string;
}

export default function SuperAdmin() {
  const [user, setUser] = useState<SuperAdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem("superadminToken");
      const savedUser = localStorage.getItem("superadminUser");

      if (!token || !savedUser) {
        navigate("/superadmin/login", { replace: true });
        setLoading(false);
        return;
      }

      try {
        await superadminApi.verifyToken(token);
        setUser(JSON.parse(savedUser) as SuperAdminUser);
      } catch {
        localStorage.removeItem("superadminToken");
        localStorage.removeItem("superadminUser");
        navigate("/superadmin/login", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <SuperAdminLayout userEmail={user.email}>
      <Routes>
        <Route index element={<SuperAdminDashboard />} />
        <Route path="tenants" element={<SuperAdminTenants />} />
        <Route path="branding" element={<SuperAdminBranding />} />
        <Route path="plans" element={<SuperAdminPlans />} />
        <Route path="modules" element={<SuperAdminModules />} />
        <Route path="financial" element={<SuperAdminFinancial />} />
        <Route path="users" element={<SuperAdminUsers />} />
        <Route path="audit" element={<SuperAdminAudit />} />
        <Route path="*" element={<Navigate to="/superadmin" replace />} />
      </Routes>
    </SuperAdminLayout>
  );
}
