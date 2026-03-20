import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Search, Pencil, Power } from "lucide-react";
import { appToast } from "@/lib/toast";
import { supabase } from "@/integrations/supabase/client";
import { superadminApi } from "@/services/superadminApi";

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenant_id: string | null;
  active: boolean;
  created_at: string;
}

const roleLabels: Record<string, string> = {
  superadmin: "SuperAdmin",
  tenant_admin: "Admin Tenant",
  manager: "Gerente",
  professional: "Profissional",
};

const roleBadgeColors: Record<string, string> = {
  superadmin: "bg-primary/15 text-primary",
  tenant_admin: "bg-sky-400/15 text-sky-400",
  manager: "bg-violet-400/15 text-violet-400",
  professional: "bg-emerald-400/15 text-emerald-400",
};

export default function SuperAdminUsers() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "tenant_admin", tenant_id: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [{ data: usersData }, tenantsData] = await Promise.all([
      supabase.from("platform_users" as any).select("*").order("created_at", { ascending: false }),
      superadminApi.getTenants(),
    ]);
    setUsers((usersData as any) || []);
    setTenants(tenantsData || []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingUser(null);
    setForm({ name: "", email: "", role: "tenant_admin", tenant_id: "" });
    setDialogOpen(true);
  };

  const openEdit = (user: PlatformUser) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, role: user.role, tenant_id: user.tenant_id || "" });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, tenant_id: form.tenant_id || null, updated_at: new Date().toISOString() };
      if (editingUser) {
        await supabase.from("platform_users" as any).update(payload).eq("id", editingUser.id);
      } else {
        await supabase.from("platform_users" as any).insert(payload);
      }
      appToast.success(editingUser ? "Usuário atualizado!" : "Usuário criado!");
      setDialogOpen(false);
      await load();
    } catch {
      appToast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user: PlatformUser) => {
    await supabase.from("platform_users" as any).update({ active: !user.active }).eq("id", user.id);
    appToast.success(user.active ? "Usuário desativado" : "Usuário ativado");
    await load();
  };

  const getTenantName = (tenantId: string | null) => {
    if (!tenantId) return "Global";
    return tenants.find(t => t.id === tenantId)?.name || "—";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="font-display text-xl font-bold text-foreground">Usuários da Plataforma</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-primary text-primary-foreground gap-2">
              <Plus className="w-4 h-4" /> Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">{editingUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div><Label className="font-body text-sm">Nome</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-secondary border-border font-body mt-1" required /></div>
              <div><Label className="font-body text-sm">Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="bg-secondary border-border font-body mt-1" required /></div>
              <div><Label className="font-body text-sm">Perfil</Label>
                <Select value={form.role} onValueChange={v => setForm({...form, role: v})}>
                  <SelectTrigger className="bg-secondary border-border font-body mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="superadmin">SuperAdmin</SelectItem>
                    <SelectItem value="tenant_admin">Admin Tenant</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="professional">Profissional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.role !== "superadmin" && (
                <div><Label className="font-body text-sm">Tenant</Label>
                  <Select value={form.tenant_id} onValueChange={v => setForm({...form, tenant_id: v})}>
                    <SelectTrigger className="bg-secondary border-border font-body mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button type="submit" className="w-full bg-primary text-primary-foreground font-body" disabled={saving}>
                {saving ? "Salvando..." : editingUser ? "Atualizar" : "Criar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou email..." value={search} onChange={e => setSearch(e.target.value)} className="bg-secondary border-border font-body pl-10" />
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="bg-card border-border"><CardContent className="py-16 text-center"><Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" /><p className="font-body text-sm text-muted-foreground">Nenhum usuário encontrado</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(user => (
            <Card key={user.id} className="bg-card border-border">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="font-display text-sm font-bold text-primary">{user.name?.charAt(0)?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium text-foreground truncate">{user.name}</p>
                  <p className="font-body text-xs text-muted-foreground truncate">{user.email} · {getTenantName(user.tenant_id)}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-[10px] font-body font-medium ${roleBadgeColors[user.role] || 'bg-secondary text-foreground'}`}>
                  {roleLabels[user.role] || user.role}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(user)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(user)}>
                    <Power className={`w-3.5 h-3.5 ${user.active ? 'text-emerald-400' : 'text-destructive'}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
