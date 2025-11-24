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
import JsBarcode from "jsbarcode";

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

  const gerarCodigoBarrasBase64 = (texto: string) => {
    try {
      const canvas = document.createElement("canvas");
      JsBarcode(canvas, texto, {
        format: "CODE128",
        width: 2,
        height: 40,
        displayValue: true,
        fontSize: 14,
        margin: 0
      });
      return canvas.toDataURL("image/png");
    } catch (e) {
      console.error("Erro ao gerar código de barras", e);
      return "";
    }
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
              font-family: 'Arial', sans-serif;
              -webkit-print-color-adjust: exact;
            }
            .etiquetas-container {
              display: grid;
              grid-template-columns: repeat(${colunasNum}, 1fr);
              gap: 2mm;
              padding: 2mm;
            }
            .etiqueta {
              width: ${largura}mm;
              height: ${altura}mm;
              border: 1px solid #000;
              padding: 2mm;
              display: flex;
              flex-direction: column;
              position: relative;
              page-break-inside: avoid;
              box-sizing: border-box;
              background: white;
              overflow: hidden;
            }
            
            /* Layout inspirado em gôndola de supermercado */
            .header {
              margin-bottom: 2px;
            }
            .descricao {
              font-size: 10pt;
              font-weight: 900;
              text-transform: uppercase;
              line-height: 1.1;
              height: 2.2em; /* Limita a 2 linhas */
              overflow: hidden;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
            }
            
            .info-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: auto;
            }
            
            .info-left {
              display: flex;
              flex-direction: column;
              justify-content: flex-end;
              font-size: 6pt;
            }
            
            .mercado-nome {
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 2px;
            }
            
            .data {
              font-family: monospace;
            }
            
            .preco-container {
              display: flex;
              align-items: flex-start;
              line-height: 1;
              font-weight: 900;
            }
            
            .moeda {
              font-size: 10pt;
              margin-top: 4px;
              margin-right: 2px;
            }
            
            .preco-valor {
              font-size: 28pt; /* Preço bem grande */
              letter-spacing: -1px;
            }
            
            .preco-centavos {
              font-size: 14pt;
              margin-top: 4px;
            }

            .barras-container {
              text-align: center;
              margin-top: 2px;
              padding-top: 2px;
              display: flex;
              justify-content: center;
            }
            
            .img-barras {
              max-width: 100%;
              height: 35px; /* Altura fixa para o código de barras */
              object-fit: contain;
            }

            /* Ajustes para etiquetas menores */
            ${altura < 40 ? `
              .descricao { font-size: 8pt; }
              .preco-valor { font-size: 20pt; }
              .moeda { font-size: 8pt; }
              .img-barras { height: 25px; }
            ` : ''}
          </style>
        </head>
        <body>
          <div class="etiquetas-container">
    `;

    const hoje = new Date().toLocaleDateString('pt-BR');

    etiquetas.forEach(etiqueta => {
      const preco = etiqueta.precoVenda / 100;
      const [inteiro, centavos] = preco.toFixed(2).split('.');
      
      // Gerar imagem do código de barras
      const codigoParaBarras = etiqueta.codigoBarras || etiqueta.codigo;
      const imgBase64 = gerarCodigoBarrasBase64(codigoParaBarras);
      
      for (let i = 0; i < etiqueta.quantidade; i++) {
        html += `
          <div class="etiqueta">
            <div class="header">
              <div class="descricao">${etiqueta.descricao}</div>
            </div>
            
            <div class="info-row">
              <div class="info-left">
                <div class="mercado-nome">SEU SUPERMERCADO</div>
                <div class="data">${hoje}</div>
                <div style="margin-top: 2px;">Cód: ${etiqueta.codigo}</div>
              </div>
              
              <div class="preco-container">
                <span class="moeda">R$</span>
                <span class="preco-valor">${inteiro}</span>
                <span class="preco-centavos">,${centavos}</span>
              </div>
            </div>

            <div class="barras-container">
              ${imgBase64 ? `<img src="${imgBase64}" class="img-barras" />` : ''}
            </div>
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
                            R$ {(produto.precoVenda / 100).toFixed(2)}
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
                          {(etiqueta.precoVenda / 100).toFixed(2)}
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
