import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import PwaAssistant from "@/components/pwa/PwaAssistant";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import SuperAdmin from "./pages/SuperAdmin";
import SuperAdminLogin from "./pages/SuperAdminLogin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ErrorBoundary fallbackTitle="Erro na página inicial">
                <Index />
              </ErrorBoundary>
            }
          />
          <Route
            path="/admin"
            element={
              <ErrorBoundary fallbackTitle="Erro no painel administrativo">
                <Admin />
              </ErrorBoundary>
            }
          />
          <Route
            path="/superadmin/login"
            element={
              <ErrorBoundary fallbackTitle="Erro no login">
                <SuperAdminLogin />
              </ErrorBoundary>
            }
          />
          <Route
            path="/superadmin/*"
            element={
              <ErrorBoundary fallbackTitle="Erro no SuperAdmin">
                <SuperAdmin />
              </ErrorBoundary>
            }
          />
          <Route
            path="*"
            element={
              <ErrorBoundary fallbackTitle="Erro na página">
                <NotFound />
              </ErrorBoundary>
            }
          />
        </Routes>
      </BrowserRouter>
      <PwaAssistant />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
