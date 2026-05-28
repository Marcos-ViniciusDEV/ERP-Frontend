import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Cpu, KeyRound, Plus, RadioTower, Save, ShieldCheck, TestTube2 } from "lucide-react";
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

type CertificadoDigital = {
  id: number;
  nomeArquivo: string;
  caminhoSeguro: string;
  validade?: string | null;
  cnpj?: string | null;
  razaoSocial?: string | null;
  ativo: boolean;
};

type EmpresaFiscal = {
  razaoSocial: string;
  nomeFantasia?: string | null;
  cnpj: string;
  inscricaoEstadual?: string | null;
  inscricaoMunicipal?: string | null;
  crt?: "1" | "2" | "3";
  cnae?: string | null;
  telefone?: string | null;
  emailFiscal?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  municipio?: string | null;
  codigoMunicipio?: string | null;
  uf?: string | null;
  cep?: string | null;
};

type ProviderCredential = {
  id: number;
  provedor: "FOCUS_NFE" | "NFE_IO" | "PLUGNOTAS";
  ambiente: "HOMOLOGACAO" | "PRODUCAO";
  baseUrl?: string | null;
  companyId?: string | null;
  ativo: boolean;
};

type SatMfeEquipamento = {
  id: number;
  pdvId: string;
  tipo: "SAT" | "MFE";
  fabricante?: string | null;
  modelo?: string | null;
  numeroSerie?: string | null;
  status: string;
};

