import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthCard } from "./AuthCard";
import { Field } from "./Field";
import { resetRequestSchema, type ResetRequestInput } from "@/lib/supabase/schemas/auth";
import { requestPasswordReset } from "@/lib/supabase/auth";

export default function ResetRequestPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ResetRequestInput>({ resolver: zodResolver(resetRequestSchema) });

  const onSubmit = async (values: ResetRequestInput) => {
    const res = await requestPasswordReset(values.email);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <AuthCard title="Check your inbox" subtitle={`We sent a reset link to ${getValues("email")}.`}>
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/50 p-4">
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">
              Open the link to set a new password.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Reset your password" subtitle="We will email you a reset link.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field
          id="email"
          type="email"
          label="Email"
          autoComplete="email"
          autoFocus
          error={errors.email?.message}
          {...register("email")}
        />
        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        <Link to="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
