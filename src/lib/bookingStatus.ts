export const STATUS_LABELS: Record<string, string> = {
  cancelled: "Cancelado",
  completed: "Concluído",
  confirmed: "Confirmado",
  pending: "Pendente",
};

/** Text-only color classes for status badges (no bg/border). */
export const STATUS_TEXT_COLORS: Record<string, string> = {
  cancelled: "text-destructive",
  completed: "text-blue-400",
  confirmed: "text-green-400",
  pending: "text-yellow-400",
};
