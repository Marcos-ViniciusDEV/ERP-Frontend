/**
 * TopMenuBar - Barra de Menu Superior do ERP
 *
 * Componente principal de navegação do sistema.
 * Exibe menus dropdown organizados por categoria e permite criação de atalhos
 * através de menu de contexto (clique direito).
 *
 * Funcionalidades:
 * - Menus dropdown hierárquicos (Cadastros, Movimentos, Módulos, etc.)
 * - Criação de atalhos personalizados via clique direito
 * - Dialog de captura de combinação de teclas
 * - Botão de logout
 * - Exibição de data/hora
 *
 * Atalhos:
 * - Clique direito em item do menu: Criar atalho
 * - ESC: Fechar menu de contexto
 *
 * @component
 */

import { useState } from "react";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut, Plus, Package } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useRightPanel } from "@/contexts/RightPanelContext";
import { useLeftSidebar } from "@/contexts/SidebarContext";
import { useShortcuts } from "@/contexts/ShortcutsContext";
import { useShortcutDialog } from "@/contexts/ShortcutDialogContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect } from "react";

/** Estrutura de menu principal */
interface MenuItem {
  label: string;
  items?: SubMenuItem[];
  action?: () => void;
}

/** Item de submenu com suporte a rotas e ações */
interface SubMenuItem {
  label: string;
  path?: string;
  action?: () => void;
  items?: SubMenuItem[];
  separator?: boolean;
}

/** Posição e dados do menu de contexto */
interface ContextMenu {
  x: number;
  y: number;
  item: SubMenuItem;
}

