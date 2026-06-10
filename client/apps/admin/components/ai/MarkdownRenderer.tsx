"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm    from "remark-gfm";
import { cn }       from "@/lib/utils";

interface MarkdownRendererProps {
  content:   string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p:    ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          ul:   ({ children }) => <ul className="mb-2 ml-4 space-y-1 list-disc">{children}</ul>,
          ol:   ({ children }) => <ol className="mb-2 ml-4 space-y-1 list-decimal">{children}</ol>,
          li:   ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
          strong:({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          em:   ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
          h2:   ({ children }) => <h2 className="text-sm font-bold mt-3 mb-1.5 text-foreground">{children}</h2>,
          h3:   ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-foreground">{children}</h3>,
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");
            return isBlock ? (
              <pre className="my-2 rounded-lg bg-muted p-3 overflow-x-auto">
                <code className="text-xs font-mono">{children}</code>
              </pre>
            ) : (
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{children}</code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/40 pl-3 my-2 text-muted-foreground italic text-sm">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-border" />,
          a:  ({ href, children }) => (
            <a href={href} className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

