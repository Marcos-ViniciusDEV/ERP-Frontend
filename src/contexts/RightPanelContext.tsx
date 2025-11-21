/**
 * @module RightPanelContext
 * @description Gerencia o estado de abertura/fechamento do painel lateral direito
 *
 * Controla a visibilidade do RightSidePanel que exibe informações contextuais,
 * ações rápidas ou detalhes relacionados à tela atual.
 *
 * @example
 * // No componente raiz:
 * <RightPanelProvider>
 *   <App />
 * </RightPanelProvider>
 *
 * // Em qualquer componente filho:
 * const { isOpen, openPanel, closePanel, togglePanel } = useRightPanel();
 * <button onClick={openPanel}>Abrir Painel</button>
 */

import { createContext, useContext, useState, ReactNode } from "react";

/**
 * Interface do contexto do painel direito
 */
interface RightPanelContextType {
  /** Indica se o painel está aberto */
  isOpen: boolean;
  /** Abre o painel */
  openPanel: () => void;
  /** Fecha o painel */
  closePanel: () => void;
  /** Alterna entre aberto/fechado */
  togglePanel: () => void;
}

const RightPanelContext = createContext<RightPanelContextType | undefined>(
  undefined
);

/**
 * Provider do contexto do painel direito
 * @param children - Componentes filhos que terão acesso ao contexto
 */
export function RightPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openPanel = () => setIsOpen(true);
  const closePanel = () => setIsOpen(false);
  const togglePanel = () => setIsOpen(prev => !prev);

  return (
    <RightPanelContext.Provider
      value={{ isOpen, openPanel, closePanel, togglePanel }}
    >
      {children}
    </RightPanelContext.Provider>
  );
}

/**
 * Hook para acessar o contexto do painel direito
 * @returns Métodos para controlar o painel: isOpen, openPanel, closePanel, togglePanel
 * @throws Error se usado fora do RightPanelProvider
 */
export function useRightPanel() {
  const context = useContext(RightPanelContext);
  if (context === undefined) {
    throw new Error("useRightPanel must be used within a RightPanelProvider");
  }
  return context;
}
