import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Building2, Plus, Search, Pencil, Power } from "lucide-react";
import { appToast } from "@/lib/toast";
import { superadminApi } from "@/services/superadminApi";

interface Tenant {
  id: string;
  name: string;
  slug?: string;
  active: boolean;
  created_at: string;
  logo_url?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
}

export default function SuperAdminTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", phone: "", whatsapp: "", address: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await superadminApi.getTenants();
      setTenants(data || []);
    } catch (error) {
      console.error("Failed to load tenants:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = tenants.filter(
    (t) =>
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.slug?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingTenant(null);
    setForm({ name: "", slug: "", phone: "", whatsapp: "", address: "" });
    setDialogOpen(true);
  };

  const openEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setForm({
      name: tenant.name || "",
      slug: tenant.slug || "",
      phone: tenant.phone || "",
      whatsapp: tenant.whatsapp || "",
      address: tenant.address || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingTenant) {
        await superadminApi.updateTenant(editingTenant.id, form);
        appToast.success("Tenant atualizado!");
      } else {
        await superadminApi.createTenant(form);
        appToast.success("Tenant criado!");
      }
      setDialogOpen(false);
      await load();
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (tenant: Tenant) => {
    try {
      await superadminApi.updateTenant(tenant.id, { active: !tenant.active });
      appToast.success(tenant.active ? "Tenant desativado" : "Tenant ativado");
      await load();
    } catch (error) {
      appToast.error("Erro ao alterar status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Gerenciar Tenants</h2>
          <p className="font-body text-sm text-muted-foreground mt-1">
            {tenants.length} tenant{tenants.length !== 1 ? "s" : ""} cadastrado{tenants.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-primary text-primary-foreground gap-2">
              <Plus className="w-4 h-4" />
              Novo Tenant
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingTenant ? "Editar Tenant" : "Novo Tenant"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label className="font-body text-sm">Nome</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-secondary border-border font-body"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="font-body text-sm">Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="bg-secondary border-border font-body"
                  placeholder="meu-salao"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="font-body text-sm">Telefone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="bg-secondary border-border font-body"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-body text-sm">WhatsApp</Label>
                  <Input
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    className="bg-secondary border-border font-body"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-body text-sm">Endereço</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="bg-secondary border-border font-body"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground font-body"
                disabled={saving}
              >
                {saving ? "Salvando..." : editingTenant ? "Atualizar" : "Criar Tenant"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-secondary border-border font-body pl-10"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-4 flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-body text-sm text-muted-foreground">
              {search ? "Nenhum tenant encontrado" : "Nenhum tenant cadastrado"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((tenant) => (
            <Card key={tenant.id} className="bg-card border-border hover:border-primary/20 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {tenant.logo_url ? (
                      <img src={tenant.logo_url} alt={tenant.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Building2 className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-semibold text-foreground truncate">
                      {tenant.name}
                    </p>
                    <p className="font-body text-xs text-muted-foreground mt-0.5">
                      {tenant.slug || "sem-slug"} · Criado{" "}
                      {new Date(tenant.created_at).toLocaleDateString("pt-BR")}
                    </p>
                    {tenant.phone && (
                      <p className="font-body text-xs text-muted-foreground">{tenant.phone}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className={`px-2.5 py-1 rounded-full text-[11px] font-body font-medium ${
                        tenant.active !== false
                          ? "bg-emerald-400/15 text-emerald-400"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {tenant.active !== false ? "Ativo" : "Inativo"}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(tenant)} className="h-8 w-8">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleActive(tenant)}
                      className="h-8 w-8"
                    >
                      <Power className={`w-3.5 h-3.5 ${tenant.active !== false ? "text-emerald-400" : "text-destructive"}`} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
