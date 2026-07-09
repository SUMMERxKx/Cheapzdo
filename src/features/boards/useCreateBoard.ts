import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBoard } from "@/lib/supabase/boards";
import { queryKeys } from "@/lib/supabase/queryKeys";
import type { CreateBoardInput } from "@/lib/supabase/schemas/board";

// Creates a board through the atomic RPC and refreshes the board list so the
// sidebar and home screen pick it up. Used by the create board dialog.
export function useCreateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateBoardInput) => {
      const res = await createBoard(input);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.boards() });
    },
  });
}
