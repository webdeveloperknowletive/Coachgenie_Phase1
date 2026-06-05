import { create } from "zustand";

interface AiState {
  sessionId: string | null;
  consent:   boolean;
  subject:   string | null;
  setSession: (id: string)     => void;
  setConsent: (v: boolean)     => void;
  setSubject: (s: string)      => void;
  reset:      ()               => void;
}

export const useAiStore = create<AiState>((set) => ({
  sessionId: null,
  consent:   false,
  subject:   null,
  setSession: (id)  => set({ sessionId: id }),
  setConsent: (v)   => set({ consent: v }),
  setSubject: (s)   => set({ subject: s }),
  reset:      ()    => set({ sessionId: null, consent: false, subject: null }),
}));