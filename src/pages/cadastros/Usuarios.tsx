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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Pencil, Trash2, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/ui/badge";

// Schema for user form
const userSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().optional(),
  role: z.enum(["user", "admin", "pdv_operator"]),
  supervisorPassword: z.string().optional(),
}).refine((data) => {
  // Password is required for new users (we'll handle this logic in the component or separate schema if needed, 
  // but for now let's make it optional in schema and check in submit if it's creation)
  return true;
});

type UserFormValues = z.infer<typeof userSchema>;

type User = {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin" | "pdv_operator";
  lastSignedIn: string | null;
};

export default function Usuarios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", searchTerm],
    queryFn: async () => {
      const { data } = await api.get<User[]>("/users");
      // Client-side filtering for now as the API returns all users
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
      toast.success("Usuário criado com sucesso!");
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
      role: "user",
      supervisorPassword: "",
    });
    setEditingUser(null);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setValue("name", user.name);
    setValue("email", user.email);
    setValue("role", user.role);
    setValue("password", ""); // Don't show password
    setValue("supervisorPassword", ""); // Don't show supervisor password
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: UserFormValues) => {
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

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Novo Usuário
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Gerenciar Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : users?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">
                        Nenhum usuário encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-muted-foreground" />
                          {user.name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "destructive" : user.role === "pdv_operator" ? "secondary" : "default"}>
                            {user.role === "pdv_operator" ? "Operador PDV" : user.role === "admin" ? "Administrador" : "Usuário Web"}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.lastSignedIn ? new Date(user.lastSignedIn).toLocaleString() : "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(user.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Select 
                  onValueChange={(value) => setValue("role", value as any)} 
                  defaultValue={watch("role")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário Web</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="pdv_operator">Operador PDV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{editingUser ? "Nova Senha (opcional)" : "Senha"}</Label>
                <Input id="password" type="password" {...register("password")} />
              </div>

              {(selectedRole === "user" || selectedRole === "admin") && (
                <div className="space-y-2">
                  <Label htmlFor="supervisorPassword">Senha do Supervisor (para liberações)</Label>
                  <Input 
                    id="supervisorPassword" 
                    type="password" 
                    {...register("supervisorPassword")} 
                    placeholder="Deixe em branco para manter a atual"
                  />
                  <p className="text-xs text-muted-foreground">Usada para autorizar ações restritas no PDV</p>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingUser ? "Salvar Alterações" : "Criar Usuário"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
