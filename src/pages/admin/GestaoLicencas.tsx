import AdminSaasLayout from "./AdminSaasLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { date, maskKey, saasApi, useSaasData } from "./saasUtils";

export default function GestaoLicencas() {
  const { data, loading, error, reload } = useSaasData<any[]>(saasApi.licencas, []);
  const empresas = useSaasData<any[]>(saasApi.empresas, []);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<any>({ tipo: "PDV_DESKTOP" });

  const create = async () => {
    try {
      const result = await saasApi.criarLicenca({ ...form, empresaId: Number(form.empresaId) });
      toast.success(`Licença gerada: ${result.chave}`);
      setForm({ tipo: "PDV_DESKTOP" });
      setFormOpen(false);
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Erro ao gerar licença");
    }
  };

  const revoke = async (id: number) => {
    try {
      await saasApi.revogarLicenca(id);
      toast.success("Licença revogada");
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Erro ao revogar licença");
    }
  };

  return (
    <AdminSaasLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Licenças</h1>
            <p className="text-muted-foreground">Gere e revogue chaves para ERP, PDV e API.</p>
          </div>
          <Button onClick={() => setFormOpen((value) => !value)}>
            <Plus className="mr-2 h-4 w-4" />
            Gerar Licença
          </Button>
        </div>

        {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        {formOpen && (
          <Card>
            <CardHeader><CardTitle>Nova Licença</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              <select className="h-10 rounded-md border bg-background px-3 text-sm" value={form.empresaId ?? ""} onChange={(e) => setForm({ ...form, empresaId: e.target.value })}>
                <option value="">Selecione a empresa</option>
                {(empresas.data ?? []).map((empresa: any) => (
                  <option key={empresa.id} value={empresa.id}>{empresa.nomeFantasia || empresa.razaoSocial}</option>
                ))}
              </select>
              <select className="h-10 rounded-md border bg-background px-3 text-sm" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                <option value="ERP_WEB">ERP Web</option>
                <option value="PDV_DESKTOP">PDV Desktop</option>
                <option value="PDV_MOBILE">PDV Mobile</option>
                <option value="API">API</option>
              </select>
              <Input placeholder="Dispositivo" value={form.dispositivoNome ?? ""} onChange={(e) => setForm({ ...form, dispositivoNome: e.target.value })} />
              <Button onClick={create} disabled={!form.empresaId}>Gerar</Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Licenças Emitidas</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Chave</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>Último uso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7}>Carregando...</TableCell></TableRow>
                ) : (data ?? []).map((row) => (
                  <TableRow key={row.licenca.id}>
                    <TableCell className="font-medium">{row.empresa?.nomeFantasia || row.empresa?.razaoSocial}</TableCell>
                    <TableCell><Badge variant="secondary">{row.licenca.tipo}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{maskKey(row.licenca.chave)}</TableCell>
                    <TableCell><Badge variant={row.licenca.status === "ATIVA" ? "default" : "destructive"}>{row.licenca.status}</Badge></TableCell>
                    <TableCell>{row.licenca.dispositivoNome ?? "-"}</TableCell>
                    <TableCell>{date(row.licenca.ultimoUso)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(row.licenca.chave); toast.success("Chave copiada"); }}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => revoke(row.licenca.id)}>Revogar</Button>
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
