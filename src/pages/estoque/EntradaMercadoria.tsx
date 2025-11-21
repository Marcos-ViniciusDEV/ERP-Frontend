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
import { trpc } from "@/lib/trpc";
import { FileUp, Plus, Package, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function EntradaMercadoria() {
  const [activeTab, setActiveTab] = useState("nfe");
  const [showItens, setShowItens] = useState<number | null>(null);
  
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

  const { data: kardex } = trpc.kardex.listByProduto.useQuery({ produtoId: 0 });
  const { data: fornecedores } = trpc.fornecedores.list.useQuery();
  const { data: produtos } = trpc.produtos.list.useQuery();
  const createMovimentacao = trpc.kardex.create.useMutation();
  const updatePrecos = trpc.produtos.updatePrecos.useMutation();

  // Agrupar movimentações por fornecedor (simulando notas fiscais)
  const notasPorFornecedor = kardex
    ?.filter((mov: any) => mov.tipoMovimentacao === "ENTRADA_NFE")
    .reduce((acc: any, mov: any) => {
      const key = `${mov.fornecedor || "Sem Fornecedor"}-${mov.numeroDocumento || "S/N"}`;
      if (!acc[key]) {
        acc[key] = {
          fornecedor: mov.fornecedor || "Sem Fornecedor",
          numeroDocumento: mov.numeroDocumento || "S/N",
          data: mov.data,
          itens: [],
          valorTotal: 0,
        };
      }
      acc[key].itens.push(mov);
      acc[key].valorTotal += mov.quantidade * (mov.precoUnitario || 0);
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
        
        await createMovimentacao.mutateAsync({
          produtoId: item.produtoId,
          tipo: "ENTRADA_NFE",
          quantidade: item.quantidade,
          saldoAnterior,
          saldoAtual,
          custoUnitario: item.precoUnitario,
          documentoReferencia: numeroDocumento || undefined,
          observacao: `Entrada manual - Fornecedor: ${fornecedores?.find((f: any) => f.id === fornecedorId)?.nomeFantasia || fornecedores?.find((f: any) => f.id === fornecedorId)?.razaoSocial}`,
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
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <FileUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Arraste e solte o arquivo XML da NFe aqui ou clique para selecionar
                  </p>
                  <Button variant="outline">
                    <FileUp className="h-4 w-4 mr-2" />
                    Selecionar Arquivo XML
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  O sistema processará automaticamente o XML e registrará os produtos no estoque
                </p>
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
                              <p className="font-medium">{nota.fornecedor}</p>
                              <p className="text-sm text-muted-foreground">
                                NFe: {nota.numeroDocumento} • {nota.itens.length} itens
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">
                              R$ {(nota.valorTotal / 100).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(nota.data).toLocaleDateString("pt-BR")}
                            </p>
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
                                      R$ {((item.precoUnitario || 0) / 100).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                      R${" "}
                                      {(
                                        (item.quantidade * (item.precoUnitario || 0)) /
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
