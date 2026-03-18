import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import AdminServices from "@/components/admin/AdminServices";
import AdminBookings from "@/components/admin/AdminBookings";
import AdminSalon from "@/components/admin/AdminSalon";
import AdminGallery from "@/components/admin/AdminGallery";
import AdminTestimonials from "@/components/admin/AdminTestimonials";
import AdminAvailability from "@/components/admin/AdminAvailability";
import AdminProfessionals from "@/components/admin/AdminProfessionals";
import AdminFinancials from "@/components/admin/AdminFinancials";
import AdminCalendar from "@/components/admin/AdminCalendar";
import { LogOut, LayoutDashboard, Menu, X } from "lucide-react";

export default function Admin() {
  const [session, setSession] = useState<any>(null);
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
    if (error) toast.error(error.message); else toast.success("Login realizado!");
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado!");
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
              <TabsTrigger value="salon" className="font-body text-xs md:text-sm whitespace-nowrap px-2 md:px-3">Salão</TabsTrigger>
              <TabsTrigger value="professionals" className="font-body text-xs md:text-sm whitespace-nowrap px-2 md:px-3">Profissionais</TabsTrigger>
              <TabsTrigger value="services" className="font-body text-xs md:text-sm whitespace-nowrap px-2 md:px-3">Serviços</TabsTrigger>
              <TabsTrigger value="bookings" className="font-body text-xs md:text-sm whitespace-nowrap px-2 md:px-3">Agendamentos</TabsTrigger>
              <TabsTrigger value="financials" className="font-body text-xs md:text-sm whitespace-nowrap px-2 md:px-3">Financeiro</TabsTrigger>
              <TabsTrigger value="availability" className="font-body text-xs md:text-sm whitespace-nowrap px-2 md:px-3">Disponibilidade</TabsTrigger>
              <TabsTrigger value="gallery" className="font-body text-xs md:text-sm whitespace-nowrap px-2 md:px-3">Galeria</TabsTrigger>
              <TabsTrigger value="testimonials" className="font-body text-xs md:text-sm whitespace-nowrap px-2 md:px-3">Depoimentos</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard"><DashboardOverview /></TabsContent>
          <TabsContent value="salon"><AdminSalon /></TabsContent>
          <TabsContent value="professionals"><AdminProfessionals /></TabsContent>
          <TabsContent value="services"><AdminServices /></TabsContent>
          <TabsContent value="bookings"><AdminBookings /></TabsContent>
          <TabsContent value="financials"><AdminFinancials /></TabsContent>
          <TabsContent value="availability"><AdminAvailability /></TabsContent>
          <TabsContent value="gallery"><AdminGallery /></TabsContent>
          <TabsContent value="testimonials"><AdminTestimonials /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function DashboardOverview() {
  const [stats, setStats] = useState({ bookings: 0, services: 0, pending: 0, professionals: 0 });

  useEffect(() => {
    async function load() {
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
    }
    load();
  }, []);

  const cards = [
    { label: "Total Agendamentos", value: stats.bookings, color: "text-primary" },
    { label: "Profissionais", value: stats.professionals, color: "text-foreground" },
    { label: "Serviços Ativos", value: stats.services, color: "text-foreground" },
    { label: "Pendentes", value: stats.pending, color: "text-destructive" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
      {cards.map((c) => (
        <Card key={c.label} className="bg-card border-border">
          <CardContent className="p-4 md:p-6 text-center">
            <p className="font-body text-xs md:text-sm text-muted-foreground mb-1 md:mb-2">{c.label}</p>
            <p className={`font-display text-2xl md:text-4xl font-bold ${c.color}`}>{c.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
