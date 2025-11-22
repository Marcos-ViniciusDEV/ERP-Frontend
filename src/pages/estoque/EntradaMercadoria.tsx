import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileUp, Plus, Package, ChevronDown, ChevronRight, Upload, FileText, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function EntradaMercadoria() {
  const [activeTab, setActiveTab] = useState("nfe");
  const [showItens, setShowItens] = useState<number | null>(null);
  const queryClient = useQueryClient();
  
  // Estados para Importação de NFe
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [nfeData, setNfeData] = useState<any>(null);

  // Estados para Entrada Manual
  const [openManual, setOpenManual] = useState(false);
  const [fornecedorId, setFornecedorId] = useState(0);
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [itensEntrada, setItensEntrada] = useState<Array<{
    produtoId: number;
    quantidade: number;
    precoUnitario: number;
  }>>([]);
  const [novoProdutoId, setNovoProdutoId] = useState(0);
  const [novaQuantidade, setNovaQuantidade] = useState(0);
  const [novoPreco, setNovoPreco] = useState(0);

  const { data: kardex } = useQuery({
    queryKey: ["kardex"],
    queryFn: async () => {
      const { data } = await api.get("/kardex");
      return data;
    },
  });

  const { data: fornecedores } = useQuery({
    queryKey: ["fornecedores"],
    queryFn: async () => {
      const { data } = await api.get("/fornecedores");
      return data;
    },
  });

  const { data: produtos } = useQuery({
    queryKey: ["produtos"],
    queryFn: async () => {
      const { data } = await api.get("/produtos");
      return data;
    },
  });

  const createMovimentacao = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/kardex", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kardex"] });
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
    },
  });

  const updatePrecos = useMutation({
    mutationFn: async ({ produtoId, precoCusto }: { produtoId: number; precoCusto: number }) => {
      const res = await api.put(`/produtos/${produtoId}/precos`, { precoCusto });
      return res.data;
    },
  });

  const deleteMovimentacao = useMutation({
    mutationFn: async (ids: number[]) => {
      await api.post("/kardex/delete-batch", { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kardex"] });
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      toast.success("Entrada cancelada com sucesso!");
      setTimeout(() => window.location.reload(), 500); // Forçar recarregamento para garantir atualização
    },
    onError: (error) => {
      toast.error("Erro ao cancelar entrada");
      console.error("Erro ao cancelar:", error);
    },
  });

  console.log("Kardex Data:", kardex); // Debug data structure

  // Lógica de Importação de NFe
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith(".xml")) {
        setSelectedFile(file);
        parseXML(file);
      } else {
        toast.error("Por favor, selecione um arquivo XML válido");
      }
    }
  };

  const parseXML = async (file: File) => {
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");

      const nfeNumber = xmlDoc.querySelector("nNF")?.textContent || "N/A";
      const fornecedor = xmlDoc.querySelector("emit xNome")?.textContent || "N/A";
      const cnpjFornecedor = xmlDoc.querySelector("emit CNPJ")?.textContent || "";
      const dataEmissao = xmlDoc.querySelector("dhEmi")?.textContent || "N/A";

      const items = Array.from(xmlDoc.querySelectorAll("det")).map((det) => {
        const codigo = det.querySelector("cProd")?.textContent || "";
        const descricao = det.querySelector("xProd")?.textContent || "";
        const quantidade = parseFloat(det.querySelector("qCom")?.textContent || "0");
        const valorUnitario = parseFloat(det.querySelector("vUnCom")?.textContent || "0");
        const valorTotal = parseFloat(det.querySelector("vProd")?.textContent || "0");

        return {
          codigo,
          descricao,
          quantidade,
          valorUnitario: Math.round(valorUnitario * 100),
          valorTotal: Math.round(valorTotal * 100),
        };
      });

      const valorTotalNota = items.reduce((acc, item) => acc + item.valorTotal, 0);

      setNfeData({
        numero: nfeNumber,
        fornecedor,
        cnpjFornecedor,
        dataEmissao,
        valorTotal: valorTotalNota,
        items,
      });

      toast.success("XML processado com sucesso!");
    } catch (error) {
      toast.error("Erro ao processar XML. Verifique o formato do arquivo.");
      console.error(error);
    }
  };

  const handleImportNFe = async () => {
    if (!nfeData || !nfeData.items || nfeData.items.length === 0) {
      toast.error("Nenhum item para importar");
      return;
    }

    try {
      let importedCount = 0;
      let skippedCount = 0;

      for (const item of nfeData.items) {
        const produto = produtos?.find((p: any) => p.codigo === item.codigo);

        if (produto) {
          await createMovimentacao.mutateAsync({
            produtoId: produto.id,
            tipo: "ENTRADA_NFE",
            quantidade: item.quantidade,
            saldoAnterior: produto.estoque,
            saldoAtual: produto.estoque + item.quantidade, // Backend ignorará isso se for PENDENTE_CONFERENCIA
            custoUnitario: item.valorUnitario,
            documentoReferencia: `NFE-${nfeData.numero}`,
            fornecedor: nfeData.fornecedor,
            observacao: `Entrada via NFe ${nfeData.numero} - ${nfeData.fornecedor}`,
          });
          importedCount++;
        } else {
          skippedCount++;
        }
      }

      toast.success(
        `NFe importada! ${importedCount} itens processados, ${skippedCount} itens ignorados (produto não cadastrado).`
      );
      setNfeData(null);
      setSelectedFile(null);
    } catch (error) {
      toast.error("Erro ao importar NFe");
      console.error(error);
    }
  };

  // Agrupar movimentações por fornecedor (simulando notas fiscais)
  const notasPorFornecedor = kardex
    ?.filter((mov: any) => mov.tipo === "ENTRADA_NFE")
    .reduce((acc: any, mov: any) => {
      const key = `${mov.fornecedor || "Sem Fornecedor"}-${mov.numeroDocumento || "S/N"}`;
      if (!acc[key]) {
        acc[key] = {
          fornecedor: mov.fornecedor || "Sem Fornecedor",
          numeroDocumento: mov.numeroDocumento || "S/N",
          data: mov.createdAt, // Fixed: using createdAt instead of data
          itens: [],
          valorTotal: 0,
          status: mov.statusConferencia || "CONFERIDO", // Default para conferido se não tiver status
        };
      }
      acc[key].itens.push(mov);
      acc[key].valorTotal += mov.quantidade * (mov.custoUnitario || 0);
      // Se algum item estiver pendente, a nota toda é considerada pendente
      if (mov.statusConferencia === "PENDENTE_CONFERENCIA") {
        acc[key].status = "PENDENTE_CONFERENCIA";
      } else if (mov.statusConferencia === "EM_CONFERENCIA" && acc[key].status !== "PENDENTE_CONFERENCIA") {
        acc[key].status = "EM_CONFERENCIA";
      }
      return acc;
    }, {});

  const notasArray = notasPorFornecedor ? Object.values(notasPorFornecedor) : [];

  const handleAdicionarItem = () => {
    if (novoProdutoId === 0 || novaQuantidade <= 0 || novoPreco <= 0) {
      toast.error("Preencha todos os campos do item");
      return;
    }
    setItensEntrada([
      ...itensEntrada,
      {
        produtoId: novoProdutoId,
        quantidade: novaQuantidade,
        precoUnitario: novoPreco,
      },
    ]);
    setNovoProdutoId(0);
    setNovaQuantidade(0);
    setNovoPreco(0);
  };

  const handleRemoverItem = (index: number) => {
    setItensEntrada(itensEntrada.filter((_, i) => i !== index));
  };

  const handleConfirmarEntrada = async () => {
    if (fornecedorId === 0) {
      toast.error("Selecione um fornecedor");
      return;
    }
    if (itensEntrada.length === 0) {
      toast.error("Adicione pelo menos um item");
      return;
    }

    try {
      for (const item of itensEntrada) {
        const produto = produtos?.find((p: any) => p.id === item.produtoId);
        const saldoAnterior = produto?.estoque || 0;
        const saldoAtual = saldoAnterior + item.quantidade;
        
        const fornecedorNome = fornecedores?.find((f: any) => f.id === fornecedorId)?.nomeFantasia || fornecedores?.find((f: any) => f.id === fornecedorId)?.razaoSocial;
        
        await createMovimentacao.mutateAsync({
          produtoId: item.produtoId,
          tipo: "ENTRADA_NFE",
          quantidade: item.quantidade,
          saldoAnterior,
          saldoAtual,
          custoUnitario: item.precoUnitario,
          documentoReferencia: numeroDocumento || undefined,
          fornecedor: fornecedorNome,
          observacao: `Entrada manual - Fornecedor: ${fornecedorNome}`,
        });
        
        // Atualizar preço de custo e recalcular preço de venda baseado na margem
        await updatePrecos.mutateAsync({
          produtoId: item.produtoId,
          precoCusto: item.precoUnitario,
        });
      }
      toast.success("Entrada de mercadoria registrada com sucesso!");
      setOpenManual(false);
      setFornecedorId(0);
      setNumeroDocumento("");
      setItensEntrada([]);
    } catch (error) {
      toast.error("Erro ao registrar entrada de mercadoria");
    }
  };

  const calcularValorTotal = () => {
    return itensEntrada.reduce(
      (total, item) => total + item.quantidade * item.precoUnitario,
      0
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDENTE_CONFERENCIA":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" /> Pendente Conferência</Badge>;
      case "EM_CONFERENCIA":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Clock className="h-3 w-3 mr-1" /> Em Conferência</Badge>;
      case "CONFERIDO":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" /> Conferido</Badge>;
      case "CONFERIDO_COM_DIVERGENCIA":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><AlertTriangle className="h-3 w-3 mr-1" /> Com Divergência</Badge>;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Entrada de Mercadoria</h1>
          <p className="text-muted-foreground mt-1">
            Registre entradas de mercadorias via NFe ou manualmente
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="nfe">
              <FileUp className="h-4 w-4 mr-2" />
              Entrada de NFe
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Package className="h-4 w-4 mr-2" />
              Entrada Manual
            </TabsTrigger>
          </TabsList>

          {/* Aba: Entrada de NFe */}
          <TabsContent value="nfe" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload de XML de NFe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="xml-file">Selecione o arquivo XML</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Input
                      id="xml-file"
                      type="file"
                      accept=".xml"
                      onChange={handleFileChange}
                      className="flex-1"
                    />
                    {selectedFile && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>{selectedFile.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {nfeData && (
                  <div className="space-y-4 pt-4 border-t">
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Fornecedor</Label>
                            <p className="text-lg font-bold text-blue-900">{nfeData.fornecedor}</p>
                            <p className="text-xs text-muted-foreground">{nfeData.cnpjFornecedor}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Número da NFe</Label>
                            <p className="text-lg font-bold text-blue-900">{nfeData.numero}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(nfeData.dataEmissao).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs text-muted-foreground">Valor Total da Nota</Label>
                            <p className="text-2xl font-bold text-green-600">
                              R$ {(nfeData.valorTotal / 100).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {nfeData.items.length} itens na nota
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Itens da NFe ({nfeData.items.length})
                      </Label>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead className="text-right">Quantidade</TableHead>
                            <TableHead className="text-right">Valor Unit.</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {nfeData.items.map((item: any, index: number) => {
                            const produtoExiste = produtos?.find((p: any) => p.codigo === item.codigo);
                            return (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{item.codigo}</TableCell>
                                <TableCell>{item.descricao}</TableCell>
                                <TableCell className="text-right">{item.quantidade}</TableCell>
                                <TableCell className="text-right">
                                  R$ {(item.valorUnitario / 100).toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right">
                                  R$ {(item.valorTotal / 100).toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  {produtoExiste ? (
                                    <span className="text-green-600 text-xs">✓ Cadastrado</span>
                                  ) : (
                                    <span className="text-red-600 text-xs">✗ Não cadastrado</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setNfeData(null);
                          setSelectedFile(null);
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleImportNFe} disabled={createMovimentacao.isPending}>
                        <Upload className="h-4 w-4 mr-2" />
                        {createMovimentacao.isPending ? "Importando..." : "Importar NFe"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notas Fiscais Recebidas</CardTitle>
              </CardHeader>
              <CardContent>
                {notasArray.length > 0 ? (
                  <div className="space-y-2">
                    {notasArray.map((nota: any, index: number) => (
                      <div key={index} className="border rounded-lg">
                        <div
                          className="p-4 cursor-pointer hover:bg-accent transition-colors flex items-center justify-between"
                          onClick={() => setShowItens(showItens === index ? null : index)}
                        >
                          <div className="flex items-center gap-3">
                            {showItens === index ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{nota.fornecedor}</p>
                                {getStatusBadge(nota.status)}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                NFe: {nota.numeroDocumento} • {nota.itens.length} itens
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-bold text-lg">
                                {new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(nota.valorTotal / 100)} {/* Dividindo por 100 pois está em centavos */}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(nota.data).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Tem certeza que deseja cancelar esta entrada? O estoque será revertido.")) {
                                  const ids = nota.itens.map((i: any) => i.id);
                                  deleteMovimentacao.mutate(ids);
                                }
                              }}
                              disabled={deleteMovimentacao.isPending}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                        {showItens === index && (
                          <div className="border-t p-4 bg-muted/30">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Produto</TableHead>
                                  <TableHead className="text-right">Quantidade</TableHead>
                                  <TableHead className="text-right">Preço Unit.</TableHead>
                                  <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {nota.itens.map((item: any, itemIndex: number) => (
                                  <TableRow key={itemIndex}>
                                    <TableCell>
                                      {produtos?.find((p: any) => p.id === item.produtoId)
                                        ?.descricao || `Produto #${item.produtoId}`}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {item.quantidade}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      R$ {((item.custoUnitario || 0) / 100).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                      R${" "}
                                      {(
                                        (item.quantidade * (item.custoUnitario || 0)) /
                                        100
                                      ).toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhuma nota fiscal recebida.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Entrada Manual */}
          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Registrar Entrada Manual</CardTitle>
                <Button onClick={() => setOpenManual(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Entrada
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Use esta opção para registrar entradas de mercadorias sem nota fiscal
                  (compras simples, doações, transferências, etc.)
                </p>
              </CardContent>
            </Card>

            <Dialog open={openManual} onOpenChange={setOpenManual}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nova Entrada Manual de Mercadoria</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Dados da Entrada */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Dados da Entrada</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fornecedor">Fornecedor *</Label>
                          <select
                            id="fornecedor"
                            value={fornecedorId}
                            onChange={(e) => setFornecedorId(parseInt(e.target.value))}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value={0}>Selecione um fornecedor</option>
                            {fornecedores?.map((fornecedor: any) => (
                              <option key={fornecedor.id} value={fornecedor.id}>
                                {fornecedor.nomeFantasia || fornecedor.razaoSocial}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="numeroDocumento">Número do Documento</Label>
                          <Input
                            id="numeroDocumento"
                            placeholder="Ex: Recibo 001"
                            value={numeroDocumento}
                            onChange={(e) => setNumeroDocumento(e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Adicionar Itens */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Adicionar Itens</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-2">
                          <Label htmlFor="produto">Produto</Label>
                          <select
                            id="produto"
                            value={novoProdutoId}
                            onChange={(e) => setNovoProdutoId(parseInt(e.target.value))}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value={0}>Selecione um produto</option>
                            {produtos?.map((produto: any) => (
                              <option key={produto.id} value={produto.id}>
                                {produto.codigo} - {produto.descricao}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="quantidade">Quantidade</Label>
                          <Input
                            id="quantidade"
                            type="number"
                            value={novaQuantidade}
                            onChange={(e) => setNovaQuantidade(parseInt(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="preco">Preço Unit. (R$)</Label>
                          <Input
                            id="preco"
                            type="number"
                            step="0.01"
                            value={novoPreco / 100}
                            onChange={(e) =>
                              setNovoPreco(Math.round(parseFloat(e.target.value) * 100))
                            }
                          />
                        </div>
                      </div>
                      <Button onClick={handleAdicionarItem} variant="outline" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Item
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Lista de Itens */}
                  {itensEntrada.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Itens da Entrada</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produto</TableHead>
                              <TableHead className="text-right">Quantidade</TableHead>
                              <TableHead className="text-right">Preço Unit.</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {itensEntrada.map((item, index) => {
                              const produto = produtos?.find((p: any) => p.id === item.produtoId);
                              return (
                                <TableRow key={index}>
                                  <TableCell>
                                    {produto?.codigo} - {produto?.descricao}
                                  </TableCell>
                                  <TableCell className="text-right">{item.quantidade}</TableCell>
                                  <TableCell className="text-right">
                                    R$ {(item.precoUnitario / 100).toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    R${" "}
                                    {((item.quantidade * item.precoUnitario) / 100).toFixed(2)}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoverItem(index)}
                                    >
                                      ✕
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                            <TableRow>
                              <TableCell colSpan={3} className="text-right font-bold">
                                Total:
                              </TableCell>
                              <TableCell className="text-right font-bold text-lg">
                                R$ {(calcularValorTotal() / 100).toFixed(2)}
                              </TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}

                  {/* Botões de Ação */}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setOpenManual(false);
                        setFornecedorId(0);
                        setNumeroDocumento("");
                        setItensEntrada([]);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleConfirmarEntrada}
                      disabled={createMovimentacao.isPending}
                    >
                      {createMovimentacao.isPending
                        ? "Processando..."
                        : "Confirmar Entrada"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
