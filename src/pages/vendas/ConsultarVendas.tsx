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
import { useState } from "react";

export default function ConsultarVendas() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  
  const { data: vendas, isLoading, refetch, isFetched } = useQuery({
    queryKey: ["vendas", dataInicio, dataFim],
    queryFn: async () => {
      // Se não tiver datas, não busca nada (ou busca tudo se a API permitir, mas o requisito é não buscar tudo)
      if (!dataInicio && !dataFim) return [];
      
      const params = new URLSearchParams();
      if (dataInicio) params.append("dataInicio", dataInicio);
      if (dataFim) params.append("dataFim", dataFim);
      
      // Usar endpoint de período se houver datas, ou o geral se for para buscar tudo (mas aqui vamos restringir)
      const endpoint = (dataInicio || dataFim) ? `/vendas/periodo?${params.toString()}` : "/vendas";
      
      const { data } = await api.get(endpoint);
      return data;
    },
    enabled: false, // Não buscar automaticamente
  });

  const handleSearch = () => {
    if (!dataInicio && !dataFim) {
        // Opcional: alertar usuário
        return; 
    }
    refetch();
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
          <h1 className="text-3xl font-bold text-foreground">Consultar Vendas</h1>
          <p className="text-muted-foreground mt-1">
            Consulte o histórico de vendas e relatórios
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 items-end">
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
              <div className="flex gap-2">
                <Button onClick={handleSearch}>
                    Buscar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDataInicio("");
                    setDataFim("");
                  }}
                >
                  Limpar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Vendas Realizadas</span>
              {totalLiquido !== undefined && (
                <div className="flex gap-6 text-sm">
                    <div className="flex flex-col items-end">
                        <span className="text-muted-foreground">Total Bruto</span>
                        <span className="font-bold">R$ {(totalBruto / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-muted-foreground">Total Descontos</span>
                        <span className="font-bold text-red-500">- R$ {(totalDescontos / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-muted-foreground">Total Líquido</span>
                        <span className="font-bold text-green-600 text-lg">R$ {(totalLiquido / 100).toFixed(2)}</span>
                    </div>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : !isFetched ? (
                <p className="text-muted-foreground text-center py-8">
                    Selecione um período e clique em "Buscar" para visualizar as vendas.
                </p>
            ) : vendas && vendas.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Número da Venda</TableHead>
                    <TableHead>Operador</TableHead>
                    <TableHead className="text-right">Valor Bruto</TableHead>
                    <TableHead className="text-right">Desconto</TableHead>
                    <TableHead className="text-right">Valor Líquido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendas.map((venda: any) => (
                    <TableRow key={venda.id}>
                      <TableCell>
                        {new Date(venda.dataVenda).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="font-medium">{venda.numeroVenda}</TableCell>
                      <TableCell>{venda.operadorNome || "-"}</TableCell>
                      <TableCell className="text-right">
                        R$ {(venda.valorTotal / 100).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {(venda.valorDesconto / 100).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        R$ {(venda.valorLiquido / 100).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">
                Nenhuma venda encontrada no período selecionado.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
