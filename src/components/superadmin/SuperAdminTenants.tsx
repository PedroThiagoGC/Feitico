import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Props {
  onViewTenant: (id: string) => void;
  onNewTenant: () => void;
}

export default function SuperAdminTenants({ onViewTenant, onNewTenant }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");

  const { data: tenants = [] } = useQuery({
    queryKey: ["superadmin-tenants-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("*, tenant_subscriptions(*, subscription_plans(*))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = tenants.filter((t) => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.slug.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter === "active" && !t.is_active) return false;
    if (statusFilter === "inactive" && t.is_active) return false;
    return true;
  });

  const getInitials = (name: string) => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const getStatusBadge = (isActive: boolean) => (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      isActive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
    }`}>
      {isActive ? "Ativo" : "Inativo"}
    </span>
  );

  const getPlanBadge = (sub: any) => {
    const plan = sub?.subscription_plans?.name || "—";
    const colors: Record<string, string> = {
      Trial: "bg-warning/10 text-warning",
      Starter: "bg-info/10 text-info",
      Pro: "bg-purple/10 text-purple",
      Premium: "bg-primary/10 text-primary",
    };
    return (
      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[plan] || "bg-muted text-muted-foreground"}`}>
        {plan}
      </span>
    );
  };

  return (
    <Card className="bg-card border-border p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-xl font-semibold">
          Todos os <em className="text-primary">Tenants</em>
        </h3>
        <Button onClick={onNewTenant} className="bg-primary text-primary-foreground">
          + Novo Tenant
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Input
          placeholder="Buscar por nome ou slug..."
          className="max-w-[300px] bg-muted border-border text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] bg-muted border-border text-sm">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Salão</th>
              <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Slug</th>
              <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Plano</th>
              <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Status</th>
              <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Criado em</th>
              <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tenant) => {
              const sub = (tenant as any).tenant_subscriptions?.[0];
              return (
                <tr key={tenant.id} className="border-b border-border hover:bg-muted/30">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-primary">
                        {getInitials(tenant.name)}
                      </div>
                      <strong>{tenant.name}</strong>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{tenant.slug}</td>
                  <td className="py-3 px-4">{getPlanBadge(sub)}</td>
                  <td className="py-3 px-4">{getStatusBadge(tenant.is_active)}</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {new Date(tenant.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="py-3 px-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs border-border"
                      onClick={() => onViewTenant(tenant.id)}
                    >
                      Detalhes
                    </Button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  Nenhum tenant encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-muted-foreground">
          Mostrando {filtered.length} de {tenants.length} tenants
        </p>
      </div>
    </Card>
  );
}
