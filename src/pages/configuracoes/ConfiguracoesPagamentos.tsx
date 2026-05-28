import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CreditCard, DownloadCloud, KeyRound, RadioTower, RefreshCcw, Save, Smartphone, WalletCards } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type PaymentConfig = {
  habilitarPagamentosManuais: boolean;
  habilitarTef: boolean;
  habilitarPosApi: boolean;
  habilitarPixIntegrado: boolean;
  modoPadraoCartao: "manual" | "tef" | "pos_api";
  exigirNsuNoManual: boolean;
  permitirVendaOfflineCartaoManual: boolean;
  permitirVendaOfflineTef: boolean;
  enviarCargaAutomaticaPdv: boolean;
  versaoCarga: number;
  formasPagamento: PaymentMethod[];
  adquirentes: Acquirer[];
  taxas: Rate[];
  terminaisPagamento: Terminal[];
  provedores: Provider[];
  credenciais: Credential[];
};

type Provider = {
  id: number;
  codigo: string;
  nome: string;
  tipo: string;
  permitePix: boolean;
  permiteCartao: boolean;
  permiteEnvioValorPdv: boolean;
  requerHomologacao: boolean;
};

type PaymentMethod = {
  id: number;
  codigo: string;
  nome: string;
  tipo: "dinheiro" | "debito" | "credito" | "pix" | "voucher" | "outro";
  modoCaptura: "manual" | "tef" | "pos_api" | "pix_integrado";
  ativo: boolean;
  permiteTroco: boolean;
  permiteParcelamento: boolean;
  maxParcelas: number;
  exigirAutorizacao: boolean;
  ordem: number;
};

type Acquirer = {
  id: number;
  provedorId?: number | null;
  nomeExibicao: string;
  ambiente: "homologacao" | "producao";
  ativo: boolean;
};

type Credential = {
  id: number;
  provedorId: number;
  adquirenteEmpresaId?: number | null;
  ambiente: "homologacao" | "producao";
  publicKey?: string | null;
  clientId?: string | null;
  accessTokenMasked?: string | null;
  clientSecretConfigured: boolean;
  webhookSecretConfigured: boolean;
  providerConfig?: Record<string, string>;
  statusValidacao?: string | null;
  ultimaValidacaoEm?: string | null;
  ultimoErro?: string | null;
  ativo: boolean;
};

type Rate = {
  id?: number;
  adquirenteEmpresaId?: number | null;
  modalidade: "debito" | "credito_vista" | "credito_parcelado" | "pix";
  bandeira?: string | null;
  parcelasInicio: number;
  parcelasFim: number;
  taxaPercentual: number;
  taxaFixaCentavos: number;
  prazoRecebimentoDias: number;
  origem: "manual" | "api_provedor" | "arquivo_importado" | "ajuste_usuario";
  ativo?: boolean;
};

type Terminal = {
  id: number;
  provedorId?: number | null;
  adquirenteEmpresaId?: number | null;
  pdvId: string;
  nomeTerminal: string;
  tipo: "manual" | "tef" | "pos_api";
  serialEquipamento?: string | null;
  codigoTerminal?: string | null;
  ipTerminal?: string | null;
  portaTerminal?: number | null;
  pathIntegradorLocal?: string | null;
  estabelecimentoTef?: string | null;
  terminalTef?: string | null;
  ultimoStatus?: string | null;
  ativo: boolean;
};

type ConnectedPdv = {
  id: string;
  name: string;
  location?: string | null;
  cnpjVinculado?: string | null;
  maquininha?: {
    conectada: boolean;
    nomeTerminal?: string | null;
    provedor?: string | null;
    status?: string | null;
    identificador?: string | null;
  };
};

type ConfigDraft = Pick<
  PaymentConfig,
  | "habilitarPagamentosManuais"
  | "habilitarTef"
  | "habilitarPosApi"
  | "habilitarPixIntegrado"
  | "modoPadraoCartao"
  | "exigirNsuNoManual"
  | "permitirVendaOfflineCartaoManual"
  | "permitirVendaOfflineTef"
  | "enviarCargaAutomaticaPdv"
>;

type AcquirerDraft = {
  provedorId?: number;
  provedorCodigo?: string;
  nomeExibicao: string;
  ambiente: "homologacao" | "producao";
  ativo: boolean;
};

type TerminalDraft = {
  pdvId: string;
  nomeTerminal: string;
  tipo: "manual" | "tef" | "pos_api";
  provedorId?: number;
  adquirenteEmpresaId?: number;
  serialEquipamento: string;
  codigoTerminal: string;
  ipTerminal: string;
  portaTerminal?: number;
  pathIntegradorLocal: string;
  estabelecimentoTef: string;
  terminalTef: string;
  ativo: boolean;
};

type CredentialDraft = {
  provedorId?: number;
  provedorCodigo: string;
  adquirenteEmpresaId?: number;
  ambiente: "homologacao" | "producao";
  publicKey: string;
  clientId: string;
  clientSecret: string;
  accessToken: string;
  webhookSecret: string;
  providerConfig: Record<string, string>;
  ativo: boolean;
};

const defaultConfig: ConfigDraft = {
  habilitarPagamentosManuais: true,
  habilitarTef: false,
  habilitarPosApi: false,
  habilitarPixIntegrado: false,
  modoPadraoCartao: "manual",
  exigirNsuNoManual: false,
  permitirVendaOfflineCartaoManual: true,
  permitirVendaOfflineTef: false,
  enviarCargaAutomaticaPdv: true,
};

const defaultAcquirer: AcquirerDraft = {
  provedorId: undefined as number | undefined,
  provedorCodigo: "",
  nomeExibicao: "",
  ambiente: "producao",
  ativo: true,
};

