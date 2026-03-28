import { useState } from "react";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSalon } from "@/hooks/useSalon";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import {
  getFinanceiroByService,
  getFinanceiroClientes,
  type FinanceiroByService,
  type FinanceiroClientes,
} from "@/services/adminDashboardService";
import { Users, RefreshCw, UserPlus, Clock } from "lucide-react";
import { getErrorMessage } from "@/hooks/useQueryError";
import { defaultDateFrom, defaultDateTo } from "@/lib/dateUtils";

export default function AdminFinanceiro() {
  const { data: salon } = useSalon();
  const [dateFrom, setDateFrom] = useState(defaultDateFrom);
  const [dateTo, setDateTo] = useState(defaultDateTo);
  const [proFilter, setProFilter] = useState("all");

  const { data: dashData, isLoading: dashLoading, error: dashError } = useAdminDashboard(
    salon?.id,
    dateFrom,
    dateTo
  );

  const { data: serviceData, isLoading: serviceLoading, error: serviceError } = useQuery<FinanceiroByService[]>({
    enabled: !!salon?.id,
    queryFn: () => getFinanceiroByService(salon!.id, dateFrom, dateTo),
    queryKey: ["financeiro-by-service", salon?.id, dateFrom, dateTo],
  });

  const { data: clientesData, isLoading: clientesLoading } = useQuery<FinanceiroClientes>({
    enabled: !!salon?.id,
    queryFn: () => getFinanceiroClientes(salon!.id, dateFrom, dateTo),
    queryKey: ["financeiro-clientes", salon?.id, dateFrom, dateTo],
  });

  const financial = dashData?.financial ?? {
    commission: 0,
    confirmedCount: 0,
    count: 0,
    pendingRevenue: 0,
    profit: 0,
    revenue: 0,
  };
  const allProStats = dashData?.proStats ?? [];
  const proStats = proFilter === "all" ? allProStats : allProStats.filter((p) => p.id === proFilter);
  const services = serviceData ?? [];

  const isLoading = dashLoading || serviceLoading || clientesLoading;
  const clientes = clientesData ?? null;
  const errorMsg = getErrorMessage(dashError ?? serviceError ?? null);

  const ticketMedio = financial.count > 0 ? financial.revenue / financial.count : 0;

  function handleExport() {
    if (!dashData) return;

    // Sheet 1: Por Profissional
    const proSheet = allProStats.map((p) => ({
      Profissional: p.name,
      "Atendimentos": p.count,
      "Faturamento (R$)": p.revenue.toFixed(2),
      "Comissão (R$)": p.commission.toFixed(2),
      "Lucro (R$)": p.profit.toFixed(2),
      "Ticket Médio (R$)": p.ticket.toFixed(2),
      "Ocupação (min)": p.occupied,
    }));

    // Sheet 2: Por Serviço
    const svcSheet = services.map((s) => ({
      Serviço: s.serviceName,
      "Atendimentos": s.count,
      "Faturamento (R$)": s.revenue.toFixed(2),
      "% do Total": s.percentOfTotal.toFixed(1) + "%",
    }));

    // Sheet 3: Resumo financeiro
    const resumoSheet = [
      { Métrica: "Faturamento", "Valor (R$)": financial.revenue.toFixed(2) },
      { Métrica: "Comissões Pagas", "Valor (R$)": financial.commission.toFixed(2) },
      { Métrica: "Lucro Líquido", "Valor (R$)": financial.profit.toFixed(2) },
      { Métrica: "Ticket Médio", "Valor (R$)": ticketMedio.toFixed(2) },
      { Métrica: "Atendimentos Concluídos", "Valor (R$)": String(financial.count) },
      { Métrica: "A Receber (confirmados)", "Valor (R$)": financial.pendingRevenue.toFixed(2) },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumoSheet), "Resumo");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(proSheet), "Por Profissional");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(svcSheet), "Por Serviço");

    const month = dateFrom.slice(0, 7);
    XLSX.writeFile(wb, `financeiro_${month}.xlsx`);
  }

  if (!salon) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <p className="font-body text-sm text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="font-body text-xs text-muted-foreground block mb-1">De</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-secondary border-border font-body h-8 text-xs w-36"
              />
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground block mb-1">Até</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-secondary border-border font-body h-8 text-xs w-36"
              />
            </div>
            <div>
              <label className="font-body text-xs text-muted-foreground block mb-1">Profissional</label>
              <Select value={proFilter} onValueChange={setProFilter}>
                <SelectTrigger className="bg-secondary border-border font-body h-8 text-xs w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">Todos</SelectItem>
                  {allProStats.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleExport}
              disabled={isLoading || !dashData}
              className="h-8 text-xs gap-1.5 ml-auto"
              variant="outline"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {errorMsg && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="font-body text-sm text-destructive">{errorMsg}</p>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="font-body text-sm text-muted-foreground">Carregando dados financeiros...</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !errorMsg && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { color: "text-primary", label: "Faturamento", value: `R$ ${financial.revenue.toFixed(2)}` },
              { color: "text-yellow-400", label: "Comissões Pagas", value: `R$ ${financial.commission.toFixed(2)}` },
              { color: "text-green-400", label: "Lucro Líquido", value: `R$ ${financial.profit.toFixed(2)}` },
              { color: "text-foreground", label: "Ticket Médio", value: `R$ ${ticketMedio.toFixed(2)}` },
              { color: "text-foreground", label: "Atendimentos", value: String(financial.count) },
              { color: "text-blue-400", label: "A Receber", value: `R$ ${financial.pendingRevenue.toFixed(2)}` },
            ].map((c) => (
              <Card key={c.label} className="bg-card border-border">
                <CardContent className="p-3 text-center">
                  <p className="font-body text-xs text-muted-foreground mb-1">{c.label}</p>
                  <p className={`font-display text-base font-bold ${c.color}`}>{c.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Por Profissional */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">Por Profissional</CardTitle>
            </CardHeader>
            <CardContent>
              {proStats.length === 0 ? (
                <p className="font-body text-sm text-muted-foreground">Nenhum dado no período.</p>
              ) : (
                <>
                  {/* Mobile */}
                  <div className="md:hidden space-y-2">
                    {proStats.map((p) => (
                      <div key={p.id} className="p-3 rounded-lg bg-secondary border border-border space-y-1">
                        <p className="font-body font-semibold text-foreground text-sm">{p.name}</p>
                        <div className="grid grid-cols-2 gap-1 font-body text-xs">
                          <span className="text-muted-foreground">Atendimentos:</span>
                          <span className="text-foreground text-right">{p.count}</span>
                          <span className="text-muted-foreground">Faturamento:</span>
                          <span className="text-primary text-right">R$ {p.revenue.toFixed(2)}</span>
                          <span className="text-muted-foreground">Comissão:</span>
                          <span className="text-yellow-400 text-right">R$ {p.commission.toFixed(2)}</span>
                          <span className="text-muted-foreground">Lucro:</span>
                          <span className="text-green-400 text-right">R$ {p.profit.toFixed(2)}</span>
                          <span className="text-muted-foreground">Ticket Médio:</span>
                          <span className="text-foreground text-right">R$ {p.ticket.toFixed(2)}</span>
                          <span className="text-muted-foreground">Ocupação:</span>
                          <span className="text-foreground text-right">{p.occupied}min</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Desktop */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full font-body text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground border-b border-border">
                          <th className="pb-2">Profissional</th>
                          <th className="pb-2 text-right">Atend.</th>
                          <th className="pb-2 text-right">Faturamento</th>
                          <th className="pb-2 text-right">Comissão</th>
                          <th className="pb-2 text-right">Lucro</th>
                          <th className="pb-2 text-right">Ticket Médio</th>
                          <th className="pb-2 text-right">Ocupação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {proStats.map((p) => (
                          <tr key={p.id} className="border-b border-border/50">
                            <td className="py-2 text-foreground font-medium">{p.name}</td>
                            <td className="py-2 text-right">{p.count}</td>
                            <td className="py-2 text-right text-primary">R$ {p.revenue.toFixed(2)}</td>
                            <td className="py-2 text-right text-yellow-400">R$ {p.commission.toFixed(2)}</td>
                            <td className="py-2 text-right text-green-400">R$ {p.profit.toFixed(2)}</td>
                            <td className="py-2 text-right">R$ {p.ticket.toFixed(2)}</td>
                            <td className="py-2 text-right">{p.occupied}min</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Por Serviço */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">Por Serviço</CardTitle>
            </CardHeader>
            <CardContent>
              {services.length === 0 ? (
                <p className="font-body text-sm text-muted-foreground">Nenhum dado no período.</p>
              ) : (
                <>
                  {/* Mobile */}
                  <div className="md:hidden space-y-2">
                    {services.map((s) => (
                      <div key={s.serviceId} className="p-3 rounded-lg bg-secondary border border-border space-y-1">
                        <p className="font-body font-semibold text-foreground text-sm">{s.serviceName}</p>
                        <div className="grid grid-cols-2 gap-1 font-body text-xs">
                          <span className="text-muted-foreground">Atendimentos:</span>
                          <span className="text-foreground text-right">{s.count}</span>
                          <span className="text-muted-foreground">Faturamento:</span>
                          <span className="text-primary text-right">R$ {s.revenue.toFixed(2)}</span>
                          <span className="text-muted-foreground">% do Total:</span>
                          <span className="text-foreground text-right">{s.percentOfTotal.toFixed(1)}%</span>
                        </div>
                        {/* Bar indicator */}
                        <div className="mt-1.5 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.min(s.percentOfTotal, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Desktop */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full font-body text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground border-b border-border">
                          <th className="pb-2">Serviço</th>
                          <th className="pb-2 text-right">Atend.</th>
                          <th className="pb-2 text-right">Faturamento</th>
                          <th className="pb-2 text-right">% do Total</th>
                          <th className="pb-2">Participação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {services.map((s) => (
                          <tr key={s.serviceId} className="border-b border-border/50">
                            <td className="py-2 text-foreground font-medium">{s.serviceName}</td>
                            <td className="py-2 text-right">{s.count}</td>
                            <td className="py-2 text-right text-primary">R$ {s.revenue.toFixed(2)}</td>
                            <td className="py-2 text-right">{s.percentOfTotal.toFixed(1)}%</td>
                            <td className="py-2 pl-4 w-32">
                              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${Math.min(s.percentOfTotal, 100)}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Comissões a Pagar */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">Comissões a Pagar</CardTitle>
              <p className="font-body text-xs text-muted-foreground">
                Baseado em agendamentos <span className="text-green-400 font-medium">confirmados</span> ainda não concluídos no período.
              </p>
            </CardHeader>
            <CardContent>
              {financial.confirmedCount === 0 ? (
                <p className="font-body text-sm text-muted-foreground">Nenhum agendamento confirmado pendente.</p>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-secondary border border-border flex items-center justify-between">
                    <div>
                      <p className="font-body text-xs text-muted-foreground">Agendamentos confirmados</p>
                      <p className="font-display text-lg font-bold text-foreground">{financial.confirmedCount}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-body text-xs text-muted-foreground">Receita a confirmar</p>
                      <p className="font-display text-lg font-bold text-blue-400">R$ {financial.pendingRevenue.toFixed(2)}</p>
                    </div>
                  </div>
                  <p className="font-body text-xs text-muted-foreground">
                    Para ver a comissão pendente por profissional, acesse a aba <span className="text-foreground font-medium">Profissionais</span> → selecione o profissional → aba Financeiro.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clientes */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Clientes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!clientes || clientes.totalUniqueClients === 0 ? (
                <p className="font-body text-sm text-muted-foreground">Nenhum dado de clientes no período.</p>
              ) : (
                <>
                  {/* Resumo cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-secondary border border-border text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <p className="font-body text-xs text-muted-foreground">Clientes únicos</p>
                      </div>
                      <p className="font-display text-lg font-bold text-foreground">{clientes.totalUniqueClients}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary border border-border text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <UserPlus className="w-3 h-3 text-muted-foreground" />
                        <p className="font-body text-xs text-muted-foreground">Novos</p>
                      </div>
                      <p className="font-display text-lg font-bold text-green-400">{clientes.newClients}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary border border-border text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <RefreshCw className="w-3 h-3 text-muted-foreground" />
                        <p className="font-body text-xs text-muted-foreground">Recorrentes</p>
                      </div>
                      <p className="font-display text-lg font-bold text-blue-400">{clientes.recurringClients}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary border border-border text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <p className="font-body text-xs text-muted-foreground">Intervalo médio</p>
                      </div>
                      <p className="font-display text-lg font-bold text-foreground">
                        {clientes.avgReturnIntervalDays !== null ? `${clientes.avgReturnIntervalDays}d` : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Taxa de retorno */}
                  {clientes.totalUniqueClients > 0 && (
                    <div className="p-3 rounded-lg bg-secondary border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-body text-xs text-muted-foreground">Taxa de retorno no período</p>
                        <p className="font-body text-xs font-semibold text-foreground">
                          {Math.round((clientes.recurringClients / clientes.totalUniqueClients) * 100)}%
                        </p>
                      </div>
                      <div className="h-2 bg-background rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-400 rounded-full transition-all"
                          style={{ width: `${Math.round((clientes.recurringClients / clientes.totalUniqueClients) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="font-body text-[10px] text-green-400">{clientes.newClients} novos</span>
                        <span className="font-body text-[10px] text-blue-400">{clientes.recurringClients} retornaram</span>
                      </div>
                    </div>
                  )}

                  {/* Top Clientes */}
                  <h4 className="font-display text-sm font-semibold text-foreground">Top Clientes por Gasto</h4>

                  {/* Mobile */}
                  <div className="md:hidden space-y-2">
                    {clientes.topClients.slice(0, 10).map((c, i) => (
                      <div key={c.phone} className="p-3 rounded-lg bg-secondary border border-border space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-body text-xs text-muted-foreground w-4">#{i + 1}</span>
                            <p className="font-body font-semibold text-foreground text-sm">{c.clientName}</p>
                          </div>
                          {c.isNew ? (
                            <span className="font-body text-[10px] text-green-400 border border-green-400/30 bg-green-400/10 px-1.5 py-0.5 rounded">Novo</span>
                          ) : (
                            <span className="font-body text-[10px] text-blue-400 border border-blue-400/30 bg-blue-400/10 px-1.5 py-0.5 rounded">Recorrente</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-1 font-body text-xs">
                          <span className="text-muted-foreground">Total gasto:</span>
                          <span className="text-primary text-right font-semibold">R$ {c.revenue.toFixed(2)}</span>
                          <span className="text-muted-foreground">Visitas:</span>
                          <span className="text-foreground text-right">{c.count}</span>
                          <span className="text-muted-foreground">Ticket médio:</span>
                          <span className="text-foreground text-right">R$ {c.ticket.toFixed(2)}</span>
                          {c.avgDaysBetweenVisits !== null && (
                            <>
                              <span className="text-muted-foreground">Retorna a cada:</span>
                              <span className="text-foreground text-right">{c.avgDaysBetweenVisits}d</span>
                            </>
                          )}
                        </div>
                        {c.topServices.length > 0 && (
                          <p className="font-body text-xs text-muted-foreground pt-1">
                            Serviços: <span className="text-foreground">{c.topServices.join(", ")}</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Desktop */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full font-body text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground border-b border-border">
                          <th className="pb-2">#</th>
                          <th className="pb-2">Cliente</th>
                          <th className="pb-2">Perfil</th>
                          <th className="pb-2 text-right">Visitas</th>
                          <th className="pb-2 text-right">Total Gasto</th>
                          <th className="pb-2 text-right">Ticket Médio</th>
                          <th className="pb-2 text-right">Retorna a cada</th>
                          <th className="pb-2">Serviços favoritos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientes.topClients.slice(0, 15).map((c, i) => (
                          <tr key={c.phone} className="border-b border-border/50">
                            <td className="py-2 text-muted-foreground text-xs">{i + 1}</td>
                            <td className="py-2 text-foreground font-medium">{c.clientName}</td>
                            <td className="py-2">
                              {c.isNew ? (
                                <span className="font-body text-[10px] text-green-400 border border-green-400/30 bg-green-400/10 px-1.5 py-0.5 rounded">Novo</span>
                              ) : (
                                <span className="font-body text-[10px] text-blue-400 border border-blue-400/30 bg-blue-400/10 px-1.5 py-0.5 rounded">Recorrente</span>
                              )}
                            </td>
                            <td className="py-2 text-right">{c.count}</td>
                            <td className="py-2 text-right text-primary font-semibold">R$ {c.revenue.toFixed(2)}</td>
                            <td className="py-2 text-right">R$ {c.ticket.toFixed(2)}</td>
                            <td className="py-2 text-right text-muted-foreground">
                              {c.avgDaysBetweenVisits !== null ? `${c.avgDaysBetweenVisits}d` : "—"}
                            </td>
                            <td className="py-2 text-muted-foreground text-xs">{c.topServices.join(", ") || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
