import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Check, CheckCircle2, Copy, CreditCard, FileText, LockKeyhole, ShieldCheck, Store, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, getCheckoutCompanySession } from "@/lib/api";
import { useAuth } from "@/_core/hooks/useAuth";

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options: { locale: string }) => {
      bricks: () => {
        create: (type: string, container: string, settings: unknown) => Promise<{ unmount: () => void | Promise<void> }>;
      };
    };
  }
}

type Plan = { codigo: string; nome: string; descricao: string; valorMensalCentavos: number; valorMensalPadraoCentavos: number; destaque?: boolean; beneficios: string[] };
type Checkout = {
  uuid: string;
  planoCodigo: string;
  planoNome: string;
  valorCentavos: number;
  periodoMeses: number;
  formaPagamento?: string | null;
  status: "PENDENTE" | "APROVADO" | "REJEITADO" | "CANCELADO" | "EXPIRADO" | "ERRO";
  qrCodePix?: string | null;
  qrCodeBase64?: string | null;
  ticketUrl?: string | null;
};

const fallbackPlans: Plan[] = [
  { codigo: "starter", nome: "Starter", descricao: "Ideal para pequenos negocios que querem organizar a operacao.", valorMensalCentavos: 10000, valorMensalPadraoCentavos: 15000, beneficios: ["1 usuario ativo", "PDVs ilimitados", "Controle de estoque e financeiro", "Emissao de NFC-e preparada"] },
  { codigo: "profissional", nome: "Profissional", descricao: "Para lojas em crescimento que precisam de mais autonomia.", valorMensalCentavos: 20000, valorMensalPadraoCentavos: 25000, destaque: true, beneficios: ["Usuarios ilimitados", "PDVs ilimitados", "PDV offline", "Coletor mobile", "Gestao de estoque avancada"] },
];
const formatCurrency = (centavos: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100);
const whatsappSalesUrl = "https://wa.me/5562993243263?text=Ol%C3%A1%2C%20gostaria%20de%20consultar%20um%20vendedor%20sobre%20os%20planos%20do%20Trakto%20ERP.";
const formatCnpj = (value?: string | null) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length !== 14) return value || "CNPJ não informado";
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
};

function loadMercadoPagoSdk() {
  return new Promise<void>((resolve, reject) => {
    if (window.MercadoPago) return resolve();
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://sdk.mercadopago.com/js/v2"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Falha ao carregar Mercado Pago")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Falha ao carregar Mercado Pago"));
    document.head.appendChild(script);
  });
}

