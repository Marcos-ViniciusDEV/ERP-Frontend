import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Download, FileText, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function MovimentoVendedores() {
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split("T")[0]);
  const [dataFim, setDataFim] = useState(new Date().toISOString().split("T")[0]);

  const { data: vendas, isLoading, refetch } = useQuery({
    queryKey: ["vendas-vendedores", dataInicio, dataFim],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dataInicio) params.append("dataInicio", dataInicio);
      if (dataFim) params.append("dataFim", dataFim);
      
      const { data } = await api.get(`/vendas?${params.toString()}`);
      return data;
    },
  });

  // Processar dados para agrupar por vendedor
  const vendedoresMap = new Map();

  vendas?.forEach((venda: any) => {
    const vendedorNome = venda.operadorNome || "Não Identificado";
    
    if (!vendedoresMap.has(vendedorNome)) {
      vendedoresMap.set(vendedorNome, {
        id: venda.operadorId || 0,
        nome: vendedorNome,
        vendas: 0,
        valor: 0,
      });
    }

    const vendedor = vendedoresMap.get(vendedorNome);
    vendedor.vendas += 1;
    vendedor.valor += venda.valorLiquido;
  });

  const vendedores = Array.from(vendedoresMap.values());

  const total = vendedores.reduce(
    (acc, v) => ({
      vendas: acc.vendas + v.vendas,
      valor: acc.valor + v.valor,
    }),
    { vendas: 0, valor: 0 }
  );

  const handleSearch = () => {
    refetch();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Movimento de Vendedores
          </h1>
          <p className="text-slate-600 mt-1">
            Relatório de performance dos vendedores
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="dataInicio">Data Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={dataInicio}
                  onChange={e => setDataInicio(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dataFim">Data Fim</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={dataFim}
                  onChange={e => setDataFim(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={handleSearch}>
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
              </div>
              <div className="flex items-end gap-2">
                <Button variant="outline" className="flex-1">
                  <FileText className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Resultados */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="text-right">Nº Vendas</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-right">Ticket Médio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        Carregando dados...
                      </TableCell>
                    </TableRow>
                  ) : vendedores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        Nenhuma venda encontrada no período.
                      </TableCell>
                    </TableRow>
                  ) : (
                    vendedores.map((vendedor, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          {vendedor.nome}
                        </TableCell>
                        <TableCell className="text-right">
                          {vendedor.vendas}
                        </TableCell>
                        <TableCell className="text-right">
                          R${" "}
                          {(vendedor.valor / 100).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          R${" "}
                          {(vendedor.vendas > 0 ? (vendedor.valor / vendedor.vendas) / 100 : 0).toLocaleString(
                            "pt-BR",
                            { minimumFractionDigits: 2 }
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {vendedores.length > 0 && (
                    <TableRow className="bg-slate-50 font-semibold">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-right">{total.vendas}</TableCell>
                      <TableCell className="text-right">
                        R${" "}
                        {(total.valor / 100).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        R${" "}
                        {(total.vendas > 0 ? (total.valor / total.vendas) / 100 : 0).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
