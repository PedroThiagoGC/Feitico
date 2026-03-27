import { useQuery } from "@tanstack/react-query";
import {
  getDashboardOverview,
  type DashboardFinancial,
  type DashboardFinancialPro,
  type DashboardStats,
} from "@/services/adminDashboardService";

export type AdminDashboardStats = DashboardStats;
export type AdminDashboardFinancial = DashboardFinancial;
export type AdminDashboardFinancialPro = DashboardFinancialPro;

export function useAdminDashboard(salonId?: string, dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ["admin-dashboard", salonId, dateFrom, dateTo],
    queryFn: () => getDashboardOverview(salonId!, dateFrom!, dateTo!),
    enabled: !!salonId && !!dateFrom && !!dateTo,
  });
}
