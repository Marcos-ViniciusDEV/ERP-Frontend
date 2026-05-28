import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Bug,
  Clock,
  Lightbulb,
  MessageCircle,
  Plus,
  Search,
  Ticket,
  Video,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type TicketType = "SUPORTE" | "BUG" | "MELHORIA";

const statusTone: Record<string, string> = {
  ABERTO: "bg-blue-100 text-blue-800",
  EM_ANALISE: "bg-amber-100 text-amber-800",
  EM_ANDAMENTO: "bg-purple-100 text-purple-800",
  RESOLVIDO: "bg-green-100 text-green-800",
  FECHADO: "bg-slate-100 text-slate-700",
};

const priorityTone: Record<string, string> = {
  BAIXA: "bg-slate-100 text-slate-700",
  MEDIA: "bg-blue-100 text-blue-800",
  ALTA: "bg-amber-100 text-amber-800",
  CRITICA: "bg-red-100 text-red-800",
};

const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString("pt-BR") : "-";

const BUILTIN_TUTORIALS = [
  {
    id: "builtin-maquininha",
    titulo: "Como configurar uma maquininha no sistema",
    descricao: "Passo a passo para cadastrar maquininha, taxas e enviar a carga para o PDV.",
    modulo: "Pagamentos",
    tempoEstimado: "8 min",
    fixado: true,
    conteudo: `Objetivo: configurar uma maquininha no ERP para o PDV usar as formas de pagamento corretas e registrar taxas de débito, crédito, parcelado e PIX.

1. Acesse a tela de pagamentos
Entre no ERP e vá em Configurações > Pagamentos e Maquininhas.

2. Configure as formas de pagamento
Na aba Formas de pagamento, habilite Pagamentos manuais para permitir dinheiro, cartão manual e PIX manual.
Se a maquininha tiver integração por API, habilite POS/API.
Se a empresa usar TEF com PinPad e integrador homologado, habilite TEF integrado.
Se for usar PIX integrado, habilite PIX integrado.

3. Cadastre a adquirente ou provedor
Na aba Maquininhas e TEF, preencha Nome para exibição com um nome fácil de identificar.
Exemplos: Mercado Pago - Caixa 1, Stone - Loja Principal, PagBank - Balcão.
No campo Provedor, escolha Mercado Pago, Stone, PagBank, Itaú, Cielo, Rede, Getnet ou outro disponível.
Escolha o ambiente: Homologação para teste ou Produção para uso real.
Clique em Adicionar.

4. Cadastre o terminal do PDV
Ainda na aba Maquininhas e TEF, vá em Terminal por PDV.
Preencha o PDV ID exatamente como o caixa usa, por exemplo PDV001.
Informe o Nome do terminal, por exemplo Mercado Pago Caixa 1.
Escolha o Tipo:
Manual: quando o operador passa o cartão fora do sistema e só registra a venda no PDV.
POS/API: quando a maquininha permite integração por API.
TEF: quando existe integrador TEF local e PinPad homologado.
Clique em Adicionar terminal.

5. Configure as taxas
Vá para a aba Taxas e recebimentos.
Cadastre as taxas de Débito, Crédito à vista, Crédito parcelado e PIX.
Informe a taxa em percentual, o prazo de recebimento e a faixa de parcelas quando for crédito parcelado.
Se o provedor permitir consulta por API, clique em Atualizar taxas pela API.
Revise a comparação entre Taxa atual e Taxa API antes de aplicar.
Clique em Aplicar taxas encontradas somente se estiver tudo correto.

6. Salve e envie para o PDV
Clique em Salvar configurações.
Depois clique em Enviar carga PDV.
Os PDVs online recebem a configuração na hora.
Os PDVs offline recebem na próxima carga ou sincronização.

7. Teste no PDV
Abra o PDV e faça uma venda de teste.
Na tela de pagamento, confira se aparecem as formas configuradas.
Para modo manual, passe o cartão na maquininha e registre no PDV a forma usada.
Para POS/API ou TEF, a venda só deve finalizar depois do retorno aprovado da integração.

8. Conferência depois da venda
No ERP, acompanhe as vendas e a conciliação.
Confira valor bruto, taxa, valor líquido previsto e prazo de recebimento.

Observação importante: nem toda maquininha permite receber o valor automaticamente pelo sistema. Quando a API ou TEF não estiver disponível, use o modo manual.`,
  },
];

