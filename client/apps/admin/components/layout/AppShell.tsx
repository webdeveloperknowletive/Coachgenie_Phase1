"use client";
import { useState }        from "react";
import { Sidebar }         from "./Sidebar";
import { Topbar }          from "./Topbar";
import { MobileSidebar }   from "./MobileSidebar";
import { CopilotSidebar }  from "@/components/ai/CopilotSidebar";
import { CopilotTrigger }  from "@/components/ai/CopilotTrigger";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar collapsed={collapsed} onCollapse={() => setCollapsed(v => !v)} />
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <div className="flex items-center gap-2 border-b bg-card/80 backdrop-blur-sm px-4 h-[3.75rem] shrink-0">
          <div className="lg:hidden">
            <MobileSidebar />
          </div>
          <div className="flex-1">
            <Topbar sidebarCollapsed={collapsed} />
          </div>
        </div>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* AI Copilot — global */}
      <CopilotSidebar />
      <CopilotTrigger />
    </div>
  );
}