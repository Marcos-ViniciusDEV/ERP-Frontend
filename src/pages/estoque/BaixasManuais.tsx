import DashboardLayout from "@/components/DashboardLayout";
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
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Barcode, Hash, Minus, Package, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function BaixasManuais() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: produtosData, isLoading: isLoadingProdutos } = useQuery({
    queryKey: ["produtos"],
    queryFn: async () => {
      const response = await api.get("/produtos");
      return response.data;
    },
  });
  const [produtoSearch, setProdutoSearch] = useState("");

  const { data: movimentacoesData, isLoading: isLoadingBaixas } = useQuery({
    queryKey: ["kardex"],
    queryFn: async () => {
      const response = await api.get("/kardex");
      return response.data;
    },
  });

  const createMovimentacao = useMutation({
    mutationFn: async (payload: {
      produtoId: number;
      tipo: "BAIXA_PERDA" | "BAIXA_LANCHE" | "BAIXA_USO";
      quantidade: number;
      saldoAnterior: number;
      saldoAtual: number;
      observacao?: string;
    }) => {
      const response = await api.post("/kardex", payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Baixa registrada com sucesso!");
      setOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      queryClient.invalidateQueries({ queryKey: ["kardex"] });
    },
    onError: () => {
      toast.error("Erro ao registrar baixa");
    },
  });

  const [formData, setFormData] = useState({
    produtoId: 0,
    tipo: "BAIXA_PERDA" as const,
    quantidade: 0,
    observacao: "",
  });

  const produtos = useMemo(() => (Array.isArray(produtosData) ? produtosData : []), [produtosData]);
  const allMovimentacoes = useMemo(
    () => (Array.isArray(movimentacoesData) ? movimentacoesData : []),
    [movimentacoesData]
  );

  const textValue = (value: unknown) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string" || typeof value === "number") return String(value);
    return "";
  };

  const selectedProduto = produtos?.find((produto: any) => produto.id === formData.produtoId);

  const produtosFiltrados = useMemo(() => {
    const term = produtoSearch.trim().toLowerCase();
    if (!term) return (produtos || []).slice(0, 20);

    return (produtos || [])
      .filter((produto: any) =>
        [
          textValue(produto.codigo),
          textValue(produto.codigoBarras),
          textValue(produto.descricao),
          textValue(produto.marca),
        ]
          .some((field) => field.toLowerCase().includes(term))
      )
      .slice(0, 30);
  }, [produtoSearch, produtos]);

  const resetForm = () => {
    setFormData({
      produtoId: 0,
      tipo: "BAIXA_PERDA",
      quantidade: 0,
      observacao: "",
    });
    setProdutoSearch("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const produto = produtos.find((p: { id: number; estoque: number }) => p.id === formData.produtoId);
    if (!produto) {
      toast.error("Produto não encontrado");
      return;
    }

    if (formData.quantidade <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }

    const estoqueAtual = Number(produto.estoque) || 0;

    if (formData.quantidade > estoqueAtual) {
      toast.error("Quantidade maior que o estoque disponível");
      return;
    }

    try {
      await createMovimentacao.mutateAsync({
        produtoId: formData.produtoId,
        tipo: formData.tipo,
        quantidade: -formData.quantidade,
        saldoAnterior: estoqueAtual,
        saldoAtual: estoqueAtual - formData.quantidade,
        observacao: formData.observacao || undefined,
      });
    } catch {}
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      BAIXA_PERDA: "Perda",
      BAIXA_LANCHE: "Lanche",
      BAIXA_USO: "Uso Interno",
    };
    return labels[tipo] || tipo;
  };

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      BAIXA_PERDA: "text-red-600",
      BAIXA_LANCHE: "text-orange-600",
      BAIXA_USO: "text-blue-600",
    };
    return colors[tipo] || "";
  };

  const baixasManuais = allMovimentacoes.filter((m: any) =>
    ["BAIXA_PERDA", "BAIXA_LANCHE", "BAIXA_USO"].includes(m.tipo)
  );

  return (
    <DashboardLayout>
      <div className="space-y-4 rounded-md border bg-background p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Baixas Manuais</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Registre perdas, lanches e uso interno de produtos
            </p>
          </div>
          <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
              setOpen(nextOpen);
              if (!nextOpen) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Minus className="h-4 w-4 mr-2" />
                Nova Baixa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Registrar Baixa Manual</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="produtoId">Produto *</Label>
                  <div className="mt-1 rounded-md border bg-background">
                    <div className="flex items-center gap-2 border-b px-3">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="produtoId"
                        value={produtoSearch}
                        onChange={(event) => setProdutoSearch(event.target.value)}
                        placeholder="Pesquise por código, código de barras ou nome do produto..."
                        className="h-11 border-none shadow-none focus-visible:ring-0"
                      />
                    </div>

                    {selectedProduto && (
                      <div className="flex items-center justify-between gap-3 border-b bg-blue-50/60 px-3 py-2 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{textValue(selectedProduto.descricao)}</p>
                          <p className="text-xs text-muted-foreground">
                            Código {textValue(selectedProduto.codigo) || "-"} | Barras {textValue(selectedProduto.codigoBarras) || "-"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">Estoque</p>
                          <p className="font-mono font-bold">{selectedProduto.estoque}</p>
                        </div>
                      </div>
                    )}

                    <div className="max-h-64 overflow-auto p-1">
                      {isLoadingProdutos ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          Carregando produtos...
                        </div>
                      ) : produtosFiltrados.length > 0 ? (
                        produtosFiltrados.map((produto: any) => (
                          <button
                            key={produto.id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, produtoId: produto.id });
                              setProdutoSearch(`${textValue(produto.codigo)} - ${textValue(produto.descricao)}`);
                            }}
                            className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted ${
                              formData.produtoId === produto.id ? "bg-muted" : ""
                            }`}
                          >
                            <Package className="h-4 w-4 text-blue-600" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">{textValue(produto.descricao)}</p>
                              <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <Hash className="h-3 w-3" />
                                  {textValue(produto.codigo) || "-"}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Barcode className="h-3 w-3" />
                                  {textValue(produto.codigoBarras) || "-"}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold uppercase text-muted-foreground">Estoque</p>
                              <p className="font-mono font-semibold">{produto.estoque}</p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          Nenhum produto encontrado.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="tipo">Tipo de Baixa *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BAIXA_PERDA">Perda (Vencimento, Quebra)</SelectItem>
                      <SelectItem value="BAIXA_LANCHE">Lanche (Consumo Funcionários)</SelectItem>
                      <SelectItem value="BAIXA_USO">Uso Interno (Limpeza, etc)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quantidade">Quantidade *</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    min="1"
                    value={formData.quantidade}
                    onChange={(e) =>
                      setFormData({ ...formData, quantidade: parseInt(e.target.value) || 0 })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="observacao">Observação</Label>
                  <Input
                    id="observacao"
                    value={formData.observacao}
                    onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                    placeholder="Motivo da baixa..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMovimentacao.isPending || !formData.produtoId}>
                    {createMovimentacao.isPending ? "Salvando..." : "Registrar Baixa"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Baixas Manuais</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingBaixas ? (
              <p className="text-muted-foreground">Carregando baixas manuais...</p>
            ) : baixasManuais.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead>Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {baixasManuais.map((mov: any) => {
                    const produto = produtos?.find((p: { id: number; codigo: string; descricao: string }) => p.id === mov.produtoId);
                    return (
                      <TableRow key={mov.id}>
                        <TableCell>
                          {new Date(mov.createdAt).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {textValue(produto?.codigo) || "-"} - {textValue(produto?.descricao) || "-"}
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${getTipoColor(mov.tipo)}`}>
                            {getTipoLabel(mov.tipo)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{Math.abs(Number(mov.quantidade) || 0)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {mov.observacao || "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">Nenhuma baixa manual registrada.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
