import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, Search, Edit, Trash2, RefreshCw } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Produto } from "@/shared/schema";

// Define Departamento type locally if not available in schema yet
interface Departamento {
  id: number;
  nome: string;
}

export default function Produtos() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  
  const { data: produtos, isLoading } = useQuery<Produto[]>({
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
      resetForm();
    },
    onError: () => {
      toast.error("Erro ao atualizar produto");
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
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir produto");
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
    if (editingId) {
      updateProduto.mutate({ id: editingId, ...formData });
    } else {
      createProduto.mutate(formData);
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

  const calcularMargem = (precoVenda: number, precoCusto: number) => {
    if (precoCusto === 0) return 0;
    return ((precoVenda - precoCusto) / precoCusto) * 100;
  };

  const calcularLucro = (precoVenda: number, precoCusto: number) => {
    return precoVenda - precoCusto;
  };

  const produtosFiltrados = produtos?.filter((produto: any) => {
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
        {/* Área principal */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Cabeçalho compacto */}
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Cadastro de Produtos</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSearchOpen(!searchOpen)}>
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["produtos"] })}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Novo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingId ? "Editar Produto" : "Cadastrar Novo Produto"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-3">
                        <Label htmlFor="codigo">Código *</Label>
                        <Input
                          id="codigo"
                          value={formData.codigo}
                          onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-span-4">
                        <Label htmlFor="codigoBarras">Código de Barras</Label>
                        <Input
                          id="codigoBarras"
                          value={formData.codigoBarras}
                          onChange={(e) => setFormData({ ...formData, codigoBarras: e.target.value })}
                        />
                      </div>
                      <div className="col-span-5">
                        <Label htmlFor="descricao">Descrição *</Label>
                        <Input
                          id="descricao"
                          value={formData.descricao}
                          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-4">
                        <Label htmlFor="marca">Marca</Label>
                        <Input
                          id="marca"
                          value={formData.marca}
                          onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                        />
                      </div>
                      <div className="col-span-4">
                        <Label htmlFor="departamentoId">Departamento</Label>
                        <select
                          id="departamentoId"
                          value={formData.departamentoId}
                          onChange={(e) =>
                            setFormData({ ...formData, departamentoId: parseInt(e.target.value) })
                          }
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                        <Label htmlFor="unidade">Unidade</Label>
                        <Input
                          id="unidade"
                          value={formData.unidade}
                          onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="localizacao">Localização</Label>
                        <Input
                          id="localizacao"
                          value={formData.localizacao}
                          onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-4 border-t pt-4">
                      <div className="col-span-3">
                        <Label htmlFor="precoCusto">Preço Custo</Label>
                        <Input
                          id="precoCusto"
                          type="number"
                          step="0.01"
                          value={formData.precoCusto ? (formData.precoCusto / 100).toFixed(2) : ""}
                          onChange={(e) =>
                            setFormData({ ...formData, precoCusto: Math.round((parseFloat(e.target.value) || 0) * 100) })
                          }
                        />
                      </div>
                      <div className="col-span-3">
                        <Label htmlFor="margemLucro">Margem (%)</Label>
                        <Input
                          id="margemLucro"
                          type="number"
                          value={formData.margemLucro || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, margemLucro: parseInt(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div className="col-span-3">
                        <Label htmlFor="precoVenda">Preço Venda</Label>
                        <Input
                          id="precoVenda"
                          type="number"
                          step="0.01"
                          value={formData.precoVenda ? (formData.precoVenda / 100).toFixed(2) : ""}
                          onChange={(e) =>
                            setFormData({ ...formData, precoVenda: Math.round((parseFloat(e.target.value) || 0) * 100) })
                          }
                        />
                      </div>
                      <div className="col-span-3">
                        <Label htmlFor="estoque">Estoque Atual</Label>
                        <Input
                          id="estoque"
                          type="number"
                          value={formData.estoque || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, estoque: parseInt(e.target.value) || 0 })
                          }
                        />
                      </div>
                    </div>

                    <div className="flex gap-6 pt-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="ativo"
                          checked={formData.ativo}
                          onCheckedChange={(checked) => setFormData({ ...formData, ativo: !!checked })}
                        />
                        <Label htmlFor="ativo">Ativo</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="controlaEstoque"
                          checked={formData.controlaEstoque}
                          onCheckedChange={(checked) => setFormData({ ...formData, controlaEstoque: !!checked })}
                        />
                        <Label htmlFor="controlaEstoque">Controla Estoque</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="permiteDesconto"
                          checked={formData.permiteDesconto}
                          onCheckedChange={(checked) => setFormData({ ...formData, permiteDesconto: !!checked })}
                        />
                        <Label htmlFor="permiteDesconto">Permite Desconto</Label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">Salvar</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
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
          <Card className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground text-sm">Carregando...</div>
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
                      <TableHead className="w-[90px] text-right py-2">Ações</TableHead>
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
                        <TableCell className="text-right py-1">
                          <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleEdit(produto)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleDelete(produto.id)}
                            >
                              <Trash2 className="h-3 w-3 text-red-600" />
                            </Button>
                          </div>
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
          </Card>

          {/* Painel de detalhes inferior */}
          {selectedProduto && (
            <Card className="border-t border-border py-0">
              <CardContent className="p-0">
                <div className="grid grid-cols-12 bg-muted/30">
                  {/* Linha 1: Cabeçalho e Preços Principais */}
                  <div className="col-span-12 p-1 bg-muted/50 font-semibold text-xs flex justify-between items-center">
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

                  {/* Linha 3: Estoques Detalhados */}
                  <div className="col-span-2 p-1 border-r border-muted-foreground/10">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Est. Loja</p>
                    <p className="text-sm font-mono">{selectedProduto.estoqueLoja}</p>
                  </div>
                  <div className="col-span-2 p-1 border-r border-muted-foreground/10">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Est. Depósito</p>
                    <p className="text-sm font-mono">{selectedProduto.estoqueDeposito}</p>
                  </div>
                  <div className="col-span-2 p-1 border-r border-muted-foreground/10">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Est. Troca</p>
                    <p className="text-sm font-mono">{selectedProduto.estoqueTroca}</p>
                  </div>
                  <div className="col-span-2 p-1 border-r border-muted-foreground/10">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Est. Mínimo</p>
                    <p className="text-sm font-mono">{selectedProduto.estoqueMinimo}</p>
                  </div>
                  <div className="col-span-4 p-1 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${selectedProduto.ativo ? "bg-green-500" : "bg-red-500"}`} />
                      <span className="text-xs font-medium">{selectedProduto.ativo ? "Ativo" : "Inativo"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">Controla Est.</span>
                    </div>
                  </div>

                  {/* Linha 4: Datas e Outros */}
                  <div className="col-span-3 p-2">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Última Compra</p>
                    <p className="text-xs font-mono">
                      {selectedProduto.dataUltimaCompra ? new Date(selectedProduto.dataUltimaCompra).toLocaleDateString() : "-"}
                    </p>
                  </div>
                  <div className="col-span-2 p-2">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Qtd. Últ. Compra</p>
                    <p className="text-xs font-mono">{selectedProduto.quantidadeUltimaCompra}</p>
                  </div>
                  <div className="col-span-3 p-2">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Primeira Venda</p>
                    <p className="text-xs font-mono">
                      {selectedProduto.dataPrimeiraVenda ? new Date(selectedProduto.dataPrimeiraVenda).toLocaleDateString() : "-"}
                    </p>
                  </div>
                  <div className="col-span-4 p-2">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Localização</p>
                    <p className="text-xs font-mono truncate" title={selectedProduto.localizacao ?? undefined}>
                      {selectedProduto.localizacao || "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
