import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Plus, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Inventario() {
  const [open, setOpen] = useState(false);
  const [contagemOpen, setContagemOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: inventarios, refetch } = useQuery({
    queryKey: ["inventarios"],
    queryFn: async () => {
      const { data } = await api.get("/inventario");
      return data;
    },
  });

  const { data: produtos } = useQuery({
    queryKey: ["produtos"],
    queryFn: async () => {
      const { data } = await api.get("/produtos");
      return data;
    },
  });

  const createInventario = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/inventario", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Inventário iniciado com sucesso!");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["inventarios"] });
      setFormData({ descricao: "" });
    },
    onError: () => {
      toast.error("Erro ao iniciar inventário");
    },
  });

  const addItem = useMutation({
    mutationFn: async ({ inventarioId, ...data }: any) => {
      const res = await api.post(`/inventario/${inventarioId}/itens`, data);
      return res.data;
    },
  });

  const [formData, setFormData] = useState({
    descricao: "",
  });

  const [contagemData, setContagemData] = useState<Record<number, number>>({});
  const [inventarioSelecionado, setInventarioSelecionado] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createInventario.mutate({
      descricao: formData.descricao,
    });
  };

  const handleIniciarContagem = (inventario: any) => {
    setInventarioSelecionado(inventario);
    setContagemData({});
    setContagemOpen(true);
  };

  const handleFinalizarContagem = async () => {
    if (!inventarioSelecionado) return;

    const itens = Object.entries(contagemData).map(([produtoId, quantidadeContada]) => ({
      produtoId: parseInt(produtoId),
      quantidadeContada,
    }));

    if (itens.length === 0) {
      toast.error("Nenhum produto foi contado");
      return;
    }

    try {
      // Adicionar cada item ao inventário
      for (const item of itens) {
        const produto = produtos?.find((p: { id: number; estoque: number }) => p.id === item.produtoId);
        if (produto) {
          await addItem.mutateAsync({
            inventarioId: inventarioSelecionado.id,
            produtoId: item.produtoId,
            estoqueSistema: produto.estoque,
            quantidadeContada: item.quantidadeContada,
          });
        }
      }
      toast.success("Inventário finalizado com sucesso!");
      setContagemOpen(false);
      setInventarioSelecionado(null);
      queryClient.invalidateQueries({ queryKey: ["inventarios"] });
    } catch (error) {
      toast.error("Erro ao finalizar inventário");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "EM_ANDAMENTO":
        return "text-blue-600";
      case "FINALIZADO":
        return "text-green-600";
      case "CANCELADO":
        return "text-gray-600";
      default:
        return "";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inventário (Contagem Cega)</h1>
            <p className="text-muted-foreground mt-1">
              Realize auditorias de estoque com contagem física
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Inventário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Iniciar Novo Inventário</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="descricao">Descrição *</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Ex: Inventário Mensal - Janeiro/2025"
                    required
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <p className="text-sm text-blue-800">
                    <AlertTriangle className="h-4 w-4 inline mr-2" />
                    Ao iniciar o inventário, os saldos de estoque serão congelados para comparação
                    posterior.
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createInventario.isPending}>
                    {createInventario.isPending ? "Iniciando..." : "Iniciar Inventário"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Inventários</CardTitle>
          </CardHeader>
          <CardContent>
            {inventarios && inventarios.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventarios.map((inventario: any) => (
                    <TableRow key={inventario.id}>
                      <TableCell>
                        {new Date(inventario.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="font-medium">{inventario.descricao}</TableCell>
                      <TableCell>
                        <span className={`font-medium ${getStatusColor(inventario.status)}`}>
                          {inventario.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {inventario.status === "EM_ANDAMENTO" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleIniciarContagem(inventario)}
                          >
                            <ClipboardCheck className="h-4 w-4 mr-2" />
                            Realizar Contagem
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">Nenhum inventário registrado.</p>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Contagem */}
        <Dialog open={contagemOpen} onOpenChange={setContagemOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Contagem de Estoque - {inventarioSelecionado?.descricao}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-sm text-yellow-800">
                  <AlertTriangle className="h-4 w-4 inline mr-2" />
                  <strong>Contagem Cega:</strong> Informe a quantidade física encontrada sem
                  consultar o sistema. As divergências serão calculadas automaticamente.
                </p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Quantidade Contada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtos?.map((produto: { id: number; codigo: string; descricao: string; unidade: string }) => (
                    <TableRow key={produto.id}>
                      <TableCell className="font-medium">{produto.codigo}</TableCell>
                      <TableCell>{produto.descricao}</TableCell>
                      <TableCell>{produto.unidade}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={contagemData[produto.id] || ""}
                          onChange={(e) =>
                            setContagemData({
                              ...contagemData,
                              [produto.id]: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-32"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setContagemOpen(false);
                    setInventarioSelecionado(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleFinalizarContagem} disabled={addItem.isPending}>
                  {addItem.isPending ? "Finalizando..." : "Finalizar Inventário"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
