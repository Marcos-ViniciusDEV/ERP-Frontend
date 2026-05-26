import AdminSaasLayout from "./AdminSaasLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { date, saasApi, useSaasData } from "./saasUtils";

export default function GestaoPDVs() {
  const { data, loading, error, reload } = useSaasData<any[]>(saasApi.pdvs, []);

  const toggle = async (row: any, ativo: boolean) => {
    try {
      await saasApi.atualizarPdv(row.pdv.id, { ativo });
      toast.success("PDV atualizado");
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Erro ao atualizar PDV");
    }
  };

  const semAcessoRecente = (ultimoAcesso?: string) => {
    if (!ultimoAcesso) return true;
    return Date.now() - new Date(ultimoAcesso).getTime() > 30 * 24 * 60 * 60 * 1000;
  };

  return (
    <AdminSaasLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">PDVs por Loja</h1>
          <p className="text-muted-foreground">Ative, desative e monitore terminais por empresa.</p>
        </div>

        {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        <Card>
          <CardHeader><CardTitle>Terminais Registrados</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>PDV ID</TableHead>
                  <TableHead>Apelido</TableHead>
                  <TableHead>Último acesso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ativo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6}>Carregando...</TableCell></TableRow>
                ) : (data ?? []).map((row) => (
                  <TableRow key={row.pdv.id}>
                    <TableCell className="font-medium">{row.empresa?.nomeFantasia || row.empresa?.razaoSocial}</TableCell>
                    <TableCell>{row.pdv.pdvId}</TableCell>
                    <TableCell>{row.pdv.apelido ?? "-"}</TableCell>
                    <TableCell>{date(row.pdv.ultimoAcesso)}</TableCell>
                    <TableCell>
                      <Badge variant={semAcessoRecente(row.pdv.ultimoAcesso) ? "secondary" : "default"}>
                        {semAcessoRecente(row.pdv.ultimoAcesso) ? "Sem acesso recente" : "Recente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Switch checked={row.pdv.ativo} onCheckedChange={(ativo) => toggle(row, ativo)} />
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
