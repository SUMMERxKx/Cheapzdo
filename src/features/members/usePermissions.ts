import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { getMyRole } from "@/lib/supabase/members";
import { permissionsForRole, type Permissions } from "@/lib/permissions";

// The caller's capabilities on the current board, backed by their real
// membership row. RLS enforces the rules, this only decides what the UI shows.
export function usePermissions(boardIdArg?: string): Permissions & { isLoading: boolean } {
  const params = useParams();
  const boardId = boardIdArg ?? params.boardId;

  const q = useQuery({
    queryKey: ["board", boardId, "myRole"],
    enabled: !!boardId,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await getMyRole(boardId as string);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
  });

  return { ...permissionsForRole(q.data ?? null), isLoading: q.isLoading };
}
