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
  
  const { data: vendas, isLoading } = useQuery({
    queryKey: ["vendas"],
    queryFn: async () => {
      const { data } = await api.get("/vendas");
      return data;
    }
  });

  const vendasFiltradas = vendas?.filter((venda: any) => {
    if (!dataInicio && !dataFim) return true;
    const dataVenda = new Date(venda.dataVenda);
    const inicio = dataInicio ? new Date(dataInicio) : null;
    const fim = dataFim ? new Date(dataFim) : null;

    if (inicio && dataVenda < inicio) return false;
    if (fim && dataVenda > fim) return false;
    return true;
  });

  const totalVendas = vendasFiltradas?.reduce(
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
            <div className="grid grid-cols-3 gap-4">
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
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDataInicio("");
                    setDataFim("");
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Vendas Realizadas</span>
              {totalVendas !== undefined && (
                <span className="text-lg font-bold text-green-600">
                  Total: R$ {(totalVendas / 100).toFixed(2)}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : vendasFiltradas && vendasFiltradas.length > 0 ? (
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
                  {vendasFiltradas.map((venda: any) => (
                    <TableRow key={venda.id}>
                      <TableCell>
                        {new Date(venda.dataVenda).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="font-medium">{venda.numeroVenda}</TableCell>
                      <TableCell>{venda.operador || "-"}</TableCell>
                      <TableCell className="text-right">
                        R$ {(venda.valorBruto / 100).toFixed(2)}
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
                {dataInicio || dataFim
                  ? "Nenhuma venda encontrada no período selecionado."
                  : "Nenhuma venda registrada."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
