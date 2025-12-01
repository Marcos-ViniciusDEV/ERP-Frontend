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

export default function ResumoPorDocumentoCancelamentos() {
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split("T")[0]);
  const [dataFim, setDataFim] = useState(new Date().toISOString().split("T")[0]);

  const { data: vendas, isLoading, refetch } = useQuery({
    queryKey: ["vendas-canceladas", dataInicio, dataFim],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dataInicio) params.append("dataInicio", dataInicio);
      if (dataFim) params.append("dataFim", dataFim);
      
      const { data } = await api.get(`/vendas?${params.toString()}`);
      return data;
    },
  });

  // Filtrar apenas vendas canceladas
  const vendasCanceladas = vendas?.filter((v: any) => v.status === "CANCELADA") || [];

  const totalCancelado = vendasCanceladas.reduce(
    (acc: number, v: any) => acc + v.valorTotal,
    0
  );

  const handleSearch = () => {
    refetch();
  };

  const imprimirRelatorio = () => {
    if (!vendasCanceladas || vendasCanceladas.length === 0) {
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
          <title>Relatório de Cancelamentos</title>
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
              color: #dc2626;
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
              background-color: #fef2f2;
              color: #dc2626;
            }
          </style>
        </head>
        <body>
          <h1>Relatório de Cancelamentos</h1>
          <div class="info">
            Período: ${new Date(dataInicio).toLocaleDateString("pt-BR")} a ${new Date(dataFim).toLocaleDateString("pt-BR")}<br>
            Data de Emissão: ${new Date().toLocaleString("pt-BR")}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Documento</th>
                <th>Cliente</th>
                <th>Vendedor</th>
                <th class="text-right">Valor Cancelado</th>
              </tr>
            </thead>
            <tbody>
    `;

    vendasCanceladas.forEach((venda: any) => {
      html += `
        <tr>
          <td>${format(new Date(venda.dataVenda), "dd/MM/yyyy HH:mm")}</td>
          <td>${venda.numeroVenda || venda.id}</td>
          <td>${venda.clienteNome || "Consumidor Final"}</td>
          <td>${venda.operadorNome || "-"}</td>
          <td class="text-right">R$ ${(venda.valorTotal / 100).toFixed(2)}</td>
        </tr>
      `;
    });

    html += `
              <tr class="total-row">
                <td colspan="4">TOTAL CANCELADO</td>
                <td class="text-right">R$ ${(totalCancelado / 100).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="info">
            Total de Registros: ${vendasCanceladas.length}
          </div>

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
    if (!vendasCanceladas || vendasCanceladas.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    let csv = "Data;Documento;Cliente;Vendedor;Valor Cancelado\n";

    vendasCanceladas.forEach((venda: any) => {
      csv += `${format(new Date(venda.dataVenda), "dd/MM/yyyy HH:mm")};${venda.numeroVenda || venda.id};${venda.clienteNome || "Consumidor Final"};${venda.operadorNome || "-"};${(venda.valorTotal / 100).toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `cancelamentos_${dataInicio}_${dataFim}.csv`;
    link.click();
    toast.success("Relatório exportado");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-red-600">Relatório de Cancelamentos</h1>
            <p className="text-sm text-muted-foreground">
              Listagem de vendas canceladas no período
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
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="text-right">Valor Cancelado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Carregando dados...
                      </TableCell>
                    </TableRow>
                  ) : vendasCanceladas.length > 0 ? (
                    <>
                      {vendasCanceladas.map((venda: any) => (
                        <TableRow key={venda.id}>
                          <TableCell>{format(new Date(venda.dataVenda), "dd/MM/yyyy HH:mm")}</TableCell>
                          <TableCell className="font-mono">{venda.numeroVenda || venda.id}</TableCell>
                          <TableCell>{venda.clienteNome || "Consumidor Final"}</TableCell>
                          <TableCell>{venda.operadorNome || "-"}</TableCell>
                          <TableCell className="text-right font-bold text-red-600">
                            R$ {(venda.valorTotal / 100).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-red-50 font-bold">
                        <TableCell colSpan={4}>TOTAL CANCELADO</TableCell>
                        <TableCell className="text-right text-red-600">
                          R$ {(totalCancelado / 100).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Nenhum cancelamento encontrado no período</p>
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