const BUILTIN_PROVIDERS: Provider[] = [
  { id: 0, codigo: "mercado_pago", nome: "Mercado Pago", tipo: "pos_api", permitePix: true, permiteCartao: true, permiteEnvioValorPdv: false, requerHomologacao: false },
  { id: 0, codigo: "stone", nome: "Stone", tipo: "pos_api", permitePix: true, permiteCartao: true, permiteEnvioValorPdv: false, requerHomologacao: false },
  { id: 0, codigo: "pagbank", nome: "PagBank / PagSeguro", tipo: "pos_api", permitePix: true, permiteCartao: true, permiteEnvioValorPdv: false, requerHomologacao: false },
  { id: 0, codigo: "itau", nome: "Itau / Iti", tipo: "pos_api", permitePix: true, permiteCartao: true, permiteEnvioValorPdv: false, requerHomologacao: false },
  { id: 0, codigo: "cielo", nome: "Cielo", tipo: "pos_api", permitePix: true, permiteCartao: true, permiteEnvioValorPdv: false, requerHomologacao: false },
  { id: 0, codigo: "rede", nome: "Rede", tipo: "pos_api", permitePix: true, permiteCartao: true, permiteEnvioValorPdv: false, requerHomologacao: false },
  { id: 0, codigo: "getnet", nome: "Getnet", tipo: "pos_api", permitePix: true, permiteCartao: true, permiteEnvioValorPdv: false, requerHomologacao: false },
  { id: 0, codigo: "sitef", nome: "SiTef", tipo: "tef", permitePix: false, permiteCartao: true, permiteEnvioValorPdv: true, requerHomologacao: true },
  { id: 0, codigo: "paygo", nome: "PayGo", tipo: "tef", permitePix: false, permiteCartao: true, permiteEnvioValorPdv: true, requerHomologacao: true },
  { id: 0, codigo: "manual", nome: "Manual / Qualquer maquininha", tipo: "manual", permitePix: true, permiteCartao: true, permiteEnvioValorPdv: false, requerHomologacao: false },
];

type CredentialFieldKey = "publicKey" | "accessToken" | "clientId" | "clientSecret" | "webhookSecret";
type ProviderField = { key: string; label: string; required?: boolean; placeholder?: string };
type ProviderSetup = {
  help: string;
  credentialFields: Array<{ key: CredentialFieldKey; label: string; required?: boolean; placeholder?: string }>;
  configFields: ProviderField[];
};

const PROVIDER_SETUPS: Record<string, ProviderSetup> = {
  mercado_pago: {
    help: "Use as credenciais do painel Mercado Pago e vincule o POS/caixa que recebera o valor.",
    credentialFields: [
      { key: "accessToken", label: "Access Token", required: true },
      { key: "publicKey", label: "Public Key" },
      { key: "webhookSecret", label: "Webhook Secret" },
    ],
    configFields: [
      { key: "collectorId", label: "ID da conta Mercado Pago", required: true },
      { key: "storeId", label: "ID da loja", required: true },
      { key: "posId", label: "ID do caixa/Point", required: true },
    ],
  },
  stone: {
    help: "Informe as credenciais da API Stone e identifique a maquininha presa ao PDV.",
    credentialFields: [
      { key: "clientId", label: "Client ID", required: true },
      { key: "clientSecret", label: "Client Secret", required: true },
    ],
    configFields: [
      { key: "merchantId", label: "ID do estabelecimento", required: true },
      { key: "establishmentCode", label: "Codigo do estabelecimento", required: true },
      { key: "terminalSerial", label: "Serial da maquininha", required: true },
    ],
  },
  pagbank: {
    help: "Informe o token PagBank/PagSeguro e identifique a maquininha presa ao PDV.",
    credentialFields: [
      { key: "accessToken", label: "Access Token", required: true },
      { key: "webhookSecret", label: "Webhook Secret" },
    ],
    configFields: [
      { key: "accountId", label: "Account ID", required: true },
      { key: "terminalSerial", label: "Serial da maquininha", required: true },
    ],
  },
  itau: {
    help: "Informe as credenciais Itau/Iti e a maquininha que ficara vinculada ao PDV.",
    credentialFields: [
      { key: "clientId", label: "Client ID", required: true },
      { key: "clientSecret", label: "Client Secret", required: true },
    ],
    configFields: [
      { key: "merchantId", label: "ID do estabelecimento", required: true },
      { key: "terminalSerial", label: "Serial da maquininha", required: true },
    ],
  },
  cielo: {
    help: "Informe as credenciais Cielo e a maquininha usada no caixa.",
    credentialFields: [
      { key: "clientId", label: "Client ID", required: true },
      { key: "clientSecret", label: "Client Secret", required: true },
    ],
    configFields: [
      { key: "merchantId", label: "ID do estabelecimento", required: true },
      { key: "terminalSerial", label: "Serial da maquininha", required: true },
    ],
  },
  rede: {
    help: "Informe as credenciais Rede, codigo de afiliacao e numero da maquininha.",
    credentialFields: [
      { key: "clientId", label: "Client ID", required: true },
      { key: "clientSecret", label: "Client Secret", required: true },
    ],
    configFields: [
      { key: "affiliationCode", label: "Codigo de afiliacao", required: true },
      { key: "terminalNumber", label: "Numero da maquininha", required: true },
    ],
  },
  getnet: {
    help: "Informe as credenciais Getnet, seller ID e a maquininha vinculada ao caixa.",
    credentialFields: [
      { key: "clientId", label: "Client ID", required: true },
      { key: "clientSecret", label: "Client Secret", required: true },
    ],
    configFields: [
      { key: "sellerId", label: "Seller ID", required: true },
      { key: "terminalSerial", label: "Serial da maquininha", required: true },
    ],
  },
  efi: {
    help: "Use esta opcao para PIX integrado via Efi/Gerencianet.",
    credentialFields: [
      { key: "clientId", label: "Client ID", required: true },
      { key: "clientSecret", label: "Client Secret", required: true },
      { key: "webhookSecret", label: "Webhook Secret" },
    ],
    configFields: [{ key: "pixKey", label: "Chave PIX", required: true }],
  },
  manual: {
    help: "Modo manual nao precisa de credenciais. O operador passa na maquininha fora do sistema e registra no PDV.",
    credentialFields: [],
    configFields: [],
  },
  tef: {
    help: "Para TEF, preencha o bloco Maquininha do PDV com integrador, estabelecimento e terminal TEF.",
    credentialFields: [],
    configFields: [],
  },
};

