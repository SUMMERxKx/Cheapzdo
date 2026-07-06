import { Hammer } from "lucide-react";
import { EmptyState } from "./EmptyState";

// Placeholder for routes that later phases build out. Keeps the shell navigable
// and the build green before features land.
export function ComingSoon({ name, phase }: { name: string; phase?: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <EmptyState
        icon={Hammer}
        title={name}
        description={
          phase
            ? `This lands in ${phase}. The shell and design system are in place.`
            : "Coming in a later phase. The shell and design system are in place."
        }
      />
    </div>
  );
}
