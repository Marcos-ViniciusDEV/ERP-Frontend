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
import { Minus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function BaixasManuais() {
  const [open, setOpen] = useState(false);
  const { data: produtos } = trpc.produtos.list.useQuery();

  const { refetch } = trpc.kardex.listByProduto.useQuery(
    { produtoId: 0 },
    { enabled: false }
  );
  
  // Para listar todas as baixas manuais, vamos buscar do backend de forma diferente
  const [allMovimentacoes] = useState<any[]>([]);
  const createMovimentacao = trpc.kardex.create.useMutation();

  const [formData, setFormData] = useState({
    produtoId: 0,
    tipo: "BAIXA_PERDA" as const,
    quantidade: 0,
    observacao: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const produto = produtos?.find((p: { id: number; estoque: number }) => p.id === formData.produtoId);
    if (!produto) {
      toast.error("Produto não encontrado");
      return;
    }

    if (formData.quantidade <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }

    if (formData.quantidade > produto.estoque) {
      toast.error("Quantidade maior que o estoque disponível");
      return;
    }

    try {
      await createMovimentacao.mutateAsync({
        produtoId: formData.produtoId,
        tipo: formData.tipo,
        quantidade: formData.quantidade,
        saldoAnterior: produto.estoque,
        saldoAtual: produto.estoque - formData.quantidade,
        observacao: formData.observacao,
      });

      toast.success("Baixa registrada com sucesso!");
      setOpen(false);
      refetch();
      setFormData({
        produtoId: 0,
        tipo: "BAIXA_PERDA",
        quantidade: 0,
        observacao: "",
      });
    } catch (error) {
      toast.error("Erro ao registrar baixa");
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      BAIXA_PERDA: "Perda",
      BAIXA_LANCHE: "Lanche",
      BAIXA_USO: "Uso Interno",
    };
    return labels[tipo] || tipo;
  };

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      BAIXA_PERDA: "text-red-600",
      BAIXA_LANCHE: "text-orange-600",
      BAIXA_USO: "text-blue-600",
    };
    return colors[tipo] || "";
  };

  const baixasManuais = allMovimentacoes?.filter((m: any) =>
    ["BAIXA_PERDA", "BAIXA_LANCHE", "BAIXA_USO"].includes(m.tipo)
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Baixas Manuais</h1>
            <p className="text-muted-foreground mt-1">
              Registre perdas, lanches e uso interno de produtos
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Minus className="h-4 w-4 mr-2" />
                Nova Baixa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Baixa Manual</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="produtoId">Produto *</Label>
                  <Select
                    value={formData.produtoId.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, produtoId: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtos?.map((produto: { id: number; codigo: string; descricao: string; estoque: number }) => (
                        <SelectItem key={produto.id} value={produto.id.toString()}>
                          {produto.codigo} - {produto.descricao} (Estoque: {produto.estoque})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tipo">Tipo de Baixa *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BAIXA_PERDA">Perda (Vencimento, Quebra)</SelectItem>
                      <SelectItem value="BAIXA_LANCHE">Lanche (Consumo Funcionários)</SelectItem>
                      <SelectItem value="BAIXA_USO">Uso Interno (Limpeza, etc)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quantidade">Quantidade *</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    min="1"
                    value={formData.quantidade}
                    onChange={(e) =>
                      setFormData({ ...formData, quantidade: parseInt(e.target.value) || 0 })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="observacao">Observação</Label>
                  <Input
                    id="observacao"
                    value={formData.observacao}
                    onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                    placeholder="Motivo da baixa..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMovimentacao.isPending}>
                    {createMovimentacao.isPending ? "Salvando..." : "Registrar Baixa"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Baixas Manuais</CardTitle>
          </CardHeader>
          <CardContent>
            {baixasManuais && baixasManuais.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead>Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {baixasManuais.map((mov: any) => {
                    const produto = produtos?.find((p: { id: number; codigo: string; descricao: string }) => p.id === mov.produtoId);
                    return (
                      <TableRow key={mov.id}>
                        <TableCell>
                          {new Date(mov.createdAt).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {produto?.codigo} - {produto?.descricao}
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${getTipoColor(mov.tipo)}`}>
                            {getTipoLabel(mov.tipo)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{mov.quantidade}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {mov.observacao || "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">Nenhuma baixa manual registrada.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
