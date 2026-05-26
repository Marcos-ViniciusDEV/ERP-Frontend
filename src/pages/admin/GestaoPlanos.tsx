import AdminSaasLayout from "./AdminSaasLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { money, saasApi, useSaasData } from "./saasUtils";

export default function GestaoPlanos() {
  const { data, loading, error, reload } = useSaasData<any[]>(saasApi.planos, []);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  const save = async () => {
    try {
      const payload = {
        ...form,
        codigo: String(form.codigo ?? "").toUpperCase(),
        precoMensal: Math.round(Number(form.precoMensal || 0) * 100),
        precoAnual: Math.round(Number(form.precoAnual || 0) * 100),
        limiteUsuarios: Number(form.limiteUsuarios || 1),
        limitePdvs: Number(form.limitePdvs || 1),
        limiteProdutos: Number(form.limiteProdutos || 500),
        ativo: form.ativo ?? true,
      };
      if (form.id) await saasApi.atualizarPlano(form.id, payload);
      else await saasApi.criarPlano(payload);
      toast.success("Plano salvo");
      setForm({});
      setFormOpen(false);
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Erro ao salvar plano");
    }
  };

  return (
    <AdminSaasLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Planos & Limites</h1>
            <p className="text-muted-foreground">Defina preços, limites e módulos disponíveis para cada plano.</p>
          </div>
          <Button onClick={() => { setForm({ ativo: true }); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Plano
          </Button>
        </div>

        {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        {formOpen && (
          <Card>
            <CardHeader><CardTitle>{form.id ? "Editar Plano" : "Novo Plano"}</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Input placeholder="Nome" value={form.nome ?? ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              <Input placeholder="Código" value={form.codigo ?? ""} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
              <Input placeholder="Preço mensal" type="number" value={form.precoMensal ?? ""} onChange={(e) => setForm({ ...form, precoMensal: e.target.value })} />
              <Input placeholder="Preço anual" type="number" value={form.precoAnual ?? ""} onChange={(e) => setForm({ ...form, precoAnual: e.target.value })} />
              <Input placeholder="Limite usuários" type="number" value={form.limiteUsuarios ?? ""} onChange={(e) => setForm({ ...form, limiteUsuarios: e.target.value })} />
              <Input placeholder="Limite PDVs" type="number" value={form.limitePdvs ?? ""} onChange={(e) => setForm({ ...form, limitePdvs: e.target.value })} />
              <Input placeholder="Limite produtos" type="number" value={form.limiteProdutos ?? ""} onChange={(e) => setForm({ ...form, limiteProdutos: e.target.value })} />
              <div className="flex items-center gap-2 rounded-md border px-3">
                <Switch checked={form.ativo ?? true} onCheckedChange={(ativo) => setForm({ ...form, ativo })} />
                <span className="text-sm">Ativo</span>
              </div>
              <Input className="md:col-span-2 xl:col-span-4" placeholder="Descrição" value={form.descricao ?? ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
              <div className="md:col-span-2 xl:col-span-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
                <Button onClick={save}>Salvar Plano</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? <Card><CardContent className="p-5">Carregando...</CardContent></Card> : (data ?? []).map((plano) => (
            <Card key={plano.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle>{plano.nome}</CardTitle>
                    <p className="text-sm text-muted-foreground">{plano.codigo}</p>
                  </div>
                  <Badge variant={plano.ativo ? "default" : "secondary"}>{plano.ativo ? "Ativo" : "Inativo"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <p className="text-3xl font-bold">{money(plano.precoMensal)}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                <div className="space-y-1 text-sm">
                  <p>{plano.limiteUsuarios} usuários</p>
                  <p>{plano.limitePdvs} PDVs</p>
                  <p>{plano.limiteProdutos} produtos</p>
                </div>
                <p className="min-h-10 text-sm text-muted-foreground">{plano.descricao}</p>
                <Button variant="outline" onClick={() => { setForm({ ...plano, precoMensal: (plano.precoMensal ?? 0) / 100, precoAnual: (plano.precoAnual ?? 0) / 100 }); setFormOpen(true); }}>Editar</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminSaasLayout>
  );
}
