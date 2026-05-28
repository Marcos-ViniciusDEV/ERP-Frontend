import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, API_BASE_URL } from "@/lib/api";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, Upload, FileText, ArrowRightLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Schema for client form
const clientSchema = z.object({
  nome: z.string().min(1, "Nome e obrigatorio"),
  razaoSocial: z.string().optional().nullable(),
  nomeFantasia: z.string().optional().nullable(),
  tipoPessoa: z.enum(["FISICA", "JURIDICA", "ESTRANGEIRO"]).default("FISICA"),
  cpfCnpj: z.string().optional(),
  inscricaoEstadual: z.string().optional().nullable(),
  indicadorInscricaoEstadual: z.enum(["1", "2", "9"]).default("9"),
  email: z.string().email("Email invalido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  logradouro: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  complemento: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  municipio: z.string().optional().nullable(),
  codigoMunicipio: z.string().optional().nullable(),
  uf: z.string().optional().nullable(),
  cep: z.string().optional().nullable(),
  pais: z.string().optional().nullable(),
});

type ClientFormValues = z.input<typeof clientSchema>;

type Cliente = {
  id: number;
  nome: string;
  razaoSocial: string | null;
  nomeFantasia: string | null;
  tipoPessoa: "FISICA" | "JURIDICA" | "ESTRANGEIRO";
  cpfCnpj: string | null;
  inscricaoEstadual: string | null;
  indicadorInscricaoEstadual: "1" | "2" | "9" | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  municipio: string | null;
  codigoMunicipio: string | null;
  uf: string | null;
  cep: string | null;
  pais: string | null;
  fotoCaminho: string | null;
};

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  const { data: clientes, isLoading } = useQuery({
    queryKey: ["clientes", searchTerm],
    queryFn: async () => {
      const { data } = await api.get<Cliente[]>("/clientes", {
        params: { search: searchTerm },
      });
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newCliente: any) => {
      const { data } = await api.post("/clientes", newCliente);
      return data;
    },
    onSuccess: () => {
      toast.success("Cliente cadastrado com sucesso!");
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.message || "Erro ao cadastrar cliente");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { data: result } = await api.put(`/clientes/${id}`, data);
      return result;
    },
    onSuccess: () => {
      toast.success("Cliente atualizado com sucesso!");
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.message || "Erro ao atualizar cliente");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/clientes/${id}`);
    },
    onSuccess: () => {
      toast.success("Cliente removido com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.message || "Erro ao remover cliente");
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(clientSchema),
  });
  const tipoPessoa = watch("tipoPessoa") || "FISICA";
  const indicadorInscricaoEstadual = watch("indicadorInscricaoEstadual") || "9";

  const resetForm = () => {
    reset({
      nome: "",
      razaoSocial: "",
      nomeFantasia: "",
      tipoPessoa: "FISICA",
      cpfCnpj: "",
      inscricaoEstadual: "",
      indicadorInscricaoEstadual: "9",
      email: "",
      telefone: "",
      endereco: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      municipio: "",
      codigoMunicipio: "",
      uf: "",
      cep: "",
      pais: "Brasil",
    });
    setSelectedImage(null);
    setEditingClient(null);
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingClient(cliente);
    setValue("nome", cliente.nome);
    setValue("razaoSocial", cliente.razaoSocial || "");
    setValue("nomeFantasia", cliente.nomeFantasia || "");
    setValue("tipoPessoa", cliente.tipoPessoa || "FISICA");
    setValue("cpfCnpj", cliente.cpfCnpj || "");
    setValue("inscricaoEstadual", cliente.inscricaoEstadual || "");
    setValue("indicadorInscricaoEstadual", cliente.indicadorInscricaoEstadual || "9");
    setValue("email", cliente.email || "");
    setValue("telefone", cliente.telefone || "");
    setValue("endereco", cliente.endereco || "");
    setValue("logradouro", cliente.logradouro || "");
    setValue("numero", cliente.numero || "");
    setValue("complemento", cliente.complemento || "");
    setValue("bairro", cliente.bairro || "");
    setValue("municipio", cliente.municipio || "");
    setValue("codigoMunicipio", cliente.codigoMunicipio || "");
    setValue("uf", cliente.uf || "");
    setValue("cep", cliente.cep || "");
    setValue("pais", cliente.pais || "Brasil");
    setSelectedImage(cliente.fotoCaminho ?? null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: ClientFormValues) => {
    const payload = {
      ...data,
      foto: selectedImage?.startsWith("data:") ? selectedImage : undefined,
    };

    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Novo Cliente
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Gerenciar Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CPF/CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Foto</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : clientes?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">
                        Nenhum cliente encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    clientes?.map((cliente) => (
                      <TableRow key={cliente.id}>
                        <TableCell>
                          <Avatar>
                            <AvatarImage src={cliente.fotoCaminho ? `${API_BASE_URL}${cliente.fotoCaminho}` : ""} />
                            <AvatarFallback>{cliente.nome.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{cliente.nome}</TableCell>
                        <TableCell>{cliente.cpfCnpj}</TableCell>
                        <TableCell>{cliente.email}</TableCell>
                        <TableCell>{cliente.telefone}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" title="Gerar Nota Fiscal">
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Iniciar Movimento">
                              <ArrowRightLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(cliente)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(cliente.id)}>
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
          <DialogContent className="sm:max-w-[860px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingClient ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex flex-col items-center gap-4 mb-4">
                <Avatar className="h-24 w-24 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <AvatarImage src={selectedImage?.startsWith("data:") ? selectedImage : selectedImage ? `${API_BASE_URL}${selectedImage}` : ""} />
                  <AvatarFallback className="text-2xl">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <span className="text-xs text-muted-foreground">Clique para alterar a foto</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input id="nome" {...register("nome")} />
                  {errors.nome && <span className="text-red-500 text-xs">{String(errors.nome.message)}</span>}
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={tipoPessoa} onValueChange={(value: "FISICA" | "JURIDICA" | "ESTRANGEIRO") => setValue("tipoPessoa", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FISICA">Pessoa fisica</SelectItem>
                      <SelectItem value="JURIDICA">Pessoa juridica</SelectItem>
                      <SelectItem value="ESTRANGEIRO">Estrangeiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
                  <Input id="cpfCnpj" {...register("cpfCnpj")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inscricaoEstadual">Inscricao estadual</Label>
                  <Input id="inscricaoEstadual" {...register("inscricaoEstadual")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="razaoSocial">Razao social</Label>
                  <Input id="razaoSocial" {...register("razaoSocial")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nomeFantasia">Nome fantasia</Label>
                  <Input id="nomeFantasia" {...register("nomeFantasia")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register("email")} />
                  {errors.email && <span className="text-red-500 text-xs">{String(errors.email.message)}</span>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" {...register("telefone")} />
                </div>
                <div className="space-y-2">
                  <Label>Indicador IE</Label>
                  <Select value={indicadorInscricaoEstadual} onValueChange={(value: "1" | "2" | "9") => setValue("indicadorInscricaoEstadual", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Contribuinte ICMS</SelectItem>
                      <SelectItem value="2">Contribuinte isento</SelectItem>
                      <SelectItem value="9">Nao contribuinte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereco Completo</Label>
                <Input id="endereco" placeholder="Rua, Numero, Bairro, Cidade, CEP" {...register("endereco")} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logradouro">Logradouro</Label>
                  <Input id="logradouro" {...register("logradouro")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero">Numero</Label>
                  <Input id="numero" {...register("numero")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input id="bairro" {...register("bairro")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="municipio">Municipio</Label>
                  <Input id="municipio" {...register("municipio")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigoMunicipio">Codigo IBGE</Label>
                  <Input id="codigoMunicipio" {...register("codigoMunicipio")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uf">UF</Label>
                  <Input id="uf" maxLength={2} {...register("uf")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input id="cep" {...register("cep")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input id="complemento" {...register("complemento")} />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingClient ? "Salvar Alterações" : "Cadastrar Cliente"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
