import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { useAuth } from "@/_core/hooks/useAuth";
import { hasPermission } from "@/_core/utils/permissions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Ban, CheckCircle2, Download, Eye, FileCheck2, RefreshCw, RotateCw, Send, SearchCheck, ScrollText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type FiscalDocument = {
  id: number;
  vendaId: number | null;
  modelo: "NFE" | "NFCE" | "SAT" | "MFE";
  ambiente: "HOMOLOGACAO" | "PRODUCAO";
  status: string;
  numero: number | null;
  serie: number | null;
  numeroVenda: string | null;
  valorLiquido: number | null;
  chaveAcesso?: string | null;
  motivoStatus?: string | null;
};

type PreflightIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
};

type FiscalEvent = {
  id: number;
  documentoFiscalId?: number | null;
  tipo: string;
  status: string;
  protocolo?: string | null;
  motivoStatusSefaz?: string | null;
  createdAt: string;
};

type FiscalTransmission = {
  id: number;
  documentoFiscalId?: number | null;
  tipoOperacao: string;
  httpStatus?: number | null;
  codigoStatusSefaz?: string | null;
  motivo?: string | null;
  duracaoMs?: number | null;
  createdAt: string;
};

type FiscalMonitoring = {
  summary: {
    totalAlerts: number;
    critical: number;
    warning: number;
    contingency: number;
  };
  alerts: Array<{
    id: number;
    modelo: string;
    status: string;
    numero?: number | null;
    serie?: number | null;
    severity: "info" | "warning" | "critical";
    code: string;
    message: string;
    ageMinutes: number;
  }>;
};

type FiscalExceptionsReport = {
  periodo: { inicio: string; fim: string };
  summary: { cancelados: number; inutilizacoes: number; inutilizacoesPendentes: number };
  cancelados: Array<{ id: number; modelo: string; numero?: number | null; serie?: number | null; justificativa?: string | null; canceladaEm?: string | null }>;
  inutilizacoes: Array<{ id: number; status: string; justificativa?: string | null; createdAt: string; numeracao?: { modelo?: string | null; serie?: number | null; numeroInicial?: number | null; numeroFinal?: number | null } | null }>;
};

