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

export default function ResumoTipoMovimento() {
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split("T")[0]);
  const [dataFim, setDataFim] = useState(new Date().toISOString().split("T")[0]);

  const { data: vendas, isLoading, refetch } = useQuery({
    queryKey: ["tipo-movimento", dataInicio, dataFim],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dataInicio) params.append("dataInicio", dataInicio);
      if (dataFim) params.append("dataFim", dataFim);
      
      const { data } = await api.get(`/vendas?${params.toString()}`);
      return data;
    },
  });

  // Agrupar por Tipo (Status e Forma de Pagamento)
  const tiposMap = new Map();

  // Inicializar tipos básicos
  tiposMap.set("VENDA_CONCLUIDA", { tipo: "Venda Concluída", quantidade: 0, valorTotal: 0 });
  tiposMap.set("VENDA_CANCELADA", { tipo: "Venda Cancelada", quantidade: 0, valorTotal: 0 });

  vendas?.forEach((venda: any) => {
    if (venda.status === "CANCELADA") {
      const tipo = tiposMap.get("VENDA_CANCELADA");
      tipo.quantidade += 1;
      tipo.valorTotal += venda.valorTotal;
    } else {
      const tipo = tiposMap.get("VENDA_CONCLUIDA");
      tipo.quantidade += 1;
      tipo.valorTotal += venda.valorTotal;

      // Também agrupar por forma de pagamento como "subtipo"
      const forma = venda.formaPagamento || "DINHEIRO";
      const keyForma = `PAGAMENTO_${forma}`;
      if (!tiposMap.has(keyForma)) {
        tiposMap.set(keyForma, { tipo: `Pagamento: ${forma}`, quantidade: 0, valorTotal: 0, isSubtype: true });
      }
      const tipoForma = tiposMap.get(keyForma);
      tipoForma.quantidade += 1;
      tipoForma.valorTotal += venda.valorTotal;
    }
  });

  const tipos = Array.from(tiposMap.values());

  const handleSearch = () => {
    refetch();
  };

  const imprimirRelatorio = () => {
    if (!tipos || tipos.length === 0) {
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
          <title>Resumo de Tipo de Movimento</title>
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
            .subtype {
              padding-left: 20px;
              color: #555;
              font-style: italic;
            }
            .cancelada {
              color: #dc2626;
            }
          </style>
        </head>
        <body>
          <h1>Resumo de Tipo de Movimento</h1>
          <div class="info">
            Período: ${new Date(dataInicio).toLocaleDateString("pt-BR")} a ${new Date(dataFim).toLocaleDateString("pt-BR")}<br>
            Data de Emissão: ${new Date().toLocaleString("pt-BR")}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Tipo de Movimento</th>
                <th class="text-right">Quantidade</th>
                <th class="text-right">Valor Total</th>
              </tr>
            </thead>
            <tbody>
    `;

    tipos.forEach(t => {
      let styleClass = "";
      if (t.isSubtype) styleClass = "subtype";
      if (t.tipo === "Venda Cancelada") styleClass += " cancelada";

      html += `
        <tr>
          <td class="${styleClass}">${t.tipo}</td>
          <td class="text-right">${t.quantidade}</td>
          <td class="text-right">R$ ${(t.valorTotal / 100).toFixed(2)}</td>
        </tr>
      `;
    });

    html += `
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
    if (!tipos || tipos.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    let csv = "Tipo;Quantidade;Valor Total\n";

    tipos.forEach(t => {
      csv += `${t.tipo};${t.quantidade};${(t.valorTotal / 100).toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `tipo_movimento_${dataInicio}_${dataFim}.csv`;
    link.click();
    toast.success("Relatório exportado");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Resumo de Tipo de Movimento</h1>
            <p className="text-sm text-muted-foreground">
              Vendas agrupadas por status e forma de pagamento
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
                    <TableHead>Tipo de Movimento</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        Carregando dados...
                      </TableCell>
                    </TableRow>
                  ) : tipos.length > 0 ? (
                    <>
                      {tipos.map((t, idx) => (
                        <TableRow key={idx} className={t.isSubtype ? "bg-muted/20" : "font-medium"}>
                          <TableCell className={t.isSubtype ? "pl-8 text-muted-foreground" : ""}>
                            {t.tipo}
                          </TableCell>
                          <TableCell className="text-right">{t.quantidade}</TableCell>
                          <TableCell className={`text-right ${t.tipo === "Venda Cancelada" ? "text-red-600" : ""}`}>
                            R$ {(t.valorTotal / 100).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
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
