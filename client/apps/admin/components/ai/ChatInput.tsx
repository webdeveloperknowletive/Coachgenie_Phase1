"use client";
import { useRef, type FormEvent, type KeyboardEvent, type SyntheticEvent } from "react";
import { Send, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  input:       string;
  isLoading:   boolean;
  onInputChange:(e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit:    (e: SyntheticEvent<HTMLFormElement>) => void;
  onStop?:     () => void;
  placeholder?: string;
}

export function ChatInput({
  input, isLoading, onInputChange, onSubmit, onStop,
  placeholder = "Ask about your institute…",
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSubmit(e as unknown as FormEvent<HTMLFormElement>);
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="p-3 border-t bg-card/50 backdrop-blur-sm">
      <div className="flex items-end gap-2 rounded-xl border bg-background px-3 py-2 focus-within:ring-1 focus-within:ring-ring transition-shadow">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={isLoading}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground resize-none max-h-32 leading-relaxed disabled:opacity-60"
          style={{ height: "auto" }}
          onInput={(e) => {
            const t = e.currentTarget;
            t.style.height = "auto";
            t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
          }}
        />
        {isLoading ? (
          <button
            type="button"
            onClick={onStop}
            className="shrink-0 h-8 w-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </button>
        ) : (
          <button
            type="submit"
            // disabled={!input.trim()}
            disabled={!String(input || "").trim()}
            className="shrink-0 h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground text-center mt-1.5">
        Enter to send · Shift+Enter for new line
      </p>
    </form>
  );
}