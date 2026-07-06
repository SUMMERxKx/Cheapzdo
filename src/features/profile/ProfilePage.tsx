import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/features/auth/Field";
import { useAuth } from "@/features/auth/useAuth";
import { getMyProfile, updateProfile, uploadAvatar } from "@/lib/supabase/profiles";
import { queryKeys } from "@/lib/supabase/queryKeys";

export default function ProfilePage() {
  const { user } = useAuth();
  const uid = user?.id;
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const profile = useQuery({
    queryKey: queryKeys.me(),
    enabled: !!uid,
    queryFn: async () => {
      const res = await getMyProfile(uid as string);
      if (!res.ok) throw new Error(res.error.message);
      return res.data;
    },
  });

  useEffect(() => {
    if (profile.data) {
      setDisplayName(profile.data.display_name);
      setHandle(profile.data.handle ?? "");
      setAvatarUrl(profile.data.avatar_url);
    }
  }, [profile.data]);

  const save = async () => {
    if (!uid) return;
    setSaving(true);
    const res = await updateProfile(uid, {
      display_name: displayName.trim(),
      handle: handle.trim() ? handle.trim().toLowerCase() : null,
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error.message || "Could not save. Handles use letters, numbers, and underscores.");
      return;
    }
    toast.success("Profile saved");
    void qc.invalidateQueries({ queryKey: queryKeys.me() });
  };

  const onPickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uid) return;
    const up = await uploadAvatar(uid, file);
    if (!up.ok) {
      toast.error(up.error.message);
      return;
    }
    const res = await updateProfile(uid, { avatar_url: up.data });
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    setAvatarUrl(`${up.data}?t=${Date.now()}`);
    void qc.invalidateQueries({ queryKey: queryKeys.me() });
    toast.success("Avatar updated");
  };

  const initial = (displayName || user?.email || "?").charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-lg space-y-8 p-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">Profile</h1>

      <div className="flex items-center gap-4">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Your avatar"
              className="h-16 w-16 rounded-full border border-border object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
              {initial}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-foreground shadow"
            aria-label="Change avatar"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickAvatar}
          />
        </div>
        <div>
          <p className="text-sm font-medium">{displayName || "Your name"}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div className="space-y-4">
        <Field
          id="displayName"
          label="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <Field
          id="handle"
          label="Handle"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="lowercase, letters, numbers, underscores"
        />
        <Button onClick={save} disabled={saving || !displayName.trim()}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
