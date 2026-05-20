import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  History,
  Printer,
  ReceiptText,
  RotateCcw,
  Save,
  Search,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type ReturnCondition = "GOOD" | "DAMAGED";
type ReturnOperation = "DEVOLUCAO" | "TROCA";

interface Cliente {
  id: number;
  nome: string;
  cpfCnpj?: string | null;
  telefone?: string | null;
}

interface SaleItem {
  id: number;
  produtoId: number;
  produtoCodigo?: string;
  produtoCodigoBarras?: string;
  produtoNome: string;
  quantidade: number;
  returnedQuantity: number;
  availableQuantity: number;
  precoUnitario: number;
  total: number;
}

interface Sale {
  id: number;
  numeroVenda: string;
  ccf?: string;
  coo?: string;
  pdvId?: string;
  nfceNumero?: string;
  nfceChave?: string;
  dataVenda: string;
  valorLiquido: number;
  formaPagamento?: string;
  status: string;
  operadorNome?: string;
  clienteNome?: string;
  clienteId?: number;
  itens: SaleItem[];
}

interface SelectedReturnItem {
  productId: number;
  quantity: number;
  condition: ReturnCondition;
}

const currency = (value: number) =>
  (Number(value || 0) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const dateTime = (value?: string) =>
  value ? new Date(value).toLocaleString("pt-BR") : "-";

const onlyDigits = (value?: string | null) => String(value || "").replace(/\D/g, "");

export default function GestaoDevolucoes() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [sale, setSale] = useState<Sale | null>(null);
  const [operation, setOperation] = useState<ReturnOperation>("TROCA");
  const [selectedItems, setSelectedItems] = useState<SelectedReturnItem[]>([]);
  const [reason, setReason] = useState("");

  const { data: returnsData, isLoading: isLoadingReturns } = useQuery({
    queryKey: ["returns"],
    queryFn: async () => {
      const response = await api.get("/returns");
      return response.data.data || [];
    },
  });

  const { data: purchasesData, isLoading: isLoadingPurchases } = useQuery({
    queryKey: ["vendas-trocas"],
    queryFn: async () => {
      const response = await api.get("/vendas");
      return response.data || [];
    },
  });

  const { data: clientesData } = useQuery({
    queryKey: ["clientes", searchTerm],
    enabled: searchTerm.trim().length >= 2,
    queryFn: async () => {
      const response = await api.get("/clientes", {
        params: { search: searchTerm.trim() },
      });
      return response.data || [];
    },
  });

  const searchSale = useMutation({
    mutationFn: async (coupon: string) => {
      const response = await api.get(`/returns/cupom/${encodeURIComponent(coupon)}`);
      return response.data.data as Sale;
    },
    onSuccess: (data) => {
      setSale(data);
      setSelectedItems([]);
      setReason("");
      toast.success("Compra carregada para troca/devolução");
    },
    onError: () => {
      toast.error("Compra ou cupom não encontrado");
    },
  });

  const selectedSaleItems = useMemo(() => {
    if (!sale) return [];
    return selectedItems
      .map((selected) => {
        const item = sale.itens.find((saleItem) => saleItem.produtoId === selected.productId);
        return item ? { ...item, selectedQuantity: selected.quantity, condition: selected.condition } : null;
      })
      .filter(Boolean) as Array<SaleItem & { selectedQuantity: number; condition: ReturnCondition }>;
  }, [sale, selectedItems]);

  const totalSelecionado = useMemo(
    () => selectedSaleItems.reduce((total, item) => total + item.precoUnitario * item.selectedQuantity, 0),
    [selectedSaleItems]
  );

  const printExchangeNote = (noteNumber: string) => {
    if (!sale || selectedSaleItems.length === 0) return;

    const printWindow = window.open("", "_blank", "width=420,height=760");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Nota Fiscal de Troca - ${noteNumber}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 12px; color: #111; }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #111; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 2px 0; vertical-align: top; }
            .value { font-size: 18px; font-weight: 700; text-align: center; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="center bold">NOTA FISCAL DE TROCA</div>
          <div class="center">Crédito para usar como dinheiro</div>
          <div class="divider"></div>
          <div>Nota: <span class="bold">${noteNumber}</span></div>
          <div>Venda origem: ${sale.numeroVenda}</div>
          <div>CCF: ${sale.ccf || "000000"} COO: ${sale.coo || "000000"}</div>
          <div>Emissão: ${new Date().toLocaleString("pt-BR")}</div>
          <div class="divider"></div>
          <table>
            ${selectedSaleItems
              .map(
                (item, index) => `
                  <tr><td colspan="2">${String(index + 1).padStart(3, "0")} ${item.produtoNome}</td></tr>
                  <tr>
                    <td>${item.selectedQuantity} x ${currency(item.precoUnitario)}</td>
                    <td class="right">${currency(item.precoUnitario * item.selectedQuantity)}</td>
                  </tr>
                `
              )
              .join("")}
          </table>
          <div class="divider"></div>
          <div class="center">VALOR DO CRÉDITO</div>
          <div class="value">${currency(totalSelecionado)}</div>
          <div class="divider"></div>
          <div>Use este valor como pagamento em uma nova compra.</div>
          <div>Motivo: ${reason || "-"}</div>
          <div class="divider"></div>
          <div class="center">Assinatura do cliente</div>
          <br />
          <div class="divider"></div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const createReturn = useMutation({
    mutationFn: async () => {
      if (!sale) throw new Error("Venda não carregada");
      const response = await api.post("/returns", {
        originalSaleId: sale.id,
        operation,
        reason,
        items: selectedItems,
      });
      return response.data;
    },
    onSuccess: (response) => {
      const noteNumber = response?.data?.exchangeNote?.numero || `NT-${String(response?.data?.id || "").padStart(6, "0")}`;
      if (operation === "TROCA") {
        printExchangeNote(noteNumber);
      }

      toast.success(operation === "TROCA" ? "Troca registrada e nota gerada" : "Devolução registrada com sucesso");
      setSale(null);
      setSelectedItems([]);
      setReason("");
      setOperation("TROCA");
      queryClient.invalidateQueries({ queryKey: ["returns"] });
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      queryClient.invalidateQueries({ queryKey: ["vendas-trocas"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Erro ao registrar troca/devolução");
    },
  });

  const returns = Array.isArray(returnsData) ? returnsData : [];
  const purchases = Array.isArray(purchasesData) ? purchasesData : [];
  const clientes = Array.isArray(clientesData) ? clientesData : [];
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const searchDigits = onlyDigits(searchTerm);

  const filteredPurchases = useMemo(() => {
    const filtered = purchases.filter((purchase: any) => {
      if (!normalizedSearch) return true;

      const fields = [
        purchase.numeroVenda,
        purchase.ccf,
        purchase.coo,
        purchase.nfceNumero,
        purchase.nfceChave,
        purchase.clienteNome,
        purchase.operadorNome,
      ].map((value) => String(value || "").toLowerCase());

      const textMatch = fields.some((field) => field.includes(normalizedSearch));
      const digitMatch = searchDigits
        ? [purchase.numeroVenda, purchase.ccf, purchase.coo, purchase.nfceNumero, purchase.nfceChave]
            .map(onlyDigits)
            .some((field) => field.includes(searchDigits))
        : false;

      return textMatch || digitMatch;
    });

    return filtered.slice(0, 30);
  }, [normalizedSearch, purchases, searchDigits]);

  const loadPurchase = (purchase: any) => {
    const coupon = purchase.numeroVenda || purchase.coo || purchase.ccf || purchase.id;
    searchSale.mutate(String(coupon));
  };

  const selectedFor = (productId: number) =>
    selectedItems.find((item) => item.productId === productId);

  const toggleItem = (item: SaleItem, checked: boolean) => {
    if (checked) {
      setSelectedItems((current) => [
        ...current,
        {
          productId: item.produtoId,
          quantity: Math.min(1, item.availableQuantity),
          condition: "GOOD",
        },
      ]);
      return;
    }

    setSelectedItems((current) => current.filter((selected) => selected.productId !== item.produtoId));
  };

  const updateItem = (productId: number, patch: Partial<SelectedReturnItem>) => {
    setSelectedItems((current) =>
      current.map((item) => (item.productId === productId ? { ...item, ...patch } : item))
    );
  };

  const handleSubmit = () => {
    if (!sale) {
      toast.error("Selecione uma compra antes de registrar");
      return;
    }
    if (selectedItems.length === 0) {
      toast.error("Selecione ao menos um item");
      return;
    }
    if (!reason.trim()) {
      toast.error("Informe o motivo");
      return;
    }
    createReturn.mutate();
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Trocas e Devoluções</h1>
            <p className="text-sm text-muted-foreground">
              Consulte as compras, selecione os itens e gere o crédito de troca.
            </p>
          </div>
          <Badge variant="outline" className="h-8 px-3">
            Crédito de troca
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Compras do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="space-y-1">
                <Label htmlFor="searchTerm">Cliente, CPF/CNPJ, número da venda, CCF, COO ou NFC-e</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="searchTerm"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="pl-9"
                    placeholder="Digite o cliente ou o cupom fiscal..."
                  />
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!searchTerm.trim() || searchSale.isPending}
                  onClick={() => searchSale.mutate(searchTerm.trim())}
                  className="w-full md:w-auto"
                >
                  <ReceiptText className="mr-2 h-4 w-4" />
                  Buscar Cupom
                </Button>
              </div>
            </div>

            {clientes.length > 0 && (
              <div className="grid gap-2 md:grid-cols-3">
                {clientes.slice(0, 6).map((cliente: Cliente) => (
                  <div key={cliente.id} className="rounded-md border bg-muted/30 p-3 text-sm">
                    <div className="flex items-center gap-2 font-medium">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {cliente.nome}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {cliente.cpfCnpj || "Sem CPF/CNPJ"} {cliente.telefone ? `| ${cliente.telefone}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Compra</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Cupom</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Selecionar cupom</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingPurchases ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        Carregando compras...
                      </TableCell>
                    </TableRow>
                  ) : filteredPurchases.length > 0 ? (
                    filteredPurchases.map((purchase: any) => (
                      <TableRow key={purchase.id} className={sale?.id === purchase.id ? "bg-muted/50" : ""}>
                        <TableCell>
                          <div className="font-medium">{purchase.numeroVenda}</div>
                          <div className="text-xs text-muted-foreground">
                            {purchase.clienteNome || "Cliente não identificado"}
                          </div>
                        </TableCell>
                        <TableCell>{dateTime(purchase.dataVenda)}</TableCell>
                        <TableCell>
                          <div className="text-xs">CCF {purchase.ccf || "-"}</div>
                          <div className="text-xs">COO {purchase.coo || "-"}</div>
                        </TableCell>
                        <TableCell>{purchase.itens?.length || 0}</TableCell>
                        <TableCell className="text-right font-mono">{currency(purchase.valorLiquido)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={searchSale.isPending}
                            onClick={() => loadPurchase(purchase)}
                          >
                            Selecionar cupom
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        Nenhuma compra encontrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {sale && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Compra Selecionada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 text-sm md:grid-cols-5">
                  <div>
                    <p className="text-muted-foreground">Venda</p>
                    <p className="font-semibold">{sale.numeroVenda}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">CCF / COO</p>
                    <p className="font-semibold">{sale.ccf || "-"} / {sale.coo || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Data</p>
                    <p className="font-semibold">{dateTime(sale.dataVenda)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pagamento</p>
                    <p className="font-semibold">{sale.formaPagamento || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-semibold text-green-600">{currency(sale.valorLiquido)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <CardTitle>Itens para Troca</CardTitle>
                  <div className="w-full md:w-64">
                    <Select value={operation} onValueChange={(value) => setOperation(value as ReturnOperation)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TROCA">Troca com crédito</SelectItem>
                        <SelectItem value="DEVOLUCAO">Devolução com estorno</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Vendido</TableHead>
                        <TableHead className="text-right">Já trocado</TableHead>
                        <TableHead className="text-right">Disponível</TableHead>
                        <TableHead className="text-right">Qtd.</TableHead>
                        <TableHead>Destino</TableHead>
                        <TableHead className="text-right">Crédito</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sale.itens.map((item) => {
                        const selected = selectedFor(item.produtoId);
                        const disabled = item.availableQuantity <= 0;
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Checkbox
                                checked={Boolean(selected)}
                                disabled={disabled}
                                onCheckedChange={(checked) => toggleItem(item, Boolean(checked))}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{item.produtoNome}</div>
                              <div className="text-xs text-muted-foreground">
                                Código {item.produtoCodigo || "-"} | Barras {item.produtoCodigoBarras || "-"}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono">{item.quantidade}</TableCell>
                            <TableCell className="text-right font-mono">{item.returnedQuantity || 0}</TableCell>
                            <TableCell className="text-right font-mono">{item.availableQuantity}</TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                min={1}
                                max={item.availableQuantity}
                                value={selected?.quantity || 1}
                                disabled={!selected}
                                onChange={(event) => {
                                  const quantity = Math.max(
                                    1,
                                    Math.min(item.availableQuantity, Number(event.target.value) || 1)
                                  );
                                  updateItem(item.produtoId, { quantity });
                                }}
                                className="ml-auto h-8 w-20 text-right"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={selected?.condition || "GOOD"}
                                disabled={!selected}
                                onValueChange={(value) =>
                                  updateItem(item.produtoId, { condition: value as ReturnCondition })
                                }
                              >
                                <SelectTrigger className="h-8 min-w-44">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="GOOD">Volta ao estoque</SelectItem>
                                  <SelectItem value="DAMAGED">Estoque de troca</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {currency(item.precoUnitario * (selected?.quantity || 0))}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="grid gap-4 md:grid-cols-[1fr_300px]">
                  <div className="space-y-1">
                    <Label htmlFor="reason">Motivo</Label>
                    <Textarea
                      id="reason"
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="Descreva o motivo informado pelo cliente..."
                      className="min-h-24"
                    />
                  </div>
                  <div className="rounded-md border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">
                      {operation === "TROCA" ? "Valor para usar como dinheiro" : "Valor do estorno"}
                    </p>
                    <p className="mt-1 text-2xl font-bold">{currency(totalSelecionado)}</p>
                    <Button
                      onClick={handleSubmit}
                      disabled={createReturn.isPending || selectedItems.length === 0 || !reason.trim()}
                      className="mt-4 w-full"
                    >
                      {operation === "TROCA" ? <Printer className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                      {createReturn.isPending
                        ? "Registrando..."
                        : operation === "TROCA"
                          ? "Gerar Nota de Troca"
                          : "Confirmar Devolução"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingReturns ? (
              <p className="text-sm text-muted-foreground">Carregando histórico...</p>
            ) : returns.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cupom</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returns.slice(0, 20).map((record: any) => (
                    <TableRow key={record.id}>
                      <TableCell>{dateTime(record.createdAt)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{record.numeroVenda || "-"}</div>
                        <div className="text-xs text-muted-foreground">
                          CCF {record.ccf || "-"} | COO {record.coo || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {record.operation === "TROCA" ? (
                            <ArrowLeftRight className="h-3 w-3" />
                          ) : (
                            <RotateCcw className="h-3 w-3" />
                          )}
                          {record.operation === "TROCA" ? "Troca" : "Devolução"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(record.items || []).map((item: any) => item.produtoNome || item.produtoId).join(", ") || "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono">{currency(record.totalRefunded)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma troca ou devolução registrada.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
