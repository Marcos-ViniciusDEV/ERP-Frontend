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

export default function MesaDeMovimento() {
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split("T")[0]);
  const [dataFim, setDataFim] = useState(new Date().toISOString().split("T")[0]);

  const { data: vendas, isLoading, refetch } = useQuery({
    queryKey: ["mesa-movimento", dataInicio, dataFim],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dataInicio) params.append("dataInicio", dataInicio);
      if (dataFim) params.append("dataFim", dataFim);
      
      const { data } = await api.get(`/vendas?${params.toString()}`);
      return data;
    },
  });

  // Mesa de Movimento geralmente é uma lista detalhada cronológica
  const movimentos = vendas?.sort((a: any, b: any) => 
    new Date(b.dataVenda).getTime() - new Date(a.dataVenda).getTime()
  ) || [];

  const totalPeriodo = movimentos.reduce((acc: number, m: any) => 
    m.status !== "CANCELADA" ? acc + m.valorTotal : acc, 0
  );

  const handleSearch = () => {
    refetch();
  };

  const imprimirRelatorio = () => {
    if (!movimentos || movimentos.length === 0) {
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
          <title>Mesa de Movimento</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 10mm;
            }
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
              font-size: 9pt;
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
              padding: 4px 6px;
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
            .cancelada {
              color: #dc2626;
              text-decoration: line-through;
            }
            .total-row {
              font-weight: bold;
              background-color: #f0f0f0;
              font-size: 10pt;
            }
          </style>
        </head>
        <body>
          <h1>Mesa de Movimento</h1>
          <div class="info">
            Período: ${new Date(dataInicio).toLocaleDateString("pt-BR")} a ${new Date(dataFim).toLocaleDateString("pt-BR")}<br>
            Data de Emissão: ${new Date().toLocaleString("pt-BR")}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Doc.</th>
                <th>Cliente</th>
                <th>Vendedor</th>
                <th>Itens</th>
                <th class="text-right">Subtotal</th>
                <th class="text-right">Desc.</th>
                <th class="text-right">Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
    `;

    movimentos.forEach((m: any) => {
      const isCancelada = m.status === "CANCELADA";
      const styleClass = isCancelada ? "cancelada" : "";
      const statusLabel = isCancelada ? "CANCELADO" : "CONCLUÍDO";
      const qtdItens = m.itens?.reduce((acc: number, item: any) => acc + item.quantidade, 0) || 0;
      
      html += `
        <tr class="${styleClass}">
          <td>${format(new Date(m.dataVenda), "dd/MM/yyyy HH:mm")}</td>
          <td>${m.numeroVenda || m.id}</td>
          <td>${m.clienteNome || "Consumidor Final"}</td>
          <td>${m.operadorNome || "-"}</td>
          <td class="text-center">${qtdItens}</td>
          <td class="text-right">R$ ${((m.valorTotal + (m.desconto || 0)) / 100).toFixed(2)}</td>
          <td class="text-right">R$ ${((m.desconto || 0) / 100).toFixed(2)}</td>
          <td class="text-right">R$ ${(m.valorTotal / 100).toFixed(2)}</td>
          <td>${statusLabel}</td>
        </tr>
      `;
    });

    html += `
              <tr class="total-row">
                <td colspan="7">TOTAL LÍQUIDO (Vendas Válidas)</td>
                <td class="text-right">R$ ${(totalPeriodo / 100).toFixed(2)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>

          <div class="info">
            Total de Registros: ${movimentos.length}
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
    if (!movimentos || movimentos.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    let csv = "Data;Documento;Cliente;Vendedor;Itens;Subtotal;Desconto;Total;Status\n";

    movimentos.forEach((m: any) => {
      const qtdItens = m.itens?.reduce((acc: number, item: any) => acc + item.quantidade, 0) || 0;
      const subtotal = (m.valorTotal + (m.desconto || 0)) / 100;
      const desconto = (m.desconto || 0) / 100;
      const total = m.valorTotal / 100;
      
      csv += `${format(new Date(m.dataVenda), "dd/MM/yyyy HH:mm")};${m.numeroVenda || m.id};${m.clienteNome || "Consumidor Final"};${m.operadorNome || "-"};${qtdItens};${subtotal.toFixed(2)};${desconto.toFixed(2)};${total.toFixed(2)};${m.status}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `mesa_movimento_${dataInicio}_${dataFim}.csv`;
    link.click();
    toast.success("Relatório exportado");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mesa de Movimento</h1>
            <p className="text-sm text-muted-foreground">
              Listagem detalhada de todas as movimentações
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
                    <TableHead>Doc.</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="text-center">Itens</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Carregando dados...
                      </TableCell>
                    </TableRow>
                  ) : movimentos.length > 0 ? (
                    <>
                      {movimentos.map((m: any) => {
                        const isCancelada = m.status === "CANCELADA";
                        const qtdItens = m.itens?.reduce((acc: number, item: any) => acc + item.quantidade, 0) || 0;
                        
                        return (
                          <TableRow key={m.id} className={isCancelada ? "opacity-60 bg-red-50/30" : ""}>
                            <TableCell>{format(new Date(m.dataVenda), "dd/MM/yyyy HH:mm")}</TableCell>
                            <TableCell className="font-mono">{m.numeroVenda || m.id}</TableCell>
                            <TableCell>{m.clienteNome || "Consumidor Final"}</TableCell>
                            <TableCell>{m.operadorNome || "-"}</TableCell>
                            <TableCell className="text-center">{qtdItens}</TableCell>
                            <TableCell className={`text-right font-medium ${isCancelada ? "text-red-600 line-through" : ""}`}>
                              R$ {(m.valorTotal / 100).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <span className={`text-xs px-2 py-1 rounded-full ${isCancelada ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                                {isCancelada ? "CANCELADO" : "CONCLUÍDO"}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={5}>TOTAL LÍQUIDO (Vendas Válidas)</TableCell>
                        <TableCell className="text-right">
                          R$ {(totalPeriodo / 100).toFixed(2)}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Nenhuma movimentação encontrada no período</p>
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
