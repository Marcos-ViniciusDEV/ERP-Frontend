import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Bug, Inbox, Lightbulb, Search, Ticket } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import AdminSaasLayout from "./AdminSaasLayout";
import { date, saasApi, useSaasData } from "./saasUtils";

const statusOptions = ["TODOS", "ABERTO", "EM_ANALISE", "EM_ANDAMENTO", "RESOLVIDO", "FECHADO"];
const typeOptions = ["TODOS", "SUPORTE", "BUG", "MELHORIA"];

const statusTone: Record<string, string> = {
  ABERTO: "bg-blue-100 text-blue-800",
  EM_ANALISE: "bg-amber-100 text-amber-800",
  EM_ANDAMENTO: "bg-purple-100 text-purple-800",
  RESOLVIDO: "bg-green-100 text-green-800",
  FECHADO: "bg-slate-100 text-slate-700",
};

const typeTone: Record<string, string> = {
  SUPORTE: "bg-blue-100 text-blue-800",
  BUG: "bg-red-100 text-red-800",
  MELHORIA: "bg-emerald-100 text-emerald-800",
};

export default function GestaoSuporte() {
  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState("TODOS");
  const [status, setStatus] = useState("TODOS");
  const [selected, setSelected] = useState<any | null>(null);
  const [response, setResponse] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("EM_ANALISE");

  const { data, loading, error, reload } = useSaasData<any[]>(
    () => saasApi.suporteTickets({ q: search, tipo, status }),
    [search, tipo, status]
  );

  const tickets = data ?? [];
  const stats = useMemo(() => ({
    total: tickets.length,
    abertos: tickets.filter((row) => row.ticket.status === "ABERTO").length,
    bugs: tickets.filter((row) => row.ticket.tipo === "BUG").length,
    melhorias: tickets.filter((row) => row.ticket.tipo === "MELHORIA").length,
  }), [tickets]);

  const openTicket = (row: any) => {
    setSelected(row);
    setResponse(row.ticket.resposta ?? "");
    setSelectedStatus(row.ticket.status);
  };

  const updateTicket = async () => {
    if (!selected) return;
    try {
      await saasApi.atualizarSuporteTicket(selected.ticket.id, {
        status: selectedStatus,
        resposta: response,
      });
      toast.success("Atendimento atualizado");
      setSelected(null);
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Erro ao atualizar atendimento");
    }
  };

  return (
    <AdminSaasLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Suporte dos Clientes</h1>
            <p className="text-slate-600">
              Receba chamados, bugs e solicitações de melhoria enviados pelo ERP dos clientes.
            </p>
          </div>
        </div>

        {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total" value={stats.total} icon={Inbox} />
          <MetricCard label="Abertos" value={stats.abertos} icon={Ticket} />
          <MetricCard label="Bugs" value={stats.bugs} icon={Bug} />
          <MetricCard label="Melhorias" value={stats.melhorias} icon={Lightbulb} />
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <CardTitle>Fila de Atendimento</CardTitle>
              <div className="grid gap-2 md:grid-cols-[1fr_160px_180px]">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    className="pl-9"
                    placeholder="Pesquisar cliente, título, módulo..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                <select className="h-10 rounded-md border bg-white px-3 text-sm" value={tipo} onChange={(event) => setTipo(event.target.value)}>
                  {typeOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <select className="h-10 rounded-md border bg-white px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
                  {statusOptions.map((item) => <option key={item} value={item}>{item.replace(/_/g, " ")}</option>)}
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Solicitação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7}>Carregando...</TableCell></TableRow>
                ) : tickets.length === 0 ? (
                  <TableRow><TableCell colSpan={7}>Nenhuma solicitação encontrada.</TableCell></TableRow>
                ) : tickets.map((row) => (
                  <TableRow key={row.ticket.id}>
                    <TableCell>
                      <p className="font-medium">{row.empresa?.nomeFantasia || row.empresa?.razaoSocial || "Empresa"}</p>
                      <p className="text-xs text-slate-500">{row.usuario?.name || row.usuario?.email || "Usuário não identificado"}</p>
                    </TableCell>
                    <TableCell><Badge className={typeTone[row.ticket.tipo] ?? ""}>{row.ticket.tipo}</Badge></TableCell>
                    <TableCell>
                      <p className="font-medium">{row.ticket.titulo}</p>
                      <p className="max-w-md truncate text-xs text-slate-500">{row.ticket.descricao}</p>
                    </TableCell>
                    <TableCell><Badge className={statusTone[row.ticket.status] ?? ""}>{row.ticket.status.replace(/_/g, " ")}</Badge></TableCell>
                    <TableCell>{row.ticket.prioridade}</TableCell>
                    <TableCell>{date(row.ticket.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => openTicket(row)}>Atender</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selected?.ticket.titulo}</DialogTitle>
            </DialogHeader>

            {selected && (
              <div className="grid gap-4">
                <div className="grid gap-3 rounded-md bg-slate-50 p-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">Cliente</p>
                    <p className="font-medium">{selected.empresa?.nomeFantasia || selected.empresa?.razaoSocial}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">Usuário</p>
                    <p className="font-medium">{selected.usuario?.name || selected.usuario?.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">Tipo / Módulo</p>
                    <p className="font-medium">{selected.ticket.tipo} · {selected.ticket.modulo || "Sem módulo"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">Criado em</p>
                    <p className="font-medium">{date(selected.ticket.createdAt)}</p>
                  </div>
                </div>

                <div>
                  <Label>Descrição enviada pelo cliente</Label>
                  <div className="mt-2 rounded-md border bg-white p-3 text-sm">{selected.ticket.descricao}</div>
                </div>

                {selected.ticket.passosReproducao && (
                  <div>
                    <Label>Passos para reproduzir</Label>
                    <div className="mt-2 rounded-md border bg-white p-3 text-sm">{selected.ticket.passosReproducao}</div>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Status do atendimento</Label>
                    <select className="mt-2 h-10 w-full rounded-md border bg-white px-3 text-sm" value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
                      {statusOptions.filter((item) => item !== "TODOS").map((item) => (
                        <option key={item} value={item}>{item.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Prioridade</Label>
                    <Input className="mt-2" value={selected.ticket.prioridade} readOnly />
                  </div>
                </div>

                <div>
                  <Label>Resposta / observação interna</Label>
                  <Textarea className="mt-2" rows={4} value={response} onChange={(event) => setResponse(event.target.value)} />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelected(null)}>Fechar</Button>
              <Button onClick={updateTicket}>Salvar Atendimento</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminSaasLayout>
  );
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <Card className="border-l-4 border-l-blue-600">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        <Icon className="h-7 w-7 text-blue-600" />
      </CardContent>
    </Card>
  );
}
