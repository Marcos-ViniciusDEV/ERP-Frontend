import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Store, User, Lock, Building2, ChevronLeft } from "lucide-react";

export function Login() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  // Step 1: Empresa
  const [cnpj, setCnpj] = useState("");
  const [senhaEmpresa, setSenhaEmpresa] = useState("");
  const [empresa, setEmpresa] = useState<any>(null);

  // Step 2: Usuário
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    return digits
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{2}\.\d{3})(\d)/, "$1.$2")
      .replace(/(\d{2}\.\d{3}\.\d{3})(\d)/, "$1/$2")
      .replace(/(\d{2}\.\d{3}\.\d{3}\/\d{4})(\d)/, "$1-$2");
  };

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
      queryClient.setQueryData(["auth", "me"], data.user);
      setLocation("/dashboard");
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
    <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10" />

      <div className="w-full max-w-[440px]">
        {/* Logo Area */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-[28px] shadow-2xl shadow-primary/20 mb-6 group cursor-pointer" onClick={() => setLocation("/")}>
            <Store className="text-white group-hover:scale-110 transition-transform" size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Trakto ERP<span className="text-primary italic">ERP</span></h1>
          <p className="text-slate-500 font-bold mt-2">Tecnologia para o seu varejo</p>
        </div>

        <Card className="border-0 shadow-[0_30px_100px_-20px_rgba(124,58,237,0.15)] bg-white/90 backdrop-blur-xl rounded-[40px] overflow-hidden">
          <div className="h-2 bg-primary" />
          
          <CardHeader className="pt-10 pb-4 px-10">
             <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl font-black text-slate-900">
                  {step === 1 ? "Identificação" : "Acesso"}
                </CardTitle>
                {step === 2 && (
                  <button onClick={() => setStep(1)} className="text-primary hover:bg-primary/5 p-2 rounded-xl transition-colors">
                    <ChevronLeft size={20} />
                  </button>
                )}
             </div>
            <CardDescription className="font-bold text-slate-400">
              {step === 1
                ? "Identifique a sua empresa primeiro."
                : `Bem-vindo à ${empresa?.nomeFantasia || "sua empresa"}.`}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-10 pb-10">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-bold rounded-r-2xl shadow-sm animate-in fade-in slide-in-from-left-4">
                {error}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleCompanySubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="cnpj" className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      🏢 CNPJ da Empresa
                    </label>
                    <div className="relative">
                      <Input
                        id="cnpj"
                        type="text"
                        value={cnpj}
                        onChange={e => setCnpj(formatCnpj(e.target.value))}
                        placeholder="00.000.000/0000-00"
                        required
                        className="h-14 bg-slate-50 border-transparent focus:bg-white focus:ring-primary rounded-2xl pl-12 font-bold"
                      />
                      <Building2 className="absolute left-4 top-4 text-slate-300" size={20} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="senhaEmpresa" className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      🔑 Senha de Acesso
                    </label>
                    <div className="relative">
                      <Input
                        id="senhaEmpresa"
                        type="password"
                        value={senhaEmpresa}
                        onChange={e => setSenhaEmpresa(e.target.value)}
                        placeholder="Sua senha de acesso"
                        required
                        className="h-14 bg-slate-50 border-transparent focus:bg-white focus:ring-primary rounded-2xl pl-12 font-bold"
                      />
                      <Lock className="absolute left-4 top-4 text-slate-300" size={20} />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 bg-primary hover:brightness-110 shadow-xl shadow-primary/20 transition-all font-black text-white rounded-2xl text-base"
                  disabled={companyMutation.isPending}
                >
                  {companyMutation.isPending ? "Validando..." : "Prosseguir para Login →"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleUserSubmit} className="space-y-6">
                <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/10 rounded-2xl mb-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Building2 size={20} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">Empresa</p>
                    <p className="text-sm font-black text-slate-900 truncate">{empresa?.nomeFantasia}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="identifier" className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      👤 Usuário (ID ou Email)
                    </label>
                    <div className="relative">
                      <Input
                        id="identifier"
                        type="text"
                        value={identifier}
                        onChange={e => setIdentifier(e.target.value)}
                        placeholder="Digite seu ID ou email"
                        required
                        className="h-14 bg-slate-50 border-transparent focus:bg-white focus:ring-primary rounded-2xl pl-12 font-bold"
                      />
                      <User className="absolute left-4 top-4 text-slate-300" size={20} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      🔒 Senha Pessoal
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="h-14 bg-slate-50 border-transparent focus:bg-white focus:ring-primary rounded-2xl pl-12 font-bold"
                      />
                      <Lock className="absolute left-4 top-4 text-slate-300" size={20} />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 bg-slate-900 hover:bg-primary shadow-2xl transition-all font-black text-white rounded-2xl text-base"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Entrando..." : "Acessar o Painel →"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center mt-10 text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
          &copy; {new Date().getFullYear()} Trakto ERP • Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
