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
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Produto } from "@/shared/schema";

export default function PosicaoEtiquetasDiario() {
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split("T")[0]);
  const [dataFim, setDataFim] = useState(new Date().toISOString().split("T")[0]);

  const { data: produtos, isLoading, refetch } = useQuery<Produto[]>({
    queryKey: ["produtos-etiquetas"],
    queryFn: async () => {
      const { data } = await api.get("/produtos");
      return data;
    },
  });

  // Filtrar produtos atualizados no período
  const produtosAtualizados = produtos?.filter(p => {
    if (!p.updatedAt) return false;
    const dataAtualizacao = new Date(p.updatedAt);
    const inicio = startOfDay(new Date(dataInicio));
    const fim = endOfDay(new Date(dataFim));
    
    return isWithinInterval(dataAtualizacao, { start: inicio, end: fim });
  }) || [];

  const handleSearch = () => {
    refetch();
  };

  const imprimirRelatorio = () => {
    if (!produtosAtualizados || produtosAtualizados.length === 0) {
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
          <title>Posição de Etiquetas (Produtos Atualizados)</title>
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
          </style>
        </head>
        <body>
          <h1>Posição de Etiquetas (Produtos Atualizados)</h1>
          <div class="info">
            Período: ${new Date(dataInicio).toLocaleDateString("pt-BR")} a ${new Date(dataFim).toLocaleDateString("pt-BR")}<br>
            Data de Emissão: ${new Date().toLocaleString("pt-BR")}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Descrição</th>
                <th class="text-right">Preço Venda</th>
                <th class="text-right">Preço PDV</th>
                <th>Atualizado em</th>
              </tr>
            </thead>
            <tbody>
    `;

    produtosAtualizados.forEach(p => {
      html += `
        <tr>
          <td>${p.codigo}</td>
          <td>${p.descricao}</td>
          <td class="text-right">R$ ${(p.precoVenda / 100).toFixed(2)}</td>
          <td class="text-right">R$ ${(p.precoPdv / 100).toFixed(2)}</td>
          <td>${format(new Date(p.updatedAt), "dd/MM/yyyy HH:mm")}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>

          <div class="info">
            Total de Produtos: ${produtosAtualizados.length}
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
    if (!produtosAtualizados || produtosAtualizados.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    let csv = "Codigo;Descricao;Preco Venda;Preco PDV;Atualizado Em\n";

    produtosAtualizados.forEach(p => {
      csv += `${p.codigo};${p.descricao};${(p.precoVenda / 100).toFixed(2)};${(p.precoPdv / 100).toFixed(2)};${format(new Date(p.updatedAt), "dd/MM/yyyy HH:mm")}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `etiquetas_diario_${dataInicio}_${dataFim}.csv`;
    link.click();
    toast.success("Relatório exportado");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Posição de Etiquetas Diário</h1>
            <p className="text-sm text-muted-foreground">
              Produtos atualizados no período (para impressão de etiquetas)
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
                    <TableHead className="text-right">Preço Venda</TableHead>
                    <TableHead className="text-right">Preço PDV</TableHead>
                    <TableHead>Atualizado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Carregando dados...
                      </TableCell>
                    </TableRow>
                  ) : produtosAtualizados.length > 0 ? (
                    <>
                      {produtosAtualizados.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono">{p.codigo}</TableCell>
                          <TableCell>{p.descricao}</TableCell>
                          <TableCell className="text-right">
                            R$ {(p.precoVenda / 100).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            R$ {(p.precoPdv / 100).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {format(new Date(p.updatedAt), "dd/MM/yyyy HH:mm")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Nenhum produto atualizado no período</p>
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
