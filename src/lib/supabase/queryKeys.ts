// Central query key factory. Keys are hierarchical so we can invalidate a whole
// board or just one slice. Filters must be part of the key so cached lists and
// optimistic updates stay correct.
export const queryKeys = {
  me: () => ["me"] as const,
  boards: () => ["boards"] as const,
  board: (boardId: string) => ["board", boardId] as const,
  members: (boardId: string) => ["board", boardId, "members"] as const,
  teams: (boardId: string) => ["board", boardId, "teams"] as const,
  statuses: (boardId: string) => ["board", boardId, "statuses"] as const,
  types: (boardId: string) => ["board", boardId, "types"] as const,
  arcs: (boardId: string) => ["board", boardId, "arcs"] as const,
  sprints: (boardId: string) => ["board", boardId, "sprints"] as const,
  epics: (boardId: string, arcId?: string | null) =>
    ["board", boardId, "epics", { arcId: arcId ?? null }] as const,
  tasks: (
    boardId: string,
    filters?: Record<string, unknown>
  ) => ["board", boardId, "tasks", filters ?? {}] as const,
  daily: (boardId: string, scope?: string) =>
    ["board", boardId, "daily", { scope: scope ?? null }] as const,
  comments: (boardId: string, parent: { taskId?: string; epicId?: string }) =>
    ["board", boardId, "comments", parent] as const,
  announcements: (boardId: string) =>
    ["board", boardId, "announcements"] as const,
  leaderboard: (boardId: string, sprintId?: string | null) =>
    ["board", boardId, "leaderboard", { sprintId: sprintId ?? null }] as const,
  leetping: (boardId: string) => ["board", boardId, "leetping"] as const,
} as const;
