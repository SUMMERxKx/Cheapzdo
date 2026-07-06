import { useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { AppErrorBoundary } from "./AppErrorBoundary";
import { applyTheme, useUiStore } from "@/stores/uiStore";

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

export function Providers({ children }: { children: ReactNode }) {
  const theme = useUiStore((s) => s.theme);
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={200}>
          <ThemeSync />
          {children}
          <Toaster position="bottom-right" theme={theme} richColors closeButton />
        </TooltipProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
