import AdminSaasLayout from "./AdminSaasLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { date, money, saasApi, useSaasData } from "./saasUtils";

const statuses = ["TODAS", "ATIVA", "INADIMPLENTE", "TRIAL", "CANCELADA", "SUSPENSA"];

export default function GestaoAssinaturas() {
  const { data, loading, error, reload } = useSaasData<any[]>(saasApi.assinaturas, []);
  const [tab, setTab] = useState("TODAS");

  const rows = useMemo(() => {
    return (data ?? []).filter((row) => tab === "TODAS" || row.assinatura?.status === tab);
  }, [data, tab]);

  const changeStatus = async (row: any, status: string) => {
    try {
      await saasApi.atualizarAssinatura(row.assinatura.id, { status });
      toast.success("Assinatura atualizada");
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Erro ao atualizar assinatura");
    }
  };

  return (
    <AdminSaasLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Assinaturas</h1>
          <p className="text-muted-foreground">Acompanhe status, vencimentos e inadimplência.</p>
        </div>

        {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex flex-wrap h-auto">
            {statuses.map((status) => <TabsTrigger key={status} value={status}>{status}</TabsTrigger>)}
          </TabsList>
        </Tabs>

        <Card>
          <CardHeader><CardTitle>Controle de Assinaturas</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7}>Carregando...</TableCell></TableRow>
                ) : rows.map((row) => (
                  <TableRow key={row.assinatura.id}>
                    <TableCell className="font-medium">{row.empresa?.nomeFantasia || row.empresa?.razaoSocial}</TableCell>
                    <TableCell>{row.plano?.nome ?? "-"}</TableCell>
                    <TableCell><Badge variant={["INADIMPLENTE", "SUSPENSA"].includes(row.assinatura.status) ? "destructive" : "secondary"}>{row.assinatura.status}</Badge></TableCell>
                    <TableCell>{date(row.assinatura.dataInicio)}</TableCell>
                    <TableCell>{date(row.assinatura.dataProximoVencimento)}</TableCell>
                    <TableCell>{money(row.assinatura.valorMensal ?? row.plano?.precoMensal)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => changeStatus(row, "ATIVA")}>Ativar</Button>
                      <Button size="sm" variant="outline" onClick={() => changeStatus(row, "INADIMPLENTE")}>Inadimplente</Button>
                      <Button size="sm" variant="outline" onClick={() => changeStatus(row, "CANCELADA")}>Cancelar</Button>
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
