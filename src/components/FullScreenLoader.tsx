export function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-b-transparent"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
