import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  ShieldCheck, 
  Monitor, 
  Calculator, 
  KeyRound, 
  Users, 
  Info,
  Lock
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { Switch } from "@/components/ui/switch";

// Schema for user form
const userSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().optional(),
  role: z.enum(["user", "admin", "pdv_operator"]),
  supervisorPassword: z.string().optional(),
}).refine(() => true);

type UserFormValues = z.infer<typeof userSchema>;

type User = {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin" | "pdv_operator" | "trakto_admin";
  lastSignedIn: string | null;
  createdAt: string;
  fotoCaminho?: string | null;
  permissions?: string;
};

interface PermissionDefinition {
  key: string;
  name: string;
}

interface PermissionModuleGroup {
  module: string;
  items: PermissionDefinition[];
}

const PERMISSION_GROUPS: PermissionModuleGroup[] = [
  {
    module: "Cadastros",
    items: [
      { key: "cadastros_clientes", name: "Acesso a Clientes" },
      { key: "cadastros_departamentos", name: "Acesso a Departamentos" },
      { key: "estoque_produtos", name: "Acesso ao Cadastro de Produtos" },
      { key: "compras_fornecedores", name: "Acesso ao Cadastro de Fornecedores" },
    ],
  },
  {
    module: "Estoque",
    items: [
      { key: "estoque_entrada", name: "Entrada de Mercadoria (Compra/NFe)" },
      { key: "estoque_conferencia", name: "Conferência de Mercadoria" },
      { key: "estoque_materiais", name: "Ficha Técnica (Materiais / Receitas)" },
      { key: "estoque_producao", name: "Lançamento de Produção" },
      { key: "estoque_baixas", name: "Baixas Manuais de Estoque" },
      { key: "estoque_inventario", name: "Inventário e Auditoria" },
      { key: "produtos_incluir", name: "Produtos - Incluir Novo" },
      { key: "produtos_alterar", name: "Produtos - Alterar/Editar" },
      { key: "produtos_excluir", name: "Produtos - Excluir" },
    ],
  },
  {
    module: "Compras & Vendas",
    items: [
      { key: "compras_pedidos", name: "Pedidos de Compra" },
      { key: "vendas_consultar", name: "Histórico e Consulta de Vendas" },
      { key: "vendas_ofertas", name: "Gestão de Ofertas Agendadas" },
      { key: "vendas_devolucoes", name: "Trocas e Devoluções" },
    ],
  },
  {
    module: "Financeiro",
    items: [
      { key: "financeiro_receber", name: "Contas a Receber" },
      { key: "financeiro_pagar", name: "Contas a Pagar" },
      { key: "financeiro_caixa", name: "Movimentação de Caixa / Sangria" },
    ],
  },
  {
    module: "Relatórios & Outros",
    items: [
      { key: "relatorios_ver", name: "Visualizar Relatórios e Curva ABC" },
      { key: "utilitarios_etiquetas", name: "Emissão de Etiquetas" },
      { key: "pdv_online", name: "Acesso ao PDV Online" },
    ],
  },
];

