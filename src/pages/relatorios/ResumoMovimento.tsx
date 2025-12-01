import { useState } from "react";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Printer, Download, Search } from "lucide-react";
import { toast } from "sonner";

export default function ResumoMovimento() {
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split("T")[0]);
  const [dataFim, setDataFim] = useState(new Date().toISOString().split("T")[0]);

  const { data: vendas, isLoading, refetch } = useQuery({
    queryKey: ["resumo-movimento", dataInicio, dataFim],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dataInicio) params.append("dataInicio", dataInicio);
      if (dataFim) params.append("dataFim", dataFim);
      
      const { data } = await api.get(`/vendas?${params.toString()}`);
      return data;
    },
  });

  // Calcular totais
  const resumo = vendas?.reduce(
    (acc: any, venda: any) => {
      if (venda.status === "CANCELADA") {
        acc.canceladas.qtd += 1;
        acc.canceladas.valor += venda.valorTotal;
      } else {
        acc.vendas.qtd += 1;
        acc.vendas.valor += venda.valorTotal;
        acc.vendas.descontos += venda.desconto || 0;
        
        // Agrupar por forma de pagamento (simulado, pois a API pode não retornar detalhado aqui)
        // Se houver pagamentos detalhados, usaríamos venda.pagamentos
        const formaPagamento = venda.formaPagamento || "DINHEIRO";
        if (!acc.pagamentos[formaPagamento]) {
          acc.pagamentos[formaPagamento] = 0;
        }
        acc.pagamentos[formaPagamento] += venda.valorTotal;
      }
      return acc;
    },
    {
      vendas: { qtd: 0, valor: 0, descontos: 0 },
      canceladas: { qtd: 0, valor: 0 },
      pagamentos: {} as Record<string, number>,
    }
  ) || {
    vendas: { qtd: 0, valor: 0, descontos: 0 },
    canceladas: { qtd: 0, valor: 0 },
    pagamentos: {},
  };

  const handleSearch = () => {
    refetch();
  };

  const imprimirRelatorio = () => {
    if (!vendas || vendas.length === 0) {
      toast.error("Nenhum dado para imprimir");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Não foi possível abrir janela de impressão");
      return;
    }

    let html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Resumo de Movimento</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
              font-size: 10pt;
            }
            h1 {
              font-size: 16pt;
              margin-bottom: 5px;
            }
            h2 {
              font-size: 12pt;
              margin-top: 20px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            .info {
              font-size: 9pt;
              color: #666;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 6px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .text-right {
              text-align: right;
            }
            .summary-box {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            .box {
              border: 1px solid #ddd;
              padding: 10px;
              width: 48%;
              background-color: #f9f9f9;
            }
            .value {
              font-size: 14pt;
              font-weight: bold;
              text-align: right;
            }
            .label {
              font-size: 10pt;
              color: #666;
            }
          </style>
        </head>
        <body>
          <h1>Resumo de Movimento</h1>
          <div class="info">
            Período: ${new Date(dataInicio).toLocaleDateString("pt-BR")} a ${new Date(dataFim).toLocaleDateString("pt-BR")}<br>
            Data de Emissão: ${new Date().toLocaleString("pt-BR")}
          </div>
          
          <div class="summary-box">
            <div class="box">
              <div class="label">Total de Vendas Líquidas</div>
              <div class="value">R$ ${(resumo.vendas.valor / 100).toFixed(2)}</div>
              <div class="label" style="margin-top: 5px; font-size: 9pt;">${resumo.vendas.qtd} registros</div>
            </div>
            <div class="box">
              <div class="label">Total Cancelado</div>
              <div class="value" style="color: #dc2626;">R$ ${(resumo.canceladas.valor / 100).toFixed(2)}</div>
              <div class="label" style="margin-top: 5px; font-size: 9pt;">${resumo.canceladas.qtd} registros</div>
            </div>
          </div>

          <h2>Detalhamento por Forma de Pagamento</h2>
          <table>
            <thead>
              <tr>
                <th>Forma de Pagamento</th>
                <th class="text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
    `;

    Object.entries(resumo.pagamentos).forEach(([forma, valor]: [string, any]) => {
      html += `
        <tr>
          <td>${forma}</td>
          <td class="text-right">R$ ${(valor / 100).toFixed(2)}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>

          <h2>Resumo Geral</h2>
          <table>
            <tr>
              <td>Vendas Brutas</td>
              <td class="text-right">R$ ${((resumo.vendas.valor + resumo.vendas.descontos) / 100).toFixed(2)}</td>
            </tr>
            <tr>
              <td>(-) Descontos</td>
              <td class="text-right">R$ ${(resumo.vendas.descontos / 100).toFixed(2)}</td>
            </tr>
            <tr>
              <td>(-) Cancelamentos</td>
              <td class="text-right">R$ ${(resumo.canceladas.valor / 100).toFixed(2)}</td>
            </tr>
            <tr style="font-weight: bold; background-color: #f0f0f0;">
              <td>(=) Total Líquido</td>
              <td class="text-right">R$ ${(resumo.vendas.valor / 100).toFixed(2)}</td>
            </tr>
          </table>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Resumo de Movimento</h1>
            <p className="text-sm text-muted-foreground">
              Visão geral financeira do período
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={imprimirRelatorio}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir / PDF
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="dataInicio">Data Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={dataInicio}
                  onChange={e => setDataInicio(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dataFim">Data Fim</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={dataFim}
                  onChange={e => setDataFim(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={handleSearch}>
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Vendas Líquidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {(resumo.vendas.valor / 100).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {resumo.vendas.qtd} vendas realizadas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Descontos Concedidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                R$ {(resumo.vendas.descontos / 100).toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cancelamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                R$ {(resumo.canceladas.valor / 100).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {resumo.canceladas.qtd} vendas canceladas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Pagamentos */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhamento por Forma de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Forma de Pagamento</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                      Carregando dados...
                    </TableCell>
                  </TableRow>
                ) : Object.keys(resumo.pagamentos).length > 0 ? (
                  Object.entries(resumo.pagamentos).map(([forma, valor]: [string, any]) => (
                    <TableRow key={forma}>
                      <TableCell>{forma}</TableCell>
                      <TableCell className="text-right font-medium">
                        R$ {(valor / 100).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                      Nenhum dado encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
