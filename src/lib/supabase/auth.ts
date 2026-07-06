import { supabase } from "./client";
import { ok, fail, type Result } from "./result";
import type { SignupInput, LoginInput } from "./schemas/auth";

// Auth data module. Wraps supabase.auth so the UI gets typed Results and a
// single place owns the redirect URLs.
function origin(): string {
  return typeof window !== "undefined" ? window.location.origin : "";
}

// Sign up with email and password. Supabase sends a verification email. The
// display name is stored in user metadata and the handle_new_user trigger copies
// it into the profiles row.
export async function signUp(input: SignupInput): Promise<Result<{ needsVerification: boolean }>> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { display_name: input.displayName },
      emailRedirectTo: `${origin()}/verify`,
    },
  });
  if (error) return fail({ message: error.message });
  // When confirmation is on, there is a user but no session until they verify.
  const needsVerification = !data.session;
  return ok({ needsVerification });
}

export async function signIn(input: LoginInput): Promise<Result<null>> {
  const { error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (error) return fail({ message: error.message });
  return ok(null);
}

export async function signOut(): Promise<Result<null>> {
  const { error } = await supabase.auth.signOut();
  if (error) return fail({ message: error.message });
  return ok(null);
}

export async function resendVerification(email: string): Promise<Result<null>> {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${origin()}/verify` },
  });
  if (error) return fail({ message: error.message });
  return ok(null);
}

export async function requestPasswordReset(email: string): Promise<Result<null>> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin()}/update-password`,
  });
  if (error) return fail({ message: error.message });
  return ok(null);
}

export async function updatePassword(password: string): Promise<Result<null>> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return fail({ message: error.message });
  return ok(null);
}

// Accept a board invitation by its raw token. The RPC validates and creates the
// membership, returning the board id to redirect to.
export async function acceptInvite(token: string): Promise<Result<string>> {
  const { data, error } = await supabase.rpc("accept_invite", { p_token: token });
  if (error) return fail({ message: error.message });
  return ok(data as string);
}
