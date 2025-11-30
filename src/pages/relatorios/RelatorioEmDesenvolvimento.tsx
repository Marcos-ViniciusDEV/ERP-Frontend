import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function RelatorioEmDesenvolvimento() {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="p-4 bg-muted rounded-full">
          <Construction className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Relatório em Desenvolvimento</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Este relatório está sendo implementado e estará disponível em breve.
        </p>
      </div>
    </DashboardLayout>
  );
}
