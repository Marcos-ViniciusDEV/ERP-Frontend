/**
 * Hook de Atalhos de Teclado Globais
 *
 * Detecta e processa atalhos de teclado configurados pelo usuário.
 * Navega automaticamente para a rota associada quando um atalho é pressionado.
 *
 * @param disabled - Se true, desabilita a detecção de atalhos (útil quando dialogs estão abertos)
 *
 * Funcionalidades:
 * - Suporta qualquer combinação de teclas modificadoras (Ctrl, Shift, Alt, Meta)
 * - Ignora atalhos quando foco está em campos de input/textarea
 * - Pode ser desabilitado temporariamente via parâmetro
 *
 * Exemplos de atalhos suportados:
 * - Teclas simples: F1, F2, A, B
 * - Com modificadores: Ctrl+A, Shift+B, Alt+Q
 * - Combinações: Ctrl+Shift+A, Ctrl+Alt+Delete
 */
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useShortcuts } from "@/contexts/ShortcutsContext";

export function useKeyboardShortcuts(disabled = false) {
  const [, setLocation] = useLocation();
  const { shortcuts } = useShortcuts();

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignorar se estiver em um input, textarea ou select
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      // Construir a combinação de teclas pressionada
      const parts: string[] = [];
      if (event.ctrlKey) parts.push("Ctrl");
      if (event.shiftKey) parts.push("Shift");
      if (event.altKey) parts.push("Alt");
      if (event.metaKey) parts.push("Meta");

      if (!["Control", "Shift", "Alt", "Meta"].includes(event.key)) {
        const key =
          event.key.length === 1 ? event.key.toUpperCase() : event.key;
        parts.push(key);
      }

      const pressedShortcut = parts.join("+");

      // Procurar atalho correspondente
      const matchedShortcut = shortcuts.find(
        s => s.shortcut === pressedShortcut
      );

      if (matchedShortcut) {
        event.preventDefault();
        setLocation(matchedShortcut.path);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setLocation, shortcuts, disabled]);
}
