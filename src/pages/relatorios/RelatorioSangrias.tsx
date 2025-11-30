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
import { Search, X } from "lucide-react";
import { useState } from "react";

export default function RelatorioSangrias() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const {
    data: response,
    isLoading,
    refetch,
    isFetched,
  } = useQuery({
    queryKey: ["sangrias", dataInicio, dataFim],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("tipo", "SANGRIA");
      if (dataInicio) params.append("dataInicio", dataInicio);
      if (dataFim) params.append("dataFim", dataFim);

      const { data } = await api.get(`/pdv/movimentos?${params.toString()}`);
      return data;
    },
    enabled: true, // Carregar inicialmente
  });

  const sangrias = response?.data || [];

  const handleSearch = () => {
    refetch();
  };

  const handleClear = () => {
    setDataInicio("");
    setDataFim("");
    setTimeout(() => refetch(), 100);
  };

  const totalSangrias = sangrias.reduce(
    (acc: number, s: any) => acc + s.valor,
    0
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Relatório de Sangrias
          </h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe as retiradas de caixa (sangrias) de todos os PDVs
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
              <span>Histórico de Sangrias</span>
              <div className="flex flex-col items-end">
                <span className="text-muted-foreground text-sm">
                  Total Retirado
                </span>
                <span className="font-bold text-red-600 text-lg">
                  R$ {(totalSangrias / 100).toFixed(2)}
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p className="text-muted-foreground">Carregando dados...</p>
              </div>
            ) : sangrias.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>PDV</TableHead>
                    <TableHead>Operador</TableHead>
                    <TableHead>Observação</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sangrias.map((sangria: any) => (
                    <TableRow key={sangria.id}>
                      <TableCell>
                        {new Date(sangria.dataMovimento).toLocaleString(
                          "pt-BR"
                        )}
                      </TableCell>
                      <TableCell>{sangria.pdvId || "N/A"}</TableCell>
                      <TableCell>{sangria.operadorNome || "-"}</TableCell>
                      <TableCell>{sangria.observacao || "-"}</TableCell>
                      <TableCell className="text-right font-bold text-red-600">
                        R$ {(sangria.valor / 100).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Nenhuma sangria encontrada no período.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
