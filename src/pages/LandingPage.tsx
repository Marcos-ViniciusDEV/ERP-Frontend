import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Check,
  Zap,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Menu,
  X,
  Store,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [, setLocation] = useLocation();

  const { user, isAuthenticated } = useAuth({
    redirectOnUnauthenticated: false,
  });

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, user, setLocation]);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.08,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-visible");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll(".reveal-on-scroll");
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white scroll-smooth text-slate-900">
      <style dangerouslySetInnerHTML={{__html: `
        .reveal-on-scroll {
          opacity: 0;
          transform: translateY(40px) scale(0.97);
          filter: blur(2px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform, opacity, filter;
        }
        .reveal-visible {
          opacity: 1 !important;
          transform: translateY(0) scale(1) !important;
          filter: blur(0) !important;
        }
        .reveal-card {
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .reveal-card:hover {
          transform: translateY(-8px) scale(1.02) !important;
          box-shadow: 0 25px 50px -12px rgba(59, 130, 246, 0.22) !important;
        }
      `}} />
      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/5562993243263"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center bg-[#25D366] hover:bg-[#128C7E] text-white font-bold p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95"
        title="Fale conosco no WhatsApp"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer group">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform">
              <Store size={22} />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900">Trakto ERP</span>
          </div>
          <nav className="hidden md:flex items-center space-x-10 text-sm font-bold text-slate-500">
            <a href="#funcionalidades" className="hover:text-primary transition-colors">Recursos</a>
            <a href="#precos" className="hover:text-primary transition-colors">Planos</a>
            <a href="#faq" className="hover:text-primary transition-colors">Suporte</a>
          </nav>
          <div className="hidden md:flex items-center gap-4">
            <Link href="/auth">
              <a className="text-sm font-bold text-slate-600 hover:text-primary transition-colors px-4 py-2 cursor-pointer">
                Entrar
              </a>
            </Link>
            <Link href="/auth">
              <a className="bg-primary text-white font-bold py-3 px-6 rounded-2xl hover:brightness-110 transition-all shadow-xl shadow-primary/25 text-sm cursor-pointer">
                Solicitar Demonstração
              </a>
            </Link>
          </div>
          <button className="md:hidden p-2 text-slate-900" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t p-8 space-y-6 shadow-2xl animate-in slide-in-from-top duration-300">
            <nav className="flex flex-col space-y-5 font-bold text-slate-600">
              <a href="#funcionalidades" onClick={() => setIsMobileMenuOpen(false)}>Recursos</a>
              <a href="#precos" onClick={() => setIsMobileMenuOpen(false)}>Planos</a>
              <a href="#faq" onClick={() => setIsMobileMenuOpen(false)}>Suporte</a>
            </nav>
            <Button className="w-full bg-primary h-14 rounded-2xl font-bold" onClick={() => setIsMobileMenuOpen(false)}>Testar Grátis</Button>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative pt-40 pb-0 overflow-hidden bg-white">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />

        <div className="max-w-7xl mx-auto px-4 lg:px-8 grid lg:grid-cols-2 gap-16 items-center relative z-10 mb-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-primary/10 text-primary text-xs font-bold mb-8">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />
              Sistema completo para seu negócio
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.05] mb-8 tracking-tighter">
              Sistema de Gestão para Varejo: <br/>
              <span className="text-primary italic">PDV e NF-e</span>
            </h1>
            <p className="text-lg text-slate-600 mb-10 leading-relaxed font-medium">
              Automatize vendas, controle estoque e emita notas fiscais com agilidade. Solução ideal para <span className="text-primary font-black">supermercados</span> e comércio em geral.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/auth">
                <a className="bg-primary text-white font-black py-4 px-8 rounded-2xl hover:scale-105 transition-all shadow-2xl shadow-primary/30 text-base cursor-pointer">
                  Solicitar Demonstração
                </a>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-primary/20 rounded-[40px] blur-3xl opacity-20" />
            
            {/* Main Hero Image */}
            <div className="relative z-10 rounded-[40px] overflow-hidden shadow-2xl shadow-primary/10 border-4 border-white">
              <img 
                src="/images/hero-business-woman.webp" 
                alt="Gestão Trakto ERP" 
                className="w-full h-auto object-cover"
              />
            </div>

            {/* Floating Badges */}
            <div className="absolute -top-6 -left-10 z-20 bg-white p-4 rounded-2xl shadow-2xl border border-slate-50 animate-bounce duration-[3000ms]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <Check size={16} strokeWidth={3} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Vendas</p>
                  <p className="text-xs font-black text-slate-900">+32% este mês</p>
                </div>
              </div>
            </div>

            <div className="absolute top-1/2 -right-8 z-20 bg-white p-4 rounded-2xl shadow-2xl border border-slate-50 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Notas Fiscais</p>
                  <p className="text-xs font-black text-slate-900">Emitidas com sucesso</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 left-1/4 z-20 bg-white p-4 rounded-2xl shadow-2xl border border-slate-50 animate-bounce duration-[2000ms]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <Zap size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Atendimento</p>
                  <p className="text-xs font-black text-slate-900">Resposta imediata</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Bottom Stats Bar */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-8 relative z-20 overflow-hidden mt-10 border-y border-white/10 shadow-lg">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-3">
            <h3 className="text-white text-xl md:text-2xl font-black tracking-tight leading-snug">
              🚀 Aqui na Trakto, conferir mercadoria no papel ficou no passado!
            </h3>
            <p className="text-blue-100 text-sm md:text-base font-semibold leading-relaxed max-w-2xl mx-auto opacity-95">
              Com nosso ERP, seu celular se transforma em um coletor profissional, trazendo mais rapidez, precisão e eficiência para sua operação.
            </p>
          </div>
        </div>
      </section>

      {/* Solutions by Segment */}
      <section id="solucoes" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Soluções <span className="text-primary italic">específicas</span> para o seu tipo de negócio</h2>
            <p className="text-slate-500 font-bold">Escolha a solução ideal para o seu segmento e transforme a gestão do seu negócio</p>
          </div>

          <div className="flex justify-center max-w-2xl mx-auto">
            <div className="bg-white rounded-[40px] overflow-hidden shadow-xl shadow-slate-200/50 transition-transform group w-full reveal-on-scroll reveal-card">
              <div className="h-64 relative overflow-hidden bg-slate-100">
                <img src="/images/supermarket-showcase.webp" alt="Supermercado Real" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-4 left-4 bg-primary text-white px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest">Supermercados</div>
              </div>
              <div className="p-8 text-center">
                <h3 className="text-2xl font-black text-slate-900 mb-3">Supermercados</h3>
                <p className="text-slate-500 font-medium mb-6 leading-relaxed text-sm mx-auto max-w-md">
                  Controle total de frente de loja, balanças integradas e gestão de gôndolas.
                </p>
                <div className="flex flex-wrap gap-2 mb-8 justify-center">
                  <span className="px-3 py-1 bg-slate-50 text-slate-400 font-bold text-[9px] uppercase rounded-md border">Balança</span>
                  <span className="px-3 py-1 bg-slate-50 text-slate-400 font-bold text-[9px] uppercase rounded-md border">NFC-e</span>
                </div>
                <Link href="/solucoes/supermercado">
                  <Button className="w-full bg-slate-900 hover:bg-primary text-white font-black h-12 rounded-xl transition-all shadow-lg text-xs">
                    Saiba mais sobre Supermercados
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="funcionalidades" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Funcionalidades que <span className="text-primary italic">transformam</span> seu negócio</h2>
            <p className="text-slate-500 font-bold">Nossas soluções são desenvolvidas para atender às necessidades específicas do varejo</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { 
                icon: <ShoppingCart className="text-primary" size={32} />, 
                title: "PDV rápido e integrado", 
                desc: "Otimize o atendimento com um PDV ágil e fácil de usar, integrado ao estoque e à emissão de NF-e." 
              },
              { 
                icon: <TrendingUp className="text-primary" size={32} />, 
                title: "Controle financeiro e de estoque", 
                desc: "Tenha total controle de caixa, entradas, saídas, contas a pagar e receber com relatórios inteligentes." 
              },
              { 
                icon: <ShieldCheck className="text-primary" size={32} />, 
                title: "Segurança total", 
                desc: "Tenha seus dados protegidos com backup automático e criptografia de ponta a ponta." 
              }
            ].map((f, i) => (
              <div key={i} className="p-8 rounded-[32px] bg-slate-50 transition-all group text-center flex flex-col items-center reveal-on-scroll reveal-card" style={{ transitionDelay: `${i * 150}ms` }}>
                <div className="mb-6 p-4 bg-white rounded-2xl w-fit shadow-sm group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-xl font-black mb-3">{f.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        
        <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Planos que <span className="text-primary italic">cabem</span> no seu bolso</h2>
            <p className="text-slate-500 font-bold">Escolha o plano ideal para o momento do seu negócio</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Starter Plan */}
            <Card className="p-8 border-0 shadow-2xl rounded-[32px] bg-white flex flex-col h-full reveal-on-scroll reveal-card" style={{ transitionDelay: "0ms" }}>
              <div className="mb-8">
                <h3 className="text-xl font-black mb-2">Starter</h3>
                <p className="text-slate-400 font-bold text-sm">Ideal para pequenos negócios</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-black text-slate-900">R$ 99</span>
                <span className="text-slate-400 font-bold">/mês</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <div className="h-5 w-5 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  1 Usuário Ativo
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <div className="h-5 w-5 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  PDVs Ilimitados
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <div className="h-5 w-5 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  Emissão de Notas (NFC-e)
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <div className="h-5 w-5 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  Suporte Horário Comercial
                </li>
              </ul>
              <Button className="w-full h-12 bg-slate-100 hover:bg-primary hover:text-white text-slate-900 font-black rounded-xl transition-all shadow-none">Começar Agora</Button>
            </Card>

            {/* Professional Plan */}
            <Card className="p-8 border-primary border-2 shadow-2xl shadow-primary/20 rounded-[32px] bg-white flex flex-col h-full relative overflow-hidden reveal-on-scroll reveal-card" style={{ transitionDelay: "150ms" }}>
              <div className="absolute top-4 right-[-35px] bg-primary text-white text-[10px] font-black uppercase py-1 px-10 rotate-45">Popular</div>
              <div className="mb-8">
                <h3 className="text-xl font-black mb-2 text-primary">Profissional</h3>
                <p className="text-slate-400 font-bold text-sm">Para lojas em crescimento</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-black text-slate-900">R$ 199</span>
                <span className="text-slate-400 font-bold">/mês</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <div className="h-5 w-5 bg-primary rounded-full flex items-center justify-center text-white">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  Usuários Ilimitados
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <div className="h-5 w-5 bg-primary rounded-full flex items-center justify-center text-white">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  PDVs Ilimitados
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <div className="h-5 w-5 bg-primary rounded-full flex items-center justify-center text-white">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  PDV Offline
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <div className="h-5 w-5 bg-primary rounded-full flex items-center justify-center text-white">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  APK do sistema para ser usado como coletor
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <div className="h-5 w-5 bg-primary rounded-full flex items-center justify-center text-white">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  Gestão de Estoque Avançada
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <div className="h-5 w-5 bg-primary rounded-full flex items-center justify-center text-white">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  Suporte via WhatsApp
                </li>
              </ul>
              <Button className="w-full h-12 bg-primary hover:brightness-110 text-white font-black rounded-xl transition-all shadow-xl shadow-primary/25">Assinar Plano</Button>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden reveal-on-scroll">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[150px] opacity-30" />
        <div className="max-w-7xl mx-auto px-4 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <img src="/images/supermarket_real.png" alt="Trakto ERP em operação" className="rounded-[40px] shadow-2xl hover:scale-[1.02] transition-all duration-700" />
            </div>
            <div>
              <span className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-6 block">Sobre a Trakto ERP</span>
              <h2 className="text-4xl lg:text-5xl font-black mb-8 leading-tight tracking-tight">Referência em <span className="text-primary italic">Tecnologia para Varejo</span> no Brasil</h2>
              <p className="text-xl text-slate-300 font-bold mb-10 leading-relaxed italic">
                "4 anos gerenciando loja me ensinaram o que nenhum sistema resolvia. Por isso criamos o Trakto ERP — do chão de loja para o seu negócio."
              </p>
            </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Dúvidas Frequentes</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: "O sistema emite NF-e e NFC-e?", a: "Sim, emitimos todos os documentos fiscais necessários para o varejo, incluindo NF-e, NFC-e e integração com SAT/MFE." },
              { q: "O PDV funciona sem internet?", a: "Sim! Nosso PDV é offline-first. Você continua vendendo e o sistema sincroniza os dados automaticamente assim que a internet voltar." },
              { q: "Consigo importar meus dados de outro sistema?", a: "Com certeza. Nossa equipe auxilia na migração de dados de produtos, clientes e fornecedores para que você comece rápido." },
              { q: "Como funciona o suporte técnico?", a: "Oferecemos suporte humano via WhatsApp e acesso remoto em horário comercial, com plantão para emergências de PDV." }
            ].map((item, i) => (
              <div key={i} className="border-b border-slate-100 pb-4 reveal-on-scroll" style={{ transitionDelay: `${i * 100}ms` }}>
                <button onClick={() => toggleFaq(i)} className="w-full py-4 flex justify-between items-center text-left hover:text-primary transition-colors">
                  <span className="font-black text-slate-900">{item.q}</span>
                  {openFaq === i ? <ChevronUp size={20} className="text-primary" /> : <ChevronDown size={20} className="text-slate-300" />}
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? "max-h-40 pb-4" : "max-h-0"}`}>
                  <p className="text-slate-500 font-medium leading-relaxed">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 pt-24 pb-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2">
            <div className="flex items-center space-x-3 mb-8">
               <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white">
                <Store size={18} />
              </div>
              <span className="text-xl font-black tracking-tighter text-slate-900">Trakto ERP</span>
            </div>
            <p className="text-slate-500 font-medium max-w-sm leading-relaxed">
              Transformando a gestão do varejo com tecnologia de ponta e suporte humanizado. Supermercados e Casas de Ração mais eficientes.
            </p>
          </div>
          <div>
            <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-8">Links Rápidos</h4>
            <ul className="space-y-4 font-bold text-sm text-slate-500">
              <li><a href="#solucoes" className="hover:text-primary transition-colors">Soluções</a></li>
              <li><a href="#funcionalidades" className="hover:text-primary transition-colors">Funcionalidades</a></li>
              <li><a href="#precos" className="hover:text-primary transition-colors">Preços</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-8">Contato</h4>
            <ul className="space-y-4 font-bold text-sm text-slate-500">
              <li className="flex items-center gap-2">WhatsApp: (62) 99324-3263</li>
              <li className="flex items-center gap-2">E-mail: traktoerp@gmail.com</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-12 border-t border-slate-200 text-center">
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} Trakto ERP • TECNOLOGIA PARA VAREJO
          </p>
        </div>
      </footer>
    </div>
  );
}
