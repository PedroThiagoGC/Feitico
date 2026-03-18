import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title = "Nenhum item encontrado",
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 gap-3 text-center ${className}`}>
      {icon ?? <Inbox className="w-12 h-12 text-muted-foreground/40" />}
      <h3 className="font-display text-lg text-muted-foreground">{title}</h3>
      {description && (
        <p className="text-muted-foreground/70 font-body text-sm max-w-xs">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
