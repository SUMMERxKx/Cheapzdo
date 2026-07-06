import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SwatchPicker, SWATCHES } from "./SwatchPicker";
import { useTypes } from "./useBoardData";
import { usePermissions } from "@/features/members/usePermissions";
import { createType, deleteType, updateType } from "@/lib/supabase/workItemTypes";
import { resolveTypeIcon, TYPE_ICON_NAMES } from "@/lib/design/icons";
import { queryKeys } from "@/lib/supabase/queryKeys";
import { cn } from "@/lib/utils";

function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {TYPE_ICON_NAMES.map((n) => {
        const Icon = resolveTypeIcon(n);
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`Icon ${n}`}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md border transition-colors",
              value === n
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}

// Work item types are fully user defined per board: name, icon, and color.
export function TypeEditor({ boardId }: { boardId: string }) {
  const { canEdit } = usePermissions(boardId);
  const types = useTypes(boardId);
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [icon, setIcon] = useState(TYPE_ICON_NAMES[0]);
  const [color, setColor] = useState(SWATCHES[5]);

  const refresh = () => void qc.invalidateQueries({ queryKey: queryKeys.types(boardId) });

  const add = async () => {
    const res = await createType({ boardId, name, icon, color });
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    setName("");
    refresh();
  };

  const rename = async (id: string, next: string) => {
    if (!next.trim()) return;
    const res = await updateType(id, { name: next.trim() });
    if (!res.ok) toast.error(res.error.message);
    refresh();
  };

  const changeIcon = async (id: string, iconName: string) => {
    const res = await updateType(id, { icon: iconName });
    if (!res.ok) toast.error(res.error.message);
    refresh();
  };

  const recolor = async (id: string, hex: string) => {
    const res = await updateType(id, { color: hex });
    if (!res.ok) toast.error(res.error.message);
    refresh();
  };

  const remove = async (id: string) => {
    const res = await deleteType(id);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    refresh();
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Types describe what a work item is. Make them yours, the defaults are just
        a starting point.
      </p>

      <div className="divide-y divide-border rounded-xl border border-border">
        {(types.data ?? []).map((t) => {
          const Icon = resolveTypeIcon(t.icon);
          return (
            <div key={t.id} className="flex flex-wrap items-center gap-3 p-3">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-md"
                style={{ backgroundColor: `${t.color}22`, color: t.color ?? undefined }}
              >
                <Icon className="h-4 w-4" />
              </span>
              {canEdit ? (
                <Input
                  defaultValue={t.name}
                  className="h-8 w-40"
                  onBlur={(e) => {
                    if (e.target.value !== t.name) void rename(t.id, e.target.value);
                  }}
                />
              ) : (
                <span className="w-40 text-sm">{t.name}</span>
              )}
              {canEdit && (
                <div className="ml-auto flex flex-wrap items-center gap-3">
                  <IconPicker value={t.icon ?? ""} onChange={(n) => void changeIcon(t.id, n)} />
                  <SwatchPicker value={t.color ?? ""} onChange={(hex) => void recolor(t.id, hex)} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(t.id)}
                    aria-label={`Delete ${t.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {canEdit && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border p-4">
          <div className="min-w-36 flex-1 space-y-1.5">
            <label className="text-sm font-medium" htmlFor="type-name">New type</label>
            <Input
              id="type-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spike"
            />
          </div>
          <IconPicker value={icon} onChange={setIcon} />
          <SwatchPicker value={color} onChange={setColor} />
          <Button onClick={add} disabled={!name.trim()}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
