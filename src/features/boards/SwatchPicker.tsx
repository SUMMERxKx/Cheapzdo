import { cn } from "@/lib/utils";

// Small preset palette used by teams, statuses, and types. Values are stored on
// the row, the UI never hardcodes them elsewhere.
export const SWATCHES = [
  "#5B7CFA",
  "#4CC2E0",
  "#3FB98C",
  "#E8A13A",
  "#E5484D",
  "#A855F7",
  "#EC4899",
  "#64748B",
];

export function SwatchPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {SWATCHES.map((hex) => (
        <button
          key={hex}
          type="button"
          disabled={disabled}
          onClick={() => onChange(hex)}
          aria-label={`Color ${hex}`}
          className={cn(
            "h-6 w-6 rounded-full border-2 transition-transform",
            value === hex ? "scale-110 border-foreground" : "border-transparent",
            disabled && "opacity-50"
          )}
          style={{ backgroundColor: hex }}
        />
      ))}
    </div>
  );
}
