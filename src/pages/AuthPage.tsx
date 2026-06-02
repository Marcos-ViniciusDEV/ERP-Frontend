import { useState } from "react";
import { api } from "@/lib/api";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { setAuthToken } from "@/_core/hooks/useAuth";
import {
  Eye,
  EyeOff,
  Store,
  ArrowLeft,
  ShieldCheck
} from "lucide-react";

export default function AuthPage() {
  const [formState, setFormState] = useState({
    name: "",
    companyName: "",
    email: "",
    password: "",
    cnpj: "",
  });
  
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    return digits
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{2}\.\d{3})(\d)/, "$1.$2")
      .replace(/(\d{2}\.\d{3}\.\d{3})(\d)/, "$1/$2")
      .replace(/(\d{2}\.\d{3}\.\d{3}\/\d{4})(\d)/, "$1-$2");
  };

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
      
      setAuthToken(response.data.token);
      setTimeout(() => {
        window.location.href = "/onboarding";
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

      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-primary transition-colors font-black text-xs uppercase tracking-widest cursor-pointer">
        <ArrowLeft size={16} />
        Voltar para Início
      </Link>

      <div className="w-full max-w-[480px]">
        <div className="text-center mb-12">
          <Link
            href="/"
            aria-label="Voltar para a página inicial"
            className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-[28px] shadow-2xl shadow-primary/20 mb-6 group cursor-pointer"
          >
            <Store className="text-white group-hover:scale-110 transition-transform" size={40} />
          </Link>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Trakto ERP<span className="text-primary italic">ERP</span></h1>
          <p className="text-slate-500 font-bold mt-2">Comece sua jornada de automação hoje</p>
        </div>

        <Card className="border-0 shadow-[0_30px_100px_-20px_rgba(124,58,237,0.15)] bg-white/90 backdrop-blur-xl rounded-[40px] overflow-hidden">
          <div className="p-10">
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
                {loginError && <p className="text-xs text-red-500 font-bold text-center bg-red-50 p-2 rounded-lg">{loginError}</p>}
            </form>
          </div>
        </Card>

      </div>
    </div>
  );
}
