import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const DAYS = [
  { key: "mon", label: "Segunda" },
  { key: "tue", label: "Terça" },
  { key: "wed", label: "Quarta" },
  { key: "thu", label: "Quinta" },
  { key: "fri", label: "Sexta" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
];

interface OpeningHoursEditorProps {
  value: Record<string, string> | null;
  onChange: (hours: Record<string, string>) => void;
}

export default function OpeningHoursEditor({ value, onChange }: OpeningHoursEditorProps) {
  const hours = value || {
    mon: "09:00-19:00", tue: "09:00-19:00", wed: "09:00-19:00",
    thu: "09:00-19:00", fri: "09:00-19:00", sat: "09:00-18:00", sun: "closed",
  };

  function updateDay(key: string, val: string) {
    onChange({ ...hours, [key]: val });
  }

  function toggleClosed(key: string, isClosed: boolean) {
    updateDay(key, isClosed ? "closed" : "09:00-19:00");
  }

  function getStart(dayVal: string) {
    if (dayVal === "closed") return "09:00";
    return dayVal.split("-")[0] || "09:00";
  }

  function getEnd(dayVal: string) {
    if (dayVal === "closed") return "19:00";
    return dayVal.split("-")[1] || "19:00";
  }

  return (
    <div className="space-y-3">
      <label className="font-body text-sm font-medium block">Horário de Funcionamento</label>
      {DAYS.map((day) => {
        const dayVal = hours[day.key] || "closed";
        const isClosed = dayVal === "closed";

        return (
          <div key={day.key} className="flex items-center gap-3 p-2 rounded-lg bg-secondary border border-border">
            <span className="font-body text-sm w-20 text-foreground">{day.label}</span>
            <label className="flex items-center gap-2 font-body text-xs text-muted-foreground">
              <Switch
                checked={!isClosed}
                onCheckedChange={(open) => toggleClosed(day.key, !open)}
              />
              {isClosed ? "Fechado" : "Aberto"}
            </label>
            {!isClosed && (
              <>
                <Input
                  type="time"
                  value={getStart(dayVal)}
                  onChange={(e) => updateDay(day.key, `${e.target.value}-${getEnd(dayVal)}`)}
                  className="bg-card border-border font-body w-28 text-sm"
                />
                <span className="text-muted-foreground text-sm">às</span>
                <Input
                  type="time"
                  value={getEnd(dayVal)}
                  onChange={(e) => updateDay(day.key, `${getStart(dayVal)}-${e.target.value}`)}
                  className="bg-card border-border font-body w-28 text-sm"
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
