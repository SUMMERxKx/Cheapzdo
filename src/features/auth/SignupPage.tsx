import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AuthCard } from "./AuthCard";
import { Field } from "./Field";
import { signupSchema, type SignupInput } from "@/lib/supabase/schemas/auth";
import { signUp } from "@/lib/supabase/auth";

export default function SignupPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (values: SignupInput) => {
    const res = await signUp(values);
    if (!res.ok) {
      toast.error(res.error.message || "Could not create your account");
      return;
    }
    if (res.data.needsVerification) {
      navigate("/verify", { replace: true, state: { email: values.email } });
    } else {
      navigate("/", { replace: true });
    }
  };

  return (
    <AuthCard title="Create your account" subtitle="Start planning in arcs.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field
          id="displayName"
          label="Your name"
          autoComplete="name"
          autoFocus
          error={errors.displayName?.message}
          {...register("displayName")}
        />
        <Field
          id="email"
          type="email"
          label="Email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Field
          id="password"
          type="password"
          label="Password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
