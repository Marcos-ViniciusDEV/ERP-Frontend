import { createContext, useContext, useState, ReactNode } from "react";

interface ShortcutDialogContextType {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
}

const ShortcutDialogContext = createContext<
  ShortcutDialogContextType | undefined
>(undefined);

export function ShortcutDialogProvider({ children }: { children: ReactNode }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <ShortcutDialogContext.Provider value={{ isDialogOpen, setIsDialogOpen }}>
      {children}
    </ShortcutDialogContext.Provider>
  );
}

export function useShortcutDialog() {
  const context = useContext(ShortcutDialogContext);
  if (!context) {
    throw new Error(
      "useShortcutDialog must be used within ShortcutDialogProvider"
    );
  }
  return context;
}
