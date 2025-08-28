import { create } from "zustand";
import type { AuthSession as Session } from "@athena-ai/server/types";

interface SessionStore {
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  session: null,
  isAuthenticated: false,
  isLoading: true,
  setSession: (session) => set({ session, isAuthenticated: !!session }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setIsLoading: (isLoading) => set({ isLoading }),
  clearSession: () =>
    set({
      session: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}));
