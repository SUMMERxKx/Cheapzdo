import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/supabase/queryKeys";
import { getBoard } from "@/lib/supabase/boards";
import { getRoster } from "@/lib/supabase/members";
import { listTeams } from "@/lib/supabase/teams";
import { listPendingInvitations } from "@/lib/supabase/invitations";
import { listStatuses } from "@/lib/supabase/statuses";
import { listTypes } from "@/lib/supabase/workItemTypes";

// Query hooks for the board's reference data. Each unwraps the Result so React
// Query owns error state.
export function useBoard(boardId: string) {
  return useQuery({
    queryKey: queryKeys.board(boardId),
    enabled: !!boardId,
    queryFn: async () => {
      const res = await getBoard(boardId);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
  });
}

export function useRoster(boardId: string) {
  return useQuery({
    queryKey: queryKeys.members(boardId),
    enabled: !!boardId,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await getRoster(boardId);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
  });
}

export function useTeams(boardId: string) {
  return useQuery({
    queryKey: queryKeys.teams(boardId),
    enabled: !!boardId,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await listTeams(boardId);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
  });
}

export function usePendingInvitations(boardId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["board", boardId, "invitations"],
    enabled: !!boardId && enabled,
    queryFn: async () => {
      const res = await listPendingInvitations(boardId);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
  });
}

export function useStatuses(boardId: string) {
  return useQuery({
    queryKey: queryKeys.statuses(boardId),
    enabled: !!boardId,
    staleTime: 300_000,
    queryFn: async () => {
      const res = await listStatuses(boardId);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
  });
}

export function useTypes(boardId: string) {
  return useQuery({
    queryKey: queryKeys.types(boardId),
    enabled: !!boardId,
    staleTime: 300_000,
    queryFn: async () => {
      const res = await listTypes(boardId);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
  });
}
