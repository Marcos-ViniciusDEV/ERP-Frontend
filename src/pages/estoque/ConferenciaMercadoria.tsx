import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, CheckCircle, AlertTriangle, Clock, Barcode } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

export default function ConferenciaMercadoria() {
  const queryClient = useQueryClient();
  const [produtoEmConferencia, setProdutoEmConferencia] = useState<any>(null);
  const [formConferencia, setFormConferencia] = useState({
    quantidade: "",
    dataValidade: "",
    dataChegada: "",
  });

  const [nfeAtiva, setNfeAtiva] = useState<any>(null);
  const [codigoBarras, setCodigoBarras] = useState("");
  const [showResumo, setShowResumo] = useState(false);
  const [resumoFinal, setResumoFinal] = useState<any>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Buscar NFes pendentes
  const { data: nfesPendentes, refetch: refetchPendentes } = useQuery({
    queryKey: ["conferencias-pendentes"],
    queryFn: async () => {
      const { data } = await api.get("/conferencias/pendentes");
      return data;
    },
  });

  // Buscar conferências de uma NFe
  const { data: conferenciasDaNfe, refetch: refetchConferencias } = useQuery({
    queryKey: ["conferencias", nfeAtiva?.id],
    queryFn: async () => {
      if (!nfeAtiva) return [];
      const { data } = await api.get(`/conferencias/movimentacao/${nfeAtiva.id}`);
      return data;
    },
    enabled: !!nfeAtiva,
  });

  // Iniciar conferência
  const iniciarConferencia = useMutation({
    mutationFn: async (movimentacaoId: number) => {
      const { data } = await api.post(`/conferencias/movimentacao/${movimentacaoId}/iniciar`);
      return data;
    },
    onSuccess: (_, movimentacaoId) => {
      const nfe = nfesPendentes?.find((n: any) => n.id === movimentacaoId);
      setNfeAtiva(nfe);
      toast.success("Conferência iniciada!");
    },
  });

  // Criar conferência de item
  const criarConferencia = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/conferencias", data);
      return res.data;
    },
    onSuccess: () => {
      refetchConferencias();
      setCodigoBarras("");
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    },
  });

  // Finalizar conferência
  const finalizarConferencia = useMutation({
    mutationFn: async (movimentacaoId: number) => {
      const { data } = await api.post(`/conferencias/movimentacao/${movimentacaoId}/finalizar`);
      return data;
    },
    onSuccess: (data) => {
      setResumoFinal(data.resumo);
      setShowResumo(true);
      refetchPendentes();
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
    },
  });

  // Finalizar
  const handleFinalizar = async () => {
    if (!nfeAtiva) return;

    // Verificar se todos itens foram conferidos
    const todosConferidos = conferenciasDaNfe?.every(
      (c: any) => c.status === "CONFERIDO" || c.status === "DIVERGENCIA"
    );

    if (!todosConferidos) {
      toast.error("Confira todos os itens antes de finalizar!");
      return;
    }

    await finalizarConferencia.mutateAsync(nfeAtiva.id);
  };

  // Fechar resumo e voltar para lista
  const handleFecharResumo = () => {
    setShowResumo(false);
    setResumoFinal(null);
    setNfeAtiva(null);
    setProdutoEmConferencia(null);
  };

  // Focar no input de código de barras quando NFe ativa mudar
  useEffect(() => {
    if (nfeAtiva && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [nfeAtiva]);

  // Buscar produto por código de barras
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoBarras || !nfeAtiva) return;

    try {
      const { data } = await api.get(`/conferencias/codigo-barras/${codigoBarras}`, {
        params: { movimentacaoId: nfeAtiva.id },
      });

      if (data) {
        // Produto encontrado, preparar para conferência manual
        setProdutoEmConferencia(data);
        setFormConferencia({
          quantidade: "",
          dataValidade: "",
          dataChegada: new Date().toISOString().split("T")[0], // Default para hoje
        });
        toast.info(`Produto ${data.produto.descricao} encontrado. Digite os dados.`);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error("Produto não encontrado nesta NFe");
      } else {
        toast.error("Erro ao buscar produto");
      }
    }
  };

  // Confirmar conferência do item
  const handleConfirmarItem = async () => {
    if (!produtoEmConferencia || !formConferencia.quantidade) {
      toast.error("Digite a quantidade!");
      return;
    }

    try {
      await criarConferencia.mutateAsync({
        movimentacaoEstoqueId: nfeAtiva.id,
        produtoId: produtoEmConferencia.produto.id,
        quantidadeEsperada: produtoEmConferencia.movimentacao.quantidade,
        quantidadeConferida: parseInt(formConferencia.quantidade),
        dataValidade: formConferencia.dataValidade ? new Date(formConferencia.dataValidade) : undefined,
        dataChegada: formConferencia.dataChegada ? new Date(formConferencia.dataChegada) : undefined,
        codigoBarrasLido: codigoBarras,
      });
      
      toast.success("Item conferido com sucesso!");
      setProdutoEmConferencia(null);
      setCodigoBarras("");
      setFormConferencia({ quantidade: "", dataValidade: "", dataChegada: "" });
      
      // Focar no scanner novamente
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    } catch (error) {
      toast.error("Erro ao conferir item");
    }
  };

  // ... (rest of the component)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Conferência de Mercadoria</h1>
          {nfeAtiva && (
            <Button variant="outline" onClick={() => setNfeAtiva(null)}>
              Voltar para Lista
            </Button>
          )}
        </div>

        {!nfeAtiva ? (
          <Card>
            <CardHeader>
              <CardTitle>NFes Pendentes de Conferência</CardTitle>
            </CardHeader>
            <CardContent>
              {nfesPendentes && nfesPendentes.length > 0 ? (
                <div className="space-y-3">
                  {nfesPendentes.map((nfe: any) => (
                    <Card
                      key={nfe.id}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => iniciarConferencia.mutate(nfe.id)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Package className="h-5 w-5 text-blue-500" />
                              <p className="font-bold text-lg">
                                {nfe.documentoReferencia || `Movimentação #${nfe.id}`}
                              </p>
                              <Badge 
                                variant="outline" 
                                className={
                                  nfe.status === "CONFERIDO_COM_DIVERGENCIA" 
                                    ? "bg-red-50 text-red-700 border-red-200" 
                                    : nfe.status === "EM_CONFERENCIA"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-yellow-50 text-yellow-700 border-yellow-200"
                                }
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                {nfe.status === "CONFERIDO_COM_DIVERGENCIA" ? "Com Divergência" : 
                                 nfe.status === "EM_CONFERENCIA" ? "Em Conferência" : "Pendente"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {nfe.observacao || "Entrada de mercadoria"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(nfe.data).toLocaleDateString("pt-BR")} às{" "}
                              {new Date(nfe.data).toLocaleTimeString("pt-BR")}
                            </p>
                          </div>
                          <Button
                            disabled={iniciarConferencia.isPending}
                          >
                            {nfe.status === "EM_CONFERENCIA" ? "Continuar" : "Iniciar"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma NFe pendente de conferência
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Cabeçalho da NFe */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-6 w-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-blue-900">
                        {nfeAtiva.documentoReferencia || `Movimentação #${nfeAtiva.id}`}
                      </h2>
                      <Badge className="bg-blue-500">
                        Em Conferência
                      </Badge>
                    </div>
                    <p className="text-sm text-blue-700">
                      {nfeAtiva.observacao || "Entrada de mercadoria"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scanner de Código de Barras */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Barcode className="h-5 w-5" />
                  Scanner de Código de Barras
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                  <Input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder="Escaneie ou digite o código de barras..."
                    value={codigoBarras}
                    onChange={(e) => setCodigoBarras(e.target.value)}
                    className="flex-1"
                    autoFocus={!produtoEmConferencia}
                  />
                  <Button type="submit" disabled={!codigoBarras}>
                    Buscar
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Formulário de Conferência do Item */}
            {produtoEmConferencia && (
              <Card className="border-blue-500 border-2">
                <CardHeader>
                  <CardTitle>Conferindo: {produtoEmConferencia.produto.descricao}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Quantidade Conferida</Label>
                      <Input
                        type="number"
                        value={formConferencia.quantidade}
                        onChange={(e) => setFormConferencia({...formConferencia, quantidade: e.target.value})}
                        placeholder="Digite a quantidade"
                        autoFocus
                        className="text-lg font-bold"
                      />
                    </div>
                    <div>
                      <Label>Data de Validade</Label>
                      <Input
                        type="date"
                        value={formConferencia.dataValidade}
                        onChange={(e) => setFormConferencia({...formConferencia, dataValidade: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Data de Chegada</Label>
                      <Input
                        type="date"
                        value={formConferencia.dataChegada}
                        onChange={(e) => setFormConferencia({...formConferencia, dataChegada: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setProdutoEmConferencia(null)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleConfirmarItem} className="bg-blue-600 hover:bg-blue-700">
                      Confirmar Item
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lista de Itens Já Conferidos */}
            <Card>
              <CardHeader>
                <CardTitle>Itens Conferidos</CardTitle>
              </CardHeader>
              <CardContent>
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Qtd. Esperada</TableHead>
                      <TableHead>Qtd. Conferida</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conferenciasDaNfe?.map((conf: any) => (
                      <TableRow key={conf.id}>
                        <TableCell>{conf.produto?.descricao || `Produto #${conf.produtoId}`}</TableCell>
                        <TableCell>{conf.quantidadeEsperada}</TableCell>
                        <TableCell>{conf.quantidadeConferida}</TableCell>
                        <TableCell>
                          <Badge variant={conf.status === "DIVERGENCIA" ? "destructive" : "default"} className={conf.status === "CONFERIDO" ? "bg-green-600" : ""}>
                            {conf.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!conferenciasDaNfe || conferenciasDaNfe.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Nenhum item conferido ainda.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Botão Finalizar */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setNfeAtiva(null)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleFinalizar}
                disabled={finalizarConferencia.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Finalizar Conferência
              </Button>
            </div>
          </div>
        )}

        {/* Modal de Resumo (mantido igual) */}
        <Dialog open={showResumo} onOpenChange={setShowResumo}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Conferência Finalizada!</DialogTitle>
            </DialogHeader>
            {resumoFinal && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {resumoFinal.itensConferidos}
                    </p>
                    <p className="text-xs text-muted-foreground">Conferidos OK</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">
                      {resumoFinal.itensDivergentes}
                    </p>
                    <p className="text-xs text-muted-foreground">Divergências</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {resumoFinal.totalItens}
                    </p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>

                {resumoFinal.divergencias && resumoFinal.divergencias.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Itens com Divergência:
                    </Label>
                    <div className="space-y-2">
                      {resumoFinal.divergencias.map((div: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 bg-red-50 border border-red-200 rounded-md"
                        >
                          <p className="text-sm font-medium">
                            Produto #{div.produtoId}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {div.observacao}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleFecharResumo}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
