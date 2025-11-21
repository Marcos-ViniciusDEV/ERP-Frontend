/**
 * DashboardLayout - Layout Principal do Sistema ERP
 *
 * Componente de layout que envolve todas as páginas do sistema.
 * Gerencia a estrutura visual com sidebar, menu superior e área de conteúdo.
 *
 * Funcionalidades:
 * - Sidebar lateral com atalhos personalizáveis
 * - Redimensionamento do sidebar (200-480px)
 * - Menu superior com navegação hierárquica
 * - Suporte a modo colapsado (apenas ícones)
 * - Persistência de largura em localStorage
 * - Integração com sistema de autenticação
 *
 * Atalhos de Teclado:
 * - ' (aspas): Abre/fecha sidebar
 * - Ctrl+B: Abre/fecha sidebar
 * - ESC: Fecha sidebar (se aberto)
 * - F1-F11: Atalhos configuráveis
 *
 * Contextos Utilizados:
 * - RightPanelProvider: Painel lateral direito
 * - LeftSidebarProvider: Estado do sidebar esquerdo
 * - ShortcutsProvider: Gerenciamento de atalhos
 * - ShortcutDialogProvider: Dialog de criação de atalhos
 *
 * @component
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuSub,
} from "@/components/ui/sidebar";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LogOut,
  PanelLeft,
  Package,
  X,
  ChevronRight,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { ShortcutsProvider, useShortcuts } from "@/contexts/ShortcutsContext";
import { toast } from "sonner";
import { TopMenuBar } from "./TopMenuBar";
import { RightPanelProvider } from "@/contexts/RightPanelContext";
import { LeftSidebarProvider } from "@/contexts/SidebarContext";
import {
  ShortcutDialogProvider,
  useShortcutDialog,
} from "@/contexts/ShortcutDialogContext";
import { useMenuItems, SubMenuItem } from "@/hooks/useMenuItems";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

/** Chaves e constantes de configuração do sidebar */
const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <div className="relative group">
              <div className="relative">
                <img
                  src={APP_LOGO}
                  alt={APP_TITLE}
                  className="h-20 w-20 rounded-xl object-cover shadow"
                />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">{APP_TITLE}</h1>
              <p className="text-sm text-muted-foreground">
                Please sign in to continue
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              window.location.href = "/login";
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <RightPanelProvider>
      <LeftSidebarProvider>
        <ShortcutsProvider>
          <ShortcutDialogProvider>
            <SidebarProvider
              defaultOpen={false}
              style={
                {
                  "--sidebar-width": `${sidebarWidth}px`,
                } as CSSProperties
              }
            >
              <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
                {children}
              </DashboardLayoutContent>
            </SidebarProvider>
          </ShortcutDialogProvider>
        </ShortcutsProvider>
      </LeftSidebarProvider>
    </RightPanelProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const { shortcuts, removeShortcut } = useShortcuts();
  const { isDialogOpen } = useShortcutDialog();
  const { toggleSidebar } = useSidebar();
  useKeyboardShortcuts(isDialogOpen); // Desabilitar atalhos quando dialog estiver aberto
  const [location, setLocation] = useLocation();
  const [isResizing, setIsResizing] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    itemId: string;
  } | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = shortcuts.find(item => item.path === location);
  const isMobile = useIsMobile();

  // Atalho para abrir/fechar sidebar com Ctrl+B, tecla ' ou ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se estiver em um input, textarea ou select
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable ||
        isDialogOpen
      ) {
        return;
      }

      // Ctrl+B ou tecla ' (aspas simples) - toggle sidebar
      if ((e.ctrlKey && e.key === "b") || e.key === "'") {
        e.preventDefault();
        toggleSidebar();
      }

      // ESC - fechar sidebar se estiver aberto
      if (e.key === "Escape") {
        const sidebarState = document
          .querySelector("[data-sidebar]")
          ?.getAttribute("data-state");
        if (sidebarState === "expanded") {
          e.preventDefault();
          toggleSidebar();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar, isDialogOpen]);

  const handleRemoveShortcut = (itemId: string) => {
    const item = shortcuts.find(s => s.id === itemId);
    if (item?.isCustom) {
      removeShortcut(itemId);
      toast.success(`Atalho "${item?.label}" removido!`);
    }
    setContextMenu(null);
  };

  const handleContextMenu = (
    e: React.MouseEvent,
    itemId: string,
    isCustom?: boolean
  ) => {
    if (!isCustom) return; // Só permite remover atalhos personalizados
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      itemId,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeaderContent />
          <SidebarMainContent
            shortcuts={shortcuts}
            location={location}
            setLocation={setLocation}
            handleContextMenu={handleContextMenu}
          />
          <SidebarFooterContent user={user} logout={logout} />
        </Sidebar>
        <SidebarResizeHandle
          setIsResizing={setIsResizing}
        />
      </div>

      <SidebarInset>
        <TopMenuBar />
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? APP_TITLE}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>

      {/* Menu de Contexto */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-50"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed bg-popover rounded-lg shadow-lg border border-border py-1 z-50 min-w-[160px]"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => handleRemoveShortcut(contextMenu.itemId)}
              className="w-full px-4 py-2 text-sm text-left hover:bg-accent rounded-sm flex items-center gap-2 text-destructive"
            >
              <X className="w-4 h-4" />
              Remover atalho
            </button>
          </div>
        </>
      )}
    </>
  );
}

