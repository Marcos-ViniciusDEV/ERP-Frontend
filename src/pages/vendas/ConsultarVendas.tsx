import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Printer, Search, X } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ConsultarVendas() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [departamentoId, setDepartamentoId] = useState<string>("");

  // Buscar departamentos para o filtro
  const { data: departamentos } = useQuery({
    queryKey: ["departamentos"],
    queryFn: async () => {
      const { data } = await api.get("/departamentos");
      return data;
    },
  });

  const {
    data: vendas,
    isLoading,
    refetch,
    isFetched,
  } = useQuery({
    queryKey: ["vendas", dataInicio, dataFim, codigoBarras, departamentoId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dataInicio) params.append("dataInicio", dataInicio);
      if (dataFim) params.append("dataFim", dataFim);
      if (codigoBarras) params.append("codigoBarras", codigoBarras);
      if (departamentoId && departamentoId !== "all")
        params.append("departamentoId", departamentoId);

      const { data } = await api.get(`/vendas?${params.toString()}`);
      return data;
    },
    enabled: false,
  });

  const handleSearch = () => {
    refetch();
  };

  const handleClear = () => {
    setDataInicio("");
    setDataFim("");
    setCodigoBarras("");
    setDepartamentoId("");
  };

  const handlePrintReceipt = (venda: any) => {
    const couponWindow = window.open("", "_blank", "width=400,height=700");
    if (couponWindow) {
      couponWindow.document.write(`
        <html>
          <head>
            <title>Cupom Fiscal - ${venda.numeroVenda}</title>
            <style>
              body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 10px; }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .bold { font-weight: bold; }
              .divider { border-top: 1px dashed #000; margin: 5px 0; }
              table { width: 100%; border-collapse: collapse; }
              td { vertical-align: top; padding: 2px 0; }
            </style>
          </head>
          <body>
            <div class="text-center bold">MERCADO EXEMPLO LTDA</div>
            <div class="text-center">CNPJ: 12.345.678/0001-90</div>
            <div class="text-center">AV. BRASIL, 1000 - CENTRO</div>
            <div class="divider"></div>
            <div class="text-center bold">CUPOM FISCAL ELETRÔNICO</div>
            <div class="text-center">CCF: ${venda.ccf || "000000"} COO: ${
        venda.coo || "000000"
      }</div>
            <div class="text-center">PDV: ${venda.pdvId || "N/A"}</div>
            <div class="divider"></div>
            <div class="text-center">CONSUMIDOR NÃO IDENTIFICADO</div>
            <div class="divider"></div>
            <table>
              <tr>
                <td colspan="4" class="bold">ITEM CÓDIGO DESCRIÇÃO</td>
              </tr>
              <tr>
                <td class="bold">QTD</td>
                <td class="bold">UN</td>
                <td class="bold text-right">VL UNIT</td>
                <td class="bold text-right">VL TOTAL</td>
              </tr>
              ${(venda.itens || [])
                .map(
                  (item: any, index: number) => `
                <tr>
                  <td colspan="4">${(index + 1)
                    .toString()
                    .padStart(3, "0")} ${item.produtoId} ${
                    item.produtoNome || "Produto"
                  }</td>
                </tr>
                <tr>
                  <td>${item.quantidade}</td>
                  <td>UN</td>
                  <td class="text-right">${(item.precoUnitario / 100).toFixed(
                    2
                  )}</td>
                  <td class="text-right">${(item.total / 100).toFixed(2)}</td>
                </tr>
              `
                )
                .join("")}
            </table>
            <div class="divider"></div>
            ${
              venda.valorDesconto > 0
                ? `
              <div class="text-right">SUBTOTAL R$ ${(
                venda.valorTotal / 100
              ).toFixed(2)}</div>
              <div class="text-right">DESCONTO R$ -${(
                venda.valorDesconto / 100
              ).toFixed(2)}</div>
            `
                : ""
            }
            <div class="text-right bold" style="font-size: 14px">TOTAL R$ ${(
              venda.valorLiquido / 100
            ).toFixed(2)}</div>
            <div class="divider"></div>
            <div class="text-right">${venda.formaPagamento || "N/A"} R$ ${(
        venda.valorLiquido / 100
      ).toFixed(2)}</div>
            <div class="text-right">TROCO R$ 0.00</div>
            <div class="divider"></div>
            <div class="text-center">${new Date(
              venda.dataVenda
            ).toLocaleString("pt-BR")}</div>
            <div class="text-center">Operador: ${
              venda.operadorNome || "N/A"
            }</div>
            <div class="text-center" style="margin-top: 20px;">OBRIGADO PELA PREFERÊNCIA!</div>
            <div class="text-center" style="font-size: 10px; margin-top: 10px;">Sistema ERP - RP Info</div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      couponWindow.document.close();
    }
  };

  const totalBruto = vendas?.reduce(
    (acc: number, venda: any) => acc + venda.valorTotal,
    0
  );

  const totalDescontos = vendas?.reduce(
    (acc: number, venda: any) => acc + venda.valorDesconto,
    0
  );

  const totalLiquido = vendas?.reduce(
    (acc: number, venda: any) => acc + venda.valorLiquido,
    0
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Consultar Vendas
          </h1>
          <p className="text-muted-foreground mt-1">
            Consulte o histórico de vendas e visualize cupons fiscais
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros de Pesquisa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div>
                <Label htmlFor="dataInicio">Data Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dataFim">Data Fim</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="codigoBarras">Código de Barras</Label>
                <Input
                  id="codigoBarras"
                  placeholder="EAN..."
                  value={codigoBarras}
                  onChange={(e) => setCodigoBarras(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="departamento">Departamento</Label>
                <Select
                  value={departamentoId}
                  onValueChange={setDepartamentoId}
                >
                  <SelectTrigger id="departamento">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {departamentos?.map((dept: any) => (
                      <SelectItem key={dept.id} value={String(dept.id)}>
                        {dept.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSearch} className="flex-1">
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClear}
                  size="icon"
                  title="Limpar Filtros"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Resultados</span>
              {totalLiquido !== undefined && (
                <div className="flex gap-6 text-sm">
                  <div className="flex flex-col items-end">
                    <span className="text-muted-foreground">Total Bruto</span>
                    <span className="font-bold">
                      R$ {(totalBruto / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-muted-foreground">
                      Total Descontos
                    </span>
                    <span className="font-bold text-red-500">
                      - R$ {(totalDescontos / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-muted-foreground">Total Líquido</span>
                    <span className="font-bold text-green-600 text-lg">
                      R$ {(totalLiquido / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p className="text-muted-foreground">Carregando vendas...</p>
              </div>
            ) : !isFetched ? (
              <p className="text-muted-foreground text-center py-12">
                Utilize os filtros acima para buscar vendas.
              </p>
            ) : vendas && vendas.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>PDV</TableHead>
                    <TableHead>Venda</TableHead>
                    <TableHead>Operador</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendas.map((venda: any) => (
                    <TableRow key={venda.id}>
                      <TableCell>
                        {new Date(venda.dataVenda).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell>{venda.pdvId || "-"}</TableCell>
                      <TableCell className="font-medium">
                        {venda.numeroVenda}
                      </TableCell>
                      <TableCell>{venda.operadorNome || "-"}</TableCell>
                      <TableCell className="text-right font-bold">
                        R$ {(venda.valorLiquido / 100).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePrintReceipt(venda)}
                          title="Visualizar Cupom"
                        >
                          <Printer className="w-4 h-4 text-blue-600" />
                          <span className="ml-2">Cupom</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Nenhuma venda encontrada com os filtros selecionados.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
