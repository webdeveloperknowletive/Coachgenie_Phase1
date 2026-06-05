"use client";
import { Lightbulb } from "lucide-react";

const PROMPTS = [
  "Show me today's key alerts",
  "Which fees are overdue?",
  "How is attendance this month?",
  "Summarize exam performance",
  "Which leads need follow-up?",
  "Which students are at risk?",
];

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <div className="p-4 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Lightbulb className="h-3 w-3" /> Suggested questions
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => onSelect(p)}
            className="rounded-full border bg-background px-3 py-1.5 text-xs font-medium hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}