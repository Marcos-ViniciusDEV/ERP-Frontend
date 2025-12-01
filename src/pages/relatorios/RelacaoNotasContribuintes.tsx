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

export default function RelacaoNotasContribuintes() {
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split("T")[0]);
  const [dataFim, setDataFim] = useState(new Date().toISOString().split("T")[0]);

  const { data: vendas, isLoading, refetch } = useQuery({
    queryKey: ["notas-contribuintes", dataInicio, dataFim],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dataInicio) params.append("dataInicio", dataInicio);
      if (dataFim) params.append("dataFim", dataFim);
      
      const { data } = await api.get(`/vendas?${params.toString()}`);
      return data;
    },
  });

  // Filtrar vendas com cliente identificado (CPF/CNPJ)
  // Como não temos o campo CPF/CNPJ direto na venda no frontend (apenas clienteNome), 
  // vamos assumir que se tem clienteNome diferente de "Consumidor Final" e não vazio, é um contribuinte.
  // Idealmente, o backend retornaria o documento do cliente.
  const notas = vendas?.filter((v: any) => 
    v.status !== "CANCELADA" && 
    v.clienteNome && 
    v.clienteNome.toUpperCase() !== "CONSUMIDOR FINAL"
  ) || [];

  const totalGeral = notas.reduce(
    (acc: number, n: any) => acc + n.valorTotal,
    0
  );

  const handleSearch = () => {
    refetch();
  };

  const imprimirRelatorio = () => {
    if (!notas || notas.length === 0) {
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
          <title>Relação de Notas de Contribuintes</title>
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
          <h1>Relação de Notas de Contribuintes</h1>
          <div class="info">
            Período: ${new Date(dataInicio).toLocaleDateString("pt-BR")} a ${new Date(dataFim).toLocaleDateString("pt-BR")}<br>
            Data de Emissão: ${new Date().toLocaleString("pt-BR")}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Documento</th>
                <th>Cliente</th>
                <th class="text-right">Valor Total</th>
              </tr>
            </thead>
            <tbody>
    `;

    notas.forEach((nota: any) => {
      html += `
        <tr>
          <td>${format(new Date(nota.dataVenda), "dd/MM/yyyy HH:mm")}</td>
          <td>${nota.numeroVenda || nota.id}</td>
          <td>${nota.clienteNome}</td>
          <td class="text-right">R$ ${(nota.valorTotal / 100).toFixed(2)}</td>
        </tr>
      `;
    });

    html += `
              <tr class="total-row">
                <td colspan="3">TOTAL GERAL</td>
                <td class="text-right">R$ ${(totalGeral / 100).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="info">
            Total de Registros: ${notas.length}
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
    if (!notas || notas.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    let csv = "Data;Documento;Cliente;Valor Total\n";

    notas.forEach((nota: any) => {
      csv += `${format(new Date(nota.dataVenda), "dd/MM/yyyy HH:mm")};${nota.numeroVenda || nota.id};${nota.clienteNome};${(nota.valorTotal / 100).toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `notas_contribuintes_${dataInicio}_${dataFim}.csv`;
    link.click();
    toast.success("Relatório exportado");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Relação de Notas de Contribuintes</h1>
            <p className="text-sm text-muted-foreground">
              Vendas com identificação de cliente (CPF/CNPJ)
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
                    <TableHead className="text-right">Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Carregando dados...
                      </TableCell>
                    </TableRow>
                  ) : notas.length > 0 ? (
                    <>
                      {notas.map((nota: any) => (
                        <TableRow key={nota.id}>
                          <TableCell>{format(new Date(nota.dataVenda), "dd/MM/yyyy HH:mm")}</TableCell>
                          <TableCell className="font-mono">{nota.numeroVenda || nota.id}</TableCell>
                          <TableCell>{nota.clienteNome}</TableCell>
                          <TableCell className="text-right font-medium">
                            R$ {(nota.valorTotal / 100).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={3}>TOTAL GERAL</TableCell>
                        <TableCell className="text-right">
                          R$ {(totalGeral / 100).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Nenhuma nota encontrada no período</p>
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
