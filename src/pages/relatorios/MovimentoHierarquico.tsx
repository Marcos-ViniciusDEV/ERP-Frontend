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
import { FileText, Printer, Download, Search, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Produto } from "@/shared/schema";

interface Departamento {
  id: number;
  nome: string;
}

export default function MovimentoHierarquico() {
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split("T")[0]);
  const [dataFim, setDataFim] = useState(new Date().toISOString().split("T")[0]);
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});

  // Buscar dados auxiliares
  const { data: produtos } = useQuery<Produto[]>({
    queryKey: ["produtos"],
    queryFn: async () => {
      const { data } = await api.get("/produtos");
      return data;
    }
  });

  const { data: departamentos } = useQuery<Departamento[]>({
    queryKey: ["departamentos"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/departamentos");
        return data;
      } catch (e) {
        return [];
      }
    }
  });

  // Buscar vendas
  const { data: vendas, isLoading, refetch } = useQuery({
    queryKey: ["vendas-hierarquico", dataInicio, dataFim],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dataInicio) params.append("dataInicio", dataInicio);
      if (dataFim) params.append("dataFim", dataFim);
      
      const { data } = await api.get(`/vendas?${params.toString()}`);
      return data;
    },
  });

  // Processamento dos dados
  const hierarquia = new Map();
  const produtoMap = new Map(produtos?.map(p => [p.id, p]));
  const deptMap = new Map(departamentos?.map(d => [d.id, d.nome]));

  vendas?.forEach((venda: any) => {
    if (venda.status === "CANCELADA") return;

    venda.itens.forEach((item: any) => {
      const produto = produtoMap.get(item.produtoId);
      const deptId = produto?.departamentoId || 0;
      const deptNome = deptMap.get(deptId) || "Sem Departamento";

      if (!hierarquia.has(deptNome)) {
        hierarquia.set(deptNome, {
          nome: deptNome,
          quantidade: 0,
          valorTotal: 0,
          produtos: new Map(),
        });
      }

      const dept = hierarquia.get(deptNome);
      dept.quantidade += item.quantidade;
      dept.valorTotal += item.valorTotal;

      const prodId = item.produtoId;
      if (!dept.produtos.has(prodId)) {
        dept.produtos.set(prodId, {
          codigo: produto?.codigo || "N/A",
          descricao: produto?.descricao || item.descricao,
          quantidade: 0,
          valorTotal: 0,
        });
      }

      const prod = dept.produtos.get(prodId);
      prod.quantidade += item.quantidade;
      prod.valorTotal += item.valorTotal;
    });
  });

  const dadosHierarquicos = Array.from(hierarquia.values()).sort((a, b) => b.valorTotal - a.valorTotal);
  
  // Converter mapas de produtos em arrays para renderização
  dadosHierarquicos.forEach(dept => {
    dept.produtosLista = Array.from(dept.produtos.values()).sort((a: any, b: any) => b.valorTotal - a.valorTotal);
  });

  const totalGeral = dadosHierarquicos.reduce(
    (acc, d) => ({
      quantidade: acc.quantidade + d.quantidade,
      valorTotal: acc.valorTotal + d.valorTotal,
    }),
    { quantidade: 0, valorTotal: 0 }
  );

  const toggleDept = (deptNome: string) => {
    setExpandedDepts(prev => ({
      ...prev,
      [deptNome]: !prev[deptNome]
    }));
  };

  const handleSearch = () => {
    refetch();
  };

  const imprimirRelatorio = () => {
    if (!dadosHierarquicos || dadosHierarquicos.length === 0) {
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
          <title>Movimento Hierárquico</title>
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
            .dept-row {
              background-color: #e0e0e0;
              font-weight: bold;
            }
            .prod-row td {
              padding-left: 20px;
              color: #444;
            }
            .total-row {
              font-weight: bold;
              background-color: #333;
              color: #fff;
            }
          </style>
        </head>
        <body>
          <h1>Movimento Hierárquico (Departamento / Produto)</h1>
          <div class="info">
            Período: ${new Date(dataInicio).toLocaleDateString("pt-BR")} a ${new Date(dataFim).toLocaleDateString("pt-BR")}<br>
            Data de Emissão: ${new Date().toLocaleString("pt-BR")}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Descrição</th>
                <th class="text-right">Quantidade</th>
                <th class="text-right">Valor Total</th>
                <th class="text-right">Part. %</th>
              </tr>
            </thead>
            <tbody>
    `;

    dadosHierarquicos.forEach(dept => {
      const partDept = totalGeral.valorTotal > 0 ? (dept.valorTotal / totalGeral.valorTotal) * 100 : 0;
      
      html += `
        <tr class="dept-row">
          <td>${dept.nome}</td>
          <td class="text-right">${dept.quantidade}</td>
          <td class="text-right">R$ ${(dept.valorTotal / 100).toFixed(2)}</td>
          <td class="text-right">${partDept.toFixed(2)}%</td>
        </tr>
      `;

      dept.produtosLista.forEach((prod: any) => {
        const partProd = dept.valorTotal > 0 ? (prod.valorTotal / dept.valorTotal) * 100 : 0;
        html += `
          <tr class="prod-row">
            <td>${prod.codigo} - ${prod.descricao}</td>
            <td class="text-right">${prod.quantidade}</td>
            <td class="text-right">R$ ${(prod.valorTotal / 100).toFixed(2)}</td>
            <td class="text-right">${partProd.toFixed(2)}%</td>
          </tr>
        `;
      });
    });

    html += `
              <tr class="total-row">
                <td>TOTAL GERAL</td>
                <td class="text-right">${totalGeral.quantidade}</td>
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
    if (!dadosHierarquicos || dadosHierarquicos.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    let csv = "Tipo;Departamento;Produto;Quantidade;Valor Total\n";

    dadosHierarquicos.forEach(dept => {
      csv += `DEPARTAMENTO;${dept.nome};;${dept.quantidade};${(dept.valorTotal / 100).toFixed(2)}\n`;
      dept.produtosLista.forEach((prod: any) => {
        csv += `PRODUTO;${dept.nome};${prod.codigo} - ${prod.descricao};${prod.quantidade};${(prod.valorTotal / 100).toFixed(2)}\n`;
      });
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `movimento_hierarquico_${dataInicio}_${dataFim}.csv`;
    link.click();
    toast.success("Relatório exportado");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Movimento Hierárquico</h1>
            <p className="text-sm text-muted-foreground">
              Vendas agrupadas por Departamento e Produto
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
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
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
                  ) : dadosHierarquicos.length > 0 ? (
                    <>
                      {dadosHierarquicos.map((dept, idx) => {
                        const isExpanded = expandedDepts[dept.nome];
                        const partDept = totalGeral.valorTotal > 0 ? (dept.valorTotal / totalGeral.valorTotal) * 100 : 0;

                        return (
                          <>
                            <TableRow 
                              key={`dept-${idx}`} 
                              className="bg-muted/30 hover:bg-muted/50 cursor-pointer font-medium"
                              onClick={() => toggleDept(dept.nome)}
                            >
                              <TableCell>
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </TableCell>
                              <TableCell>{dept.nome}</TableCell>
                              <TableCell className="text-right">{dept.quantidade}</TableCell>
                              <TableCell className="text-right">
                                R$ {(dept.valorTotal / 100).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {partDept.toFixed(2)}%
                              </TableCell>
                            </TableRow>
                            {isExpanded && dept.produtosLista.map((prod: any, pIdx: number) => {
                              const partProd = dept.valorTotal > 0 ? (prod.valorTotal / dept.valorTotal) * 100 : 0;
                              return (
                                <TableRow key={`prod-${idx}-${pIdx}`} className="text-sm">
                                  <TableCell></TableCell>
                                  <TableCell className="pl-8 text-muted-foreground">
                                    {prod.codigo} - {prod.descricao}
                                  </TableCell>
                                  <TableCell className="text-right text-muted-foreground">{prod.quantidade}</TableCell>
                                  <TableCell className="text-right text-muted-foreground">
                                    R$ {(prod.valorTotal / 100).toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-right text-muted-foreground text-xs">
                                    {partProd.toFixed(2)}%
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </>
                        );
                      })}
                      <TableRow className="bg-muted font-bold">
                        <TableCell></TableCell>
                        <TableCell>TOTAL GERAL</TableCell>
                        <TableCell className="text-right">{totalGeral.quantidade}</TableCell>
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
