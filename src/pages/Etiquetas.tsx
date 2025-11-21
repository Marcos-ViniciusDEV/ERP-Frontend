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
import { Printer, Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { Produto } from "@/shared/schema";

interface EtiquetaItem {
  produtoId: number;
  codigo: string;
  codigoBarras: string | null;
  descricao: string;
  precoVenda: number;
  quantidade: number;
}

export default function Etiquetas() {
  const [etiquetas, setEtiquetas] = useState<EtiquetaItem[]>([]);
  const [busca, setBusca] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [tamanhoEtiqueta, setTamanhoEtiqueta] = useState("50x30");
  const [colunas, setColunas] = useState("3");

  const { data: produtos } = useQuery<Produto[]>({
    queryKey: ["produtos"],
    queryFn: async () => {
      const { data } = await api.get("/produtos");
      return data;
    }
  });

  const produtosFiltrados = produtos?.filter(
    p =>
      p.codigo.toLowerCase().includes(busca.toLowerCase()) ||
      (p.codigoBarras &&
        p.codigoBarras.toLowerCase().includes(busca.toLowerCase())) ||
      p.descricao.toLowerCase().includes(busca.toLowerCase())
  );

  const adicionarEtiqueta = (produto: Produto) => {
    const qtd = parseInt(quantidade) || 1;
    const existente = etiquetas.find(e => e.produtoId === produto.id);

    if (existente) {
      setEtiquetas(
        etiquetas.map(e =>
          e.produtoId === produto.id
            ? { ...e, quantidade: e.quantidade + qtd }
            : e
        )
      );
    } else {
      setEtiquetas([
        ...etiquetas,
        {
          produtoId: produto.id,
          codigo: produto.codigo,
          codigoBarras: produto.codigoBarras,
          descricao: produto.descricao,
          precoVenda: produto.precoVenda,
          quantidade: qtd,
        },
      ]);
    }

    toast.success(`${qtd} etiqueta(s) adicionada(s)`);
    setBusca("");
  };

  const removerEtiqueta = (produtoId: number) => {
    setEtiquetas(etiquetas.filter(e => e.produtoId !== produtoId));
    toast.success("Etiqueta removida");
  };

  const alterarQuantidade = (produtoId: number, novaQuantidade: number) => {
    if (novaQuantidade < 1) return;
    setEtiquetas(
      etiquetas.map(e =>
        e.produtoId === produtoId ? { ...e, quantidade: novaQuantidade } : e
      )
    );
  };

  const imprimirEtiquetas = () => {
    if (etiquetas.length === 0) {
      toast.error("Adicione pelo menos uma etiqueta para imprimir");
      return;
    }

    // Criar janela de impressão
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Não foi possível abrir janela de impressão");
      return;
    }

    const totalEtiquetas = etiquetas.reduce((sum, e) => sum + e.quantidade, 0);
    const colunasNum = parseInt(colunas);
    const [largura, altura] = tamanhoEtiqueta.split("x").map(v => parseInt(v));

    let html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Impressão de Etiquetas</title>
          <style>
            @page {
              size: A4;
              margin: 5mm;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
            .etiquetas-container {
              display: grid;
              grid-template-columns: repeat(${colunasNum}, 1fr);
              gap: 2mm;
              padding: 5mm;
            }
            .etiqueta {
              width: ${largura}mm;
              height: ${altura}mm;
              border: 1px solid #ccc;
              padding: 2mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              page-break-inside: avoid;
              box-sizing: border-box;
            }
            .etiqueta-codigo {
              font-size: 8pt;
              font-weight: bold;
            }
            .etiqueta-descricao {
              font-size: 7pt;
              overflow: hidden;
              text-overflow: ellipsis;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
            }
            .etiqueta-preco {
              font-size: 14pt;
              font-weight: bold;
              text-align: right;
            }
            .etiqueta-barras {
              font-size: 9pt;
              text-align: center;
              font-family: 'Courier New', monospace;
              letter-spacing: 2px;
            }
            @media print {
              .etiquetas-container {
                gap: 1mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="etiquetas-container">
    `;

    etiquetas.forEach(etiqueta => {
      for (let i = 0; i < etiqueta.quantidade; i++) {
        html += `
          <div class="etiqueta">
            <div class="etiqueta-codigo">${etiqueta.codigo}</div>
            <div class="etiqueta-descricao">${etiqueta.descricao}</div>
            <div class="etiqueta-barras">${etiqueta.codigoBarras || ''}</div>
            <div class="etiqueta-preco">R$ ${etiqueta.precoVenda.toFixed(2)}</div>
          </div>
        `;
      }
    });

    html += `
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
    toast.success(`${totalEtiquetas} etiqueta(s) enviada(s) para impressão`);
  };

  const totalEtiquetas = etiquetas.reduce((sum, e) => sum + e.quantidade, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Impressão de Etiquetas</h1>
          <Button onClick={imprimirEtiquetas} disabled={etiquetas.length === 0}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir ({totalEtiquetas})
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Painel de Busca e Seleção */}
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Produtos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Buscar Produto</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Código, código de barras ou descrição..."
                      value={busca}
                      onChange={e => setBusca(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Input
                    type="number"
                    min="1"
                    value={quantidade}
                    onChange={e => setQuantidade(e.target.value)}
                    className="w-20"
                    placeholder="Qtd"
                  />
                </div>
              </div>

              {busca && produtosFiltrados && produtosFiltrados.length > 0 && (
                <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Preço</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {produtosFiltrados.slice(0, 10).map(produto => (
                        <TableRow key={produto.id}>
                          <TableCell className="font-mono text-sm">
                            {produto.codigo}
                          </TableCell>
                          <TableCell className="text-sm">
                            {produto.descricao}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            R$ {produto.precoVenda.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => adicionarEtiqueta(produto)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Tamanho da Etiqueta</Label>
                  <Select
                    value={tamanhoEtiqueta}
                    onValueChange={setTamanhoEtiqueta}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50x30">50mm x 30mm</SelectItem>
                      <SelectItem value="60x40">60mm x 40mm</SelectItem>
                      <SelectItem value="70x40">70mm x 40mm</SelectItem>
                      <SelectItem value="100x50">100mm x 50mm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Colunas por Página</Label>
                  <Select value={colunas} onValueChange={setColunas}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 colunas</SelectItem>
                      <SelectItem value="3">3 colunas</SelectItem>
                      <SelectItem value="4">4 colunas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Etiquetas Selecionadas */}
          <Card>
            <CardHeader>
              <CardTitle>Etiquetas Selecionadas ({totalEtiquetas})</CardTitle>
            </CardHeader>
            <CardContent>
              {etiquetas.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Printer className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Nenhuma etiqueta selecionada</p>
                  <p className="text-sm">
                    Busque e adicione produtos para imprimir
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {etiquetas.map(etiqueta => (
                    <div
                      key={etiqueta.produtoId}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-slate-50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {etiqueta.descricao}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Código: {etiqueta.codigo} | R${" "}
                          {etiqueta.precoVenda.toFixed(2)}
                        </div>
                      </div>
                      <Input
                        type="number"
                        min="1"
                        value={etiqueta.quantidade}
                        onChange={e =>
                          alterarQuantidade(
                            etiqueta.produtoId,
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-20"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removerEtiqueta(etiqueta.produtoId)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