type FiscalReadiness = {
  readyForAutomaticNfce: boolean;
  readyForManualPortal: boolean;
  readyForSatMfe: boolean;
  provider: {
    configured: boolean;
    name: string | null;
    baseUrl: string | null;
    supportedModels: string[];
  };
  checks: Array<{
    code: string;
    ok: boolean;
    label: string;
    detail: string;
  }>;
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

const defaultEmpresaFiscal: EmpresaFiscal = {
  razaoSocial: "",
  nomeFantasia: "",
  cnpj: "",
  inscricaoEstadual: "",
  inscricaoMunicipal: "",
  crt: "1",
  cnae: "",
  telefone: "",
  emailFiscal: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  municipio: "",
  codigoMunicipio: "",
  uf: "",
  cep: "",
};

export default function ConfiguracoesFiscais() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FiscalConfig>(defaultConfig);
  const [empresaFiscal, setEmpresaFiscal] = useState<EmpresaFiscal>(defaultEmpresaFiscal);
  const [providerForm, setProviderForm] = useState({
    provedor: "FOCUS_NFE" as "FOCUS_NFE" | "NFE_IO" | "PLUGNOTAS",
    ambiente: "HOMOLOGACAO" as "HOMOLOGACAO" | "PRODUCAO",
    token: "",
    baseUrl: "",
    companyId: "",
    ativo: true,
  });
  const [certificadoForm, setCertificadoForm] = useState({
    nomeArquivo: "",
    caminhoSeguro: "",
    arquivoBase64: "",
    senha: "",
    validade: "",
    cnpj: "",
    razaoSocial: "",
  });
  const [equipamentoForm, setEquipamentoForm] = useState({
    pdvId: "",
    tipo: "SAT" as "SAT" | "MFE",
    fabricante: "",
    modelo: "",
    numeroSerie: "",
    codigoAtivacao: "",
    assinaturaAplicativoComercial: "",
    cnpjSoftwareHouse: "",
  });

  const { data, isLoading } = useQuery<FiscalConfig>({
    queryKey: ["fiscal-config"],
    queryFn: async () => {
      const response = await api.get("/fiscal/config");
      return response.data;
    },
  });

  const { data: empresaFiscalData } = useQuery<EmpresaFiscal>({
    queryKey: ["fiscal-empresa"],
    queryFn: async () => (await api.get("/fiscal/empresa")).data,
  });

  const { data: providerCredentials = [] } = useQuery<ProviderCredential[]>({
    queryKey: ["fiscal-provider-credentials"],
    queryFn: async () => (await api.get("/fiscal/provedor/credenciais")).data,
  });

  const { data: certificados = [] } = useQuery<CertificadoDigital[]>({
    queryKey: ["fiscal-certificados"],
    queryFn: async () => (await api.get("/fiscal/certificados")).data,
  });

  const { data: equipamentos = [] } = useQuery<SatMfeEquipamento[]>({
    queryKey: ["fiscal-sat-mfe-equipamentos"],
    queryFn: async () => (await api.get("/fiscal/sat-mfe/equipamentos")).data,
  });

  const { data: readiness } = useQuery<FiscalReadiness>({
    queryKey: ["fiscal-readiness"],
    queryFn: async () => (await api.get("/fiscal/readiness")).data,
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

  useEffect(() => {
    if (empresaFiscalData) {
      setEmpresaFiscal({ ...defaultEmpresaFiscal, ...empresaFiscalData });
    }
  }, [empresaFiscalData]);

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
      queryClient.invalidateQueries({ queryKey: ["fiscal-readiness"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Erro ao salvar configuracoes fiscais");
    },
  });

  const saveEmpresaFiscal = useMutation({
    mutationFn: async () => (await api.put("/fiscal/empresa", empresaFiscal)).data,
    onSuccess: () => {
      toast.success("Cadastro fiscal da empresa salvo");
      queryClient.invalidateQueries({ queryKey: ["fiscal-empresa"] });
      queryClient.invalidateQueries({ queryKey: ["fiscal-readiness"] });
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Erro ao salvar cadastro fiscal"),
  });

  const saveProviderCredential = useMutation({
    mutationFn: async () => (await api.post("/fiscal/provedor/credenciais", providerForm)).data,
    onSuccess: () => {
      toast.success("Credencial do provedor salva");
      setProviderForm({ ...providerForm, token: "" });
      queryClient.invalidateQueries({ queryKey: ["fiscal-provider-credentials"] });
      queryClient.invalidateQueries({ queryKey: ["fiscal-readiness"] });
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Erro ao salvar credencial do provedor"),
  });

  const createCertificado = useMutation({
    mutationFn: async () => (await api.post("/fiscal/certificados", certificadoForm)).data,
    onSuccess: () => {
      toast.success("Certificado cadastrado");
      setCertificadoForm({ nomeArquivo: "", caminhoSeguro: "", arquivoBase64: "", senha: "", validade: "", cnpj: "", razaoSocial: "" });
      queryClient.invalidateQueries({ queryKey: ["fiscal-certificados"] });
      queryClient.invalidateQueries({ queryKey: ["fiscal-readiness"] });
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Erro ao cadastrar certificado"),
  });

  const testCertificado = useMutation({
    mutationFn: async (id: number) => (await api.post(`/fiscal/certificados/${id}/testar`)).data,
    onSuccess: (data) => {
      data.ok ? toast.success("Certificado valido") : toast.warning(data.issues?.join(", ") || "Certificado precisa de ajustes");
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Erro ao testar certificado"),
  });

  const createEquipamento = useMutation({
    mutationFn: async () => (await api.post("/fiscal/sat-mfe/equipamentos", equipamentoForm)).data,
    onSuccess: () => {
      toast.success("Equipamento SAT/MFE cadastrado");
      setEquipamentoForm({
        pdvId: "",
        tipo: "SAT",
        fabricante: "",
        modelo: "",
        numeroSerie: "",
        codigoAtivacao: "",
        assinaturaAplicativoComercial: "",
        cnpjSoftwareHouse: "",
      });
      queryClient.invalidateQueries({ queryKey: ["fiscal-sat-mfe-equipamentos"] });
      queryClient.invalidateQueries({ queryKey: ["fiscal-readiness"] });
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Erro ao cadastrar equipamento"),
  });

  const testEquipamento = useMutation({
    mutationFn: async (id: number) => (await api.post(`/fiscal/sat-mfe/equipamentos/${id}/testar`)).data,
    onSuccess: (data) => toast.warning(data.message || "Teste real depende do agent local do PDV"),
    onError: (error: any) => toast.error(error.response?.data?.error || "Erro ao testar equipamento"),
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
              Diagnostico fiscal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <StatusTile active={!!readiness?.readyForAutomaticNfce} title="NFC-e automatica" description={readiness?.readyForAutomaticNfce ? "Pronta para transmissao" : "Precisa concluir pendencias"} />
              <StatusTile active={!!readiness?.readyForManualPortal} title="Portal manual" description="Disponivel para MEI/operacao sem certificado" />
              <StatusTile active={!!readiness?.readyForSatMfe} title="SAT/MFE" description={readiness?.readyForSatMfe ? "Equipamento ativo" : "Depende de equipamento/agent local"} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {(readiness?.checks || []).map((check) => (
                <div key={check.code} className="rounded-md border p-4">
                  <div className="flex items-start gap-3">
                    {check.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" /> : <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />}
                    <div>
                      <p className="font-semibold">{check.label}</p>
                      <p className="text-sm text-muted-foreground">{check.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
              Provedor fiscal: {readiness?.provider.configured ? readiness.provider.name : "nao configurado"}.
              {readiness?.provider.supportedModels?.length ? ` Modelos automaticos: ${readiness.provider.supportedModels.join(", ")}.` : " Sem provedor, o ERP prepara e controla os documentos, mas a autorizacao oficial precisa ser feita pelo portal/contador ou por integracao configurada."}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Cadastro fiscal da empresa</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Field label="Razao social" value={empresaFiscal.razaoSocial || ""} onChange={(value) => setEmpresaFiscal({ ...empresaFiscal, razaoSocial: value })} />
              <Field label="Nome fantasia" value={empresaFiscal.nomeFantasia || ""} onChange={(value) => setEmpresaFiscal({ ...empresaFiscal, nomeFantasia: value })} />
              <Field label="CNPJ" value={empresaFiscal.cnpj || ""} onChange={(value) => setEmpresaFiscal({ ...empresaFiscal, cnpj: value })} />
              <Field label="Inscricao estadual" value={empresaFiscal.inscricaoEstadual || ""} onChange={(value) => setEmpresaFiscal({ ...empresaFiscal, inscricaoEstadual: value })} />
              <div className="space-y-2">
                <Label>CRT</Label>
                <Select value={empresaFiscal.crt || "1"} onValueChange={(value: "1" | "2" | "3") => setEmpresaFiscal({ ...empresaFiscal, crt: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Simples Nacional</SelectItem>
                    <SelectItem value="2">Simples excesso sublimite</SelectItem>
                    <SelectItem value="3">Regime normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Field label="CNAE" value={empresaFiscal.cnae || ""} onChange={(value) => setEmpresaFiscal({ ...empresaFiscal, cnae: value })} />
              <Field label="Telefone" value={empresaFiscal.telefone || ""} onChange={(value) => setEmpresaFiscal({ ...empresaFiscal, telefone: value })} />
              <Field label="E-mail fiscal" value={empresaFiscal.emailFiscal || ""} onChange={(value) => setEmpresaFiscal({ ...empresaFiscal, emailFiscal: value })} />
              <Field label="Logradouro" value={empresaFiscal.logradouro || ""} onChange={(value) => setEmpresaFiscal({ ...empresaFiscal, logradouro: value })} />
              <Field label="Numero" value={empresaFiscal.numero || ""} onChange={(value) => setEmpresaFiscal({ ...empresaFiscal, numero: value })} />
              <Field label="Complemento" value={empresaFiscal.complemento || ""} onChange={(value) => setEmpresaFiscal({ ...empresaFiscal, complemento: value })} />
              <Field label="Bairro" value={empresaFiscal.bairro || ""} onChange={(value) => setEmpresaFiscal({ ...empresaFiscal, bairro: value })} />
              <Field label="Municipio" value={empresaFiscal.municipio || ""} onChange={(value) => setEmpresaFiscal({ ...empresaFiscal, municipio: value })} />
              <Field label="Codigo IBGE" value={empresaFiscal.codigoMunicipio || ""} onChange={(value) => setEmpresaFiscal({ ...empresaFiscal, codigoMunicipio: value })} />
              <Field label="UF" value={empresaFiscal.uf || ""} onChange={(value) => setEmpresaFiscal({ ...empresaFiscal, uf: value.toUpperCase().slice(0, 2) })} />
              <Field label="CEP" value={empresaFiscal.cep || ""} onChange={(value) => setEmpresaFiscal({ ...empresaFiscal, cep: value })} />
            </div>
            <Button onClick={() => saveEmpresaFiscal.mutate()} disabled={saveEmpresaFiscal.isPending || !empresaFiscal.razaoSocial || !empresaFiscal.cnpj}>
              <Save className="h-4 w-4 mr-2" />
              Salvar cadastro fiscal
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Credenciais do provedor fiscal</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Provedor</Label>
                <Select value={providerForm.provedor} onValueChange={(value: "FOCUS_NFE" | "NFE_IO" | "PLUGNOTAS") => setProviderForm({ ...providerForm, provedor: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FOCUS_NFE">Focus NFe</SelectItem>
                    <SelectItem value="NFE_IO">NFE.io</SelectItem>
                    <SelectItem value="PLUGNOTAS">PlugNotas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ambiente</Label>
                <Select value={providerForm.ambiente} onValueChange={(value: "HOMOLOGACAO" | "PRODUCAO") => setProviderForm({ ...providerForm, ambiente: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOMOLOGACAO">Homologacao</SelectItem>
                    <SelectItem value="PRODUCAO">Producao</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Field label="Token API" type="password" value={providerForm.token} onChange={(value) => setProviderForm({ ...providerForm, token: value })} />
              <Field label="Base URL opcional" value={providerForm.baseUrl} onChange={(value) => setProviderForm({ ...providerForm, baseUrl: value })} />
              <Field label="Company ID opcional" value={providerForm.companyId} onChange={(value) => setProviderForm({ ...providerForm, companyId: value })} />
            </div>
            <Button onClick={() => saveProviderCredential.mutate()} disabled={saveProviderCredential.isPending || !providerForm.token}>
              <KeyRound className="h-4 w-4 mr-2" />
              Salvar credencial
            </Button>
            <div className="grid gap-3 md:grid-cols-2">
              {providerCredentials.length === 0 ? (
                <div className="rounded-md border p-4 text-sm text-muted-foreground md:col-span-2">Nenhuma credencial cadastrada.</div>
              ) : providerCredentials.map((credential) => (
                <div key={credential.id} className="rounded-md border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{credential.provedor} - {credential.ambiente}</p>
                      <p className="text-sm text-muted-foreground">{credential.baseUrl || "URL padrao do provedor"}</p>
                    </div>
                    <Badge className={credential.ativo ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-700"}>{credential.ativo ? "Ativa" : "Inativa"}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Cofre de certificados A1
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Nome do arquivo" value={certificadoForm.nomeArquivo} onChange={(value) => setCertificadoForm({ ...certificadoForm, nomeArquivo: value })} />
              <Field label="Caminho seguro/identificador" value={certificadoForm.caminhoSeguro} onChange={(value) => setCertificadoForm({ ...certificadoForm, caminhoSeguro: value })} />
              <Field label="Senha" type="password" value={certificadoForm.senha} onChange={(value) => setCertificadoForm({ ...certificadoForm, senha: value })} />
              <Field label="Validade" type="date" value={certificadoForm.validade} onChange={(value) => setCertificadoForm({ ...certificadoForm, validade: value })} />
              <Field label="CNPJ do certificado" value={certificadoForm.cnpj} onChange={(value) => setCertificadoForm({ ...certificadoForm, cnpj: value })} />
              <Field label="Razao social" value={certificadoForm.razaoSocial} onChange={(value) => setCertificadoForm({ ...certificadoForm, razaoSocial: value })} />
              <div className="space-y-2">
                <Label>Arquivo A1 (.pfx/.p12)</Label>
                <Input
                  type="file"
                  accept=".pfx,.p12"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const arquivoBase64 = await fileToBase64(file);
                    setCertificadoForm({ ...certificadoForm, nomeArquivo: file.name, arquivoBase64 });
                  }}
                />
              </div>
            </div>
            <Button onClick={() => createCertificado.mutate()} disabled={!certificadoForm.nomeArquivo || (!certificadoForm.caminhoSeguro && !certificadoForm.arquivoBase64) || createCertificado.isPending}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar certificado
            </Button>

            <div className="grid gap-3 md:grid-cols-2">
              {certificados.length === 0 ? (
                <div className="rounded-md border p-4 text-sm text-muted-foreground md:col-span-2">Nenhum certificado cadastrado.</div>
              ) : certificados.map((certificado) => (
                <div key={certificado.id} className="rounded-md border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{certificado.nomeArquivo}</p>
                      <p className="text-sm text-muted-foreground">{certificado.cnpj || "CNPJ nao informado"}</p>
                      <p className="text-xs text-muted-foreground">Validade: {certificado.validade ? new Date(certificado.validade).toLocaleDateString("pt-BR") : "-"}</p>
                    </div>
                    <Badge className={certificado.ativo ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-700"}>
                      {certificado.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <Button className="mt-3" size="sm" variant="outline" onClick={() => testCertificado.mutate(certificado.id)}>
                    <TestTube2 className="h-4 w-4 mr-2" />
                    Testar validade
                  </Button>
                </div>
              ))}
            </div>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              SAT/MFE por PDV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Field label="PDV ID" value={equipamentoForm.pdvId} onChange={(value) => setEquipamentoForm({ ...equipamentoForm, pdvId: value })} />
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={equipamentoForm.tipo} onValueChange={(value: "SAT" | "MFE") => setEquipamentoForm({ ...equipamentoForm, tipo: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAT">SAT</SelectItem>
                    <SelectItem value="MFE">MFE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Field label="Fabricante" value={equipamentoForm.fabricante} onChange={(value) => setEquipamentoForm({ ...equipamentoForm, fabricante: value })} />
              <Field label="Modelo" value={equipamentoForm.modelo} onChange={(value) => setEquipamentoForm({ ...equipamentoForm, modelo: value })} />
              <Field label="Numero de serie" value={equipamentoForm.numeroSerie} onChange={(value) => setEquipamentoForm({ ...equipamentoForm, numeroSerie: value })} />
              <Field label="Codigo de ativacao" type="password" value={equipamentoForm.codigoAtivacao} onChange={(value) => setEquipamentoForm({ ...equipamentoForm, codigoAtivacao: value })} />
              <Field label="CNPJ software house" value={equipamentoForm.cnpjSoftwareHouse} onChange={(value) => setEquipamentoForm({ ...equipamentoForm, cnpjSoftwareHouse: value })} />
              <Field label="Assinatura app comercial" value={equipamentoForm.assinaturaAplicativoComercial} onChange={(value) => setEquipamentoForm({ ...equipamentoForm, assinaturaAplicativoComercial: value })} />
            </div>
            <Button onClick={() => createEquipamento.mutate()} disabled={!equipamentoForm.pdvId || createEquipamento.isPending}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar equipamento
            </Button>

            <div className="grid gap-3 md:grid-cols-2">
              {equipamentos.length === 0 ? (
                <div className="rounded-md border p-4 text-sm text-muted-foreground md:col-span-2">Nenhum equipamento SAT/MFE cadastrado.</div>
              ) : equipamentos.map((equipamento) => (
                <div key={equipamento.id} className="rounded-md border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{equipamento.tipo} - {equipamento.pdvId}</p>
                      <p className="text-sm text-muted-foreground">{[equipamento.fabricante, equipamento.modelo, equipamento.numeroSerie].filter(Boolean).join(" / ") || "Dados do equipamento pendentes"}</p>
                    </div>
                    <Badge variant="secondary">{equipamento.status}</Badge>
                  </div>
                  <Button className="mt-3" size="sm" variant="outline" onClick={() => testEquipamento.mutate(equipamento.id)}>
                    <RadioTower className="h-4 w-4 mr-2" />
                    Testar no agent local
                  </Button>
                </div>
              ))}
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

function StatusTile({ active, title, description }: { active: boolean; title: string; description: string }) {
  return (
    <div className="rounded-md border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge className={active ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
          {active ? "OK" : "Pendente"}
        </Badge>
      </div>
    </div>
  );
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
