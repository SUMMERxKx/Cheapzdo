// Invite tokens are generated in the browser and only their sha256 hex hash is
// stored. The raw token lives solely in the link the owner copies, so a database
// read can never reveal a usable invite. accept_invite hashes the same way.
function toBase64Url(bytes: Uint8Array): string {
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generateInviteToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

export async function hashInviteToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function inviteLink(token: string): string {
  return `${window.location.origin}/accept-invite?token=${token}`;
}
