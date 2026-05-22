// "use client";
// import { useChat as useAiChat } from "@ai-sdk/react";
// import { FormEvent, useCallback, useMemo, useRef, useState } from "react";
// import { useAiStore } from "@/lib/stores/ai.store";

// interface UseCoachGenieChat {
//   context?: string;
//   apiEndpoint?: string; // ✅ FIX 1 — added apiEndpoint
// }

// type CoachGenieMessage = {
//   id: string;
//   role: "system" | "user" | "assistant";
//   content: string;
// };

// function getMessageText(message: any): string {
//   if (typeof message.content === "string") return message.content;
//   if (typeof message.text === "string") return message.text;
//   if (Array.isArray(message.parts)) {
//     return message.parts
//       .map((part: any) => {
//         if (typeof part?.text === "string") return part.text;
//         if (typeof part?.content === "string") return part.content;
//         return "";
//       })
//       .filter(Boolean)
//       .join("\n");
//   }
//   return "";
// }

// export function useCoachGenieChat({ context, apiEndpoint }: UseCoachGenieChat = {}) {
//   const { setSession, consent } = useAiStore();
//   const abortRef = useRef<AbortController | null>(null);
//   const [input, setInput] = useState("");

//   const chat = (useAiChat as any)({
//     api: apiEndpoint ?? "/copilot/chat", // ✅ FIX 2 — use apiEndpoint
//     body: { context },
//     id: "coachgenie-copilot",
//     initialMessages: [],
//     onError: (err: Error) => {
//       console.error("AI chat error:", err);
//     },
//     onResponse: (res: Response) => {
//       const sessionId = res.headers.get("x-session-id") ?? `session-${Date.now()}`;
//       setSession(sessionId);
//     },
//   });

//   const isLoading = chat.status === "submitted" || chat.status === "streaming";

//   const messages = useMemo<CoachGenieMessage[]>(
//     () =>
//       (chat.messages ?? []).map((message: any) => ({
//         id: message.id,
//         role: message.role,
//         content: getMessageText(message),
//       })),
//     [chat.messages]
//   );

//   // ✅ FIX 3 — clean unified sendMessage
//   const sendMessage = useCallback(
//     async (message: string | { text: string }) => {
//       const text = typeof message === "string" ? message : message.text;
//       if (!text?.trim()) return;
//       await chat.sendMessage({ text });
//     },
//     [chat]
//   );

//   const sendWithContext = useCallback(
//     async (message: string) => {
//       if (!consent) return;
//       await sendMessage(message);
//     },
//     [consent, sendMessage]
//   );

//   const append = useCallback(
//     async (message: { role?: string; content?: string; text?: string }) => {
//       await sendMessage(message.content ?? message.text ?? "");
//     },
//     [sendMessage]
//   );

//   const handleInputChange = useCallback(
//     (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//       setInput(event.target.value);
//     },
//     []
//   );

//   const handleSubmit = useCallback(
//     async (event?: FormEvent) => {
//       event?.preventDefault();
//       const next = input.trim();
//       if (!next || isLoading) return;
//       setInput("");
//       await sendMessage(next);
//     },
//     [input, isLoading, sendMessage]
//   );

//   return {
//     ...chat,
//     messages,
//     input,
//     isLoading,
//     append,
//     handleInputChange,
//     handleSubmit,
//     sendMessage,
//     sendWithContext,
//     setMessages: (next: CoachGenieMessage[]) => chat.setMessages(next as any),
//   };
// }
"use client";

import {
  FormEvent,
  useCallback,
  useRef,
  useState,
} from "react";

import { useAiStore } from "@/lib/stores/ai.store";

interface UseCoachGenieChatProps {
  context?: any;
  apiEndpoint?: string;
}

export type CoachGenieMessage = {
  id: string;

  role: "user" | "assistant";

  content: string;

  type?: "chat" | "report";

  reportUrl?: string;
};

export function useCoachGenieChat({
  context,
  apiEndpoint = "http://127.0.0.1:8001/copilot/chat",
}: UseCoachGenieChatProps = {}) {

  const { consent } = useAiStore();

  const [messages, setMessages] = useState<CoachGenieMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (message: string) => {

      if (!message.trim()) return;

      if (!consent) {
        console.warn("AI consent not granted.");
        return;
      }

      const userMessage: CoachGenieMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: message,
      };

      setMessages((prev) => [...prev, userMessage]);

      setIsLoading(true);

      try {

        abortRef.current = new AbortController();

        const response = await fetch(apiEndpoint, {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            user_id: "demo_user",
            message,
            context,
          }),

          signal: abortRef.current.signal,
        });

        if (!response.ok) {

          const errorText = await response.text();

          console.error("API ERROR RESPONSE:", errorText);

          throw new Error(
            `API Error: ${response.status}`
          );
        }

        const result = await response.json();

        console.log("AI RESPONSE:", result);

        const aiText =
          result?.data?.response ||
          result?.response ||
          result?.message ||
          "No response received.";

        const assistantMessage: CoachGenieMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: aiText,

          type: result?.type || "chat",

          reportUrl:
            result?.report_url ||
            result?.data?.report_url,
        };

        setMessages((prev) => [
          ...prev,
          assistantMessage,
        ]);

      } catch (error: any) {

        console.error("AI Chat Error:", error);

        if (error?.name === "AbortError") {
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "Something went wrong while contacting the AI service.",
          },
        ]);

      } finally {
        setIsLoading(false);
      }
    },
    [apiEndpoint, context, consent]
  );

  const handleInputChange = useCallback(
    (
      event:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>
    ) => {
      setInput(event.target.value);
    },
    []
  );

  const handleSubmit = useCallback(
    async (event?: FormEvent) => {

      event?.preventDefault();

      const value = input.trim();

      if (!value || isLoading) return;

      setInput("");

      await sendMessage(value);

    },
    [input, isLoading, sendMessage]
  );

  const stop = useCallback(() => {

    abortRef.current?.abort();

    setIsLoading(false);

  }, []);

  return {
    messages,
    input,
    isLoading,
    sendMessage,
    handleInputChange,
    handleSubmit,
    stop,
    setMessages,
  };
}