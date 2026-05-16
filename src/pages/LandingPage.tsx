import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  CheckCheck,
  Check,
  Zap,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  ShoppingCart,
  Box,
  Banknote,
  FileText,
  Menu,
  X,
  Users
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export function LandingPage() {
  const [activeTab, setActiveTab] = useState<"trial" | "login">("trial");
  const [formState, setFormState] = useState({
    name: "",
    companyName: "",
    email: "",
    password: "",
    cnpj: "",
  });
  // Login step 1 state (CNPJ da empresa)
  const [loginCnpj, setLoginCnpj] = useState("");
  const [loginSenhaEmpresa, setLoginSenhaEmpresa] = useState("");
  const [loginError, setLoginError] = useState("");
  const [formErrors, setFormErrors] = useState({
    name: "",
    companyName: "",
    email: "",
    password: "",
    cnpj: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0); // Open first FAQ by default

  const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    return digits
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{2}\.\d{3})(\d)/, "$1.$2")
      .replace(/(\d{2}\.\d{3}\.\d{3})(\d)/, "$1/$2")
      .replace(/(\d{2}\.\d{3}\.\d{3}\/\d{4})(\d)/, "$1-$2");
  };

  const [, setLocation] = useLocation();

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

  const { user, isAuthenticated } = useAuth({
    redirectOnUnauthenticated: false,
  });

  const handleChange = (field: keyof typeof formState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({ ...prev, [field]: e.target.value }));
    setFormErrors((prev) => ({ ...prev, [field]: "" }));
    setSuccessMessage("");
  };

  const validateForm = () => {
    const errors: typeof formErrors = { name: "", companyName: "", email: "", password: "", cnpj: "" };
    let isValid = true;

    if (!formState.name.trim()) {
      errors.name = "Nome é obrigatório";
      isValid = false;
    }
    if (!formState.companyName.trim()) {
      errors.companyName = "Nome da empresa é obrigatório";
      isValid = false;
    }
    if (!formState.cnpj.trim() || formState.cnpj.replace(/\D/g, "").length < 14) {
      errors.cnpj = "CNPJ inválido";
      isValid = false;
    }
    if (!formState.email.trim()) {
      errors.email = "E-mail é obrigatório";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formState.email)) {
      errors.email = "E-mail inválido";
      isValid = false;
    }
    if (!formState.password) {
      errors.password = "Senha é obrigatória";
      isValid = false;
    } else if (formState.password.length < 8) {
      errors.password = "Senha deve ter pelo menos 8 caracteres";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

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
      setSuccessMessage("Conta criada com sucesso! Redirecionando...");
      
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    } catch (err: any) {
      setIsSubmitting(false);
      setFormErrors(prev => ({ ...prev, email: err.response?.data?.error || "Erro ao criar conta" }));
      console.error("Registration failed:", err);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, user, setLocation]);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white scroll-smooth">
      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/5562993243263"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-3 rounded-full shadow-2xl shadow-green-300 hover:shadow-green-400 transition-all hover:scale-105 active:scale-95"
        title="Fale conosco no WhatsApp"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span className="text-sm">Fale pelo WhatsApp</span>
      </a>

      <header className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300 bg-white/70 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 cursor-pointer group">
            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">T</div>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tighter italic">Trakto<span className="text-blue-600 not-italic">ERP</span></span>
          </div>
          <nav className="hidden md:flex items-center space-x-10 text-[13px] font-bold text-slate-500 uppercase tracking-wider">
            <a href="#funcionalidades" className="hover:text-blue-600 transition-colors">Recursos</a>
            <a href="#precos" className="hover:text-blue-600 transition-colors">Preços</a>
            <a href="#depoimentos" className="hover:text-blue-600 transition-colors">Clientes</a>
            <a href="#faq" className="hover:text-blue-600 transition-colors">Suporte</a>
          </nav>
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => { setActiveTab("login"); document.getElementById("hero-form")?.scrollIntoView({behavior:"smooth"}); }} className="text-[13px] font-bold text-slate-600 hover:text-blue-600 transition-colors uppercase tracking-wider">Entrar</button>
            <a href="#hero-form" onClick={() => setActiveTab("trial")} className="bg-slate-900 text-white font-bold py-3 px-7 rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 text-[13px] uppercase tracking-wider">Testar Grátis</a>
          </div>
          <button className="md:hidden p-2 text-slate-900" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t p-8 space-y-6 shadow-2xl animate-in slide-in-from-top duration-300">
            <nav className="flex flex-col space-y-5 font-bold text-slate-600 uppercase tracking-wider text-sm">
              <a href="#funcionalidades" onClick={() => setIsMobileMenuOpen(false)}>Recursos</a>
              <a href="#precos" onClick={() => setIsMobileMenuOpen(false)}>Preços</a>
              <a href="#faq" onClick={() => setIsMobileMenuOpen(false)}>Suporte</a>
            </nav>
            <Button className="w-full bg-blue-600 h-14 rounded-2xl font-bold" onClick={() => setIsMobileMenuOpen(false)}>Testar 7 Dias Grátis</Button>
          </div>
        )}
      </header>

      <section id="hero" className="relative pt-16 pb-24 overflow-hidden bg-white">
        {/* Background Decorations */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-50 rounded-full blur-[120px] opacity-60 animate-pulse" />
          <div className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] bg-indigo-50 rounded-full blur-[100px] opacity-50" />
        </div>

        <div className="max-w-[1400px] mx-auto px-4 lg:px-12 grid lg:grid-cols-2 gap-0 items-center relative z-10 min-h-[70vh]">
          <div className="text-left py-12 lg:pr-16 border-r-0 lg:border-r border-slate-100">
            <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold mb-8 animate-fade-in">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping" />
              ✨ Gestão Inteligente para o Varejo
            </div>
            <h1 className="text-4xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight">
              Estoque, vendas e financeiro — <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">tudo em uma tela.</span>
            </h1>
            <p className="text-base lg:text-lg text-slate-600 mb-8 leading-relaxed max-w-xl font-medium">
              Chega de conferir mercadoria no papel. Com o nosso ERP, seu celular vira um coletor profissional — e sua loja funciona com a eficiência de uma grande rede.
            </p>

            <div className="flex flex-wrap gap-6 items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
                  <Zap className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Rápido e Fluído</p>
                  <p className="text-xs text-slate-500">Interface intuitiva</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
                  <ShieldCheck className="text-indigo-600" size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">100% Seguro</p>
                  <p className="text-xs text-slate-500">Dados criptografados</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative py-12 lg:pl-16">
            <div className="absolute -inset-4 bg-gradient-to-tr from-blue-100 to-indigo-100 rounded-[44px] blur-2xl opacity-30 -z-10" />
            <Card id="hero-form" className="shadow-[0_15px_40px_rgba(8,112,184,0.1)] border-0 ring-1 ring-slate-100 bg-white/80 backdrop-blur-xl rounded-[28px] overflow-hidden max-w-md mx-auto lg:ml-auto">
              {/* Tabs */}
              <div className="flex p-2 bg-slate-50/50">
                <button
                  onClick={() => setActiveTab("trial")}
                  className={`flex-1 py-3 text-sm font-bold rounded-2xl transition-all ${
                    activeTab === "trial"
                      ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Criar Conta Trial
                </button>
                <button
                  onClick={() => setActiveTab("login")}
                  className={`flex-1 py-3 text-sm font-bold rounded-2xl transition-all ${
                    activeTab === "login"
                      ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Já tenho conta
                </button>
              </div>

              <div className="px-6 pb-4 pt-2 lg:px-8 lg:pb-5 lg:pt-3 min-h-[460px] flex flex-col justify-center">
                {activeTab === "trial" ? (
                  <form onSubmit={handleSubmit} className="space-y-5">

                    <div className="space-y-4">
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1.5 block">Seu Nome</label>
                        <Input placeholder="Nome Completo" value={formState.name} onChange={handleChange("name")} className="h-12 text-sm bg-white border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 rounded-xl" />
                        {formErrors.name && <p className="text-[10px] text-red-500 mt-1 ml-1">{formErrors.name}</p>}
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1.5 block">Nome da Empresa</label>
                        <Input placeholder="Ex: Loja do João" value={formState.companyName} onChange={handleChange("companyName")} className="h-12 text-sm bg-white border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 rounded-xl" />
                        {formErrors.companyName && <p className="text-[10px] text-red-500 mt-1 ml-1">{formErrors.companyName}</p>}
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1.5 block">Empresa (CNPJ)</label>
                        <Input
                          placeholder="00.000.000/0000-00"
                          value={formState.cnpj}
                          onChange={(e) => {
                            const formatted = formatCnpj(e.target.value);
                            setFormState(prev => ({ ...prev, cnpj: formatted }));
                            setFormErrors(prev => ({ ...prev, cnpj: "" }));
                          }}
                          className="h-12 text-sm bg-white border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 rounded-xl"
                        />
                        {formErrors.cnpj && <p className="text-[9px] text-red-500 mt-1 ml-1">{formErrors.cnpj}</p>}
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1 block">E-mail</label>
                         <Input placeholder="email@empresa.com" value={formState.email} onChange={handleChange("email")} className="h-12 text-sm bg-white border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 rounded-xl" />
                        {formErrors.email && <p className="text-[9px] text-red-500 mt-1 ml-1">{formErrors.email}</p>}
                      </div>
                      <div className="relative">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1 block">Senha</label>
                         <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={formState.password} onChange={handleChange("password")} className="h-12 text-sm bg-white border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 rounded-xl" />
                         <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[32px] text-slate-400">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                        {formErrors.password && <p className="text-[9px] text-red-500 mt-1 ml-1">{formErrors.password}</p>}
                      </div>
                    </div>
                    {successMessage && <p className="text-[11px] text-green-600 font-semibold text-center bg-green-50 py-2 rounded-lg">{successMessage}</p>}

                      <Button type="submit" disabled={isSubmitting} className="w-full h-14 text-base font-bold bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all rounded-2xl mt-4">
                      {isSubmitting ? "Configurando sua conta..." : "Ativar 7 Dias Grátis →"}
                    </Button>
                    <p className="text-center text-[12px] text-slate-600 font-bold mt-2">✨ Sem cartão de crédito • Acesso imediato</p>
                  </form>
                ) : (
                  <div className="space-y-4">
                    {loginError && (
                      <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-lg">
                        {loginError}
                      </div>
                    )}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setLoginError("");
                        companyMutation.mutate({ cnpj: loginCnpj, senhaAcesso: loginSenhaEmpresa });
                      }}
                      className="space-y-5"
                    >
                      <p className="text-sm text-slate-500 font-medium">Identifique a sua empresa para entrar.</p>
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1.5 block">🏢 CNPJ da Empresa</label>
                         <Input
                           placeholder="00.000.000/0000-00"
                           value={loginCnpj}
                           onChange={(e) => setLoginCnpj(formatCnpj(e.target.value))}
                           className="h-12 bg-white border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 rounded-xl"
                           required
                         />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1.5 block">🔑 Senha de Acesso (Empresa)</label>
                        <Input
                          type="password"
                          placeholder="Sua senha de acesso"
                          value={loginSenhaEmpresa}
                          onChange={(e) => setLoginSenhaEmpresa(e.target.value)}
                          className="h-12 bg-white border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 rounded-xl"
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={companyMutation.isPending}
                        className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all rounded-2xl mt-4"
                      >
                        {companyMutation.isPending ? "Validando..." : "Continuar para Login →"}
                      </Button>
                      <p className="text-center text-xs text-slate-400">
                        Ainda não é cliente?{" "}
                        <button type="button" onClick={() => setActiveTab("trial")} className="text-blue-600 font-bold hover:underline">
                          Começar Trial
                        </button>
                      </p>
                    </form>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section id="funcionalidades" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block py-1 px-4 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-widest mb-4 border border-blue-100">Tudo que sua empresa precisa</span>
            <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Módulos completos. <span className="text-blue-600">Zero complexidade.</span></h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Cada funcionalidade foi construída para o varejo brasileiro. Do PDV ao financeiro, tudo em um só lugar.</p>
          </div>

          {/* PDV */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 px-1">🖥️ Ponto de Venda (PDV)</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { title: "PDV Offline", desc: "Venda sem internet. Dados sincronizados automaticamente ao reconectar." },
                { title: "Suspensão de Venda", desc: "Salve a venda no meio do atendimento e recupere depois, sem perder itens." },
                { title: "Múltiplos Caixas", desc: "Gerencie vários PDVs ao mesmo tempo com relatórios por caixa." },
              ].map((f, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-lg hover:border-blue-100 transition-all group">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0 mt-0.5"><ShoppingCart size={16} /></div>
                    <div><p className="font-bold text-gray-900 mb-1">{f.title}</p><p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Estoque */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 px-1">📦 Estoque</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { title: "Entrada de Mercadoria", desc: "Lançamento de compras com suporte a NF-e e conferência de mercadoria." },
                { title: "Inventário", desc: "Inventário físico com ajuste automático e histórico de movimentações." },
                { title: "Curva ABC", desc: "Identifique os produtos estrela, os parados e os que precisam de atenção." },
                { title: "Agendamento de Ofertas", desc: "Programe promoções com antecedência. Ative e desative automaticamente." },
                { title: "Motor de Promoções", desc: "Leve 3 pague 2, desconto no segundo item e muito mais." },
                { title: "Produtos Sem Giro", desc: "Identifique itens parados e tome ação antes de virar prejuízo." },
              ].map((f, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-lg hover:border-blue-100 transition-all group">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600 group-hover:bg-green-500 group-hover:text-white transition-all shrink-0 mt-0.5"><Box size={16} /></div>
                    <div><p className="font-bold text-gray-900 mb-1">{f.title}</p><p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financeiro */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 px-1">💰 Financeiro</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { title: "Contas a Pagar", desc: "Controle de vencimentos, baixas e fluxo de caixa em tempo real." },
                { title: "Contas a Receber", desc: "Acompanhe recebimentos, inadimplência e projeções de receita." },
                { title: "Meta de Despesas", desc: "Calcule automaticamente a meta de vendas para cobrir todas as contas e salários." },
              ].map((f, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-lg hover:border-blue-100 transition-all group">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center text-yellow-600 group-hover:bg-yellow-500 group-hover:text-white transition-all shrink-0 mt-0.5"><Banknote size={16} /></div>
                    <div><p className="font-bold text-gray-900 mb-1">{f.title}</p><p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Relatórios */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 px-1">📊 Relatórios</h3>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { title: "Resumo Diário" },
                { title: "Movimento por Vendedor" },
                { title: "Resumo por Produto" },
                { title: "Resumo por Documento" },
                { title: "Posição de Estoque" },
                { title: "Relatório de Sangrias" },
                { title: "Faturamento" },
                { title: "Relação de Notas" },
              ].map((f, i) => (
                <div key={i} className="bg-white px-4 py-3 rounded-xl border border-gray-100 flex items-center gap-2 text-sm font-medium text-gray-700 hover:border-blue-200 hover:text-blue-700 transition-all">
                  <FileText size={14} className="text-blue-400 shrink-0" />{f.title}
                </div>
              ))}
            </div>
          </div>

          {/* Vendas e Cadastros */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 px-1">🧾 Vendas & Cadastros</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { title: "Trocas e Devoluções", desc: "Gerencie devoluções com rastreabilidade e reposição automática no estoque." },
                { title: "Gestão de Clientes", desc: "Cadastro completo com histórico de compras e dados de contato." },
                { title: "Usuários e Permissões", desc: "Defina o que cada colaborador pode ver e fazer no sistema." },
              ].map((f, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-lg hover:border-blue-100 transition-all group">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition-all shrink-0 mt-0.5"><Users size={16} /></div>
                    <div><p className="font-bold text-gray-900 mb-1">{f.title}</p><p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ROADMAP */}
      <section className="py-20 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block py-1 px-4 rounded-full bg-orange-50 text-orange-500 text-xs font-bold uppercase tracking-widest mb-4 border border-orange-100">🚀 Em desenvolvimento</span>
            <h2 className="text-3xl font-black text-gray-900 mb-3">O que está vindo por aí</h2>
            <p className="text-gray-500">Nosso roadmap é construído com base no feedback real dos nossos clientes.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { label: "Relatório X de Caixa", desc: "Visualização parcial da sessão aberta com descontos, sangrias e cancelamentos." },
              { label: "Gestão de Funcionários", desc: "Cargos, salários e controle de equipe integrado ao sistema." },
              { label: "Meta de Vendas Inteligente", desc: "Sistema calcula automaticamente a meta para pagar todas as despesas + pró-labore." },
              { label: "WhatsApp de Relatórios", desc: "Envio automático do resumo diário de vendas por caixa via WhatsApp." },
              { label: "Lançamento de Produção", desc: "Registre receitas e calcule custo de produção com margem de lucro automática." },
              { label: "Área Comercial", desc: "Pipeline de vendas, propostas e controle de clientes prospectados." },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-6 h-6 rounded-full bg-orange-100 border-2 border-orange-300 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-orange-400" />
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="precos" className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <span className="text-blue-600 font-bold uppercase tracking-[0.2em] text-[10px] mb-4 block">Invista no seu crescimento</span>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4 tracking-tight">Planos simples e honestos.</h2>
            <p className="text-slate-500 font-medium">Tudo o que você precisa para escalar sua operação.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5 items-stretch">
             <div className="p-8 rounded-[24px] border border-slate-200 bg-white flex flex-col hover:shadow-lg transition-all duration-500 group">
               <h3 className="text-xl font-bold mb-1 text-slate-900 group-hover:text-blue-600 transition-colors">Starter</h3>
               <p className="text-slate-500 text-[13px] mb-6 font-medium">Ideal para quem está dando os primeiros passos.</p>
               <div className="mb-6 flex items-baseline gap-1">
                 <span className="text-xs font-bold text-slate-400">R$</span>
                 <span className="text-4xl font-black text-slate-900">100</span>
                 <span className="text-slate-400 font-bold text-xs">/mês</span>
               </div>
               <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-3 text-slate-600 font-medium text-sm">
                  <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <Check size={12} className="text-blue-600" />
                  </div>
                  1 Usuário Ativo
                </li>
                <li className="flex items-center gap-3 text-slate-600 font-medium text-sm">
                  <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <Check size={12} className="text-blue-600" />
                  </div>
                  PDV Online e Frente de Loja
                </li>
                <li className="flex items-center gap-3 text-slate-600 font-medium text-sm">
                  <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <Check size={12} className="text-blue-600" />
                  </div>
                  Gestão Básica de Estoque
                </li>
                <li className="flex items-center gap-3 text-slate-600 font-medium text-sm">
                  <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <Check size={12} className="text-blue-600" />
                  </div>
                  Relatórios de Movimento
                </li>
              </ul>
               <Button variant="outline" className="w-full border-2 border-slate-200 h-12 rounded-xl font-bold hover:bg-slate-50 transition-colors group-hover:border-blue-600 group-hover:text-blue-600 text-sm">Começar Trial Grátis</Button>
             </div>
             
             <div className="p-8 rounded-[24px] bg-slate-900 text-white shadow-xl relative overflow-hidden flex flex-col transform hover:scale-[1.01] transition-all duration-500">
               <div className="absolute top-0 right-0 bg-blue-600 px-4 py-2 rounded-bl-xl font-bold text-[9px] uppercase tracking-widest">O Mais Vendido</div>
               <h3 className="text-xl font-bold mb-1">Professional</h3>
               <p className="text-slate-400 text-[13px] mb-6 font-medium">Gestão profissional para lojas em crescimento.</p>
               <div className="mb-6 flex items-baseline gap-1">
                 <span className="text-xs font-bold text-slate-500">R$</span>
                 <span className="text-4xl font-black text-white">200</span>
                 <span className="text-slate-500 font-bold text-xs">/mês</span>
               </div>
               <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-3 text-slate-300 font-medium text-sm">
                  <div className="w-5 h-5 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                    <CheckCheck size={12} className="text-blue-400" />
                  </div>
                  Usuários Ilimitados
                </li>
                <li className="flex items-center gap-3 text-slate-300 font-medium text-sm">
                  <div className="w-5 h-5 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                    <CheckCheck size={12} className="text-blue-400" />
                  </div>
                  PDV Offline + Múltiplos Caixas
                </li>
                <li className="flex items-center gap-3 text-slate-300 font-medium text-sm">
                  <div className="w-5 h-5 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                    <CheckCheck size={12} className="text-blue-400" />
                  </div>
                  Financeiro e Fluxo de Caixa Avançado
                </li>
                <li className="flex items-center gap-3 text-slate-300 font-medium text-sm">
                  <div className="w-5 h-5 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                    <CheckCheck size={12} className="text-blue-400" />
                  </div>
                  Coletor de Dados no Celular
                </li>
                <li className="flex items-center gap-3 text-slate-300 font-medium text-sm">
                  <div className="w-5 h-5 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                    <CheckCheck size={12} className="text-blue-400" />
                  </div>
                  Suporte Prioritário 24/7
                </li>
              </ul>
               <Button className="w-full bg-blue-600 hover:bg-blue-700 h-14 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all text-sm">Assinar Professional Now</Button>
             </div>
          </div>
        </div>
      </section>

      <section id="faq" className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-black text-center mb-12 tracking-tight">Dúvidas Frequentes</h2>
          <div className="space-y-3">
            {[
              { q: "Preciso de cartão de crédito para testar?", a: "Não. Basta preencher o formulário com seu CNPJ e e-mail para ativar os 7 dias gratuitos. Zero burocracia." },
              { q: "O PDV funciona sem internet?", a: "Sim! O PDV é offline-first. Você vende normalmente e os dados são sincronizados com o servidor assim que a conexão for restaurada." },
              { q: "Consigo controlar múltiplos caixas?", a: "Sim. Cada PDV tem seu próprio relatório e todas as vendas são consolidadas no painel central em tempo real." },
              { q: "Como funciona o suporte?", a: "Nosso suporte é via WhatsApp e e-mail. No plano Professional e Enterprise você tem atendimento prioritário com nossos especialistas." },
              { q: "Posso exportar meus dados?", a: "A qualquer momento. Seus dados são seus. Exporte relatórios em Excel, PDF ou CSV com poucos cliques." },
              { q: "O sistema emite NF-e?", a: "Sim, a integração com NF-e está disponível para entrada de mercadoria. Estamos expandindo para emissão de cupons fiscais nos próximos meses." }
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                <button onClick={() => toggleFaq(i)} className="w-full px-6 py-5 flex justify-between items-center text-left hover:bg-gray-50 transition-colors">
                  <span className="font-semibold text-gray-900">{item.q}</span>
                  {openFaq === i ? <ChevronUp size={18} className="text-blue-600 shrink-0" /> : <ChevronDown size={18} className="text-gray-400 shrink-0" />}
                </button>
                <div className={`px-6 overflow-hidden transition-all duration-300 ${openFaq === i ? "max-h-40 pb-5" : "max-h-0"}`}>
                  <p className="text-gray-500 leading-relaxed text-sm">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center p-6 bg-green-50 rounded-2xl border border-green-100">
            <p className="font-semibold text-gray-800 mb-2">Ainda tem dúvidas?</p>
            <a href="https://wa.me/5562993243263" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-5 py-2.5 rounded-full text-sm transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Chamar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-16 border-b border-gray-800 pb-16">
          <div className="col-span-2">
            <div className="text-3xl font-black mb-6 italic">Trakto<span className="text-blue-600 not-italic">ERP</span></div>
            <p className="text-gray-400 max-w-sm leading-relaxed font-medium">Ajudando empresas brasileiras a escalarem com tecnologia de ponta e gestão simplificada.</p>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-xs uppercase tracking-widest text-gray-500">Links</h4>
            <ul className="space-y-4 font-bold text-gray-300">
              <li><a href="#funcionalidades" className="hover:text-blue-400">Recursos</a></li>
              <li><a href="#precos" className="hover:text-blue-400">Preços</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-xs uppercase tracking-widest text-gray-500">Legal</h4>
            <ul className="space-y-4 font-bold text-gray-300">
              <li><a href="#" className="hover:text-blue-400">Termos</a></li>
              <li><a href="#" className="hover:text-blue-400">Privacidade</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 pt-12 text-center text-xs font-bold text-gray-600 uppercase tracking-[0.2em]">
          © {new Date().getFullYear()} Trakto ERP • Todos os direitos reservados
        </div>
      </footer>
    </div>
  );
}