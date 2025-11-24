import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ResumoMvtoTabProps {
  produtoId: number | undefined;
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

  if (!produtoId) {
    return <div className="p-8 text-center text-muted-foreground text-sm">Selecione um produto para ver o resumo de movimentação.</div>;
  }

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground text-sm">Carregando movimentações...</div>;
  }

  return (
    <>
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
