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

export default function ResumoPorProduto() {
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split("T")[0]);
  const [dataFim, setDataFim] = useState(new Date().toISOString().split("T")[0]);

  const { data: vendas, isLoading, refetch } = useQuery({
    queryKey: ["vendas-periodo", dataInicio, dataFim],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dataInicio) params.append("dataInicio", dataInicio);
      if (dataFim) params.append("dataFim", dataFim);
      
      const { data } = await api.get(`/vendas?${params.toString()}`);
      return data;
    },
  });

  // Processar dados para agrupar por produto
  const produtosMap = new Map();

  vendas?.forEach((venda: any) => {
    if (venda.status === "CANCELADA") return; // Ignorar vendas canceladas

    venda.itens.forEach((item: any) => {
      const produtoId = item.produtoId;
      
      if (!produtosMap.has(produtoId)) {
        produtosMap.set(produtoId, {
          codigo: item.produto?.codigo || "N/A",
          descricao: item.descricao || "Produto Desconhecido",
          quantidade: 0,
          valorTotal: 0,
        });
      }

      const produto = produtosMap.get(produtoId);
      produto.quantidade += item.quantidade;
      produto.valorTotal += item.valorTotal;
    });
  });

  const produtosAgrupados = Array.from(produtosMap.values()).sort((a, b) => 
    b.valorTotal - a.valorTotal
  );

  const totalGeral = produtosAgrupados.reduce(
    (acc, p) => ({
      quantidade: acc.quantidade + p.quantidade,
      valorTotal: acc.valorTotal + p.valorTotal,
    }),
    { quantidade: 0, valorTotal: 0 }
  );

  const handleSearch = () => {
    refetch();
  };

  const imprimirRelatorio = () => {
    if (!produtosAgrupados || produtosAgrupados.length === 0) {
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
          <title>Resumo por Produto</title>
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
            .info {
              font-size: 9pt;
              color: #666;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
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
            .text-center {
              text-align: center;
            }
            .total-row {
              font-weight: bold;
              background-color: #f0f0f0;
            }
          </style>
        </head>
        <body>
          <h1>Resumo por Produto</h1>
          <div class="info">
            Período: ${new Date(dataInicio).toLocaleDateString("pt-BR")} a ${new Date(dataFim).toLocaleDateString("pt-BR")}<br>
            Data de Emissão: ${new Date().toLocaleString("pt-BR")}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Descrição</th>
                <th class="text-right">Qtd. Vendida</th>
                <th class="text-right">Preço Médio</th>
                <th class="text-right">Total Vendido</th>
              </tr>
            </thead>
            <tbody>
    `;

    produtosAgrupados.forEach(produto => {
      const precoMedio = produto.quantidade > 0 ? produto.valorTotal / produto.quantidade : 0;
      html += `
        <tr>
          <td>${produto.codigo}</td>
          <td>${produto.descricao}</td>
          <td class="text-right">${produto.quantidade}</td>
          <td class="text-right">R$ ${(precoMedio / 100).toFixed(2)}</td>
          <td class="text-right">R$ ${(produto.valorTotal / 100).toFixed(2)}</td>
        </tr>
      `;
    });

    html += `
              <tr class="total-row">
                <td colspan="2">TOTAL GERAL</td>
                <td class="text-right">${totalGeral.quantidade}</td>
                <td class="text-right">-</td>
                <td class="text-right">R$ ${(totalGeral.valorTotal / 100).toFixed(2)}</td>
              </tr>
            </tbody>
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

  const exportarCSV = () => {
    if (!produtosAgrupados || produtosAgrupados.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    let csv = "Código;Descrição;Quantidade;Preço Médio;Total Vendido\n";

    produtosAgrupados.forEach(produto => {
      const precoMedio = produto.quantidade > 0 ? produto.valorTotal / produto.quantidade : 0;
      csv += `${produto.codigo};${produto.descricao};${produto.quantidade};${(precoMedio / 100).toFixed(2)};${(produto.valorTotal / 100).toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `resumo_produtos_${dataInicio}_${dataFim}.csv`;
    link.click();
    toast.success("Relatório exportado");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Resumo por Produto</h1>
            <p className="text-sm text-muted-foreground">
              Vendas agrupadas por produto no período
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportarCSV}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
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

        {/* Tabela de Resultados */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Qtd. Vendida</TableHead>
                    <TableHead className="text-right">Preço Médio</TableHead>
                    <TableHead className="text-right">Total Vendido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Carregando dados...
                      </TableCell>
                    </TableRow>
                  ) : produtosAgrupados.length > 0 ? (
                    <>
                      {produtosAgrupados.map((produto, idx) => {
                        const precoMedio = produto.quantidade > 0 ? produto.valorTotal / produto.quantidade : 0;
                        return (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-sm">{produto.codigo}</TableCell>
                            <TableCell>{produto.descricao}</TableCell>
                            <TableCell className="text-right">{produto.quantidade}</TableCell>
                            <TableCell className="text-right">
                              R$ {(precoMedio / 100).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              R$ {(produto.valorTotal / 100).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={2}>TOTAL GERAL</TableCell>
                        <TableCell className="text-right">{totalGeral.quantidade}</TableCell>
                        <TableCell className="text-right">-</TableCell>
                        <TableCell className="text-right">
                          R$ {(totalGeral.valorTotal / 100).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Nenhuma venda encontrada no período</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
