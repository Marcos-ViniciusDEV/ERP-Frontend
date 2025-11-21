/**
 * @module SidebarContext
 * @description Gerencia o estado de abertura/fechamento da sidebar esquerda com persistência
 *
 * Controla a visibilidade da LeftSidebar que exibe atalhos de navegação.
 * O estado é salvo no localStorage para persistir entre sessões.
 *
 * Atalhos de teclado configurados no DashboardLayout:
 * - ' (aspas simples): Toggle sidebar
 * - Ctrl+B: Toggle sidebar
 * - ESC: Fechar sidebar
 *
 * @example
 * const { isOpen, openSidebar, closeSidebar, toggleSidebar } = useLeftSidebar();
 * <button onClick={toggleSidebar}>Menu</button>
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

/**
 * Interface do contexto da sidebar esquerda
 */
interface LeftSidebarContextType {
  /** Indica se a sidebar está aberta */
  isOpen: boolean;
  /** Abre a sidebar */
  openSidebar: () => void;
  /** Fecha a sidebar */
  closeSidebar: () => void;
  /** Alterna entre aberta/fechada */
  toggleSidebar: () => void;
}

const LeftSidebarContext = createContext<LeftSidebarContextType | undefined>(
  undefined
);

const SIDEBAR_STORAGE_KEY = "erp-sidebar-open";

/**
 * Provider do contexto da sidebar esquerda
 *
 * Carrega a preferência do localStorage na inicialização e salva automaticamente
 * sempre que o estado mudar.
 *
 * @param children - Componentes filhos que terão acesso ao contexto
 */
export function LeftSidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(() => {
    // Carregar preferência do localStorage
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return saved !== null ? saved === "true" : true; // Aberta por padrão
  });

  useEffect(() => {
    // Salvar preferência no localStorage
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isOpen));
  }, [isOpen]);

  const openSidebar = () => setIsOpen(true);
  const closeSidebar = () => setIsOpen(false);
  const toggleSidebar = () => setIsOpen(prev => !prev);

  return (
    <LeftSidebarContext.Provider
      value={{ isOpen, openSidebar, closeSidebar, toggleSidebar }}
    >
      {children}
    </LeftSidebarContext.Provider>
  );
}

/**
 * Hook para acessar o contexto da sidebar esquerda
 * @returns Métodos para controlar a sidebar: isOpen, openSidebar, closeSidebar, toggleSidebar
 * @throws Error se usado fora do LeftSidebarProvider
 */
export function useLeftSidebar() {
  const context = useContext(LeftSidebarContext);
  if (context === undefined) {
    throw new Error("useLeftSidebar must be used within a LeftSidebarProvider");
  }
  return context;
}
