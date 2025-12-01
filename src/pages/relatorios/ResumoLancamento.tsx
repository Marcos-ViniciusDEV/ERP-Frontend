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
import { format } from "date-fns";

export default function ResumoLancamento() {
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split("T")[0]);
  const [dataFim, setDataFim] = useState(new Date().toISOString().split("T")[0]);

  const { data: vendas, isLoading, refetch } = useQuery({
    queryKey: ["resumo-lancamento", dataInicio, dataFim],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dataInicio) params.append("dataInicio", dataInicio);
      if (dataFim) params.append("dataFim", dataFim);
      
      const { data } = await api.get(`/vendas?${params.toString()}`);
      return data;
    },
  });

  // Agrupar por dia
  const lancamentosMap = new Map();

  vendas?.forEach((venda: any) => {
    if (venda.status === "CANCELADA") return;

    const data = format(new Date(venda.dataVenda), "yyyy-MM-dd");
    
    if (!lancamentosMap.has(data)) {
      lancamentosMap.set(data, {
        data: data,
        quantidade: 0,
        valorTotal: 0,
        descontos: 0,
      });
    }

    const dia = lancamentosMap.get(data);
    dia.quantidade += 1;
    dia.valorTotal += venda.valorTotal;
    dia.descontos += venda.desconto || 0;
  });

  const lancamentos = Array.from(lancamentosMap.values()).sort((a, b) => 
    a.data.localeCompare(b.data)
  );

  const totalGeral = lancamentos.reduce(
    (acc, l) => ({
      quantidade: acc.quantidade + l.quantidade,
      valorTotal: acc.valorTotal + l.valorTotal,
      descontos: acc.descontos + l.descontos,
    }),
    { quantidade: 0, valorTotal: 0, descontos: 0 }
  );

  const handleSearch = () => {
    refetch();
  };

  const imprimirRelatorio = () => {
    if (!lancamentos || lancamentos.length === 0) {
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
          <title>Resumo de Lançamento (Diário)</title>
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
          <h1>Resumo de Lançamento (Diário)</h1>
          <div class="info">
            Período: ${new Date(dataInicio).toLocaleDateString("pt-BR")} a ${new Date(dataFim).toLocaleDateString("pt-BR")}<br>
            Data de Emissão: ${new Date().toLocaleString("pt-BR")}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th class="text-right">Qtd. Vendas</th>
                <th class="text-right">Total Bruto</th>
                <th class="text-right">Descontos</th>
                <th class="text-right">Total Líquido</th>
              </tr>
            </thead>
            <tbody>
    `;

    lancamentos.forEach(dia => {
      const dataFormatada = format(new Date(dia.data + "T00:00:00"), "dd/MM/yyyy");
      const totalBruto = dia.valorTotal + dia.descontos;
      
      html += `
        <tr>
          <td>${dataFormatada}</td>
          <td class="text-right">${dia.quantidade}</td>
          <td class="text-right">R$ ${(totalBruto / 100).toFixed(2)}</td>
          <td class="text-right">R$ ${(dia.descontos / 100).toFixed(2)}</td>
          <td class="text-right">R$ ${(dia.valorTotal / 100).toFixed(2)}</td>
        </tr>
      `;
    });

    const totalBrutoGeral = totalGeral.valorTotal + totalGeral.descontos;

    html += `
              <tr class="total-row">
                <td>TOTAL GERAL</td>
                <td class="text-right">${totalGeral.quantidade}</td>
                <td class="text-right">R$ ${(totalBrutoGeral / 100).toFixed(2)}</td>
                <td class="text-right">R$ ${(totalGeral.descontos / 100).toFixed(2)}</td>
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
    if (!lancamentos || lancamentos.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    let csv = "Data;Qtd Vendas;Total Bruto;Descontos;Total Liquido\n";

    lancamentos.forEach(dia => {
      const dataFormatada = format(new Date(dia.data + "T00:00:00"), "dd/MM/yyyy");
      const totalBruto = (dia.valorTotal + dia.descontos) / 100;
      const descontos = dia.descontos / 100;
      const totalLiquido = dia.valorTotal / 100;
      
      csv += `${dataFormatada};${dia.quantidade};${totalBruto.toFixed(2)};${descontos.toFixed(2)};${totalLiquido.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `resumo_lancamento_${dataInicio}_${dataFim}.csv`;
    link.click();
    toast.success("Relatório exportado");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Resumo de Lançamento</h1>
            <p className="text-sm text-muted-foreground">
              Consolidado diário de vendas
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
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Qtd. Vendas</TableHead>
                    <TableHead className="text-right">Total Bruto</TableHead>
                    <TableHead className="text-right">Descontos</TableHead>
                    <TableHead className="text-right">Total Líquido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Carregando dados...
                      </TableCell>
                    </TableRow>
                  ) : lancamentos.length > 0 ? (
                    <>
                      {lancamentos.map((dia, idx) => {
                        const totalBruto = dia.valorTotal + dia.descontos;
                        return (
                          <TableRow key={idx}>
                            <TableCell>{format(new Date(dia.data + "T00:00:00"), "dd/MM/yyyy")}</TableCell>
                            <TableCell className="text-right">{dia.quantidade}</TableCell>
                            <TableCell className="text-right">
                              R$ {(totalBruto / 100).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-red-600">
                              R$ {(dia.descontos / 100).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              R$ {(dia.valorTotal / 100).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell>TOTAL GERAL</TableCell>
                        <TableCell className="text-right">{totalGeral.quantidade}</TableCell>
                        <TableCell className="text-right">
                          R$ {((totalGeral.valorTotal + totalGeral.descontos) / 100).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          R$ {(totalGeral.descontos / 100).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {(totalGeral.valorTotal / 100).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Nenhum lançamento encontrado no período</p>
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
