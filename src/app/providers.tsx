import { useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { AppErrorBoundary } from "./AppErrorBoundary";
import { applyTheme, useUiStore } from "@/stores/uiStore";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Applies the persisted theme to the html element and keeps it in sync.
function ThemeSync() {
  const theme = useUiStore((s) => s.theme);
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  return null;
}

// Loads the current session once and keeps the auth store in sync with Supabase.
function AuthListener() {
  const setSession = useAuthStore((s) => s.setSession);
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [setSession]);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const theme = useUiStore((s) => s.theme);
  // Sonner only understands light or dark, so map the darker themes to dark.
  const toastTheme = theme === "dark" || theme === "neon" ? "dark" : "light";
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={200}>
          <ThemeSync />
          <AuthListener />
          {children}
          <Toaster position="bottom-right" theme={toastTheme} richColors closeButton />
        </TooltipProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
