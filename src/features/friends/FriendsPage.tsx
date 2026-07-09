import { useEffect, useState } from "react";
import {
  Ban,
  Check,
  Clock,
  Loader2,
  MoreHorizontal,
  Search,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/EmptyState";
import {
  useBlockUser,
  useFriendRequests,
  useFriends,
  useRemoveFriend,
  useRespondRequest,
  useSendFriendRequest,
  useUserSearch,
} from "./useFriends";

function UserAvatar({ name, url }: { name: string; url?: string | null }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : initials}
    </div>
  );
}

function Row({
  name,
  handle,
  avatar,
  children,
}: {
  name: string;
  handle: string;
  avatar?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
      <UserAvatar name={name} url={avatar} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{name}</div>
        <div className="truncate font-mono text-xs text-muted-foreground">@{handle}</div>
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

export default function FriendsPage() {
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");

  // Debounce the search so we are not firing a request on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setQ(input.trim()), 300);
    return () => clearTimeout(id);
  }, [input]);

  const search = useUserSearch(q);
  const friends = useFriends();
  const requests = useFriendRequests();

  const sendReq = useSendFriendRequest();
  const respond = useRespondRequest();
  const remove = useRemoveFriend();
  const block = useBlockUser();

  const onError = (e: unknown) =>
    toast.error(e instanceof Error ? e.message : "Something went wrong");

  const incoming = (requests.data ?? []).filter((r) => r.direction === "incoming");
  const outgoing = (requests.data ?? []).filter((r) => r.direction === "outgoing");

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Friends</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find people by handle or name, then invite them straight into a board.
        </p>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search by handle or name"
          className="pl-9"
        />
      </div>

      {q.length >= 2 && (
        <div className="mt-3 space-y-2">
          {search.isLoading ? (
            <div className="flex items-center gap-2 px-1 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </div>
          ) : (search.data ?? []).length === 0 ? (
            <p className="px-1 py-3 text-sm text-muted-foreground">
              No one found for "{q}".
            </p>
          ) : (
            (search.data ?? []).map((u) => (
              <Row key={u.id} name={u.display_name} handle={u.handle} avatar={u.avatar_url}>
                {u.relationship === "friends" ? (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Check className="h-3.5 w-3.5" /> Friends
                  </span>
                ) : u.relationship === "pending_out" ? (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> Requested
                  </span>
                ) : (
                  <Button
                    size="sm"
                    disabled={sendReq.isPending}
                    onClick={() =>
                      sendReq.mutate(u.id, {
                        onSuccess: () =>
                          toast.success(
                            u.relationship === "pending_in"
                              ? `You are now friends with ${u.display_name}`
                              : `Request sent to ${u.display_name}`
                          ),
                        onError,
                      })
                    }
                  >
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                    {u.relationship === "pending_in" ? "Accept" : "Add"}
                  </Button>
                )}
              </Row>
            ))
          )}
        </div>
      )}

      {incoming.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Requests received
          </h2>
          <div className="space-y-2">
            {incoming.map((r) => (
              <Row key={r.request_id} name={r.display_name} handle={r.handle} avatar={r.avatar_url}>
                <Button
                  size="sm"
                  disabled={respond.isPending}
                  onClick={() =>
                    respond.mutate(
                      { requestId: r.request_id, accept: true },
                      { onSuccess: () => toast.success(`You are now friends with ${r.display_name}`), onError }
                    )
                  }
                >
                  <Check className="mr-1.5 h-3.5 w-3.5" /> Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={respond.isPending}
                  onClick={() =>
                    respond.mutate({ requestId: r.request_id, accept: false }, { onError })
                  }
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </Row>
            ))}
          </div>
        </section>
      )}

      {outgoing.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Requests sent
          </h2>
          <div className="space-y-2">
            {outgoing.map((r) => (
              <Row key={r.request_id} name={r.display_name} handle={r.handle} avatar={r.avatar_url}>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(r.user_id, { onError })}
                >
                  Cancel
                </Button>
              </Row>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <Separator className="mb-4" />
        <h2 className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Your friends
        </h2>
        {friends.isLoading ? (
          <div className="flex items-center gap-2 px-1 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (friends.data ?? []).length === 0 ? (
          <EmptyState
            icon={Users}
            title="No friends yet"
            description="Search above to find people and send a friend request."
          />
        ) : (
          <div className="space-y-2">
            {(friends.data ?? []).map((f) => (
              <Row key={f.user_id} name={f.display_name} handle={f.handle} avatar={f.avatar_url}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" aria-label={`Manage ${f.display_name}`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => remove.mutate(f.user_id, { onError })}>
                      <UserMinus className="mr-2 h-4 w-4" /> Remove friend
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() =>
                        block.mutate(f.user_id, {
                          onSuccess: () => toast.success(`Blocked ${f.display_name}`),
                          onError,
                        })
                      }
                    >
                      <Ban className="mr-2 h-4 w-4" /> Block
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Row>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
