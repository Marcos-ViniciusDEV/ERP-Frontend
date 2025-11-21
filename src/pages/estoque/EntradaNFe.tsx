import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { trpc } from "@/lib/trpc";
import { Upload, FileText, ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function EntradaNFe() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [nfeData, setNfeData] = useState<any>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedNfeDetails, setSelectedNfeDetails] = useState<any>(null);
  
  const { data: produtos, refetch: refetchProdutos } = trpc.produtos.list.useQuery();
  const { data: movimentacoes } = trpc.kardex.listByProduto.useQuery(
    { produtoId: 0 },
    { enabled: false }
  );
  const createMovimentacao = trpc.kardex.create.useMutation();

  // Agrupar movimentações de entrada por NFe
  const entradasPorNfe: Record<string, any[]> = {};
  movimentacoes?.forEach((mov: any) => {
    if (mov.tipo === "ENTRADA_NFE" && mov.documentoReferencia) {
      if (!entradasPorNfe[mov.documentoReferencia]) {
        entradasPorNfe[mov.documentoReferencia] = [];
      }
      entradasPorNfe[mov.documentoReferencia].push(mov);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith(".xml")) {
        setSelectedFile(file);
        parseXML(file);
      } else {
        toast.error("Por favor, selecione um arquivo XML válido");
      }
    }
  };

  const parseXML = async (file: File) => {
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");

      const nfeNumber = xmlDoc.querySelector("nNF")?.textContent || "N/A";
      const fornecedor = xmlDoc.querySelector("emit xNome")?.textContent || "N/A";
      const cnpjFornecedor = xmlDoc.querySelector("emit CNPJ")?.textContent || "";
      const dataEmissao = xmlDoc.querySelector("dhEmi")?.textContent || "N/A";

      const items = Array.from(xmlDoc.querySelectorAll("det")).map((det) => {
        const codigo = det.querySelector("cProd")?.textContent || "";
        const descricao = det.querySelector("xProd")?.textContent || "";
        const quantidade = parseFloat(det.querySelector("qCom")?.textContent || "0");
        const valorUnitario = parseFloat(det.querySelector("vUnCom")?.textContent || "0");
        const valorTotal = parseFloat(det.querySelector("vProd")?.textContent || "0");

        return {
          codigo,
          descricao,
          quantidade,
          valorUnitario: Math.round(valorUnitario * 100),
          valorTotal: Math.round(valorTotal * 100),
        };
      });

      const valorTotalNota = items.reduce((acc, item) => acc + item.valorTotal, 0);

      setNfeData({
        numero: nfeNumber,
        fornecedor,
        cnpjFornecedor,
        dataEmissao,
        valorTotal: valorTotalNota,
        items,
      });

      toast.success("XML processado com sucesso!");
    } catch (error) {
      toast.error("Erro ao processar XML. Verifique o formato do arquivo.");
      console.error(error);
    }
  };

  const handleImportNFe = async () => {
    if (!nfeData || !nfeData.items || nfeData.items.length === 0) {
      toast.error("Nenhum item para importar");
      return;
    }

    try {
      let importedCount = 0;
      let skippedCount = 0;

      for (const item of nfeData.items) {
        const produto = produtos?.find((p: { id: number; codigo: string; estoque: number }) => p.codigo === item.codigo);

        if (produto) {
          await createMovimentacao.mutateAsync({
            produtoId: produto.id,
            tipo: "ENTRADA_NFE",
            quantidade: item.quantidade,
            saldoAnterior: produto.estoque,
            saldoAtual: produto.estoque + item.quantidade,
            custoUnitario: item.valorUnitario,
            documentoReferencia: `NFE-${nfeData.numero}`,
            observacao: `Entrada via NFe ${nfeData.numero} - ${nfeData.fornecedor}`,
          });
          importedCount++;
        } else {
          skippedCount++;
        }
      }

      toast.success(
        `NFe importada! ${importedCount} itens processados, ${skippedCount} itens ignorados (produto não cadastrado).`
      );
      refetchProdutos();
      setNfeData(null);
      setSelectedFile(null);
    } catch (error) {
      toast.error("Erro ao importar NFe");
      console.error(error);
    }
  };

  const handleViewDetails = (nfeKey: string) => {
    const itens = entradasPorNfe[nfeKey];
    if (itens && itens.length > 0) {
      const primeiroItem = itens[0];
      const observacao = primeiroItem.observacao || "";
      const fornecedor = observacao.split(" - ")[1] || "Fornecedor Desconhecido";
      
      setSelectedNfeDetails({
        numero: nfeKey,
        fornecedor,
        dataEntrada: primeiroItem.createdAt,
        itens,
      });
      setDetailsOpen(true);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Entrada de NFe</h1>
          <p className="text-muted-foreground mt-1">
            Importe notas fiscais eletrônicas (XML) para dar entrada no estoque
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload de XML da NFe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="xml-file">Selecione o arquivo XML</Label>
              <div className="flex items-center gap-4 mt-2">
                <Input
                  id="xml-file"
                  type="file"
                  accept=".xml"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                {selectedFile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{selectedFile.name}</span>
                  </div>
                )}
              </div>
            </div>

            {nfeData && (
              <div className="space-y-4 pt-4 border-t">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Fornecedor</Label>
                        <p className="text-lg font-bold text-blue-900">{nfeData.fornecedor}</p>
                        <p className="text-xs text-muted-foreground">{nfeData.cnpjFornecedor}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Número da NFe</Label>
                        <p className="text-lg font-bold text-blue-900">{nfeData.numero}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(nfeData.dataEmissao).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">Valor Total da Nota</Label>
                        <p className="text-2xl font-bold text-green-600">
                          R$ {(nfeData.valorTotal / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {nfeData.items.length} itens na nota
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Itens da NFe ({nfeData.items.length})
                  </Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                        <TableHead className="text-right">Valor Unit.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nfeData.items.map((item: any, index: number) => {
                        const produtoExiste = produtos?.find((p: { codigo: string }) => p.codigo === item.codigo);
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.codigo}</TableCell>
                            <TableCell>{item.descricao}</TableCell>
                            <TableCell className="text-right">{item.quantidade}</TableCell>
                            <TableCell className="text-right">
                              R$ {(item.valorUnitario / 100).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              R$ {(item.valorTotal / 100).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {produtoExiste ? (
                                <span className="text-green-600 text-xs">✓ Cadastrado</span>
                              ) : (
                                <span className="text-red-600 text-xs">✗ Não cadastrado</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNfeData(null);
                      setSelectedFile(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleImportNFe} disabled={createMovimentacao.isPending}>
                    <Upload className="h-4 w-4 mr-2" />
                    {createMovimentacao.isPending ? "Importando..." : "Importar NFe"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entradas Recentes (Agrupadas por NFe)</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(entradasPorNfe).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(entradasPorNfe).map(([nfeKey, itens]) => {
                  const valorTotal = itens.reduce(
                    (acc, item: any) => acc + (item.custoUnitario || 0) * item.quantidade,
                    0
                  );
                  const primeiroItem = itens[0];
                  const observacao = primeiroItem.observacao || "";
                  const fornecedor = observacao.split(" - ")[1] || "Fornecedor Desconhecido";

                  return (
                    <Card
                      key={nfeKey}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleViewDetails(nfeKey)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              <p className="font-bold text-lg">{fornecedor}</p>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {nfeKey} • {itens.length} itens •{" "}
                              {new Date(primeiroItem.createdAt).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">
                              R$ {(valorTotal / 100).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">Valor total da nota</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhuma entrada de NFe registrada.</p>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Detalhes da NFe */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Detalhes da NFe - {selectedNfeDetails?.fornecedor}
              </DialogTitle>
            </DialogHeader>
            {selectedNfeDetails && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Número da NFe</Label>
                    <p className="text-sm font-medium">{selectedNfeDetails.numero}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Fornecedor</Label>
                    <p className="text-sm font-medium">{selectedNfeDetails.fornecedor}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Data de Entrada</Label>
                    <p className="text-sm font-medium">
                      {new Date(selectedNfeDetails.dataEntrada).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="text-right">Custo Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedNfeDetails.itens.map((item: any) => {
                      const produto = produtos?.find((p: { id: number; codigo: string; descricao: string }) => p.id === item.produtoId);
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {produto?.codigo} - {produto?.descricao}
                          </TableCell>
                          <TableCell className="text-right">{item.quantidade}</TableCell>
                          <TableCell className="text-right">
                            R$ {((item.custoUnitario || 0) / 100).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            R$ {(((item.custoUnitario || 0) * item.quantidade) / 100).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
