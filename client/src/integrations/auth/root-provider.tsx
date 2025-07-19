import { useSession } from "@/lib/auth-client";
import { useSessionStore } from "@/store/session.store";
import { useEffect } from "react";

export function useAuth() {
  const { data, isPending } = useSession();
  const { setSession, setIsAuthenticated, setIsLoading } = useSessionStore();
  const isAuthenticated = data !== null;

  // Sync auth state with Zustand store
  useEffect(() => {
    setSession(data?.session ?? null);
    setIsAuthenticated(isAuthenticated);
    setIsLoading(isPending);
  }, [
    data,
    isPending,
    isAuthenticated,
    setSession,
    setIsAuthenticated,
    setIsLoading,
  ]);

  console.log("isAuthenticated", isAuthenticated);

  return {
    isAuthenticated,
    user: data?.user ?? null,
    session: data?.session ?? null,
    isLoading: isPending,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useAuth(); // Just sync to Zustand, no context needed

  return <>{children}</>;
}
