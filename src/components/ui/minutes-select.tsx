import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MinutesSelectProps {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
  allowEmpty?: boolean;
}

export function MinutesSelect({
  value,
  onChange,
  min = 5,
  max = 480,
  placeholder = "Selecione",
  className = "",
  allowEmpty = false,
}: MinutesSelectProps) {
  const options: number[] = [];
  for (let i = min; i <= max; i += 5) {
    options.push(i);
  }

  return (
    <Select value={value || (allowEmpty ? "" : String(min))} onValueChange={onChange}>
      <SelectTrigger className={`bg-secondary border-border font-body ${className}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-card border-border max-h-60">
        {allowEmpty && <SelectItem value="none">—</SelectItem>}
        {options.map((v) => (
          <SelectItem key={v} value={String(v)}>
            {v} min
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
