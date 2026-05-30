// "use client";

// import {
//   FormEvent,
//   useCallback,
//   useRef,
//   useState,
// } from "react";

// import { useAiStore } from "@/lib/stores/ai.store";
// import { useAuthStore } from "@/lib/stores/auth.store";

// interface UseCoachGenieChatProps {
//   context?: any;
//   apiEndpoint?: string;
// }

// export type CoachGenieMessage = {
//   id: string;

//   role: "user" | "assistant";

//   content: string;

//   type?: "chat" | "report";

//   reportUrl?: string;
// };

// const { accessToken, user } = useAuthStore();

// export function useCoachGenieChat({
//   context,
//   // apiEndpoint = "http://127.0.0.1:8001/copilot/chat",
//   apiEndpoint = "/api/ai/chat",
// }: UseCoachGenieChatProps = {}) {

//   const { consent } = useAiStore();

//   const [messages, setMessages] = useState<CoachGenieMessage[]>([]);
//   const [input, setInput] = useState("");
//   const [isLoading, setIsLoading] = useState(false);

//   const abortRef = useRef<AbortController | null>(null);

//   if (!accessToken || !user?.id) {
//   console.warn("No auth token — cannot send AI request.");
//   return;
// }

//   const sendMessage = useCallback(
//     async (message: string) => {

//       if (!message.trim()) return;

//       if (!consent) {
//         console.warn("AI consent not granted.");
//         return;
//       }

//       const userMessage: CoachGenieMessage = {
//         id: crypto.randomUUID(),
//         role: "user",
//         content: message,
//       };

//       setMessages((prev) => [...prev, userMessage]);

//       setIsLoading(true);

//       try {

//         abortRef.current = new AbortController();

//         const response = await fetch(apiEndpoint, {
//           method: "POST",

//           // headers: {
//           //   "Content-Type": "application/json",
//           // },

//           // body: JSON.stringify({
//           //   user_id: "demo_user",
//           //   message,
//           //   context,
//           // }),

//                     headers: {
//             "Content-Type": "application/json",
//             "Authorization": `Bearer ${accessToken}`,
//           },
//           body: JSON.stringify({
//             user_id: user?.id,
//             message,
//             context,
//           }),

//           signal: abortRef.current.signal,
//         });

//         if (!response.ok) {

//           const errorText = await response.text();

//           console.error("API ERROR RESPONSE:", errorText);

//           throw new Error(
//             `API Error: ${response.status}`
//           );
//         }

//         const result = await response.json();

//         console.log("AI RESPONSE:", result);

//         const aiText =
//           result?.data?.response ||
//           result?.response ||
//           result?.message ||
//           "No response received.";

//         const assistantMessage: CoachGenieMessage = {
//           id: crypto.randomUUID(),
//           role: "assistant",
//           content: aiText,

//           type: result?.type || "chat",

//           reportUrl:
//             result?.report_url ||
//             result?.data?.report_url,
//         };

//         setMessages((prev) => [
//           ...prev,
//           assistantMessage,
//         ]);

//       } catch (error: any) {

//         console.error("AI Chat Error:", error);

//         if (error?.name === "AbortError") {
//           return;
//         }

//         setMessages((prev) => [
//           ...prev,
//           {
//             id: crypto.randomUUID(),
//             role: "assistant",
//             content:
//               "Something went wrong while contacting the AI service.",
//           },
//         ]);

//       } finally {
//         setIsLoading(false);
//       }
//     },
//     [apiEndpoint, context, consent]
//   );

//   const handleInputChange = useCallback(
//     (
//       event:
//         | React.ChangeEvent<HTMLInputElement>
//         | React.ChangeEvent<HTMLTextAreaElement>
//     ) => {
//       setInput(event.target.value);
//     },
//     []
//   );

//   const handleSubmit = useCallback(
//     async (event?: FormEvent) => {

//       event?.preventDefault();

//       const value = input.trim();

//       if (!value || isLoading) return;

//       setInput("");

//       await sendMessage(value);

//     },
//     [input, isLoading, sendMessage]
//   );

//   const stop = useCallback(() => {

//     abortRef.current?.abort();

//     setIsLoading(false);

//   }, []);

//   return {
//     messages,
//     input,
//     isLoading,
//     sendMessage,
//     handleInputChange,
//     handleSubmit,
//     stop,
//     setMessages,
//   };
// }


"use client";

import { FormEvent, useCallback, useRef, useState } from "react";
import { useAiStore } from "@/lib/stores/ai.store";
import { useAuthStore } from "@/lib/stores/auth.store";

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
  apiEndpoint = "/api/ai/chat",
}: UseCoachGenieChatProps = {}) {
  const { consent } = useAiStore();
  const { accessToken, user } = useAuthStore(); // ✅ inside the hook

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

      if (!accessToken || !user?.id) {
        console.warn("No auth token — cannot send AI request.");
        return;
      }

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", content: message },
      ]);
      setIsLoading(true);

      try {
        abortRef.current = new AbortController();

        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ user_id: user.id, message, context }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const result = await response.json();

        const aiText =
          result?.data?.response ||
          result?.response ||
          result?.message ||
          "No response received.";

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: aiText,
            type: result?.type || "chat",
            reportUrl: result?.report_url || result?.data?.report_url,
          },
        ]);
      } catch (error: any) {
        if (error?.name === "AbortError") return;

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Something went wrong while contacting the AI service.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [apiEndpoint, context, consent, accessToken, user]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setInput(e.target.value);
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

  return { messages, input, isLoading, sendMessage, handleInputChange, handleSubmit, stop, setMessages };
}