export function TopMenuBar() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const { openPanel } = useRightPanel();
  useLeftSidebar();
  const { addShortcut, shortcuts } = useShortcuts();
  const { setIsDialogOpen } = useShortcutDialog();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [showShortcutDialog, setShowShortcutDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SubMenuItem | null>(null);
  const [capturedKey, setCapturedKey] = useState<string>("");

  // Sincronizar estado do dialog com o contexto
  useEffect(() => {
    setIsDialogOpen(showShortcutDialog);
  }, [showShortcutDialog, setIsDialogOpen]);

  // Capturar teclas pressionadas no dialog
  useEffect(() => {
    if (!showShortcutDialog) {
      setCapturedKey("");
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const parts: string[] = [];
      if (e.ctrlKey) parts.push("Ctrl");
      if (e.shiftKey) parts.push("Shift");
      if (e.altKey) parts.push("Alt");
      if (e.metaKey) parts.push("Meta");

      // Adicionar a tecla principal se não for uma tecla modificadora
      if (!["Control", "Shift", "Alt", "Meta"].includes(e.key)) {
        const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
        parts.push(key);
      }

      if (parts.length > 0) {
        const shortcut = parts.join("+");
        setCapturedKey(shortcut);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showShortcutDialog]);

  // Fechar menu de contexto ao clicar fora
  useEffect(() => {
    if (!contextMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Fechar se clicar fora do menu de contexto
      if (!target.closest("[data-context-menu]")) {
        setContextMenu(null);
      }
    };

    // Usar timeout para evitar fechar imediatamente após abrir
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [contextMenu]);

  const menuItems: MenuItem[] = [
    {
      label: "Cadastros",
      items: [
        { label: "Clientes", path: "/cadastros/clientes" },
        { label: "Produtos", path: "/estoque/produtos" },
        { label: "Fornecedores", path: "/compras/fornecedores" },
        { label: "Estoques", path: "/estoque/consulta" },
      ],
    },
    {
      label: "Movimentos",
      items: [
        { label: "Vendas", path: "/vendas/consultar" },
        { label: "Entrada de Mercadoria", path: "/estoque/entrada" },
        { label: "Baixas Manuais", path: "/estoque/baixas" },
        { label: "Movimentação de Caixa", path: "/financeiro/caixa" },
        { label: "Pedidos de Compra", path: "/compras/pedidos" },
      ],
    },
    {
      label: "Módulos",
      items: [
        { label: "Inventário", path: "/estoque/inventario" },
        { label: "Contas a Receber", path: "/financeiro/receber" },
        { label: "Contas a Pagar", path: "/financeiro/pagar" },
        { label: "Pedidos de Compra", path: "/compras/pedidos" },
      ],
    },
    {
      label: "Automação",
      items: [
        {
          label: "Importar NFe",
          action: () => openPanel(),
        },
        { label: "Backup Automático", path: "/automacao/backup" },
        {
          label: "Backup e Restauração",
          path: "/automacao/backup-restauracao",
        },
      ],
    },
    {
      label: "Relatórios",
      items: [
        {
          label: "Relatórios de Documentos",
          items: [
            {
              label: "Resumo Por Documento",
              path: "/relatorios/resumo-documento",
            },
            {
              label: "Resumo Por Documento / Cancelamentos",
              path: "/relatorios/resumo-documento-cancelamentos",
            },
          ],
        },
        { label: "Relação De Produtos", path: "/relatorios/relacao-produtos" },
        {
          label: "Resumos De Movimento",
          items: [
            {
              label: "Resumo de Movimento",
              path: "/relatorios/resumo-movimento",
            },
            {
              label: "Resumos De Movimento/Unidades",
              path: "/relatorios/movimento-unidades",
            },
            {
              label: "Resumos De Tipo Movimento",
              path: "/relatorios/tipo-movimento",
            },
          ],
        },
        { label: "Resumos Marcas Vendas", path: "/relatorios/marcas-vendas" },
        { label: "Posição Dos Estoques", path: "/relatorios/posicao-estoques" },
        {
          label: "Movimento Hierárquico",
          path: "/relatorios/movimento-hierarquico",
        },
        { label: "Mesa De Movimento", path: "/relatorios/mesa-movimento" },
        {
          label: "Resumo De Lançamento",
          path: "/relatorios/resumo-lancamento",
        },
        {
          label: "Resumo Diário Vendas",
          path: "/relatorios/resumo-diario-vendas",
        },
        {
          label: "Resumo Por Produto",
          items: [
            { label: "Resumo Por Produto", path: "/relatorios/resumo-produto" },
            {
              label: "Resumo Faturamentos",
              path: "/relatorios/resumo-faturamentos",
            },
          ],
        },
        {
          label: "Movimento Vendedores",
          path: "/relatorios/movimento-vendedores",
        },
        {
          label: "Relação Dos Notas de Contribuintes",
          path: "/relatorios/notas-contribuintes",
        },
        {
          label: "Posição dos Etiquetas Diário",
          path: "/relatorios/etiquetas-diario",
        },
      ],
    },
    {
      label: "Configurações",
      items: [
        { label: "Parâmetros do Sistema", path: "/configuracoes/parametros" },
        { label: "Calculadora", path: "/configuracoes/calculadora" },
        {
          label: "Relatórios Personalizados",
          path: "/configuracoes/relatorios",
        },
        { label: "Usuários e Permissões", path: "/configuracoes/usuarios" },
      ],
    },
    {
      label: "Utilitários",
      items: [
        { label: "Etiquetas", path: "/utilitarios/etiquetas" },
        { label: "Importação de Dados", path: "/utilitarios/importacao" },
      ],
    },
    {
      label: "Específicos",
      items: [{ label: "Integrações", path: "/especificos/integracoes" }],
    },
  ];

  const handleMenuClick = (item: SubMenuItem) => {
    if (item.action) {
      item.action();
    } else if (item.path) {
      setLocation(item.path);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, item: SubMenuItem) => {
    e.preventDefault();
    e.stopPropagation();

    if (!item.path) return; // Só permite criar atalho para itens com path

    // Posicionar menu à direita do dropdown menu
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const menuOffset = 8; // 8px de espaçamento
    const x = rect.right + menuOffset;
    const y = rect.top;

    // NÃO fechar o dropdown - manter aberto
    setContextMenu({
      x,
      y,
      item,
    });
  };

  const handleCreateShortcut = () => {
    if (!contextMenu) return;

    setSelectedItem(contextMenu.item);
    setContextMenu(null);
    setShowShortcutDialog(true);
  };

  const handleSelectShortcutKey = (shortcutKey: string) => {
    if (!selectedItem || !selectedItem.path) return;

    // Verificar se a tecla já está em uso
    const existingShortcut = shortcuts.find(s => s.shortcut === shortcutKey);
    if (existingShortcut) {
      toast.error(
        `A tecla ${shortcutKey} já está em uso por "${existingShortcut.label}"`
      );
      setCapturedKey("");
      return;
    }

    // Gerar ID único baseado no path e timestamp
    const uniqueId = `${selectedItem.path.replace(/\//g, "-")}-${Date.now()}`;

    const success = addShortcut({
      id: uniqueId,
      icon: Package,
      label: selectedItem.label,
      path: selectedItem.path,
      shortcut: shortcutKey,
    });

    if (success) {
      toast.success(
        `Atalho "${selectedItem.label}" criado com tecla ${shortcutKey}!`
      );
      setShowShortcutDialog(false);
      setSelectedItem(null);
      setCapturedKey("");
    } else {
      toast.error("Este atalho já existe");
      setCapturedKey("");
    }
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const renderMenuItems = (items: SubMenuItem[]) => {
    return items.map((item, index) => {
      if (item.separator) {
        return <DropdownMenuSeparator key={`sep-${index}`} />;
      }

      if (item.items && item.items.length > 0) {
        return (
          <DropdownMenuSub key={index}>
            <DropdownMenuSubTrigger>{item.label}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {renderMenuItems(item.items)}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        );
      }

      return (
        <DropdownMenuItem
          key={index}
          onClick={() => handleMenuClick(item)}
          onContextMenu={e => handleContextMenu(e, item)}
          className="relative"
        >
          {item.label}
        </DropdownMenuItem>
      );
    });
  };

  return (
    <>
      <div className="bg-blue-600 text-white shadow-md">
        <div className="flex items-center h-10 px-2 gap-1">
          {/* Menus */}
          {menuItems.map((menu, index) => (
            <DropdownMenu
              key={index}
              open={activeMenu === menu.label}
              onOpenChange={open => setActiveMenu(open ? menu.label : null)}
            >
              <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium hover:bg-blue-700 rounded transition-colors">
                {menu.label}
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                {menu.items && renderMenuItems(menu.items)}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}

          {/* Botão Sair */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium hover:bg-blue-700 rounded transition-colors ml-auto"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>

          {/* Data e Hora */}
          <div className="text-sm font-medium px-3">
            {new Date().toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>

      {/* Menu de Contexto Customizado */}
      {contextMenu && (
        <div
          data-context-menu
          className="fixed bg-white rounded-md shadow-xl border border-slate-200 py-1 min-w-[200px] z-[99999] pointer-events-auto"
          style={{
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
          }}
          onMouseDown={e => e.stopPropagation()}
        >
          <button
            onMouseDown={e => {
              e.stopPropagation();
              handleCreateShortcut();
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Criar atalho
          </button>
        </div>
      )}

      {/* Dialog de Seleção de Tecla */}
      <Dialog open={showShortcutDialog} onOpenChange={setShowShortcutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Atalho</DialogTitle>
            <DialogDescription>
              Escolha uma tecla de atalho para "{selectedItem?.label}" ou
              pressione a combinação desejada
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-sm text-muted-foreground text-center">
              Pressione qualquer combinação de teclas (Ex: Ctrl+Shift+A, F1,
              Alt+Q)
            </div>
            <div className="border-2 border-dashed rounded-lg p-8 text-center min-h-[100px] flex items-center justify-center">
              {capturedKey ? (
                <div className="text-2xl font-mono font-bold">
                  {capturedKey}
                </div>
              ) : (
                <div className="text-muted-foreground">Aguardando tecla...</div>
              )}
            </div>
            <div className="text-xs text-muted-foreground text-center">
              {shortcuts.length} atalho{shortcuts.length !== 1 ? "s" : ""}{" "}
              configurado{shortcuts.length !== 1 ? "s" : ""}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowShortcutDialog(false);
                setCapturedKey("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (capturedKey) {
                  handleSelectShortcutKey(capturedKey);
                }
              }}
              disabled={!capturedKey}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
