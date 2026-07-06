import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthCard } from "./AuthCard";
import { useAuth } from "./useAuth";
import { resendVerification } from "@/lib/supabase/auth";

export default function VerifyEmailPage() {
  const { isAuthed } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;
  const [sending, setSending] = useState(false);

  // Clicking the email link establishes a session, which flips us to authed.
  useEffect(() => {
    if (isAuthed) navigate("/", { replace: true });
  }, [isAuthed, navigate]);

  const resend = async () => {
    if (!email) {
      toast.error("Start from the sign up screen so we know your email");
      return;
    }
    setSending(true);
    const res = await resendVerification(email);
    setSending(false);
    if (res.ok) toast.success("Verification email sent");
    else toast.error(res.error.message);
  };

  return (
    <AuthCard
      title="Check your inbox"
      subtitle={email ? `We sent a verification link to ${email}.` : "We sent you a verification link."}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/50 p-4">
          <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            Click the link in the email to activate your account. You will land back
            here automatically.
          </p>
        </div>
        <Button variant="outline" className="w-full" onClick={resend} disabled={sending}>
          {sending ? "Sending…" : "Resend email"}
        </Button>
        <p className="text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
