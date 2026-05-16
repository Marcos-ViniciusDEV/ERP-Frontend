import { api } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { setAuthToken } from "@/_core/hooks/useAuth";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function Login() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);

  // Step 1: Empresa
  const [cnpj, setCnpj] = useState("");
  const [senhaEmpresa, setSenhaEmpresa] = useState("");
  const [empresa, setEmpresa] = useState<any>(null);

  // Step 2: Usuário
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  // Se vier da landing page com empresa já validada, pular para step 2
  useEffect(() => {
    const stored = sessionStorage.getItem("erp_empresa");
    if (stored) {
      try {
        const empresaData = JSON.parse(stored);
        setEmpresa(empresaData);
        setStep(2);
        sessionStorage.removeItem("erp_empresa");
      } catch (_) {}
    }
  }, []);

  const companyMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post("/auth/validate-company", data);
      return response.data.empresa;
    },
    onSuccess: (empresaData) => {
      setEmpresa(empresaData);
      setStep(2);
      setError("");
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || "Empresa não encontrada ou senha incorreta");
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: any) => {
      const response = await api.post("/auth/login", credentials);
      return response.data;
    },
    onSuccess: (data) => {
      setAuthToken(data.token);
      setLocation("/onboarding"); // Redirect to onboarding after login
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || "Erro ao fazer login");
    },
  });

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    companyMutation.mutate({ cnpj, senhaAcesso: senhaEmpresa });
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({
      identifier,
      password,
      codigoEmpresa: empresa?.codigoAcesso
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 px-4">
      <div className="w-full max-w-md">

        {/* Logo/Title Area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-4">
            <span className="text-white text-3xl font-bold">ERP</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Sistema Multi-Empresa</h1>
          <p className="text-slate-500">Gestão Inteligente para o seu negócio</p>
        </div>

        <Card className="border-none shadow-2xl overflow-hidden rounded-2xl">
          <div className="h-2 bg-blue-600" />

          <CardHeader className="pb-2">
            <CardTitle className="text-xl">
              {step === 1 ? "Acesso à Empresa" : "Acesso do Colaborador"}
            </CardTitle>
            <CardDescription>
              {step === 1
                ? "Primeiro, identifique a sua empresa"
                : `Bem-vindo à ${empresa?.nomeFantasia || "sua empresa"}`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded shadow-sm">
                {error}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleCompanySubmit} className="space-y-4">
                <div>
                  <label htmlFor="cnpj" className="block text-sm font-semibold text-slate-700 mb-1">
                    🏢 CNPJ da Empresa
                  </label>
                  <Input
                    id="cnpj"
                    type="text"
                    value={cnpj}
                    onChange={e => setCnpj(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    required
                    className="h-11 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="senhaEmpresa" className="block text-sm font-semibold text-slate-700 mb-1">
                    🔑 Senha de Acesso (Empresa)
                  </label>
                  <Input
                    id="senhaEmpresa"
                    type="password"
                    value={senhaEmpresa}
                    onChange={e => setSenhaEmpresa(e.target.value)}
                    placeholder="Sua senha de acesso"
                    required
                    className="h-11 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 transition-all font-semibold"
                  disabled={companyMutation.isPending}
                >
                  {companyMutation.isPending ? "Validando..." : "Continuar"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleUserSubmit} className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg mb-4 text-sm text-blue-700">
                  <span className="font-bold">🏢 Empresa:</span> {empresa?.nomeFantasia}
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="ml-auto underline hover:text-blue-900"
                  >
                    Trocar
                  </button>
                </div>

                <div>
                  <label htmlFor="identifier" className="block text-sm font-semibold text-slate-700 mb-1">
                    🆔 ID ou Email do Colaborador
                  </label>
                  <Input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="Digite seu ID ou email"
                    required
                    className="h-11 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1">
                    🔒 Senha Pessoal
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="h-11 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 transition-all font-semibold"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Entrando..." : "Entrar no Sistema"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center mt-8 text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} Trakto ERP. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}