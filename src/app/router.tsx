import { Suspense, lazy, type ComponentType } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthedLayout } from "./AuthedLayout";
import { BoardLayout } from "./BoardLayout";
import { HomeRedirect, RequireGuest } from "./guards";
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
    path: "/",
    element: <AuthedLayout />,
    children: [
      { index: true, element: <HomeRedirect /> },
      { path: "friends", element: lazyEl(() => import("@/features/friends/FriendsPage")) },
      { path: "profile", element: lazyEl(() => import("@/features/profile/ProfilePage")) },
      {
        path: "b/:boardId",
        element: <BoardLayout />,
        children: [
          { index: true, element: <Navigate to="sprint" replace /> },
          { path: "arc", element: lazyEl(() => import("@/features/arc/ArcBoardPage")) },
          { path: "sprint", element: lazyEl(() => import("@/features/sprint/SprintBoardPage")) },
          { path: "daily", element: lazyEl(() => import("@/features/daily/DailyPage")) },
          { path: "leaderboard", element: lazyEl(() => import("@/features/leaderboard/LeaderboardPage")) },
          { path: "dashboard", element: lazyEl(() => import("@/features/dashboard/DashboardPage")) },
          { path: "announcements", element: lazyEl(() => import("@/features/announcements/AnnouncementsPage")) },
          { path: "leetping", element: lazyEl(() => import("@/features/leetping/LeetPingPage")) },
          { path: "settings", element: lazyEl(() => import("@/features/boards/BoardSettingsPage")) },
        ],
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);
