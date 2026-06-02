import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, FileSpreadsheet, Landmark, Monitor, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

interface OnboardingData {
  id: number;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  onboardingEtapa: number;
  onboardingConcluido: boolean;
}

const steps = [
  { title: "Dados da loja", description: "Confirme como sua empresa aparece no sistema.", icon: Store },
  { title: "Configuracao fiscal", description: "Prepare a emissao de NFC-e e NF-e da sua empresa.", icon: Landmark },
  { title: "Produtos iniciais", description: "Cadastre produtos manualmente ou importe sua planilha.", icon: FileSpreadsheet },
  { title: "Preparar PDV", description: "Configure os terminais que farao suas vendas.", icon: Monitor },
];

export function Onboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");

  const onboarding = useQuery<OnboardingData>({
    queryKey: ["empresa", "onboarding"],
    queryFn: async () => (await api.get("/empresas/onboarding")).data,
  });

  useEffect(() => {
    if (!onboarding.data) return;
    setStep(onboarding.data.onboardingEtapa || 1);
    setRazaoSocial(onboarding.data.razaoSocial || "");
    setNomeFantasia(onboarding.data.nomeFantasia || "");
  }, [onboarding.data]);

  const saveProgress = useMutation({
    mutationFn: async (data: Partial<OnboardingData>) => (await api.put("/empresas/onboarding", data)).data,
  });

  async function advance() {
    const nextStep = Math.min(4, step + 1);
    await saveProgress.mutateAsync({
      onboardingEtapa: nextStep,
      nomeFantasia,
      razaoSocial,
    });
    setStep(nextStep);
  }

  async function finish() {
    await saveProgress.mutateAsync({
      onboardingEtapa: 4,
      onboardingConcluido: true,
      nomeFantasia,
      razaoSocial,
    });
    setLocation("/dashboard");
  }

  const current = steps[step - 1];
  const CurrentIcon = current.icon;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="text-center">
          <p className="text-sm font-medium text-primary">Configuracao inicial</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Bem-vindo, {user?.name || "usuario"}!</h1>
          <p className="mt-2 text-slate-600">Prepare sua empresa para comecar a operar com tranquilidade.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Progresso da configuracao</CardTitle>
            <CardDescription>Etapa {step} de {steps.length}. Voce pode sair e continuar depois.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={(step / steps.length) * 100} />
            <div className="grid gap-3 md:grid-cols-4">
              {steps.map((item, index) => {
                const Icon = item.icon;
                const completed = index + 1 < step;
                const active = index + 1 === step;
                return (
                  <div key={item.title} className={`rounded-lg border p-3 ${active ? "border-primary bg-primary/5" : "bg-white"}`}>
                    {completed ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <Icon className="h-5 w-5 text-slate-500" />}
                    <p className="mt-2 text-sm font-medium">{item.title}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2"><CurrentIcon className="h-5 w-5 text-primary" /></div>
              <div>
                <CardTitle>{current.title}</CardTitle>
                <CardDescription className="mt-1">{current.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {step === 1 && (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  Razao social
                  <Input value={razaoSocial} onChange={(event) => setRazaoSocial(event.target.value)} />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  Nome fantasia
                  <Input value={nomeFantasia} onChange={(event) => setNomeFantasia(event.target.value)} />
                </label>
                <p className="text-sm text-muted-foreground md:col-span-2">CNPJ: {onboarding.data?.cnpj || "carregando..."}</p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">Informe regime tributario, ambiente, numeracao e credencial do provider fiscal.</p>
                <Link href="/fiscal/configuracoes"><Button variant="outline">Abrir configuracoes fiscais</Button></Link>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">Use o template para cadastrar seu catalogo inicial rapidamente.</p>
                <Link href="/utilitarios/importacao"><Button variant="outline">Importar planilha de produtos</Button></Link>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">Cadastre e acompanhe os PDVs vinculados a sua empresa.</p>
                <Link href="/pdv/gerenciar"><Button variant="outline">Gerenciar PDVs</Button></Link>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <Button variant="ghost" onClick={() => setLocation("/dashboard")}>Continuar depois</Button>
              {step < 4 ? (
                <Button onClick={advance} disabled={saveProgress.isPending || (step === 1 && (!razaoSocial.trim() || !nomeFantasia.trim()))}>
                  Salvar e continuar
                </Button>
              ) : (
                <Button onClick={finish} disabled={saveProgress.isPending}>Concluir configuracao</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
