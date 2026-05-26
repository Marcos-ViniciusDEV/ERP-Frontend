import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, Loader2, Printer, Search } from "lucide-react";
import { toast } from "sonner";

type ReportRow = {
  id: number;
  codigo: string;
  codigoBarras?: string | null;
  descricao: string;
  marca?: string | null;
  departamentoNome?: string | null;
  unidade: string;
  precoVenda: number;
  estoque: number;
  ativo: boolean;
};

type ReportResponse = {
  rows: ReportRow[];
  page: number;
  pageSize: number;
  totalRows: number;
  totalPages: number;
};

const reportKey = "relacao-produtos";
const defaultColumns = [
  "codigo",
  "descricao",
  "marca",
  "departamentoNome",
  "unidade",
  "precoVenda",
  "estoque",
  "ativo",
];

export default function RelacaoProdutos() {
  const [busca, setBusca] = useState("");
  const [marca, setMarca] = useState("");
  const [ativo, setAtivo] = useState("todos");
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const filters = useMemo(() => {
    const nextFilters: Array<{ field: string; operator: string; value: unknown }> = [];

    if (busca.trim()) {
      nextFilters.push({ field: "search", operator: "contains", value: busca.trim() });
    }

    if (marca.trim()) {
      nextFilters.push({ field: "marca", operator: "contains", value: marca.trim() });
    }

    if (ativo !== "todos") {
      nextFilters.push({ field: "ativo", operator: "equals", value: ativo === "ativos" });
    }

    return nextFilters;
  }, [ativo, busca, marca]);

  const { data, isLoading, refetch } = useQuery<ReportResponse>({
    queryKey: ["report", reportKey, filters, page],
    queryFn: async () => {
      const response = await api.post(`/reports/${reportKey}/query`, {
        filters,
        columns: defaultColumns,
        sort: [{ field: "codigo", direction: "asc" }],
        page,
        pageSize: 50,
      });
      return response.data.data;
    },
  });

  const exportarExcel = async () => {
    setIsExporting(true);

    try {
      const createResponse = await api.post(`/reports/${reportKey}/export-jobs`, {
        filters,
        columns: defaultColumns,
        sort: [{ field: "codigo", direction: "asc" }],
        maxRows: 100000,
      });

      const jobId = createResponse.data.data.id;
      toast.info("Exportacao iniciada. Preparando arquivo Excel...");

      const finishedJob = await waitForExportJob(jobId);
      if (finishedJob.status !== "DONE") {
        throw new Error(finishedJob.errorMessage || "Nao foi possivel gerar o Excel");
      }

      const downloadResponse = await api.get(`/reports/export-jobs/${jobId}/download`, {
        responseType: "blob",
      });

      const url = URL.createObjectURL(downloadResponse.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = finishedJob.fileName || `relacao-produtos-${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Excel gerado com sucesso");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao exportar Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const imprimirRelatorio = () => {
    toast.info("Use Exportar Excel para relatorios completos. A impressao sera migrada para o novo motor em uma proxima etapa.");
  };

  const totalPages = data?.totalPages ?? 1;
  const rows = data?.rows ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Relacao de Produtos</h1>
            <p className="text-sm text-muted-foreground">
              Listagem paginada com filtros no servidor e exportacao Excel
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportarExcel} disabled={isExporting}>
              {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Exportar Excel
            </Button>
            <Button onClick={imprimirRelatorio} variant="secondary">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_180px_auto] gap-4 items-end">
              <div className="space-y-2">
                <Label>Buscar</Label>
                <Input
                  placeholder="Codigo, descricao ou marca..."
                  value={busca}
                  onChange={(event) => {
                    setBusca(event.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Marca</Label>
                <Input
                  placeholder="Filtrar marca..."
                  value={marca}
                  onChange={(event) => {
                    setMarca(event.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={ativo}
                  onValueChange={(value) => {
                    setAtivo(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="ativos">Ativos</SelectItem>
                    <SelectItem value="inativos">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" onClick={() => refetch()}>
                <Search className="w-4 h-4 mr-2" />
                Aplicar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codigo</TableHead>
                    <TableHead>Descricao</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead className="text-center">Unid.</TableHead>
                    <TableHead className="text-right">Preco Venda</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin opacity-60" />
                        Carregando produtos...
                      </TableCell>
                    </TableRow>
                  ) : rows.length > 0 ? (
                    rows.map((produto) => (
                      <TableRow key={produto.id}>
                        <TableCell className="font-mono text-sm">{produto.codigo}</TableCell>
                        <TableCell>{produto.descricao}</TableCell>
                        <TableCell>{produto.marca || "-"}</TableCell>
                        <TableCell>{produto.departamentoNome || "-"}</TableCell>
                        <TableCell className="text-center">{produto.unidade || "UN"}</TableCell>
                        <TableCell className="text-right">{formatCurrency(produto.precoVenda)}</TableCell>
                        <TableCell className="text-right">{produto.estoque}</TableCell>
                        <TableCell>{produto.ativo ? "Ativo" : "Inativo"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Nenhum produto encontrado</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                {data?.totalRows ?? 0} produtos encontrados
              </span>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                  Anterior
                </Button>
                <span>
                  Pagina {page} de {totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
                  Proxima
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

async function waitForExportJob(jobId: string) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const response = await api.get(`/reports/export-jobs/${jobId}`);
    const job = response.data.data;

    if (job.status === "DONE" || job.status === "FAILED" || job.status === "EXPIRED") {
      return job;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("Tempo limite ao gerar Excel");
}

function formatCurrency(value: number) {
  return (value / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
