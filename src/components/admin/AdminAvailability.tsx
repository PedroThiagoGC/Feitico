import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export default function AdminAvailability() {
  const [items, setItems] = useState<any[]>([]);
  const [salonId, setSalonId] = useState("");
  const [form, setForm] = useState({ date: "", start_time: "09:00", end_time: "19:00", is_closed: false });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: salon } = await supabase.from("salons").select("id").limit(1).maybeSingle();
    if (salon) {
      setSalonId(salon.id);
      const { data } = await supabase.from("availability").select("*").eq("salon_id", salon.id).order("date");
      setItems(data || []);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date) return;
    const { error } = await supabase.from("availability").upsert({
      salon_id: salonId, date: form.date, start_time: form.start_time,
      end_time: form.end_time, is_closed: form.is_closed,
    }, { onConflict: "salon_id,date" });
    if (error) toast.error(error.message);
    else { toast.success("Disponibilidade salva!"); loadData(); setForm({ date: "", start_time: "09:00", end_time: "19:00", is_closed: false }); }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("availability").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Removido!"); loadData(); }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="font-display text-xl">Disponibilidade / Exceções</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="font-body text-sm">Data</label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-secondary border-border font-body" required />
          </div>
          <div>
            <label className="font-body text-sm">Início</label>
            <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="bg-secondary border-border font-body" />
          </div>
          <div>
            <label className="font-body text-sm">Fim</label>
            <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="bg-secondary border-border font-body" />
          </div>
          <label className="flex items-center gap-2 font-body text-sm pb-2">
            <Switch checked={form.is_closed} onCheckedChange={(v) => setForm({ ...form, is_closed: v })} /> Fechado
          </label>
          <Button type="submit" className="bg-primary text-primary-foreground font-body">
            <Plus className="w-4 h-4 mr-1" /> Salvar
          </Button>
        </form>

        <div className="space-y-2">
          {items.map((i) => (
            <div key={i.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border">
              <span className="font-body text-sm">
                {i.date} — {i.is_closed ? <span className="text-destructive">Fechado</span> : `${i.start_time} - ${i.end_time}`}
              </span>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(i.id)} className="text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
