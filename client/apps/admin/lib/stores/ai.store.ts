"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AiState {
  sessionId:   string | null;
  consent:     boolean;
  subject:     string | null;
  isSidebarOpen: boolean;

  setSession:  (id: string)   => void;
  setConsent:  (v: boolean)   => void;
  setSubject:  (s: string)    => void;
  openSidebar: ()             => void;
  closeSidebar:()             => void;
  toggleSidebar:()            => void;
  reset:       ()             => void;
}

export const useAiStore = create<AiState>()(
  persist(
    (set) => ({
      sessionId:     null,
      consent:       false,
      subject:       null,
      isSidebarOpen: false,

      setSession:   (id) => set({ sessionId: id }),
      setConsent:   (v)  => set({ consent: v }),
      setSubject:   (s)  => set({ subject: s }),
      openSidebar:  ()   => set({ isSidebarOpen: true }),
      closeSidebar: ()   => set({ isSidebarOpen: false }),
      toggleSidebar:()   => set(s => ({ isSidebarOpen: !s.isSidebarOpen })),
      reset:        ()   => set({ sessionId: null, consent: false, subject: null, isSidebarOpen: false }),
    }),
    {
      name:    "coachgenie-ai",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : ({} as Storage)
      ),
      partialize: (s) => ({ consent: s.consent }),
    }
  )
);