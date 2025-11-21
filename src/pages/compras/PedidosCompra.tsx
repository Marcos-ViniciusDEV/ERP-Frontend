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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function PedidosCompra() {
  const [open, setOpen] = useState(false);
  const { data: pedidos, isLoading, refetch } = trpc.pedidosCompra.list.useQuery();
  const { data: fornecedores } = trpc.fornecedores.list.useQuery();
  const createPedido = trpc.pedidosCompra.create.useMutation();

  const [formData, setFormData] = useState({
    fornecedorId: 0,
    dataPedido: new Date().toISOString().split("T")[0],
    valorTotal: 0,
    observacao: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const pedidoData: any = {
        ...formData,
        dataPedido: new Date(formData.dataPedido),
      };
      if (formData.fornecedorId > 0) {
        pedidoData.fornecedorId = formData.fornecedorId;
      }
      await createPedido.mutateAsync(pedidoData);
      toast.success("Pedido de compra cadastrado com sucesso!");
      setOpen(false);
      refetch();
      setFormData({
        fornecedorId: 0,
        dataPedido: new Date().toISOString().split("T")[0],
        valorTotal: 0,
        observacao: "",
      });
    } catch (error) {
      toast.error("Erro ao cadastrar pedido de compra");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDENTE":
        return "text-yellow-600";
      case "APROVADO":
        return "text-blue-600";
      case "RECEBIDO":
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
            <h1 className="text-3xl font-bold text-foreground">Pedidos de Compra</h1>
            <p className="text-muted-foreground mt-1">Gerencie os pedidos de compra</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Pedido
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Pedido de Compra</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="fornecedorId">Fornecedor *</Label>
                  <Select
                    value={formData.fornecedorId.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, fornecedorId: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {fornecedores?.map((forn: { id: number; razaoSocial: string }) => (
                        <SelectItem key={forn.id} value={forn.id.toString()}>
                          {forn.razaoSocial}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dataPedido">Data do Pedido *</Label>
                    <Input
                      id="dataPedido"
                      type="date"
                      value={formData.dataPedido}
                      onChange={(e) => setFormData({ ...formData, dataPedido: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="valorTotal">Valor Total (R$) *</Label>
                    <Input
                      id="valorTotal"
                      type="number"
                      step="0.01"
                      value={formData.valorTotal / 100}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          valorTotal: Math.round(parseFloat(e.target.value) * 100),
                        })
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
                  <Button type="submit" disabled={createPedido.isPending}>
                    {createPedido.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Pedidos de Compra</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : pedidos && pedidos.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidos.map((pedido: any) => (
                    <TableRow key={pedido.id}>
                      <TableCell>
                        {new Date(pedido.dataPedido).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {fornecedores?.find((f: { id: number; razaoSocial: string }) => f.id === pedido.fornecedorId)?.razaoSocial ||
                          "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {(pedido.valorTotal / 100).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getStatusColor(pedido.status)}`}>
                          {pedido.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">Nenhum pedido de compra cadastrado.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
