import AdminSaasLayout from "./AdminSaasLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { saasApi, useSaasData } from "./saasUtils";

type Credential = {
  id: number;
  provedor: "FOCUS_NFE";
  ambiente: "HOMOLOGACAO" | "PRODUCAO";
  baseUrl?: string | null;
  companyId?: string | null;
  ativo: boolean;
  updatedAt: string;
};

export default function GestaoProviderFiscal() {
  const { data = [], loading, error, reload } = useSaasData<Credential[]>(saasApi.fiscalProvider, []);
  const [form, setForm] = useState({
    provedor: "FOCUS_NFE" as const,
    ambiente: "HOMOLOGACAO" as "HOMOLOGACAO" | "PRODUCAO",
    token: "",
    baseUrl: "",
    companyId: "",
    ativo: true,
  });
  const [saving, setSaving] = useState(false);
  const credentials = data ?? [];

  const save = async () => {
    setSaving(true);
    try {
      await saasApi.salvarFiscalProvider(form);
      toast.success("Credencial global do provider salva");
      setForm({ ...form, token: "" });
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Erro ao salvar credencial global");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminSaasLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Provider Fiscal</h1>
          <p className="text-muted-foreground">Configure a credencial central usada pelas empresas para transmissao fiscal.</p>
        </div>

        {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Credencial global</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-2">
                <Label>Provider</Label>
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.provedor} disabled>
                  <option value="FOCUS_NFE">Focus NFe</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Ambiente</Label>
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.ambiente} onChange={(event) => setForm({ ...form, ambiente: event.target.value as typeof form.ambiente })}>
                  <option value="HOMOLOGACAO">Homologacao</option>
                  <option value="PRODUCAO">Producao</option>
                </select>
              </div>
              <Field label="Token API" type="password" value={form.token} onChange={(token) => setForm({ ...form, token })} />
              <Field label="Base URL opcional" value={form.baseUrl} onChange={(baseUrl) => setForm({ ...form, baseUrl })} />
              <Field label="Company ID opcional" value={form.companyId} onChange={(companyId) => setForm({ ...form, companyId })} />
            </div>
            <Button onClick={save} disabled={!form.token || saving}>
              <Save className="mr-2 h-4 w-4" />
              Salvar credencial global
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Ambientes configurados</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {loading ? <p>Carregando...</p> : credentials.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma credencial global cadastrada.</p>
            ) : credentials.map((credential) => (
              <div key={credential.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-4">
                <div>
                  <p className="font-semibold">{credential.provedor} - {credential.ambiente}</p>
                  <p className="text-sm text-muted-foreground">{credential.baseUrl || "URL padrao do provider"}</p>
                </div>
                <Badge className={credential.ativo ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-700"}>
                  {credential.ativo ? "Ativa" : "Inativa"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminSaasLayout>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
