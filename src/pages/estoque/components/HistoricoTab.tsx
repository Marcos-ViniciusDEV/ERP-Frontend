import { useQuery } from "@tanstack/react-query";
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

interface HistoricoTabProps {
  produtoId: number | undefined;
}

export function HistoricoTab({ produtoId }: HistoricoTabProps) {
  const { data: vendas, isLoading } = useQuery({
    queryKey: ["historico-vendas", produtoId],
    queryFn: async () => {
      if (!produtoId) return [];
      const { data } = await api.get(`/produtos/${produtoId}/historico-vendas`);
      return data;
    },
    enabled: !!produtoId,
  });

  if (!produtoId) {
    return <div className="p-4 text-center text-muted-foreground">Selecione um produto para ver o histórico de vendas.</div>;
  }

  if (isLoading) {
    return <div className="p-4 text-center">Carregando...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Venda</TableHead>
            <TableHead className="text-right">Qtd</TableHead>
            <TableHead className="text-right">Preço Unit.</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendas?.map((venda: any) => (
            <TableRow key={venda.id}>
              <TableCell>{format(new Date(venda.dataVenda), "dd/MM/yyyy HH:mm")}</TableCell>
              <TableCell>{venda.numeroVenda}</TableCell>
              <TableCell className="text-right">{venda.quantidade}</TableCell>
              <TableCell className="text-right">
                R$ {(venda.precoUnitario / 100).toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-bold">
                R$ {(venda.valorTotal / 100).toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
          {(!vendas || vendas.length === 0) && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                Nenhuma venda encontrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
