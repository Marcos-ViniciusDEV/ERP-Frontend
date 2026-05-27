import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, FilePlus2, RefreshCw, Scale, ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Fornecedor = {
  id: number;
  razaoSocial: string;
  nomeFantasia: string | null;
};

type Produto = {
  id: number;
  codigo: string;
  descricao: string;
  precoCusto: number;
};

type PedidoCompra = {
  id: number;
  fornecedorId: number;
  dataPedido: string;
  valorTotal: number;
  status: string;
};

type SugestaoCompra = {
  produtoId: number;
  codigo: string;
  descricao: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  giroPeriodo: number;
  mediaDiaria: number;
  quantidadeSugerida: number;
  valorEstimado: number;
  prioridade: "ALTA" | "MEDIA" | "BAIXA";
};

type CurvaAbcItem = {
  produtoId: number;
  codigo: string;
  descricao: string;
  classe: "A" | "B" | "C";
  quantidadeVendida: number;
  valorVendido: number;
  percentualParticipacao: number;
  percentualAcumulado: number;
  recomendacao: string;
};

type CotacaoResultado = {
  produto: {
    descricao: string;
    precoCustoAtual: number;
  };
  melhorFornecedor: {
    fornecedorNome: string;
    precoUnitario: number;
    valorTotal: number;
    prazoDias: number;
  };
  economiaPotencial: number;
  cotacoes: Array<{
    fornecedorId: number;
    fornecedorNome: string;
    precoUnitario: number;
    valorTotal: number;
    prazoDias: number;
    diferencaUltimoCusto: number;
  }>;
};

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function cents(value: number) {
  return moeda.format((value || 0) / 100);
}

function statusClass(status: string) {
  switch (status) {
    case "PENDENTE":
      return "text-yellow-600";
    case "APROVADO":
      return "text-blue-600";
    case "RECEBIDO":
      return "text-green-600";
    case "CANCELADO":
      return "text-gray-600";
    default:
      return "";
  }
}

function prioridadeVariant(prioridade: SugestaoCompra["prioridade"]) {
  return prioridade === "ALTA" ? "destructive" : prioridade === "MEDIA" ? "secondary" : "outline";
}

