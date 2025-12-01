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

export default function RelacaoProdutos() {
  const [filtroMarca, setFiltroMarca] = useState("todos");
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
          <title>Relação de Produtos</title>
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
          <h1>Relação de Produtos</h1>
          <div class="info">
            Data: ${new Date().toLocaleString("pt-BR")}<br>
            Filtros: ${filtroMarca !== "todos" ? `Marca: ${filtroMarca}` : "Todos"}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Descrição</th>
                <th>Marca</th>
                <th class="text-center">Unid.</th>
                <th class="text-right">Preço Venda</th>
                <th class="text-right">Estoque</th>
              </tr>
            </thead>
            <tbody>
    `;

    produtosFiltrados.forEach(produto => {
      html += `
        <tr>
          <td>${produto.codigo}</td>
          <td>${produto.descricao}</td>
          <td>${produto.marca || "-"}</td>
          <td class="text-center">${produto.unidade || "UN"}</td>
          <td class="text-right">R$ ${(produto.precoVenda / 100).toFixed(2)}</td>
          <td class="text-right">${produto.estoque}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>

          <div class="info">
            Total de Produtos: ${produtosFiltrados.length}
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
    if (!produtosFiltrados || produtosFiltrados.length === 0) {
      toast.error("Nenhum produto para exportar");
      return;
    }

    let csv = "Código;Descrição;Marca;Unidade;Preço Venda;Estoque\n";

    produtosFiltrados.forEach(produto => {
      csv += `${produto.codigo};${produto.descricao};${produto.marca || ""};${produto.unidade || "UN"};${(produto.precoVenda / 100).toFixed(2)};${produto.estoque}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relacao_produtos_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Relatório exportado");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Relação de Produtos</h1>
            <p className="text-sm text-muted-foreground">
              Listagem geral de produtos cadastrados
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </CardContent>
        </Card>

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
                    <TableHead className="text-center">Unid.</TableHead>
                    <TableHead className="text-right">Preço Venda</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtosFiltrados && produtosFiltrados.length > 0 ? (
                    produtosFiltrados.map(produto => (
                      <TableRow key={produto.id}>
                        <TableCell className="font-mono text-sm">
                          {produto.codigo}
                        </TableCell>
                        <TableCell>{produto.descricao}</TableCell>
                        <TableCell>{produto.marca || "-"}</TableCell>
                        <TableCell className="text-center">{produto.unidade || "UN"}</TableCell>
                        <TableCell className="text-right">
                          R$ {(produto.precoVenda / 100).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {produto.estoque}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
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
