import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  ShoppingCart, 
  BarChart3, 
  Package, 
  Zap, 
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  Monitor,
  CreditCard,
  Target,
  MessageCircle,
  TrendingUp,
  Users
} from "lucide-react";
import { useState, useEffect } from "react";

const faqData = [
  {
    question: "O sistema funciona sem internet?",
    answer: "Sim! Nosso PDV possui operação offline completa. Você continua vendendo normalmente e os dados são sincronizados automaticamente assim que a conexão for restabelecida."
  },
  {
    question: "Como funciona a integração com balanças?",
    answer: "Temos integração nativa com as principais marcas de balanças do mercado (Toledo, Filizola, Urano). O sistema lê o peso diretamente ou processa etiquetas de código de barras pesáveis."
  },
  {
    question: "O suporte é incluso na mensalidade?",
    answer: "Sim, nosso suporte VIP é ilimitado e humanizado via WhatsApp e acesso remoto, disponível de segunda a sábado em horário comercial ampliado."
  },
  {
    question: "Posso emitir notas fiscais pelo celular?",
    answer: "Sim, através do nosso painel administrativo web você pode gerenciar notas e acompanhar vendas de qualquer dispositivo com internet."
  },
  {
    question: "O sistema emite cupons fiscais (NFC-e)?",
    answer: "Com certeza. O sistema está totalmente adequado à legislação fiscal brasileira, emitindo NFC-e e SAT com contingência automática."
  }
];

