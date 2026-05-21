import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AlertCircle, PackageX, TrendingDown, DollarSign } from "lucide-react";

type StaleProduct = {
  id: number;
  codigo: string;
  descricao: string;
  estoque: number;
  precoVenda: number;
  valorParado: number;
  diasSemVenda: number;
  ultimaVenda: string | null;
};

export default function ProdutosSemVenda() {
  const [daysThreshold, setDaysThreshold] = useState("30");

  const { data: staleProducts, isLoading } = useQuery<StaleProduct[]>({
    queryKey: ["staleProducts", daysThreshold],
    queryFn: async () => {
      const { data } = await api.get(`/analytics/stale-products?daysThreshold=${daysThreshold}`);
      return data.data || [];
    }
  });

  const totalValorParado = staleProducts?.reduce((acc, curr) => acc + curr.valorParado, 0) || 0;
  const totalItens = staleProducts?.reduce((acc, curr) => acc + curr.estoque, 0) || 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent flex items-center gap-2">
              <PackageX className="h-8 w-8 text-rose-600" />
              Produtos Sem Venda (Encalhados)
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitore produtos com estoque que não tiveram saída recentemente.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border shadow-sm">
            <span className="text-sm font-medium px-2 text-slate-600">Período:</span>
            <Select value={daysThreshold} onValueChange={setDaysThreshold}>
              <SelectTrigger className="w-[180px] border-0 bg-slate-50">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">Últimos 15 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="60">Últimos 60 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="180">Últimos 6 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="overflow-hidden border-l-4 border-l-rose-500 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produtos Parados</span>
                <h3 className="text-3xl font-bold text-slate-800">{isLoading ? "..." : staleProducts?.length || 0}</h3>
                <p className="text-xs text-muted-foreground">Tipos de produtos diferentes</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertCircle className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Capital Retido</span>
                <h3 className="text-3xl font-bold text-slate-800">
                  {isLoading ? "..." : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValorParado / 100)}
                </h3>
                <p className="text-xs text-muted-foreground">Valor de venda parado em estoque</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <DollarSign className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-slate-500 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unidades no Estoque</span>
                <h3 className="text-3xl font-bold text-slate-800">{isLoading ? "..." : totalItens}</h3>
                <p className="text-xs text-muted-foreground">Itens físicos ocupando espaço</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <TrendingDown className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b pb-4">
            <CardTitle className="text-lg">Detalhamento dos Produtos</CardTitle>
            <CardDescription>
              Abaixo estão os produtos ordenados pelo maior impacto financeiro (Capital Retido). 
              Considere fazer promoções ou devoluções para girar este estoque.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Carregando dados...</div>
            ) : staleProducts && staleProducts.length > 0 ? (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-bold">Código</TableHead>
                    <TableHead className="font-bold">Descrição do Produto</TableHead>
                    <TableHead className="font-bold text-right">Estoque Físico</TableHead>
                    <TableHead className="font-bold text-right">Preço Venda</TableHead>
                    <TableHead className="font-bold text-right">Capital Parado</TableHead>
                    <TableHead className="font-bold text-center">Dias sem Venda</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staleProducts.map((p) => (
                    <TableRow key={p.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium text-slate-500">{p.codigo}</TableCell>
                      <TableCell className="font-semibold">{p.descricao}</TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-slate-100 text-xs font-bold">
                          {p.estoque} un
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {(p.precoVenda / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                      <TableCell className="text-right font-bold text-rose-600">
                        {(p.valorParado / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                      <TableCell className="text-center">
                        {p.diasSemVenda === -1 ? (
                          <span className="text-rose-500 font-semibold bg-rose-50 px-2 py-1 rounded">Nunca vendido</span>
                        ) : (
                          <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-1 rounded">{p.diasSemVenda} dias</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <PackageX className="h-12 w-12 text-emerald-200 mb-3" />
                <h3 className="text-lg font-semibold text-emerald-700">Ótima notícia!</h3>
                <p className="text-muted-foreground mt-1">
                  Não encontramos nenhum produto parado no período de {daysThreshold} dias. 
                  Seu estoque está girando bem!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
