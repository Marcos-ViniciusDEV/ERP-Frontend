import AdminSaasLayout from "./AdminSaasLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Lock, Plus, Search, Unlock } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { date, saasApi, useSaasData } from "./saasUtils";

export default function GestaoEmpresas() {
  const { data, loading, error, reload } = useSaasData<any[]>(saasApi.empresas, []);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<any>({ planoId: "" });

  const empresas = useMemo(() => {
    const term = search.toLowerCase();
    return (data ?? []).filter((empresa) =>
      [empresa.nomeFantasia, empresa.razaoSocial, empresa.cnpj].some((value) =>
        String(value ?? "").toLowerCase().includes(term)
      )
    );
  }, [data, search]);

  const stats = {
    total: data?.length ?? 0,
    ativas: data?.filter((empresa) => empresa.ativo && !empresa.bloqueado).length ?? 0,
    bloqueadas: data?.filter((empresa) => empresa.bloqueado).length ?? 0,
  };

  const submit = async () => {
    try {
      await saasApi.criarEmpresa({
        ...form,
        limiteUsuarios: Number(form.limiteUsuarios || 5),
        limitePdvs: Number(form.limitePdvs || 2),
        limiteProdutos: Number(form.limiteProdutos || 1000),
        planoId: form.planoId ? Number(form.planoId) : undefined,
      });
      toast.success("Empresa criada com sucesso");
      setFormOpen(false);
      setForm({ planoId: "" });
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Erro ao criar empresa");
    }
  };

  const toggleBloqueio = async (empresa: any) => {
    try {
      if (empresa.bloqueado) {
        await saasApi.desbloquearEmpresa(empresa.id);
        toast.success("Empresa desbloqueada");
      } else {
        const motivo = window.prompt("Motivo do bloqueio", "Inadimplência");
        if (!motivo) return;
        await saasApi.bloquearEmpresa(empresa.id, motivo);
        toast.success("Empresa bloqueada");
      }
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Erro ao atualizar empresa");
    }
  };

  return (
    <AdminSaasLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Empresas</h1>
            <p className="text-muted-foreground">Cadastro, bloqueio e acompanhamento dos clientes assinantes.</p>
          </div>
          <Button onClick={() => setFormOpen((value) => !value)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Empresa
          </Button>
        </div>

        {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Ativas</p><p className="text-2xl font-bold">{stats.ativas}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Bloqueadas</p><p className="text-2xl font-bold">{stats.bloqueadas}</p></CardContent></Card>
        </div>

        {formOpen && (
          <Card>
            <CardHeader><CardTitle>Nova Empresa</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Input placeholder="Razão social" value={form.razaoSocial ?? ""} onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })} />
              <Input placeholder="Nome fantasia" value={form.nomeFantasia ?? ""} onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })} />
              <Input placeholder="CNPJ" value={form.cnpj ?? ""} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
              <Input placeholder="Código de acesso" value={form.codigoAcesso ?? ""} onChange={(e) => setForm({ ...form, codigoAcesso: e.target.value })} />
              <Input placeholder="Senha de ativação" type="password" value={form.senhaAtivacao ?? ""} onChange={(e) => setForm({ ...form, senhaAtivacao: e.target.value })} />
              <Input placeholder="Limite usuários" type="number" value={form.limiteUsuarios ?? ""} onChange={(e) => setForm({ ...form, limiteUsuarios: e.target.value })} />
              <Input placeholder="Limite PDVs" type="number" value={form.limitePdvs ?? ""} onChange={(e) => setForm({ ...form, limitePdvs: e.target.value })} />
              <Input placeholder="Limite produtos" type="number" value={form.limiteProdutos ?? ""} onChange={(e) => setForm({ ...form, limiteProdutos: e.target.value })} />
              <div className="md:col-span-2 xl:col-span-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
                <Button onClick={submit}>Salvar Empresa</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle>Lista de Empresas</CardTitle>
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Buscar por nome ou CNPJ" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>PDVs</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7}>Carregando...</TableCell></TableRow>
                ) : empresas.map((empresa) => (
                  <TableRow key={empresa.id}>
                    <TableCell className="font-medium">{empresa.nomeFantasia || empresa.razaoSocial}</TableCell>
                    <TableCell>{empresa.cnpj}</TableCell>
                    <TableCell><Badge variant="secondary">{empresa.planoSaas?.nome ?? empresa.plano}</Badge></TableCell>
                    <TableCell><Badge variant={empresa.bloqueado ? "destructive" : "default"}>{empresa.bloqueado ? "Bloqueada" : "Ativa"}</Badge></TableCell>
                    <TableCell>{empresa.pdvsAtivos ?? 0}/{empresa.limitePdvs ?? "-"}</TableCell>
                    <TableCell>{date(empresa.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => toggleBloqueio(empresa)}>
                        {empresa.bloqueado ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                        {empresa.bloqueado ? "Desbloquear" : "Bloquear"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminSaasLayout>
  );
}
