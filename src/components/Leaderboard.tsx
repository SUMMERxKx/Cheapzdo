import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { Person, WorkItem, Priority, Sprint } from '@/types';
import { Trophy, Medal, Crown, Flame, CheckCircle2, Zap, TrendingUp, Info, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Scoring system — rate-based, out of 100                            */
/*                                                                     */
/*  Three pillars, all percentage-based so the score is fair           */
/*  regardless of how many tasks someone is assigned:                  */
/*                                                                     */
/*  1. Completion Rate  (0-50 pts)                                     */
/*     = (done / total_assigned) * 50                                  */
/*                                                                     */
/*  2. Priority Impact  (0-30 pts)                                     */
/*     Average priority weight of DONE tasks.                          */
/*     Critical=1.0  High=0.75  Medium=0.5  Low=0.25                   */
/*     = avg_weight * 30                                               */
/*                                                                     */
/*  3. Momentum         (0-20 pts)                                     */
/*     Of tasks NOT yet done, what % are Active (being worked on)?     */
/*     If everything is done → full 20 pts (nothing left idle).        */
/*     = (active / (active + new)) * 20                                */
/* ------------------------------------------------------------------ */

/** Priority weights (0–1 scale) */
const PRIORITY_WEIGHT: Record<Priority, number> = {
  Critical: 1.0,
  High: 0.75,
  Medium: 0.5,
  Low: 0.25,
};

const MAX_COMPLETION = 50;
const MAX_PRIORITY = 30;
const MAX_MOMENTUM = 20;

interface UserScore {
  person: Person;
  /** Overall score 0-100 */
  total: number;
  /** Raw counts */
  assigned: number;
  done: number;
  active: number;
  newCount: number;
  /** Individual pillar scores */
  completionScore: number;
  priorityScore: number;
  momentumScore: number;
  /** Percentage values for display */
  completionPct: number;
  momentumPct: number;
  avgPriorityWeight: number;
}

function computeScores(people: Person[], workItems: WorkItem[]): UserScore[] {
  return people
    .map((person) => {
      const assigned = workItems.filter((w) => w.assigneeId === person.id);
      const totalAssigned = assigned.length;

      const doneItems = assigned.filter((w) => w.state === 'Done');
      const activeItems = assigned.filter((w) => w.state === 'Active');
      const newItems = assigned.filter((w) => w.state === 'New');

      // --- Completion Rate ---
      const completionPct = totalAssigned > 0 ? doneItems.length / totalAssigned : 0;
      const completionScore = completionPct * MAX_COMPLETION;

      // --- Priority Impact ---
      const avgPriorityWeight =
        doneItems.length > 0
          ? doneItems.reduce((sum, w) => sum + PRIORITY_WEIGHT[w.priority], 0) / doneItems.length
          : 0;
      const priorityScore = avgPriorityWeight * MAX_PRIORITY;

      // --- Momentum ---
      const pending = activeItems.length + newItems.length;
      let momentumPct: number;
      if (pending === 0 && doneItems.length > 0) {
        // All tasks done — perfect momentum
        momentumPct = 1;
      } else if (pending === 0) {
        // No tasks at all
        momentumPct = 0;
      } else {
        momentumPct = activeItems.length / pending;
      }
      const momentumScore = momentumPct * MAX_MOMENTUM;

      const total = Math.round(completionScore + priorityScore + momentumScore);

      return {
        person,
        total,
        assigned: totalAssigned,
        done: doneItems.length,
        active: activeItems.length,
        newCount: newItems.length,
        completionScore: Math.round(completionScore),
        priorityScore: Math.round(priorityScore),
        momentumScore: Math.round(momentumScore),
        completionPct,
        momentumPct,
        avgPriorityWeight,
      };
    })
    .sort((a, b) => b.total - a.total || b.completionPct - a.completionPct);
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const rankMedals: Record<number, { icon: React.ElementType; color: string; bg: string }> = {
  0: { icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-400/15 border-yellow-400/30' },
  1: { icon: Medal, color: 'text-slate-300',   bg: 'bg-slate-300/15 border-slate-300/30' },
  2: { icon: Medal, color: 'text-amber-600',   bg: 'bg-amber-600/15 border-amber-600/30' },
};

/** Tiny progress bar */
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function PodiumCard({ score, rank, height }: { score: UserScore; rank: number; height: string }) {
  const medal = rankMedals[rank];
  const MedalIcon = medal?.icon ?? Trophy;

  return (
    <div className="flex flex-col items-center gap-2" style={{ minWidth: 140 }}>
      <div className="relative">
        <div
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold border-2 transition-all',
            rank === 0 && 'w-20 h-20 text-xl border-yellow-400/60 bg-yellow-400/10',
            rank === 1 && 'border-slate-300/60 bg-slate-300/10',
            rank === 2 && 'border-amber-600/60 bg-amber-600/10',
          )}
        >
          {initials(score.person.name)}
        </div>
        <div
          className={cn(
            'absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border',
            medal?.bg,
          )}
        >
          <MedalIcon className={cn('w-4 h-4', medal?.color)} />
        </div>
      </div>

      <span className="text-sm font-semibold text-center leading-tight max-w-[130px] truncate">
        {score.person.name}
      </span>

      <div
        className={cn(
          'w-full rounded-t-lg flex flex-col items-center justify-end pb-3 border border-b-0 transition-all',
          rank === 0 && 'bg-yellow-400/10 border-yellow-400/25',
          rank === 1 && 'bg-slate-300/10 border-slate-300/25',
          rank === 2 && 'bg-amber-600/10 border-amber-600/25',
        )}
        style={{ height }}
      >
        <span className={cn('text-2xl font-black', medal?.color)}>
          {score.total}
        </span>
        <span className="text-[10px] text-muted-foreground tracking-wider">/100</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared table + podium (extracted so both views reuse it)           */
/* ------------------------------------------------------------------ */

function ScoreBoard({ scores, label }: { scores: UserScore[]; label: string }) {
  const podium = scores.slice(0, 3);

  const podiumDisplay = podium.length >= 3
    ? [podium[1], podium[0], podium[2]]
    : podium;
  const podiumHeights = podium.length >= 3
    ? ['120px', '160px', '90px']
    : podium.length === 2
      ? ['120px', '160px']
      : ['160px'];
  const podiumRanks = podium.length >= 3
    ? [1, 0, 2]
    : podium.length === 2
      ? [1, 0]
      : [0];

  if (scores.length === 0 || scores.every((s) => s.assigned === 0)) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground text-sm">No tasks assigned {label !== 'Overall' ? `in ${label}` : 'yet'}.</p>
      </div>
    );
  }

  return (
    <>
      {/* Podium */}
      {podium.length > 0 && (
        <div className="flex items-end justify-center gap-4 pt-4">
          {podiumDisplay.map((s, i) => (
            <PodiumCard
              key={s.person.id}
              score={s}
              rank={podiumRanks[i]}
              height={podiumHeights[i]}
            />
          ))}
        </div>
      )}

      {/* Full ranking table */}
      <Card className="bg-card border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="py-3 px-4 text-left w-12">#</th>
              <th className="py-3 px-4 text-left">MEMBER</th>
              <th className="py-3 px-4 text-center w-28">
                <span className="flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" /> COMPLETION</span>
              </th>
              <th className="py-3 px-4 text-center w-28">
                <span className="flex items-center justify-center gap-1"><TrendingUp className="w-3 h-3" /> PRIORITY</span>
              </th>
              <th className="py-3 px-4 text-center w-28">
                <span className="flex items-center justify-center gap-1"><Zap className="w-3 h-3" /> MOMENTUM</span>
              </th>
              <th className="py-3 px-4 text-center w-24">TASKS</th>
              <th className="py-3 px-4 text-right w-24">SCORE</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((s, idx) => {
              const medal = rankMedals[idx];
              const MedalIcon = medal?.icon;
              return (
                <tr
                  key={s.person.id}
                  className={cn(
                    'border-b border-border last:border-0 transition-colors',
                    idx < 3 ? 'bg-secondary/30' : 'hover:bg-secondary/20',
                  )}
                >
                  <td className="py-3 px-4">
                    {MedalIcon ? (
                      <MedalIcon className={cn('w-4 h-4', medal.color)} />
                    ) : (
                      <span className="text-sm text-muted-foreground">{idx + 1}</span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border',
                          idx === 0 && 'border-yellow-400/40 bg-yellow-400/10',
                          idx === 1 && 'border-slate-300/40 bg-slate-300/10',
                          idx === 2 && 'border-amber-600/40 bg-amber-600/10',
                          idx > 2 && 'border-border bg-secondary',
                        )}
                      >
                        {initials(s.person.name)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{s.person.name}</span>
                        {s.person.handle && (
                          <span className="text-[10px] text-muted-foreground">@{s.person.handle}</span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-success font-medium">{s.completionScore}/{MAX_COMPLETION}</span>
                        <span className="text-muted-foreground">{Math.round(s.completionPct * 100)}%</span>
                      </div>
                      <MiniBar value={s.completionScore} max={MAX_COMPLETION} color="bg-success" />
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-warning font-medium">{s.priorityScore}/{MAX_PRIORITY}</span>
                        <span className="text-muted-foreground">{Math.round(s.avgPriorityWeight * 100)}%</span>
                      </div>
                      <MiniBar value={s.priorityScore} max={MAX_PRIORITY} color="bg-warning" />
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-info font-medium">{s.momentumScore}/{MAX_MOMENTUM}</span>
                        <span className="text-muted-foreground">{Math.round(s.momentumPct * 100)}%</span>
                      </div>
                      <MiniBar value={s.momentumScore} max={MAX_MOMENTUM} color="bg-info" />
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                      <span className="text-success">{s.done}</span>
                      <span>/</span>
                      <span>{s.assigned}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {idx === 0 && s.total > 0 && <Flame className="w-4 h-4 text-yellow-400" />}
                      <span className={cn(
                        'text-sm font-bold',
                        idx === 0 && 'text-yellow-400',
                        idx === 1 && 'text-slate-300',
                        idx === 2 && 'text-amber-600',
                      )}>
                        {s.total}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

/** Special value for the "Overall" filter */
const ALL_SPRINTS = '__all__';

/**
 * Leaderboard
 *
 * Fair, rate-based ranking out of 100:
 *   Completion Rate (50)  +  Priority Impact (30)  +  Momentum (20)
 *
 * Supports per-sprint and overall views via a sprint selector.
 */
export function Leaderboard() {
  const { people, workItems, sprints, activeSprint } = useApp();
  const [showScoring, setShowScoring] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<string>(ALL_SPRINTS);

  // Sort sprints newest first (by startDate descending)
  const sortedSprints = useMemo(
    () => [...sprints].sort((a, b) => b.startDate - a.startDate),
    [sprints],
  );

  // Filter work items by selected sprint
  const filteredItems = useMemo(() => {
    if (selectedSprint === ALL_SPRINTS) return workItems;
    return workItems.filter((w) => w.sprintId === selectedSprint);
  }, [workItems, selectedSprint]);

  const scores = useMemo(() => computeScores(people, filteredItems), [people, filteredItems]);

  const selectedSprintName = selectedSprint === ALL_SPRINTS
    ? 'Overall'
    : sprints.find((s) => s.id === selectedSprint)?.name ?? 'Unknown';

  if (people.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <p className="text-muted-foreground text-sm">No team members yet. Add people in the Dashboard tab.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 overflow-auto">
      {/* Header + Sprint selector */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold tracking-wide">LEADERBOARD</h2>
        </div>
        <Select value={selectedSprint} onValueChange={setSelectedSprint}>
          <SelectTrigger className="w-44 h-8 text-xs">
            <SelectValue placeholder="Overall" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SPRINTS}>Overall</SelectItem>
            {sortedSprints.map((sprint) => (
              <SelectItem key={sprint.id} value={sprint.id}>
                {sprint.name}{sprint.isActive ? ' ●' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Scoring Legend (collapsible) */}
      <Card
        className="bg-card border-border overflow-hidden cursor-pointer select-none"
        onClick={() => setShowScoring((v) => !v)}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground tracking-wider">
            <Info className="w-4 h-4" />
            HOW SCORING WORKS
          </div>
          <ChevronDown className={cn(
            'w-4 h-4 text-muted-foreground transition-transform duration-200',
            showScoring && 'rotate-180',
          )} />
        </div>
        {showScoring && (
          <div className="px-4 pb-4 pt-3 border-t border-border space-y-4">
            <p className="text-xs text-muted-foreground">
              Score is out of <strong className="text-foreground">100</strong> and based on rates, not raw counts — so it stays fair no matter how many tasks you have.
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="p-3 rounded-md bg-secondary/50 border border-border space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  Completion Rate
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  % of your assigned tasks marked Done
                </p>
                <p className="text-xs font-semibold text-foreground">Up to 50 pts</p>
              </div>

              <div className="p-3 rounded-md bg-secondary/50 border border-border space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <TrendingUp className="w-3.5 h-3.5 text-warning" />
                  Priority Impact
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Avg priority of completed tasks — harder work scores more
                </p>
                <p className="text-xs font-semibold text-foreground">Up to 30 pts</p>
              </div>

              <div className="p-3 rounded-md bg-secondary/50 border border-border space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Zap className="w-3.5 h-3.5 text-info" />
                  Momentum
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  % of remaining tasks actively being worked on vs sitting idle
                </p>
                <p className="text-xs font-semibold text-foreground">Up to 20 pts</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Podium + Table */}
      <ScoreBoard scores={scores} label={selectedSprintName} />
    </div>
  );
}
