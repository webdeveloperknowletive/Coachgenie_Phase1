"use client";
import { useRef, useEffect } from "react";
import { X, Sparkles, RotateCcw, Maximize2 } from "lucide-react";
import Link from "next/link";
import { useAiStore }           from "@/lib/stores/ai.store";
import { useAcademicStore }     from "@/lib/stores/academic.store";
import { useFinanceStore }      from "@/lib/stores/finance.store";
import { buildInstituteContext } from "@/lib/ai/context";
import { useCoachGenieChat }     from "@/hooks/ai.hooks";
import { ConsentGate }           from "./ConsentGate";
import { MessageBubble }         from "./MessageBubble";
import { SuggestedPrompts }      from "./SuggestedPrompts";
import { ChatInput }             from "./ChatInput";
import { cn }                    from "@/lib/utils";

export function CopilotSidebar() {
  const { isSidebarOpen, closeSidebar } = useAiStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  const academic = useAcademicStore();
  const finance  = useFinanceStore();
  const context  = buildInstituteContext(
    { students: academic.students, batches: academic.batches, attendance: academic.attendance, exams: academic.exams },
    { invoices: finance.invoices }
  );

  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, setMessages, append } = useCoachGenieChat({ context });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isSidebarOpen) return null;

  return (
    <>
      {/* Backdrop (mobile) */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
        onClick={closeSidebar}
      />

      {/* Sidebar panel */}
      <aside className={cn(
        "fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l bg-background shadow-2xl",
        "transition-transform duration-300 ease-out"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4 bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="relative h-8 w-8">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
            </div>
            <div>
              <p className="text-sm font-bold">CoachGenie Copilot</p>
              <p className="text-[10px] text-muted-foreground">AI-powered institute intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/ai/analytics" onClick={closeSidebar}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              title="Open full analytics page">
              <Maximize2 className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={() => setMessages([])}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              title="Clear conversation"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={closeSidebar}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <ConsentGate>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 gap-3 text-center">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Ready to help</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ask anything about your institute
                  </p>
                </div>
              </div>
            )}

            {messages.map((m: any, i: number) => (
              <MessageBubble
                key={m.id}
                role={m.role as "user" | "assistant"}
                content={m.content}
                isLast={i === messages.length - 1}
                isStreaming={isLoading}
              />
            ))}

            {/* Loading skeleton */}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-2.5">
                <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                </div>
                <div className="space-y-1.5 py-2">
                  <div className="h-2.5 w-32 rounded-full bg-muted animate-pulse" />
                  <div className="h-2.5 w-48 rounded-full bg-muted animate-pulse" />
                  <div className="h-2.5 w-24 rounded-full bg-muted animate-pulse" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggested prompts */}
          {messages.length === 0 && (
            <SuggestedPrompts onSelect={(p) => append({ role: "user", content: p })} />
          )}

          <ChatInput
            input={input}
            isLoading={isLoading}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            onStop={stop}
          />
        </ConsentGate>
      </aside>
    </>
  );
}

