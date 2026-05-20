import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Boxes, Factory, PackageCheck, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { Produto } from "@/shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Material {
  id: number;
  nome: string;
  unidade: string;
  estoque: number;
  custoUnitario: number;
  ativo: boolean;
}

interface ProductionRecord {
  id: number;
  produtoId: number;
}

interface ProdutosEstoqueTabProps {
  produtos: Produto[] | undefined;
  isLoadingProdutos: boolean;
}

const formatCurrency = (value: number) =>
  (value / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatNumber = (value: number | null | undefined) =>
  Number(value || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });

export function ProdutosEstoqueTab({ produtos, isLoadingProdutos }: ProdutosEstoqueTabProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: materiais, isLoading: isLoadingMateriais } = useQuery<Material[]>({
    queryKey: ["materials"],
    queryFn: async () => {
      const { data } = await api.get("/materials");
      return data;
    },
  });

  const { data: producoes, isLoading: isLoadingProducoes } = useQuery<ProductionRecord[]>({
    queryKey: ["production"],
    queryFn: async () => {
      const { data } = await api.get("/production");
      return data;
    },
  });

  const produtosProduzidos = useMemo(() => {
    const producedProductIds = new Set((producoes || []).map((producao) => producao.produtoId));
    return (produtos || []).filter((produto) => producedProductIds.has(produto.id));
  }, [producoes, produtos]);

  const materiaisFiltrados = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return materiais || [];

    return (materiais || []).filter((material) =>
      [material.nome, material.unidade].some((field) => field?.toLowerCase().includes(term))
    );
  }, [materiais, searchTerm]);

  const produtosFiltrados = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return produtosProduzidos;

    return produtosProduzidos.filter((produto) =>
      [produto.codigo, produto.codigoBarras, produto.descricao, produto.marca]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term))
    );
  }, [produtosProduzidos, searchTerm]);

  const totalMateriaPrima = useMemo(
    () => (materiais || []).reduce((total, material) => total + Number(material.estoque || 0), 0),
    [materiais]
  );

  const totalProdutosFinalizados = useMemo(
    () => produtosProduzidos.reduce((total, produto) => total + Number(produto.estoque || 0), 0),
    [produtosProduzidos]
  );

  const totalProdutosBaixos = useMemo(
    () =>
      produtosProduzidos.filter(
        (produto) => Number(produto.estoque || 0) <= Number(produto.estoqueMinimo || 0)
      ).length,
    [produtosProduzidos]
  );

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-md border bg-background p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Estoque Matéria Prima</span>
            <Boxes className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 font-mono text-xl font-bold">{formatNumber(totalMateriaPrima)}</p>
        </div>
        <div className="rounded-md border bg-background p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Produtos Finalizados</span>
            <PackageCheck className="h-4 w-4 text-green-600" />
          </div>
          <p className="mt-2 font-mono text-xl font-bold">{formatNumber(totalProdutosFinalizados)}</p>
        </div>
        <div className="rounded-md border bg-background p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Abaixo do Mínimo</span>
            <Factory className="h-4 w-4 text-orange-600" />
          </div>
          <p className="mt-2 font-mono text-xl font-bold">{totalProdutosBaixos}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-md border bg-background px-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Buscar matéria prima ou produto finalizado..."
          className="border-none text-sm shadow-none focus-visible:ring-0"
        />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
        <div className="flex min-h-0 flex-col rounded-md border">
          <div className="border-b bg-muted/30 px-3 py-2">
            <h3 className="text-sm font-semibold">Estoque Matéria Prima</h3>
            <p className="text-xs text-muted-foreground">Insumos e ingredientes cadastrados na produção.</p>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow className="text-xs">
                  <TableHead className="min-w-[180px] py-2">Descrição</TableHead>
                  <TableHead className="w-[80px] py-2">Unidade</TableHead>
                  <TableHead className="w-[90px] py-2 text-right">Estoque</TableHead>
                  <TableHead className="w-[110px] py-2 text-right">Custo Unit.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingMateriais ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : materiaisFiltrados.length > 0 ? (
                  materiaisFiltrados.map((material) => (
                    <TableRow key={material.id} className="h-9 text-sm">
                      <TableCell className="py-1 font-medium">{material.nome}</TableCell>
                      <TableCell className="py-1 uppercase">{material.unidade}</TableCell>
                      <TableCell className="py-1 text-right font-mono font-bold">
                        {formatNumber(material.estoque)}
                      </TableCell>
                      <TableCell className="py-1 text-right font-mono">
                        {formatCurrency(material.custoUnitario)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                      Nenhuma matéria prima encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex min-h-0 flex-col rounded-md border">
          <div className="border-b bg-muted/30 px-3 py-2">
            <h3 className="text-sm font-semibold">Estoque Produto Finalizado</h3>
            <p className="text-xs text-muted-foreground">Produtos produzidos e disponíveis para venda.</p>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow className="text-xs">
                  <TableHead className="w-[90px] py-2">Código</TableHead>
                  <TableHead className="min-w-[180px] py-2">Descrição</TableHead>
                  <TableHead className="w-[80px] py-2 text-right">Total</TableHead>
                  <TableHead className="w-[80px] py-2 text-right">Loja</TableHead>
                  <TableHead className="w-[90px] py-2 text-right">Depósito</TableHead>
                  <TableHead className="w-[80px] py-2 text-right">Troca</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingProdutos || isLoadingProducoes ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : produtosFiltrados.length > 0 ? (
                  produtosFiltrados.map((produto) => (
                    <TableRow key={produto.id} className="h-9 text-sm">
                      <TableCell className="py-1 font-mono text-xs">{produto.codigo}</TableCell>
                      <TableCell className="py-1 font-medium">{produto.descricao}</TableCell>
                      <TableCell className="py-1 text-right font-mono font-bold">
                        {formatNumber(produto.estoque)}
                      </TableCell>
                      <TableCell className="py-1 text-right font-mono">{formatNumber(produto.estoqueLoja)}</TableCell>
                      <TableCell className="py-1 text-right font-mono">
                        {formatNumber(produto.estoqueDeposito)}
                      </TableCell>
                      <TableCell className="py-1 text-right font-mono">{formatNumber(produto.estoqueTroca)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                      Nenhum produto finalizado encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
