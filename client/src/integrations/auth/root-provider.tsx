import { useSession } from "@/lib/auth-client";
import { useSessionStore } from "@/store/session.store";
import { useUserStore } from "@/store/user.store";
import { useEffect } from "react";

export function useAuth() {
  const { data, isPending } = useSession();
  const { setUser } = useUserStore();
  const { setSession, setIsAuthenticated, setIsLoading } = useSessionStore();
  const isAuthenticated = data !== null;

  // Sync auth state with Zustand store
  useEffect(() => {
    setSession(data?.session ?? null);
    setUser(data?.user ?? null);
    setIsAuthenticated(isAuthenticated);
    setIsLoading(isPending);
  }, [
    data,
    isPending,
    isAuthenticated,
    setSession,
    setUser,
    setIsAuthenticated,
    setIsLoading,
  ]);
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
