import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SuperAdminUsers() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const { data: users = [] } = useQuery({
    queryKey: ["superadmin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("platform_users").select("*, tenants(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = users.filter((u) => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    return true;
  });

  const getInitials = (name: string) => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const roleBadgeClass: Record<string, string> = {
    superadmin: "bg-primary/15 text-primary",
    tenant_admin: "bg-purple/15 text-purple",
    manager: "bg-info/15 text-info",
    professional: "bg-success/15 text-success",
  };

  return (
    <Card className="bg-card border-border p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-xl font-semibold">
          Usuários da <em className="text-primary">Plataforma</em>
        </h3>
        <Button className="bg-primary text-primary-foreground">+ Novo Usuário</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Input
          placeholder="Buscar por nome ou email..."
          className="max-w-[300px] bg-muted border-border text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px] bg-muted border-border text-sm">
            <SelectValue placeholder="Todos os roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os roles</SelectItem>
            <SelectItem value="superadmin">SuperAdmin</SelectItem>
            <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Nome</th>
              <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Email</th>
              <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Role</th>
              <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Tenant</th>
              <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Status</th>
              <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-b border-border hover:bg-muted/30">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-primary">
                      {getInitials(user.name)}
                    </div>
                    <strong>{user.name}</strong>
                  </div>
                </td>
                <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                <td className="py-3 px-4">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleBadgeClass[user.role] || "bg-muted text-muted-foreground"}`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  {(user as any).tenants?.name || "— (global)"}
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    user.active !== false ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  }`}>
                    {user.active !== false ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <Button variant="outline" size="sm" className="text-xs border-border">
                    Editar
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">Nenhum usuário encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-muted-foreground">Mostrando {filtered.length} de {users.length} usuários</p>
      </div>
    </Card>
  );
}
