import { useState, useEffect, useCallback } from "react";
import { type Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { formatAuthErrorMessage } from "@/integrations/supabase/authErrors";
import { ADMIN_ALLOWED_EMAILS } from "@/integrations/supabase/authConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import AdminServices from "@/components/admin/AdminServices";
import AdminBookings from "@/components/admin/AdminBookings";
import AdminSalon from "@/components/admin/AdminSalon";
import AdminProfessionals from "@/components/admin/AdminProfessionals";
import AdminCalendar from "@/components/admin/AdminCalendar";
import AdminAvisos from "@/components/admin/AdminAvisos";
import AdminClients from "@/components/admin/AdminClients";
import AdminFinanceiro from "@/components/admin/AdminFinanceiro";
import { useAdminDashboard, type AdminDashboardFinancialPro } from "@/hooks/useAdminDashboard";
import { getErrorMessage } from "@/hooks/useQueryError";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { LogOut, LayoutDashboard, ExternalLink, Bell, BellOff, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { useSalon } from "@/hooks/useSalon";
import { useRealtimeBookings } from "@/hooks/useBooking";
import { playNotificationSound, prewarmAudio } from "@/lib/notificationSound";
import { subscribeToPush, unsubscribeFromPush, getPushStatus, type PushStatus } from "@/lib/pushNotifications";

function useAdminEmailState(storageKey: string) {
  const [email, setEmail] = useState("");

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && "localStorage" in window) {
        const storedEmail = window.localStorage.getItem(storageKey);
        if (storedEmail !== null) {
          setEmail(storedEmail);
        }
      }
    } catch {
      // Ignore localStorage errors and fall back to in-memory state
    }
  }, [storageKey]);

  const updateEmail = useCallback((value: string) => {
    setEmail(value);
    try {
      if (typeof window !== "undefined" && "localStorage" in window) {
        window.localStorage.setItem(storageKey, value);
      }
    } catch {
      // Ignore localStorage errors; state is still updated in memory
    }
  }, [storageKey]);

  return [email, updateEmail] as const;
}

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useAdminEmailState("feitico:form:admin-email");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [sessionExpiredModal, setSessionExpiredModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { data: salon } = useSalon();
  const [newBookingCount, setNewBookingCount] = useState(0);
  const [pushStatus, setPushStatus] = useState<PushStatus>(() => getPushStatus());

  async function handleTogglePush() {
    if (!salon?.id) { toast.error("Salão não carregado"); return; }
    if (pushStatus === "granted") {
      await unsubscribeFromPush();
      setPushStatus(getPushStatus());
      toast.success("Notificações desativadas");
    } else {
      const ok = await subscribeToPush(salon.id);
      setPushStatus(getPushStatus());
      if (ok) toast.success("Notificações ativadas! Você receberá alertas de novos agendamentos.");
      else toast.error("Não foi possível ativar notificações. Verifique as permissões do navegador.");
    }
  }

  const handleNewBooking = useCallback((booking: Record<string, unknown>) => {
    playNotificationSound();
    setNewBookingCount((n) => n + 1);
    const name = (booking.customer_name as string) || "Cliente";
    const time = (booking.booking_time as string) || "";
    toast("Novo agendamento!", {
      description: `${name}${time ? ` às ${time}` : ""}`,
      duration: 8000,
    });
  }, []);

  useRealtimeBookings(salon?.id, handleNewBooking);

  useEffect(() => {
    document.title = newBookingCount > 0
      ? `(${newBookingCount}) Feitiço Admin`
      : "Feitiço Admin";
  }, [newBookingCount]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const handleSessionExpired = () => setSessionExpiredModal(true);
    window.addEventListener("feitico:session-expired", handleSessionExpired);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("feitico:session-expired", handleSessionExpired);
    };
  }, []);

  const handleSessionExpiredRelogin = async () => {
    setSessionExpiredModal(false);
    await supabase.auth.signOut();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) toast.error(formatAuthErrorMessage(error)); else toast.success("Login realizado!");
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado!");
  };

  const currentUserEmail = session?.user?.email?.toLowerCase() || "";
  const isAdminRestricted = ADMIN_ALLOWED_EMAILS.length > 0;
  const isAdminAllowed = !isAdminRestricted || ADMIN_ALLOWED_EMAILS.includes(currentUserEmail);

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
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => {
                  const v = e.target.value.trim().toLowerCase();
                  setEmail(v);
                  try { localStorage.setItem("feitico:form:admin-email", v); } catch { /* silencioso */ }
                }}
                className="bg-secondary border-border font-body h-12"
                required
              />
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary border-border font-body h-12 pr-12"
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground font-body h-12" disabled={authLoading}>
                {authLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdminAllowed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-border">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl text-gradient-gold">Acesso negado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center font-body">
              Este usuário não está autorizado para o painel administrativo deste salão.
            </p>
            <Button type="button" className="w-full bg-primary text-primary-foreground font-body h-12" onClick={handleLogout}>
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" onClick={prewarmAudio}>
      <Dialog open={sessionExpiredModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="font-display text-gradient-gold">Sessão expirada</DialogTitle>
            <DialogDescription className="font-body text-muted-foreground pt-1">
              Sua sessão de administrador expirou após 2 dias. Por segurança, você precisa fazer login novamente para continuar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="w-full bg-primary text-primary-foreground font-body h-11" onClick={handleSessionExpiredRelogin}>
              Fazer login novamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <header className="border-b border-border bg-card px-3 md:px-6 py-3 md:py-4 flex items-center justify-between sticky top-0 z-50 overflow-hidden">
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          <LayoutDashboard className="w-5 h-5 text-primary shrink-0" />
          <h1 className="font-display text-base md:text-xl font-bold text-gradient-gold truncate">Painel Admin</h1>
        </div>
        <div className="flex items-center gap-1 md:gap-3 shrink-0 ml-2">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-body shrink-0">
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ver Site</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleTogglePush}
            title={pushStatus === "granted" ? "Notificações ativas — clique para desativar" : "Ativar notificações push"}
            className={`shrink-0 h-8 w-8 rounded-full ${pushStatus === "granted" ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-muted-foreground hover:text-foreground"}`}
          >
            {pushStatus === "granted" ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </Button>
          <span className="hidden md:inline text-sm text-muted-foreground font-body truncate max-w-[160px]">{session.user.email}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="shrink-0 h-8 px-2">
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline ml-1">Sair</span>
          </Button>
        </div>
      </header>

      <div className="container py-4 md:py-8 px-3 md:px-4">
        <Tabs defaultValue="avisos" className="space-y-4 md:space-y-6" onValueChange={() => { setNewBookingCount(0); document.title = "Feitiço Admin"; }}>
          <div className="overflow-x-auto -mx-3 px-3 pb-1 md:mx-0 md:px-0 md:pb-0 scrollbar-hide">
            <TabsList className="bg-secondary border border-border inline-flex w-max min-w-full md:min-w-0 h-auto gap-0.5 p-1">
              <TabsTrigger value="avisos" className="font-body text-xs whitespace-nowrap px-2.5 py-1.5 relative">
                Avisos
                {newBookingCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{newBookingCount > 9 ? "9+" : newBookingCount}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="font-body text-xs whitespace-nowrap px-2.5 py-1.5">Dashboard</TabsTrigger>
              <TabsTrigger value="financeiro" className="font-body text-xs whitespace-nowrap px-2.5 py-1.5">Financeiro</TabsTrigger>
              <TabsTrigger value="calendar" className="font-body text-xs whitespace-nowrap px-2.5 py-1.5">Agenda</TabsTrigger>
              <TabsTrigger value="salon" className="font-body text-xs whitespace-nowrap px-2.5 py-1.5">Salão</TabsTrigger>
              <TabsTrigger value="professionals" className="font-body text-xs whitespace-nowrap px-2.5 py-1.5">Profissionais</TabsTrigger>
              <TabsTrigger value="services" className="font-body text-xs whitespace-nowrap px-2.5 py-1.5">Serviços</TabsTrigger>
              <TabsTrigger value="bookings" className="font-body text-xs whitespace-nowrap px-2.5 py-1.5">Agendamentos</TabsTrigger>
              <TabsTrigger value="clients" className="font-body text-xs whitespace-nowrap px-2.5 py-1.5">Clientes</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="avisos"><AdminAvisos /></TabsContent>
          <TabsContent value="dashboard"><DashboardOverview /></TabsContent>
          <TabsContent value="financeiro"><AdminFinanceiro /></TabsContent>
          <TabsContent value="calendar"><AdminCalendar /></TabsContent>
          <TabsContent value="salon"><AdminSalon /></TabsContent>
          <TabsContent value="professionals"><AdminProfessionals /></TabsContent>
          <TabsContent value="services"><AdminServices /></TabsContent>
          <TabsContent value="bookings"><AdminBookings /></TabsContent>
          <TabsContent value="clients"><AdminClients /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function DashboardOverview() {
  const { data: salon, error: salonError, isLoading: isSalonLoading } = useSalon();
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const { data, error, isLoading } = useAdminDashboard(salon?.id, dateFrom, dateTo);
  const stats = data?.stats ?? { bookings: 0, services: 0, pending: 0, professionals: 0 };
  const financial = data?.financial ?? { revenue: 0, commission: 0, profit: 0, count: 0, pendingRevenue: 0, confirmedCount: 0 };
  const proStats = data?.proStats ?? [];
  const dashboardError = getErrorMessage(salonError ?? error);

  const summaryCards = [
    { label: "Agendamentos", value: String(stats.bookings), color: "text-primary" },
    { label: "Profissionais", value: String(stats.professionals), color: "text-foreground" },
    { label: "Serviços", value: String(stats.services), color: "text-foreground" },
    { label: "Pendentes", value: String(stats.pending), color: "text-destructive" },
  ];

  if (isSalonLoading || (!salon && !dashboardError)) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <p className="font-body text-sm text-muted-foreground">Carregando salao...</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <p className="font-body text-sm text-muted-foreground">Carregando dashboard...</p>
        </CardContent>
      </Card>
    );
  }

  if (dashboardError) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <p className="font-body text-sm text-destructive">{dashboardError}</p>
        </CardContent>
      </Card>
    );
  }

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
                    {proStats.map((p: AdminDashboardFinancialPro) => (
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
