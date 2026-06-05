"use client";
import { Sparkles } from "lucide-react";
import { useAiStore } from "@/lib/stores/ai.store";
import { cn }         from "@/lib/utils";

export function CopilotTrigger() {
  const { isSidebarOpen, toggleSidebar } = useAiStore();

  return (
    <button
      onClick={toggleSidebar}
      className={cn(
        "fixed bottom-6 right-6 z-30 flex h-13 w-13 items-center justify-center rounded-full shadow-lg transition-all duration-200",
        "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95",
        isSidebarOpen && "rotate-180 opacity-0 pointer-events-none"
      )}
      title="Open AI Copilot"
    >
      <Sparkles className="h-5 w-5" />
      <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
    </button>
  );
}