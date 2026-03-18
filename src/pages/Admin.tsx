import { useState, useEffect, useCallback } from "react";
import { type Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { appToast } from "@/lib/toast";
import AdminServices from "@/components/admin/AdminServices";
import AdminBookings from "@/components/admin/AdminBookings";
import AdminSalon from "@/components/admin/AdminSalon";
import AdminGallery from "@/components/admin/AdminGallery";
import AdminTestimonials from "@/components/admin/AdminTestimonials";
import AdminAvailability from "@/components/admin/AdminAvailability";
import AdminProfessionals from "@/components/admin/AdminProfessionals";
import AdminCalendar from "@/components/admin/AdminCalendar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LogOut, LayoutDashboard, Menu, X } from "lucide-react";

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) appToast.error(error.message); else appToast.success("Login realizado!");
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    appToast.success("Logout realizado!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-border">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl text-gradient-gold">Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-secondary border-border font-body h-12" required />
              <Input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-secondary border-border font-body h-12" required />
              <Button type="submit" className="w-full bg-primary text-primary-foreground font-body h-12" disabled={authLoading}>
                {authLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 md:px-6 py-3 md:py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 md:gap-3">
          <LayoutDashboard className="w-5 h-5 text-primary" />
          <h1 className="font-display text-lg md:text-xl font-bold text-gradient-gold">Painel Admin</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <span className="hidden sm:inline text-sm text-muted-foreground font-body truncate max-w-[200px]">{session.user.email}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="shrink-0">
            <LogOut className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      <div className="container py-4 md:py-8 px-3 md:px-4">
        <Tabs defaultValue="dashboard" className="space-y-4 md:space-y-6">
          <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0">
            <TabsList className="bg-secondary border border-border inline-flex w-auto min-w-full md:min-w-0 h-auto gap-1 p-1">
              <TabsTrigger value="dashboard" className="font-body text-xs md:text-sm whitespace-nowrap px-2 md:px-3">Dashboard</TabsTrigger>
              <TabsTrigger value="calendar" className="font-body text-xs md:text-sm whitespace-nowrap px-2 md:px-3">Agenda</TabsTrigger>
              <TabsTrigger value="salon" className="font-body text-xs md:text-sm whitespace-nowrap px-2 md:px-3">Salão</TabsTrigger>
              <TabsTrigger value="professionals" className="font-body text-xs md:text-sm whitespace-nowrap px-2 md:px-3">Profissionais</TabsTrigger>
              <TabsTrigger value="services" className="font-body text-xs md:text-sm whitespace-nowrap px-2 md:px-3">Serviços</TabsTrigger>
              <TabsTrigger value="bookings" className="font-body text-xs md:text-sm whitespace-nowrap px-2 md:px-3">Agendamentos</TabsTrigger>
              <TabsTrigger value="availability" className="font-body text-xs md:text-sm whitespace-nowrap px-2 md:px-3">Disponibilidade</TabsTrigger>
              <TabsTrigger value="gallery" className="font-body text-xs md:text-sm whitespace-nowrap px-2 md:px-3">Galeria</TabsTrigger>
              <TabsTrigger value="testimonials" className="font-body text-xs md:text-sm whitespace-nowrap px-2 md:px-3">Depoimentos</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard"><ErrorBoundary fallbackTitle="Erro no Dashboard"><DashboardOverview /></ErrorBoundary></TabsContent>
          <TabsContent value="calendar"><ErrorBoundary fallbackTitle="Erro na Agenda"><AdminCalendar /></ErrorBoundary></TabsContent>
          <TabsContent value="salon"><ErrorBoundary fallbackTitle="Erro no Salão"><AdminSalon /></ErrorBoundary></TabsContent>
          <TabsContent value="professionals"><ErrorBoundary fallbackTitle="Erro em Profissionais"><AdminProfessionals /></ErrorBoundary></TabsContent>
          <TabsContent value="services"><ErrorBoundary fallbackTitle="Erro em Serviços"><AdminServices /></ErrorBoundary></TabsContent>
          <TabsContent value="bookings"><ErrorBoundary fallbackTitle="Erro em Agendamentos"><AdminBookings /></ErrorBoundary></TabsContent>
          <TabsContent value="availability"><ErrorBoundary fallbackTitle="Erro na Disponibilidade"><AdminAvailability /></ErrorBoundary></TabsContent>
          <TabsContent value="gallery"><ErrorBoundary fallbackTitle="Erro na Galeria"><AdminGallery /></ErrorBoundary></TabsContent>
          <TabsContent value="testimonials"><ErrorBoundary fallbackTitle="Erro nos Depoimentos"><AdminTestimonials /></ErrorBoundary></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface FinancialPro {
  id: string;
  name: string;
  revenue: number;
  commission: number;
  profit: number;
  count: number;
  ticket: number;
  occupied: number;
}

function DashboardOverview() {
  const [stats, setStats] = useState({ bookings: 0, services: 0, pending: 0, professionals: 0 });
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [financial, setFinancial] = useState({ revenue: 0, commission: 0, profit: 0, count: 0, pendingRevenue: 0, confirmedCount: 0 });
  const [proStats, setProStats] = useState<FinancialPro[]>([]);

  const loadStats = useCallback(async () => {
    const [{ count: bookings }, { count: services }, { count: pending }, { count: professionals }] = await Promise.all([
      supabase.from("bookings").select("*", { count: "exact", head: true }),
      supabase.from("services").select("*", { count: "exact", head: true }),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("professionals").select("*", { count: "exact", head: true }),
    ]);

    setStats({
      bookings: bookings || 0,
      services: services || 0,
      pending: pending || 0,
      professionals: professionals || 0,
    });
  }, []);

  const loadFinancial = useCallback(async () => {
    const { data: salon } = await supabase.from("salons").select("id").limit(1).maybeSingle();
    if (!salon) return;

    const { data: pros } = await supabase.from("professionals").select("id, name").eq("salon_id", salon.id);
    const { data: bks } = await supabase
      .from("bookings")
      .select("professional_id, total_price, commission_amount, profit_amount, total_occupied_minutes, total_duration, status")
      .eq("salon_id", salon.id)
      .in("status", ["confirmed", "completed"])
      .gte("booking_date", dateFrom)
      .lte("booking_date", dateTo);

    const allBookings = bks || [];
    const completedBookings = allBookings.filter((b) => b.status === "completed");
    const confirmedBookings = allBookings.filter((b) => b.status === "confirmed");

    const totalRevenue = completedBookings.reduce((a, b) => a + Number(b.total_price), 0);
    const totalCommission = completedBookings.reduce((a, b) => a + Number(b.commission_amount || 0), 0);
    const totalProfit = completedBookings.reduce((a, b) => a + Number(b.profit_amount || 0), 0);
    const pendingRevenue = confirmedBookings.reduce((a, b) => a + Number(b.total_price), 0);
    setFinancial({
      revenue: totalRevenue,
      commission: totalCommission,
      profit: totalProfit,
      count: completedBookings.length,
      pendingRevenue,
      confirmedCount: confirmedBookings.length,
    });

    const professionalStats = (pros || [])
      .map((p) => {
        const pBookings = allBookings.filter((b) => b.professional_id === p.id);
        const revenue = pBookings.reduce((a, b) => a + Number(b.total_price), 0);
        const commission = pBookings.reduce((a, b) => a + Number(b.commission_amount || 0), 0);
        const profit = pBookings.reduce((a, b) => a + Number(b.profit_amount || 0), 0);
        const count = pBookings.length;
        const occupied = pBookings.reduce((a, b) => a + (b.total_occupied_minutes || b.total_duration || 0), 0);
        return {
          id: p.id,
          name: p.name,
          revenue,
          commission,
          profit,
          count,
          occupied,
          ticket: count > 0 ? revenue / count : 0,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    setProStats(professionalStats);
  }, [dateFrom, dateTo]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    void loadFinancial();
  }, [loadFinancial]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-dashboard-bookings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          void loadStats();
          void loadFinancial();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadFinancial, loadStats]);

  const summaryCards = [
    { label: "Agendamentos", value: String(stats.bookings), color: "text-primary" },
    { label: "Profissionais", value: String(stats.professionals), color: "text-foreground" },
    { label: "Serviços", value: String(stats.services), color: "text-foreground" },
    { label: "Pendentes", value: String(stats.pending), color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      {/* General stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryCards.map((c) => (
          <Card key={c.label} className="bg-card border-border">
            <CardContent className="p-3 md:p-4 text-center">
              <p className="font-body text-xs text-muted-foreground mb-1">{c.label}</p>
              <p className={`font-display text-xl md:text-2xl font-bold ${c.color}`}>{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Financial section */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="font-display text-lg">Financeiro</CardTitle>
            <div className="flex gap-2">
              <div>
                <label className="font-body text-xs text-muted-foreground">De</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-secondary border-border font-body h-8 text-xs" />
              </div>
              <div>
                <label className="font-body text-xs text-muted-foreground">Até</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-secondary border-border font-body h-8 text-xs" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Faturamento", value: `R$ ${financial.revenue.toFixed(2)}`, color: "text-primary" },
              { label: "Comissões", value: `R$ ${financial.commission.toFixed(2)}`, color: "text-yellow-400" },
              { label: "Lucro Líquido", value: `R$ ${financial.profit.toFixed(2)}`, color: "text-green-400" },
              { label: "Concluídos", value: String(financial.count), color: "text-foreground" },
              { label: "A Receber (confirmados)", value: `R$ ${financial.pendingRevenue.toFixed(2)}`, color: "text-blue-400" },
            ].map((c) => (
              <div key={c.label} className="p-3 rounded-lg bg-secondary border border-border text-center">
                <p className="font-body text-xs text-muted-foreground mb-1">{c.label}</p>
                <p className={`font-display text-base md:text-lg font-bold ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Per-professional */}
          {proStats.length > 0 && (
            <>
              <h4 className="font-display text-sm font-semibold text-foreground mt-2">Por Profissional</h4>
              {/* Mobile cards */}
              <div className="md:hidden space-y-2">
                {proStats.map((p) => (
                  <div key={p.id} className="p-3 rounded-lg bg-secondary border border-border space-y-1">
                    <p className="font-body font-semibold text-foreground text-sm">{p.name}</p>
                    <div className="grid grid-cols-2 gap-1 font-body text-xs">
                      <span className="text-muted-foreground">Atend.:</span>
                      <span className="text-foreground text-right">{p.count}</span>
                      <span className="text-muted-foreground">Faturamento:</span>
                      <span className="text-primary text-right">R$ {p.revenue.toFixed(2)}</span>
                      <span className="text-muted-foreground">Comissão:</span>
                      <span className="text-yellow-400 text-right">R$ {p.commission.toFixed(2)}</span>
                      <span className="text-muted-foreground">Lucro:</span>
                      <span className="text-green-400 text-right">R$ {p.profit.toFixed(2)}</span>
                      <span className="text-muted-foreground">Ticket:</span>
                      <span className="text-foreground text-right">R$ {p.ticket.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full font-body text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="pb-2">Profissional</th>
                      <th className="pb-2 text-right">Atend.</th>
                      <th className="pb-2 text-right">Faturamento</th>
                      <th className="pb-2 text-right">Comissão</th>
                      <th className="pb-2 text-right">Lucro</th>
                      <th className="pb-2 text-right">Ticket</th>
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
    </div>
  );
}
