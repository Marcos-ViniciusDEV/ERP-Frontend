import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

export default function Departamentos() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [formData, setFormData] = useState({ nome: "", codigo: "" });

  const queryClient = useQueryClient();

  const { data: departamentos, isLoading } = useQuery({
    queryKey: ["departamentos"],
    queryFn: async () => {
      const { data } = await api.get("/departamentos");
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post("/departamentos", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departamentos"] });
      toast.success("Departamento criado com sucesso!");
      setIsModalOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("Erro ao criar departamento");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.put(`/departamentos/${editingDept.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departamentos"] });
      toast.success("Departamento atualizado com sucesso!");
      setIsModalOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("Erro ao atualizar departamento");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/departamentos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departamentos"] });
      toast.success("Departamento removido com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao remover departamento");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-generate code from name: UPPERCASE and spaces to underscores
    const generatedCode = formData.nome.toUpperCase().replace(/\s+/g, "_");
    
    const dataToSend = {
      ...formData,
      nome: formData.nome.toUpperCase(), // User asked for "tudo uppercase"
      codigo: formData.codigo || generatedCode,
    };

    if (editingDept) {
      updateMutation.mutate(dataToSend);
    } else {
      createMutation.mutate(dataToSend);
    }
  };

  const handleEdit = (dept: any) => {
    setEditingDept(dept);
    setFormData({ nome: dept.nome, codigo: dept.codigo });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover este departamento?")) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setEditingDept(null);
    setFormData({ nome: "", codigo: "" });
  };

  const filteredDepartamentos = departamentos?.filter((dept: any) =>
    dept.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Departamentos</h1>
          <Dialog open={isModalOpen} onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Novo Departamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingDept ? "Editar Departamento" : "Novo Departamento"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    required
                    placeholder="Ex: BEBIDAS"
                  />
                  <p className="text-xs text-muted-foreground">
                    Código gerado: {formData.nome ? formData.nome.toUpperCase().replace(/\s+/g, "_") : "..."}
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar departamentos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Código</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredDepartamentos?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Nenhum departamento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredDepartamentos?.map((dept: any) => (
                  <TableRow key={dept.id}>
                    <TableCell>{dept.id}</TableCell>
                    <TableCell>{dept.codigo}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(dept)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(dept.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
