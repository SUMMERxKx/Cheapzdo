import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/supabase/queryKeys";
import * as api from "@/lib/supabase/friends";

export function useFriends() {
  return useQuery({
    queryKey: queryKeys.friends(),
    queryFn: async () => {
      const res = await api.listFriends();
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useFriendRequests() {
  return useQuery({
    queryKey: queryKeys.friendRequests(),
    queryFn: async () => {
      const res = await api.listFriendRequests();
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
    staleTime: 30_000,
  });
}

// Search only runs once there are at least two characters, matching the rpc guard.
export function useUserSearch(q: string) {
  return useQuery({
    queryKey: queryKeys.userSearch(q),
    queryFn: async () => {
      const res = await api.searchUsers(q);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
    enabled: q.trim().length >= 2,
    staleTime: 15_000,
  });
}

// One place to refresh everything a friend action can touch: the friends list,
// the request inbox, and any open search results.
function useFriendAction<TArgs>(fn: (args: TArgs) => Promise<{ ok: boolean; error?: { message: string } }>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: TArgs) => {
      const res = await fn(args);
      if (!res.ok) throw new Error(res.error?.message ?? "Something went wrong");
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.friends() });
      void qc.invalidateQueries({ queryKey: queryKeys.friendRequests() });
      void qc.invalidateQueries({ queryKey: ["users", "search"] });
    },
  });
}

export function useSendFriendRequest() {
  return useFriendAction((addresseeId: string) => api.sendFriendRequest(addresseeId));
}

export function useRespondRequest() {
  return useFriendAction((args: { requestId: string; accept: boolean }) =>
    api.respondFriendRequest(args.requestId, args.accept)
  );
}

export function useRemoveFriend() {
  return useFriendAction((otherId: string) => api.removeFriend(otherId));
}

export function useBlockUser() {
  return useFriendAction((otherId: string) => api.blockUser(otherId));
}
