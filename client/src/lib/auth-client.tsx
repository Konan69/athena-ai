import { createAuthClient } from "better-auth/react";
import { env } from "@/config/env";
import type { Session, User } from "better-auth";
import { createContext } from "react";
import { organizationClient } from "better-auth/client/plugins";

export interface AuthContext {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContext>({
  isAuthenticated: false,
  user: null,
  session: null,
  isLoading: true,
});

export const {
  signIn,
  signUp,
  useSession,
  getSession,
  signOut,
  useActiveOrganization,
  useListOrganizations,
  organization,
} = createAuthClient({
  baseURL: `${env.VITE_API_BASE_URL}`,
  fetchOptions: {
    credentials: "include",
  },
  plugins: [organizationClient()],
});
