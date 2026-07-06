import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

// One realtime channel per open board. Any change to the board's work lands as
// a query invalidation, so every screen refetches what it is looking at. RLS is
// the row filter, the board_id filter here just cuts noise. Our own writes echo
// back too, which is harmless since invalidation after a mutation is idempotent
// and realtime events never toast.
const TABLES = ["tasks", "epics", "sprints", "arcs", "announcements", "comments", "board_statuses", "work_item_types", "daily_items", "leetping_events"] as const;

export function useBoardRealtime(boardId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!boardId) return;

    const invalidate = (table: string) => {
      switch (table) {
        case "tasks":
          void qc.invalidateQueries({ queryKey: ["board", boardId, "tasks"] });
          void qc.invalidateQueries({ queryKey: ["board", boardId, "epicRollups"] });
          break;
        case "epics":
          void qc.invalidateQueries({ queryKey: ["board", boardId, "epics"] });
          void qc.invalidateQueries({ queryKey: ["board", boardId, "epicRollups"] });
          break;
        case "sprints":
          void qc.invalidateQueries({ queryKey: ["board", boardId, "sprints"] });
          break;
        case "arcs":
          void qc.invalidateQueries({ queryKey: ["board", boardId, "arcs"] });
          break;
        case "announcements":
          void qc.invalidateQueries({ queryKey: ["board", boardId, "announcements"] });
          break;
        case "comments":
          void qc.invalidateQueries({ queryKey: ["board", boardId, "comments"] });
          break;
        case "board_statuses":
          void qc.invalidateQueries({ queryKey: ["board", boardId, "statuses"] });
          break;
        case "work_item_types":
          void qc.invalidateQueries({ queryKey: ["board", boardId, "types"] });
          break;
        case "daily_items":
          void qc.invalidateQueries({ queryKey: ["board", boardId, "daily"] });
          break;
        case "leetping_events":
          void qc.invalidateQueries({ queryKey: ["board", boardId, "leetping"] });
          break;
      }
    };

    let channel = supabase.channel(`board:${boardId}`);
    for (const table of TABLES) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `board_id=eq.${boardId}` },
        () => invalidate(table)
      );
    }
    channel.subscribe();

    // Refetch everything after a reconnect so nothing missed offline goes stale.
    const onOnline = () => void qc.invalidateQueries({ queryKey: ["board", boardId] });
    window.addEventListener("online", onOnline);

    return () => {
      window.removeEventListener("online", onOnline);
      void supabase.removeChannel(channel);
    };
  }, [boardId, qc]);
}
