import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Star } from "lucide-react";
import {
  useCreateTestimonialMutation,
  useDeleteTestimonialMutation,
  useTestimonials,
} from "@/hooks/useTestimonials";
import { useSalon } from "@/hooks/useSalon";
import { getErrorMessage } from "@/hooks/useQueryError";

export default function AdminTestimonials() {
  const { data: salon, error: salonError, isLoading: salonLoading } = useSalon();
  const { data: items = [], error, isLoading } = useTestimonials(salon?.id, { includeInactive: true });
  const createTestimonial = useCreateTestimonialMutation();
  const deleteTestimonial = useDeleteTestimonialMutation();

  const [form, setForm] = useState({ author_name: "", content: "", rating: "5", author_image: "" });
  const errorMessage = getErrorMessage(salonError ?? error);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();

    if (!salon?.id) {
      toast.error("Nenhum salao cadastrado.");
      return;
    }

    try {
      await createTestimonial.mutateAsync({
        salon_id: salon.id,
        author_name: form.author_name.trim(),
        content: form.content.trim(),
        rating: Number.parseInt(form.rating || "5", 10),
        author_image: form.author_image.trim() || null,
        active: true,
      });
      toast.success("Depoimento adicionado.");
      setForm({ author_name: "", content: "", rating: "5", author_image: "" });
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteTestimonial.mutateAsync(id);
      toast.success("Depoimento removido.");
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError));
    }
  }

  if (salonLoading || isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <p className="font-body text-sm text-muted-foreground">Carregando depoimentos...</p>
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
      <CardHeader>
        <CardTitle className="font-display text-xl">Depoimentos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              placeholder="Nome do autor"
              value={form.author_name}
              onChange={(event) => setForm({ ...form, author_name: event.target.value })}
              className="bg-secondary border-border font-body"
              required
            />
            <Input
              placeholder="URL foto (opcional)"
              value={form.author_image}
              onChange={(event) => setForm({ ...form, author_image: event.target.value })}
              className="bg-secondary border-border font-body"
            />
          </div>
          <Textarea
            placeholder="Conteudo do depoimento"
            value={form.content}
            onChange={(event) => setForm({ ...form, content: event.target.value })}
            className="bg-secondary border-border font-body"
            required
          />
          <div className="flex gap-3 items-end">
            <div>
              <label className="font-body text-sm">Nota (1-5)</label>
              <Input
                type="number"
                min="1"
                max="5"
                value={form.rating}
                onChange={(event) => setForm({ ...form, rating: event.target.value })}
                className="bg-secondary border-border font-body w-20"
              />
            </div>
            <Button type="submit" className="bg-primary text-primary-foreground font-body" disabled={createTestimonial.isPending}>
              <Plus className="w-4 h-4 mr-1" /> {createTestimonial.isPending ? "Salvando..." : "Adicionar"}
            </Button>
          </div>
        </form>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between p-3 rounded-lg bg-secondary border border-border">
              <div>
                <div className="flex gap-1 mb-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={`w-3 h-3 ${index < item.rating ? "text-primary fill-primary" : "text-muted-foreground"}`}
                    />
                  ))}
                </div>
                <p className="font-body text-sm text-foreground italic">"{item.content}"</p>
                <p className="font-body text-xs text-muted-foreground mt-1">- {item.author_name}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => void handleDelete(item.id)}
                className="text-destructive"
                disabled={deleteTestimonial.isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-muted-foreground font-body text-sm">Nenhum depoimento cadastrado.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
