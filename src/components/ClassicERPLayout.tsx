import { TopMenuBar } from "./TopMenuBar";
import { LeftSidebar } from "./LeftSidebar";
import { RightSidePanel } from "./RightSidePanel";
import { RightPanelProvider, useRightPanel } from "@/contexts/RightPanelContext";
import { LeftSidebarProvider, useLeftSidebar } from "@/contexts/SidebarContext";
import { ShortcutsProvider } from "@/contexts/ShortcutsContext";

interface ClassicERPLayoutProps {
  children: React.ReactNode;
}

function ClassicERPLayoutInner({ children }: ClassicERPLayoutProps) {
  const { isOpen: isSidebarOpen, toggleSidebar } = useLeftSidebar();
  const { isOpen: isRightPanelOpen, closePanel } = useRightPanel();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <TopMenuBar />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
      <RightSidePanel isOpen={isRightPanelOpen} onClose={closePanel} />
    </div>
  );
}

export function ClassicERPLayout({ children }: ClassicERPLayoutProps) {
  return (
    <ShortcutsProvider>
      <LeftSidebarProvider>
        <RightPanelProvider>
          <ClassicERPLayoutInner>{children}</ClassicERPLayoutInner>
        </RightPanelProvider>
      </LeftSidebarProvider>
    </ShortcutsProvider>
  );
}
