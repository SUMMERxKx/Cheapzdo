import { Navigate, Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/app/AppSidebar";
import { AppTopbar } from "@/components/app/AppTopbar";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { useAuth } from "@/features/auth/useAuth";

// The signed in shell: guards auth, then frames the sidebar, topbar, and routed
// content. RLS is the real gate, this guard is for UX so we never flash content.
export function AuthedLayout() {
  const { status } = useAuth();
  if (status === "loading") return <FullScreenLoader />;
  if (status === "anon") return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        <main className="min-h-0 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
