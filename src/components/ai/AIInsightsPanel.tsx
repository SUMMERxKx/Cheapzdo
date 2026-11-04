import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { AIInsights } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  BrainCircuit,
  Loader2,
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  Lightbulb,
  Users,
  BarChart3,
  RefreshCw,
} from 'lucide-react';

type InsightScope = 'current' | 'all' | string;

export function AIInsightsPanel() {
  const { generateAIInsights, people, sprints, activeSprint, isAIEnabled } = useApp();
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState<InsightScope>('current');

  if (!isAIEnabled) return null;

  const getSprintIdForScope = (): string | null => {
    if (scope === 'all') return null;
    if (scope === 'current') return activeSprint;
    return scope;
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateAIInsights({ sprintId: getSprintIdForScope() });
      setInsights(result);
    } catch (err: any) {
      const msg = err?.message || 'Failed to generate insights. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const getPersonName = (id: string) => people.find(p => p.id === id)?.name || id;

  const scopeLabel =
    scope === 'current'
      ? activeSprint
        ? `Current sprint (${sprints.find(s => s.id === activeSprint)?.name ?? 'Active'})`
        : 'Current sprint (none)'
      : scope === 'all'
        ? 'Whole board'
        : sprints.find(s => s.id === scope)?.name ?? scope;

  if (!insights) {
    return (
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-primary" />
            AI Trends & Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Analyze tasks, workload, risks, and momentum. Choose which scope to analyze:
          </p>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Scope</Label>
            <Select
              value={scope}
              onValueChange={(v) => setScope(v as InsightScope)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">
                  Current sprint{activeSprint ? ` (${sprints.find(s => s.id === activeSprint)?.name})` : ''}
                </SelectItem>
                <SelectItem value="all">Whole board (all sprints)</SelectItem>
                {sprints.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}{s.isActive ? ' (active)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={loading || (scope === 'current' && !activeSprint)}
            className="w-full gap-2"
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <BrainCircuit className="w-4 h-4" />
                Generate AI Insights {scope !== 'all' ? `(${scopeLabel})` : ''}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-primary" />
              AI Trends & Insights
            </CardTitle>
            <p className="text-[10px] text-muted-foreground mt-1">Scope: {scopeLabel}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGenerate}
            disabled={loading}
            className="h-7 px-2 gap-1 text-xs text-muted-foreground"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Summary */}
        <section>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            Summary
          </h4>
          <p className="text-sm leading-relaxed">{insights.summary}</p>
        </section>

        <Separator className="opacity-40" />

        {/* Risks */}
        {insights.risks.length > 0 && (
          <section>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
              Risks
            </h4>
            <ul className="space-y-1.5">
              {insights.risks.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-yellow-500/70" />
                  <span className="leading-relaxed">{r}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Blockers */}
        {insights.blockers.length > 0 && (
          <section>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
              Blockers
            </h4>
            <ul className="space-y-1.5">
              {insights.blockers.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-red-500/70" />
                  <span className="leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Workload Imbalance */}
        {insights.workloadImbalance.length > 0 && (
          <>
            <Separator className="opacity-40" />
            <section>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                Workload Imbalance
              </h4>
              <div className="flex flex-wrap gap-2">
                {insights.workloadImbalance.map((w, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-[10px] py-1.5 px-2.5 border-blue-500/30 bg-blue-500/10 text-blue-400 max-w-xs"
                    title={w.reason}
                  >
                    <span className="font-semibold mr-1">{getPersonName(w.personId)}:</span>
                    <span className="truncate">{w.reason}</span>
                  </Badge>
                ))}
              </div>
            </section>
          </>
        )}

        <Separator className="opacity-40" />

        {/* Momentum Analysis */}
        {insights.momentumAnalysis && (
          <section>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              Momentum
            </h4>
            <p className="text-xs leading-relaxed text-muted-foreground">{insights.momentumAnalysis}</p>
          </section>
        )}

        {/* Priority Distribution */}
        {insights.priorityDistributionComment && (
          <section>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-purple-500" />
              Priority Distribution
            </h4>
            <p className="text-xs leading-relaxed text-muted-foreground">{insights.priorityDistributionComment}</p>
          </section>
        )}

        {/* Recommendations */}
        {insights.recommendations.length > 0 && (
          <>
            <Separator className="opacity-40" />
            <section>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-primary" />
                Recommendations
              </h4>
              <ul className="space-y-1.5">
                {insights.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className="mt-0.5 shrink-0 text-primary/70 font-bold">{i + 1}.</span>
                    <span className="leading-relaxed">{r}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </CardContent>
    </Card>
  );
}
