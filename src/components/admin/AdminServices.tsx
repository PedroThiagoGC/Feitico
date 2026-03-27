import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { MinutesSelect } from "@/components/ui/minutes-select";
import {
  useCreateServiceMutation,
  useDeleteServiceMutation,
  useServices,
  useUpdateServiceMutation,
  type Service,
} from "@/hooks/useServices";
import { useSalon } from "@/hooks/useSalon";
import { getErrorMessage } from "@/hooks/useQueryError";

interface ServiceForm {
  id?: string;
  name: string;
  description: string;
  price: string;
  duration: string;
  buffer_minutes: string;
  image_url: string;
  category: string;
  is_combo: boolean;
  active: boolean;
  sort_order: string;
}

const emptyService: ServiceForm = {
  name: "",
  description: "",
  price: "0",
  duration: "5",
  buffer_minutes: "0",
  image_url: "",
  category: "",
  is_combo: false,
  active: true,
  sort_order: "0",
};

export default function AdminServices() {
  const { data: salon, error: salonError, isLoading: salonLoading } = useSalon();
  const { data: services = [], error, isLoading } = useServices(salon?.id, { includeInactive: true });
  const createService = useCreateServiceMutation();
  const updateService = useUpdateServiceMutation();
  const deleteService = useDeleteServiceMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ServiceForm>(emptyService);
  const [search, setSearch] = useState("");

  const filteredServices = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return services;
    return services.filter((service) => service.name.toLowerCase().includes(normalized));
  }, [search, services]);

  const isSaving = createService.isPending || updateService.isPending;
  const isDeleting = deleteService.isPending;
  const errorMessage = getErrorMessage(salonError ?? error);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();

    if (!salon?.id) {
      toast.error("Nenhum salao cadastrado.");
      return;
    }

    const duration = Number.parseInt(form.duration, 10);
    const buffer = Number.parseInt(form.buffer_minutes, 10);
    if (duration < 5) {
      toast.error("Duracao minima: 5 minutos");
      return;
    }

    const payload = {
      salon_id: salon.id,
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number.parseFloat(form.price || "0"),
      duration,
      buffer_minutes: buffer,
      image_url: form.image_url.trim() || null,
      category: form.category.trim() || null,
      is_combo: form.is_combo,
      active: form.active,
      sort_order: Number.parseInt(form.sort_order || "0", 10),
    };

    try {
      if (form.id) {
        await updateService.mutateAsync({ id: form.id, payload });
        toast.success("Servico atualizado.");
      } else {
        await createService.mutateAsync(payload);
        toast.success("Servico criado.");
      }
      setDialogOpen(false);
      setForm(emptyService);
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir servico?")) return;

    try {
      await deleteService.mutateAsync(id);
      toast.success("Servico removido.");
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError));
    }
  }

  function openEdit(service: Service) {
    setForm({
      id: service.id,
      name: service.name,
      description: service.description || "",
      price: String(service.price),
      duration: String(service.duration),
      buffer_minutes: String(service.buffer_minutes || 0),
      image_url: service.image_url || "",
      category: service.category || "",
      is_combo: service.is_combo,
      active: service.active,
      sort_order: String(service.sort_order),
    });
    setDialogOpen(true);
  }

  if (salonLoading || isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <p className="font-body text-sm text-muted-foreground">Carregando servicos...</p>
        </CardContent>
      </Card>
    );
  }

  if (errorMessage) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <p className="font-body text-sm text-destructive">{errorMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display text-xl">Servicos</CardTitle>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setForm(emptyService);
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary text-primary-foreground font-body">
              <Plus className="w-4 h-4 mr-1" /> Novo
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{form.id ? "Editar" : "Novo"} Servico</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="font-body text-sm font-medium mb-1 block">Nome do servico</label>
                <Input
                  placeholder="Ex: Corte masculino"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className="bg-secondary border-border font-body"
                  required
                />
              </div>
              <div>
                <label className="font-body text-sm font-medium mb-1 block">Descricao</label>
                <Input
                  placeholder="Descricao opcional do servico"
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  className="bg-secondary border-border font-body"
                />
              </div>
              <div>
                <label className="font-body text-sm font-medium mb-1 block">Preco (R$)</label>
                <Input
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(event) => setForm({ ...form, price: event.target.value })}
                  className="bg-secondary border-border font-body"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-body text-sm">Duracao (min)</label>
                  <MinutesSelect
                    value={form.duration}
                    onChange={(value) => setForm({ ...form, duration: value })}
                    min={5}
                    max={480}
                    placeholder="Duracao"
                  />
                </div>
                <div>
                  <label className="font-body text-sm">Margem operacional (min)</label>
                  <MinutesSelect
                    value={form.buffer_minutes}
                    onChange={(value) => setForm({ ...form, buffer_minutes: value })}
                    min={0}
                    max={120}
                    placeholder="Margem"
                  />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 font-body text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duracao do servico:</span>
                  <span className="text-foreground font-medium">{form.duration} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Margem entre atendimentos:</span>
                  <span className="text-foreground font-medium">{form.buffer_minutes} min</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1">
                  <span className="text-muted-foreground font-semibold">Tempo total na agenda:</span>
                  <span className="text-primary font-bold">
                    {Number.parseInt(form.duration || "0", 10) + Number.parseInt(form.buffer_minutes || "0", 10)} min
                  </span>
                </div>
              </div>
              <div>
                <label className="font-body text-sm font-medium mb-1 block">URL da imagem</label>
                <Input
                  placeholder="https://..."
                  value={form.image_url}
                  onChange={(event) => setForm({ ...form, image_url: event.target.value })}
                  className="bg-secondary border-border font-body"
                />
              </div>
              <div>
                <label className="font-body text-sm font-medium mb-1 block">Categoria</label>
                <Input
                  placeholder="Ex: Cabelo, Barba"
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                  className="bg-secondary border-border font-body"
                />
              </div>
              <div>
                <label className="font-body text-sm font-medium mb-1 block">Ordem de exibicao</label>
                <Input
                  placeholder="0"
                  type="number"
                  value={form.sort_order}
                  onChange={(event) => setForm({ ...form, sort_order: event.target.value })}
                  className="bg-secondary border-border font-body"
                />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 font-body text-sm">
                  <Switch checked={form.is_combo} onCheckedChange={(checked) => setForm({ ...form, is_combo: checked })} /> Combo
                </label>
                <label className="flex items-center gap-2 font-body text-sm">
                  <Switch checked={form.active} onCheckedChange={(checked) => setForm({ ...form, active: checked })} /> Ativo
                </label>
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground font-body" disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Buscar servico..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="max-w-sm bg-secondary border-border font-body"
          />
        </div>
        {filteredServices.length === 0 ? (
          <p className="text-muted-foreground font-body text-sm">Nenhum servico cadastrado.</p>
        ) : (
          <div className="space-y-3">
            {filteredServices.map((service) => (
              <div key={service.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border">
                <div className="flex-1 min-w-0">
                  <p className="font-body font-medium text-foreground truncate">{service.name}</p>
                  <p className="font-body text-sm text-muted-foreground">
                    R$ {Number(service.price).toFixed(2)} - {service.duration}min + {service.buffer_minutes || 0}min margem = {service.duration + (service.buffer_minutes || 0)}min total
                    {service.is_combo && " - Combo"}
                    {!service.active && " - Inativo"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(service)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void handleDelete(service.id)}
                    className="text-destructive"
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
