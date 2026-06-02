import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, RefreshCw, Send, Zap, Calendar, Clock, Percent, DollarSign, Package, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/_core/hooks/useAuth";
import { hasPermission } from "@/_core/utils/permissions";
import { ResumoMvtoTab } from "./components/ResumoMvtoTab";
import { HistoricoTab } from "./components/HistoricoTab";
import { ProdutosEstoqueTab } from "./components/ProdutosEstoqueTab";
import { UnidadesTab } from "./components/UnidadesTab";
import { Produto } from "@/shared/schema";
import { useLocation } from "wouter";

// Define Departamento type locally if not available in schema yet
interface Departamento {
  id: number;
  nome: string;
}

interface FiscalPendencia {
  produtoId: number;
  issues: Array<{ code: string; field: string; message: string }>;
}

interface FiscalPendenciasResponse {
  totalPendentes: number;
  pendentes: FiscalPendencia[];
}

export default function Produtos() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [onlyFiscalPending, setOnlyFiscalPending] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  
  const { data: produtos, isLoading, error } = useQuery<Produto[]>({
    queryKey: ["produtos"],
    queryFn: async () => {
      const { data } = await api.get("/produtos");
      return data;
    }
  });

  const { data: departamentos } = useQuery<Departamento[]>({
    queryKey: ["departamentos"],
    queryFn: async () => {
      // Assuming /departamentos endpoint exists, otherwise this will fail or return empty
      try {
        const { data } = await api.get("/departamentos");
        return data;
      } catch (e) {
        return [];
      }
    }
  });

  const { data: fiscalPendencias } = useQuery<FiscalPendenciasResponse>({
    queryKey: ["produtos", "fiscal-pendencias"],
    queryFn: async () => (await api.get("/produtos/fiscal/pendencias")).data,
  });

  const fiscalPendenciasMap = new Map((fiscalPendencias?.pendentes || []).map((item) => [item.produtoId, item.issues]));

  const createProduto = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/produtos", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Produto cadastrado com sucesso!");
      setOpen(false);
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      queryClient.invalidateQueries({ queryKey: ["produtos", "fiscal-pendencias"] });
      resetForm();
    },
    onError: () => {
      toast.error("Erro ao cadastrar produto");
    }
  });

  const updateProduto = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & any) => {
      const res = await api.put(`/produtos/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Produto atualizado com sucesso!");
      setOpen(false);
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      queryClient.invalidateQueries({ queryKey: ["produtos", "fiscal-pendencias"] });
      resetForm();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.message || "Erro ao atualizar produto";
      toast.error(message);
    }
  });

  const deleteProduto = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      await api.delete(`/produtos/${id}`);
    },
    onSuccess: (_, { id }) => {
      toast.success("Produto excluído com sucesso!");
      if (selectedProduto?.id === id) {
        setSelectedProduto(null);
      }
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      queryClient.invalidateQueries({ queryKey: ["produtos", "fiscal-pendencias"] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.message || "Erro ao excluir produto";
      toast.error(message);
    }
  });

  const [formData, setFormData] = useState({
    codigo: "",
    codigoBarras: "",
    descricao: "",
    marca: "",
    departamentoId: 0,
    unidade: "UN",
    precoVenda: 0,
    precoVenda2: 0,
    precoAtacado: 0,
    precoCusto: 0,
    custoMedio: 0,
    custoContabil: 0,
    custoOperacional: 0,
    custoFiscal: 0,
    ncm: "",
    cest: "",
    origem: 0,
    cstIcms: "",
    csosnIcms: "102",
    cfopPadraoVenda: "5102",
    aliquotaIcms: 0,
    aliquotaPis: 0,
    aliquotaCofins: 0,
    pisCst: "49",
    cofinsCst: "49",
    margemLucro: 30,
    margemLucro2: 0,
    margemLucro3: 0,
    estoque: 0,
    estoqueLoja: 0,
    estoqueDeposito: 0,
    estoqueTroca: 0,
    estoqueMinimo: 0,
    dataUltimaCompra: undefined as Date | undefined,
    quantidadeUltimaCompra: 0,
    dataPrimeiraVenda: undefined as Date | undefined,
    ativo: true,
    controlaEstoque: true,
    permiteDesconto: true,
    localizacao: "",
  });

  const resetForm = () => {
    setFormData({
      codigo: "",
      codigoBarras: "",
      descricao: "",
      marca: "",
      departamentoId: 0,
      unidade: "UN",
      precoVenda: 0,
      precoVenda2: 0,
      precoAtacado: 0,
      precoCusto: 0,
      custoMedio: 0,
      custoContabil: 0,
      custoOperacional: 0,
      custoFiscal: 0,
      ncm: "",
      cest: "",
      origem: 0,
      cstIcms: "",
      csosnIcms: "102",
      cfopPadraoVenda: "5102",
      aliquotaIcms: 0,
      aliquotaPis: 0,
      aliquotaCofins: 0,
      pisCst: "49",
      cofinsCst: "49",
      margemLucro: 30,
      margemLucro2: 0,
      margemLucro3: 0,
      estoque: 0,
      estoqueLoja: 0,
      estoqueDeposito: 0,
      estoqueTroca: 0,
      estoqueMinimo: 0,
      dataUltimaCompra: undefined,
      quantidadeUltimaCompra: 0,
      dataPrimeiraVenda: undefined,
      ativo: true,
      controlaEstoque: true,
      permiteDesconto: true,
      localizacao: "",
    });
  };

  // --- Estados e funções para Agendamento de Ofertas ---
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerFormData, setOfferFormData] = useState({
    nome: "",
    tipoDesconto: "PRECO_FIXO" as "PRECO_FIXO" | "PERCENTUAL",
    precoOferta: 0,
    percentualDesconto: 0,
    dataInicio: "",
    horaInicio: "08:00",
    dataFim: "",
    horaFim: "18:00",
  });

  const handleOpenOfferModal = () => {
    if (!selectedProduto) return;
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    setOfferFormData({
      nome: `Oferta - ${selectedProduto.descricao}`,
      tipoDesconto: "PRECO_FIXO",
      precoOferta: selectedProduto.precoVenda ? Number((selectedProduto.precoVenda / 100).toFixed(2)) : 0,
      percentualDesconto: 10,
      dataInicio: today,
      horaInicio: "08:00",
      dataFim: tomorrow,
      horaFim: "18:00",
    });
    setOfferOpen(true);
  };

  const createOffer = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/offers", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Oferta agendada com sucesso!");
      setOfferOpen(false);
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.message || "Erro ao agendar oferta";
      toast.error(message);
    }
  });

  const handleOfferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduto) return;

    const dtInicio = new Date(`${offerFormData.dataInicio}T${offerFormData.horaInicio || "00:00"}`);
    const dtFim = new Date(`${offerFormData.dataFim}T${offerFormData.horaFim || "00:00"}`);

    if (dtInicio >= dtFim) {
      toast.error("A data/hora de término deve ser posterior à data/hora de início!");
      return;
    }

    const payload = {
      produtoId: selectedProduto.id,
      nome: offerFormData.nome || `Oferta - ${selectedProduto.descricao}`,
      tipoDesconto: offerFormData.tipoDesconto,
      precoOferta: offerFormData.tipoDesconto === "PRECO_FIXO" ? Math.round(Number(offerFormData.precoOferta) * 100) : 0,
      percentualDesconto: offerFormData.tipoDesconto === "PERCENTUAL" ? Number(offerFormData.percentualDesconto) : 0,
      dataInicio: offerFormData.dataInicio,
      dataFim: offerFormData.dataFim,
      horaInicio: offerFormData.horaInicio || null,
      horaFim: offerFormData.horaFim || null,
      aplicacaoAutomatica: true,
      ativo: true,
    };

    createOffer.mutate(payload);
  };

  // Atalho de teclado: Barra de espaço abre busca
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalData = { ...formData };
    
    // Cálculo de segurança final: se não houver preço de venda, aplica a margem
    if (!finalData.precoVenda || finalData.precoVenda === 0) {
      const margem = finalData.margemLucro || 30; // 30% padrão
      finalData.precoVenda = Math.round((finalData.precoCusto || 0) * (1 + margem / 100));
      finalData.margemLucro = margem;
    }

    if (editingId) {
      updateProduto.mutate({ id: editingId, ...finalData });
    } else {
      createProduto.mutate(finalData);
    }
  };

  const handleEdit = (produto: any) => {
    setEditingId(produto.id);
    setFormData({
      codigo: produto.codigo || "",
      codigoBarras: produto.codigoBarras || "",
      descricao: produto.descricao || "",
      marca: produto.marca || "",
      departamentoId: produto.departamentoId || 0,
      unidade: produto.unidade || "UN",
      precoVenda: produto.precoVenda || 0,
      precoVenda2: produto.precoVenda2 || 0,
      precoAtacado: produto.precoAtacado || 0,
      precoCusto: produto.precoCusto || 0,
      custoMedio: produto.custoMedio || 0,
      custoContabil: produto.custoContabil || 0,
      custoOperacional: produto.custoOperacional || 0,
      custoFiscal: produto.custoFiscal || 0,
      ncm: produto.ncm || "",
      cest: produto.cest || "",
      origem: produto.origem ?? 0,
      cstIcms: produto.cstIcms || "",
      csosnIcms: produto.csosnIcms || "",
      cfopPadraoVenda: produto.cfopPadraoVenda || "",
      aliquotaIcms: produto.aliquotaIcms || 0,
      aliquotaPis: produto.aliquotaPis || 0,
      aliquotaCofins: produto.aliquotaCofins || 0,
      pisCst: produto.pisCst || "",
      cofinsCst: produto.cofinsCst || "",
      margemLucro: produto.margemLucro || 30,
      margemLucro2: produto.margemLucro2 || 0,
      margemLucro3: produto.margemLucro3 || 0,
      estoque: produto.estoque || 0,
      estoqueLoja: produto.estoqueLoja || 0,
      estoqueDeposito: produto.estoqueDeposito || 0,
      estoqueTroca: produto.estoqueTroca || 0,
      estoqueMinimo: produto.estoqueMinimo || 0,
      dataUltimaCompra: produto.dataUltimaCompra ? new Date(produto.dataUltimaCompra) : undefined,
      quantidadeUltimaCompra: produto.quantidadeUltimaCompra || 0,
      dataPrimeiraVenda: produto.dataPrimeiraVenda ? new Date(produto.dataPrimeiraVenda) : undefined,
      ativo: produto.ativo ?? true,
      controlaEstoque: produto.controlaEstoque ?? true,
      permiteDesconto: produto.permiteDesconto ?? true,
      localizacao: produto.localizacao || "",
    });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    deleteProduto.mutate({ id });
  };

  const handleNewProduct = () => {
    resetForm();
    
    // Generate unique 6-digit code
    let code = "";
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 100) {
      const num = Math.floor(100000 + Math.random() * 900000);
      code = num.toString();
      const exists = produtos?.some((p: any) => p.codigo === code);
      if (!exists) isUnique = true;
      attempts++;
    }
    
    setFormData(prev => ({ ...prev, codigo: code }));
    setOpen(true);
  };

  const calcularMargem = (precoVenda: number, precoCusto: number) => {
    if (precoCusto === 0) return 0;
    return ((precoVenda - precoCusto) / precoCusto) * 100;
  };

  const calcularLucro = (precoVenda: number, precoCusto: number) => {
    return precoVenda - precoCusto;
  };

  const produtosFiltrados = produtos?.filter((produto: any) => {
    if (onlyFiscalPending && !fiscalPendenciasMap.has(produto.id)) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      produto.codigo?.toLowerCase().includes(term) ||
      produto.codigoBarras?.toLowerCase().includes(term) ||
      produto.descricao?.toLowerCase().includes(term) ||
      produto.marca?.toLowerCase().includes(term)
    );
  });

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-5rem)] gap-3">
        {/* Área principal com Abas */}
        <div className="flex-1 flex flex-col min-w-0 bg-background rounded-md border p-2">
          <Tabs defaultValue="cadastro" className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="cadastro">Cadastro</TabsTrigger>
              <TabsTrigger value="unidades">Unidades</TabsTrigger>
              <TabsTrigger value="resumo">Resumo Mvto</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
              <TabsTrigger value="produtos">Produtos</TabsTrigger>
            </TabsList>

            <TabsContent value="cadastro" className="flex-1 flex flex-col mt-2 data-[state=active]:flex">
              {/* Cabeçalho da tabela (Search e Refresh) */}
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold">Lista de Produtos</h2>
                <div className="flex gap-2">
                  <Button
                    variant={onlyFiscalPending ? "default" : "outline"}
                    size="sm"
                    onClick={() => setOnlyFiscalPending(!onlyFiscalPending)}
                    title="Filtrar produtos com pendencias fiscais"
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Pendencias fiscais ({fiscalPendencias?.totalPendentes || 0})
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSearchOpen(!searchOpen)}>
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={async () => {
                      try {
                        toast.info("Enviando carga para PDVs...");
                        await api.post('/pdv/enviar-carga', {});
                        toast.success("Carga enviada com sucesso!");
                        queryClient.invalidateQueries({ queryKey: ["produtos"] });
                      } catch (error) {
                        toast.error("Erro ao enviar carga");
                      }
                    }}
                    title="Enviar Carga para PDVs"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["produtos"] })}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {searchOpen && (
                <div className="pb-2">
                  <div className="flex items-center gap-2 border rounded-md px-2 bg-background">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      ref={searchInputRef}
                      placeholder="Buscar por código, código de barras, descrição ou marca... (ESC para fechar)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setSearchOpen(false);
                          setSearchTerm("");
                        }
                      }}
                      className="text-sm border-none shadow-none focus-visible:ring-0"
                    />
                  </div>
                </div>
              )}

              {/* Tabela de produtos */}
              <div className="flex-1 overflow-auto border rounded-md">
                {isLoading ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">Carregando...</div>
                ) : error ? (
                  <div className="p-8 text-center text-red-500 text-sm">
                    Erro ao carregar produtos: {(error as any).message || "Erro desconhecido"}
                  </div>
                ) : produtosFiltrados && produtosFiltrados.length > 0 ? (
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow className="text-xs">
                        <TableHead className="w-[110px] py-2">Cód. Barras</TableHead>
                        <TableHead className="w-[90px] py-2">Código</TableHead>
                        <TableHead className="min-w-[250px] py-2">Descrição</TableHead>
                        <TableHead className="w-[130px] py-2">Marca</TableHead>
                        <TableHead className="w-[100px] py-2">Grupo</TableHead>
                        <TableHead className="w-[70px] text-right py-2">Estoque</TableHead>
                        <TableHead className="w-[100px] text-right py-2">Preço PDV</TableHead>
                        <TableHead className="w-[110px] py-2">Fiscal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {produtosFiltrados.map((produto: any) => (
                        <TableRow
                          key={produto.id}
                          onClick={() => setSelectedProduto(produto)}
                          className={`cursor-pointer text-sm h-9 ${
                            selectedProduto?.id === produto.id ? "bg-muted" : "hover:bg-muted/50"
                          }`}
                        >
                          <TableCell className="font-mono text-xs py-1">{produto.codigoBarras || "-"}</TableCell>
                          <TableCell className="font-mono text-xs py-1">{produto.codigo}</TableCell>
                          <TableCell className="font-medium py-1">{produto.descricao}</TableCell>
                          <TableCell className="py-1">{produto.marca || "-"}</TableCell>
                          <TableCell className="py-1">
                            {departamentos?.find((d: Departamento) => d.id === produto.departamentoId)?.nome || "-"}
                          </TableCell>
                          <TableCell className="text-right font-mono py-1">
                            <span className={produto.estoque <= produto.estoqueMinimo ? "text-red-600 font-bold" : ""}>
                              {produto.estoque || 0}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono py-1">
                            R$ {(produto.precoVenda / 100).toFixed(2)}
                          </TableCell>
                          <TableCell className="py-1">
                            {fiscalPendenciasMap.has(produto.id) ? (
                              <Badge variant="destructive" title={fiscalPendenciasMap.get(produto.id)?.map((issue) => issue.message).join("\n")}>
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                Pendente
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-green-700">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Pronto
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    {searchTerm ? "Nenhum produto encontrado." : "Nenhum produto cadastrado."}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="unidades" className="flex-1 mt-2 overflow-auto">
              <UnidadesTab produto={selectedProduto} onProdutoChange={setSelectedProduto} />
            </TabsContent>

            <TabsContent value="resumo" className="flex-1 mt-2 overflow-auto">
              <ResumoMvtoTab produtoId={selectedProduto?.id} />
            </TabsContent>

            <TabsContent value="historico" className="flex-1 mt-2 overflow-auto">
              <HistoricoTab produtoId={selectedProduto?.id} />
            </TabsContent>

            <TabsContent value="produtos" className="flex-1 mt-2 overflow-auto">
              <ProdutosEstoqueTab produtos={produtos} isLoadingProdutos={isLoading} />
            </TabsContent>
          </Tabs>

          {/* Painel de detalhes inferior (mantido) */}
          {selectedProduto && (
            <div className="mt-2 border-t pt-2">
              <Card className="border-none shadow-none">
                <CardContent className="p-0">
                  <div className="grid grid-cols-12 bg-muted/30 text-xs">
                     {/* Linha 1: Cabeçalho e Preços Principais */}
                    <div className="col-span-12 p-1 bg-muted/50 font-semibold flex justify-between items-center">
                      <span>Detalhes do Produto: {selectedProduto.descricao}</span>
                      <span className="font-mono">{selectedProduto.codigo}</span>
                    </div>

                    {/* Bloco de Preços e Margens */}
                    <div className="col-span-2 p-1 border-r border-b border-muted-foreground/10">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Preço Venda</p>
                      <p className="text-lg font-bold text-green-600 font-mono">
                        R$ {(selectedProduto.precoVenda / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="col-span-2 p-1 border-r border-b border-muted-foreground/10">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Preço PDV</p>
                      <p className="text-lg font-bold text-blue-600 font-mono">
                        R$ {((selectedProduto.precoPdv || 0) / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="col-span-2 p-1 border-r border-b border-muted-foreground/10">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">% Lucro</p>
                      <p className="text-sm font-mono">
                        {calcularMargem(selectedProduto.precoVenda, selectedProduto.precoCusto).toFixed(2)}%
                      </p>
                    </div>
                    <div className="col-span-2 p-1 border-r border-b border-muted-foreground/10">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Margem</p>
                      <p className="text-sm font-mono text-orange-600">
                        {selectedProduto.margemLucro}%
                      </p>
                    </div>
                    <div className="col-span-2 p-1 border-r border-b border-muted-foreground/10">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Preço 2</p>
                      <p className="text-sm font-mono">
                        R$ {(selectedProduto.precoVenda2 / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="col-span-2 p-1 border-r border-b border-muted-foreground/10">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Atacado</p>
                      <p className="text-sm font-mono">
                        R$ {(selectedProduto.precoAtacado / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="col-span-2 p-1 bg-yellow-50/50 border-b border-muted-foreground/10">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Estoque Atual</p>
                      <p className="text-lg font-bold font-mono">{selectedProduto.estoque}</p>
                    </div>

                    {/* Linha 2: Custos */}
                    <div className="col-span-2 p-1 border-r border-b border-muted-foreground/10">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Custo Médio</p>
                      <p className="text-sm font-mono">
                        R$ {(selectedProduto.custoMedio / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="col-span-2 p-1 border-r border-b border-muted-foreground/10">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Custo Contábil</p>
                      <p className="text-sm font-mono">
                        R$ {(selectedProduto.custoContabil / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="col-span-2 p-1 border-r border-b border-muted-foreground/10">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Custo Oper.</p>
                      <p className="text-sm font-mono">
                        R$ {(selectedProduto.custoOperacional / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="col-span-2 p-1 border-r border-b border-muted-foreground/10">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Custo Fiscal</p>
                      <p className="text-sm font-mono">
                        R$ {(selectedProduto.custoFiscal / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="col-span-2 p-1 border-r border-b border-muted-foreground/10">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Custo Venda</p>
                      <p className="text-sm font-mono">
                        R$ {(selectedProduto.precoCusto / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="col-span-2 p-1 border-b border-muted-foreground/10">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Lucro Unit.</p>
                      <p className="text-sm font-mono text-blue-600">
                        R$ {(calcularLucro(selectedProduto.precoVenda, selectedProduto.precoCusto) / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Sidebar Direita */}
        <div className="w-32 flex flex-col gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="!max-w-4xl !w-[900px] max-h-[92vh] overflow-y-auto rounded-3xl border-0 shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-white p-0">
              <div className="bg-blue-600 px-6 py-5 text-white flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-200" />
                    {editingId ? "Editar Produto" : "Cadastrar Novo Produto"}
                  </DialogTitle>
                  <p className="text-white/80 text-xs mt-1">Preencha os dados do produto abaixo para manter o estoque organizado.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-3">
                    <Label htmlFor="codigo" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Código *</Label>
                    <Input
                      id="codigo"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-bold"
                      required
                    />
                  </div>
                  <div className="col-span-4">
                    <Label htmlFor="codigoBarras" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Código de Barras</Label>
                    <Input
                      id="codigoBarras"
                      value={formData.codigoBarras}
                      onChange={(e) => setFormData({ ...formData, codigoBarras: e.target.value })}
                      className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-bold"
                    />
                  </div>
                  <div className="col-span-5">
                    <Label htmlFor="descricao" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição *</Label>
                    <Input
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-4">
                    <Label htmlFor="marca" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Marca</Label>
                    <Input
                      id="marca"
                      value={formData.marca}
                      onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                      className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-bold"
                    />
                  </div>
                  <div className="col-span-4">
                    <Label htmlFor="departamentoId" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Departamento</Label>
                    <select
                      id="departamentoId"
                      value={formData.departamentoId}
                      onChange={(e) =>
                        setFormData({ ...formData, departamentoId: parseInt(e.target.value) })
                      }
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value={0}>Selecione</option>
                      {departamentos?.map((dep: Departamento) => (
                        <option key={dep.id} value={dep.id}>
                          {dep.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="unidade" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unidade</Label>
                    <Input
                      id="unidade"
                      value={formData.unidade}
                      onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                      className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-bold uppercase"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="localizacao" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Localização</Label>
                    <Input
                      id="localizacao"
                      value={formData.localizacao}
                      onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                      className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-6 border-t pt-4 border-slate-100">
                  <div className="col-span-12">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Dados Fiscais</p>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="ncm" className="text-xs font-bold text-slate-500 uppercase tracking-wider">NCM</Label>
                    <Input
                      id="ncm"
                      value={formData.ncm}
                      maxLength={8}
                      onChange={(e) => setFormData({ ...formData, ncm: e.target.value.replace(/\D/g, "").slice(0, 8) })}
                      className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-bold font-mono"
                      placeholder="00000000"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="cest" className="text-xs font-bold text-slate-500 uppercase tracking-wider">CEST</Label>
                    <Input
                      id="cest"
                      value={formData.cest}
                      maxLength={7}
                      onChange={(e) => setFormData({ ...formData, cest: e.target.value.replace(/\D/g, "").slice(0, 7) })}
                      className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-bold font-mono"
                      placeholder="0000000"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="origem" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Origem</Label>
                    <Input
                      id="origem"
                      type="number"
                      min={0}
                      max={8}
                      value={formData.origem}
                      onChange={(e) => setFormData({ ...formData, origem: Math.min(8, Math.max(0, parseInt(e.target.value) || 0)) })}
                      className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-bold font-mono"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="cfopPadraoVenda" className="text-xs font-bold text-slate-500 uppercase tracking-wider">CFOP Venda</Label>
                    <Input
                      id="cfopPadraoVenda"
                      value={formData.cfopPadraoVenda}
                      maxLength={4}
                      onChange={(e) => setFormData({ ...formData, cfopPadraoVenda: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                      className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-bold font-mono"
                      placeholder="5102"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="csosnIcms" className="text-xs font-bold text-slate-500 uppercase tracking-wider">CSOSN</Label>
                    <Input
                      id="csosnIcms"
                      value={formData.csosnIcms}
                      maxLength={4}
                      onChange={(e) => setFormData({ ...formData, csosnIcms: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                      className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-bold font-mono"
                      placeholder="102"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="cstIcms" className="text-xs font-bold text-slate-500 uppercase tracking-wider">CST ICMS</Label>
                    <Input
                      id="cstIcms"
                      value={formData.cstIcms}
                      maxLength={4}
                      onChange={(e) => setFormData({ ...formData, cstIcms: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                      className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-bold font-mono"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="pisCst" className="text-xs font-bold text-slate-500 uppercase tracking-wider">CST PIS</Label>
                    <Input
                      id="pisCst"
                      value={formData.pisCst}
                      maxLength={2}
                      onChange={(e) => setFormData({ ...formData, pisCst: e.target.value.replace(/\D/g, "").slice(0, 2) })}
                      className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-bold font-mono"
                      placeholder="49"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="cofinsCst" className="text-xs font-bold text-slate-500 uppercase tracking-wider">CST COFINS</Label>
                    <Input
                      id="cofinsCst"
                      value={formData.cofinsCst}
                      maxLength={2}
                      onChange={(e) => setFormData({ ...formData, cofinsCst: e.target.value.replace(/\D/g, "").slice(0, 2) })}
                      className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-bold font-mono"
                      placeholder="49"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="aliquotaIcms" className="text-xs font-bold text-slate-500 uppercase tracking-wider">ICMS %</Label>
                    <Input
                      id="aliquotaIcms"
                      type="number"
                      step="0.01"
                      value={formData.aliquotaIcms ? (formData.aliquotaIcms / 100).toFixed(2) : ""}
                      onChange={(e) => setFormData({ ...formData, aliquotaIcms: Math.round((parseFloat(e.target.value) || 0) * 100) })}
                      className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-bold font-mono"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="aliquotaPis" className="text-xs font-bold text-slate-500 uppercase tracking-wider">PIS %</Label>
                    <Input
                      id="aliquotaPis"
                      type="number"
                      step="0.01"
                      value={formData.aliquotaPis ? (formData.aliquotaPis / 100).toFixed(2) : ""}
                      onChange={(e) => setFormData({ ...formData, aliquotaPis: Math.round((parseFloat(e.target.value) || 0) * 100) })}
                      className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-bold font-mono"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="aliquotaCofins" className="text-xs font-bold text-slate-500 uppercase tracking-wider">COFINS %</Label>
                    <Input
                      id="aliquotaCofins"
                      type="number"
                      step="0.01"
                      value={formData.aliquotaCofins ? (formData.aliquotaCofins / 100).toFixed(2) : ""}
                      onChange={(e) => setFormData({ ...formData, aliquotaCofins: Math.round((parseFloat(e.target.value) || 0) * 100) })}
                      className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-bold font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-6 border-t pt-4 border-slate-100">
                  <div className="col-span-3">
                    <Label htmlFor="precoCusto" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preço Custo</Label>
                    <Input
                      id="precoCusto"
                      type="number"
                      step="0.01"
                      value={formData.precoCusto ? (formData.precoCusto / 100).toFixed(2) : ""}
                      onChange={(e) => {
                        const newCusto = Math.round((parseFloat(e.target.value) || 0) * 100);
                        const margem = formData.margemLucro || 30; // 30% padrão
                        const newVenda = Math.round(newCusto * (1 + margem / 100));
                        setFormData({ 
                          ...formData, 
                          precoCusto: newCusto,
                          precoVenda: newVenda,
                          margemLucro: margem
                        });
                      }}
                      className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-bold font-mono"
                    />
                  </div>
                  <div className="col-span-3">
                    <Label htmlFor="margemLucro" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Margem (%)</Label>
                    <Input
                      id="margemLucro"
                      type="number"
                      value={formData.margemLucro || ""}
                      onChange={(e) => {
                        const newMargem = parseFloat(e.target.value) || 0;
                        const custo = formData.precoCusto || 0;
                        const newVenda = Math.round(custo * (1 + newMargem / 100));
                        setFormData({ 
                          ...formData, 
                          margemLucro: newMargem,
                          precoVenda: newVenda
                        });
                      }}
                      className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-bold font-mono"
                    />
                  </div>
                  <div className="col-span-3">
                    <Label htmlFor="precoVenda" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preço Venda</Label>
                    <Input
                      id="precoVenda"
                      type="number"
                      step="0.01"
                      value={formData.precoVenda ? (formData.precoVenda / 100).toFixed(2) : ""}
                      onChange={(e) => {
                        const newVenda = Math.round((parseFloat(e.target.value) || 0) * 100);
                        const custo = formData.precoCusto || 0;
                        let newMargem = formData.margemLucro;
                        if (custo > 0) {
                          newMargem = Math.round(((newVenda / custo) - 1) * 100);
                        }
                        setFormData({ 
                          ...formData, 
                          precoVenda: newVenda,
                          margemLucro: newMargem
                        });
                      }}
                      className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-bold font-mono"
                    />
                  </div>
                  <div className="col-span-3">
                    <Label htmlFor="estoque" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estoque Atual</Label>
                    <Input
                      id="estoque"
                      type="number"
                      value={formData.estoque || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, estoque: parseInt(e.target.value) || 0 })
                      }
                      className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-bold font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-6 pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ativo"
                      checked={formData.ativo}
                      onCheckedChange={(checked) => setFormData({ ...formData, ativo: !!checked })}
                      className="rounded text-blue-600 focus:ring-blue-600"
                    />
                    <Label htmlFor="ativo" className="text-sm font-bold text-slate-700">Ativo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="controlaEstoque"
                      checked={formData.controlaEstoque}
                      onCheckedChange={(checked) => setFormData({ ...formData, controlaEstoque: !!checked })}
                      className="rounded text-blue-600 focus:ring-blue-600"
                    />
                    <Label htmlFor="controlaEstoque" className="text-sm font-bold text-slate-700">Controla Estoque</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="permiteDesconto"
                      checked={formData.permiteDesconto}
                      onCheckedChange={(checked) => setFormData({ ...formData, permiteDesconto: !!checked })}
                      className="rounded text-blue-600 focus:ring-blue-600"
                    />
                    <Label htmlFor="permiteDesconto" className="text-sm font-bold text-slate-700">Permite Desconto</Label>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="h-11 px-5 font-bold rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="h-11 px-6 font-black rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/10 flex items-center gap-2"
                  >
                    Salvar Produto
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog de Criar Oferta */}
          <Dialog open={offerOpen} onOpenChange={setOfferOpen}>
            <DialogContent className="!max-w-4xl !w-[900px] rounded-3xl overflow-hidden border-0 shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-white p-0">
              <div className="bg-blue-600 px-6 py-5 text-white flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-300 animate-bounce" />
                    Agendar Oferta Relâmpago
                  </DialogTitle>
                  <p className="text-white/80 text-xs mt-1">Crie um agendamento rápido com vigência automática.</p>
                </div>
              </div>

              <form onSubmit={handleOfferSubmit} className="p-6">
                <div className="grid grid-cols-12 gap-6">
                  {/* Left Column: Configurações Básicas */}
                  <div className="col-span-6 space-y-6">
                    {/* Badge do Produto */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">
                        📦
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-black text-blue-600 tracking-wider">Mercadoria Selecionada</span>
                        <h4 className="text-sm font-black text-slate-800 leading-tight">{selectedProduto?.descricao}</h4>
                        <p className="text-xs text-slate-400 mt-1 font-mono">Código: {selectedProduto?.codigo} | Preço Atual: R$ {selectedProduto ? (selectedProduto.precoVenda / 100).toFixed(2) : "0.00"}</p>
                      </div>
                    </div>

                    {/* Nome da Oferta */}
                    <div className="space-y-1">
                      <Label htmlFor="offer-nome" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome da Promoção / Oferta</Label>
                      <Input
                        id="offer-nome"
                        value={offerFormData.nome}
                        onChange={(e) => setOfferFormData({ ...offerFormData, nome: e.target.value })}
                        placeholder="Ex: Super Desconto de Fim de Semana"
                        className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-bold"
                        required
                      />
                    </div>

                    {/* Resumo do Preço / Prévia em tempo real */}
                    {selectedProduto && (
                      <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between text-indigo-900 mt-2">
                        <div>
                          <span className="text-[10px] uppercase font-black text-indigo-600 tracking-wider">Preço com Oferta</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs line-through text-slate-400 font-mono">
                              R$ {(selectedProduto.precoVenda / 100).toFixed(2)}
                            </span>
                            <span className="text-base font-black text-indigo-700 font-mono">
                              R$ {offerFormData.tipoDesconto === "PRECO_FIXO"
                                ? Number(offerFormData.precoOferta).toFixed(2)
                                : ((selectedProduto.precoVenda / 100) * (1 - offerFormData.percentualDesconto / 100)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-black text-emerald-600 tracking-wider block">Economia</span>
                          <span className="text-xs font-bold text-emerald-700 font-mono">
                            R$ {offerFormData.tipoDesconto === "PRECO_FIXO"
                              ? ((selectedProduto.precoVenda / 100) - Number(offerFormData.precoOferta)).toFixed(2)
                              : ((selectedProduto.precoVenda / 100) * (offerFormData.percentualDesconto / 100)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Preço e Período */}
                  <div className="col-span-6 space-y-6">
                    {/* Tipo e Valor balanceados */}
                    <div className="space-y-4">
                      {/* Tipo de Desconto */}
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Modalidade da Oferta</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setOfferFormData({ ...offerFormData, tipoDesconto: "PRECO_FIXO" })}
                            className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-black text-sm ${
                              offerFormData.tipoDesconto === "PRECO_FIXO"
                                ? "border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm"
                                : "border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-500"
                            }`}
                          >
                            <DollarSign className="w-4 h-4" />
                            Preço Fixo
                          </button>
                          <button
                            type="button"
                            onClick={() => setOfferFormData({ ...offerFormData, tipoDesconto: "PERCENTUAL" })}
                            className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-black text-sm ${
                              offerFormData.tipoDesconto === "PERCENTUAL"
                                ? "border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm"
                                : "border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-500"
                            }`}
                          >
                            <Percent className="w-4 h-4" />
                            % Desconto
                          </button>
                        </div>
                      </div>

                      {/* Detalhes do Desconto */}
                      <div className="space-y-2">
                        {offerFormData.tipoDesconto === "PRECO_FIXO" ? (
                          <div className="space-y-2">
                            <Label htmlFor="offer-preco" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Novo Preço (R$)</Label>
                            <div className="relative">
                              <Input
                                id="offer-preco"
                                type="text"
                                inputMode="decimal"
                                value={offerFormData.precoOferta}
                                onChange={(e) => {
                                  // Allow only numbers, comma and dot
                                  let val = e.target.value.replace(/[^0-9.,]/g, '');
                                  setOfferFormData({ ...offerFormData, precoOferta: val as any });
                                }}
                                onBlur={(e) => {
                                  let val = e.target.value.replace(',', '.');
                                  if (val && !isNaN(Number(val))) {
                                    setOfferFormData({ ...offerFormData, precoOferta: Number(val).toFixed(2) as any });
                                  }
                                }}
                                placeholder="0.00"
                                className="h-14 text-2xl text-center rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-mono font-bold"
                                required
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label htmlFor="offer-percentual" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Porcentagem (%)</Label>
                            <div className="relative">
                              <Input
                                id="offer-percentual"
                                type="text"
                                inputMode="decimal"
                                value={offerFormData.percentualDesconto}
                                onChange={(e) => {
                                  let val = e.target.value.replace(/[^0-9.,]/g, '');
                                  setOfferFormData({ ...offerFormData, percentualDesconto: val as any });
                                }}
                                onBlur={(e) => {
                                  let val = e.target.value.replace(',', '.');
                                  if (val && !isNaN(Number(val))) {
                                    setOfferFormData({ ...offerFormData, percentualDesconto: Number(val).toFixed(2) as any });
                                  }
                                }}
                                placeholder="10.00"
                                className="h-14 text-2xl text-center rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-mono font-bold"
                                required
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Agendamento Simples (Datas e Horas) */}
                    <div className="border-t border-slate-100 pt-4 space-y-4">
                      <h5 className="text-[11px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        Período de Vigência
                      </h5>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="offer-datainicio" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data de Início</Label>
                          <Input
                            id="offer-datainicio"
                            type="date"
                            value={offerFormData.dataInicio}
                            onChange={(e) => setOfferFormData({ ...offerFormData, dataInicio: e.target.value })}
                            className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-bold"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="offer-horainicio" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hora</Label>
                          <div className="relative">
                            <Input
                              id="offer-horainicio"
                              type="time"
                              value={offerFormData.horaInicio}
                              onChange={(e) => setOfferFormData({ ...offerFormData, horaInicio: e.target.value })}
                              className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white pl-10 font-bold"
                              required
                            />
                            <Clock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="offer-datafim" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data de Término</Label>
                          <Input
                            id="offer-datafim"
                            type="date"
                            value={offerFormData.dataFim}
                            onChange={(e) => setOfferFormData({ ...offerFormData, dataFim: e.target.value })}
                            className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-bold"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="offer-horafim" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hora</Label>
                          <div className="relative">
                            <Input
                              id="offer-horafim"
                              type="time"
                              value={offerFormData.horaFim}
                              onChange={(e) => setOfferFormData({ ...offerFormData, horaFim: e.target.value })}
                              className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white pl-10 font-bold"
                              required
                            />
                            <Clock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOfferOpen(false)}
                    className="h-11 px-5 font-bold rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="h-11 px-6 font-black rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/10 flex items-center gap-2"
                    disabled={createOffer.isPending}
                  >
                    {createOffer.isPending ? "Agendando..." : "Confirmar e Agendar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Button 
            className="w-full justify-start bg-gray-100 text-black hover:bg-blue-600 hover:text-white" 
            variant="ghost"
            onClick={handleNewProduct}
            disabled={!hasPermission(user, "produtos_incluir")}
            title={!hasPermission(user, "produtos_incluir") ? "Você não tem permissão para incluir produtos" : "Incluir novo produto"}
          >
            Incluir
          </Button>

          <Button 
            className="w-full justify-start bg-gray-100 text-black hover:bg-blue-600 hover:text-white" 
            variant="ghost"
            onClick={() => selectedProduto && handleEdit(selectedProduto)}
            disabled={!selectedProduto || !hasPermission(user, "produtos_alterar")}
            title={!selectedProduto ? "Selecione um produto para alterar" : !hasPermission(user, "produtos_alterar") ? "Você não tem permissão para alterar produtos" : "Alterar produto selecionado"}
          >
            Alterar
          </Button>
          <Button 
            className="w-full justify-start bg-gray-100 text-black hover:bg-blue-600 hover:text-white" 
            variant="ghost"
            onClick={() => selectedProduto && handleDelete(selectedProduto.id)}
            disabled={!selectedProduto || !hasPermission(user, "produtos_excluir")}
            title={!selectedProduto ? "Selecione um produto para excluir" : !hasPermission(user, "produtos_excluir") ? "Você não tem permissão para excluir produtos" : "Excluir produto selecionado"}
          >
            Excluir
          </Button>

          <Button 
            className="w-full justify-start bg-gray-100 text-black hover:bg-blue-600 hover:text-white" 
            variant="ghost"
            onClick={() => setLocation("/vendas/ofertas")}
            title="Ir para a Gestão Geral de Ofertas"
          >
            Gestão Ofertas
          </Button>

          <Button 
            className="w-full justify-start bg-gray-100 text-black hover:bg-blue-600 hover:text-white" 
            variant="ghost"
            onClick={handleOpenOfferModal}
            disabled={!selectedProduto}
            title={!selectedProduto ? "Selecione uma mercadoria para criar oferta" : "Agendar Oferta"}
          >
            Criar Oferta
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
