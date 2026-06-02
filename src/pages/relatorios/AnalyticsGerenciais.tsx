import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart3,
  LineChart as LineChartIcon,
  PackageSearch,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const today = new Date();
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
const currentDay = today.toISOString().slice(0, 10);

const money = (value?: number | null) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((value ?? 0) / 100);

const number = (value?: number | null) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value ?? 0);

const percent = (value?: number | null) => `${number(value)}%`;

const riskTone: Record<string, string> = {
  CRITICO: "bg-red-100 text-red-800",
  ALTO: "bg-orange-100 text-orange-800",
  MEDIO: "bg-amber-100 text-amber-800",
  BAIXO: "bg-green-100 text-green-800",
  SEM_PREVISAO: "bg-slate-100 text-slate-700",
};

export default function AnalyticsGerenciais() {
  const [filters, setFilters] = useState({
    startDate: firstDay,
    endDate: currentDay,
    marginThreshold: 15,
    days: 30,
    leadTimeDays: 7,
  });

  const queryParams = useMemo(() => ({
    startDate: filters.startDate,
    endDate: filters.endDate,
    marginThreshold: filters.marginThreshold,
    days: filters.days,
    leadTimeDays: filters.leadTimeDays,
  }), [filters]);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["analytics-management", queryParams],
    queryFn: async () => (await api.get("/analytics/management", { params: queryParams })).data.data,
  });

  const dre = data?.dre;
  const profitSeries = data?.profitPeriod?.series ?? [];
  const lowMarginProducts = data?.lowMarginProducts ?? [];
  const productMargins = data?.productMargins ?? [];
  const operatorsRisk = data?.operatorsRisk ?? [];
  const customerRanking = data?.customerRanking;
  const stockForecast = data?.stockRuptureForecast ?? [];
  const flaggedOperators = operatorsRisk.filter((item: any) => item.alertas?.length > 0).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Relatorios</p>
            <h1 className="text-3xl font-bold text-slate-950">Analytics Gerenciais</h1>
            <p className="mt-1 text-sm text-slate-500">
              DRE, margem real, lucro, operadores, clientes e risco de ruptura em uma visao gerencial.
            </p>
          </div>
          <Button onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        <Card>
          <CardContent className="grid gap-4 p-4 md:grid-cols-5">
            <div>
              <Label>Inicio</Label>
              <Input type="date" value={filters.startDate} onChange={(event) => setFilters({ ...filters, startDate: event.target.value })} />
            </div>
            <div>
              <Label>Fim</Label>
              <Input type="date" value={filters.endDate} onChange={(event) => setFilters({ ...filters, endDate: event.target.value })} />
            </div>
            <div>
              <Label>Margem minima (%)</Label>
              <Input type="number" value={filters.marginThreshold} onChange={(event) => setFilters({ ...filters, marginThreshold: Number(event.target.value) })} />
            </div>
            <div>
              <Label>Media venda (dias)</Label>
              <Input type="number" value={filters.days} onChange={(event) => setFilters({ ...filters, days: Number(event.target.value) })} />
            </div>
            <div>
              <Label>Lead time (dias)</Label>
              <Input type="number" value={filters.leadTimeDays} onChange={(event) => setFilters({ ...filters, leadTimeDays: Number(event.target.value) })} />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-sm text-slate-500">Carregando analytics gerenciais...</CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard title="Receita liquida" value={money(dre?.receitaLiquida)} icon={TrendingUp} tone="text-blue-600" />
              <MetricCard title="Lucro bruto" value={money(dre?.lucroBruto)} icon={BarChart3} tone="text-green-600" />
              <MetricCard title="Resultado operacional" value={money(dre?.resultadoOperacional)} icon={LineChartIcon} tone={(dre?.resultadoOperacional ?? 0) >= 0 ? "text-green-600" : "text-red-600"} />
              <MetricCard title="Margem liquida" value={percent(dre?.margemLiquidaPercentual)} icon={TrendingDown} tone="text-amber-600" />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>DRE simples</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(dre?.linhas ?? []).map((line: any) => (
                      <div key={line.label} className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${line.type === "result" ? "bg-blue-50 font-semibold" : "bg-slate-50"}`}>
                        <span>{line.label}</span>
                        <span>{money(line.value)}</span>
                      </div>
                    ))}
                  </div>
                  {!dre?.despesasConfiguradas && (
                    <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      Nenhuma despesa operacional paga foi encontrada no periodo. A DRE pode estar incompleta.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Lucro por periodo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={profitSeries}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="periodo" />
                        <YAxis tickFormatter={(value) => money(Number(value)).replace("R$", "")} />
                        <Tooltip formatter={(value: number) => money(value)} />
                        <Line type="monotone" dataKey="receitaLiquida" stroke="#2563eb" name="Receita" />
                        <Line type="monotone" dataKey="custoTotal" stroke="#f97316" name="Custo" />
                        <Line type="monotone" dataKey="lucroBruto" stroke="#16a34a" name="Lucro" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {data?.profitPeriod?.periodoAnterior && (
                    <div className="mt-3 rounded-md border bg-slate-50 p-3 text-sm text-slate-700">
                      Lucro do periodo anterior: {money(data.profitPeriod.periodoAnterior.lucroBruto)}.
                      Variacao: {data.profitPeriod.periodoAnterior.variacaoLucroPercentual === null ? "sem base anterior" : percent(data.profitPeriod.periodoAnterior.variacaoLucroPercentual)}.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <DataTable
                title="Margem real por produto"
                icon={PackageSearch}
                columns={["Produto", "Qtd. liquida", "Devolvido", "Receita liquida", "Custo liquido", "Margem"]}
                rows={productMargins.map((item: any) => [
                  item.nome,
                  number(item.quantidadeLiquida),
                  money(item.receitaDevolvida),
                  money(item.receitaLiquidaAposDevolucoes),
                  money(item.custoLiquido),
                  <Badge key="margin" className={item.margemPercentual < 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>{percent(item.margemPercentual)}</Badge>,
                ])}
                empty="Nenhum produto vendido no periodo."
              />

              <DataTable
                title="Produtos com margem ruim"
                icon={AlertTriangle}
                columns={["Produto", "Margem", "Meta", "Perda estimada", "Preco sugerido"]}
                rows={lowMarginProducts.map((item: any) => [
                  item.nome,
                  <Badge key="bad" className="bg-red-100 text-red-800">{percent(item.margemPercentual)}</Badge>,
                  percent(item.margemMinimaEsperada),
                  money(item.perdaEstimadaLucro),
                  item.precoVendaSugerido === null ? "-" : money(item.precoVendaSugerido),
                ])}
                empty="Nenhum produto abaixo da margem configurada."
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Operadores com cancelamentos e descontos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={operatorsRisk}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="operadorNome" />
                        <YAxis />
                        <Tooltip formatter={(value: number, name) => name === "totalDescontos" || name === "valorCancelado" ? money(value) : number(value)} />
                        <Bar dataKey="totalCancelamentos" fill="#ef4444" name="Cancelamentos" />
                        <Bar dataKey="totalDescontos" fill="#f59e0b" name="Descontos" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 rounded-md border bg-slate-50 p-3 text-sm text-slate-700">
                    {flaggedOperators} operador(es) acima da media de cancelamentos ou descontos no periodo.
                  </div>
                </CardContent>
              </Card>

              <DataTable
                title="Ranking de clientes"
                icon={Users}
                columns={["Cliente", "Compras", "Total", "Ticket medio", "Margem"]}
                rows={(customerRanking?.items ?? []).map((item: any) => [
                  item.nome,
                  number(item.quantidadeCompras),
                  money(item.totalComprado),
                  money(item.ticketMedio),
                  money(item.margemGerada),
                ])}
                empty="Nenhuma venda encontrada no periodo."
                note={customerRanking ? `${number(customerRanking.clientesComCompra)} clientes compraram no periodo. ${number(customerRanking.clientesNovos)} novos e ${number(customerRanking.clientesInativos)} inativos.` : undefined}
              />
            </div>

            <DataTable
              title="Previsao de ruptura de estoque"
              icon={PackageSearch}
              columns={["Produto", "Estoque", "Media/dia", "Dias", "Risco", "Reposicao"]}
              rows={stockForecast.slice(0, 25).map((item: any) => [
                item.nome,
                number(item.estoqueAtual),
                number(item.mediaVendaDiaria),
                item.diasAteRuptura === null ? "-" : number(item.diasAteRuptura),
                <Badge key="risk" className={riskTone[item.risco] ?? riskTone.SEM_PREVISAO}>{item.risco.replace(/_/g, " ")}</Badge>,
                number(item.pontoReposicaoSugerido),
              ])}
              empty="Nenhum produto com controle de estoque encontrado."
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function MetricCard({ title, value, icon: Icon, tone }: { title: string; value: string; icon: any; tone: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
        </div>
        <Icon className={`h-8 w-8 ${tone}`} />
      </CardContent>
    </Card>
  );
}

function DataTable({
  title,
  icon: Icon,
  columns,
  rows,
  empty,
  note,
}: {
  title: string;
  icon: any;
  columns: string[];
  rows: any[][];
  empty: string;
  note?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-blue-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {note && <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{note}</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-500">
              <tr>
                {columns.map((column) => <th key={column} className="px-3 py-2 font-medium">{column}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.length === 0 ? (
                <tr><td colSpan={columns.length} className="px-3 py-6 text-center text-slate-500">{empty}</td></tr>
              ) : rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-slate-50">
                  {row.map((cell, cellIndex) => <td key={cellIndex} className="px-3 py-2">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
