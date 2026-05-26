import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, FileCheck2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type FiscalDocument = {
  id: number;
  vendaId: number | null;
  modelo: "NFE" | "NFCE";
  ambiente: "HOMOLOGACAO" | "PRODUCAO";
  status: string;
  numero: number | null;
  serie: number | null;
  numeroVenda: string | null;
  valorLiquido: number | null;
};

type PreflightIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
};

export default function GerenciadorNotasFiscais() {
  const queryClient = useQueryClient();
  const [vendaId, setVendaId] = useState("");
  const [modelo, setModelo] = useState<"NFE" | "NFCE">("NFCE");
  const [issues, setIssues] = useState<PreflightIssue[]>([]);

  const { data: documents, isLoading } = useQuery<FiscalDocument[]>({
    queryKey: ["fiscal-documents"],
    queryFn: async () => {
      const response = await api.get("/fiscal/documentos");
      return response.data;
    },
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
      data.preflight?.ok ? toast.success("Documento fiscal preparado") : toast.error("Documento criado com validacao fiscal falha");
    },
    onError: (error: any) => toast.error(error.response?.data?.error || "Erro ao preparar documento"),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gerenciador de Notas Fiscais</h1>
            <p className="text-sm text-muted-foreground">Pre-validacao e controle inicial de NFC-e/NF-e.</p>
          </div>
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["fiscal-documents"] })}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle>Preparar documento fiscal por venda</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[220px_180px_auto_auto] gap-4 items-end">
              <div className="space-y-2">
                <Label>ID da venda</Label>
                <Input value={vendaId} onChange={(event) => setVendaId(event.target.value.replace(/\D/g, ""))} placeholder="Ex: 123" />
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Select value={modelo} onValueChange={(value: "NFE" | "NFCE") => setModelo(value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NFCE">NFC-e</SelectItem>
                    <SelectItem value="NFE">NF-e</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" disabled={!vendaId || preflight.isPending} onClick={() => preflight.mutate()}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Pre-validar
              </Button>
              <Button disabled={!vendaId || prepare.isPending} onClick={() => prepare.mutate()}>
                <FileCheck2 className="h-4 w-4 mr-2" />
                Preparar nota
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : documents && documents.length > 0 ? (
                  documents.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell>{document.id}</TableCell>
                      <TableCell>{document.numeroVenda || document.vendaId || "-"}</TableCell>
                      <TableCell>{document.modelo}</TableCell>
                      <TableCell>{document.status}</TableCell>
                      <TableCell>{document.ambiente}</TableCell>
                      <TableCell>{document.serie && document.numero ? `${document.serie}/${document.numero}` : "-"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(document.valorLiquido || 0)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Nenhum documento fiscal criado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function formatCurrency(value: number) {
  return (value / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
