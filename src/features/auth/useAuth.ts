import { useAuthStore } from "@/stores/authStore";

// Read the current session. status is loading until the first getSession settles.
export function useAuth() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  return {
    status,
    user,
    session,
    isAuthed: status === "authed",
    isLoading: status === "loading",
  };
}