// Componentes internos que usam useSidebar do shadcn
function SidebarHeaderContent() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarHeader className="h-16 justify-center">
      <div className="flex items-center gap-3 pl-2 group-data-[collapsible=icon]:px-0 transition-all w-full">
        {isCollapsed ? (
          <div className="relative h-8 w-8 shrink-0 group">
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center ring-1 ring-border shadow-sm">
              <span className="text-white font-bold text-sm">ERP</span>
            </div>
            <button
              onClick={toggleSidebar}
              className="absolute inset-0 flex items-center justify-center bg-accent rounded-md ring-1 ring-border opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <PanelLeft className="h-4 w-4 text-foreground" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-8 w-8 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center ring-1 ring-border shadow-sm shrink-0">
                <span className="text-white font-bold text-sm">ERP</span>
              </div>
              <span className="font-semibold tracking-tight truncate">
                {APP_TITLE}
              </span>
            </div>
            <button
              onClick={toggleSidebar}
              className="ml-auto h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
            >
              <PanelLeft className="h-4 w-4 text-muted-foreground" />
            </button>
          </>
        )}
      </div>
    </SidebarHeader>
  );
}

function SidebarMainContent({
  shortcuts,
  location,
  setLocation,
  handleContextMenu,
}: {
  shortcuts: any[];
  location: string;
  setLocation: (path: string) => void;
  handleContextMenu: (
    e: React.MouseEvent,
    itemId: string,
    isCustom?: boolean
  ) => void;
}) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isMobile = useIsMobile();
  const menuItems = useMenuItems();

  const renderMobileMenuItems = (items: SubMenuItem[]) => {
    return items.map((item, index) => {
      if (item.items && item.items.length > 0) {
        return (
          <Collapsible key={index} asChild defaultOpen={false} className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.label}>
                  <span>{item.label}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {renderMobileMenuItems(item.items)}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        );
      }

      return (
        <SidebarMenuItem key={index}>
          <SidebarMenuButton
            onClick={() => {
              if (item.action) item.action();
              else if (item.path) setLocation(item.path);
            }}
            isActive={location === item.path}
          >
            <span>{item.label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });
  };

  return (
    <SidebarContent className="gap-0">
      <div className="overflow-y-auto flex-1">
        {/* Atalhos (Favoritos) */}
        <SidebarGroup>
          <SidebarGroupLabel>Favoritos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {shortcuts.map(item => {
                const isActive = location === item.path;
                const IconComponent =
                  typeof item.icon === "function" ? item.icon : Package;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      onContextMenu={e =>
                        handleContextMenu(e, item.id, item.isCustom)
                      }
                      tooltip={item.label}
                      className={`h-10 transition-all font-normal relative group ${item.isCustom ? "cursor-context-menu" : ""}`}
                    >
                      <IconComponent
                        className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.shortcut && (
                        <span className="text-xs text-muted-foreground opacity-60 group-data-[collapsible=icon]:hidden">
                          {item.shortcut}
                        </span>
                      )}
                      {item.isCustom && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity group-data-[collapsible=icon]:hidden" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Menu Principal (Apenas Mobile) */}
        {isMobile && (
          <>
            <div className="px-2 py-2">
              <div className="h-[1px] bg-border" />
            </div>
            <SidebarGroup>
              <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((section, index) => (
                    <Collapsible key={index} asChild defaultOpen={false} className="group/collapsible">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={section.label}>
                            <span className="font-medium">{section.label}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {section.items && renderMobileMenuItems(section.items)}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </div>

      {/* Dica de uso */}
      {!isCollapsed && !isMobile && (
        <div className="px-4 py-3 text-xs text-muted-foreground text-center border-t mt-2">
          Clique com botão direito em atalhos personalizados para removê-los
        </div>
      )}
    </SidebarContent>
  );
}

function SidebarFooterContent({
  user,
  logout,
}: {
  user: any;
  logout: () => void;
}) {
  return (
    <SidebarFooter className="p-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="h-9 w-9 border shrink-0">
              <AvatarFallback className="text-xs font-medium">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-medium truncate leading-none">
                {user?.name || "-"}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-1.5">
                {user?.email || "-"}
              </p>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={logout}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarFooter>
  );
}

function SidebarResizeHandle({
  setIsResizing,
}: {
  setIsResizing: (resizing: boolean) => void;
}) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div
      className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
      onMouseDown={() => {
        if (isCollapsed) return;
        setIsResizing(true);
      }}
      style={{ zIndex: 50 }}
    />
  );
}
