import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RadioTower, Save, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type FiscalConfig = {
  habilitarNfce: boolean;
  ambiente: "HOMOLOGACAO" | "PRODUCAO";
  regimeTributario: "SIMPLES_NACIONAL" | "LUCRO_PRESUMIDO" | "LUCRO_REAL";
  certificadoDigitalCaminho?: string | null;
  certificadoDigitalSenha?: string | null;
  certificadoValidade?: string | null;
  proximoNumeroNfce: number;
  proximoNumeroNfe: number;
  serieNfce: number;
  serieNfe: number;
  idTokenIsc?: string | null;
  csc?: string | null;
};

const defaultConfig: FiscalConfig = {
  habilitarNfce: false,
  ambiente: "HOMOLOGACAO",
  regimeTributario: "SIMPLES_NACIONAL",
  certificadoDigitalCaminho: "",
  certificadoDigitalSenha: "",
  certificadoValidade: "",
  proximoNumeroNfce: 1,
  proximoNumeroNfe: 1,
  serieNfce: 1,
  serieNfe: 1,
  idTokenIsc: "",
  csc: "",
};

export default function ConfiguracoesFiscais() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FiscalConfig>(defaultConfig);

  const { data, isLoading } = useQuery<FiscalConfig>({
    queryKey: ["fiscal-config"],
    queryFn: async () => {
      const response = await api.get("/fiscal/config");
      return response.data;
    },
  });

  useEffect(() => {
    if (data) {
      setForm({
        ...defaultConfig,
        ...data,
        certificadoValidade: data.certificadoValidade ? String(data.certificadoValidade).slice(0, 10) : "",
      });
    }
  }, [data]);

  const saveConfig = useMutation({
    mutationFn: async (enviarCargaPdv: boolean = false) => {
      const response = await api.put(`/fiscal/config${enviarCargaPdv ? "?enviarCarga=true" : ""}`, {
        ...form,
        enviarCargaPdv,
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Configuracoes fiscais salvas");
      if (data?.pdvCarga?.requested) {
        toast.success(`Carga fiscal enviada para ${data.pdvCarga.sent} PDV(s) online`);
      }
      queryClient.invalidateQueries({ queryKey: ["fiscal-config"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Erro ao salvar configuracoes fiscais");
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Configuracoes Fiscais</h1>
            <p className="text-sm text-muted-foreground">Parametros para NFC-e, NF-e, certificado A1 e numeracao fiscal.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => saveConfig.mutate(true)} disabled={saveConfig.isPending || isLoading}>
              <RadioTower className="h-4 w-4 mr-2" />
              Salvar e enviar carga PDV
            </Button>
            <Button onClick={() => saveConfig.mutate(false)} disabled={saveConfig.isPending || isLoading}>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Emissao e ambiente
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 rounded-md border p-3">
              <Checkbox id="habilitarNfce" checked={form.habilitarNfce} onCheckedChange={(checked) => setForm({ ...form, habilitarNfce: !!checked })} />
              <Label htmlFor="habilitarNfce">Habilitar NFC-e automatica no PDV</Label>
            </div>

            <div className="space-y-2">
              <Label>Ambiente</Label>
              <Select value={form.ambiente} onValueChange={(value: FiscalConfig["ambiente"]) => setForm({ ...form, ambiente: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOMOLOGACAO">Homologacao</SelectItem>
                  <SelectItem value="PRODUCAO">Producao</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Regime Tributario</Label>
              <Select value={form.regimeTributario} onValueChange={(value: FiscalConfig["regimeTributario"]) => setForm({ ...form, regimeTributario: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIMPLES_NACIONAL">Simples Nacional</SelectItem>
                  <SelectItem value="LUCRO_PRESUMIDO">Lucro Presumido</SelectItem>
                  <SelectItem value="LUCRO_REAL">Lucro Real</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Certificado Digital A1</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Caminho/identificador do certificado" value={form.certificadoDigitalCaminho || ""} onChange={(value) => setForm({ ...form, certificadoDigitalCaminho: value })} />
            <Field label="Senha do certificado" type="password" value={form.certificadoDigitalSenha || ""} onChange={(value) => setForm({ ...form, certificadoDigitalSenha: value })} />
            <Field label="Validade" type="date" value={form.certificadoValidade || ""} onChange={(value) => setForm({ ...form, certificadoValidade: value })} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Numeracao e CSC</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <NumberField label="Serie NFC-e" value={form.serieNfce} onChange={(value) => setForm({ ...form, serieNfce: value })} />
            <NumberField label="Proxima NFC-e" value={form.proximoNumeroNfce} onChange={(value) => setForm({ ...form, proximoNumeroNfce: value })} />
            <NumberField label="Serie NF-e" value={form.serieNfe} onChange={(value) => setForm({ ...form, serieNfe: value })} />
            <NumberField label="Proxima NF-e" value={form.proximoNumeroNfe} onChange={(value) => setForm({ ...form, proximoNumeroNfe: value })} />
            <Field label="ID Token CSC" value={form.idTokenIsc || ""} onChange={(value) => setForm({ ...form, idTokenIsc: value })} />
            <div className="md:col-span-3">
              <Field label="CSC" value={form.csc || ""} onChange={(value) => setForm({ ...form, csc: value })} />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
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

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type="number" min={1} value={value} onChange={(event) => onChange(parseInt(event.target.value) || 1)} />
    </div>
  );
}
