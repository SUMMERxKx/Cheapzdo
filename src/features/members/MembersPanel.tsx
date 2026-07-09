import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Mail, UserMinus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/features/auth/useAuth";
import { InviteFriendDialog } from "./InviteFriendDialog";
import { usePermissions } from "./usePermissions";
import { usePendingInvitations, useRoster, useTeams } from "@/features/boards/useBoardData";
import {
  assignMemberTeam,
  removeMember,
  updateMemberRole,
  type BoardRole,
} from "@/lib/supabase/members";
import { createInvitation, revokeInvitation, type InviteRole } from "@/lib/supabase/invitations";
import { queryKeys } from "@/lib/supabase/queryKeys";

const NO_TEAM = "none";

function MemberAvatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return <img src={url} alt="" className="h-8 w-8 rounded-full border border-border object-cover" />;
  }
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export function MembersPanel({ boardId }: { boardId: string }) {
  const { user } = useAuth();
  const { isOwner } = usePermissions(boardId);
  const roster = useRoster(boardId);
  const teams = useTeams(boardId);
  const invites = usePendingInvitations(boardId, isOwner);
  const qc = useQueryClient();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("editor");
  const [inviteTeam, setInviteTeam] = useState<string>(NO_TEAM);
  const [creating, setCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: queryKeys.members(boardId) });
    void qc.invalidateQueries({ queryKey: ["board", boardId, "invitations"] });
  };

  const sendInvite = async () => {
    setCreating(true);
    const res = await createInvitation({
      boardId,
      email,
      role,
      teamId: inviteTeam === NO_TEAM ? null : inviteTeam,
    });
    setCreating(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    setCreatedLink(res.data.link);
    refresh();
  };

  const copyLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
    toast.success("Invite link copied. Send it to your teammate.");
  };

  const changeRole = async (userId: string, next: BoardRole) => {
    const res = await updateMemberRole(boardId, userId, next);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    refresh();
  };

  const changeTeam = async (userId: string, teamId: string) => {
    const res = await assignMemberTeam(boardId, userId, teamId === NO_TEAM ? null : teamId);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    refresh();
  };

  const kick = async (userId: string, name: string) => {
    if (!window.confirm(`Remove ${name} from this board? Their tasks stay but get unassigned.`)) return;
    const res = await removeMember(boardId, userId);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success(`${name} was removed`);
    refresh();
  };

  const revoke = async (id: string) => {
    const res = await revokeInvitation(id);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    refresh();
  };

  const closeInvite = (open: boolean) => {
    setInviteOpen(open);
    if (!open) {
      setEmail("");
      setRole("editor");
      setInviteTeam(NO_TEAM);
      setCreatedLink(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold">
          Members{" "}
          <span className="font-mono text-xs text-muted-foreground">
            {roster.data?.length ?? 0}
          </span>
        </h3>
        {isOwner && (
          <div className="flex items-center gap-2">
            <InviteFriendDialog
              boardId={boardId}
              memberIds={(roster.data ?? []).map((m) => m.user_id)}
            />
            <Dialog open={inviteOpen} onOpenChange={closeInvite}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Invite
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Invite a teammate</DialogTitle>
              </DialogHeader>
              {createdLink ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Invite created for <span className="text-foreground">{email}</span>.
                    Copy the link now, it is shown only once.
                  </p>
                  <div className="flex gap-2">
                    <Input readOnly value={createdLink} className="font-mono text-xs" />
                    <Button size="icon" variant="outline" onClick={() => copyLink(createdLink)} aria-label="Copy invite link">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button className="w-full" onClick={() => closeInvite(false)}>
                    Done
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="invite-email">Email</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="teammate@company.com"
                      autoFocus
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Role</Label>
                      <Select value={role} onValueChange={(v) => setRole(v as InviteRole)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Team</Label>
                      <Select value={inviteTeam} onValueChange={setInviteTeam}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_TEAM}>No team</SelectItem>
                          {(teams.data ?? []).map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    disabled={creating || !email.includes("@")}
                    onClick={sendInvite}
                  >
                    {creating ? "Creating…" : "Create invite link"}
                  </Button>
                </div>
              )}
            </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <div className="divide-y divide-border rounded-xl border border-border">
        {(roster.data ?? []).map((m) => {
          const isSelf = m.user_id === user?.id;
          const teamName = (teams.data ?? []).find((t) => t.id === m.team_id)?.name;
          const teamColor = (teams.data ?? []).find((t) => t.id === m.team_id)?.color;
          return (
            <div key={m.user_id} className="flex flex-wrap items-center gap-3 p-3">
              <MemberAvatar name={m.display_name} url={m.avatar_url} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {m.display_name}
                  {isSelf && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
                </p>
                {m.handle && (
                  <p className="font-mono text-[11px] text-muted-foreground">@{m.handle}</p>
                )}
              </div>
              {teamName && (
                <Badge
                  variant="secondary"
                  className="gap-1.5"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: teamColor ?? undefined }}
                  />
                  {teamName}
                </Badge>
              )}
              {isOwner ? (
                <>
                  <Select
                    value={m.team_id ?? NO_TEAM}
                    onValueChange={(v) => changeTeam(m.user_id, v)}
                  >
                    <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_TEAM}>No team</SelectItem>
                      {(teams.data ?? []).map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={m.role}
                    onValueChange={(v) => changeRole(m.user_id, v as BoardRole)}
                  >
                    <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => kick(m.user_id, m.display_name)}
                    aria-label={`Remove ${m.display_name}`}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Badge variant="secondary" className="capitalize">{m.role}</Badge>
              )}
            </div>
          );
        })}
        {roster.data?.length === 0 && (
          <EmptyState icon={UserPlus} title="Just you so far" description="Invite your team to start collaborating." />
        )}
      </div>

      {isOwner && (invites.data?.length ?? 0) > 0 && (
        <div className="space-y-2">
          <h3 className="font-display text-sm font-semibold">Pending invites</h3>
          <div className="divide-y divide-border rounded-xl border border-dashed border-border">
            {(invites.data ?? []).map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 p-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{inv.email}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {inv.role} · expires {new Date(inv.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => revoke(inv.id)}>
                  Revoke
                </Button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Links are shown once at creation. To reshare, revoke and invite again.
          </p>
        </div>
      )}
    </div>
  );
}
