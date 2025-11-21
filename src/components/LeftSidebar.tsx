import { useState } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Package,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useShortcuts } from "@/contexts/ShortcutsContext";
import { toast } from "sonner";

interface LeftSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface ContextMenu {
  x: number;
  y: number;
  itemId: string;
}

export function LeftSidebar({ isOpen, onToggle }: LeftSidebarProps) {
  const [location, setLocation] = useLocation();
  const { shortcuts, removeShortcut } = useShortcuts();
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);

  const handleContextMenu = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      itemId,
    });
  };

  const handleRemoveShortcut = (itemId: string) => {
    const item = shortcuts.find((s) => s.id === itemId);
    removeShortcut(itemId);
    toast.success(`Atalho "${item?.label}" removido!`);
    setContextMenu(null);
  };

  // Fechar menu de contexto ao clicar fora
  const handleClickOutside = () => {
    if (contextMenu) {
      setContextMenu(null);
    }
  };

  return (
    <>
      <div
        className={cn(
          "bg-white border-r border-slate-200 flex flex-col transition-all duration-300 relative",
          isOpen ? "w-72" : "w-0 overflow-hidden"
        )}
        onClick={handleClickOutside}
      >
        {/* Cabeçalho */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center text-slate-600 font-semibold">
            App
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-slate-800 truncate">ERP RPInfo</h2>
          </div>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
            title="Recolher menu"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Botão Toggle quando fechado */}
        {!isOpen && (
          <button
            onClick={onToggle}
            className="absolute -right-3 top-4 z-50 bg-blue-600 text-white rounded-full p-1.5 shadow-lg hover:bg-blue-700 transition-colors"
            title="Expandir menu"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Área de Conteúdo */}
        <div className="flex-1 overflow-y-auto py-2">
          {/* Lista de Itens */}
          <nav>
            {shortcuts.map((item) => (
              <button
                key={item.id}
                onClick={() => setLocation(item.path)}
                onContextMenu={(e) => handleContextMenu(e, item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors relative group",
                  location === item.path
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                {item.icon || <Package className="w-5 h-5" />}
                <span className="flex-1 text-left font-medium">{item.label}</span>
                {item.shortcut && (
                  <span className="text-xs text-slate-400 font-normal">
                    {item.shortcut}
                  </span>
                )}
                {item.isCustom && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            ))}
          </nav>

          {/* Dica de uso */}
          {shortcuts.length < 9 && (
            <div className="px-4 py-3 text-xs text-slate-400 text-center">
              Clique com botão direito em itens do menu superior para criar atalhos
            </div>
          )}
        </div>

        {/* Rodapé com informações do usuário */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-white font-semibold">
              M
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                Marcos Marcos Vinicius
              </p>
              <p className="text-xs text-slate-500 truncate">
                marcosmarcosvinicius@gmail...
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu de Contexto */}
      {contextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 min-w-[160px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleRemoveShortcut(contextMenu.itemId)}
            className="w-full px-4 py-2 text-sm text-left hover:bg-slate-50 flex items-center gap-2 text-red-600"
          >
            <X className="w-4 h-4" />
            Remover atalho
          </button>
        </div>
      )}
    </>
  );
}
