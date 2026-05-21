import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, Users, DollarSign, Award, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

type Funcionario = {
  id: number;
  nome: string;
  cargo: string;
  salario: number;
  dataAdmissao: string;
  dataDesligamento: string | null;
  telefone: string | null;
  email: string | null;
  ativo: boolean;
};

export default function Funcionarios() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Funcionario | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    cargo: "",
    salario: 0, // em centavos
    dataAdmissao: new Date().toISOString().split("T")[0],
    dataDesligamento: "",
    telefone: "",
    email: "",
    ativo: true,
  });

  const queryClient = useQueryClient();

  const { data: funcionarios, isLoading } = useQuery<Funcionario[]>({
    queryKey: ["funcionarios"],
    queryFn: async () => {
      const { data } = await api.get("/funcionarios");
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post("/funcionarios", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
      toast.success("Funcionário cadastrado com sucesso!");
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Erro ao cadastrar funcionário");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.put(`/funcionarios/${editingEmp!.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
      toast.success("Dados do funcionário atualizados!");
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Erro ao atualizar dados");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/funcionarios/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
      toast.success("Funcionário removido com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao remover funcionário");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      salario: Number(formData.salario),
      dataDesligamento: formData.dataDesligamento || null,
      telefone: formData.telefone || null,
      email: formData.email || null,
    };

    if (editingEmp) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (emp: Funcionario) => {
    setEditingEmp(emp);
    setFormData({
      nome: emp.nome,
      cargo: emp.cargo,
      salario: emp.salario,
      dataAdmissao: emp.dataAdmissao ? new Date(emp.dataAdmissao).toISOString().split("T")[0] : "",
      dataDesligamento: emp.dataDesligamento ? new Date(emp.dataDesligamento).toISOString().split("T")[0] : "",
      telefone: emp.telefone || "",
      email: emp.email || "",
      ativo: emp.ativo,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover este funcionário?")) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setEditingEmp(null);
    setFormData({
      nome: "",
      cargo: "",
      salario: 0,
      dataAdmissao: new Date().toISOString().split("T")[0],
      dataDesligamento: "",
      telefone: "",
      email: "",
      ativo: true,
    });
  };

  const filteredFuncionarios = funcionarios?.filter((emp) =>
    emp.nome.toLowerCase().includes(search.toLowerCase()) ||
    emp.cargo.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const activeEmployees = funcionarios?.filter(e => e.ativo) || [];
  const totalFolha = activeEmployees.reduce((acc, curr) => acc + curr.salario, 0);
  const mediaSalarial = activeEmployees.length > 0 ? totalFolha / activeEmployees.length : 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-600" />
              Gestão de Funcionários
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Cadastre colaboradores, gerencie cargos, salários e controle a folha de pagamento.
            </p>
          </div>
          <Button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl"
          >
            <Plus className="mr-2 h-4 w-4" /> Novo Funcionário
          </Button>
        </div>

        {/* Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="overflow-hidden border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ativos / Total</span>
                <h3 className="text-3xl font-bold text-slate-800">
                  {isLoading ? "..." : `${activeEmployees.length} / ${funcionarios?.length || 0}`}
                </h3>
                <p className="text-xs text-muted-foreground">Colaboradores ativos no time</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Folha Salarial</span>
                <h3 className="text-3xl font-bold text-slate-800">
                  {isLoading ? "..." : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalFolha / 100)}
                </h3>
                <p className="text-xs text-muted-foreground">Custo total mensal em salários</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Média Salarial</span>
                <h3 className="text-3xl font-bold text-slate-800">
                  {isLoading ? "..." : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mediaSalarial / 100)}
                </h3>
                <p className="text-xs text-muted-foreground">Média paga aos colaboradores ativos</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Award className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou cargo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full rounded-xl shadow-sm border-slate-200"
            />
          </div>
        </div>

        {/* Table list */}
        <Card className="shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Carregando colaboradores...</div>
            ) : filteredFuncionarios.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">Nenhum funcionário encontrado.</div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-bold">Colaborador</TableHead>
                    <TableHead className="font-bold">Cargo</TableHead>
                    <TableHead className="font-bold text-right">Salário</TableHead>
                    <TableHead className="font-bold">Telefone</TableHead>
                    <TableHead className="font-bold">Admissão</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="text-right font-bold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFuncionarios.map((emp) => (
                    <TableRow key={emp.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-semibold py-4">
                        <div className="flex flex-col">
                          <span>{emp.nome}</span>
                          <span className="text-xs text-muted-foreground font-normal">{emp.email || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-700">{emp.cargo}</TableCell>
                      <TableCell className="text-right font-bold">
                        {(emp.salario / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{emp.telefone || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {emp.dataAdmissao ? new Date(emp.dataAdmissao).toLocaleDateString("pt-BR") : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={emp.ativo ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "bg-rose-100 text-rose-800 hover:bg-rose-100"}>
                          {emp.ativo ? "Ativo" : "Desligado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button variant="ghost" size="icon" className="hover:bg-slate-100 text-slate-600" onClick={() => handleEdit(emp)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-rose-500 hover:bg-rose-50 hover:text-rose-600" onClick={() => handleDelete(emp.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Modal Create/Edit */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[550px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                {editingEmp ? "📝 Editar Cadastro do Funcionário" : "✨ Novo Funcionário no Time"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              
              <div className="space-y-1">
                <Label htmlFor="nome" className="text-sm font-semibold">Nome Completo *</Label>
                <Input 
                  id="nome" 
                  value={formData.nome} 
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })} 
                  placeholder="Ex: Maria Eduarda Ferreira" 
                  required 
                  className="rounded-lg" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="cargo" className="text-sm font-semibold">Cargo / Função *</Label>
                  <Input 
                    id="cargo" 
                    value={formData.cargo} 
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })} 
                    placeholder="Ex: Operadora de Caixa" 
                    required 
                    className="rounded-lg" 
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="salario" className="text-sm font-semibold">Salário Mensal (R$) *</Label>
                  <Input 
                    id="salario" 
                    type="number"
                    step="0.01"
                    value={formData.salario / 100} 
                    onChange={(e) => setFormData({ ...formData, salario: Math.round(parseFloat(e.target.value) * 100) })} 
                    placeholder="1800.00" 
                    required 
                    className="rounded-lg" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="telefone" className="text-sm font-semibold">Telefone de Contato</Label>
                  <Input 
                    id="telefone" 
                    value={formData.telefone} 
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} 
                    placeholder="(82) 99999-9999" 
                    className="rounded-lg" 
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-sm font-semibold">E-mail</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    placeholder="maria@empresa.com" 
                    className="rounded-lg" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="dataAdmissao" className="text-sm font-semibold">Data de Admissão *</Label>
                  <Input 
                    id="dataAdmissao" 
                    type="date"
                    value={formData.dataAdmissao} 
                    onChange={(e) => setFormData({ ...formData, dataAdmissao: e.target.value })} 
                    required 
                    className="rounded-lg" 
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dataDesligamento" className="text-sm font-semibold">Data de Desligamento</Label>
                  <Input 
                    id="dataDesligamento" 
                    type="date"
                    value={formData.dataDesligamento} 
                    onChange={(e) => setFormData({ ...formData, dataDesligamento: e.target.value })} 
                    className="rounded-lg" 
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 border rounded-xl">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold text-slate-800">Colaborador Ativo</Label>
                  <p className="text-[11px] text-muted-foreground">Desative para marcar como desligado / inativo.</p>
                </div>
                <Switch 
                  checked={formData.ativo} 
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })} 
                />
              </div>

              <DialogFooter className="pt-4 border-t gap-2 md:gap-0">
                <Button type="button" variant="outline" className="rounded-lg" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  {editingEmp ? "Salvar Alterações" : "Adicionar Funcionário"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
