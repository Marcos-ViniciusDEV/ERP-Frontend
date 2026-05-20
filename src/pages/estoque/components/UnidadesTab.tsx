import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Ban, CheckCircle2, Lock, RefreshCw, ShieldCheck, ShoppingCart, Unlock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Produto } from "@/shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MovimentoEstoque {
  id: number;
  tipo: string;
  quantidade: number;
  saldoAnterior: number;
  saldoAtual: number;
  custoUnitario: number;
  documentoReferencia: string | null;
  fornecedor: string | null;
  observacao: string | null;
  createdAt: string | Date;
}

interface UnidadesTabProps {
  produto: Produto | null;
  onProdutoChange: (produto: Produto) => void;
}

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return "-";
  return format(new Date(date), "dd/MM/yyyy HH:mm");
};

const formatCurrency = (value: number | null | undefined) =>
  ((value || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function UnidadesTab({ produto, onProdutoChange }: UnidadesTabProps) {
  const queryClient = useQueryClient();
  const [produtosBloqueados, setProdutosBloqueados] = useState<Set<number>>(new Set());

  const { data: movimentos, isLoading } = useQuery<MovimentoEstoque[]>({
    queryKey: ["movimentos", produto?.id],
    queryFn: async () => {
      if (!produto?.id) return [];
      const { data } = await api.get(`/produtos/${produto.id}/movimentos`);
      return data;
    },
    enabled: !!produto?.id,
  });

  const toggleBloqueioCarga = useMutation({
    mutationFn: async (bloquearCarga: boolean) => {
      if (!produto) return null;
      return { produtoId: produto.id, bloquearCarga };
    },
    onSuccess: (updatedProduto) => {
      if (!updatedProduto) return;
      setProdutosBloqueados((prev) => {
        const next = new Set(prev);
        if (updatedProduto.bloquearCarga) {
          next.add(updatedProduto.produtoId);
        } else {
          next.delete(updatedProduto.produtoId);
        }
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      toast.success(updatedProduto.bloquearCarga ? "Carga bloqueada para este produto." : "Produto liberado para carga.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Erro ao alterar bloqueio de carga");
    },
  });

  const enviarCarga = useMutation({
    mutationFn: async () => {
      await api.post("/pdv/enviar-carga", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      toast.success("Carga enviada com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao enviar carga");
    },
  });

  const toggleBloqueioVenda = useMutation({
    mutationFn: async (ativo: boolean) => {
      if (!produto) return null;
      await api.put(`/produtos/${produto.id}`, { ativo });
      return { ...produto, ativo };
    },
    onSuccess: (updatedProduto) => {
      if (!updatedProduto) return;
      onProdutoChange(updatedProduto);
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      toast.success(updatedProduto.ativo ? "Produto liberado para venda." : "Produto bloqueado na área de venda.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Erro ao alterar bloqueio de venda");
    },
  });

  const ultimaEntrada = useMemo(
    () => movimentos?.find((movimento) => movimento.tipo === "ENTRADA_NFE"),
    [movimentos]
  );

  const perdas = useMemo(
    () => (movimentos || []).filter((movimento) => movimento.tipo === "BAIXA_PERDA"),
    [movimentos]
  );

  const ultimasCincoPerdas = useMemo(() => perdas.slice(0, 5), [perdas]);

  const totalPerdas = useMemo(
    () => perdas.reduce((total, perda) => total + Math.abs(Number(perda.quantidade || 0)), 0),
    [perdas]
  );

  const dataUltimaCompra = produto?.dataUltimaCompra || ultimaEntrada?.createdAt;
  const quantidadeUltimaCompra = produto?.quantidadeUltimaCompra || ultimaEntrada?.quantidade || 0;
  const bloqueado = produto ? produtosBloqueados.has(produto.id) : false;
  const vendaBloqueada = produto?.ativo === false;

  if (!produto) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Selecione um produto para ver as unidades.</div>;
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="grid grid-cols-5 gap-2">
        <div className="rounded-md border bg-background p-3">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Última Compra</p>
          <p className="mt-2 font-mono text-xl font-bold">{quantidadeUltimaCompra}</p>
          <p className="text-xs text-muted-foreground">{formatDate(dataUltimaCompra)}</p>
        </div>
        <div className="rounded-md border bg-background p-3">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Estoque Atual</p>
          <p className="mt-2 font-mono text-xl font-bold">{produto.estoque || 0}</p>
          <p className="text-xs text-muted-foreground">{formatDate(produto.updatedAt)}</p>
        </div>
        <div className="rounded-md border bg-background p-3">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Estoque Troca/Perda</p>
          <p className="mt-2 font-mono text-xl font-bold">{produto.estoqueTroca || 0}</p>
          <p className="text-xs text-muted-foreground">{formatDate(produto.updatedAt)}</p>
        </div>
        <div className="rounded-md border bg-background p-3">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Perdas Registradas</p>
          <p className="mt-2 font-mono text-xl font-bold text-red-600">{totalPerdas}</p>
          <p className="text-xs text-muted-foreground">{perdas[0] ? formatDate(perdas[0].createdAt) : "-"}</p>
        </div>
        <div className={`rounded-md border p-3 ${bloqueado ? "bg-orange-50" : "bg-green-50"}`}>
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Status da Carga</p>
          <p className={`mt-2 text-sm font-bold ${bloqueado ? "text-orange-700" : "text-green-700"}`}>
            {bloqueado ? "Preço segurado" : "Marcado para carga"}
          </p>
          <p className="text-xs text-muted-foreground">PDV: {formatCurrency(produto.precoPdv)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md border bg-muted/20 p-3">
        <div>
          <h3 className="text-sm font-semibold">{produto.descricao}</h3>
          <p className="text-xs text-muted-foreground">
            Código {produto.codigo} | Venda {formatCurrency(produto.precoVenda)} | PDV {formatCurrency(produto.precoPdv)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={vendaBloqueada ? "outline" : "destructive"}
            size="sm"
            onClick={() => toggleBloqueioVenda.mutate(vendaBloqueada)}
            disabled={toggleBloqueioVenda.isPending}
            className="gap-2"
          >
            {vendaBloqueada ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
            {vendaBloqueada ? "Liberar Venda" : "Bloquear Venda"}
          </Button>
          <Button
            variant={bloqueado ? "outline" : "default"}
            size="sm"
            onClick={() => toggleBloqueioCarga.mutate(!bloqueado)}
            disabled={toggleBloqueioCarga.isPending}
            className="gap-2"
          >
            {bloqueado ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            {bloqueado ? "Liberar Carga" : "Bloquear Carga"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => enviarCarga.mutate()}
            disabled={enviarCarga.isPending}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Enviar Carga
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
        <div className="rounded-md border">
          <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold">Saldos por Unidade</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Estoque atual</TableCell>
                <TableCell className="text-right font-mono font-bold">{produto.estoque || 0}</TableCell>
                <TableCell>{formatDate(produto.updatedAt)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Troca / perda</TableCell>
                <TableCell className="text-right font-mono">{produto.estoqueTroca || 0}</TableCell>
                <TableCell>{formatDate(produto.updatedAt)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Última compra</TableCell>
                <TableCell className="text-right font-mono">{quantidadeUltimaCompra}</TableCell>
                <TableCell>{formatDate(dataUltimaCompra)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="rounded-md border">
          <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2">
            <ShoppingCart className="h-4 w-4 text-red-600" />
            <h3 className="text-sm font-semibold">Últimas 5 Perdas</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead>Data</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : ultimasCincoPerdas.length > 0 ? (
                ultimasCincoPerdas.map((perda) => (
                  <TableRow key={perda.id}>
                    <TableCell>{formatDate(perda.createdAt)}</TableCell>
                    <TableCell>{perda.documentoReferencia || perda.observacao || "-"}</TableCell>
                    <TableCell className="text-right font-mono text-red-600">{Math.abs(perda.quantidade)}</TableCell>
                    <TableCell className="text-right font-mono font-bold">{perda.saldoAtual}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                    Nenhuma perda registrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