export default function SupermercadoFeatures() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-primary/10">
      {/* Header Navigation */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold text-sm cursor-pointer">
              <ArrowLeft size={18} />
              VOLTAR PARA INÍCIO
            </a>
          </Link>
          <div className="text-xl font-black tracking-tighter text-slate-900">Trakto ERP</div>
          <Link href="/auth">
            <Button className="bg-primary text-white font-bold text-xs px-6 h-11 rounded-xl shadow-lg shadow-primary/20">COMEÇAR TRIAL</Button>
          </Link>
        </div>
      </header>

      <main>
        {/* Section 1: Hero - BLUE BACKGROUND */}
        <section className="bg-primary pt-40 pb-32 relative overflow-hidden text-white">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 grid lg:grid-cols-2 gap-16 items-center relative z-10">
            <div className="max-w-xl">
              <div className="inline-block px-4 py-1.5 bg-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-6 backdrop-blur-sm">
                Solução Completa
              </div>
              <h1 className="text-6xl lg:text-7xl font-black mb-8 tracking-tighter leading-[0.9]">
                Sistema para <br/>
                Supermercados
              </h1>
              <p className="text-xl text-white/80 font-medium mb-10 leading-relaxed">
                A solução mais rápida e segura para o varejo alimentar. Tenha controle total da sua loja, do estoque ao caixa, com tecnologia de ponta.
              </p>
              <Link href="/auth">
                <Button className="bg-white text-primary font-black py-4 px-10 rounded-2xl hover:bg-slate-50 transition-all shadow-2xl h-16 text-lg">
                  Solicitar Demonstração →
                </Button>
              </Link>
            </div>

            <div className="relative">
              <div className="absolute -inset-10 bg-white/10 rounded-full blur-3xl" />
              <div className="relative z-10 rounded-[40px] overflow-hidden shadow-2xl border-4 border-white/20">
                <img 
                  src="/images/hero-supermarket.webp" 
                  alt="Gestão Trakto ERP" 
                  className="w-full h-auto object-cover"
                />
              </div>
              
              {/* Floating elements like in the screenshot */}
              <div className="absolute -top-6 -left-10 z-20 bg-white p-4 rounded-2xl shadow-2xl border border-slate-50 text-slate-900">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <CheckCircle2 size={16} />
                  </div>
                  <p className="text-xs font-black">Vendas +32%</p>
                </div>
              </div>
              
              <div className="absolute bottom-10 -right-10 z-20 bg-white p-4 rounded-2xl shadow-2xl border border-slate-50 text-slate-900">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <ShieldCheck size={16} />
                  </div>
                  <p className="text-xs font-black">NFC-e Ativa</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Controle total com screenshot do PDV */}
        <section className="py-32 bg-white">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="text-center mb-24">
               <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">FUNCIONALIDADES ELITE</span>
               <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6 tracking-tight">Controle <span className="text-primary italic">total</span> para seu supermercado</h2>
               <p className="text-slate-500 font-bold max-w-2xl mx-auto">Interface desenhada para máxima produtividade, reduzindo o tempo de atendimento e erros humanos.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-6">
                {[
                  { icon: <Monitor />, title: "PDV em frente de caixa", desc: "Operação ultra-rápida mesmo offline." },
                  { icon: <Package />, title: "Estoque & Compras", desc: "Gestão inteligente de reposição." },
                  { icon: <BarChart3 />, title: "Financeiro Integrado", desc: "Controle total de fluxo de caixa." },
                  { icon: <Target />, title: "Relatórios de Venda", desc: "Acompanhe tudo em tempo real." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 p-6 bg-slate-50 rounded-[32px] border border-slate-100 hover:bg-white hover:shadow-xl transition-all group">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors shadow-sm">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900 mb-1">{item.title}</h4>
                      <p className="text-slate-500 font-medium text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative">
                <div className="absolute -inset-4 bg-primary/10 rounded-[40px] blur-3xl" />
                <div className="relative rounded-[40px] overflow-hidden shadow-2xl border-4 border-slate-100">
                  <img src="/images/pdv-screen.png" alt="PDV Trakto ERP" className="w-full h-auto" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md px-8 py-6 rounded-3xl shadow-2xl border border-white/50 text-center min-w-[200px]">
                     <span className="text-primary font-black text-2xl block mb-1">Caixa Livre</span>
                     <span className="text-slate-400 font-black text-sm uppercase tracking-widest">08:46:26</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-20 text-center">
               <Button className="bg-primary text-white font-black py-4 px-12 rounded-2xl h-16 shadow-xl shadow-primary/20">Conheça todos os recursos →</Button>
            </div>
          </div>
        </section>

        {/* Section 3: Tecnologia simples para transformar sua rotina */}
        <section className="py-32 bg-slate-50 border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="text-center mb-24">
              <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6 tracking-tight">Tecnologia simples para <span className="text-primary italic">transformar</span> sua rotina</h2>
              <p className="text-slate-500 font-bold max-w-2xl mx-auto">Focamos na simplicidade para que você possa focar no crescimento.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 mb-24">
              <div className="bg-white p-10 rounded-[40px] shadow-xl border border-slate-100 hover:scale-[1.02] transition-transform cursor-pointer">
                 <h3 className="text-3xl font-black text-slate-900 mb-4">Gestão <span className="text-primary italic">sem burocracia</span></h3>
                 <p className="text-slate-500 font-bold leading-relaxed">Fácil de usar para qualquer colaborador, reduzindo drasticamente o tempo de treinamento e erros operacionais.</p>
              </div>

              <div className="bg-white p-10 rounded-[40px] shadow-xl border border-slate-100 hover:scale-[1.02] transition-transform cursor-pointer">
                 <h3 className="text-3xl font-black text-slate-900 mb-4">Processos <span className="text-primary italic">inteligentes</span></h3>
                 <p className="text-slate-500 font-bold leading-relaxed">Automatize tarefas repetitivas e tenha controle total sobre cada centavo do seu negócio de forma simplificada.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Benefícios que geram lucro de verdade */}
        <section className="py-32 bg-white">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="text-center mb-24">
              <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">RESULTADOS REAIS</span>
              <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6 tracking-tight">Benefícios que geram <span className="text-primary italic">lucro</span> de verdade</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-20">
               {[
                 { icon: <TrendingUp />, title: "Mais produtividade", desc: "Equipe focada no atendimento ao cliente." },
                 { icon: <Package />, title: "Menos erros de estoque", desc: "Controle preciso de cada item na prateleira." },
                 { icon: <Users />, title: "Melhor experiência", desc: "Seu cliente volta pela rapidez e organização." }
               ].map((item, i) => (
                 <div key={i} className="p-10 bg-slate-50 rounded-[40px] border border-slate-100 text-center hover:bg-white hover:shadow-2xl transition-all">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary mx-auto mb-8 shadow-sm">
                      {item.icon}
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 mb-4">{item.title}</h4>
                    <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                 </div>
               ))}
            </div>

            <div className="text-center">
               <Button className="bg-primary text-white font-black py-3 px-10 rounded-xl h-14 shadow-xl shadow-primary/20">Ver todos os benefícios →</Button>
            </div>
          </div>
        </section>

        {/* Section 5: Controle total com tecnologia feita para supermercados */}
        <section className="py-32 bg-slate-50">
           <div className="max-w-7xl mx-auto px-4 lg:px-8">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                 <div className="relative">
                    <img src="/images/supermarket-aisle.webp" alt="Operação Supermercado" className="rounded-[40px] shadow-2xl" />
                    <div className="absolute -top-8 -left-8 bg-primary text-white p-6 rounded-[32px] shadow-2xl">
                       <Zap size={32} />
                    </div>
                 </div>
                 <div>
                    <h2 className="text-4xl lg:text-5xl font-black mb-10 leading-tight">Controle total com tecnologia feita para <span className="text-primary">supermercados</span></h2>
                    <ul className="grid sm:grid-cols-1 gap-4 mb-12">
                       {[
                         "PDV ultra-rápido que opera sem internet",
                         "Integração nativa com balanças e teclados",
                         "Emissão de NFC-e / SAT / NF-e simplificada",
                         "Controle de validade e gestão de gôndola",
                         "Relatórios fiscais automatizados",
                         "Dashboard mobile em tempo real"
                       ].map((item, i) => (
                         <li key={i} className="flex items-center gap-4">
                            <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary shrink-0">
                               <CheckCircle2 size={14} strokeWidth={3} />
                            </div>
                            <span className="font-bold text-slate-300">{item}</span>
                         </li>
                       ))}
                    </ul>
                    <Button className="bg-primary text-white font-black py-3 px-10 rounded-xl h-14 shadow-xl text-base w-full sm:w-auto">Eu quero o Controle Total →</Button>
                 </div>
              </div>
           </div>
        </section>

        {/* Section 6: FAQ */}
        <section className="py-32 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Dúvidas <span className="text-primary italic">sobre</span> nosso sistema</h2>
            </div>

            <div className="space-y-4">
              {faqData.map((faq, i) => (
                <div key={i} className="border border-slate-100 rounded-3xl overflow-hidden bg-slate-50/50">
                  <button 
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full p-8 flex items-center justify-between text-left"
                  >
                    <span className="text-lg font-black text-slate-900">{faq.question}</span>
                    <ChevronDown className={`text-slate-400 transition-transform duration-500 ${openFaq === i ? 'rotate-180 text-primary' : ''}`} />
                  </button>
                  <div className={`transition-all duration-500 ease-in-out ${openFaq === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                    <div className="p-8 pt-0 text-slate-500 font-medium leading-relaxed border-t border-slate-100/50">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-4 gap-16 mb-20">
             <div>
                <div className="flex items-center space-x-3 mb-8">
                  <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-white">
                    <Store size={22} />
                  </div>
                  <span className="text-2xl font-black tracking-tighter">Trakto ERP</span>
                </div>
                <p className="text-slate-400 font-medium">Tecnologia para o varejo alimentar com foco em eficiência.</p>
             </div>
             {/* Link columns would go here as in the image */}
          </div>
          <div className="pt-12 border-t border-white/5 text-center text-slate-500 font-bold text-[10px] uppercase tracking-widest">
            <p>© {new Date().getFullYear()} Trakto ERP • TECNOLOGIA PARA VAREJO ALIMENTAR</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Store(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
      <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
    </svg>
  );
}
