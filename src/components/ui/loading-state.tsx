import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = "Carregando...", className = "" }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 gap-3 ${className}`}>
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-muted-foreground font-body text-sm">{message}</p>
    </div>
  );
}
