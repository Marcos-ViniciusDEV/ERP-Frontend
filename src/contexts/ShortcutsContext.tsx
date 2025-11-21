/**
 * ShortcutsContext - Gerenciamento de Atalhos de Teclado
 *
 * Este contexto gerencia todos os atalhos de teclado do sistema ERP.
 * Permite criar atalhos ilimitados e personalizáveis para qualquer rota.
 *
 * Funcionalidades:
 * - Atalhos padrão (F1-F11) para funcionalidades principais
 * - Criação de atalhos personalizados via menu de contexto
 * - Suporte a qualquer combinação de teclas (Ctrl+Shift+A, Alt+Q, etc.)
 * - Persistência em localStorage
 * - Remoção de atalhos personalizados
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  LayoutDashboard,
  FileText,
  TrendingUp,
  Box,
  Package,
  BarChart3,
  ShoppingCart,
  CreditCard,
  Building2,
} from "lucide-react";

/**
 * Interface para itens de atalho
 * @property {string} id - Identificador único do atalho
 * @property {any} icon - Componente de ícone do Lucide React
 * @property {string} label - Texto exibido no sidebar
 * @property {string} path - Rota de navegação
 * @property {string} shortcut - Combinação de teclas (ex: "F1", "Ctrl+Shift+A")
 * @property {boolean} isCustom - Se é um atalho criado pelo usuário
 */
export interface ShortcutItem {
  id: string;
  icon: any;
  label: string;
  path: string;
  shortcut?: string;
  isCustom?: boolean;
}

interface ShortcutsContextType {
  shortcuts: ShortcutItem[];
  addShortcut: (item: Omit<ShortcutItem, "isCustom">) => boolean;
  removeShortcut: (id: string) => void;
  canAddMore: boolean;
}

const ShortcutsContext = createContext<ShortcutsContextType | undefined>(
  undefined
);

const SHORTCUTS_STORAGE_KEY = "erp-sidebar-shortcuts";

/**
 * Atalhos padrão do sistema
 * Configurados com as principais funcionalidades do ERP
 */
const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/",
    shortcut: "F1",
  },
  {
    id: "entrada-mercadoria",
    icon: FileText,
    label: "Entrada de Mercadoria",
    path: "/estoque/entrada",
    shortcut: "F2",
  },
  {
    id: "baixas-manuais",
    icon: TrendingUp,
    label: "Baixas Manuais",
    path: "/estoque/baixas",
    shortcut: "F3",
  },
  {
    id: "inventario",
    icon: Box,
    label: "Inventário",
    path: "/estoque/inventario",
    shortcut: "F4",
  },
  {
    id: "produtos",
    icon: Package,
    label: "Produtos",
    path: "/estoque/produtos",
    shortcut: "F5",
  },
  {
    id: "consultar-vendas",
    icon: BarChart3,
    label: "Consultar Vendas",
    path: "/vendas/consultar",
    shortcut: "F6",
  },
  {
    id: "caixa",
    icon: CreditCard,
    label: "Movimentação de Caixa",
    path: "/financeiro/caixa",
    shortcut: "F7",
  },
  {
    id: "contas-pagar",
    icon: FileText,
    label: "Contas a Pagar",
    path: "/financeiro/pagar",
    shortcut: "F8",
  },
  {
    id: "contas-receber",
    icon: ShoppingCart,
    label: "Contas a Receber",
    path: "/financeiro/receber",
    shortcut: "F9",
  },
  {
    id: "fornecedores",
    icon: Building2,
    label: "Fornecedores",
    path: "/compras/fornecedores",
    shortcut: "F10",
  },
  {
    id: "pedidos-compra",
    icon: ShoppingCart,
    label: "Pedidos de Compra",
    path: "/compras/pedidos",
    shortcut: "F11",
  },
];

/**
 * Provider de Atalhos
 * Gerencia estado e persistência dos atalhos
 */
export function ShortcutsProvider({ children }: { children: ReactNode }) {
  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>(() => {
    // Carregar atalhos salvos do localStorage
    const saved = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Mesclar com atalhos padrão se necessário
        return parsed.length > 0 ? parsed : DEFAULT_SHORTCUTS;
      } catch {
        return DEFAULT_SHORTCUTS;
      }
    }
    return DEFAULT_SHORTCUTS;
  });

  // Salvar alterações no localStorage
  useEffect(() => {
    localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(shortcuts));
  }, [shortcuts]);

  /**
   * Adiciona um novo atalho personalizado
   * @param item - Dados do atalho (sem a flag isCustom)
   * @returns true se criado com sucesso, false se já existe
   */
  const addShortcut = (item: Omit<ShortcutItem, "isCustom">): boolean => {
    // Verificar se já existe pelo ID (permite múltiplos atalhos para o mesmo caminho)
    if (shortcuts.some(s => s.id === item.id)) {
      return false;
    }

    // Se o shortcut foi fornecido, usar ele
    let finalShortcut = item.shortcut;

    setShortcuts(prev => [
      ...prev,
      {
        ...item,
        icon: item.icon || Package,
        shortcut: finalShortcut,
        isCustom: true,
      },
    ]);

    return true;
  };

  /**
   * Remove um atalho personalizado
   * @param id - ID do atalho a ser removido
   */
  const removeShortcut = (id: string) => {
    setShortcuts(prev => prev.filter(s => s.id !== id));
  };

  const canAddMore = true; // Sempre pode adicionar mais atalhos

  return (
    <ShortcutsContext.Provider
      value={{ shortcuts, addShortcut, removeShortcut, canAddMore }}
    >
      {children}
    </ShortcutsContext.Provider>
  );
}

/**
 * Hook para acessar o contexto de atalhos
 * @throws Error se usado fora do ShortcutsProvider
 */
export function useShortcuts() {
  const context = useContext(ShortcutsContext);
  if (context === undefined) {
    throw new Error("useShortcuts must be used within a ShortcutsProvider");
  }
  return context;
}
