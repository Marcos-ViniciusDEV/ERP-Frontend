import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Pin, Plus, Search, Trash2, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import AdminSaasLayout from "./AdminSaasLayout";
import { saasApi } from "./saasUtils";

const emptyForm = {
  titulo: "",
  descricao: "",
  conteudo: "",
  youtubeUrl: "",
  modulo: "",
  tempoEstimado: "",
  fixado: true,
  ordem: 0,
  ativo: true,
};

const getYouTubeId = (url?: string) => {
  if (!url) return "";
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return /^[a-zA-Z0-9_-]{6,32}$/.test(url) ? url : "";
};

export default function GestaoTutoriais() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data = [], isLoading } = useQuery({
    queryKey: ["saas", "support-tutorials", search],
    queryFn: () => saasApi.suporteTutorials(search ? { q: search } : undefined),
  });

  const tutorials = useMemo(() => data.map((row: any) => row.tutorial ?? row), [data]);
  const videoId = getYouTubeId(form.youtubeUrl);

  const saveTutorial = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        conteudo: form.conteudo || form.descricao || "Video tutorial",
        ordem: Number(form.ordem || 0),
      };
      if (editing) {
        return saasApi.atualizarSuporteTutorial(editing.id, payload);
      }
      return saasApi.criarSuporteTutorial(payload);
    },
    onSuccess: () => {
      toast.success(editing ? "Tutorial atualizado" : "Tutorial cadastrado");
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["saas", "support-tutorials"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error ?? "Erro ao salvar tutorial");
    },
  });

  const disableTutorial = useMutation({
    mutationFn: (id: number) => saasApi.desativarSuporteTutorial(id),
    onSuccess: () => {
      toast.success("Tutorial removido da Central");
      queryClient.invalidateQueries({ queryKey: ["saas", "support-tutorials"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error ?? "Erro ao remover tutorial");
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (tutorial: any) => {
    setEditing(tutorial);
    setForm({
      titulo: tutorial.titulo ?? "",
      descricao: tutorial.descricao ?? "",
      conteudo: tutorial.conteudo ?? "",
      youtubeUrl: tutorial.youtubeUrl ?? tutorial.youtubeVideoId ?? "",
      modulo: tutorial.modulo ?? "",
      tempoEstimado: tutorial.tempoEstimado ?? "",
      fixado: Boolean(tutorial.fixado),
      ordem: tutorial.ordem ?? 0,
      ativo: tutorial.ativo ?? true,
    });
    setModalOpen(true);
  };

  return (
    <AdminSaasLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Central de Suporte</p>
            <h2 className="text-2xl font-bold">Tutoriais em video</h2>
            <p className="text-sm text-slate-500">Fixe videos do YouTube para os clientes assistirem dentro do ERP.</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo tutorial
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="Pesquisar por titulo, modulo ou descricao..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          {isLoading ? (
            <Card><CardContent className="p-6 text-sm text-slate-500">Carregando tutoriais...</CardContent></Card>
          ) : tutorials.length === 0 ? (
            <Card className="xl:col-span-2">
              <CardContent className="p-6 text-sm text-slate-500">Nenhum tutorial cadastrado.</CardContent>
            </Card>
          ) : tutorials.map((tutorial: any) => (
            <Card key={tutorial.id} className="overflow-hidden">
              {tutorial.youtubeVideoId && (
                <div className="aspect-video bg-slate-950">
                  <iframe
                    className="h-full w-full"
                    src={`https://www.youtube.com/embed/${tutorial.youtubeVideoId}`}
                    title={tutorial.titulo}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{tutorial.titulo}</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">{tutorial.descricao}</p>
                  </div>
                  <Video className="h-5 w-5 shrink-0 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {tutorial.fixado && <Badge className="bg-blue-100 text-blue-800"><Pin className="mr-1 h-3 w-3" />Fixado</Badge>}
                  {tutorial.modulo && <Badge variant="secondary">{tutorial.modulo}</Badge>}
                  {tutorial.tempoEstimado && <Badge variant="outline">{tutorial.tempoEstimado}</Badge>}
                  {!tutorial.ativo && <Badge variant="destructive">Inativo</Badge>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(tutorial)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => disableTutorial.mutate(tutorial.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar tutorial" : "Novo tutorial"}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Titulo</Label>
                <Input value={form.titulo} onChange={(event) => setForm({ ...form, titulo: event.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>URL do YouTube</Label>
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={form.youtubeUrl}
                  onChange={(event) => setForm({ ...form, youtubeUrl: event.target.value })}
                />
              </div>
              {videoId && (
                <div className="md:col-span-2">
                  <div className="aspect-video overflow-hidden rounded-md border bg-slate-950">
                    <iframe
                      className="h-full w-full"
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title="Preview do tutorial"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
              <div>
                <Label>Modulo</Label>
                <Input placeholder="PDV, Estoque, Financeiro..." value={form.modulo} onChange={(event) => setForm({ ...form, modulo: event.target.value })} />
              </div>
              <div>
                <Label>Tempo estimado</Label>
                <Input placeholder="3 min" value={form.tempoEstimado} onChange={(event) => setForm({ ...form, tempoEstimado: event.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Descricao</Label>
                <Textarea rows={3} value={form.descricao} onChange={(event) => setForm({ ...form, descricao: event.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Conteudo complementar</Label>
                <Textarea rows={3} value={form.conteudo} onChange={(event) => setForm({ ...form, conteudo: event.target.value })} />
              </div>
              <div>
                <Label>Ordem</Label>
                <Input type="number" value={form.ordem} onChange={(event) => setForm({ ...form, ordem: Number(event.target.value) })} />
              </div>
              <div className="flex items-end gap-6">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Switch checked={form.fixado} onCheckedChange={(checked) => setForm({ ...form, fixado: checked })} />
                  Fixado
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Switch checked={form.ativo} onCheckedChange={(checked) => setForm({ ...form, ativo: checked })} />
                  Ativo
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button onClick={() => saveTutorial.mutate()} disabled={!form.titulo || !videoId || saveTutorial.isPending}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminSaasLayout>
  );
}
