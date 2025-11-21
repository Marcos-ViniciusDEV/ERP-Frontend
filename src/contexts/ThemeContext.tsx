/**
 * ThemeContext - Gerenciamento de Tema (Claro/Escuro)
 *
 * Gerencia o tema visual do sistema com suporte a modo claro e escuro.
 * Permite tema fixo ou alternável conforme configuração.
 *
 * Funcionalidades:
 * - Tema claro/escuro
 * - Persistência em localStorage (se switchable)
 * - Aplicação automática de classe CSS no root
 * - Toggle opcional de tema
 *
 * Uso:
 * ```tsx
 * <ThemeProvider defaultTheme="light" switchable>
 *   <App />
 * </ThemeProvider>
 * ```
 *
 * @module ThemeContext
 */

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Tema padrão ao iniciar (light | dark) */
  defaultTheme?: Theme;
  /** Se true, permite alternar entre temas */
  switchable?: boolean;
}

/**
 * Provider de Tema
 * Envolve a aplicação e gerencia o estado do tema
 */
export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme");
      return (stored as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (switchable) {
      localStorage.setItem("theme", theme);
    }
  }, [theme, switchable]);

  const toggleTheme = switchable
    ? () => {
        setTheme(prev => (prev === "light" ? "dark" : "light"));
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook para acessar o tema atual
 * @returns Tema atual, função toggle (se switchable) e flag switchable
 * @throws Error se usado fora do ThemeProvider
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
