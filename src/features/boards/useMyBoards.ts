import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/supabase/queryKeys";
import { listMyBoards } from "@/lib/supabase/boards";

// Boards the signed in user belongs to. Used by the home redirect and, later, the
// board switcher.
export function useMyBoards() {
  return useQuery({
    queryKey: queryKeys.boards(),
    queryFn: async () => {
      const res = await listMyBoards();
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
    staleTime: 60_000,
  });
}
