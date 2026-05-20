import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { endOfMonth, format, isWithinInterval, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ResumoMvtoTabProps {
  produtoId: number | undefined;
}

interface VendaProduto {
  id: number;
  numeroVenda: string;
  dataVenda: string | Date;
  quantidade: number;
  precoUnitario: number;
  valorTotal: number;
}

export function ResumoMvtoTab({ produtoId }: ResumoMvtoTabProps) {
  const [selectedMovimento, setSelectedMovimento] = useState<any>(null);

  const { data: movimentos, isLoading } = useQuery({
    queryKey: ["movimentos", produtoId],
    queryFn: async () => {
      if (!produtoId) return [];
      const { data } = await api.get(`/produtos/${produtoId}/movimentos`);
      return data;
    },
    enabled: !!produtoId,
  });

  const { data: vendas, isLoading: isLoadingVendas } = useQuery<VendaProduto[]>({
    queryKey: ["historico-vendas", produtoId],
    queryFn: async () => {
      if (!produtoId) return [];
      const { data } = await api.get(`/produtos/${produtoId}/historico-vendas`);
      return data;
    },
    enabled: !!produtoId,
  });

  const resumoVendasUltimosTresMeses = useMemo(() => {
    const hoje = new Date();

    return Array.from({ length: 3 }, (_, index) => {
      const mesReferencia = subMonths(hoje, 2 - index);
      const inicio = startOfMonth(mesReferencia);
      const fim = index === 2 ? hoje : endOfMonth(mesReferencia);
      const vendasDoMes = (vendas || []).filter((venda) =>
        isWithinInterval(new Date(venda.dataVenda), { start: inicio, end: fim })
      );

      return {
        label: format(mesReferencia, "MMM/yyyy", { locale: ptBR }),
        periodo: `${format(inicio, "dd/MM/yyyy")} - ${format(fim, "dd/MM/yyyy")}`,
        quantidade: vendasDoMes.reduce((total, venda) => total + Number(venda.quantidade || 0), 0),
        valor: vendasDoMes.reduce((total, venda) => total + Number(venda.valorTotal || 0), 0),
      };
    });
  }, [vendas]);

  const totalVendasUltimosTresMeses = useMemo(
    () =>
      resumoVendasUltimosTresMeses.reduce(
        (total, mes) => ({
          quantidade: total.quantidade + mes.quantidade,
          valor: total.valor + mes.valor,
        }),
        { quantidade: 0, valor: 0 }
      ),
    [resumoVendasUltimosTresMeses]
  );

  if (!produtoId) {
    return <div className="p-8 text-center text-muted-foreground text-sm">Selecione um produto para ver o resumo de movimentação.</div>;
  }

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground text-sm">Carregando movimentações...</div>;
  }

  return (
    <>
      <div className="mb-3 grid grid-cols-4 gap-2">
        <div className="rounded-md border bg-muted/30 p-3">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Venda Total Últimos 3 Meses</p>
          <p className="mt-2 font-mono text-xl font-bold text-blue-600">
            {(totalVendasUltimosTresMeses.valor / 100).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            Qtd: <span className="font-mono font-bold">{totalVendasUltimosTresMeses.quantidade}</span>
          </p>
        </div>

        {resumoVendasUltimosTresMeses.map((mes) => (
          <div key={mes.periodo} className="rounded-md border bg-background p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold capitalize">{mes.label}</p>
              <p className="text-[10px] text-muted-foreground">{mes.periodo}</p>
            </div>
            <p className="mt-2 font-mono text-lg font-bold">
              {(mes.valor / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
            <p className="text-xs text-muted-foreground">
              Qtd vendida: <span className="font-mono font-bold">{mes.quantidade}</span>
            </p>
          </div>
        ))}
      </div>

      {isLoadingVendas && (
        <div className="mb-3 rounded-md border bg-muted/20 p-2 text-center text-xs text-muted-foreground">
          Carregando vendas dos últimos 3 meses...
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead className="text-right">Qtd</TableHead>
              <TableHead className="text-right">Saldo Ant.</TableHead>
              <TableHead className="text-right">Saldo Atual</TableHead>
              <TableHead className="text-right">Custo Unit.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movimentos?.map((mov: any) => (
              <TableRow
                key={mov.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedMovimento(mov)}
              >
                <TableCell>{format(new Date(mov.createdAt), "dd/MM/yyyy HH:mm")}</TableCell>
                <TableCell>{mov.tipo}</TableCell>
                <TableCell>{mov.documentoReferencia || "-"}</TableCell>
                <TableCell className={`text-right ${mov.quantidade > 0 ? "text-green-600" : "text-red-600"}`}>
                  {mov.quantidade}
                </TableCell>
                <TableCell className="text-right">{mov.saldoAnterior}</TableCell>
                <TableCell className="text-right font-bold">{mov.saldoAtual}</TableCell>
                <TableCell className="text-right">
                  {(mov.custoUnitario / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </TableCell>
              </TableRow>
            ))}
            {(!movimentos || movimentos.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Nenhuma movimentação encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedMovimento} onOpenChange={(open) => !open && setSelectedMovimento(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Movimentação</DialogTitle>
            <DialogDescription>
              Informações completas sobre a movimentação de estoque.
            </DialogDescription>
          </DialogHeader>
          {selectedMovimento && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data/Hora</p>
                  <p>{format(new Date(selectedMovimento.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                  <p>{selectedMovimento.tipo}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Usuário Responsável</p>
                  <p className="font-semibold">{selectedMovimento.usuarioNome || "Sistema/Não identificado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Documento</p>
                  <p>{selectedMovimento.documentoReferencia || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Quantidade</p>
                  <p className={selectedMovimento.quantidade > 0 ? "text-green-600" : "text-red-600"}>
                    {selectedMovimento.quantidade}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Saldo Resultante</p>
                  <p>{selectedMovimento.saldoAtual}</p>
                </div>
                {selectedMovimento.fornecedor && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Fornecedor</p>
                    <p>{selectedMovimento.fornecedor}</p>
                  </div>
                )}
                {selectedMovimento.observacao && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Observação</p>
                    <p>{selectedMovimento.observacao}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
