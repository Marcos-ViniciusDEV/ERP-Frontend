import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { setAuthToken, useAuth } from "@/_core/hooks/useAuth";
import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { user, loading, refresh } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading || !user) return;

    if (user.role === "trakto_admin") {
      setLocation("/admin/saas");
      return;
    }

    setAuthToken(null);
    setError("Este acesso é exclusivo para administradores SaaS.");
  }, [loading, setLocation, user]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const { data } = await api.post("/auth/login", {
        identifier,
        password,
      });

      if (data.user?.role !== "trakto_admin") {
        setError("Este acesso é exclusivo para administradores SaaS.");
        setAuthToken(null);
        return;
      }

      setAuthToken(data.token);
      await refresh();
      setLocation("/admin/saas");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Não foi possível entrar.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden flex-col justify-between bg-blue-700 p-10 lg:flex">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-100">Backoffice ERP</p>
            <h1 className="mt-6 max-w-2xl text-5xl font-bold leading-tight">
              Administração Trakto separada do sistema dos clientes.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-blue-50">
              Gerencie empresas, planos, assinaturas, PDVs e licenças em uma área exclusiva do dono da plataforma.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="rounded-md bg-white/10 p-4">
              <p className="text-2xl font-bold">SaaS</p>
              <p className="text-blue-100">Controle de clientes</p>
            </div>
            <div className="rounded-md bg-white/10 p-4">
              <p className="text-2xl font-bold">RBAC</p>
              <p className="text-blue-100">Acesso restrito</p>
            </div>
            <div className="rounded-md bg-white/10 p-4">
              <p className="text-2xl font-bold">ERP</p>
              <p className="text-blue-100">Separado da operação</p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-slate-800 bg-white text-slate-950">
            <CardContent className="p-8">
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-blue-600 text-white">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Login Administrativo</h2>
                  <p className="text-sm text-muted-foreground">Acesso exclusivo `trakto_admin`</p>
                </div>
              </div>

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">E-mail ou ID</label>
                  <Input
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder="admin@empresa.com"
                    autoComplete="username"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Senha</label>
                  <Input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Sua senha"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <Button className="w-full" disabled={submitting}>
                  {submitting ? "Entrando..." : "Entrar no Backoffice"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
