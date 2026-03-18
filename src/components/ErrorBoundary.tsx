import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
          <AlertTriangle className="w-12 h-12 text-destructive/60" />
          <h3 className="font-display text-lg text-muted-foreground">
            {this.props.fallbackTitle || "Algo deu errado"}
          </h3>
          <p className="text-muted-foreground/70 font-body text-sm max-w-xs">
            {this.state.error?.message || "Ocorreu um erro inesperado."}
          </p>
          <Button variant="outline" onClick={this.handleRetry}>
            Tentar novamente
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
