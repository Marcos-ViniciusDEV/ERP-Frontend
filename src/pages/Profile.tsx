import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/_core/hooks/useAuth";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Building2, CreditCard, Users, Loader2, Trash2, Camera } from "lucide-react";

export function Profile() {
  const { user, refresh } = useAuth();
  const queryClient = useQueryClient();

  // Estado para Meus Dados
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Estado para Empresa / CRM
  const [tipoVarejo, setTipoVarejo] = useState(user?.empresa?.tipoVarejo || "");
  const [faturamentoMensal, setFaturamentoMensal] = useState(user?.empresa?.faturamentoMensal || "");
  const [vendedores, setVendedores] = useState(user?.empresa?.vendedores || 0);

  // Estado para Criação de Usuário
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");

  useEffect(() => {
    if (user?.empresa) {
      setTipoVarejo(user.empresa.tipoVarejo || "");
      setFaturamentoMensal(user.empresa.faturamentoMensal || "");
      setVendedores(user.empresa.vendedores || 0);
    }
  }, [user]);

  // Query para buscar lista de usuários (se for admin)
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await api.get("/users");
      return data;
    },
    enabled: !!user,
  });

  // Mutações
  const updatePasswordMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/users/${user?.id}/password`, { currentPassword, newPassword: password });
    },
    onSuccess: () => {
      toast.success("Senha atualizada com sucesso!");
      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Erro ao atualizar senha")
  });

  const updateCrmMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/empresas/crm`, { tipoVarejo, faturamentoMensal, vendedores });
    },
    onSuccess: () => {
      toast.success("Dados da empresa atualizados!");
      refresh();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Erro ao atualizar dados")
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/users`, {
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: "user"
      });
    },
    onSuccess: () => {
      toast.success("Usuário criado com sucesso!");
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Erro ao criar usuário")
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      toast.success("Usuário excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Erro ao excluir usuário")
  });

  const updatePhotoMutation = useMutation({
    mutationFn: async (base64: string) => {
      await api.put(`/users/${user?.id}`, { foto: base64 });
    },
    onSuccess: () => {
      toast.success("Foto atualizada com sucesso!");
      refresh();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Erro ao atualizar foto")
  });

  // Handlers
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      return toast.error("Informe a senha atual");
    }
    if (password !== confirmPassword) {
      return toast.error("As senhas não coincidem");
    }
    if (password.length < 8) {
      return toast.error("A senha deve ter pelo menos 8 caracteres");
    }
    updatePasswordMutation.mutate();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        updatePhotoMutation.mutate(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateCrm = (e: React.FormEvent) => {
    e.preventDefault();
    updateCrmMutation.mutate();
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if ((user?.empresa?.plano === "STARTER" || user?.empresa?.plano === "BASICO") && users.length >= 1) {
      return toast.error("Limite de usuários atingido no plano atual.");
    }
    createUserMutation.mutate();
  };

  const isStarterBlocked = (user?.empresa?.plano === "STARTER" || user?.empresa?.plano === "BASICO") && users.length >= 1;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações da Conta</h1>
          <p className="text-muted-foreground">Gerencie suas preferências, dados da empresa e acessos.</p>
        </div>

        <Tabs defaultValue="dados" className="space-y-6">
          <TabsList className="bg-white border w-full justify-start h-auto p-1 shadow-sm rounded-xl">
            <TabsTrigger value="dados" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 py-2.5 px-4 rounded-lg"><User className="w-4 h-4 mr-2" /> Meus Dados</TabsTrigger>
            <TabsTrigger value="empresa" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 py-2.5 px-4 rounded-lg"><Building2 className="w-4 h-4 mr-2" /> Dados da Empresa</TabsTrigger>
            <TabsTrigger value="plano" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 py-2.5 px-4 rounded-lg"><CreditCard className="w-4 h-4 mr-2" /> Meu Plano</TabsTrigger>
            <TabsTrigger value="usuarios" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 py-2.5 px-4 rounded-lg"><Users className="w-4 h-4 mr-2" /> Usuários</TabsTrigger>
          </TabsList>

          {/* MEUS DADOS */}
          <TabsContent value="dados">
            <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl">
              <CardHeader>
                <CardTitle>Perfil de Usuário</CardTitle>
                <CardDescription>Informações pessoais e segurança.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6 mb-8">
                  <div className="relative group">
                    <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-3xl overflow-hidden border-4 border-white shadow-md">
                      {user?.empresa?.fotoCaminho || user?.fotoCaminho ? (
                         <img src={user?.fotoCaminho ? `http://localhost:3000${user.fotoCaminho}` : ''} alt={user?.name} className="w-full h-full object-cover" />
                      ) : (
                         user?.name?.[0]?.toUpperCase()
                      )}
                    </div>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 h-8 w-8 bg-blue-600 rounded-full text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors cursor-pointer"
                      title="Alterar foto"
                      disabled={updatePhotoMutation.isPending}
                    >
                      {updatePhotoMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handlePhotoUpload}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{user?.name}</h3>
                    <p className="text-muted-foreground">{user?.email}</p>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">{user?.role}</p>
                  </div>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-sm pt-4 border-t">
                  <h4 className="font-semibold mb-4">Alterar Senha</h4>
                  <div className="space-y-2">
                    <Label>Senha Atual</Label>
                    <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nova Senha</Label>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirmar Nova Senha</Label>
                    <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                  <Button type="submit" disabled={updatePasswordMutation.isPending || !password}>
                    {updatePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Atualizar Senha
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DADOS DA EMPRESA (CRM) */}
          <TabsContent value="empresa">
            <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl">
              <CardHeader>
                <CardTitle>Perfil da Empresa</CardTitle>
                <CardDescription>Ajude-nos a personalizar sua experiência no ERP.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateCrm} className="space-y-6 max-w-lg">
                  <div className="space-y-2">
                    <Label>Segmento / Tipo de Varejo</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={tipoVarejo}
                      onChange={(e) => setTipoVarejo(e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      <option value="Supermercado">Supermercado / Mercearia</option>
                      <option value="Farmacia">Farmácia / Drogaria</option>
                      <option value="CasaDeRacao">Casa de Ração / Petshop</option>
                      <option value="MateriaisConstrucao">Materiais de Construção</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Faturamento Mensal Estimado</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={faturamentoMensal}
                      onChange={(e) => setFaturamentoMensal(e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      <option value="Ate50k">Até R$ 50.000</option>
                      <option value="50k-100k">R$ 50.000 - R$ 100.000</option>
                      <option value="100k-500k">R$ 100.000 - R$ 500.000</option>
                      <option value="Acima500k">Acima de R$ 500.000</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Número de Operadores/Vendedores</Label>
                    <Input type="number" min="0" value={vendedores} onChange={(e) => setVendedores(Number(e.target.value))} />
                  </div>
                  <Button type="submit" disabled={updateCrmMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {updateCrmMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Dados da Empresa
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MEU PLANO */}
          <TabsContent value="plano">
            <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden relative">
              {user?.empresa?.plano === "TRIAL" && (
                <div className="absolute top-0 right-0 bg-amber-400 text-amber-950 font-bold px-4 py-1 text-xs rounded-bl-lg">
                  PERÍODO DE TESTE
                </div>
              )}
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="text-2xl flex items-center gap-2">
                  Plano Atual: <span className="text-blue-600">{user?.empresa?.plano || "Desconhecido"}</span>
                </CardTitle>
                <CardDescription>Gerencie sua assinatura e limites.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid sm:grid-cols-3 gap-6 mb-8">
                  <div className="border rounded-xl p-4 text-center bg-white shadow-sm">
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Usuários</h4>
                    <p className="text-2xl font-bold">
                      {user?.empresa?.plano === "STARTER" || user?.empresa?.plano === "BASICO" ? "1 Limite" : "Ilimitado"}
                    </p>
                  </div>
                  <div className="border rounded-xl p-4 text-center bg-white shadow-sm">
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Suporte</h4>
                    <p className="text-lg font-bold flex items-center justify-center h-[32px]">
                      {user?.empresa?.plano === "ENTERPRISE" ? "24/7 VIP" : user?.empresa?.plano === "BASICO" ? "8h às 18h (Seg-Sex)" : "Horário Comercial"}
                    </p>
                  </div>
                  <div className="border rounded-xl p-4 text-center bg-white shadow-sm">
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">PDVs Ativos</h4>
                    <p className="text-lg font-bold flex items-center justify-center h-[32px]">
                      {user?.empresa?.plano === "BASICO" ? "Somente Online" : "Ilimitado"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 border-t pt-6">
                  <Button size="lg" className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200">
                    Fazer Upgrade de Plano
                  </Button>
                  <Button size="lg" variant="outline">Ver Faturas</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* USUÁRIOS */}
          <TabsContent value="usuarios">
            <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-2xl">
              <CardHeader>
                <CardTitle>Gestão de Usuários</CardTitle>
                <CardDescription>Crie e gerencie os acessos da sua equipe.</CardDescription>
              </CardHeader>
              <CardContent>
                {isStarterBlocked && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-6 text-sm font-medium flex items-center">
                    <span className="text-xl mr-3">⚠️</span> 
                    Seu plano atual possui limite de 1 usuário. Você atingiu o limite. Faça upgrade para adicionar mais.
                  </div>
                )}
                
                <div className="grid md:grid-cols-2 gap-10">
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <h4 className="font-semibold mb-4 text-slate-700">Novo Usuário</h4>
                    <div className="space-y-2">
                      <Label>Nome Completo</Label>
                      <Input value={newUserName} onChange={e => setNewUserName(e.target.value)} disabled={isStarterBlocked} required />
                    </div>
                    <div className="space-y-2">
                      <Label>E-mail</Label>
                      <Input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} disabled={isStarterBlocked} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Senha Temporária</Label>
                      <Input type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} disabled={isStarterBlocked} required />
                    </div>
                    <Button type="submit" disabled={isStarterBlocked || createUserMutation.isPending} className="w-full">
                      {createUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Adicionar Usuário
                    </Button>
                  </form>

                  <div>
                    <h4 className="font-semibold mb-4 text-slate-700">Usuários Atuais</h4>
                    {loadingUsers ? (
                      <p className="text-sm text-slate-500">Carregando...</p>
                    ) : (
                      <div className="space-y-3">
                        {users.map((u: any) => (
                          <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                            <div>
                              <p className="font-medium text-sm">{u.name}</p>
                              <p className="text-xs text-slate-500">{u.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600 px-2 py-1 rounded">
                                {u.role}
                              </span>
                              {user?.id !== u.id && (
                                <button
                                  onClick={() => {
                                    if (confirm("Tem certeza que deseja excluir este usuário?")) {
                                      deleteUserMutation.mutate(u.id);
                                    }
                                  }}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors ml-2"
                                  title="Excluir Usuário"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
