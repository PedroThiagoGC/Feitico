import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Users,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { superadminApi } from "@/services/superadminApi";

interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  totalProfessionals: number;
  totalBookings: number;
  totalRevenue: number;
}

interface TenantRow {
  id: string;
  name: string;
  slug?: string;
  active: boolean;
  created_at: string;
  logo_url?: string;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [platformStats, allTenants] = await Promise.all([
        superadminApi.getPlatformStats(),
        superadminApi.getTenants(),
      ]);
      setStats(platformStats);
      setTenants(allTenants || []);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const statCards = stats
    ? [
        {
          label: "Total Tenants",
          value: stats.totalTenants,
          icon: Building2,
          color: "text-primary",
          bg: "bg-primary/10",
        },
        {
          label: "Ativos",
          value: stats.activeTenants,
          icon: CheckCircle2,
          color: "text-emerald-400",
          bg: "bg-emerald-400/10",
        },
        {
          label: "Suspensos",
          value: stats.suspendedTenants,
          icon: XCircle,
          color: "text-destructive",
          bg: "bg-destructive/10",
        },
        {
          label: "Profissionais",
          value: stats.totalProfessionals,
          icon: Users,
          color: "text-sky-400",
          bg: "bg-sky-400/10",
        },
        {
          label: "Agendamentos",
          value: stats.totalBookings,
          icon: CalendarCheck,
          color: "text-violet-400",
          bg: "bg-violet-400/10",
        },
        {
          label: "Faturamento Total",
          value: `R$ ${stats.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          icon: DollarSign,
          color: "text-primary",
          bg: "bg-primary/10",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          : statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label} className="bg-card border-border hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${card.color}`} />
                      </div>
                    </div>
                    <p className="font-body text-xs text-muted-foreground">{card.label}</p>
                    <p className={`font-display text-xl font-bold ${card.color} mt-1`}>
                      {card.value}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* Recent Tenants */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Tenants Recentes
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : tenants.length === 0 ? (
            <div className="py-12 text-center">
              <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-body">Nenhum tenant encontrado</p>
              <p className="text-xs text-muted-foreground font-body mt-1">
                Crie seu primeiro tenant para começar
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tenants
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 10)
                .map((tenant) => (
                  <div
                    key={tenant.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {tenant.logo_url ? (
                        <img
                          src={tenant.logo_url}
                          alt={tenant.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Building2 className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-medium text-foreground truncate">
                        {tenant.name}
                      </p>
                      <p className="font-body text-xs text-muted-foreground">
                        {tenant.slug || "sem-slug"} ·{" "}
                        {new Date(tenant.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-[10px] font-body font-medium ${
                        tenant.active !== false
                          ? "bg-emerald-400/15 text-emerald-400"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {tenant.active !== false ? "Ativo" : "Inativo"}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
