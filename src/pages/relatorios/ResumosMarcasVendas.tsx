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
import { Produto } from "@/shared/schema";

export default function ResumosMarcasVendas() {
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split("T")[0]);
  const [dataFim, setDataFim] = useState(new Date().toISOString().split("T")[0]);

  // Buscar produtos para mapear marcas
  const { data: produtos } = useQuery<Produto[]>({
    queryKey: ["produtos"],
    queryFn: async () => {
      const { data } = await api.get("/produtos");
      return data;
    }
  });

  // Buscar vendas do período
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

  // Criar mapa de produto -> marca
  const produtoMarcaMap = new Map<number, string>();
  produtos?.forEach(p => {
    produtoMarcaMap.set(p.id, p.marca || "SEM MARCA");
  });

  // Processar dados para agrupar por marca
  const marcasMap = new Map();

  vendas?.forEach((venda: any) => {
    if (venda.status === "CANCELADA") return;

    venda.itens.forEach((item: any) => {
      const marca = produtoMarcaMap.get(item.produtoId) || "SEM MARCA";
      
      if (!marcasMap.has(marca)) {
        marcasMap.set(marca, {
          marca: marca,
          quantidade: 0,
          valorTotal: 0,
        });
      }

      const dadosMarca = marcasMap.get(marca);
      dadosMarca.quantidade += item.quantidade;
      dadosMarca.valorTotal += item.valorTotal;
    });
  });

  const marcasAgrupadas = Array.from(marcasMap.values()).sort((a, b) => 
    b.valorTotal - a.valorTotal
  );

  const totalGeral = marcasAgrupadas.reduce(
    (acc, m) => ({
      quantidade: acc.quantidade + m.quantidade,
      valorTotal: acc.valorTotal + m.valorTotal,
    }),
    { quantidade: 0, valorTotal: 0 }
  );

  const handleSearch = () => {
    refetch();
  };

  const imprimirRelatorio = () => {
    if (!marcasAgrupadas || marcasAgrupadas.length === 0) {
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
          <title>Resumo de Vendas por Marca</title>
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
          <h1>Resumo de Vendas por Marca</h1>
          <div class="info">
            Período: ${new Date(dataInicio).toLocaleDateString("pt-BR")} a ${new Date(dataFim).toLocaleDateString("pt-BR")}<br>
            Data de Emissão: ${new Date().toLocaleString("pt-BR")}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Marca</th>
                <th class="text-right">Qtd. Vendida</th>
                <th class="text-right">Ticket Médio</th>
                <th class="text-right">Total Vendido</th>
                <th class="text-right">Part. %</th>
              </tr>
            </thead>
            <tbody>
    `;

    marcasAgrupadas.forEach(marca => {
      const ticketMedio = marca.quantidade > 0 ? marca.valorTotal / marca.quantidade : 0;
      const participacao = totalGeral.valorTotal > 0 ? (marca.valorTotal / totalGeral.valorTotal) * 100 : 0;
      
      html += `
        <tr>
          <td>${marca.marca}</td>
          <td class="text-right">${marca.quantidade}</td>
          <td class="text-right">R$ ${(ticketMedio / 100).toFixed(2)}</td>
          <td class="text-right">R$ ${(marca.valorTotal / 100).toFixed(2)}</td>
          <td class="text-right">${participacao.toFixed(2)}%</td>
        </tr>
      `;
    });

    html += `
              <tr class="total-row">
                <td>TOTAL GERAL</td>
                <td class="text-right">${totalGeral.quantidade}</td>
                <td class="text-right">-</td>
                <td class="text-right">R$ ${(totalGeral.valorTotal / 100).toFixed(2)}</td>
                <td class="text-right">100.00%</td>
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
    if (!marcasAgrupadas || marcasAgrupadas.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    let csv = "Marca;Quantidade;Ticket Médio;Total Vendido;Participação %\n";

    marcasAgrupadas.forEach(marca => {
      const ticketMedio = marca.quantidade > 0 ? marca.valorTotal / marca.quantidade : 0;
      const participacao = totalGeral.valorTotal > 0 ? (marca.valorTotal / totalGeral.valorTotal) * 100 : 0;
      
      csv += `${marca.marca};${marca.quantidade};${(ticketMedio / 100).toFixed(2)};${(marca.valorTotal / 100).toFixed(2)};${participacao.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `resumo_marcas_${dataInicio}_${dataFim}.csv`;
    link.click();
    toast.success("Relatório exportado");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Resumo de Vendas por Marca</h1>
            <p className="text-sm text-muted-foreground">
              Desempenho de vendas agrupado por marca
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
                    <TableHead>Marca</TableHead>
                    <TableHead className="text-right">Qtd. Vendida</TableHead>
                    <TableHead className="text-right">Ticket Médio</TableHead>
                    <TableHead className="text-right">Total Vendido</TableHead>
                    <TableHead className="text-right">Part. %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Carregando dados...
                      </TableCell>
                    </TableRow>
                  ) : marcasAgrupadas.length > 0 ? (
                    <>
                      {marcasAgrupadas.map((marca, idx) => {
                        const ticketMedio = marca.quantidade > 0 ? marca.valorTotal / marca.quantidade : 0;
                        const participacao = totalGeral.valorTotal > 0 ? (marca.valorTotal / totalGeral.valorTotal) * 100 : 0;
                        
                        return (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{marca.marca}</TableCell>
                            <TableCell className="text-right">{marca.quantidade}</TableCell>
                            <TableCell className="text-right">
                              R$ {(ticketMedio / 100).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              R$ {(marca.valorTotal / 100).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {participacao.toFixed(2)}%
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell>TOTAL GERAL</TableCell>
                        <TableCell className="text-right">{totalGeral.quantidade}</TableCell>
                        <TableCell className="text-right">-</TableCell>
                        <TableCell className="text-right">
                          R$ {(totalGeral.valorTotal / 100).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">100.00%</TableCell>
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
