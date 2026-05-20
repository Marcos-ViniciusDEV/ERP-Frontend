/**
 * Producao.tsx — Página Unificada de Produção
 *
 * 4 Abas:
 * - Insumos: CRUD de materiais/ingredientes
 * - Receitas: Ficha técnica (montar receita para cada produto)
 * - Lançar Produção: Selecionar produto, qtd, preview de custo, confirmar
 * - Histórico: Lista de produções realizadas
 */

import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  FlaskConical,
  Play,
  History,
  Plus,
  Trash2,
  Pencil,
  AlertTriangle,
  CheckCircle2,
  ChefHat,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface Material {
  id: number;
  nome: string;
  unidade: string;
  estoque: number;
  custoUnitario: number;
  ativo: boolean;
}

interface Product {
  id: number;
  descricao: string;
  codigo: string;
  precoVenda: number;
  precoCusto: number;
}

interface RecipeItem {
  id: number;
  produtoId: number;
  materialId: number;
  quantidade: number;
  materialNome: string;
  materialUnidade: string;
  custoUnitario: number;
  estoqueDisponivel: number;
}

interface PreviewIngredient {
  materialNome: string;
  materialUnidade: string;
  consumoTotal: number;
  custoUnitario: number;
  custoTotal: number;
  estoqueDisponivel: number;
  estoqueInsuficiente: boolean;
}

interface ProductionPreview {
  ingredientes: PreviewIngredient[];
  custoTotalProducao: number;
  custoPorUnidade: number;
  temEstoqueSuficiente: boolean;
  margemSugerida30: number;
  margemSugerida50: number;
}

interface ProductionRecord {
  id: number;
  produtoId: number;
  produtoDescricao: string;
  quantidade: number;
  dataProducao: string;
  observacao: string | null;
  createdAt: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

const fmt = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ─── Component ──────────────────────────────────────────────────────────────────

export default function Producao() {
  const [activeTab, setActiveTab] = useState("insumos");

  // Shared data
  const [materials, setMaterials] = useState<Material[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);

  // Insumos tab
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [materialForm, setMaterialForm] = useState({ nome: "", unidade: "kg", custoUnitario: "", estoque: "" });

  // Receitas tab
  const [selectedProduct, setSelectedProduct] = useState("");
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [recipeForm, setRecipeForm] = useState({ materialId: "", quantidade: "" });

  // Produção tab
  const [prodProduct, setProdProduct] = useState("");
  const [prodQuantity, setProdQuantity] = useState("1");
  const [prodObservation, setProdObservation] = useState("");
  const [preview, setPreview] = useState<ProductionPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submittingProduction, setSubmittingProduction] = useState(false);

  // Histórico tab
  const [history, setHistory] = useState<ProductionRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ─── Data Loading ───────────────────────────────────────────────────────────

  const loadMaterials = async () => {
    try {
      setLoadingMaterials(true);
      const res = await api.get("/materials");
      setMaterials(res.data);
    } catch {
      toast.error("Erro ao carregar insumos");
    } finally {
      setLoadingMaterials(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await api.get("/produtos");
      setProducts(res.data);
    } catch {
      toast.error("Erro ao carregar produtos");
    }
  };

  const loadRecipes = async (productId: number) => {
    try {
      const res = await api.get(`/recipes/product/${productId}`);
      setRecipes(res.data);
    } catch {
      toast.error("Erro ao carregar receita");
    }
  };

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get("/production");
      setHistory(res.data);
    } catch {
      toast.error("Erro ao carregar histórico");
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadPreview = async (produtoId: number, quantidade: number) => {
    try {
      setLoadingPreview(true);
      const res = await api.get(`/production/preview/${produtoId}?quantidade=${quantidade}`);
      setPreview(res.data);
    } catch (err: any) {
      setPreview(null);
      if (err.response?.data?.error) {
        toast.error(err.response.data.error);
      }
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    loadMaterials();
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      loadRecipes(parseInt(selectedProduct));
    } else {
      setRecipes([]);
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (activeTab === "historico") {
      loadHistory();
    }
  }, [activeTab]);

  useEffect(() => {
    if (prodProduct && parseInt(prodQuantity) > 0) {
      const timeout = setTimeout(() => {
        loadPreview(parseInt(prodProduct), parseInt(prodQuantity));
      }, 300);
      return () => clearTimeout(timeout);
    } else {
      setPreview(null);
    }
  }, [prodProduct, prodQuantity]);

  // Recipe cost total
  const recipeCostTotal = useMemo(() => {
    return recipes.reduce((sum, r) => sum + Math.round(r.custoUnitario * r.quantidade), 0);
  }, [recipes]);

  // ─── Insumos Handlers ───────────────────────────────────────────────────────

  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialForm.nome || !materialForm.custoUnitario) {
      toast.warning("Preencha nome e custo unitário");
      return;
    }

