import { api } from "@/lib/api";
import * as React from "react";

export type SaasMetric = {
  label: string;
  value: string | number;
  tone?: string;
};

export const money = (value?: number | null) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((value ?? 0) / 100);

export const date = (value?: string | Date | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("pt-BR");
};

export const maskKey = (value?: string | null) => {
  if (!value) return "-";
  if (value.length <= 12) return value;
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
};

export const saasApi = {
  dashboard: () => api.get("/saas/dashboard").then((res) => res.data),
  empresas: () => api.get("/saas/empresas").then((res) => res.data),
  empresa: (id: number) => api.get(`/saas/empresas/${id}`).then((res) => res.data),
  criarEmpresa: (data: any) => api.post("/saas/empresas", data).then((res) => res.data),
  atualizarEmpresa: (id: number, data: any) => api.put(`/saas/empresas/${id}`, data).then((res) => res.data),
  bloquearEmpresa: (id: number, motivo: string) =>
    api.patch(`/saas/empresas/${id}/bloquear`, { motivo }).then((res) => res.data),
  desbloquearEmpresa: (id: number) =>
    api.patch(`/saas/empresas/${id}/desbloquear`).then((res) => res.data),

  planos: () => api.get("/saas/planos").then((res) => res.data),
  criarPlano: (data: any) => api.post("/saas/planos", data).then((res) => res.data),
  atualizarPlano: (id: number, data: any) => api.put(`/saas/planos/${id}`, data).then((res) => res.data),
  desativarPlano: (id: number) => api.delete(`/saas/planos/${id}`).then((res) => res.data),

  assinaturas: () => api.get("/saas/assinaturas").then((res) => res.data),
  criarAssinatura: (data: any) => api.post("/saas/assinaturas", data).then((res) => res.data),
  atualizarAssinatura: (id: number, data: any) =>
    api.patch(`/saas/assinaturas/${id}`, data).then((res) => res.data),

  pdvs: () => api.get("/saas/pdvs").then((res) => res.data),
  atualizarPdv: (id: number, data: any) => api.patch(`/saas/pdvs/${id}`, data).then((res) => res.data),

  licencas: () => api.get("/saas/licencas").then((res) => res.data),
  criarLicenca: (data: any) => api.post("/saas/licencas", data).then((res) => res.data),
  revogarLicenca: (id: number) => api.patch(`/saas/licencas/${id}/revogar`).then((res) => res.data),

  fiscalProvider: () => api.get("/saas/fiscal/provider").then((res) => res.data),
  salvarFiscalProvider: (data: any) => api.post("/saas/fiscal/provider", data).then((res) => res.data),

  suporteTickets: (params?: any) => api.get("/saas/support/tickets", { params }).then((res) => res.data),
  atualizarSuporteTicket: (id: number, data: any) =>
    api.patch(`/saas/support/tickets/${id}`, data).then((res) => res.data),
  suporteTutorials: (params?: any) => api.get("/saas/support/tutorials", { params }).then((res) => res.data),
  criarSuporteTutorial: (data: any) => api.post("/saas/support/tutorials", data).then((res) => res.data),
  atualizarSuporteTutorial: (id: number, data: any) =>
    api.patch(`/saas/support/tutorials/${id}`, data).then((res) => res.data),
  desativarSuporteTutorial: (id: number) => api.delete(`/saas/support/tutorials/${id}`).then((res) => res.data),
};

export function useSaasData<T>(loader: () => Promise<T>, deps: React.DependencyList = []) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await loader());
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, deps);

  React.useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
