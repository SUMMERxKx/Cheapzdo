import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/uiStore";

// The calm landing for a signed in user who has no boards yet. Replaces the old
// forced onboarding wizard: we welcome them and offer to create a board rather
// than pushing them straight into a form. Rendered inside the app chrome.
export function HomePage() {
  const setCreateBoardOpen = useUiStore((s) => s.setCreateBoardOpen);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary font-display text-2xl font-bold text-primary-foreground shadow-sm">
        A
      </div>
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Welcome to Arcflow
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Arcflow organizes work into arcs, a cycle of equal length sprints for
        your team. When you are ready, create a board to plan your first arc.
        There is no rush, you can start the first sprint whenever suits you.
      </p>
      <Button size="lg" className="mt-8" onClick={() => setCreateBoardOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Create your first board
      </Button>
      <p className="mt-6 text-sm text-muted-foreground">
        Got an invite link from a teammate? Open it to join their board.
      </p>
    </div>
  );
}
