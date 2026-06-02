import DashboardLayout from "@/components/DashboardLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ImportError {
  linha: number;
  codigo?: string;
  mensagem: string;
}

interface ImportResult {
  totalLinhas: number;
  importados: number;
  atualizados: number;
  ignorados: number;
  erros: ImportError[];
}

export default function ImportacaoDados() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function downloadTemplate() {
    try {
      const response = await api.get("/produtos/importacao/template", { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = "template-importacao-produtos.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Nao foi possivel baixar o template.");
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      toast.warning("Selecione uma planilha CSV ou XLSX.");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const response = await api.post<ImportResult>("/produtos/importacao", await file.arrayBuffer(), {
        headers: {
          "Content-Type": "application/octet-stream",
          "x-file-name": encodeURIComponent(file.name),
        },
      });
      setResult(response.data);
      if (response.data.erros.length) {
        toast.warning("Importacao concluida com linhas que precisam de ajuste.");
      } else {
        toast.success("Produtos importados com sucesso.");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Nao foi possivel importar a planilha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold">Importacao de dados</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre ou atualize produtos da sua empresa usando uma planilha CSV ou XLSX.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Importar produtos
            </CardTitle>
            <CardDescription>
              O codigo identifica o produto. Se ele ja existir na sua empresa, os dados serao atualizados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Alert>
              <Download className="h-4 w-4" />
              <AlertTitle>Comece pelo modelo</AlertTitle>
              <AlertDescription>
                Baixe o template para manter os nomes corretos das colunas. Linhas invalidas nao impedem a importacao das demais.
              </AlertDescription>
            </Alert>

            <Button type="button" variant="outline" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Baixar template CSV
            </Button>

            <form className="space-y-4" onSubmit={submit}>
              <Input
                type="file"
                accept=".csv,.xlsx"
                onChange={(event) => {
                  setFile(event.target.files?.[0] || null);
                  setResult(null);
                }}
              />
              <Button type="submit" disabled={!file || loading}>
                <Upload className="mr-2 h-4 w-4" />
                {loading ? "Importando..." : "Importar produtos"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Resultado da importacao
              </CardTitle>
              <CardDescription>{result.totalLinhas} linha(s) processada(s).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Summary label="Novos produtos" value={result.importados} />
                <Summary label="Produtos atualizados" value={result.atualizados} />
                <Summary label="Linhas com erro" value={result.ignorados} />
              </div>

              {result.erros.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
                    <AlertTriangle className="h-4 w-4" />
                    Revise as linhas abaixo e envie uma nova planilha somente com as correcoes.
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Linha</TableHead>
                          <TableHead>Codigo</TableHead>
                          <TableHead>Motivo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.erros.map((error) => (
                          <TableRow key={`${error.linha}-${error.codigo || "sem-codigo"}`}>
                            <TableCell>{error.linha}</TableCell>
                            <TableCell>{error.codigo || "-"}</TableCell>
                            <TableCell>{error.mensagem}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
