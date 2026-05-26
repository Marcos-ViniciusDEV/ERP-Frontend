import AdminSaasLayout from "./AdminSaasLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, CreditCard, KeyRound, MonitorSmartphone, TrendingUp, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { date, money, saasApi, useSaasData } from "./saasUtils";

export default function AdminSaasDashboard() {
  const { data, loading, error } = useSaasData<any>(saasApi.dashboard, []);

  const metrics = [
    { label: "Empresas", value: data?.totalEmpresas ?? 0, icon: Building2 },
    { label: "Ativas", value: data?.empresasAtivas ?? 0, icon: Users },
    { label: "Inadimplentes", value: data?.empresasInadimplentes ?? 0, icon: CreditCard },
    { label: "Receita mensal", value: money(data?.receitaMensal), icon: TrendingUp },
    { label: "PDVs ativos", value: data?.pdvsAtivos ?? 0, icon: MonitorSmartphone },
    { label: "Licenças", value: data?.licencasEmitidas ?? 0, icon: KeyRound },
  ];

  return (
    <AdminSaasLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-foreground">Painel Trakto</h1>
          <p className="text-muted-foreground">Visão geral das empresas, assinaturas, PDVs e licenças.</p>
        </div>

        {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.label} className="border-l-4 border-l-blue-600">
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className="mt-1 text-2xl font-bold">{loading ? "..." : metric.value}</p>
                  </div>
                  <Icon className="h-8 w-8 text-blue-600" />
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Crescimento dos Últimos 6 Meses</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.crescimentoPorMes ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Plano</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data?.distribuicaoPlanos ?? []} dataKey="total" nameKey="nome" outerRadius={90} label>
                    {(data?.distribuicaoPlanos ?? []).map((_: any, index: number) => (
                      <Cell key={index} fill={["#2563eb", "#16a34a", "#f59e0b", "#dc2626"][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Últimas Empresas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {(data?.ultimasEmpresas ?? []).map((empresa: any) => (
                <div key={empresa.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{empresa.nomeFantasia || empresa.razaoSocial}</p>
                    <p className="text-sm text-muted-foreground">{empresa.cnpj}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={empresa.bloqueado ? "destructive" : "secondary"}>{empresa.bloqueado ? "Bloqueada" : "Ativa"}</Badge>
                    <span className="text-sm text-muted-foreground">{date(empresa.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminSaasLayout>
  );
}
