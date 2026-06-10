"use client";
import { useState, useRef, useEffect } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useAcademicStore } from "@/lib/stores/academic.store";
import { useFinanceStore }  from "@/lib/stores/finance.store";
import { buildInstituteContext } from "@/lib/ai/context";
import { useCoachGenieChat }     from "@/hooks/ai.hooks";
import { ConsentGate }           from "./ConsentGate";
import { MessageBubble }         from "./MessageBubble";
import { SuggestedPrompts }      from "./SuggestedPrompts";
import { ChatInput }             from "./ChatInput";

export function AnalyticsChatBubble() {
  const [open, setOpen] = useState(false);
  const bottomRef       = useRef<HTMLDivElement>(null);

  const academic = useAcademicStore();
  const finance  = useFinanceStore();
  const context  = buildInstituteContext(
    { students: academic.students, batches: academic.batches, attendance: academic.attendance, exams: academic.exams },
    { invoices: finance.invoices }
  );

  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, append } = useCoachGenieChat({ context });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden fade-in">
      {/* Header � always visible */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">AI Copilot</p>
            <p className="text-xs text-muted-foreground">Ask anything about your institute</p>
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t">
          <ConsentGate>
            <div className="flex flex-col" style={{ height: "400px" }}>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                    <Sparkles className="h-8 w-8 text-primary/40" />
                    <p className="text-sm text-muted-foreground">What would you like to know?</p>
                  </div>
                ) : (
                  messages.map((m: any, i: number) => (
                    <MessageBubble
                      key={m.id}
                      role={m.role as "user" | "assistant"}
                      content={m.content}
                      isLast={i === messages.length - 1}
                      isStreaming={isLoading}
                    />
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Suggested prompts (only when no messages) */}
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
            </div>
          </ConsentGate>
        </div>
      )}
    </div>
  );
}

