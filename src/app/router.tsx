import { Suspense, lazy, type ComponentType } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthedLayout } from "./AuthedLayout";
import { BoardLayout } from "./BoardLayout";
import { HomeRedirect, RequireAuth, RequireGuest } from "./guards";
import { ComingSoon } from "@/components/ComingSoon";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import NotFound from "@/pages/NotFound";

// Lazy load page components so each route is its own chunk and the initial
// bundle stays small.
function lazyEl(factory: () => Promise<{ default: ComponentType }>) {
  const C = lazy(factory);
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <C />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    element: <RequireGuest />,
    children: [
      { path: "/login", element: lazyEl(() => import("@/features/auth/LoginPage")) },
      { path: "/signup", element: lazyEl(() => import("@/features/auth/SignupPage")) },
      { path: "/verify", element: lazyEl(() => import("@/features/auth/VerifyEmailPage")) },
      { path: "/reset", element: lazyEl(() => import("@/features/auth/ResetRequestPage")) },
    ],
  },
  { path: "/update-password", element: lazyEl(() => import("@/features/auth/UpdatePasswordPage")) },
  { path: "/accept-invite", element: lazyEl(() => import("@/features/auth/AcceptInvitePage")) },
  {
    element: <RequireAuth />,
    children: [
      { path: "/onboarding", element: lazyEl(() => import("@/features/onboarding/OnboardingWizard")) },
    ],
  },
  {
    path: "/",
    element: <AuthedLayout />,
    children: [
      { index: true, element: <HomeRedirect /> },
      { path: "profile", element: lazyEl(() => import("@/features/profile/ProfilePage")) },
      {
        path: "b/:boardId",
        element: <BoardLayout />,
        children: [
          { index: true, element: <Navigate to="sprint" replace /> },
          { path: "arc", element: lazyEl(() => import("@/features/arc/ArcBoardPage")) },
          { path: "sprint", element: lazyEl(() => import("@/features/sprint/SprintBoardPage")) },
          { path: "daily", element: lazyEl(() => import("@/features/daily/DailyPage")) },
          { path: "leaderboard", element: <ComingSoon name="Leaderboard" phase="phase 7" /> },
          { path: "dashboard", element: <ComingSoon name="Dashboard" phase="phase 7" /> },
          { path: "announcements", element: <ComingSoon name="Announcements" phase="phase 8" /> },
          { path: "leetping", element: <ComingSoon name="LeetPing" phase="phase 9" /> },
          { path: "settings", element: lazyEl(() => import("@/features/boards/BoardSettingsPage")) },
        ],
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);
