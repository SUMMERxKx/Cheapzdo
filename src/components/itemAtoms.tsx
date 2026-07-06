import { cn } from "@/lib/utils";
import { resolveTypeIcon } from "@/lib/design/icons";
import type { Priority } from "@/lib/supabase/tasks";
import type { WorkItemType } from "@/lib/supabase/workItemTypes";
import type { RosterMember } from "@/lib/supabase/members";

// Small shared atoms for work items, used by both boards and the detail panel.

const PRIORITY_CLASS: Record<Priority, string> = {
  critical: "bg-destructive",
  high: "bg-warning",
  medium: "bg-primary",
  low: "bg-muted-foreground",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function PriorityDot({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span
      title={PRIORITY_LABEL[priority]}
      className={cn("inline-block h-2 w-2 shrink-0 rounded-full", PRIORITY_CLASS[priority], className)}
    />
  );
}

export function TypeChip({ type }: { type: WorkItemType | undefined }) {
  if (!type) return null;
  const Icon = resolveTypeIcon(type.icon);
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: `${type.color}1f`, color: type.color ?? undefined }}
    >
      <Icon className="h-3 w-3" />
      {type.name}
    </span>
  );
}

export function MemberChip({
  member,
  size = 6,
}: {
  member: RosterMember | undefined;
  size?: 5 | 6;
}) {
  if (!member) return null;
  const cls = size === 5 ? "h-5 w-5 text-[9px]" : "h-6 w-6 text-[10px]";
  return member.avatar_url ? (
    <img
      src={member.avatar_url}
      alt={member.display_name}
      title={member.display_name}
      className={cn(cls, "rounded-full border border-border object-cover")}
    />
  ) : (
    <span
      title={member.display_name}
      className={cn(cls, "flex items-center justify-center rounded-full bg-secondary font-semibold")}
    >
      {member.display_name.charAt(0).toUpperCase()}
    </span>
  );
}
