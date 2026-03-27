import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Users, MessageCircle, Search } from "lucide-react";
import { getPrimarySalonId } from "@/services/salonService";

interface ClientRow {
  id: string;
  salon_id: string;
  phone_normalized: string;
  preferred_name: string;
  last_seen_at: string | null;
  created_at: string;
  merged_into_id: string | null;
}

interface ClientStats {
  client_id: string;
  count: number;
  total: number;
  last_date: string | null;
}

const PAGE_SIZE = 30;

function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone;
  return "****" + phone.slice(-4);
}

export default function AdminClients() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [stats, setStats] = useState<Map<string, ClientStats>>(new Map());
  const [search, setSearch] = useState("");
  const [salonId, setSalonId] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => { load(0); }, []);

  async function load(p: number) {
    const id = await getPrimarySalonId();
    if (!id) return;
    setSalonId(id);

    const { data, error } = await (supabase as any)
      .from("clients")
      .select("*")
      .eq("salon_id", id)
      .is("merged_into_id", null)
      .order("last_seen_at", { ascending: false, nullsFirst: false })
      .range(p * PAGE_SIZE, (p + 1) * PAGE_SIZE - 1);

    if (error) { toast.error("Erro ao carregar clientes"); return; }
    const list: ClientRow[] = data || [];
    setClients(p === 0 ? list : (prev) => [...prev, ...list] as any);
    setHasMore(list.length === PAGE_SIZE);
    setPage(p);

    // Load booking stats for these clients
    if (list.length > 0) {
      const ids = list.map((c: ClientRow) => c.id);
      const { data: bks } = await supabase
        .from("bookings")
        .select("client_id, total_price, booking_date, status")
        .in("client_id" as any, ids)
        .in("status", ["confirmed", "completed"]);

      const m = new Map<string, ClientStats>();
      (bks || []).forEach((b: any) => {
        const existing = m.get(b.client_id) ?? { client_id: b.client_id, count: 0, total: 0, last_date: null };
        m.set(b.client_id, {
          client_id: b.client_id,
          count: existing.count + 1,
          total: existing.total + Number(b.total_price),
          last_date: !existing.last_date || b.booking_date > existing.last_date ? b.booking_date : existing.last_date,
        });
      });
      setStats((prev) => new Map([...prev, ...m]));
    }
  }

  const filtered = clients.filter((c) =>
    c.preferred_name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone_normalized.includes(search.replace(/\D/g, ""))
  );

  const total = filtered.length;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="font-display text-xl flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Clientes ({total})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-secondary border-border font-body pl-9"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-muted-foreground font-body text-sm">
            {clients.length === 0 ? "Nenhum cliente cadastrado ainda. Os clientes aparecem automaticamente ao agendar." : "Nenhum cliente encontrado."}
          </p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full font-body text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border text-xs">
                    <th className="pb-2 font-medium">Nome</th>
                    <th className="pb-2 font-medium">Telefone</th>
                    <th className="pb-2 font-medium text-right">Agendamentos</th>
                    <th className="pb-2 font-medium text-right">Total gasto</th>
                    <th className="pb-2 font-medium text-right">Ticket médio</th>
                    <th className="pb-2 font-medium text-right">Última visita</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const s = stats.get(c.id);
                    const ticket = s && s.count > 0 ? s.total / s.count : 0;
                    const phone = c.phone_normalized;
                    const whatsappPhone = phone.length === 11 ? `55${phone}` : phone.startsWith("55") ? phone : `55${phone}`;
                    return (
                      <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                        <td className="py-2 text-foreground font-medium">{c.preferred_name}</td>
                        <td className="py-2 text-muted-foreground font-mono text-xs">{maskPhone(phone)}</td>
                        <td className="py-2 text-right">{s?.count ?? 0}</td>
                        <td className="py-2 text-right text-primary">R$ {(s?.total ?? 0).toFixed(2)}</td>
                        <td className="py-2 text-right">R$ {ticket.toFixed(2)}</td>
                        <td className="py-2 text-right text-muted-foreground text-xs">
                          {s?.last_date ? new Date(`${s.last_date}T12:00:00`).toLocaleDateString("pt-BR") : (c.last_seen_at ? new Date(c.last_seen_at).toLocaleDateString("pt-BR") : "—")}
                        </td>
                        <td className="py-2 text-right">
                          <Button size="sm" variant="ghost" className="h-7 text-green-400 hover:text-green-300"
                            onClick={() => window.open(`https://wa.me/${whatsappPhone}`, "_blank")}>
                            <MessageCircle className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {filtered.map((c) => {
                const s = stats.get(c.id);
                const ticket = s && s.count > 0 ? s.total / s.count : 0;
                const phone = c.phone_normalized;
                const whatsappPhone = phone.startsWith("55") ? phone : `55${phone}`;
                return (
                  <div key={c.id} className="p-3 rounded-lg bg-secondary border border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-body font-semibold text-foreground text-sm">{c.preferred_name}</p>
                        <p className="font-mono text-xs text-muted-foreground">{maskPhone(phone)}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="h-8 text-green-400"
                        onClick={() => window.open(`https://wa.me/${whatsappPhone}`, "_blank")}>
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-1 mt-2 font-body text-xs text-muted-foreground">
                      <span>{s?.count ?? 0} agend.</span>
                      <span className="text-primary">R$ {(s?.total ?? 0).toFixed(2)}</span>
                      <span>ticket R$ {ticket.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button variant="outline" className="font-body" onClick={() => load(page + 1)}>
                  Carregar mais
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
