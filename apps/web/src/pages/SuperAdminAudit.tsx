import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AuditLog {
  id: string;
  user_id: string | null;
  tenant_id: string | null;
  entity: string;
  action: string;
  module: string | null;
  entity_type: string | null;
  metadata_json: any;
  created_at: string;
}

export default function SuperAdminAudit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      setLogs((data as any) || []);
      setLoading(false);
    };
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold text-foreground">Logs de Auditoria</h2>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center">
            <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-body text-sm text-muted-foreground">Nenhum log de auditoria registrado</p>
            <p className="font-body text-xs text-muted-foreground mt-1">
              As ações realizadas na plataforma aparecerão aqui
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-body text-sm font-medium text-foreground">
                          {log.action}
                        </span>
                        {log.module && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-body font-medium">
                            {log.module}
                          </span>
                        )}
                        {log.entity_type && (
                          <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-[10px] font-body">
                            {log.entity_type}
                          </span>
                        )}
                      </div>
                      <p className="font-body text-xs text-muted-foreground mt-1">
                        {log.entity}
                        {log.tenant_id && ` · Tenant: ${log.tenant_id.slice(0, 8)}...`}
                      </p>
                    </div>
                    <span className="font-body text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
