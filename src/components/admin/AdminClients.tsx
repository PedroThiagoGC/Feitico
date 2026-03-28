import { useMemo, useState } from "react";
import { MessageCircle, Search, Users } from "lucide-react";
import { useInfiniteClients } from "@/hooks/useClients";
import { getErrorMessage } from "@/hooks/useQueryError";
import { useSalon } from "@/hooks/useSalon";
import { buildClientWhatsAppUrl } from "@/services/clientService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone;
  return `****${phone.slice(-4)}`;
}

export default function AdminClients() {
  const [search, setSearch] = useState("");
  const { data: salon, error: salonError, isLoading: isSalonLoading } = useSalon();
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteClients(salon?.id);

  const errorMessage = getErrorMessage(salonError ?? error);
  const clients = useMemo(
    () => data?.pages.flatMap((page) => page.clients) ?? [],
    [data]
  );

  const filteredClients = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const digitsOnlySearch = search.replace(/\D/g, "");

    if (!normalizedSearch && !digitsOnlySearch) return clients;

    return clients.filter((client) =>
      client.preferred_name.toLowerCase().includes(normalizedSearch) ||
      client.phone_normalized.includes(digitsOnlySearch)
    );
  }, [clients, search]);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="font-display text-xl flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Clientes ({filteredClients.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="bg-secondary border-border font-body pl-9"
          />
        </div>

        {isSalonLoading || (!salon && !errorMessage) ? (
          <p className="text-muted-foreground font-body text-sm">Carregando clientes...</p>
        ) : isLoading ? (
          <p className="text-muted-foreground font-body text-sm">Carregando clientes...</p>
        ) : errorMessage ? (
          <p className="text-destructive font-body text-sm">{errorMessage}</p>
        ) : filteredClients.length === 0 ? (
          <p className="text-muted-foreground font-body text-sm">
            {clients.length === 0
              ? "Nenhum cliente cadastrado ainda. Os clientes aparecem automaticamente ao agendar."
              : "Nenhum cliente encontrado."}
          </p>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[600px] font-body text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border text-xs">
                    <th className="pb-2 font-medium">Nome</th>
                    <th className="pb-2 font-medium">Telefone</th>
                    <th className="pb-2 font-medium text-right">Agendamentos</th>
                    <th className="pb-2 font-medium text-right">Total gasto</th>
                    <th className="pb-2 font-medium text-right">Ticket medio</th>
                    <th className="pb-2 font-medium text-right">Ultima visita</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => {
                    const ticket = client.stats.count > 0 ? client.stats.total / client.stats.count : 0;
                    const lastVisit =
                      client.stats.last_date ||
                      (client.last_seen_at ? new Date(client.last_seen_at).toISOString().split("T")[0] : null);

                    return (
                      <tr
                        key={client.id}
                        className="border-b border-border/50 hover:bg-secondary/50 transition-colors"
                      >
                        <td className="py-2 text-foreground font-medium">{client.preferred_name}</td>
                        <td className="py-2 text-muted-foreground font-mono text-xs">
                          {maskPhone(client.phone_normalized)}
                        </td>
                        <td className="py-2 text-right">{client.stats.count}</td>
                        <td className="py-2 text-right text-primary">R$ {client.stats.total.toFixed(2)}</td>
                        <td className="py-2 text-right">R$ {ticket.toFixed(2)}</td>
                        <td className="py-2 text-right text-muted-foreground text-xs">
                          {lastVisit
                            ? new Date(`${lastVisit}T12:00:00`).toLocaleDateString("pt-BR")
                            : "-"}
                        </td>
                        <td className="py-2 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-green-400 hover:text-green-300"
                            onClick={() => window.open(buildClientWhatsAppUrl(client.phone_normalized), "_blank")}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-2">
              {filteredClients.map((client) => {
                const ticket = client.stats.count > 0 ? client.stats.total / client.stats.count : 0;

                return (
                  <div key={client.id} className="p-3 rounded-lg bg-secondary border border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-body font-semibold text-foreground text-sm">
                          {client.preferred_name}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {maskPhone(client.phone_normalized)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-green-400"
                        onClick={() => window.open(buildClientWhatsAppUrl(client.phone_normalized), "_blank")}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-1 mt-2 font-body text-xs text-muted-foreground">
                      <span className="truncate">{client.stats.count} agend.</span>
                      <span className="text-primary truncate">R$ {client.stats.total.toFixed(2)}</span>
                      <span className="truncate">ticket R$ {ticket.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasNextPage && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  className="font-body"
                  onClick={() => void fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? "Carregando..." : "Carregar mais"}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