    try {
      const payload = {
        nome: materialForm.nome,
        unidade: materialForm.unidade,
        custoUnitario: Math.round(parseFloat(materialForm.custoUnitario.replace(",", ".")) * 100),
        estoque: parseFloat(materialForm.estoque.replace(",", ".")) || 0,
        ativo: true,
      };

      if (editingMaterial) {
        await api.put(`/materials/${editingMaterial.id}`, payload);
        toast.success("Insumo atualizado!");
      } else {
        await api.post("/materials", payload);
        toast.success("Insumo cadastrado!");
      }

      setMaterialDialogOpen(false);
      setEditingMaterial(null);
      setMaterialForm({ nome: "", unidade: "kg", custoUnitario: "", estoque: "" });
      loadMaterials();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erro ao salvar insumo");
    }
  };

  const handleDeleteMaterial = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este insumo?")) return;
    try {
      await api.delete(`/materials/${id}`);
      toast.success("Insumo excluído");
      setMaterials(materials.filter(m => m.id !== id));
    } catch {
      toast.error("Erro ao excluir insumo");
    }
  };

  const openEditMaterial = (m: Material) => {
    setEditingMaterial(m);
    setMaterialForm({
      nome: m.nome,
      unidade: m.unidade,
      custoUnitario: (m.custoUnitario / 100).toFixed(2),
      estoque: m.estoque.toString(),
    });
    setMaterialDialogOpen(true);
  };

  // ─── Receitas Handlers ──────────────────────────────────────────────────────

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !recipeForm.materialId || !recipeForm.quantidade) {
      toast.warning("Preencha todos os campos");
      return;
    }

    try {
      await api.post("/recipes", {
        produtoId: parseInt(selectedProduct),
        materialId: parseInt(recipeForm.materialId),
        quantidade: parseFloat(recipeForm.quantidade.replace(",", ".")),
      });
      toast.success("Ingrediente adicionado!");
      loadRecipes(parseInt(selectedProduct));
      setRecipeForm({ materialId: "", quantidade: "" });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erro ao adicionar ingrediente");
    }
  };

  const handleRemoveIngredient = async (id: number) => {
    try {
      await api.delete(`/recipes/${id}`);
      toast.success("Ingrediente removido");
      setRecipes(recipes.filter(r => r.id !== id));
    } catch {
      toast.error("Erro ao remover ingrediente");
    }
  };

  // ─── Produção Handler ───────────────────────────────────────────────────────

  const handleProduction = async () => {
    if (!prodProduct || !prodQuantity || parseInt(prodQuantity) <= 0) {
      toast.warning("Selecione o produto e a quantidade");
      return;
    }

    if (!preview?.temEstoqueSuficiente) {
      toast.error("Estoque insuficiente de um ou mais insumos!");
      return;
    }

    try {
      setSubmittingProduction(true);
      const res = await api.post("/production", {
        produtoId: parseInt(prodProduct),
        quantidade: parseInt(prodQuantity),
        observacao: prodObservation || undefined,
      });

      toast.success(
        `Produção registrada! ${res.data.quantidade}x ${res.data.produtoDescricao}. Custo total: ${fmt(res.data.custoTotal)}`
      );

      setProdProduct("");
      setProdQuantity("1");
      setProdObservation("");
      setPreview(null);
      loadMaterials(); // Refresh stock
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erro ao registrar produção");
    } finally {
      setSubmittingProduction(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-5rem)] flex-col rounded-md border bg-background p-2">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start bg-white border-b rounded-none px-0 h-auto">
          <TabsTrigger value="insumos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 px-6 py-3 font-bold gap-2">
            <Package className="h-4 w-4" /> Insumos
          </TabsTrigger>
          <TabsTrigger value="receitas" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 px-6 py-3 font-bold gap-2">
            <FlaskConical className="h-4 w-4" /> Receitas
          </TabsTrigger>
          <TabsTrigger value="producao" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 px-6 py-3 font-bold gap-2">
            <Play className="h-4 w-4" /> Lançar Produção
          </TabsTrigger>
          <TabsTrigger value="historico" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 px-6 py-3 font-bold gap-2">
            <History className="h-4 w-4" /> Histórico
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════════════
            TAB 1 — INSUMOS
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="insumos" className="mt-0 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-slate-800">Gestão de Insumos</h2>
              <p className="text-xs text-slate-500">Cadastre os ingredientes e materiais usados na produção.</p>
            </div>
            <Button
              onClick={() => {
                setEditingMaterial(null);
                setMaterialForm({ nome: "", unidade: "kg", custoUnitario: "", estoque: "" });
                setMaterialDialogOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold gap-2"
            >
              <Plus className="h-4 w-4" /> Novo Insumo
            </Button>
          </div>

          <Card className="rounded-2xl border-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="font-bold text-xs uppercase text-slate-500">Nome</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-500">Unidade</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-500 text-right">Estoque</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-500 text-right">Custo Unit.</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-500 w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingMaterials ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-400">Carregando...</TableCell></TableRow>
                  ) : materials.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-400">Nenhum insumo cadastrado. Clique em "Novo Insumo" para começar.</TableCell></TableRow>
                  ) : (
                    materials.map(m => (
                      <TableRow key={m.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-bold">{m.nome}</TableCell>
                        <TableCell className="uppercase text-slate-500">{m.unidade}</TableCell>
                        <TableCell className="text-right font-mono font-bold">{m.estoque}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(m.custoUnitario)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditMaterial(m)}>
                              <Pencil className="h-4 w-4 text-slate-500" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteMaterial(m.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Dialog de Material */}
          <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
            <DialogContent className="!max-w-xl rounded-3xl overflow-hidden border-0 shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-white p-0">
              <div className="bg-blue-600 px-6 py-5 text-white">
                <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-200" />
                  {editingMaterial ? "Editar Insumo" : "Novo Insumo"}
                </DialogTitle>
                <p className="text-white/80 text-xs mt-1">Preencha os dados do material/ingrediente.</p>
              </div>

              <form onSubmit={handleMaterialSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome *</Label>
                    <Input
                      value={materialForm.nome}
                      onChange={e => setMaterialForm({ ...materialForm, nome: e.target.value })}
                      className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-bold"
                      placeholder="Ex: Farinha de Trigo"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unidade</Label>
                    <select
                      value={materialForm.unidade}
                      onChange={e => setMaterialForm({ ...materialForm, unidade: e.target.value })}
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="kg">KG</option>
                      <option value="g">Gramas</option>
                      <option value="l">Litros</option>
                      <option value="ml">ML</option>
                      <option value="un">Unidade</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estoque Inicial</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={materialForm.estoque}
                      onChange={e => setMaterialForm({ ...materialForm, estoque: e.target.value })}
                      className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-bold font-mono"
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Custo Unitário (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={materialForm.custoUnitario}
                      onChange={e => setMaterialForm({ ...materialForm, custoUnitario: e.target.value })}
                      className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-bold font-mono"
                      placeholder="0,00"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button type="button" variant="outline" onClick={() => setMaterialDialogOpen(false)} className="h-11 px-5 font-bold rounded-xl">
                    Cancelar
                  </Button>
                  <Button type="submit" className="h-11 px-6 font-black rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/10">
                    Salvar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════════
            TAB 2 — RECEITAS
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="receitas" className="mt-0 p-4">
          <div className="mb-4">
            <h2 className="text-lg font-black text-slate-800">Ficha Técnica (Receitas)</h2>
            <p className="text-xs text-slate-500">Monte a lista de ingredientes para cada produto que você fabrica.</p>
          </div>

          <Card className="rounded-2xl border-0 shadow-sm mb-4">
            <CardContent className="p-4">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Selecione o Produto Final</Label>
              <select
                value={selectedProduct}
                onChange={e => setSelectedProduct(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 mt-1"
              >
                <option value="">Selecione um produto...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.descricao}</option>
                ))}
              </select>
            </CardContent>
          </Card>

          {selectedProduct && (
            <>
              {/* Form to add ingredient */}
              <Card className="rounded-2xl border-0 shadow-sm mb-4">
                <CardContent className="p-4">
                  <h3 className="text-sm font-black text-slate-700 mb-3 flex items-center gap-2">
                    <Plus className="h-4 w-4 text-blue-600" /> Adicionar Ingrediente
                  </h3>
                  <form onSubmit={handleAddIngredient} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Material</Label>
                      <select
                        value={recipeForm.materialId}
                        onChange={e => setRecipeForm({ ...recipeForm, materialId: e.target.value })}
                        className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="">Selecione...</option>
                        {materials.map(m => (
                          <option key={m.id} value={m.id}>{m.nome} ({m.unidade})</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-4">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantidade (por unidade)</Label>
                      <Input
                        type="number"
                        step="0.001"
                        value={recipeForm.quantidade}
                        onChange={e => setRecipeForm({ ...recipeForm, quantidade: e.target.value })}
                        className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-bold font-mono"
                        placeholder="0.000"
                      />
                    </div>
                    <div className="col-span-3">
                      <Button type="submit" className="h-11 w-full bg-green-600 hover:bg-green-700 rounded-xl font-bold text-white">
                        Adicionar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Recipe table */}
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80">
                        <TableHead className="font-bold text-xs uppercase text-slate-500">Ingrediente</TableHead>
                        <TableHead className="font-bold text-xs uppercase text-slate-500 text-right">Quantidade</TableHead>
                        <TableHead className="font-bold text-xs uppercase text-slate-500">Unidade</TableHead>
                        <TableHead className="font-bold text-xs uppercase text-slate-500 text-right">Custo Unit.</TableHead>
                        <TableHead className="font-bold text-xs uppercase text-slate-500 text-right">Custo Total</TableHead>
                        <TableHead className="font-bold text-xs uppercase text-slate-500 w-16">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recipes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                            Nenhum ingrediente cadastrado para este produto.
                          </TableCell>
                        </TableRow>
                      ) : (
                        <>
                          {recipes.map(r => (
                            <TableRow key={r.id} className="hover:bg-slate-50/50">
                              <TableCell className="font-bold">{r.materialNome}</TableCell>
                              <TableCell className="text-right font-mono font-bold">{r.quantidade}</TableCell>
                              <TableCell className="uppercase text-slate-500">{r.materialUnidade}</TableCell>
                              <TableCell className="text-right font-mono">{fmt(r.custoUnitario)}</TableCell>
                              <TableCell className="text-right font-mono font-bold">{fmt(Math.round(r.custoUnitario * r.quantidade))}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveIngredient(r.id)}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {/* Total row */}
                          <TableRow className="bg-blue-50/80 border-t-2 border-blue-200">
                            <TableCell colSpan={4} className="font-black text-blue-700 text-right">CUSTO TOTAL POR UNIDADE:</TableCell>
                            <TableCell className="text-right font-mono font-black text-blue-700 text-lg">{fmt(recipeCostTotal)}</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════════
            TAB 3 — LANÇAR PRODUÇÃO
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="producao" className="mt-0 p-4">
          <div className="mb-4">
            <h2 className="text-lg font-black text-slate-800">Lançar Produção</h2>
            <p className="text-xs text-slate-500">Selecione o produto, a quantidade e confirme para baixar insumos e dar entrada no estoque.</p>
          </div>

          <div className="grid grid-cols-12 gap-4">
            {/* Left: Form */}
            <div className="col-span-5">
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardContent className="p-5 space-y-4">
                  <div>
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Produto a Produzir</Label>
                    <select
                      value={prodProduct}
                      onChange={e => setProdProduct(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 mt-1"
                    >
                      <option value="">Selecione um produto...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.descricao}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantidade</Label>
                    <Input
                      type="number"
                      min="1"
                      value={prodQuantity}
                      onChange={e => setProdQuantity(e.target.value)}
                      className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white font-bold font-mono mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Observação (Opcional)</Label>
                    <textarea
                      value={prodObservation}
                      onChange={e => setProdObservation(e.target.value)}
                      className="flex w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 mt-1"
                      rows={3}
                      placeholder="Ex: Lote 001, Turno manhã..."
                    />
                  </div>

                  <Button
                    onClick={handleProduction}
                    disabled={!preview?.temEstoqueSuficiente || submittingProduction || !prodProduct}
                    className="w-full h-12 bg-green-600 hover:bg-green-700 rounded-xl font-black text-white text-base shadow-lg shadow-green-600/20 gap-2 disabled:opacity-50"
                  >
                    <ChefHat className="h-5 w-5" />
                    {submittingProduction ? "Registrando..." : "Confirmar Produção"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right: Preview */}
            <div className="col-span-7">
              {!prodProduct ? (
                <Card className="rounded-2xl border-0 shadow-sm">
                  <CardContent className="p-12 text-center text-slate-400">
                    <ChefHat className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-bold">Selecione um produto para ver a prévia</p>
                    <p className="text-xs mt-1">Aqui você verá os insumos que serão consumidos e o custo total.</p>
                  </CardContent>
                </Card>
              ) : loadingPreview ? (
                <Card className="rounded-2xl border-0 shadow-sm">
                  <CardContent className="p-12 text-center text-slate-400">Calculando...</CardContent>
                </Card>
              ) : preview ? (
                <Card className="rounded-2xl border-0 shadow-sm">
                  <CardContent className="p-0">
                    {/* Status banner */}
                    <div className={`px-4 py-3 rounded-t-2xl flex items-center gap-2 text-sm font-bold ${preview.temEstoqueSuficiente ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                      {preview.temEstoqueSuficiente ? (
                        <><CheckCircle2 className="h-4 w-4" /> Estoque suficiente para produção</>
                      ) : (
                        <><AlertTriangle className="h-4 w-4" /> Estoque insuficiente — veja os itens em vermelho</>
                      )}
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/80">
                          <TableHead className="font-bold text-xs uppercase text-slate-500">Insumo</TableHead>
                          <TableHead className="font-bold text-xs uppercase text-slate-500 text-right">Consumo</TableHead>
                          <TableHead className="font-bold text-xs uppercase text-slate-500 text-right">Estoque</TableHead>
                          <TableHead className="font-bold text-xs uppercase text-slate-500 text-right">Custo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preview.ingredientes.map((ing, i) => (
                          <TableRow key={i} className={ing.estoqueInsuficiente ? "bg-red-50/50" : ""}>
                            <TableCell className="font-bold">{ing.materialNome}</TableCell>
                            <TableCell className="text-right font-mono font-bold">{ing.consumoTotal} {ing.materialUnidade}</TableCell>
                            <TableCell className={`text-right font-mono ${ing.estoqueInsuficiente ? "text-red-600 font-bold" : "text-slate-500"}`}>
                              {ing.estoqueDisponivel} {ing.materialUnidade}
                            </TableCell>
                            <TableCell className="text-right font-mono">{fmt(ing.custoTotal)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Cost summary */}
                    <div className="p-4 bg-slate-50 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-bold">Custo Total da Produção:</span>
                        <span className="font-mono font-black text-slate-800 text-lg">{fmt(preview.custoTotalProducao)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-bold">Custo por Unidade:</span>
                        <span className="font-mono font-bold text-blue-700">{fmt(preview.custoPorUnidade)}</span>
                      </div>
                      <div className="border-t pt-2 mt-2 flex justify-between text-xs text-slate-400">
                        <span>Preço sugerido (30% margem): <strong className="text-green-600">{fmt(preview.margemSugerida30)}</strong></span>
                        <span>Preço sugerido (50% margem): <strong className="text-green-600">{fmt(preview.margemSugerida50)}</strong></span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="rounded-2xl border-0 shadow-sm">
                  <CardContent className="p-12 text-center text-slate-400">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-bold">Este produto não tem receita cadastrada</p>
                    <p className="text-xs mt-1">Vá na aba "Receitas" e monte a ficha técnica primeiro.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════════
            TAB 4 — HISTÓRICO
        ═══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="historico" className="mt-0 p-4">
          <div className="mb-4">
            <h2 className="text-lg font-black text-slate-800">Histórico de Produções</h2>
            <p className="text-xs text-slate-500">Todas as produções registradas no sistema.</p>
          </div>

          <Card className="rounded-2xl border-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="font-bold text-xs uppercase text-slate-500">Data</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-500">Produto</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-500 text-right">Quantidade</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-500">Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingHistory ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-12 text-slate-400">Carregando...</TableCell></TableRow>
                  ) : history.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-12 text-slate-400">Nenhuma produção registrada ainda.</TableCell></TableRow>
                  ) : (
                    history.map(h => (
                      <TableRow key={h.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-mono text-sm">
                          {new Date(h.dataProducao).toLocaleDateString("pt-BR")} {new Date(h.dataProducao).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </TableCell>
                        <TableCell className="font-bold">{h.produtoDescricao}</TableCell>
                        <TableCell className="text-right font-mono font-bold">{h.quantidade}</TableCell>
                        <TableCell className="text-slate-500 text-sm">{h.observacao || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
}
