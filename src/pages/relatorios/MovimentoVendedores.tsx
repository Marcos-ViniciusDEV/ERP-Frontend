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

export default function MovimentoVendedores() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // Dados mockados para demonstração
  const vendedores = [
    {
      id: 1,
      nome: "João Silva",
      vendas: 45,
      valor: 125000.0,
      comissao: 6250.0,
    },
    {
      id: 2,
      nome: "Maria Santos",
      vendas: 38,
      valor: 98000.0,
      comissao: 4900.0,
    },
    {
      id: 3,
      nome: "Pedro Oliveira",
      vendas: 52,
      valor: 156000.0,
      comissao: 7800.0,
    },
  ];

  const total = vendedores.reduce(
    (acc, v) => ({
      vendas: acc.vendas + v.vendas,
      valor: acc.valor + v.valor,
      comissao: acc.comissao + v.comissao,
    }),
    { vendas: 0, valor: 0, comissao: 0 }
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Movimento de Vendedores
          </h1>
          <p className="text-slate-600 mt-1">
            Relatório de performance e comissões dos vendedores
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
                <Button className="w-full">
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
                    <TableHead className="text-right">Comissão</TableHead>
                    <TableHead className="text-right">Ticket Médio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendedores.map(vendedor => (
                    <TableRow key={vendedor.id}>
                      <TableCell className="font-medium">
                        {vendedor.nome}
                      </TableCell>
                      <TableCell className="text-right">
                        {vendedor.vendas}
                      </TableCell>
                      <TableCell className="text-right">
                        R${" "}
                        {vendedor.valor.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        R${" "}
                        {vendedor.comissao.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        R${" "}
                        {(vendedor.valor / vendedor.vendas).toLocaleString(
                          "pt-BR",
                          { minimumFractionDigits: 2 }
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-slate-50 font-semibold">
                    <TableCell>TOTAL</TableCell>
                    <TableCell className="text-right">{total.vendas}</TableCell>
                    <TableCell className="text-right">
                      R${" "}
                      {total.valor.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      R${" "}
                      {total.comissao.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      R${" "}
                      {(total.valor / total.vendas).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
