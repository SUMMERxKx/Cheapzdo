import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AuthCard } from "./AuthCard";
import { Field } from "./Field";
import { loginSchema, type LoginInput } from "@/lib/supabase/schemas/auth";
import { signIn } from "@/lib/supabase/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginInput) => {
    const res = await signIn(values);
    if (!res.ok) {
      toast.error(res.error.message || "Could not sign you in");
      return;
    }
    navigate("/", { replace: true });
  };

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to your boards.">
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
        <Field
          id="password"
          type="password"
          label="Password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <div className="-mt-1 flex justify-end">
          <Link to="/reset" className="text-xs text-muted-foreground hover:text-foreground">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        New here?{" "}
        <Link to="/signup" className="text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}
