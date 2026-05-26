import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  BarChart3,
  Building2,
  CreditCard,
  FileText,
  KeyRound,
  LogOut,
  MonitorSmartphone,
} from "lucide-react";
import { ReactNode } from "react";
import { useLocation } from "wouter";

const navItems = [
  { label: "Dashboard", path: "/admin/saas", icon: BarChart3 },
  { label: "Empresas", path: "/admin/empresas", icon: Building2 },
  { label: "Planos", path: "/admin/planos", icon: CreditCard },
  { label: "Assinaturas", path: "/admin/assinaturas", icon: FileText },
  { label: "PDVs", path: "/admin/pdvs", icon: MonitorSmartphone },
  { label: "Licenças", path: "/admin/licencas", icon: KeyRound },
];

export default function AdminSaasLayout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setLocation("/admin/login");
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r bg-slate-950 text-white lg:flex lg:flex-col">
        <div className="border-b border-white/10 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-300">Backoffice</p>
          <h1 className="mt-1 text-lg font-bold">Administração Trakto</h1>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location === item.path;
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <p className="truncate text-sm font-medium">{user?.name || "Administrador"}</p>
          <p className="truncate text-xs text-slate-400">{user?.email}</p>
          <Button className="mt-3 w-full" variant="secondary" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 border-b bg-white/95 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Painel do sistema</p>
              <p className="text-lg font-bold">Gestão comercial da plataforma</p>
            </div>

            <div className="flex gap-2 overflow-x-auto lg:hidden">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  size="sm"
                  variant={location === item.path ? "default" : "outline"}
                  onClick={() => setLocation(item.path)}
                  className="shrink-0"
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
