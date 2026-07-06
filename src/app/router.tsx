import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthedLayout } from "./AuthedLayout";
import { BoardLayout } from "./BoardLayout";
import { ComingSoon } from "@/components/ComingSoon";
import NotFound from "@/pages/NotFound";

// Route shells for every screen. Later phases swap ComingSoon for the real
// feature pages, most of them lazy loaded.
export const router = createBrowserRouter([
  { path: "/login", element: <ComingSoon name="Sign in" phase="phase 3" /> },
  { path: "/signup", element: <ComingSoon name="Create account" phase="phase 3" /> },
  { path: "/verify", element: <ComingSoon name="Verify your email" phase="phase 3" /> },
  { path: "/reset", element: <ComingSoon name="Reset password" phase="phase 3" /> },
  {
    path: "/",
    element: <AuthedLayout />,
    children: [
      { index: true, element: <ComingSoon name="Your boards" phase="phase 4" /> },
      { path: "onboarding", element: <ComingSoon name="Create a board" phase="phase 3" /> },
      {
        path: "b/:boardId",
        element: <BoardLayout />,
        children: [
          { index: true, element: <Navigate to="sprint" replace /> },
          { path: "arc", element: <ComingSoon name="Arc Board" phase="phase 5" /> },
          { path: "sprint", element: <ComingSoon name="Sprint Board" phase="phase 5" /> },
          { path: "daily", element: <ComingSoon name="Daily" phase="phase 6" /> },
          { path: "leaderboard", element: <ComingSoon name="Leaderboard" phase="phase 7" /> },
          { path: "dashboard", element: <ComingSoon name="Dashboard" phase="phase 7" /> },
          { path: "announcements", element: <ComingSoon name="Announcements" phase="phase 8" /> },
          { path: "leetping", element: <ComingSoon name="LeetPing" phase="phase 9" /> },
          { path: "settings", element: <ComingSoon name="Board settings" phase="phase 4" /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);
