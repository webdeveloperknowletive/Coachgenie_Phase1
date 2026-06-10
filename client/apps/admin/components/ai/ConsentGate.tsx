"use client";
import { Shield, Sparkles } from "lucide-react";
import { useAiStore } from "@/lib/stores/ai.store";

export function ConsentGate({ children }: { children: React.ReactNode }) {
  const { consent, setConsent } = useAiStore();

  if (consent) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-5">
      <div className="relative">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center">
          <Shield className="h-3 w-3 text-white" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-bold text-lg">CoachGenie Copilot</h3>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
          To provide personalized insights, the AI copilot will access your institute's student,
          batch, fee, and exam data during this session.
        </p>
      </div>

      <div className="rounded-xl border bg-muted/30 p-4 text-left w-full max-w-xs space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">What it accesses</p>
        {[
          "Student names and performance data",
          "Batch and attendance records",
          "Fee collection summaries",
          "Exam results and rankings",
        ].map((item) => (
          <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            {item}
          </div>
        ))}
      </div>

      <div className="space-y-2 w-full max-w-xs">
        <button
          onClick={() => setConsent(true)}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          Enable AI Copilot
        </button>
        <p className="text-[10px] text-muted-foreground">
          Data is used only for generating responses and is not stored by the AI provider beyond the session.
        </p>
      </div>
    </div>
  );
}
