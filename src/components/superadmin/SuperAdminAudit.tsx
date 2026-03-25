import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SuperAdminAudit() {
  const [moduleFilter, setModuleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  const { data: logs = [] } = useQuery({
    queryKey: ["superadmin-audit", moduleFilter, actionFilter],
    queryFn: async () => {
      let query = supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(50);
      if (moduleFilter !== "all") query = query.eq("module", moduleFilter);
      if (actionFilter !== "all") query = query.eq("action", actionFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const dotColor: Record<string, string> = {
    CREATE: "bg-success",
    UPDATE: "bg-info",
    DELETE: "bg-destructive",
    LOGIN: "bg-primary",
  };

  return (
    <Card className="bg-card border-border p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-xl font-semibold">
          Audit <em className="text-primary">Logs</em>
        </h3>
        <Button variant="outline" className="border-border">↓ Exportar CSV</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-[160px] bg-muted border-border text-sm">
            <SelectValue placeholder="Todos os módulos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os módulos</SelectItem>
            <SelectItem value="Tenants">Tenants</SelectItem>
            <SelectItem value="Bookings">Agendamentos</SelectItem>
            <SelectItem value="Professionals">Profissionais</SelectItem>
            <SelectItem value="Services">Serviços</SelectItem>
            <SelectItem value="Auth">Autenticação</SelectItem>
            <SelectItem value="Settings">Configurações</SelectItem>
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[160px] bg-muted border-border text-sm">
            <SelectValue placeholder="Todas as ações" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            <SelectItem value="CREATE">Criar</SelectItem>
            <SelectItem value="UPDATE">Atualizar</SelectItem>
            <SelectItem value="DELETE">Excluir</SelectItem>
            <SelectItem value="LOGIN">Login</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-0">
        {logs.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">Nenhum log encontrado.</p>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-3 py-3 border-b border-border last:border-0">
            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${dotColor[log.action] || "bg-muted-foreground"}`} />
            <div>
              <p className="text-sm">
                <strong className="text-primary">{log.user_name || log.user_email || "Sistema"}</strong>{" "}
                {log.action.toLowerCase()} — {log.module}
                {log.description && <span className="text-muted-foreground"> ({log.description})</span>}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Módulo: {log.module} · Ação: {log.action} · {new Date(log.created_at).toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-muted-foreground">Mostrando {logs.length} logs</p>
      </div>
    </Card>
  );
}
