// apps/admin/src/store/authStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  role: "owner" | "counselor" | "tutor" | "student" | "parent";
  first_name: string;
  last_name: string;
}

interface AuthState {
  accessToken:  string | null;
  refreshToken: string | null;
  user:         User   | null;
  setTokens:    (access: string, refresh: string) => void;
  setUser:      (user: User) => void;
  clearAuth:    () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken:  null,
      refreshToken: null,
      user:         null,
      setTokens: (access, refresh) =>
        set({ accessToken: access, refreshToken: refresh }),
      setUser:   (user)  => set({ user }),
      clearAuth: ()      => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name:    "auth",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);