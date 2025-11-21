import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { TrendingDown, TrendingUp } from "lucide-react";

export default function MovimentacaoCaixa() {
  const { data: movimentacoes, isLoading } = trpc.caixa.list.useQuery();

  const totalEntradas = movimentacoes
    ?.filter((m: any) => m.tipo === "ENTRADA")
    .reduce((acc: number, m: any) => acc + m.valor, 0);

  const totalSaidas = movimentacoes
    ?.filter((m: any) => m.tipo === "SAIDA")
    .reduce((acc: number, m: any) => acc + m.valor, 0);

  const saldoAtual = (totalEntradas || 0) - (totalSaidas || 0);

  const getTipoIcon = (tipo: string) => {
    return tipo === "ENTRADA" ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getTipoColor = (tipo: string) => {
    return tipo === "ENTRADA" ? "text-green-600" : "text-red-600";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Movimentação de Caixa</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe as entradas e saídas de caixa
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Entradas
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {((totalEntradas || 0) / 100).toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Saídas
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                R$ {((totalSaidas || 0) / 100).toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Saldo Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  saldoAtual >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                R$ {(saldoAtual / 100).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Movimentações</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : movimentacoes && movimentacoes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimentacoes.map((mov: any) => (
                    <TableRow key={mov.id}>
                      <TableCell>
                        {new Date(mov.dataMovimentacao).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTipoIcon(mov.tipo)}
                          <span className={`font-medium ${getTipoColor(mov.tipo)}`}>
                            {mov.tipo}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{mov.descricao}</TableCell>
                      <TableCell className={`text-right font-bold ${getTipoColor(mov.tipo)}`}>
                        {mov.tipo === "ENTRADA" ? "+" : "-"} R$ {(mov.valor / 100).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">Nenhuma movimentação de caixa registrada.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