const defaultRate: Rate = {
  modalidade: "debito",
  bandeira: "",
  parcelasInicio: 1,
  parcelasFim: 1,
  taxaPercentual: 0,
  taxaFixaCentavos: 0,
  prazoRecebimentoDias: 1,
  origem: "manual",
  ativo: true,
};

const defaultTerminal: TerminalDraft = {
  pdvId: "",
  nomeTerminal: "",
  tipo: "manual",
  provedorId: undefined,
  adquirenteEmpresaId: undefined,
  serialEquipamento: "",
  codigoTerminal: "",
  ipTerminal: "",
  portaTerminal: undefined,
  pathIntegradorLocal: "",
  estabelecimentoTef: "",
  terminalTef: "",
  ativo: true,
};

const defaultCredential: CredentialDraft = {
  provedorId: undefined,
  provedorCodigo: "mercado_pago",
  adquirenteEmpresaId: undefined,
  ambiente: "producao",
  publicKey: "",
  clientId: "",
  clientSecret: "",
  accessToken: "",
  webhookSecret: "",
  providerConfig: {},
  ativo: true,
};

export default function ConfiguracoesPagamentos() {
  const queryClient = useQueryClient();
  const [configDraft, setConfigDraft] = useState(defaultConfig);
  const [acquirerDraft, setAcquirerDraft] = useState(defaultAcquirer);
  const [rateDraft, setRateDraft] = useState(defaultRate);
  const [terminalDraft, setTerminalDraft] = useState(defaultTerminal);
  const [credentialDraft, setCredentialDraft] = useState(defaultCredential);
  const [apiRates, setApiRates] = useState<Rate[]>([]);

  const { data, isLoading } = useQuery<PaymentConfig>({
    queryKey: ["pagamentos-config"],
    queryFn: async () => {
      const response = await api.get("/pagamentos/config");
      setConfigDraft({ ...defaultConfig, ...pickConfig(response.data) });
      return response.data;
    },
  });

  const { data: connectedPdvs = [] } = useQuery<ConnectedPdv[]>({
    queryKey: ["pdvs-ativos-pagamentos"],
    queryFn: async () => {
      const response = await api.get("/pdv/ativos");
      return response.data?.data || [];
    },
    refetchInterval: 5000,
  });

  const summary = useMemo(() => buildSummary(data?.taxas || []), [data?.taxas]);
  const providerOptions = useMemo(() => {
    const apiProviders = data?.provedores || [];
    const merged = [...apiProviders];
    for (const provider of BUILTIN_PROVIDERS) {
      if (!merged.some((item) => item.codigo === provider.codigo)) {
        merged.push(provider);
      }
    }
    return merged;
  }, [data?.provedores]);
  const selectedProvider = useMemo(
    () => providerOptions.find((provider) => provider.codigo === credentialDraft.provedorCodigo),
    [credentialDraft.provedorCodigo, providerOptions]
  );
  const selectedCredentialSetup = useMemo(() => {
    if (selectedProvider?.tipo === "tef") return PROVIDER_SETUPS.tef;
    return PROVIDER_SETUPS[credentialDraft.provedorCodigo] || PROVIDER_SETUPS.manual;
  }, [credentialDraft.provedorCodigo, selectedProvider?.tipo]);
  const selectedConnectedPdv = useMemo(
    () => connectedPdvs.find((pdv) => pdv.id === terminalDraft.pdvId),
    [connectedPdvs, terminalDraft.pdvId]
  );

  const saveConfig = useMutation({
    mutationFn: async () => {
      const response = await api.put("/pagamentos/config?enviarCarga=true", {
        ...configDraft,
        enviarCargaPdv: true,
      });
      return response.data;
    },
    onSuccess: (result) => {
      toast.success("Configuracoes de pagamento salvas");
      if (result?.pdvCarga?.requested) toast.success(`Carga enviada para ${result.pdvCarga.sent} PDV(s) online`);
      queryClient.invalidateQueries({ queryKey: ["pagamentos-config"] });
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Erro ao salvar configuracoes"),
  });

  const createAcquirer = useMutation({
    mutationFn: async () => api.post("/pagamentos/adquirentes", acquirerDraft),
    onSuccess: () => {
      toast.success("Operadora cadastrada");
      setAcquirerDraft(defaultAcquirer);
      queryClient.invalidateQueries({ queryKey: ["pagamentos-config"] });
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Erro ao cadastrar adquirente"),
  });

  const saveCredential = useMutation({
    mutationFn: async () => api.post("/pagamentos/credenciais", normalizeCredential(credentialDraft)),
    onSuccess: () => {
      toast.success("Credenciais salvas com seguranca");
      setCredentialDraft({ ...defaultCredential, provedorCodigo: credentialDraft.provedorCodigo });
      queryClient.invalidateQueries({ queryKey: ["pagamentos-config"] });
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Erro ao salvar credenciais"),
  });

  const testConnection = useMutation({
    mutationFn: async (payload: { adquirenteEmpresaId?: number | null; terminalPagamentoId?: number | null; provedorId?: number | null; provedorCodigo?: string | null }) => {
      const response = await api.post("/pagamentos/testar-conexao", payload);
      return response.data;
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message || "Teste validado");
      } else {
        toast.warning(result.message || "Teste pendente de configuracao");
      }
      queryClient.invalidateQueries({ queryKey: ["pagamentos-config"] });
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Erro ao testar conexao"),
  });

  const createRate = useMutation({
    mutationFn: async (rate: Rate) => api.post("/pagamentos/taxas", normalizeRate(rate)),
    onSuccess: () => {
      toast.success("Taxa cadastrada");
      setRateDraft(defaultRate);
      queryClient.invalidateQueries({ queryKey: ["pagamentos-config"] });
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Erro ao cadastrar taxa"),
  });

  const createTerminal = useMutation({
    mutationFn: async () => api.post("/pagamentos/terminais", normalizeTerminal(terminalDraft)),
    onSuccess: () => {
      toast.success("Maquininha vinculada ao PDV");
      setTerminalDraft(defaultTerminal);
      queryClient.invalidateQueries({ queryKey: ["pagamentos-config"] });
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Erro ao vincular maquininha"),
  });

  const syncRates = useMutation({
    mutationFn: async (adquirenteEmpresaId: number) => {
      const response = await api.post("/pagamentos/taxas/sincronizar-api", { adquirenteEmpresaId });
      return response.data;
    },
    onSuccess: (result) => {
      setApiRates(result.taxas || []);
      toast.success("Taxas da API carregadas para revisao");
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Erro ao atualizar taxas pela API"),
  });

  const applyApiRates = useMutation({
    mutationFn: async () => api.post("/pagamentos/taxas/aplicar-api", { taxas: apiRates.map(normalizeRate) }),
    onSuccess: () => {
      toast.success("Taxas da API aplicadas");
      setApiRates([]);
      queryClient.invalidateQueries({ queryKey: ["pagamentos-config"] });
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Erro ao aplicar taxas"),
  });

  const sendLoad = useMutation({
    mutationFn: async () => api.post("/pagamentos/enviar-carga-pdv"),
    onSuccess: (result) => toast.success(`Carga enviada para ${result.data.sent} PDV(s) online`),
    onError: (error: any) => toast.error(error.response?.data?.error || "Erro ao enviar carga"),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Configuracoes de Pagamento</h1>
            <p className="text-sm text-muted-foreground">
              Configure formas de pagamento, maquininhas, taxas e a carga que sera enviada para o PDV local.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => sendLoad.mutate()} disabled={sendLoad.isPending || isLoading}>
              <RadioTower className="mr-2 h-4 w-4" />
              Enviar carga PDV
            </Button>
            <Button onClick={() => saveConfig.mutate()} disabled={saveConfig.isPending || isLoading}>
              <Save className="mr-2 h-4 w-4" />
              Salvar configuracoes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <SummaryCard title="Formas ativas" value={String(data?.formasPagamento?.filter((item) => item.ativo).length || 0)} icon={<WalletCards className="h-5 w-5" />} />
          <SummaryCard title="Operadoras" value={String(data?.adquirentes?.length || 0)} icon={<CreditCard className="h-5 w-5" />} />
          <SummaryCard title="PDVs configurados" value={String(data?.terminaisPagamento?.length || 0)} icon={<Smartphone className="h-5 w-5" />} />
          <SummaryCard title="Versao da carga" value={String(data?.versaoCarga || 1)} icon={<DownloadCloud className="h-5 w-5" />} />
        </div>

        <Tabs defaultValue="formas" className="space-y-4">
          <TabsList className="flex h-auto w-full flex-wrap justify-start">
            <TabsTrigger value="formas">Formas de pagamento</TabsTrigger>
            <TabsTrigger value="maquininhas">Maquininhas e TEF</TabsTrigger>
            <TabsTrigger value="taxas">Taxas e recebimentos</TabsTrigger>
            <TabsTrigger value="carga">Carga PDV</TabsTrigger>
          </TabsList>

          <TabsContent value="formas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Operacao no PDV</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Toggle label="Pagamentos manuais" checked={configDraft.habilitarPagamentosManuais} onChange={(value) => setConfigDraft({ ...configDraft, habilitarPagamentosManuais: value })} />
                <Toggle label="TEF integrado" checked={configDraft.habilitarTef} onChange={(value) => setConfigDraft({ ...configDraft, habilitarTef: value })} />
                <Toggle label="PIX integrado" checked={configDraft.habilitarPixIntegrado} onChange={(value) => setConfigDraft({ ...configDraft, habilitarPixIntegrado: value })} />
                <Toggle label="POS/API" checked={configDraft.habilitarPosApi} onChange={(value) => setConfigDraft({ ...configDraft, habilitarPosApi: value })} />
                <Toggle label="Exigir NSU no manual" checked={configDraft.exigirNsuNoManual} onChange={(value) => setConfigDraft({ ...configDraft, exigirNsuNoManual: value })} />
                <Toggle label="Enviar carga automaticamente" checked={configDraft.enviarCargaAutomaticaPdv} onChange={(value) => setConfigDraft({ ...configDraft, enviarCargaAutomaticaPdv: value })} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Formas exibidas no PDV</CardTitle></CardHeader>
              <CardContent>
                <DataTable headers={["Forma", "Tipo", "Captura", "Parcelas", "Status"]}>
                  {(data?.formasPagamento || []).map((form) => (
                    <tr key={form.id} className="border-t">
                      <td className="p-3 font-medium">{form.nome}</td>
                      <td className="p-3">{labelPaymentType(form.tipo)}</td>
                      <td className="p-3">{labelCapture(form.modoCaptura)}</td>
                      <td className="p-3">{form.permiteParcelamento ? `Ate ${form.maxParcelas}x` : "Nao"}</td>
                      <td className="p-3"><StatusBadge active={form.ativo} /></td>
                    </tr>
                  ))}
                </DataTable>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maquininhas" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Cadastrar operadora</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Field label="Nome da operadora na tela" value={acquirerDraft.nomeExibicao} onChange={(value) => setAcquirerDraft({ ...acquirerDraft, nomeExibicao: value })} />
                <div className="space-y-2">
                  <Label>Operadora</Label>
                  <Select
                    value={acquirerDraft.provedorCodigo || ""}
                    onValueChange={(value) => {
                      const provider = providerOptions.find((item) => item.codigo === value);
                      setAcquirerDraft({
                        ...acquirerDraft,
                        provedorCodigo: value,
                        provedorId: provider?.id ? provider.id : undefined,
                      });
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Escolha" /></SelectTrigger>
                    <SelectContent>
                      {providerOptions.map((provider) => <SelectItem key={provider.codigo} value={provider.codigo}>{provider.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ambiente</Label>
                  <Select value={acquirerDraft.ambiente} onValueChange={(value: "homologacao" | "producao") => setAcquirerDraft({ ...acquirerDraft, ambiente: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="homologacao">Homologacao</SelectItem>
                      <SelectItem value="producao">Producao</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button className="w-full" onClick={() => createAcquirer.mutate()} disabled={!acquirerDraft.nomeExibicao || !acquirerDraft.provedorCodigo || createAcquirer.isPending}>Cadastrar operadora</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Operadoras cadastradas</CardTitle></CardHeader>
              <CardContent>
                <DataTable headers={["Nome", "Operadora", "Ambiente", "Status", "Teste"]}>
                  {(data?.adquirentes || []).map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-3 font-medium">{item.nomeExibicao}</td>
                      <td className="p-3">{providerName(data, item.provedorId)}</td>
                      <td className="p-3">{item.ambiente === "producao" ? "Producao" : "Homologacao"}</td>
                      <td className="p-3"><StatusBadge active={item.ativo} /></td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testConnection.mutate({ adquirenteEmpresaId: item.id, provedorId: item.provedorId })}
                          disabled={testConnection.isPending}
                        >
                          <RadioTower className="mr-2 h-4 w-4" />
                          Testar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </DataTable>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Credenciais da operadora</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Usar para</Label>
                    <Select
                      value={credentialDraft.adquirenteEmpresaId ? String(credentialDraft.adquirenteEmpresaId) : "geral"}
                      onValueChange={(value) => {
                        const acquirer = data?.adquirentes?.find((item) => item.id === Number(value));
                        const provider = providerOptions.find((item) => item.id === acquirer?.provedorId);
                        setCredentialDraft({
                          ...credentialDraft,
                          adquirenteEmpresaId: value === "geral" ? undefined : Number(value),
                          provedorId: acquirer?.provedorId || credentialDraft.provedorId,
                          provedorCodigo: provider?.codigo || credentialDraft.provedorCodigo,
                        });
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Escolha" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="geral">Geral da empresa</SelectItem>
                        {(data?.adquirentes || []).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.nomeExibicao}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Operadora</Label>
                    <Select
                      value={credentialDraft.provedorCodigo}
                      onValueChange={(value) => {
                        const provider = providerOptions.find((item) => item.codigo === value);
                        setCredentialDraft({ ...credentialDraft, provedorCodigo: value, provedorId: provider?.id || undefined });
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {providerOptions.map((provider) => <SelectItem key={provider.codigo} value={provider.codigo}>{provider.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ambiente</Label>
                    <Select value={credentialDraft.ambiente} onValueChange={(value: "homologacao" | "producao") => setCredentialDraft({ ...credentialDraft, ambiente: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="homologacao">Homologacao (testes)</SelectItem>
                        <SelectItem value="producao">Producao (vendas reais)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
                  {selectedCredentialSetup.help}
                </div>

                {selectedCredentialSetup.credentialFields.length > 0 && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {selectedCredentialSetup.credentialFields.map((field) => (
                      <Field
                        key={field.key}
                        label={`${field.label}${field.required ? " *" : ""}`}
                        value={credentialDraft[field.key]}
                        onChange={(value) => setCredentialDraft({ ...credentialDraft, [field.key]: value })}
                      />
                    ))}
                  </div>
                )}

                {selectedCredentialSetup.configFields.length > 0 && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {selectedCredentialSetup.configFields.map((field) => (
                      <Field
                        key={field.key}
                        label={`${field.label}${field.required ? " *" : ""}`}
                        value={credentialDraft.providerConfig[field.key] || ""}
                        onChange={(value) => setCredentialDraft({
                          ...credentialDraft,
                          providerConfig: { ...credentialDraft.providerConfig, [field.key]: value },
                        })}
                      />
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => saveCredential.mutate()} disabled={!credentialDraft.provedorCodigo || saveCredential.isPending}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Salvar credenciais
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => testConnection.mutate(normalizeCredential(credentialDraft))}
                    disabled={!credentialDraft.provedorCodigo || testConnection.isPending}
                  >
                    <RadioTower className="mr-2 h-4 w-4" />
                    Testar conexao
                  </Button>
                </div>

                <DataTable headers={["Operadora", "Uso", "Ambiente", "Chave salva", "Identificacao", "Status", "Ultimo teste"]}>
                  {(data?.credenciais || []).map((credential) => (
                    <tr key={credential.id} className="border-t">
                      <td className="p-3 font-medium">{providerName(data, credential.provedorId)}</td>
                      <td className="p-3">{acquirerName(data, credential.adquirenteEmpresaId)}</td>
                      <td className="p-3">{credential.ambiente === "producao" ? "Producao" : "Homologacao"}</td>
                      <td className="p-3">{credential.accessTokenMasked || (credential.clientSecretConfigured ? "Configurado" : "Nao informado")}</td>
                      <td className="p-3">{formatProviderConfig(credential.providerConfig)}</td>
                      <td className="p-3">
                        <Badge variant={credential.statusValidacao?.includes("valida") || credential.statusValidacao?.includes("Conectado") ? "default" : "outline"}>
                          {credential.statusValidacao || "Pendente"}
                        </Badge>
                        {credential.ultimoErro && <p className="mt-1 text-xs text-destructive">{credential.ultimoErro}</p>}
                      </td>
                      <td className="p-3">{credential.ultimaValidacaoEm ? new Date(credential.ultimaValidacaoEm).toLocaleString("pt-BR") : "-"}</td>
                    </tr>
                  ))}
                </DataTable>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Maquininha do PDV</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
                  Escolha um PDV que esteja online e vincule uma maquininha somente a esse caixa. O sistema bloqueia o mesmo serial, codigo da maquininha ou terminal TEF em outro PDV ativo.
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2 md:col-span-2">
                    <Label>PDV conectado *</Label>
                    <Select
                      value={terminalDraft.pdvId || ""}
                      onValueChange={(value) => {
                        const pdv = connectedPdvs.find((item) => item.id === value);
                        setTerminalDraft({
                          ...terminalDraft,
                          pdvId: value,
                          nomeTerminal: terminalDraft.nomeTerminal || (pdv ? `Maquininha ${pdv.name}` : ""),
                        });
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder={connectedPdvs.length > 0 ? "Escolha o PDV online" : "Nenhum PDV conectado"} /></SelectTrigger>
                      <SelectContent>
                        {connectedPdvs.map((pdv) => (
                          <SelectItem key={pdv.id} value={pdv.id}>
                            {pdv.name} - {pdv.id}{pdv.maquininha?.conectada ? " (ja tem maquininha)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status do PDV</Label>
                    <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm">
                      {selectedConnectedPdv ? (
                        <>
                          <Badge>Online</Badge>
                          <Badge variant={selectedConnectedPdv.maquininha?.conectada ? "default" : "secondary"}>
                            Maquininha: {selectedConnectedPdv.maquininha?.conectada ? "Sim" : "Nao"}
                          </Badge>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Escolha um PDV online</span>
                      )}
                    </div>
                  </div>
                </div>

                {selectedConnectedPdv && (
                  <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{selectedConnectedPdv.name}</span>
                    {" - "}CNPJ {selectedConnectedPdv.cnpjVinculado || "-"}
                    {selectedConnectedPdv.maquininha?.conectada && (
                      <>
                        {" - "}Atual: {selectedConnectedPdv.maquininha.nomeTerminal || "maquininha vinculada"}
                        {selectedConnectedPdv.maquininha.provedor ? ` (${selectedConnectedPdv.maquininha.provedor})` : ""}
                      </>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <Field label="Nome da maquininha *" value={terminalDraft.nomeTerminal} onChange={(value) => setTerminalDraft({ ...terminalDraft, nomeTerminal: value })} />
                  <div className="space-y-2">
                    <Label>Modo de uso</Label>
                    <Select value={terminalDraft.tipo} onValueChange={(value: "manual" | "tef" | "pos_api") => setTerminalDraft({ ...terminalDraft, tipo: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="tef">TEF</SelectItem>
                        <SelectItem value="pos_api">POS/API</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Operadora cadastrada</Label>
                    <Select
                      value={terminalDraft.adquirenteEmpresaId ? String(terminalDraft.adquirenteEmpresaId) : "sem_adquirente"}
                      onValueChange={(value) => {
                        const acquirer = data?.adquirentes?.find((item) => item.id === Number(value));
                        setTerminalDraft({
                          ...terminalDraft,
                          adquirenteEmpresaId: value === "sem_adquirente" ? undefined : Number(value),
                          provedorId: acquirer?.provedorId || terminalDraft.provedorId,
                        });
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Escolha" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sem_adquirente">Sem operadora</SelectItem>
                        {(data?.adquirentes || []).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.nomeExibicao}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Operadora</Label>
                    <Select
                      value={terminalDraft.provedorId ? String(terminalDraft.provedorId) : "sem_provedor"}
                      onValueChange={(value) => setTerminalDraft({ ...terminalDraft, provedorId: value === "sem_provedor" ? undefined : Number(value) })}
                    >
                      <SelectTrigger><SelectValue placeholder="Escolha" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sem_provedor">Sem operadora</SelectItem>
                        {providerOptions.filter((provider) => provider.id > 0).map((provider) => <SelectItem key={provider.id} value={String(provider.id)}>{provider.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Field label="Codigo da maquininha" value={terminalDraft.codigoTerminal} onChange={(value) => setTerminalDraft({ ...terminalDraft, codigoTerminal: value })} />
                  <Field label="Serial da maquininha" value={terminalDraft.serialEquipamento} onChange={(value) => setTerminalDraft({ ...terminalDraft, serialEquipamento: value })} />
                  <Field label="IP local" value={terminalDraft.ipTerminal} onChange={(value) => setTerminalDraft({ ...terminalDraft, ipTerminal: value })} />
                  <NumberField label="Porta local" value={terminalDraft.portaTerminal || 0} onChange={(value) => setTerminalDraft({ ...terminalDraft, portaTerminal: value || undefined })} />
                </div>

                {terminalDraft.tipo === "tef" && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Field label="Caminho do integrador TEF *" value={terminalDraft.pathIntegradorLocal} onChange={(value) => setTerminalDraft({ ...terminalDraft, pathIntegradorLocal: value })} />
                    <Field label="Codigo estabelecimento TEF *" value={terminalDraft.estabelecimentoTef} onChange={(value) => setTerminalDraft({ ...terminalDraft, estabelecimentoTef: value })} />
                    <Field label="Codigo da maquininha TEF *" value={terminalDraft.terminalTef} onChange={(value) => setTerminalDraft({ ...terminalDraft, terminalTef: value })} />
                  </div>
                )}

                <div className="flex justify-end">
                  <Button onClick={() => createTerminal.mutate()} disabled={!isTerminalReady(terminalDraft) || createTerminal.isPending}>Vincular maquininha ao PDV</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="taxas" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <RateCard title="Debito" rate={summary.debito} />
              <RateCard title="Credito a vista" rate={summary.credito_vista} />
              <RateCard title="Credito parcelado" rate={summary.credito_parcelado} />
              <RateCard title="PIX" rate={summary.pix} />
            </div>

            <Card>
              <CardHeader><CardTitle>Nova taxa manual</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-6">
                <div className="space-y-2">
                  <Label>Operadora</Label>
                  <Select value={String(rateDraft.adquirenteEmpresaId || "")} onValueChange={(value) => setRateDraft({ ...rateDraft, adquirenteEmpresaId: Number(value) })}>
                    <SelectTrigger><SelectValue placeholder="Escolha" /></SelectTrigger>
                    <SelectContent>{(data?.adquirentes || []).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.nomeExibicao}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Modalidade</Label>
                  <Select value={rateDraft.modalidade} onValueChange={(value: Rate["modalidade"]) => setRateDraft({ ...rateDraft, modalidade: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debito">Debito</SelectItem>
                      <SelectItem value="credito_vista">Credito a vista</SelectItem>
                      <SelectItem value="credito_parcelado">Credito parcelado</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <NumberField label="Taxa (%)" value={rateDraft.taxaPercentual / 100} step="0.01" onChange={(value) => setRateDraft({ ...rateDraft, taxaPercentual: Math.round(value * 100) })} />
                <NumberField label="Prazo (dias)" value={rateDraft.prazoRecebimentoDias} onChange={(value) => setRateDraft({ ...rateDraft, prazoRecebimentoDias: value })} />
                <NumberField label="Parcelas ate" value={rateDraft.parcelasFim} onChange={(value) => setRateDraft({ ...rateDraft, parcelasFim: value })} />
                <div className="flex items-end">
                  <Button className="w-full" onClick={() => createRate.mutate(rateDraft)} disabled={!rateDraft.adquirenteEmpresaId || createRate.isPending}>Salvar taxa</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Taxas visiveis para o cliente</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => {
                    const acquirerId = data?.adquirentes?.[0]?.id;
                    if (!acquirerId) return toast.warning("Cadastre uma adquirente antes de atualizar pela API");
                    syncRates.mutate(acquirerId);
                  }}
                  disabled={syncRates.isPending}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Atualizar taxas pela API
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {apiRates.length > 0 && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    Taxas encontradas na API da operadora. Revise antes de aplicar no financeiro e enviar para o PDV.
                    <div className="mt-3">
                      <Button size="sm" onClick={() => applyApiRates.mutate()} disabled={applyApiRates.isPending}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Aplicar taxas encontradas
                      </Button>
                    </div>
                  </div>
                )}
                <DataTable headers={["Operadora", "Modalidade", "Parcelas", "Taxa atual", "Taxa API", "Prazo", "Origem", "Status"]}>
                  {(data?.taxas || []).map((rate) => {
                    const matchingApiRate = apiRates.find((apiRate) => apiRate.modalidade === rate.modalidade && apiRate.parcelasFim === rate.parcelasFim);
                    return (
                      <tr key={rate.id} className="border-t">
                        <td className="p-3">{acquirerName(data, rate.adquirenteEmpresaId)}</td>
                        <td className="p-3">{labelModality(rate.modalidade)}</td>
                        <td className="p-3">{rate.parcelasInicio === rate.parcelasFim ? `${rate.parcelasFim}x` : `${rate.parcelasInicio}x a ${rate.parcelasFim}x`}</td>
                        <td className="p-3 font-semibold">{formatPercent(rate.taxaPercentual)}</td>
                        <td className="p-3">{matchingApiRate ? formatPercent(matchingApiRate.taxaPercentual) : "-"}</td>
                        <td className="p-3">D+{rate.prazoRecebimentoDias}</td>
                        <td className="p-3">{labelOrigin(rate.origem)}</td>
                        <td className="p-3"><Badge variant={matchingApiRate && matchingApiRate.taxaPercentual !== rate.taxaPercentual ? "secondary" : "outline"}>{matchingApiRate && matchingApiRate.taxaPercentual !== rate.taxaPercentual ? "Diferente da API" : "Aplicada"}</Badge></td>
                      </tr>
                    );
                  })}
                </DataTable>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="carga" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Carga de pagamentos para PDV local</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  O PDV recebera formas de pagamento, taxas, adquirentes e terminais. PDVs offline recebem na proxima carga inicial ou sincronizacao.
                </p>
                <DataTable headers={["PDV", "Maquininha", "Operadora", "Identificador", "Modo de uso", "Status", "Teste"]}>
                  {(data?.terminaisPagamento || []).map((terminal) => (
                    <tr key={terminal.id} className="border-t">
                      <td className="p-3 font-medium">{terminal.pdvId}</td>
                      <td className="p-3">{terminal.nomeTerminal}</td>
                      <td className="p-3">{providerName(data, terminal.provedorId)}</td>
                      <td className="p-3">{terminal.serialEquipamento || terminal.codigoTerminal || terminal.terminalTef || "-"}</td>
                      <td className="p-3">{labelTerminal(terminal.tipo)}</td>
                      <td className="p-3"><Badge variant="outline">{terminal.ultimoStatus || "Nao configurado"}</Badge></td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testConnection.mutate({ terminalPagamentoId: terminal.id })}
                          disabled={testConnection.isPending}
                        >
                          <RadioTower className="mr-2 h-4 w-4" />
                          Testar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </DataTable>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function pickConfig(data: PaymentConfig) {
  return {
    habilitarPagamentosManuais: data.habilitarPagamentosManuais,
    habilitarTef: data.habilitarTef,
    habilitarPosApi: data.habilitarPosApi,
    habilitarPixIntegrado: data.habilitarPixIntegrado,
    modoPadraoCartao: data.modoPadraoCartao,
    exigirNsuNoManual: data.exigirNsuNoManual,
    permitirVendaOfflineCartaoManual: data.permitirVendaOfflineCartaoManual,
    permitirVendaOfflineTef: data.permitirVendaOfflineTef,
    enviarCargaAutomaticaPdv: data.enviarCargaAutomaticaPdv,
  };
}

function normalizeRate(rate: Rate) {
  return {
    ...rate,
    bandeira: rate.bandeira || null,
    adquirenteEmpresaId: rate.adquirenteEmpresaId || null,
    parcelasInicio: rate.parcelasInicio || 1,
    parcelasFim: rate.parcelasFim || 1,
    taxaPercentual: Math.round(rate.taxaPercentual || 0),
    taxaFixaCentavos: Math.round(rate.taxaFixaCentavos || 0),
    prazoRecebimentoDias: Math.round(rate.prazoRecebimentoDias || 0),
  };
}

function normalizeCredential(credential: CredentialDraft) {
  const providerConfig = Object.fromEntries(Object.entries(credential.providerConfig).filter(([, value]) => value !== ""));
  return {
    ...credential,
    provedorId: credential.provedorId || null,
    adquirenteEmpresaId: credential.adquirenteEmpresaId || null,
    publicKey: credential.publicKey || null,
    clientId: credential.clientId || null,
    clientSecret: credential.clientSecret || null,
    accessToken: credential.accessToken || null,
    webhookSecret: credential.webhookSecret || null,
    providerConfig,
  };
}

function normalizeTerminal(terminal: TerminalDraft) {
  return {
    ...terminal,
    provedorId: terminal.provedorId || null,
    adquirenteEmpresaId: terminal.adquirenteEmpresaId || null,
    serialEquipamento: terminal.serialEquipamento || null,
    codigoTerminal: terminal.codigoTerminal || null,
    ipTerminal: terminal.ipTerminal || null,
    portaTerminal: terminal.portaTerminal || null,
    pathIntegradorLocal: terminal.pathIntegradorLocal || null,
    estabelecimentoTef: terminal.estabelecimentoTef || null,
    terminalTef: terminal.terminalTef || null,
  };
}

function isTerminalReady(terminal: TerminalDraft) {
  if (!terminal.pdvId || !terminal.nomeTerminal) return false;
  if (terminal.tipo === "pos_api") {
    return !!terminal.provedorId && (!!terminal.codigoTerminal || !!terminal.serialEquipamento);
  }
  if (terminal.tipo === "tef") {
    return !!terminal.pathIntegradorLocal && !!terminal.estabelecimentoTef && !!terminal.terminalTef;
  }
  return true;
}

function buildSummary(rates: Rate[]) {
  return {
    debito: rates.find((rate) => rate.modalidade === "debito"),
    credito_vista: rates.find((rate) => rate.modalidade === "credito_vista"),
    credito_parcelado: rates.find((rate) => rate.modalidade === "credito_parcelado"),
    pix: rates.find((rate) => rate.modalidade === "pix"),
  };
}

function SummaryCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
        <div className="rounded-md bg-primary/10 p-2 text-primary">{icon}</div>
      </CardContent>
    </Card>
  );
}

function RateCard({ title, rate }: { title: string; rate?: Rate }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-semibold">{rate ? formatPercent(rate.taxaPercentual) : "-"}</p>
        <p className="text-sm text-muted-foreground">{rate ? `Prazo D+${rate.prazoRecebimentoDias}` : "Nao configurada"}</p>
      </CardContent>
    </Card>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center gap-2 rounded-md border p-3">
      <Checkbox checked={checked} onCheckedChange={(value) => onChange(!!value)} />
      <Label>{label}</Label>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function NumberField({ label, value, onChange, step = "1" }: { label: string; value: number; step?: string; onChange: (value: number) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type="number" step={step} value={value} onChange={(event) => onChange(Number(event.target.value) || 0)} />
    </div>
  );
}

function DataTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="bg-muted/60">
          <tr>{headers.map((header) => <th key={header} className="p-3 text-left font-medium text-muted-foreground">{header}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return <Badge variant={active ? "default" : "secondary"}>{active ? "Ativo" : "Inativo"}</Badge>;
}

function formatPercent(value?: number) {
  return `${((value || 0) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function providerName(data: PaymentConfig | undefined, id?: number | null) {
  return data?.provedores?.find((provider) => provider.id === id)?.nome || BUILTIN_PROVIDERS.find((provider) => provider.id === id)?.nome || "Manual";
}

function acquirerName(data: PaymentConfig | undefined, id?: number | null) {
  return data?.adquirentes?.find((item) => item.id === id)?.nomeExibicao || "Nao vinculado";
}

function formatProviderConfig(config?: Record<string, string>) {
  const entries = Object.entries(config || {}).filter(([, value]) => !!value);
  if (entries.length === 0) return "Nao informado";
  return entries.slice(0, 3).map(([key, value]) => `${labelConfigKey(key)}: ${value}`).join(" | ");
}

function labelConfigKey(value: string) {
  const labels: Record<string, string> = {
    collectorId: "Conta MP",
    storeId: "Store",
    posId: "POS",
    merchantId: "Estabelecimento",
    establishmentCode: "Estab.",
    terminalSerial: "Serial",
    accountId: "Conta",
    affiliationCode: "Afiliacao",
    terminalNumber: "Maquininha",
    sellerId: "Seller",
    pixKey: "PIX",
  };
  return labels[value] || value;
}

function labelPaymentType(value: string) {
  const labels: Record<string, string> = { dinheiro: "Dinheiro", debito: "Debito", credito: "Credito", pix: "PIX", voucher: "Voucher", outro: "Outro" };
  return labels[value] || value;
}

function labelCapture(value: string) {
  const labels: Record<string, string> = { manual: "Manual", tef: "TEF", pos_api: "POS/API", pix_integrado: "PIX integrado" };
  return labels[value] || value;
}

function labelModality(value: string) {
  const labels: Record<string, string> = { debito: "Debito", credito_vista: "Credito a vista", credito_parcelado: "Credito parcelado", pix: "PIX" };
  return labels[value] || value;
}

function labelOrigin(value: string) {
  const labels: Record<string, string> = { manual: "Manual", api_provedor: "API da operadora", arquivo_importado: "Arquivo", ajuste_usuario: "Ajuste manual" };
  return labels[value] || value;
}

function labelTerminal(value: string) {
  const labels: Record<string, string> = { manual: "Manual", tef: "TEF", pos_api: "POS/API" };
  return labels[value] || value;
}
