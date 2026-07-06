import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Labeled input with an inline error message. Used across the auth and profile forms.
type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, id, className, ...props }, ref) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        ref={ref}
        aria-invalid={!!error}
        className={cn(error && "border-destructive focus-visible:ring-destructive", className)}
        {...props}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
);
Field.displayName = "Field";