export default function CentralSuporte() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketType, setTicketType] = useState<TicketType>("SUPORTE");
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    categoria: "",
    prioridade: "MEDIA",
    modulo: "",
    passosReproducao: "",
  });

  const { data: overview } = useQuery({
    queryKey: ["support", "overview"],
    queryFn: async () => (await api.get("/support/overview")).data,
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ["support", "tickets"],
    queryFn: async () => (await api.get("/support/tickets")).data,
  });

  const { data: articles = [] } = useQuery({
    queryKey: ["support", "articles"],
    queryFn: async () => (await api.get("/support/articles")).data,
  });

  const { data: fetchedTutorials = [] } = useQuery({
    queryKey: ["support", "tutorials"],
    queryFn: async () => (await api.get("/support/tutorials")).data,
  });

  const tutorials = useMemo(() => {
    const hasPaymentTutorial = fetchedTutorials.some((item: any) =>
      String(item.titulo || "").toLowerCase().includes("maquininha")
    );
    return hasPaymentTutorial ? fetchedTutorials : [...BUILTIN_TUTORIALS, ...fetchedTutorials];
  }, [fetchedTutorials]);

  const { data: searchResults = [] } = useQuery({
    queryKey: ["support", "search", searchTerm],
    queryFn: async () => (await api.get("/support/search", { params: { q: searchTerm } })).data,
    enabled: searchTerm.trim().length >= 2,
  });

  const createTicket = useMutation({
    mutationFn: async () => {
      await api.post("/support/tickets", {
        ...form,
        tipo: ticketType,
      });
    },
    onSuccess: () => {
      toast.success("Solicitação registrada com sucesso");
      setTicketModalOpen(false);
      setForm({
        titulo: "",
        descricao: "",
        categoria: "",
        prioridade: "MEDIA",
        modulo: "",
        passosReproducao: "",
      });
      queryClient.invalidateQueries({ queryKey: ["support"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error ?? "Erro ao registrar solicitação");
    },
  });

  const whatsapp = useMutation({
    mutationFn: async () => (await api.post("/support/whatsapp-link", {})).data,
    onSuccess: (data) => {
      window.open(data.url, "_blank", "noopener,noreferrer");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error ?? "WhatsApp de suporte não configurado");
    },
  });

  const groupedTickets = useMemo(() => ({
    suporte: tickets.filter((ticket: any) => ticket.tipo === "SUPORTE"),
    bugs: tickets.filter((ticket: any) => ticket.tipo === "BUG"),
    melhorias: tickets.filter((ticket: any) => ticket.tipo === "MELHORIA"),
  }), [tickets]);

  const openTicketModal = (type: TicketType) => {
    setTicketType(type);
    setTicketModalOpen(true);
  };

  const metricCards = [
    { label: "Chamados", value: overview?.totalTickets ?? 0, icon: Ticket, tone: "text-blue-600" },
    { label: "Abertos", value: overview?.abertos ?? 0, icon: Clock, tone: "text-amber-600" },
    { label: "Artigos", value: overview?.artigos ?? 0, icon: BookOpen, tone: "text-green-600" },
    { label: "Tutoriais", value: tutorials.length, icon: Video, tone: "text-purple-600" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Central de Suporte</h1>
            <p className="text-muted-foreground mt-1">
              Abra chamados, consulte tutoriais e acompanhe bugs e melhorias em um só lugar.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => whatsapp.mutate()}>
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
            <Button onClick={() => openTicketModal("SUPORTE")}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Chamado
            </Button>
          </div>
        </div>

        <Card className="border-blue-100 bg-blue-50/60">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                className="h-11 bg-white pl-10"
                placeholder="Pesquisar chamados, artigos, tutoriais, bugs ou melhorias..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            {searchTerm.trim().length >= 2 && (
              <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {searchResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum resultado encontrado.</p>
                ) : searchResults.map((item: any) => (
                  <div key={`${item.tipoResultado}-${item.id}`} className="rounded-md border bg-white p-3">
                    <Badge variant="secondary">{item.tipoResultado}</Badge>
                    <p className="mt-2 font-semibold">{item.titulo}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {item.descricao || item.resumo || item.conteudo}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.label}>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className="mt-1 text-2xl font-bold">{metric.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${metric.tone}`} />
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="chamados" className="space-y-4">
          <TabsList className="flex h-auto flex-wrap">
            <TabsTrigger value="chamados">Chamados</TabsTrigger>
            <TabsTrigger value="base">Base de Conhecimento</TabsTrigger>
            <TabsTrigger value="tutoriais">Tutoriais</TabsTrigger>
            <TabsTrigger value="bugs">Bugs</TabsTrigger>
            <TabsTrigger value="melhorias">Melhorias</TabsTrigger>
          </TabsList>

          <TabsContent value="chamados">
            <TicketList tickets={groupedTickets.suporte} empty="Nenhum chamado de suporte aberto." />
          </TabsContent>

          <TabsContent value="base">
            <ContentGrid items={articles} type="article" empty="Nenhum artigo cadastrado." />
          </TabsContent>

          <TabsContent value="tutoriais">
            <ContentGrid items={tutorials} type="tutorial" empty="Nenhum tutorial cadastrado." />
          </TabsContent>

          <TabsContent value="bugs">
            <div className="mb-3 flex justify-end">
              <Button variant="outline" onClick={() => openTicketModal("BUG")}>
                <Bug className="mr-2 h-4 w-4" />
                Registrar Bug
              </Button>
            </div>
            <TicketList tickets={groupedTickets.bugs} empty="Nenhum bug registrado." />
          </TabsContent>

          <TabsContent value="melhorias">
            <div className="mb-3 flex justify-end">
              <Button variant="outline" onClick={() => openTicketModal("MELHORIA")}>
                <Lightbulb className="mr-2 h-4 w-4" />
                Sugerir Melhoria
              </Button>
            </div>
            <TicketList tickets={groupedTickets.melhorias} empty="Nenhuma melhoria solicitada." />
          </TabsContent>
        </Tabs>

        <Dialog open={ticketModalOpen} onOpenChange={setTicketModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {ticketType === "BUG" ? "Registrar Bug" : ticketType === "MELHORIA" ? "Solicitar Melhoria" : "Novo Chamado"}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Título</Label>
                <Input value={form.titulo} onChange={(event) => setForm({ ...form, titulo: event.target.value })} />
              </div>
              <div>
                <Label>Categoria</Label>
                <Input placeholder="PDV, Estoque, Financeiro..." value={form.categoria} onChange={(event) => setForm({ ...form, categoria: event.target.value })} />
              </div>
              <div>
                <Label>Módulo</Label>
                <Input placeholder="Ex: Vendas" value={form.modulo} onChange={(event) => setForm({ ...form, modulo: event.target.value })} />
              </div>
              <div>
                <Label>Prioridade</Label>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.prioridade}
                  onChange={(event) => setForm({ ...form, prioridade: event.target.value })}
                >
                  <option value="BAIXA">Baixa</option>
                  <option value="MEDIA">Média</option>
                  <option value="ALTA">Alta</option>
                  <option value="CRITICA">Crítica</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Label>Descrição</Label>
                <Textarea rows={4} value={form.descricao} onChange={(event) => setForm({ ...form, descricao: event.target.value })} />
              </div>
              {ticketType === "BUG" && (
                <div className="md:col-span-2">
                  <Label>Passos para reproduzir</Label>
                  <Textarea rows={3} value={form.passosReproducao} onChange={(event) => setForm({ ...form, passosReproducao: event.target.value })} />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setTicketModalOpen(false)}>Cancelar</Button>
              <Button onClick={() => createTicket.mutate()} disabled={!form.titulo || !form.descricao || createTicket.isPending}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function TicketList({ tickets, empty }: { tickets: any[]; empty: string }) {
  return (
    <div className="grid gap-3">
      {tickets.length === 0 ? (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">{empty}</CardContent></Card>
      ) : tickets.map((ticket) => (
        <Card key={ticket.id}>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{ticket.titulo}</h3>
                  <Badge className={statusTone[ticket.status] ?? ""}>{ticket.status.replace(/_/g, " ")}</Badge>
                  <Badge className={priorityTone[ticket.prioridade] ?? ""}>{ticket.prioridade}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{ticket.descricao}</p>
                {ticket.passosReproducao && (
                  <p className="mt-2 text-xs text-muted-foreground">Passos: {ticket.passosReproducao}</p>
                )}
              </div>
              <div className="text-sm text-muted-foreground md:text-right">
                <p>{ticket.categoria || "Sem categoria"}</p>
                <p>{formatDate(ticket.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ContentGrid({ items, type, empty }: { items: any[]; type: "article" | "tutorial"; empty: string }) {
  const Icon = type === "article" ? BookOpen : Video;
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.length === 0 ? (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="p-6 text-sm text-muted-foreground">{empty}</CardContent>
          </Card>
        ) : items.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            {type === "tutorial" && item.youtubeVideoId && (
              <div className="aspect-video bg-slate-950">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${item.youtubeVideoId}`}
                  title={item.titulo}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            )}
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-base">{item.titulo}</CardTitle>
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.resumo || item.descricao}</p>
              <p className="mt-3 line-clamp-4 text-sm whitespace-pre-line">{item.conteudo}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {item.fixado && <Badge className="bg-blue-100 text-blue-800">Fixado</Badge>}
                {(item.categoria || item.modulo) && <Badge variant="secondary">{item.categoria || item.modulo}</Badge>}
                {item.tempoEstimado && <Badge variant="outline">{item.tempoEstimado}</Badge>}
              </div>
              <Button className="mt-4 w-full" variant="outline" onClick={() => setSelectedItem(item)}>
                Ver passo a passo
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedItem?.titulo}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedItem?.descricao && (
              <p className="text-sm text-muted-foreground">{selectedItem.descricao}</p>
            )}
            <div className="rounded-md border bg-slate-50 p-4 text-sm leading-6 whitespace-pre-line">
              {selectedItem?.conteudo}
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedItem?.fixado && <Badge className="bg-blue-100 text-blue-800">Fixado</Badge>}
              {(selectedItem?.categoria || selectedItem?.modulo) && <Badge variant="secondary">{selectedItem.categoria || selectedItem.modulo}</Badge>}
              {selectedItem?.tempoEstimado && <Badge variant="outline">{selectedItem.tempoEstimado}</Badge>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
