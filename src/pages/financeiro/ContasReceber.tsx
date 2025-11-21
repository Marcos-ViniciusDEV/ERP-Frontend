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
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ContaReceber } from "@/shared/schema";

export default function ContasReceber() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: contas, isLoading } = useQuery<ContaReceber[]>({
    queryKey: ["contasReceber"],
    queryFn: async () => {
      const { data } = await api.get("/contas-receber");
      return data;
    }
  });

  const createConta = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/contas-receber", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Conta a receber cadastrada com sucesso!");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["contasReceber"] });
      setFormData({
        descricao: "",
        valor: 0,
        dataVencimento: "",
        observacao: "",
      });
    },
    onError: () => {
      toast.error("Erro ao cadastrar conta a receber");
    }
  });

  const [formData, setFormData] = useState({
    descricao: "",
    valor: 0,
    dataVencimento: "",
    observacao: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createConta.mutate({
      ...formData,
      dataVencimento: new Date(formData.dataVencimento),
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDENTE":
        return "text-yellow-600";
      case "RECEBIDO":
        return "text-green-600";
      case "ATRASADO":
        return "text-red-600";
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
            <h1 className="text-3xl font-bold text-foreground">Contas a Receber</h1>
            <p className="text-muted-foreground mt-1">Gerencie as contas a receber</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Conta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Cadastrar Nova Conta a Receber</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="descricao">Descrição *</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="valor">Valor (R$) *</Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      value={formData.valor / 100}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          valor: Math.round(parseFloat(e.target.value) * 100),
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="dataVencimento">Data de Vencimento *</Label>
                    <Input
                      id="dataVencimento"
                      type="date"
                      value={formData.dataVencimento}
                      onChange={(e) =>
                        setFormData({ ...formData, dataVencimento: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="observacao">Observação</Label>
                  <Input
                    id="observacao"
                    value={formData.observacao}
                    onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createConta.isPending}>
                    {createConta.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Contas a Receber</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : contas && contas.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contas.map((conta) => (
                    <TableRow key={conta.id}>
                      <TableCell className="font-medium">{conta.descricao}</TableCell>
                      <TableCell className="text-right">
                        R$ {(conta.valor / 100).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {new Date(conta.dataVencimento).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getStatusColor(conta.status)}`}>
                          {conta.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">Nenhuma conta a receber cadastrada.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
