import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { Lock } from "lucide-react";

export default function Bloqueado() {
  const { logout } = useAuth();
  const motivo = localStorage.getItem("empresa_bloqueada_motivo") || "Entre em contato com o suporte para regularizar o acesso.";

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="p-8 text-center space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <Lock className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Sua conta está temporariamente suspensa</h1>
            <p className="mt-2 text-muted-foreground">{motivo}</p>
          </div>
          <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
            Para regularizar, fale com o suporte ou com o responsável financeiro da sua empresa.
          </div>
          <Button onClick={logout} className="w-full">Sair</Button>
        </CardContent>
      </Card>
    </div>
  );
}
