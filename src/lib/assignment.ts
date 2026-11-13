// Only a change to a real assignee can trigger an assignment email
export function shouldPingAssignment(
  next: { assigneeId?: string, pingOnAssign?: boolean },
  previous?: { assigneeId?: string },
) {
  return !!next.pingOnAssign && !!next.assigneeId && next.assigneeId !== previous?.assigneeId
}
