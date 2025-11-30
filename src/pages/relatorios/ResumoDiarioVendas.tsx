import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, ShoppingCart, TrendingUp, Package, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ResumoDiarioVendas() {
  // Data de hoje formatada para o input (YYYY-MM-DD)
  const today = new Date().toISOString().split("T")[0];
  const [expandedDepts, setExpandedDepts] = useState<Record<number, boolean>>({});

  const toggleDept = (deptId: number) => {
    setExpandedDepts(prev => ({
      ...prev,
      [deptId]: !prev[deptId]
    }));
  };

  // Buscar departamentos
  const { data: departamentos } = useQuery({
    queryKey: ["departamentos"],
    queryFn: async () => {
      const { data } = await api.get("/departamentos");
      return data;
    },
  });

  const { data: vendas, isLoading } = useQuery({
    queryKey: ["vendas-tempo-real"],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("dataInicio", today);
      params.append("dataFim", today);
      
      const { data } = await api.get(`/vendas?${params.toString()}`);
      return data;
    },
    refetchInterval: 5000, // Atualiza a cada 5 segundos
  });

  // Agrupar itens vendidos por departamento
  const vendasPorDepartamento = departamentos?.map((dept: any) => {
    const itensDoDepartamento: any[] = [];
    let totalDepartamento = 0;

    vendas?.forEach((venda: any) => {
      venda.itens?.forEach((item: any) => {
        if (item.departamentoId === dept.id) {
          itensDoDepartamento.push({
            ...item,
            dataVenda: venda.dataVenda,
            numeroVenda: venda.numeroVenda,
          });
          totalDepartamento += item.total;
        }
      });
    });

    return {
      id: dept.id,
      nome: dept.nome,
      total: totalDepartamento,
      itens: itensDoDepartamento,
    };
  }).filter((d: any) => d.itens.length > 0 || true); // Mantém todos os departamentos existentes, mesmo sem vendas, se desejar. O usuário disse "mostre todos as vendas dos departamentos existentes". Se não tiver venda, mostra 0.

  const totalLiquido = vendas?.reduce(
    (acc: number, venda: any) => acc + venda.valorLiquido,
    0
  );

  const totalVendas = vendas?.length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Vendas em Tempo Real
            </h1>
            <p className="text-muted-foreground mt-1">
              Acompanhamento detalhado por departamento ({new Date().toLocaleDateString('pt-BR')})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm text-muted-foreground">Atualizando ao vivo</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Líquido
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {((totalLiquido || 0) / 100).toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Quantidade de Vendas
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVendas}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ticket Médio
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {totalVendas > 0 ? ((totalLiquido / totalVendas) / 100).toFixed(2) : "0.00"}
              </div>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-xl font-bold mt-8 mb-4">Detalhamento por Departamento</h2>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        ) : vendasPorDepartamento && vendasPorDepartamento.length > 0 ? (
          <div className="space-y-6">
            {vendasPorDepartamento.map((dept: any) => (
              <Card key={dept.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-0 h-auto hover:bg-transparent"
                        onClick={() => toggleDept(dept.id)}
                      >
                        {expandedDepts[dept.id] ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground mr-2" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground mr-2" />
                        )}
                        <Package className="h-5 w-5 text-blue-600 mr-2" />
                        {dept.nome}
                      </Button>
                    </CardTitle>
                    <div className="text-xl font-bold text-blue-700">
                      R$ {(dept.total / 100).toFixed(2)}
                    </div>
                  </div>
                </CardHeader>
                {expandedDepts[dept.id] && (
                  <CardContent>
                    {dept.itens.length > 0 ? (
                      <div className="mt-4 border rounded-md overflow-hidden">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-muted text-muted-foreground">
                            <tr>
                              <th className="p-2">Produto</th>
                              <th className="p-2 text-right">Qtd</th>
                              <th className="p-2 text-right">Valor Unit.</th>
                              <th className="p-2 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dept.itens.map((item: any, idx: number) => (
                              <tr key={idx} className="border-t hover:bg-muted/50">
                                <td className="p-2">{item.produtoNome}</td>
                                <td className="p-2 text-right">{item.quantidade}</td>
                                <td className="p-2 text-right">R$ {(item.precoUnitario / 100).toFixed(2)}</td>
                                <td className="p-2 text-right font-medium">R$ {(item.total / 100).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic mt-2">
                        Nenhuma venda neste departamento hoje.
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/20 rounded-lg">
            <p className="text-muted-foreground">
              Nenhum departamento cadastrado.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
