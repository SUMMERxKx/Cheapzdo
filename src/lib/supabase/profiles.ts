import { supabase } from "./client";
import { ok, fail, fromPostgrestError, type Result } from "./result";
import type { Tables } from "./database.types";

export type Profile = Tables<"profiles">;

export async function getMyProfile(userId: string): Promise<Result<Profile>> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return fail(fromPostgrestError(error));
  return ok(data);
}

export async function updateProfile(
  userId: string,
  updates: { display_name?: string; handle?: string | null; avatar_url?: string | null }
): Promise<Result<Profile>> {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select("*")
    .single();
  if (error) return fail(fromPostgrestError(error));
  return ok(data);
}

// Upload to the public avatars bucket under a path the user owns, then return the
// public URL for storing on the profile.
export async function uploadAvatar(userId: string, file: File): Promise<Result<string>> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, cacheControl: "3600" });
  if (error) return fail({ message: error.message });
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return ok(data.publicUrl);
}