export default function PedidosCompra() {
  const [open, setOpen] = useState(false);
  const [fornecedorAutomaticoId, setFornecedorAutomaticoId] = useState("");
  const [cotacaoProdutoId, setCotacaoProdutoId] = useState("");
  const [cotacaoQuantidade, setCotacaoQuantidade] = useState(1);
  const [cotacoes, setCotacoes] = useState([
    { fornecedorId: "", precoUnitario: "", prazoDias: "" },
    { fornecedorId: "", precoUnitario: "", prazoDias: "" },
    { fornecedorId: "", precoUnitario: "", prazoDias: "" },
  ]);
  const [cotacaoResultado, setCotacaoResultado] = useState<CotacaoResultado | null>(null);
  const queryClient = useQueryClient();

  const { data: pedidos, isLoading: pedidosLoading } = useQuery({
    queryKey: ["pedidos-compra"],
    queryFn: async () => {
      const { data } = await api.get<PedidoCompra[]>("/pedidos-compra");
      return data;
    },
  });

  const { data: fornecedores } = useQuery({
    queryKey: ["fornecedores"],
    queryFn: async () => {
      const { data } = await api.get<Fornecedor[]>("/fornecedores");
      return data;
    },
  });

  const { data: produtos } = useQuery({
    queryKey: ["produtos"],
    queryFn: async () => {
      const { data } = await api.get<Produto[]>("/produtos");
      return data;
    },
  });

  const { data: sugestoes, isLoading: sugestoesLoading } = useQuery({
    queryKey: ["pedidos-compra-sugestoes"],
    queryFn: async () => {
      const { data } = await api.get<SugestaoCompra[]>("/pedidos-compra/sugestoes");
      return data;
    },
  });

  const { data: curvaAbc, isLoading: curvaLoading } = useQuery({
    queryKey: ["pedidos-compra-curva-abc"],
    queryFn: async () => {
      const { data } = await api.get<CurvaAbcItem[]>("/pedidos-compra/curva-abc");
      return data;
    },
  });

  const [formData, setFormData] = useState({
    fornecedorId: "",
    dataPedido: new Date().toISOString().split("T")[0],
    valorTotal: "",
    observacao: "",
  });

  const resumo = useMemo(() => {
    const itens = sugestoes || [];
    return {
      criticos: itens.filter((item) => item.prioridade === "ALTA").length,
      totalEstimado: itens.reduce((total, item) => total + item.valorEstimado, 0),
      itens: itens.length,
    };
  }, [sugestoes]);

  const createPedido = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/pedidos-compra", {
        fornecedorId: Number(formData.fornecedorId),
        dataPedido: new Date(formData.dataPedido),
        valorTotal: Math.round(Number(formData.valorTotal || 0) * 100),
        observacao: formData.observacao,
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Pedido de compra cadastrado com sucesso!");
      setOpen(false);
      setFormData({
        fornecedorId: "",
        dataPedido: new Date().toISOString().split("T")[0],
        valorTotal: "",
        observacao: "",
      });
      queryClient.invalidateQueries({ queryKey: ["pedidos-compra"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Erro ao cadastrar pedido de compra");
    },
  });

  const gerarAutomatico = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/pedidos-compra/automatico", {
        fornecedorId: Number(fornecedorAutomaticoId),
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Pedido automatico gerado com base no giro de estoque.");
      queryClient.invalidateQueries({ queryKey: ["pedidos-compra"] });
      queryClient.invalidateQueries({ queryKey: ["pedidos-compra-sugestoes"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Erro ao gerar pedido automatico");
    },
  });

  const compararCotacao = useMutation({
    mutationFn: async () => {
      const payload = {
        produtoId: Number(cotacaoProdutoId),
        quantidade: cotacaoQuantidade,
        cotacoes: cotacoes
          .filter((cotacao) => cotacao.fornecedorId && cotacao.precoUnitario)
          .map((cotacao) => ({
            fornecedorId: Number(cotacao.fornecedorId),
            precoUnitario: Math.round(Number(cotacao.precoUnitario) * 100),
            prazoDias: Number(cotacao.prazoDias || 0),
          })),
      };
      const { data } = await api.post<CotacaoResultado>("/pedidos-compra/cotacao", payload);
      return data;
    },
    onSuccess: (data) => {
      setCotacaoResultado(data);
      toast.success("Cotacao comparada com sucesso.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Erro ao comparar cotacoes");
    },
  });

  const fornecedorNome = (id: number) =>
    fornecedores?.find((fornecedor) => fornecedor.id === id)?.nomeFantasia ||
    fornecedores?.find((fornecedor) => fornecedor.id === id)?.razaoSocial ||
    "-";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Compras Inteligentes</h1>
            <p className="text-muted-foreground mt-1">
              Sugestoes, Curva ABC, cotacoes e pedidos automaticos
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <FilePlus2 className="h-4 w-4 mr-2" />
                Novo Pedido
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Cadastrar Pedido de Compra</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  createPedido.mutate();
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="fornecedorId">Fornecedor *</Label>
                  <Select
                    value={formData.fornecedorId}
                    onValueChange={(value) => setFormData({ ...formData, fornecedorId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {fornecedores?.map((fornecedor) => (
                        <SelectItem key={fornecedor.id} value={String(fornecedor.id)}>
                          {fornecedor.nomeFantasia || fornecedor.razaoSocial}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="dataPedido">Data do Pedido *</Label>
                    <Input
                      id="dataPedido"
                      type="date"
                      value={formData.dataPedido}
                      onChange={(event) => setFormData({ ...formData, dataPedido: event.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="valorTotal">Valor Total (R$) *</Label>
                    <Input
                      id="valorTotal"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.valorTotal}
                      onChange={(event) => setFormData({ ...formData, valorTotal: event.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="observacao">Observacao</Label>
                  <Input
                    id="observacao"
                    value={formData.observacao}
                    onChange={(event) => setFormData({ ...formData, observacao: event.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createPedido.isPending || !formData.fornecedorId}>
                    {createPedido.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Itens sugeridos</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{resumo.itens}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Prioridade alta</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{resumo.criticos}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Compra estimada</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{cents(resumo.totalEstimado)}</CardContent>
          </Card>
        </div>

        <Tabs defaultValue="sugestoes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sugestoes">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Sugestoes
            </TabsTrigger>
            <TabsTrigger value="abc">
              <BarChart3 className="h-4 w-4 mr-2" />
              Curva ABC
            </TabsTrigger>
            <TabsTrigger value="cotacao">
              <Scale className="h-4 w-4 mr-2" />
              Cotacao
            </TabsTrigger>
            <TabsTrigger value="pedidos">
              <RefreshCw className="h-4 w-4 mr-2" />
              Pedidos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sugestoes">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <CardTitle>Sugestao automatica por estoque minimo e giro</CardTitle>
                  <div className="flex gap-2">
                    <Select value={fornecedorAutomaticoId} onValueChange={setFornecedorAutomaticoId}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Fornecedor do pedido" />
                      </SelectTrigger>
                      <SelectContent>
                        {fornecedores?.map((fornecedor) => (
                          <SelectItem key={fornecedor.id} value={String(fornecedor.id)}>
                            {fornecedor.nomeFantasia || fornecedor.razaoSocial}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => gerarAutomatico.mutate()}
                      disabled={!fornecedorAutomaticoId || gerarAutomatico.isPending || !sugestoes?.length}
                    >
                      Gerar Pedido
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {sugestoesLoading ? (
                  <p className="text-muted-foreground">Carregando...</p>
                ) : sugestoes && sugestoes.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead className="text-right">Estoque</TableHead>
                        <TableHead className="text-right">Minimo</TableHead>
                        <TableHead className="text-right">Giro</TableHead>
                        <TableHead className="text-right">Sugerido</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sugestoes.map((item) => (
                        <TableRow key={item.produtoId}>
                          <TableCell>
                            <div className="font-medium">{item.descricao}</div>
                            <div className="text-xs text-muted-foreground">{item.codigo}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={prioridadeVariant(item.prioridade)}>{item.prioridade}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{item.estoqueAtual}</TableCell>
                          <TableCell className="text-right">{item.estoqueMinimo}</TableCell>
                          <TableCell className="text-right">{item.giroPeriodo}</TableCell>
                          <TableCell className="text-right font-medium">{item.quantidadeSugerida}</TableCell>
                          <TableCell className="text-right">{cents(item.valorEstimado)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">Nenhuma compra sugerida no momento.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="abc">
            <Card>
              <CardHeader>
                <CardTitle>Curva ABC aplicada a compras</CardTitle>
              </CardHeader>
              <CardContent>
                {curvaLoading ? (
                  <p className="text-muted-foreground">Carregando...</p>
                ) : curvaAbc && curvaAbc.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Classe</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Qtd. vendida</TableHead>
                        <TableHead className="text-right">Valor vendido</TableHead>
                        <TableHead className="text-right">% acumulado</TableHead>
                        <TableHead>Recomendacao</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {curvaAbc.map((item) => (
                        <TableRow key={item.produtoId}>
                          <TableCell>
                            <Badge>{item.classe}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{item.descricao}</div>
                            <div className="text-xs text-muted-foreground">{item.codigo}</div>
                          </TableCell>
                          <TableCell className="text-right">{item.quantidadeVendida}</TableCell>
                          <TableCell className="text-right">{cents(item.valorVendido)}</TableCell>
                          <TableCell className="text-right">{item.percentualAcumulado}%</TableCell>
                          <TableCell>{item.recomendacao}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">Sem vendas suficientes para calcular a Curva ABC.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cotacao">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_0.8fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Cotacao com varios fornecedores</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_160px]">
                    <div>
                      <Label>Produto</Label>
                      <Select value={cotacaoProdutoId} onValueChange={setCotacaoProdutoId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {produtos?.map((produto) => (
                            <SelectItem key={produto.id} value={String(produto.id)}>
                              {produto.descricao}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Quantidade</Label>
                      <Input
                        type="number"
                        min="1"
                        value={cotacaoQuantidade}
                        onChange={(event) => setCotacaoQuantidade(Number(event.target.value || 1))}
                      />
                    </div>
                  </div>

                  {cotacoes.map((cotacao, index) => (
                    <div key={index} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_140px_120px]">
                      <div>
                        <Label>Fornecedor {index + 1}</Label>
                        <Select
                          value={cotacao.fornecedorId}
                          onValueChange={(value) => {
                            const next = [...cotacoes];
                            next[index] = { ...next[index], fornecedorId: value };
                            setCotacoes(next);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Fornecedor" />
                          </SelectTrigger>
                          <SelectContent>
                            {fornecedores?.map((fornecedor) => (
                              <SelectItem key={fornecedor.id} value={String(fornecedor.id)}>
                                {fornecedor.nomeFantasia || fornecedor.razaoSocial}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Preco (R$)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={cotacao.precoUnitario}
                          onChange={(event) => {
                            const next = [...cotacoes];
                            next[index] = { ...next[index], precoUnitario: event.target.value };
                            setCotacoes(next);
                          }}
                        />
                      </div>
                      <div>
                        <Label>Prazo dias</Label>
                        <Input
                          type="number"
                          min="0"
                          value={cotacao.prazoDias}
                          onChange={(event) => {
                            const next = [...cotacoes];
                            next[index] = { ...next[index], prazoDias: event.target.value };
                            setCotacoes(next);
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  <Button
                    onClick={() => compararCotacao.mutate()}
                    disabled={!cotacaoProdutoId || compararCotacao.isPending}
                  >
                    Comparar Precos
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Comparacao de preco de compra</CardTitle>
                </CardHeader>
                <CardContent>
                  {cotacaoResultado ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Melhor fornecedor</p>
                        <p className="text-xl font-semibold">{cotacaoResultado.melhorFornecedor.fornecedorNome}</p>
                        <p className="text-sm text-muted-foreground">
                          {cents(cotacaoResultado.melhorFornecedor.precoUnitario)} por unidade
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Economia potencial</p>
                        <p className="text-2xl font-semibold">{cents(cotacaoResultado.economiaPotencial)}</p>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fornecedor</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cotacaoResultado.cotacoes.map((cotacao) => (
                            <TableRow key={cotacao.fornecedorId}>
                              <TableCell>{cotacao.fornecedorNome}</TableCell>
                              <TableCell className="text-right">{cents(cotacao.valorTotal)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Preencha ao menos duas cotacoes para comparar.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pedidos">
            <Card>
              <CardHeader>
                <CardTitle>Lista de pedidos de compra</CardTitle>
              </CardHeader>
              <CardContent>
                {pedidosLoading ? (
                  <p className="text-muted-foreground">Carregando...</p>
                ) : pedidos && pedidos.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pedidos.map((pedido) => (
                        <TableRow key={pedido.id}>
                          <TableCell>{new Date(pedido.dataPedido).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell className="font-medium">{fornecedorNome(pedido.fornecedorId)}</TableCell>
                          <TableCell className="text-right">{cents(pedido.valorTotal)}</TableCell>
                          <TableCell>
                            <span className={`font-medium ${statusClass(pedido.status)}`}>{pedido.status}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">Nenhum pedido de compra cadastrado.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
