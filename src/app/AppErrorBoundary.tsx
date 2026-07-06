import React from "react";
import { Button } from "@/components/ui/button";

// Catches render errors anywhere below it and shows a recoverable screen instead
// of a blank page. Feature areas get their own boundaries in later phases.
interface State {
  error: Error | null;
}

export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // A real logger goes here in phase 10. For now keep it visible in dev.
    console.error("App error boundary caught an error", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center p-8">
          <div className="max-w-md space-y-4 text-center">
            <h1 className="font-display text-2xl font-bold">Something broke</h1>
            <p className="text-sm text-muted-foreground">
              {this.state.error.message || "An unexpected error occurred."}
            </p>
            <Button onClick={() => window.location.reload()}>Reload the app</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