export default function Usuarios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"erp" | "pdv">("erp");

  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});

  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const canManage = currentUser?.role === "admin" || currentUser?.role === "trakto_admin";

  const savePermissionsMutation = useMutation({
    mutationFn: async (payload: { userId: number; permissions: Record<string, boolean> }) => {
      const { data } = await api.put(`/users/${payload.userId}/permissions`, {
        permissions: payload.permissions
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Permissões do usuário atualizadas com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsPermissionsModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Erro ao salvar permissões");
    }
  });

  const handleOpenPermissions = (user: User) => {
    setSelectedUserForPermissions(user);
    
    // Parse current user permissions
    let parsedPerms: Record<string, boolean> = {};
    if (user.permissions) {
      try {
        parsedPerms = typeof user.permissions === "string" 
          ? JSON.parse(user.permissions) 
          : user.permissions;
      } catch (e) {
        console.error("Erro ao carregar permissões:", e);
      }
    }
    
    // Fill in default false values for undefined permissions
    const finalPerms: Record<string, boolean> = {};
    PERMISSION_GROUPS.forEach(group => {
      group.items.forEach(item => {
        finalPerms[item.key] = !!parsedPerms[item.key];
      });
    });
    
    setUserPermissions(finalPerms);
    setIsPermissionsModalOpen(true);
  };

  const handleTogglePermission = (key: string) => {
    setUserPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", searchTerm],
    queryFn: async () => {
      const { data } = await api.get<User[]>("/users");
      if (searchTerm) {
        return data.filter(u => 
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newUser: any) => {
      const { data } = await api.post("/users", newUser);
      return data;
    },
    onSuccess: () => {
      toast.success("Usuário do time criado com sucesso!");
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.message || "Erro ao criar usuário");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { data: result } = await api.put(`/users/${id}`, data);
      return result;
    },
    onSuccess: () => {
      toast.success("Usuário atualizado com sucesso!");
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.message || "Erro ao atualizar usuário");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      toast.success("Usuário removido com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.message || "Erro ao remover usuário");
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: "user",
    }
  });

  const selectedRole = watch("role");

  const resetForm = () => {
    reset({
      name: "",
      email: "",
      password: "",
      role: activeTab === "pdv" ? "pdv_operator" : "user",
      supervisorPassword: "",
    });
    setEditingUser(null);
  };

  const handleOpenNewUserModal = () => {
    const plano = currentUser?.empresa?.plano;
    const isStarterOrBasico = plano === "STARTER" || plano === "BASICO";
    if (isStarterOrBasico && users && users.length >= 1) {
      toast.error("O plano atual permite apenas 1 usuário. Faça upgrade para adicionar mais.");
      return;
    }
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setValue("name", user.name);
    setValue("email", user.email);
    setValue("role", user.role === "trakto_admin" ? "admin" : (user.role as any));
    setValue("password", ""); 
    setValue("supervisorPassword", "");
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!canManage) {
      toast.error("Você não tem permissão para realizar esta ação.");
      return;
    }
    if (confirm("Tem certeza que deseja remover este usuário do time?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: UserFormValues) => {
    if (!canManage) {
      toast.error("Você não tem permissão para salvar alterações.");
      return;
    }

    if (!editingUser) {
      const plano = currentUser?.empresa?.plano;
      const isStarterOrBasico = plano === "STARTER" || plano === "BASICO";
      if (isStarterOrBasico && users && users.length >= 1) {
        toast.error("O plano atual permite apenas 1 usuário. Faça upgrade para adicionar mais.");
        return;
      }
    }

    if (!editingUser && !data.password) {
      toast.error("Senha é obrigatória para novos usuários");
      return;
    }

    const payload: any = {
      name: data.name,
      email: data.email,
      role: data.role,
    };

    if (data.password) payload.password = data.password;
    if (data.supervisorPassword) payload.supervisorPassword = data.supervisorPassword;

    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Filter users by role categories
  const erpUsers = users?.filter(u => u.role === "admin" || u.role === "user" || u.role === "trakto_admin") || [];
  const pdvUsers = users?.filter(u => u.role === "pdv_operator") || [];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Usuários e Permissões
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie quem pode acessar o Sistema ERP de retaguarda e quem opera as frentes de caixa (PDV).
            </p>
          </div>
          {canManage ? (
            <Button onClick={handleOpenNewUserModal} className="shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Plus className="mr-2 h-4 w-4" /> Novo Usuário
            </Button>
          ) : (
            <Badge variant="outline" className="flex items-center gap-1.5 py-1.5 px-3 border-amber-200 bg-amber-50 text-amber-800">
              <Lock className="h-3.5 w-3.5" /> Visualização (Apenas Leitura)
            </Badge>
          )}
        </div>

        {/* Statistics Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="overflow-hidden border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acessam o ERP</span>
                <h3 className="text-2xl font-bold">{isLoading ? "..." : erpUsers.length}</h3>
                <p className="text-xs text-muted-foreground">Administradores e usuários web</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Monitor className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Operam o PDV</span>
                <h3 className="text-2xl font-bold">{isLoading ? "..." : pdvUsers.length}</h3>
                <p className="text-xs text-muted-foreground">Frentes de caixa cadastradas</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Calculator className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sua Empresa</span>
                <h3 className="text-lg font-bold truncate max-w-[200px]">
                  {currentUser?.empresa?.nomeFantasia || currentUser?.empresa?.razaoSocial || "Admin Geral"}
                </h3>
                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 text-[10px] mt-0.5">
                  Plano {currentUser?.empresa?.plano || "SUPER ADMIN"}
                </Badge>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs and Management */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Gerenciar Usuários</CardTitle>
              <CardDescription>Gerenciamento especializado baseado no canal de acesso (ERP vs PDV).</CardDescription>
            </div>
            
            {/* Search Input */}
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full"
                />
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs 
              value={activeTab} 
              onValueChange={(val) => {
                setActiveTab(val as any);
                setValue("role", val === "pdv" ? "pdv_operator" : "user");
              }} 
              className="space-y-6"
            >
              <TabsList className="bg-slate-100 p-1 rounded-xl">
                <TabsTrigger value="erp" className="rounded-lg px-4 py-2 flex items-center gap-2">
                  <Monitor className="h-4 w-4" /> 💻 Usuários do Sistema ERP
                </TabsTrigger>
                <TabsTrigger value="pdv" className="rounded-lg px-4 py-2 flex items-center gap-2">
                  <Calculator className="h-4 w-4" /> 🛒 Operadores do Sistema PDV
                </TabsTrigger>
              </TabsList>

              {/* ERP TAB CONTENT */}
              <TabsContent value="erp" className="space-y-4">
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3 text-sm text-blue-900">
                  <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Usuários do ERP Administrativo</span>
                    Estes usuários possuem acesso ao painel web completo. O **Administrador** pode ver relatórios, gerenciar produtos e configurar o sistema. O **Usuário Web** acessa as rotinas de retaguarda autorizadas.
                  </div>
                </div>

                <div className="rounded-xl border overflow-hidden bg-card shadow-inner">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-bold">Nome</TableHead>
                        <TableHead className="font-bold">Email</TableHead>
                        <TableHead className="font-bold">Função</TableHead>
                        <TableHead className="font-bold">Último Acesso</TableHead>
                        <TableHead className="text-right font-bold">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                            Carregando usuários ERP...
                          </TableCell>
                        </TableRow>
                      ) : erpUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                            Nenhum usuário ERP cadastrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        erpUsers.map((user) => (
                          <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell className="font-medium flex items-center gap-2.5 py-4">
                              {user.fotoCaminho ? (
                                <img 
                                  src={`http://localhost:3000${user.fotoCaminho}`} 
                                  alt={user.name} 
                                  className="h-8 w-8 rounded-full object-cover shadow-sm border border-slate-200 shrink-0"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              {user.name}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge 
                                className={
                                  user.role === "trakto_admin" 
                                    ? "bg-purple-100 text-purple-800 hover:bg-purple-100" 
                                    : user.role === "admin" 
                                    ? "bg-rose-100 text-rose-800 hover:bg-rose-100" 
                                    : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                }
                              >
                                {user.role === "trakto_admin" ? "Trakto Admin" : user.role === "admin" ? "Administrador" : "Usuário Web"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {user.lastSignedIn ? new Date(user.lastSignedIn).toLocaleString() : "-"}
                            </TableCell>
                            <TableCell className="text-right py-4">
                              <div className="flex justify-end gap-1.5">
                                {canManage && (
                                  <>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700" 
                                      title="Editar Permissões"
                                      onClick={() => handleOpenPermissions(user)}
                                    >
                                      <ShieldCheck className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="hover:bg-slate-100 text-slate-600" onClick={() => handleEdit(user)}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-rose-500 hover:bg-rose-50 hover:text-rose-600" onClick={() => handleDelete(user.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* PDV TAB CONTENT */}
              <TabsContent value="pdv" className="space-y-4">
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex gap-3 text-sm text-emerald-950">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Operadores de Caixa e Fiscais de PDV</span>
                    Estes colaboradores acessam especificamente os terminais físicos e o PDV Online. Eles efetuam vendas diárias de frente de loja e não necessitam de acesso ao sistema de retaguarda completo.
                  </div>
                </div>

                <div className="rounded-xl border overflow-hidden bg-card shadow-inner">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-bold">Operador</TableHead>
                        <TableHead className="font-bold">E-mail de Acesso</TableHead>
                        <TableHead className="font-bold">Status PDV</TableHead>
                        <TableHead className="font-bold">Senha de Supervisor</TableHead>
                        <TableHead className="font-bold">Último Login</TableHead>
                        <TableHead className="text-right font-bold">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                            Carregando operadores PDV...
                          </TableCell>
                        </TableRow>
                      ) : pdvUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                            Nenhum operador de PDV cadastrado para o time.
                          </TableCell>
                        </TableRow>
                      ) : (
                        pdvUsers.map((user) => (
                          <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell className="font-medium flex items-center gap-2.5 py-4">
                              {user.fotoCaminho ? (
                                <img 
                                  src={`http://localhost:3000${user.fotoCaminho}`} 
                                  alt={user.name} 
                                  className="h-8 w-8 rounded-full object-cover shadow-sm border border-slate-200 shrink-0"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              {user.name}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                                Operador PDV
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                                <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                                Habilitada
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {user.lastSignedIn ? new Date(user.lastSignedIn).toLocaleString() : "-"}
                            </TableCell>
                            <TableCell className="text-right py-4">
                              <div className="flex justify-end gap-1.5">
                                {canManage && (
                                  <>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700" 
                                      title="Editar Permissões"
                                      onClick={() => handleOpenPermissions(user)}
                                    >
                                      <ShieldCheck className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="hover:bg-slate-100 text-slate-600" onClick={() => handleEdit(user)}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-rose-500 hover:bg-rose-50 hover:text-rose-600" onClick={() => handleDelete(user.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Dialog Modal for Create & Edit */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                {editingUser ? "📝 Editar Usuário do Time" : "✨ Novo Usuário no Sistema"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-sm font-semibold">Nome Completo</Label>
                <Input id="name" {...register("name")} placeholder="Ex: João da Silva" className="rounded-lg" />
                {errors.name && <span className="text-rose-500 text-xs">{errors.name.message}</span>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-sm font-semibold">Email de Acesso</Label>
                <Input id="email" type="email" {...register("email")} placeholder="Ex: joao@empresa.com" className="rounded-lg" />
                {errors.email && <span className="text-rose-500 text-xs">{errors.email.message}</span>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="role" className="text-sm font-semibold">Tipo de Acesso (Função)</Label>
                <Select 
                  onValueChange={(value) => setValue("role", value as any)} 
                  value={watch("role")}
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Selecione o acesso" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeTab === "erp" ? (
                      <>
                        <SelectItem value="user">💻 Usuário Web (ERP Administrativo)</SelectItem>
                        <SelectItem value="admin">🔑 Administrador (Acesso Completo)</SelectItem>
                      </>
                    ) : (
                      <SelectItem value="pdv_operator">🛒 Operador PDV (Frente de Caixa)</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="password" className="text-sm font-semibold">{editingUser ? "Nova Senha (opcional)" : "Senha de Acesso"}</Label>
                <Input id="password" type="password" {...register("password")} placeholder="Mínimo 6 caracteres" className="rounded-lg" />
              </div>

              {(selectedRole === "user" || selectedRole === "admin") && (
                <div className="space-y-1 bg-slate-50 border rounded-xl p-3.5">
                  <Label htmlFor="supervisorPassword" className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <KeyRound className="h-4 w-4 text-blue-600" />
                    Senha do Supervisor
                  </Label>
                  <Input 
                    id="supervisorPassword" 
                    type="password" 
                    {...register("supervisorPassword")} 
                    placeholder={editingUser ? "Deixe em branco para manter a atual" : "Digite a senha numérica"}
                    className="rounded-lg bg-background mt-1.5"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Esta senha especial de supervisor permite liberar ações restritas nos caixas PDV (como descontos e cancelamento de itens).
                  </p>
                </div>
              )}

              <DialogFooter className="pt-4 border-t gap-2 md:gap-0">
                <Button type="button" variant="outline" className="rounded-lg" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  {editingUser ? "Salvar Alterações" : "Adicionar Usuário"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog Modal for Permissions Management */}
        <Dialog open={isPermissionsModalOpen} onOpenChange={setIsPermissionsModalOpen}>
          <DialogContent className="sm:max-w-[650px] max-h-[85vh] flex flex-col p-0 rounded-2xl overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-4 border-b bg-slate-50/50">
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
                <ShieldCheck className="h-5.5 w-5.5 text-indigo-600" />
                <span>Editar Permissões do Usuário</span>
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Configure os acessos específicos de <strong>{selectedUserForPermissions?.name}</strong> ({selectedUserForPermissions?.email}) às rotinas do sistema.
              </p>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {selectedUserForPermissions?.role === "admin" || selectedUserForPermissions?.role === "trakto_admin" ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-sm text-amber-900">
                  <Lock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Acesso de Administrador Habilitado</span>
                    Este usuário possui a função de <strong>{selectedUserForPermissions.role === "trakto_admin" ? "Trakto Admin" : "Administrador"}</strong>. 
                    Usuários administradores têm acesso irrestrito a todas as rotinas e módulos do ERP por padrão.
                  </div>
                </div>
              ) : (
                PERMISSION_GROUPS.map((group) => (
                  <div key={group.module} className="space-y-2 border rounded-xl overflow-hidden bg-card shadow-sm">
                    <div className="bg-slate-50 px-4 py-2 border-b">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{group.module}</span>
                    </div>
                    <div className="divide-y">
                      {group.items.map((item) => (
                        <div key={item.key} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/30 transition-colors">
                          <div className="space-y-0.5 pr-4">
                            <span className="text-sm font-medium text-slate-700">{item.name}</span>
                          </div>
                          <Switch
                            checked={!!userPermissions[item.key]}
                            onCheckedChange={() => handleTogglePermission(item.key)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <DialogFooter className="px-6 py-4 border-t bg-slate-50/50 flex justify-end gap-2 md:gap-0">
              <Button type="button" variant="outline" className="rounded-lg" onClick={() => setIsPermissionsModalOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="button" 
                disabled={savePermissionsMutation.isPending || selectedUserForPermissions?.role === "admin" || selectedUserForPermissions?.role === "trakto_admin"} 
                className="rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium shadow-sm"
                onClick={() => savePermissionsMutation.mutate({
                  userId: selectedUserForPermissions!.id,
                  permissions: userPermissions
                })}
              >
                {savePermissionsMutation.isPending ? "Salvando..." : "Salvar Permissões"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
