import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Shield, LogIn } from "lucide-react";
import { appToast } from "@/lib/toast";
import { superadminApi } from "@/services/superadminApi";

export default function SuperAdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await superadminApi.login(email, password);

      // Check if user has superadmin role
      if (result.user?.role !== "admin" && result.user?.role !== "superadmin") {
        appToast.error("Acesso restrito a SuperAdmins");
        return;
      }

      localStorage.setItem("superadminToken", result.access_token);
      localStorage.setItem("superadminUser", JSON.stringify(result.user));
      appToast.success("Login realizado com sucesso!");
      navigate("/superadmin");
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : "Falha no login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto shadow-gold">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-gradient-gold">SuperAdmin</h1>
          <p className="text-sm text-muted-foreground font-body">
            Acesse o painel de gestão da plataforma
          </p>
        </div>

        {/* Form */}
        <Card className="bg-card border-border shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-lg">Login</CardTitle>
            <CardDescription className="font-body text-xs">
              Use suas credenciais de administrador da plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-body text-sm">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@plataforma.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary border-border font-body h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="font-body text-sm">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary border-border font-body h-11"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground font-body h-11 gap-2"
                disabled={loading}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                {loading ? "Autenticando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground font-body">
          Acesso exclusivo para administradores da plataforma
        </p>
      </div>
    </div>
  );
}