export default function GerenciadorNotasFiscais() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canEmit = hasPermission(user, "fiscal_emitir");
  const canCancel = hasPermission(user, "fiscal_cancelar");
  const canInvalidate = hasPermission(user, "fiscal_inutilizar");
  const canDownloadXml = hasPermission(user, "fiscal_baixar_xml");
  const canViewLogs = hasPermission(user, "fiscal_ver_logs");
  const [vendaId, setVendaId] = useState("");
  const [modelo, setModelo] = useState<"NFE" | "NFCE" | "SAT" | "MFE">("NFCE");
  const [issues, setIssues] = useState<PreflightIssue[]>([]);
  const [inutilizacao, setInutilizacao] = useState({
    modelo: "NFCE" as "NFE" | "NFCE",
    serie: "1",
    numeroInicial: "",
    numeroFinal: "",
    justificativa: "",
  });

  const { data: documents, isLoading } = useQuery<FiscalDocument[]>({
    queryKey: ["fiscal-documents"],
    queryFn: async () => {
      const response = await api.get("/fiscal/documentos");
      return response.data;
    },
  });

  const { data: events = [] } = useQuery<FiscalEvent[]>({
    queryKey: ["fiscal-events"],
    queryFn: async () => (await api.get("/fiscal/eventos")).data,
    enabled: canViewLogs,
  });

  const { data: transmissions = [] } = useQuery<FiscalTransmission[]>({
    queryKey: ["fiscal-transmissions"],
    queryFn: async () => (await api.get("/fiscal/transmissoes")).data,
    enabled: canViewLogs,
  });

  const { data: monitoring } = useQuery<FiscalMonitoring>({
    queryKey: ["fiscal-monitoring"],
    queryFn: async () => (await api.get("/fiscal/monitoramento")).data,
    refetchInterval: 60_000,
  });

  const { data: exceptionsReport } = useQuery<FiscalExceptionsReport>({
    queryKey: ["fiscal-exceptions-report"],
    queryFn: async () => (await api.get("/fiscal/relatorios/excecoes")).data,
  });

  const processPolling = useMutation({
    mutationFn: async () => (await api.post("/fiscal/monitoramento/polling")).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["fiscal-documents"] });
      queryClient.invalidateQueries({ queryKey: ["fiscal-monitoring"] });
      toast.success(`${data.processed} documento(s) consultado(s): ${data.success} atualizado(s), ${data.failed} falha(s).`);
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Erro ao consultar pendencias fiscais"),
  });

  const preflight = useMutation({
    mutationFn: async () => {
      const response = await api.post("/fiscal/preflight", { vendaId: Number(vendaId), modelo });
      return response.data;
    },
    onSuccess: (data) => {
      setIssues(data.issues || []);
      data.ok ? toast.success("Pre-validacao fiscal aprovada") : toast.error("Pre-validacao encontrou bloqueios fiscais");
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Erro na pre-validacao"),
  });

  const prepare = useMutation({
    mutationFn: async () => {
      const response = await api.post("/fiscal/documentos/preparar", { vendaId: Number(vendaId), modelo });
      return response.data;
    },
    onSuccess: (data) => {
      setIssues(data.preflight?.issues || []);
      queryClient.invalidateQueries({ queryKey: ["fiscal-documents"] });
      queryClient.invalidateQueries({ queryKey: ["fiscal-monitoring"] });
      data.preflight?.ok ? toast.success("Documento fiscal preparado") : toast.error("Documento criado com validacao fiscal falha");
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Erro ao preparar documento"),
  });

  const emitir = useMutation({
    mutationFn: async () => {
      const response = await api.post("/fiscal/documentos/emitir", { vendaId: Number(vendaId), modelo });
      return response.data;
    },
    onSuccess: (data) => {
      setIssues(data.preflight?.issues || []);
      queryClient.invalidateQueries({ queryKey: ["fiscal-documents"] });
      data.authorized ? toast.success("Nota fiscal criada") : toast.warning(data.message || "Nota criada pendente de transmissao");
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Erro ao criar nota fiscal"),
  });

  const consultarStatus = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await api.post(`/fiscal/documentos/${documentId}/consultar-status`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["fiscal-documents"] });
      queryClient.invalidateQueries({ queryKey: ["fiscal-monitoring"] });
      toast.success(data.message || "Status fiscal consultado");
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Erro ao consultar status"),
  });

  const reenviar = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await api.post(`/fiscal/documentos/${documentId}/reenviar`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["fiscal-documents"] });
      queryClient.invalidateQueries({ queryKey: ["fiscal-monitoring"] });
      data.authorized ? toast.success("Documento autorizado") : toast.warning(data.message || "Documento reenviado");
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Erro ao reenviar documento"),
  });

  const cancelar = useMutation({
    mutationFn: async ({ documentId, justificativa }: { documentId: number; justificativa: string }) => {
      const response = await api.post(`/fiscal/documentos/${documentId}/cancelar`, { justificativa });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fiscal-documents"] });
      queryClient.invalidateQueries({ queryKey: ["fiscal-monitoring"] });
      toast.success("Cancelamento registrado");
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Erro ao cancelar documento"),
  });

  const cartaCorrecao = useMutation({
    mutationFn: async ({ documentId, correcao }: { documentId: number; correcao: string }) => {
      const response = await api.post(`/fiscal/documentos/${documentId}/carta-correcao`, { correcao });
      return response.data;
    },
    onSuccess: (data) => toast.success(data.message || "Carta de correcao registrada"),
    onError: (error: any) => toast.error(error.response?.data?.error || "Erro ao registrar carta de correcao"),
  });

  const inutilizar = useMutation({
    mutationFn: async () => {
      const response = await api.post("/fiscal/inutilizacao", {
        modelo: inutilizacao.modelo,
        serie: Number(inutilizacao.serie),
        numeroInicial: Number(inutilizacao.numeroInicial),
        numeroFinal: Number(inutilizacao.numeroFinal),
        justificativa: inutilizacao.justificativa,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setInutilizacao((current) => ({ ...current, numeroInicial: "", numeroFinal: "", justificativa: "" }));
      queryClient.invalidateQueries({ queryKey: ["fiscal-exceptions-report"] });
      toast.success(data.message || "Inutilizacao registrada");
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Erro ao registrar inutilizacao"),
  });

  const handleCancel = (document: FiscalDocument) => {
    const justificativa = window.prompt("Justificativa do cancelamento (minimo 15 caracteres)");
    if (!justificativa) return;
    cancelar.mutate({ documentId: document.id, justificativa });
  };

  const handleCartaCorrecao = (document: FiscalDocument) => {
    const correcao = window.prompt("Texto da carta de correcao (minimo 15 caracteres)");
    if (!correcao) return;
    cartaCorrecao.mutate({ documentId: document.id, correcao });
  };

  const openFiscalFile = async (documentId: number, type: "xml" | "danfe") => {
    const response = await api.get(`/fiscal/documentos/${documentId}/${type}`, { responseType: "blob" });
    const contentType = type === "xml" ? "application/xml" : "text/html";
    const blob = new Blob([response.data], { type: contentType });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gerenciador de Notas Fiscais</h1>
            <p className="text-sm text-muted-foreground">Pre-validacao e controle fiscal de NFC-e, NF-e, SAT e MFE.</p>
          </div>
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["fiscal-documents"] })}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Monitoramento de transmissao fiscal</CardTitle>
            <Button variant="outline" size="sm" onClick={() => processPolling.mutate()} disabled={!canEmit || processPolling.isPending}>
              <RefreshCw className={`mr-2 h-4 w-4 ${processPolling.isPending ? "animate-spin" : ""}`} />
              Consultar pendencias agora
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <MonitoringTile label="Alertas ativos" value={monitoring?.summary.totalAlerts || 0} tone="text-slate-900" />
              <MonitoringTile label="Criticos" value={monitoring?.summary.critical || 0} tone="text-red-700" />
              <MonitoringTile label="Atencao" value={monitoring?.summary.warning || 0} tone="text-amber-700" />
              <MonitoringTile label="Contingencia" value={monitoring?.summary.contingency || 0} tone="text-blue-700" />
            </div>
            {monitoring?.alerts.length ? (
              <div className="space-y-2">
                {monitoring.alerts.slice(0, 12).map((alert) => (
                  <div key={`${alert.id}-${alert.code}`} className={`rounded-md border p-3 text-sm ${alert.severity === "critical" ? "border-red-200 bg-red-50" : alert.severity === "warning" ? "border-amber-200 bg-amber-50" : "border-blue-200 bg-blue-50"}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">Documento {alert.id} · {alert.modelo} · {alert.status}</p>
                      <span className="text-xs">{alert.ageMinutes} min.</span>
                    </div>
                    <p className="mt-1 text-xs">{alert.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border p-4 text-sm text-muted-foreground">Nenhuma pendencia fiscal operacional encontrada.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Cancelamentos e inutilizacoes do mes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <MonitoringTile label="Documentos cancelados" value={exceptionsReport?.summary.cancelados || 0} tone="text-red-700" />
              <MonitoringTile label="Inutilizacoes registradas" value={exceptionsReport?.summary.inutilizacoes || 0} tone="text-slate-900" />
              <MonitoringTile label="Inutilizacoes pendentes" value={exceptionsReport?.summary.inutilizacoesPendentes || 0} tone="text-amber-700" />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-semibold">Cancelamentos recentes</p>
                {exceptionsReport?.cancelados.length ? exceptionsReport.cancelados.slice(0, 6).map((item) => (
                  <div key={item.id} className="rounded-md border p-3 text-xs">
                    <p className="font-semibold">Documento {item.id} · {item.modelo} · {item.serie || "-"}/{item.numero || "-"}</p>
                    <p className="text-muted-foreground">{item.justificativa || "Sem justificativa informada"}</p>
                  </div>
                )) : <EmptyLog />}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold">Inutilizacoes recentes</p>
                {exceptionsReport?.inutilizacoes.length ? exceptionsReport.inutilizacoes.slice(0, 6).map((item) => (
                  <div key={item.id} className="rounded-md border p-3 text-xs">
                    <p className="font-semibold">Evento {item.id} · {item.status} · {item.numeracao?.modelo || "-"} serie {item.numeracao?.serie || "-"}</p>
                    <p className="text-muted-foreground">Numeros {item.numeracao?.numeroInicial || "-"} a {item.numeracao?.numeroFinal || "-"}</p>
                  </div>
                )) : <EmptyLog />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Preparar documento fiscal por venda</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[220px_180px_auto_auto_auto] gap-4 items-end">
              <div className="space-y-2">
                <Label>ID da venda</Label>
                <Input value={vendaId} onChange={(event) => setVendaId(event.target.value.replace(/\D/g, ""))} placeholder="Ex: 123" />
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Select value={modelo} onValueChange={(value: "NFE" | "NFCE" | "SAT" | "MFE") => setModelo(value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NFCE">NFC-e</SelectItem>
                    <SelectItem value="NFE">NF-e</SelectItem>
                    <SelectItem value="SAT">SAT CF-e</SelectItem>
                    <SelectItem value="MFE">MFE CF-e</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" disabled={!canEmit || !vendaId || preflight.isPending} onClick={() => preflight.mutate()}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Pre-validar
              </Button>
              <Button disabled={!canEmit || !vendaId || prepare.isPending} onClick={() => prepare.mutate()}>
                <FileCheck2 className="h-4 w-4 mr-2" />
                Preparar nota
              </Button>
              <Button disabled={!canEmit || !vendaId || emitir.isPending} onClick={() => emitir.mutate()}>
                <Send className="h-4 w-4 mr-2" />
                Criar nota
              </Button>
            </div>

            {issues.length > 0 && (
              <div className="rounded-md border">
                {issues.map((issue, index) => (
                  <div key={`${issue.code}-${index}`} className="flex gap-3 border-b last:border-b-0 p-3 text-sm">
                    <AlertTriangle className={issue.severity === "error" ? "h-4 w-4 text-red-600" : "h-4 w-4 text-amber-600"} />
                    <div>
                      <p className="font-semibold">{issue.code}</p>
                      <p className="text-muted-foreground">{issue.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Inutilizar numeracao</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-[150px_120px_160px_160px_1fr_auto] gap-4 items-end">
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Select value={inutilizacao.modelo} onValueChange={(value: "NFE" | "NFCE") => setInutilizacao((current) => ({ ...current, modelo: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NFCE">NFC-e</SelectItem>
                    <SelectItem value="NFE">NF-e</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Serie</Label>
                <Input value={inutilizacao.serie} onChange={(event) => setInutilizacao((current) => ({ ...current, serie: event.target.value.replace(/\D/g, "") }))} />
              </div>
              <div className="space-y-2">
                <Label>Numero inicial</Label>
                <Input value={inutilizacao.numeroInicial} onChange={(event) => setInutilizacao((current) => ({ ...current, numeroInicial: event.target.value.replace(/\D/g, "") }))} />
              </div>
              <div className="space-y-2">
                <Label>Numero final</Label>
                <Input value={inutilizacao.numeroFinal} onChange={(event) => setInutilizacao((current) => ({ ...current, numeroFinal: event.target.value.replace(/\D/g, "") }))} />
              </div>
              <div className="space-y-2">
                <Label>Justificativa</Label>
                <Input value={inutilizacao.justificativa} onChange={(event) => setInutilizacao((current) => ({ ...current, justificativa: event.target.value }))} placeholder="Ex: quebra de sequencia por erro operacional" />
              </div>
              <Button variant="outline" onClick={() => inutilizar.mutate()} disabled={!canInvalidate || inutilizar.isPending || !inutilizacao.numeroInicial || !inutilizacao.numeroFinal || inutilizacao.justificativa.length < 15}>
                <ScrollText className="h-4 w-4 mr-2" />
                Registrar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Documentos fiscais</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Venda</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ambiente</TableHead>
                  <TableHead>Numero</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Arquivos</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={9} className="py-8 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : documents && documents.length > 0 ? (
                  documents.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell>{document.id}</TableCell>
                      <TableCell>{document.numeroVenda || document.vendaId || "-"}</TableCell>
                      <TableCell>{document.modelo}</TableCell>
                      <TableCell>
                        <div className="font-medium">{document.status}</div>
                        {document.motivoStatus && <div className="max-w-[260px] truncate text-xs text-muted-foreground">{document.motivoStatus}</div>}
                      </TableCell>
                      <TableCell>{document.ambiente}</TableCell>
                      <TableCell>{document.serie && document.numero ? `${document.serie}/${document.numero}` : "-"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(document.valorLiquido || 0)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openFiscalFile(document.id, "xml")} disabled={!canDownloadXml || !document.chaveAcesso}>
                            <Download className="h-4 w-4 mr-1" />
                            XML
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openFiscalFile(document.id, "danfe")} disabled={!document.chaveAcesso}>
                            <Eye className="h-4 w-4 mr-1" />
                            DANFE
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => consultarStatus.mutate(document.id)} disabled={consultarStatus.isPending || !["NFE", "NFCE"].includes(document.modelo)}>
                            <SearchCheck className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => reenviar.mutate(document.id)} disabled={!canEmit || reenviar.isPending || ["AUTORIZADA", "CANCELADA"].includes(document.status)}>
                            <RotateCw className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleCartaCorrecao(document)} disabled={!canInvalidate || cartaCorrecao.isPending || document.modelo !== "NFE" || document.status !== "AUTORIZADA"}>
                            <ScrollText className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleCancel(document)} disabled={!canCancel || cancelar.isPending || !["AUTORIZADA", "PRONTA_PARA_EMISSAO", "CONTINGENCIA"].includes(document.status)}>
                            <Ban className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={9} className="py-8 text-center text-muted-foreground">Nenhum documento fiscal criado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {canViewLogs && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Eventos fiscais recentes</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {events.length === 0 ? <EmptyLog /> : events.slice(0, 15).map((event) => (
                  <LogItem
                    key={event.id}
                    title={`${event.tipo} · ${event.status}`}
                    subtitle={`Documento ${event.documentoFiscalId || "-"}${event.protocolo ? ` · protocolo ${event.protocolo}` : ""}`}
                    detail={event.motivoStatusSefaz}
                    createdAt={event.createdAt}
                  />
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Transmissões recentes</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {transmissions.length === 0 ? <EmptyLog /> : transmissions.slice(0, 15).map((transmission) => (
                  <LogItem
                    key={transmission.id}
                    title={`${transmission.tipoOperacao} · HTTP ${transmission.httpStatus || "-"}`}
                    subtitle={`Documento ${transmission.documentoFiscalId || "-"}${transmission.codigoStatusSefaz ? ` · SEFAZ ${transmission.codigoStatusSefaz}` : ""}`}
                    detail={transmission.motivo}
                    createdAt={transmission.createdAt}
                  />
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function formatCurrency(value: number) {
  return (value / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function EmptyLog() {
  return <div className="rounded-md border p-4 text-sm text-muted-foreground">Nenhum registro encontrado.</div>;
}

function MonitoringTile({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-md border bg-slate-50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function LogItem({ title, subtitle, detail, createdAt }: { title: string; subtitle: string; detail?: string | null; createdAt: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">{title}</p>
        <span className="text-xs text-muted-foreground">{new Date(createdAt).toLocaleString("pt-BR")}</span>
      </div>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
      {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}