export function CheckoutAssinatura() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const checkoutCompanySession = useMemo(() => getCheckoutCompanySession(), []);
  const hasCheckoutAccess = isAuthenticated || Boolean(checkoutCompanySession);
  const checkoutCompany = user?.empresa || checkoutCompanySession?.empresa;
  const queryPlan = new URLSearchParams(window.location.search).get("plano") || "profissional";
  const [plans, setPlans] = useState<Plan[]>(fallbackPlans);
  const [selectedCode, setSelectedCode] = useState(queryPlan);
  const [periodoMeses, setPeriodoMeses] = useState<1 | 6 | 12>(1);
  const [publicKey, setPublicKey] = useState("");
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [brickActive, setBrickActive] = useState(false);
  const [loadingBrick, setLoadingBrick] = useState(false);
  const [customer, setCustomer] = useState({ nomeResponsavel: "", telefone: "" });
  const selectedPlan = useMemo(() => plans.find((plan) => plan.codigo === selectedCode) || plans[0], [plans, selectedCode]);
  const valorMensalEfetivoCentavos = periodoMeses === 12 ? selectedPlan.valorMensalCentavos : selectedPlan.valorMensalPadraoCentavos;
  const totalCentavos = valorMensalEfetivoCentavos * periodoMeses;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (authLoading || hasCheckoutAccess) return;
    const returnPath = `${window.location.pathname}${window.location.search}`;
    window.location.href = `/login?redirect=${encodeURIComponent(returnPath)}`;
  }, [authLoading, hasCheckoutAccess]);

  useEffect(() => {
    if (!user && !checkoutCompany) return;
    setCustomer((current) => ({
      nomeResponsavel: current.nomeResponsavel || user?.name || checkoutCompany?.nomeFantasia || checkoutCompany?.razaoSocial || "",
      telefone: current.telefone || checkoutCompany?.telefone || "",
    }));
  }, [user, checkoutCompany]);

  useEffect(() => {
    if (!hasCheckoutAccess) return;
    api.get<Plan[]>("/checkout/planos").then(({ data }) => setPlans(data)).catch(() => undefined);
    api.get<{ publicKey: string }>("/checkout/configuracao").then(({ data }) => setPublicKey(data.publicKey)).catch(() => undefined);
  }, [hasCheckoutAccess]);

  useEffect(() => {
    if (!checkout || checkout.status !== "PENDENTE") return;
    const timer = window.setInterval(async () => {
      try {
        const { data } = await api.get<Checkout>(`/checkout/${checkout.uuid}/status`);
        setCheckout(data);
        if (data.status === "APROVADO") toast.success("Pagamento confirmado.");
      } catch {
        // O proximo ciclo tenta novamente sem interromper o checkout.
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [checkout?.uuid, checkout?.status]);

  useEffect(() => {
    if (!brickActive || !publicKey || checkout) return;
    let controller: { unmount: () => void | Promise<void> } | undefined;
    let cancelled = false;
    setLoadingBrick(true);
    loadMercadoPagoSdk()
      .then(async () => {
        if (cancelled || !window.MercadoPago) return;
        const mercadoPago = new window.MercadoPago(publicKey, { locale: "pt-BR" });
        controller = await mercadoPago.bricks().create("payment", "paymentBrick_container", {
          initialization: { amount: totalCentavos / 100 },
          customization: {
            paymentMethods: { creditCard: "all", debitCard: "all", ticket: "all", bankTransfer: "all" },
          },
          callbacks: {
            onReady: () => setLoadingBrick(false),
            onError: (error: unknown) => {
              console.error("[Mercado Pago Brick]", error);
              toast.error("Nao foi possivel carregar as formas de pagamento.");
              setLoadingBrick(false);
            },
            onSubmit: async ({ formData }: { formData: unknown }) => {
              try {
                const { data } = await api.post<Checkout>("/checkout/pagamentos", {
                  planoCodigo: selectedPlan.codigo,
                  periodoMeses,
                  nomeResponsavel: customer.nomeResponsavel,
                  telefone: customer.telefone,
                  payment: formData,
                });
                setCheckout(data);
              } catch (error: any) {
                toast.error(error.response?.data?.error || error.response?.data?.message || "Nao foi possivel processar o pagamento.");
                throw error;
              }
            },
          },
        });
      })
      .catch(() => {
        toast.error("Nao foi possivel carregar o checkout seguro do Mercado Pago.");
        setLoadingBrick(false);
      });
    return () => {
      cancelled = true;
      Promise.resolve(controller?.unmount()).catch(() => undefined);
    };
  }, [brickActive, publicKey, selectedPlan.codigo, totalCentavos, periodoMeses, customer.nomeResponsavel, customer.telefone, checkout]);

  function startPayment(event: React.FormEvent) {
    event.preventDefault();
    if (!publicKey) {
      toast.error("Configure a Public Key do Mercado Pago para liberar o checkout.");
      return;
    }
    setBrickActive(true);
  }

  async function copyPix() {
    if (!checkout?.qrCodePix) return;
    await navigator.clipboard.writeText(checkout.qrCodePix);
    toast.success("Codigo PIX copiado.");
  }

  const qrImage = checkout?.qrCodeBase64 ? checkout.qrCodeBase64.startsWith("data:") ? checkout.qrCodeBase64 : `data:image/png;base64,${checkout.qrCodeBase64}` : null;
  if (authLoading || !hasCheckoutAccess) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm font-bold text-slate-300">Validando acesso da empresa...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-5">
          <Link href="/" className="flex shrink-0 items-center gap-3 font-black tracking-tight">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600"><Store size={21} /></span>
            <span className="text-xl">Trakto ERP</span>
          </Link>
          <div className="flex flex-col items-end gap-1.5 text-right">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">
              Empresa logada: <strong className="text-white">{formatCnpj(checkoutCompany?.cnpj)}</strong>
            </span>
            <span className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300 sm:flex">
              <LockKeyhole size={13} /> Checkout seguro Mercado Pago
            </span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-12 lg:py-16">
        <section className="mb-12 max-w-3xl"><p className="mb-4 text-xs font-black uppercase tracking-[0.32em] text-blue-400">Assinatura da empresa</p><h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">Mais controle para sua loja. Menos tempo perdido na operacao.</h1><p className="mt-5 max-w-2xl text-lg font-medium leading-relaxed text-slate-300">Escolha seu plano, o periodo de acesso e pague com PIX, cartao ou boleto. A compra sera vinculada a <strong>{checkoutCompany?.nomeFantasia || checkoutCompany?.razaoSocial || "sua empresa"}</strong>.</p></section>
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section>
            <div className="mb-8 grid gap-4 md:grid-cols-2">{plans.map((plan) => <button key={plan.codigo} type="button" disabled={brickActive} onClick={() => { setSelectedCode(plan.codigo); setCheckout(null); }} className={`relative rounded-3xl border p-6 text-left transition-all ${selectedPlan.codigo === plan.codigo ? "border-blue-400 bg-blue-500/15 shadow-xl shadow-blue-950" : "border-white/10 bg-white/5 hover:border-white/30"}`}>{plan.destaque && <span className="absolute right-5 top-5 rounded-full bg-blue-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest">Mais escolhido</span>}<h2 className="text-2xl font-black">{plan.nome}</h2><p className="mt-2 pr-12 text-sm font-medium leading-relaxed text-slate-400">{plan.descricao}</p><p className="mt-5 text-xs font-black uppercase tracking-widest text-blue-300">A partir de</p><p className="mt-1 text-3xl font-black">{formatCurrency(plan.valorMensalCentavos)}<span className="text-sm text-slate-400">/mes no anual</span></p><p className="mt-2 text-xs font-bold text-slate-400">{formatCurrency(plan.valorMensalPadraoCentavos)}/mes nos planos de 1 ou 6 meses</p><ul className="mt-5 space-y-3">{plan.beneficios.map((benefit) => <li key={benefit} className="flex items-center gap-2 text-sm font-bold text-slate-200"><Check size={16} className="text-emerald-400" />{benefit}</li>)}</ul></button>)}</div>
            <div className="grid gap-4 sm:grid-cols-3">{[[CreditCard, "Mais opcoes", "Cartao, PIX e boleto no mesmo checkout."], [ShieldCheck, "Pagamento seguro", "Dados do cartao tokenizados pelo Mercado Pago."], [Zap, "Ativacao simples", "Acompanhe a confirmacao automaticamente."]].map(([Icon, title, text]) => <div key={String(title)} className="rounded-2xl border border-white/10 bg-white/5 p-5"><Icon className="text-blue-400" size={22} /><h3 className="mt-4 font-black">{title as string}</h3><p className="mt-2 text-sm leading-relaxed text-slate-400">{text as string}</p></div>)}</div>
          </section>
          <aside className="rounded-[32px] bg-white p-7 text-slate-900 shadow-2xl md:p-8">
            {checkout?.status === "APROVADO" ? <div className="py-10 text-center"><CheckCircle2 className="mx-auto text-emerald-500" size={64} /><h2 className="mt-5 text-3xl font-black">Pagamento confirmado</h2><p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">Recebemos seu pagamento. Agora voce pode criar seu acesso.</p><Link href="/register"><Button className="mt-7 h-12 w-full rounded-xl bg-emerald-600 font-black hover:bg-emerald-700">Criar meu acesso</Button></Link></div> : checkout ? <div className="text-center"><p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">Aguardando pagamento</p><h2 className="mt-3 text-2xl font-black">{checkout.qrCodePix ? "Escaneie o QR Code PIX" : checkout.ticketUrl ? "Seu boleto foi gerado" : "Pagamento em processamento"}</h2><p className="mt-3 text-sm font-bold text-slate-500">{checkout.periodoMeses} mes(es) de acesso por {formatCurrency(checkout.valorCentavos)}</p>{qrImage && <img src={qrImage} alt="QR Code PIX" className="mx-auto mt-6 h-60 w-60 rounded-2xl border p-3" />}{checkout.qrCodePix && <Button type="button" variant="outline" className="mt-5 h-12 w-full rounded-xl font-black" onClick={copyPix}><Copy size={16} /> Copiar codigo PIX</Button>}{checkout.ticketUrl && <a href={checkout.ticketUrl} target="_blank" rel="noreferrer"><Button type="button" className="mt-5 h-12 w-full rounded-xl bg-blue-600 font-black hover:bg-blue-700"><FileText size={16} /> Abrir boleto</Button></a>}<p className="mt-5 text-xs font-bold text-slate-400">A confirmacao e atualizada automaticamente.</p></div> : brickActive ? <div><p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">Pagamento seguro</p><h2 className="mt-3 text-2xl font-black">Escolha como pagar</h2><p className="mt-2 text-sm font-bold text-slate-500">{periodoMeses} mes(es), {formatCurrency(valorMensalEfetivoCentavos)}/mes, total de {formatCurrency(totalCentavos)}</p>{loadingBrick && <p className="mt-5 text-sm font-medium text-slate-500">Carregando formas de pagamento...</p>}<div id="paymentBrick_container" className="mt-5" /></div> : <form onSubmit={startPayment}><p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">Checkout Mercado Pago</p><h2 className="mt-3 text-2xl font-black">Assinar plano {selectedPlan.nome}</h2><p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">Escolha o periodo e continue para pagar com PIX, cartao ou boleto.</p><div className="mt-6 space-y-4"><div><Label>Periodo de acesso</Label><div className="mt-2 grid grid-cols-3 gap-2">{([1, 6, 12] as const).map((months) => <button key={months} type="button" onClick={() => setPeriodoMeses(months)} className={`rounded-xl border px-3 py-3 text-sm font-black transition-colors ${periodoMeses === months ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500 hover:border-blue-300"}`}>{months} {months === 1 ? "mes" : "meses"}</button>)}</div><p className="mt-3 text-sm font-black text-slate-700">{formatCurrency(valorMensalEfetivoCentavos)}/mes. Total: {formatCurrency(totalCentavos)}</p></div><div><Label htmlFor="nome">Nome do responsavel</Label><Input id="nome" className="mt-2 h-11" required value={customer.nomeResponsavel} onChange={(e) => setCustomer({ ...customer, nomeResponsavel: e.target.value })} /></div><div><Label htmlFor="telefone">Telefone</Label><Input id="telefone" className="mt-2 h-11" value={customer.telefone} onChange={(e) => setCustomer({ ...customer, telefone: e.target.value })} /></div></div><Button className="mt-7 h-12 w-full rounded-xl bg-blue-600 font-black hover:bg-blue-700">Escolher forma de pagamento</Button><p className="mt-4 text-center text-xs font-medium text-slate-400">Seus dados bancarios sao processados diretamente pelo Mercado Pago.</p></form>}
          </aside>
        </div>
      </main>
      <a
        href={whatsappSalesUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full bg-[#25D366] px-5 py-4 text-sm font-black text-white shadow-2xl transition-all hover:scale-105 hover:bg-[#128C7E] active:scale-95"
        title="Consulte um vendedor pelo WhatsApp"
        aria-label="Consulte um vendedor pelo WhatsApp"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        Consulte um vendedor
      </a>
    </div>
  );
}
