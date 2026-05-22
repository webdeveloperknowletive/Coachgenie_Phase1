// "use client";
// import { Sparkles, User } from "lucide-react";
// import { cn }              from "@/lib/utils";
// import { MarkdownRenderer } from "./MarkdownRenderer";

// interface MessageBubbleProps {
//   role:    "user" | "assistant";
//   content: string;
//   isLast?: boolean;
//   isStreaming?: boolean;
// }

// export function MessageBubble({ role, content, isLast, isStreaming }: MessageBubbleProps) {
//   const isUser = role === "user";

//   return (
//     <div className={cn("flex gap-2.5 group", isUser && "flex-row-reverse")}>
//       {/* Avatar */}
//       <div className={cn(
//         "shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5",
//         isUser
//           ? "bg-primary text-primary-foreground"
//           : "bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20"
//       )}>
//         {isUser
//           ? <User className="h-3.5 w-3.5" />
//           : <Sparkles className="h-3.5 w-3.5 text-primary" />
//         }
//       </div>

//       {/* Bubble */}
//       <div className={cn(
//         "max-w-[85%] rounded-2xl px-4 py-2.5",
//         isUser
//           ? "bg-primary text-primary-foreground rounded-tr-sm"
//           : "bg-card border rounded-tl-sm shadow-sm"
//       )}>
//         {isUser ? (
//           <p className="text-sm leading-relaxed">{content}</p>
//         ) : (
//           <MarkdownRenderer content={content} />
//         )}

//         {/* Streaming cursor */}
//         {isStreaming && isLast && !isUser && (
//           <span className="inline-block h-4 w-0.5 bg-primary ml-0.5 animate-pulse rounded-full" />
//         )}
//       </div>
//     </div>
//   );
// }

"use client";
import { Sparkles, User } from "lucide-react";
import { cn }              from "@/lib/utils";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;

  type?: "chat" | "report";

  reportUrl?: string;

  isLast?: boolean;
  isStreaming?: boolean;
}

export function MessageBubble({
  role,
  content,
  type,
  reportUrl,
  isLast,
  isStreaming,
}: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-2.5 group", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div className={cn(
        "shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5",
        isUser
          ? "bg-primary text-primary-foreground"
          : "bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20"
      )}>
        {isUser
          ? <User className="h-3.5 w-3.5" />
          : <Sparkles className="h-3.5 w-3.5 text-primary" />
        }
      </div>

      {/* Bubble */}
      <div className={cn(
        "max-w-[85%] rounded-2xl px-4 py-2.5",
        isUser
          ? "bg-primary text-primary-foreground rounded-tr-sm"
          : "bg-card border rounded-tl-sm shadow-sm"
      )}>
        {isUser ? (
          <p className="text-sm leading-relaxed">{content}</p>
        ) : (
          <MarkdownRenderer content={content} />
        )}

        {type === "report" && reportUrl && (
          <a
            href={reportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center rounded-lg bg-primary px-3 py-2 text-sm text-white hover:opacity-90"
          >
            Download Report PDF
          </a>
        )}

        {/* Streaming cursor */}
        {isStreaming && isLast && !isUser && (
          <span className="inline-block h-4 w-0.5 bg-primary ml-0.5 animate-pulse rounded-full" />
        )}
      </div>
    </div>
  );
}