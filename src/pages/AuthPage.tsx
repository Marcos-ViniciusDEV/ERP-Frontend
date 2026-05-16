import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Eye,
  EyeOff,
  Store,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Check
} from "lucide-react";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"register" | "login">("register");
  const [formState, setFormState] = useState({
    name: "",
    companyName: "",
    email: "",
    password: "",
    cnpj: "",
  });
  
  const [loginCnpj, setLoginCnpj] = useState("");
  const [loginSenhaEmpresa, setLoginSenhaEmpresa] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();

  const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    return digits
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{2}\.\d{3})(\d)/, "$1.$2")
      .replace(/(\d{2}\.\d{3}\.\d{3})(\d)/, "$1/$2")
      .replace(/(\d{2}\.\d{3}\.\d{3}\/\d{4})(\d)/, "$1-$2");
  };

  const companyMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post("/auth/validate-company", data);
      return response.data.empresa;
    },
    onSuccess: (empresaData) => {
      sessionStorage.setItem("erp_empresa", JSON.stringify(empresaData));
      setLocation("/login");
    },
    onError: (error: any) => {
      setLoginError(error.response?.data?.error || "Empresa não encontrada ou senha incorreta");
    },
  });

  const handleChange = (field: keyof typeof formState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await api.post("/empresas/trial", {
        name: formState.name,
        companyName: formState.companyName,
        cnpj: formState.cnpj,
        email: formState.email,
        password: formState.password,
      });
      
      localStorage.setItem("erp_token", response.data.token);
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch (err: any) {
      setIsSubmitting(false);
      setLoginError(err.response?.data?.error || "Erro ao criar conta");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />

      <Link href="/">
        <a className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-primary transition-colors font-black text-xs uppercase tracking-widest cursor-pointer">
          <ArrowLeft size={16} />
          Voltar para Início
        </a>
      </Link>

      <div className="w-full max-w-[480px]">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-[28px] shadow-2xl shadow-primary/20 mb-6">
            <Store className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Trakto ERP<span className="text-primary italic">ERP</span></h1>
          <p className="text-slate-500 font-bold mt-2">Comece sua jornada de automação hoje</p>
        </div>

        <Card className="border-0 shadow-[0_30px_100px_-20px_rgba(124,58,237,0.15)] bg-white/90 backdrop-blur-xl rounded-[40px] overflow-hidden">
          <div className="flex p-2 bg-slate-50/50">
            <button
              onClick={() => setActiveTab("register")}
              className={`flex-1 py-4 text-sm font-black rounded-2xl transition-all ${
                activeTab === "register"
                  ? "bg-white text-primary shadow-lg"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Teste Grátis
            </button>
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-4 text-sm font-black rounded-2xl transition-all ${
                activeTab === "login"
                  ? "bg-white text-primary shadow-lg"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Entrar no Sistema
            </button>
          </div>

          <div className="p-10">
            {activeTab === "register" ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Seu Nome</label>
                    <Input placeholder="Nome" value={formState.name} onChange={handleChange("name")} className="h-12 border-slate-100 focus:ring-primary rounded-xl font-medium" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Sua Empresa</label>
                    <Input placeholder="Nome da Loja" value={formState.companyName} onChange={handleChange("companyName")} className="h-12 border-slate-100 focus:ring-primary rounded-xl font-medium" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ</label>
                  <Input
                    placeholder="00.000.000/0000-00"
                    value={formState.cnpj}
                    onChange={(e) => setFormState(prev => ({ ...prev, cnpj: formatCnpj(e.target.value) }))}
                    className="h-12 border-slate-100 focus:ring-primary rounded-xl font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Profissional</label>
                  <Input placeholder="exemplo@email.com" value={formState.email} onChange={handleChange("email")} className="h-12 border-slate-100 focus:ring-primary rounded-xl font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={formState.password} onChange={handleChange("password")} className="h-12 border-slate-100 focus:ring-primary rounded-xl font-medium" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-300">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  </div>
                </div>
                
                <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-primary hover:brightness-110 text-white font-black rounded-2xl mt-6 shadow-xl shadow-primary/20">
                  {isSubmitting ? "Criando conta..." : "Começar Agora →"}
                </Button>
                <div className="flex flex-col gap-2 mt-6">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                    <ShieldCheck size={14} className="text-green-500" /> Sem compromisso • Sem cartão de crédito
                  </div>
                </div>
              </form>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setLoginError("");
                  companyMutation.mutate({ cnpj: loginCnpj, senhaAcesso: loginSenhaEmpresa });
                }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ da Empresa</label>
                    <Input
                      placeholder="00.000.000/0000-00"
                      value={loginCnpj}
                      onChange={(e) => setLoginCnpj(formatCnpj(e.target.value))}
                      className="h-12 border-slate-100 focus:ring-primary rounded-xl font-medium"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
                    <Input
                      type="password"
                      placeholder="Senha da empresa"
                      value={loginSenhaEmpresa}
                      onChange={(e) => setLoginSenhaEmpresa(e.target.value)}
                      className="h-12 border-slate-100 focus:ring-primary rounded-xl font-medium"
                      required
                    />
                  </div>
                </div>
                {loginError && <p className="text-xs text-red-500 font-bold text-center bg-red-50 p-2 rounded-lg">{loginError}</p>}
                <Button
                  type="submit"
                  disabled={companyMutation.isPending}
                  className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl mt-4"
                >
                  {companyMutation.isPending ? "Validando..." : "Continuar para o Sistema"}
                </Button>
              </form>
            )}
          </div>
        </Card>

        {/* Extra Info Grid */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <Zap className="text-primary mb-3" size={24} />
            <h4 className="text-sm font-black text-slate-900 mb-1">Ativação Instantânea</h4>
            <p className="text-[10px] text-slate-400 font-bold leading-tight">Comece a usar em menos de 2 minutos.</p>
          </div>
          <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <Check className="text-primary mb-3" size={24} />
            <h4 className="text-sm font-black text-slate-900 mb-1">Suporte Integrado</h4>
            <p className="text-[10px] text-slate-400 font-bold leading-tight">Nossa equipe pronta para te ajudar no onboarding.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
