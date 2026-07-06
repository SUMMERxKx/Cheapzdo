import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/supabase/queryKeys";
import { listArcs } from "@/lib/supabase/arcs";
import { listSprints } from "@/lib/supabase/sprints";
import { listAllEpics, getEpicRollups, listEpics } from "@/lib/supabase/epics";
import { listTasks } from "@/lib/supabase/tasks";
import { listComments } from "@/lib/supabase/comments";

// Query hooks for arcs, sprints, epics, tasks, and comments.
export function useArcs(boardId: string) {
  return useQuery({
    queryKey: queryKeys.arcs(boardId),
    enabled: !!boardId,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await listArcs(boardId);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
  });
}

export function useSprints(boardId: string) {
  return useQuery({
    queryKey: queryKeys.sprints(boardId),
    enabled: !!boardId,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await listSprints(boardId);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
  });
}

// arcId: an arc id, or null for the backlog bucket.
export function useEpics(boardId: string, arcId: string | null) {
  return useQuery({
    queryKey: queryKeys.epics(boardId, arcId),
    enabled: !!boardId,
    queryFn: async () => {
      const res = await listEpics(boardId, arcId);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
  });
}

export function useAllEpics(boardId: string) {
  return useQuery({
    queryKey: ["board", boardId, "epics", "all"],
    enabled: !!boardId,
    staleTime: 30_000,
    queryFn: async () => {
      const res = await listAllEpics(boardId);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
  });
}

export function useEpicRollups(boardId: string) {
  return useQuery({
    queryKey: ["board", boardId, "epicRollups"],
    enabled: !!boardId,
    staleTime: 15_000,
    queryFn: async () => {
      const res = await getEpicRollups(boardId);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
  });
}

// sprintId: a sprint id, or null for the board backlog.
export function useTasks(boardId: string, sprintId: string | null) {
  return useQuery({
    queryKey: queryKeys.tasks(boardId, { sprintId }),
    enabled: !!boardId,
    queryFn: async () => {
      const res = await listTasks(boardId, sprintId);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
  });
}

export function useComments(boardId: string, parent: { taskId?: string; epicId?: string }) {
  return useQuery({
    queryKey: queryKeys.comments(boardId, parent),
    enabled: !!boardId && (!!parent.taskId || !!parent.epicId),
    queryFn: async () => {
      const res = await listComments({ boardId, ...parent });
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
  });
}
