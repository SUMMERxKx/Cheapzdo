// Board role capabilities. This is the single place the UI asks "can I do this".
// It is a stub in phase 1 and gets wired to board_members in phase 4. RLS is the
// real gate, this only decides what the UI shows.
export type BoardRole = "owner" | "editor" | "viewer";

export interface Permissions {
  role: BoardRole | null;
  canView: boolean;
  canEdit: boolean;
  isOwner: boolean;
}

export function permissionsForRole(role: BoardRole | null): Permissions {
  return {
    role,
    canView: role !== null,
    canEdit: role === "owner" || role === "editor",
    isOwner: role === "owner",
  };
}

// Phase 4 replaces the argument with the role from the active board membership.
export function usePermissions(role: BoardRole | null = null): Permissions {
  return permissionsForRole(role);
}
