// Burndown math for one sprint. We do not keep a per day history table, so the
// day a task finished is approximated by its updated_at once it sits in a done
// status. Good enough to read the shape of a sprint, documented as an estimate.
export interface BurndownPoint {
  day: number;
  ideal: number;
  actual: number | null;
}

export interface BurndownTask {
  doneAt: string | null;
  createdAt: string;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function computeBurndown(
  tasks: BurndownTask[],
  sprintStart: string,
  sprintEnd: string,
  today: Date = new Date()
): BurndownPoint[] {
  const start = new Date(`${sprintStart}T00:00:00`);
  const end = new Date(`${sprintEnd}T00:00:00`);
  const total = tasks.length;
  const length = Math.max(1, daysBetween(start, end));
  const todayIndex = daysBetween(start, today);

  const points: BurndownPoint[] = [];
  for (let day = 0; day <= length; day++) {
    const ideal = total * (1 - day / length);
    let actual: number | null = null;
    if (day <= todayIndex) {
      const dayDate = new Date(start.getTime() + day * 86_400_000);
      const doneByDay = tasks.filter(
        (t) => t.doneAt !== null && new Date(t.doneAt) <= new Date(dayDate.getTime() + 86_399_000)
      ).length;
      actual = total - doneByDay;
    }
    points.push({ day, ideal, actual });
  }
  return points;
}
