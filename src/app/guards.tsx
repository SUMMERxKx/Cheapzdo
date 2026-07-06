import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { useMyBoards } from "@/features/boards/useMyBoards";
import { FullScreenLoader } from "@/components/FullScreenLoader";

// Guest only routes. A signed in user is sent to the app.
export function RequireGuest() {
  const { status } = useAuth();
  if (status === "loading") return <FullScreenLoader />;
  if (status === "authed") return <Navigate to="/" replace />;
  return <Outlet />;
}

// Signed in routes without the board chrome, like the onboarding wizard.
export function RequireAuth() {
  const { status } = useAuth();
  if (status === "loading") return <FullScreenLoader />;
  if (status === "anon") return <Navigate to="/login" replace />;
  return <Outlet />;
}

// The index route decides where a signed in user lands: onboarding if they have no
// boards yet, otherwise their first board.
export function HomeRedirect() {
  const boards = useMyBoards();
  if (boards.isLoading) return <FullScreenLoader />;
  const list = boards.data ?? [];
  if (list.length === 0) return <Navigate to="/onboarding" replace />;
  return <Navigate to={`/b/${list[0].id}/sprint`} replace />;
}
