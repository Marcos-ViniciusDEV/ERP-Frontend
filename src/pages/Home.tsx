/**
 * @module Home
 * @description Página inicial do ERP com dashboard de métricas e gráficos
 *
 * Exibe visão geral do negócio com:
 * - **Cards de métricas**: Total de produtos, vendas hoje, contas a pagar/receber pendentes
 * - **Gráfico de vendas**: Vendas dos últimos 7 dias (gráfico de barras)
 * - **Gráfico de estoque**: Top 5 produtos com maior estoque (gráfico de linhas)
 * - **Fluxo de caixa**: Contas a pagar vs contas a receber (gráfico de barras)
 *
 * Utiliza React Query para buscar dados em tempo real e Recharts para visualizações.
 */

import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Package, ShoppingCart, CreditCard, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

export default function Home() {
  const { data: produtos } = useQuery({
    queryKey: ["produtos"],
    queryFn: async () => {
      const { data } = await api.get("/produtos");
      return data;
    },
  });
  const { data: vendas } = useQuery({
    queryKey: ["vendas"],
    queryFn: async () => {
      const { data } = await api.get("/vendas");
      return data;
    },
  });
  const { data: contasPagar } = useQuery({
    queryKey: ["contasPagar"],
    queryFn: async () => {
      const { data } = await api.get("/financeiro/pagar");
      return data;
    },
  });
  const { data: contasReceber } = useQuery({
    queryKey: ["contasReceber"],
    queryFn: async () => {
      const { data } = await api.get("/financeiro/receber");
      return data;
    },
  });

  const totalProdutos = produtos?.length || 0;
  const vendasHoje =
    vendas?.filter((v: any) => {
      const hoje = new Date().toDateString();
      return new Date(v.dataVenda).toDateString() === hoje;
    }).length || 0;
  const contasPendentes =
    contasPagar?.filter((c: any) => c.status === "PENDENTE").length || 0;
  const contasReceberPendentes =
    contasReceber?.filter((c: any) => c.status === "PENDENTE").length || 0;

  // Dados para gráfico de vendas (últimos 7 dias)
  const vendasPorDia = [];
  for (let i = 6; i >= 0; i--) {
    const data = new Date();
    data.setDate(data.getDate() - i);
    const dataStr = data.toDateString();
    const vendasDia =
      vendas?.filter(
        (v: any) => new Date(v.dataVenda).toDateString() === dataStr
      ) || [];
    const totalDia = vendasDia.reduce(
      (acc: number, v: any) => acc + v.valorLiquido,
      0
    );
    vendasPorDia.push({
      dia: data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      valor: totalDia / 100,
    });
  }

  // Dados para gráfico de estoque (produtos com estoque baixo)
  const produtosBaixoEstoque =
    produtos?.filter((p: any) => p.estoque <= p.estoqueMinimo).slice(0, 5) ||
    [];
  const dadosEstoque = produtosBaixoEstoque.map((p: any) => ({
    produto: p.codigo,
    estoque: p.estoque,
    minimo: p.estoqueMinimo,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral do sistema ERP - RP Info
          </p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Produtos
              </CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProdutos}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Produtos cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Vendas Hoje
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendasHoje}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Vendas realizadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Contas a Pagar
              </CardTitle>
              <CreditCard className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contasPendentes}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Contas pendentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Contas a Receber
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contasReceberPendentes}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Contas pendentes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Vendas dos Últimos 7 Dias</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={vendasPorDia}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="valor"
                    stroke="#10b981"
                    name="Valor (R$)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Produtos com Estoque Baixo</CardTitle>
            </CardHeader>
            <CardContent>
              {dadosEstoque.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosEstoque}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="produto" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="estoque"
                      fill="#ef4444"
                      name="Estoque Atual"
                    />
                    <Bar
                      dataKey="minimo"
                      fill="#f59e0b"
                      name="Estoque Mínimo"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-12">
                  Nenhum produto com estoque baixo
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Últimas Vendas */}
        <Card>
          <CardHeader>
            <CardTitle>Últimas Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            {vendas && vendas.length > 0 ? (
              <div className="space-y-2">
                {vendas.slice(0, 5).map((venda: any) => (
                  <div
                    key={venda.id}
                    className="flex justify-between items-center border-b pb-2"
                  >
                    <div>
                      <p className="font-medium">Venda #{venda.numeroVenda}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(venda.dataVenda).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-green-600">
                        R$ {(venda.valorLiquido / 100).toFixed(2)}
                      </p>
                      <button
                        onClick={() => {
                          // Open coupon modal
                          const couponWindow = window.open("", "_blank", "width=400,height=700");
                          if (couponWindow) {
                            couponWindow.document.write(`
                              <html>
                                <head>
                                  <title>Cupom Fiscal - ${venda.numeroVenda}</title>
                                  <style>
                                    body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 10px; }
                                    .text-center { text-align: center; }
                                    .text-right { text-align: right; }
                                    .bold { font-weight: bold; }
                                    .divider { border-top: 1px dashed #000; margin: 5px 0; }
                                    table { width: 100%; border-collapse: collapse; }
                                    td { vertical-align: top; padding: 2px 0; }
                                  </style>
                                </head>
                                <body>
                                  <div class="text-center bold">MERCADO EXEMPLO LTDA</div>
                                  <div class="text-center">CNPJ: 12.345.678/0001-90</div>
                                  <div class="text-center">AV. BRASIL, 1000 - CENTRO</div>
                                  <div class="divider"></div>
                                  <div class="text-center bold">CUPOM FISCAL ELETRÔNICO</div>
                                  <div class="text-center">CCF: ${venda.ccf || '000000'} COO: ${venda.coo || '000000'}</div>
                                  <div class="text-center">PDV: ${venda.pdvOrigemId || 'N/A'}</div>
                                  <div class="divider"></div>
                                  <div class="text-center">CONSUMIDOR NÃO IDENTIFICADO</div>
                                  <div class="divider"></div>
                                  <table>
                                    <tr>
                                      <td colspan="4" class="bold">ITEM CÓDIGO DESCRIÇÃO</td>
                                    </tr>
                                    <tr>
                                      <td class="bold">QTD</td>
                                      <td class="bold">UN</td>
                                      <td class="bold text-right">VL UNIT</td>
                                      <td class="bold text-right">VL TOTAL</td>
                                    </tr>
                                    ${(venda.itens || []).map((item: any, index: number) => `
                                      <tr>
                                        <td colspan="4">${(index + 1).toString().padStart(3, '0')} ${item.produtoId} ${item.produtoNome || 'Produto'}</td>
                                      </tr>
                                      <tr>
                                        <td>${item.quantidade}</td>
                                        <td>UN</td>
                                        <td class="text-right">${(item.precoUnitario / 100).toFixed(2)}</td>
                                        <td class="text-right">${(item.total / 100).toFixed(2)}</td>
                                      </tr>
                                    `).join('')}
                                  </table>
                                  <div class="divider"></div>
                                  <div class="text-right bold" style="font-size: 14px">TOTAL R$ ${(venda.valorLiquido / 100).toFixed(2)}</div>
                                  <div class="divider"></div>
                                  <div class="text-right">${venda.formaPagamento || 'N/A'}</div>
                                  <div class="divider"></div>
                                  <div class="text-center">${new Date(venda.dataVenda).toLocaleString('pt-BR')}</div>
                                  <div class="text-center">Operador: ${venda.operadorNome || 'N/A'}</div>
                                  <div class="text-center" style="margin-top: 20px;">OBRIGADO PELA PREFERÊNCIA!</div>
                                  <div class="text-center" style="font-size: 10px; margin-top: 10px;">Sistema ERP - RP Info</div>
                                </body>
                              </html>
                            `);
                            couponWindow.document.close();
                          }
                        }}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Ver Cupom
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhuma venda registrada.</p>
            )}
          </CardContent>
        </Card>


        {/* Contas a Pagar Pendentes */}
        <Card>
          <CardHeader>
            <CardTitle>Contas a Pagar Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            {contasPagar &&
            contasPagar.filter((c: any) => c.status === "PENDENTE").length >
              0 ? (
              <div className="space-y-2">
                {contasPagar
                  .filter((c: any) => c.status === "PENDENTE")
                  .slice(0, 5)
                  .map((conta: any) => (
                    <div
                      key={conta.id}
                      className="flex justify-between items-center border-b pb-2"
                    >
                      <div>
                        <p className="font-medium">{conta.descricao}</p>
                        <p className="text-sm text-muted-foreground">
                          Vencimento:{" "}
                          {new Date(conta.dataVencimento).toLocaleDateString(
                            "pt-BR"
                          )}
                        </p>
                      </div>
                      <p className="font-bold text-red-600">
                        R$ {(conta.valor / 100).toFixed(2)}
                      </p>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhuma conta pendente.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
