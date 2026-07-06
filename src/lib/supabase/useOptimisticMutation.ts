import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";

// The one optimistic update recipe every feature reuses.
// It snapshots the affected query, applies an optimistic patch, rolls back on
// error, shows a toast on error only, and always revalidates on settle.
//
// vars flow: onMutate cancels in flight queries for the key, reads the current
// value, writes the optimistic value, and returns the snapshot so onError can
// restore it.
export function useOptimisticMutation<TData, TVars, TSnapshot>(opts: {
  queryKey: QueryKey;
  mutationFn: (vars: TVars) => Promise<TData>;
  // return the next cached value given the previous value and the variables
  optimisticUpdate: (prev: TSnapshot | undefined, vars: TVars) => TSnapshot | undefined;
  errorMessage?: string;
  mutationOptions?: Omit<
    UseMutationOptions<TData, Error, TVars, { prev: TSnapshot | undefined }>,
    "mutationFn" | "onMutate" | "onError" | "onSettled"
  >;
}) {
  const qc = useQueryClient();

  return useMutation<TData, Error, TVars, { prev: TSnapshot | undefined }>({
    ...opts.mutationOptions,
    mutationFn: opts.mutationFn,
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: opts.queryKey });
      const prev = qc.getQueryData<TSnapshot>(opts.queryKey);
      qc.setQueryData<TSnapshot | undefined>(opts.queryKey, (curr) =>
        opts.optimisticUpdate(curr as TSnapshot | undefined, vars)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx) qc.setQueryData(opts.queryKey, ctx.prev);
      toast.error(opts.errorMessage ?? "Something went wrong. Please try again.");
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: opts.queryKey });
    },
  });
}
