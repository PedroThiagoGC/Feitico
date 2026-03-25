import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface UserForm {
  name: string;
  email: string;
  role: string;
  tenantId: string;
  active: boolean;
}

const emptyForm: UserForm = { name: "", email: "", role: "tenant_admin", tenantId: "", active: true };

export default function SuperAdminUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);

  const { data: users = [] } = useQuery({
    queryKey: ["superadmin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("platform_users").select("*, tenants(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["superadmin-tenants-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tenants").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: UserForm & { id?: string }) => {
      const row = {
        name: data.name,
        email: data.email,
        role: data.role,
        tenant_id: data.tenantId || null,
        active: data.active,
      };
      if (data.id) {
        const { error } = await supabase.from("platform_users").update(row).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("platform_users").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-users"] });
      toast.success(editingId ? "Usuário atualizado!" : "Usuário criado!");
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("platform_users").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-users"] });
      toast.success("Usuário excluído!");
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });

  const filtered = users.filter((u) => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    return true;
  });

  const getInitials = (name: string) => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const roleBadgeClass: Record<string, string> = {
    superadmin: "bg-primary/15 text-primary",
    tenant_admin: "bg-purple/15 text-purple",
    manager: "bg-info/15 text-info",
    professional: "bg-success/15 text-success",
  };

  const openNew = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (user: any) => {
    setEditingId(user.id);
    setForm({ name: user.name, email: user.email, role: user.role, tenantId: user.tenant_id || "", active: user.active });
    setDialogOpen(true);
  };

  return (
    <Card className="bg-card border-border p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-xl font-semibold">
          Usuários da <em className="text-primary">Plataforma</em>
        </h3>
        <Button className="bg-primary text-primary-foreground" onClick={openNew}>+ Novo Usuário</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Input placeholder="Buscar por nome ou email..." className="max-w-[300px] bg-muted border-border text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px] bg-muted border-border text-sm"><SelectValue placeholder="Todos os roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os roles</SelectItem>
            <SelectItem value="superadmin">SuperAdmin</SelectItem>
            <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
            <SelectItem value="manager">Gerente</SelectItem>
            <SelectItem value="professional">Profissional</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Nome</th>
              <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Email</th>
              <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Role</th>
              <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Tenant</th>
              <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Status</th>
              <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-b border-border hover:bg-muted/30">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-primary">{getInitials(user.name)}</div>
                    <strong>{user.name}</strong>
                  </div>
                </td>
                <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                <td className="py-3 px-4">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleBadgeClass[user.role] || "bg-muted text-muted-foreground"}`}>{user.role}</span>
                </td>
                <td className="py-3 px-4 text-muted-foreground">{(user as any).tenants?.name || "— (global)"}</td>
                <td className="py-3 px-4">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${user.active !== false ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                    {user.active !== false ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="py-3 px-4 flex gap-1">
                  <Button variant="outline" size="sm" className="text-xs border-border" onClick={() => openEdit(user)}>Editar</Button>
                  <Button variant="outline" size="sm" className="text-xs border-destructive text-destructive" onClick={() => { if (confirm("Excluir este usuário?")) deleteMutation.mutate(user.id); }}>Excluir</Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Nenhum usuário encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-muted-foreground">Mostrando {filtered.length} de {users.length} usuários</p>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">{editingId ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); mutation.mutate({ ...form, id: editingId || undefined }); }} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome</Label>
              <Input className="bg-muted border-border" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input className="bg-muted border-border" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}>
                <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="superadmin">SuperAdmin</SelectItem>
                  <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="professional">Profissional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tenant (Salão)</Label>
              <Select value={form.tenantId} onValueChange={(v) => setForm((p) => ({ ...p, tenantId: v }))}>
                <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Selecione o tenant" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— Nenhum (global)</SelectItem>
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={form.active} onCheckedChange={(v) => setForm((p) => ({ ...p, active: !!v }))} />
              <Label className="text-xs">Ativo</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-primary text-primary-foreground" disabled={mutation.isPending}>
                {mutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
