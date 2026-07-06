import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AuthCard } from "./AuthCard";
import { Field } from "./Field";
import { updatePasswordSchema, type UpdatePasswordInput } from "@/lib/supabase/schemas/auth";
import { updatePassword } from "@/lib/supabase/auth";

// Reached from the reset email link, which establishes a recovery session so
// updateUser is authorized.
export default function UpdatePasswordPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordInput>({ resolver: zodResolver(updatePasswordSchema) });

  const onSubmit = async (values: UpdatePasswordInput) => {
    const res = await updatePassword(values.password);
    if (!res.ok) {
      toast.error(res.error.message || "Could not update your password");
      return;
    }
    toast.success("Password updated");
    navigate("/", { replace: true });
  };

  return (
    <AuthCard title="Set a new password" subtitle="Choose something you will remember.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field
          id="password"
          type="password"
          label="New password"
          autoComplete="new-password"
          autoFocus
          error={errors.password?.message}
          {...register("password")}
        />
        <Field
          id="confirm"
          type="password"
          label="Confirm password"
          autoComplete="new-password"
          error={errors.confirm?.message}
          {...register("confirm")}
        />
        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Update password"}
        </Button>
      </form>
    </AuthCard>
  );
}
