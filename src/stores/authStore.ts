import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";

// Session state, fed by the auth listener in providers. status is loading until
// the first getSession resolves, so guards can show a skeleton instead of
// flashing the login screen.
export type AuthStatus = "loading" | "authed" | "anon";

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: "loading",
  session: null,
  user: null,
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      status: session ? "authed" : "anon",
    }),
}));
