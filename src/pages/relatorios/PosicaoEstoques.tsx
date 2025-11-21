import { useState } from "react";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Printer, Download } from "lucide-react";
import { toast } from "sonner";
import { Produto } from "@/shared/schema";

export default function PosicaoEstoques() {
  const [filtroMarca, setFiltroMarca] = useState("todos");
  const [filtroEstoque, setFiltroEstoque] = useState("todos");
  const [busca, setBusca] = useState("");

  const { data: produtos } = useQuery<Produto[]>({
    queryKey: ["produtos"],
    queryFn: async () => {
      const { data } = await api.get("/produtos");
      return data;
    }
  });

  const produtosFiltrados = produtos?.filter(p => {
    if (filtroMarca !== "todos" && p.marca !== filtroMarca) return false;
    if (filtroEstoque === "positivo" && p.estoque <= 0) return false;
    if (filtroEstoque === "zerado" && p.estoque !== 0) return false;
    if (filtroEstoque === "negativo" && p.estoque >= 0) return false;
    if (
      filtroEstoque === "baixo" &&
      (p.estoque > p.estoqueMinimo || p.estoque <= 0)
    )
      return false;

    if (busca) {
      const buscaLower = busca.toLowerCase();
      return (
        p.codigo.toLowerCase().includes(buscaLower) ||
        p.descricao.toLowerCase().includes(buscaLower) ||
        (p.marca && p.marca.toLowerCase().includes(buscaLower))
      );
    }

    return true;
  });

  const marcas = Array.from(
    new Set(produtos?.map(p => p.marca).filter(Boolean))
  );

  const totalEstoque =
    produtosFiltrados?.reduce((sum, p) => sum + p.estoque, 0) || 0;
  const totalValorCusto =
    produtosFiltrados?.reduce((sum, p) => sum + p.estoque * p.precoCusto, 0) ||
    0;
  const totalValorVenda =
    produtosFiltrados?.reduce((sum, p) => sum + p.estoque * p.precoVenda, 0) ||
    0;

  const imprimirRelatorio = () => {
    if (!produtosFiltrados || produtosFiltrados.length === 0) {
      toast.error("Nenhum produto para imprimir");
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
          <title>Posição dos Estoques</title>
          <style>
            @page {
              size: A4 landscape;
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
            .totais {
              margin-top: 20px;
              padding: 10px;
              background-color: #f5f5f5;
              border: 1px solid #ddd;
            }
            .totais-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
            }
            .total-item {
              text-align: center;
            }
            .total-label {
              font-size: 9pt;
              color: #666;
            }
            .total-value {
              font-size: 14pt;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <h1>Posição dos Estoques</h1>
          <div class="info">
            Data: ${new Date().toLocaleString("pt-BR")}<br>
            Filtros: ${filtroMarca !== "todos" ? `Marca: ${filtroMarca}` : ""}
            ${filtroEstoque !== "todos" ? `Estoque: ${filtroEstoque}` : ""}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Descrição</th>
                <th>Marca</th>
                <th class="text-right">Estoque</th>
                <th class="text-right">Custo Unit.</th>
                <th class="text-right">Venda Unit.</th>
                <th class="text-right">Valor Custo</th>
                <th class="text-right">Valor Venda</th>
              </tr>
            </thead>
            <tbody>
    `;

    produtosFiltrados.forEach(produto => {
      const valorCusto = produto.estoque * produto.precoCusto;
      const valorVenda = produto.estoque * produto.precoVenda;

      html += `
        <tr>
          <td>${produto.codigo}</td>
          <td>${produto.descricao}</td>
          <td>${produto.marca || "-"}</td>
          <td class="text-right">${produto.estoque}</td>
          <td class="text-right">R$ ${produto.precoCusto.toFixed(2)}</td>
          <td class="text-right">R$ ${produto.precoVenda.toFixed(2)}</td>
          <td class="text-right">R$ ${valorCusto.toFixed(2)}</td>
          <td class="text-right">R$ ${valorVenda.toFixed(2)}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>

          <div class="totais">
            <div class="totais-grid">
              <div class="total-item">
                <div class="total-label">Total de Produtos</div>
                <div class="total-value">${produtosFiltrados.length}</div>
              </div>
              <div class="total-item">
                <div class="total-label">Valor Total (Custo)</div>
                <div class="total-value">R$ ${totalValorCusto.toFixed(2)}</div>
              </div>
              <div class="total-item">
                <div class="total-label">Valor Total (Venda)</div>
                <div class="total-value">R$ ${totalValorVenda.toFixed(2)}</div>
              </div>
            </div>
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
    toast.success("Relatório enviado para impressão");
  };

  const exportarCSV = () => {
    if (!produtosFiltrados || produtosFiltrados.length === 0) {
      toast.error("Nenhum produto para exportar");
      return;
    }

    let csv =
      "Código;Descrição;Marca;Estoque;Custo Unitário;Venda Unitário;Valor Custo;Valor Venda\n";

    produtosFiltrados.forEach(produto => {
      const valorCusto = produto.estoque * produto.precoCusto;
      const valorVenda = produto.estoque * produto.precoVenda;

      csv += `${produto.codigo};${produto.descricao};${produto.marca || ""};${produto.estoque};${produto.precoCusto.toFixed(2)};${produto.precoVenda.toFixed(2)};${valorCusto.toFixed(2)};${valorVenda.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `posicao_estoques_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Relatório exportado");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Posição dos Estoques</h1>
            <p className="text-sm text-muted-foreground">
              Visualização completa do estoque atual
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportarCSV}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Button onClick={imprimirRelatorio}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Buscar</Label>
                <Input
                  placeholder="Código ou descrição..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Marca</Label>
                <Select value={filtroMarca} onValueChange={setFiltroMarca}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    {marcas.map(marca => (
                      <SelectItem key={marca || ""} value={marca || ""}>
                        {marca}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Situação do Estoque</Label>
                <Select value={filtroEstoque} onValueChange={setFiltroEstoque}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="positivo">Estoque Positivo</SelectItem>
                    <SelectItem value="zerado">Estoque Zerado</SelectItem>
                    <SelectItem value="negativo">Estoque Negativo</SelectItem>
                    <SelectItem value="baixo">Estoque Baixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Totalizadores */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">
                  Total de Produtos
                </div>
                <div className="text-2xl font-bold">
                  {produtosFiltrados?.length || 0}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">
                  Quantidade Total
                </div>
                <div className="text-2xl font-bold">{totalEstoque}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">
                  Valor Total (Custo)
                </div>
                <div className="text-2xl font-bold">
                  R$ {totalValorCusto.toFixed(2)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">
                  Valor Total (Venda)
                </div>
                <div className="text-2xl font-bold text-green-600">
                  R$ {totalValorVenda.toFixed(2)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Produtos */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                    <TableHead className="text-right">Custo Unit.</TableHead>
                    <TableHead className="text-right">Venda Unit.</TableHead>
                    <TableHead className="text-right">Valor Custo</TableHead>
                    <TableHead className="text-right">Valor Venda</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtosFiltrados && produtosFiltrados.length > 0 ? (
                    produtosFiltrados.map(produto => {
                      const valorCusto = produto.estoque * produto.precoCusto;
                      const valorVenda = produto.estoque * produto.precoVenda;

                      return (
                        <TableRow key={produto.id}>
                          <TableCell className="font-mono text-sm">
                            {produto.codigo}
                          </TableCell>
                          <TableCell>{produto.descricao}</TableCell>
                          <TableCell>{produto.marca || "-"}</TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              produto.estoque <= 0
                                ? "text-red-600"
                                : produto.estoque <= produto.estoqueMinimo
                                  ? "text-orange-600"
                                  : ""
                            }`}
                          >
                            {produto.estoque}
                          </TableCell>
                          <TableCell className="text-right">
                            R$ {produto.precoCusto.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            R$ {produto.precoVenda.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            R$ {valorCusto.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            R$ {valorVenda.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-12 text-muted-foreground"
                      >
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Nenhum produto encontrado</p>
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
