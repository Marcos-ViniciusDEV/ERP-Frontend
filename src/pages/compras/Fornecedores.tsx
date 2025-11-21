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
import { trpc } from "@/lib/trpc";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Fornecedores() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { data: fornecedores, isLoading, refetch } = trpc.fornecedores.list.useQuery();
  const createFornecedor = trpc.fornecedores.create.useMutation();
  const updateFornecedor = trpc.fornecedores.update.useMutation();
  const deleteFornecedor = trpc.fornecedores.delete.useMutation();

  const [formData, setFormData] = useState({
    razaoSocial: "",
    nomeFantasia: "",
    cnpj: "",
    inscricaoEstadual: "",
    telefone: "",
    email: "",
    endereco: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateFornecedor.mutateAsync({ id: editingId, ...formData });
        toast.success("Fornecedor atualizado com sucesso!");
      } else {
        await createFornecedor.mutateAsync(formData);
        toast.success("Fornecedor cadastrado com sucesso!");
      }
      setOpen(false);
      setEditingId(null);
      refetch();
      setFormData({
        razaoSocial: "",
        nomeFantasia: "",
        cnpj: "",
        inscricaoEstadual: "",
        telefone: "",
        email: "",
        endereco: "",
      });
    } catch (error) {
      toast.error(editingId ? "Erro ao atualizar fornecedor" : "Erro ao cadastrar fornecedor");
    }
  };

  const handleEdit = (fornecedor: { id: number; razaoSocial: string; nomeFantasia: string | null; cnpj: string; inscricaoEstadual: string | null; telefone: string | null; email: string | null; endereco: string | null }) => {
    setEditingId(fornecedor.id);
    setFormData({
      razaoSocial: fornecedor.razaoSocial || "",
      nomeFantasia: fornecedor.nomeFantasia || "",
      cnpj: fornecedor.cnpj || "",
      inscricaoEstadual: fornecedor.inscricaoEstadual || "",
      telefone: fornecedor.telefone || "",
      email: fornecedor.email || "",
      endereco: fornecedor.endereco || "",
    });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este fornecedor?")) return;
    try {
      await deleteFornecedor.mutateAsync({ id });
      toast.success("Fornecedor excluído com sucesso!");
      refetch();
    } catch (error) {
      toast.error("Erro ao excluir fornecedor");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Fornecedores</h1>
            <p className="text-muted-foreground mt-1">Gerencie o cadastro de fornecedores</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Fornecedor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Fornecedor" : "Cadastrar Novo Fornecedor"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="razaoSocial">Razão Social *</Label>
                  <Input
                    id="razaoSocial"
                    value={formData.razaoSocial}
                    onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                  <Input
                    id="nomeFantasia"
                    value={formData.nomeFantasia}
                    onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cnpj">CNPJ *</Label>
                    <Input
                      id="cnpj"
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
                    <Input
                      id="inscricaoEstadual"
                      value={formData.inscricaoEstadual}
                      onChange={(e) =>
                        setFormData({ ...formData, inscricaoEstadual: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createFornecedor.isPending}>
                    {createFornecedor.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Fornecedores</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : fornecedores && fornecedores.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Razão Social</TableHead>
                    <TableHead>Nome Fantasia</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fornecedores.map((fornecedor: { id: number; razaoSocial: string; nomeFantasia: string | null; cnpj: string; inscricaoEstadual: string | null; telefone: string | null; email: string | null; endereco: string | null }) => (
                    <TableRow key={fornecedor.id}>
                      <TableCell className="font-medium">{fornecedor.razaoSocial}</TableCell>
                      <TableCell>{fornecedor.nomeFantasia || "-"}</TableCell>
                      <TableCell>{fornecedor.cnpj}</TableCell>
                      <TableCell>{fornecedor.telefone || "-"}</TableCell>
                      <TableCell>{fornecedor.email || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(fornecedor)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(fornecedor.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">Nenhum fornecedor cadastrado.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
