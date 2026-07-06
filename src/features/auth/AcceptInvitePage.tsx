import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AuthCard } from "./AuthCard";
import { useAuth } from "./useAuth";
import { acceptInvite } from "@/lib/supabase/auth";

function Spinner() {
  return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-b-transparent" />;
}

export default function AcceptInvitePage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const { isAuthed, isLoading } = useAuth();
  const navigate = useNavigate();
  const [working, setWorking] = useState(false);
  const tried = useRef(false);

  useEffect(() => {
    if (!isAuthed || !token || tried.current) return;
    tried.current = true;
    setWorking(true);
    acceptInvite(token).then((res) => {
      setWorking(false);
      if (res.ok) {
        toast.success("You joined the board");
        navigate(`/b/${res.data}`, { replace: true });
      } else {
        toast.error(res.error.message || "This invite is not valid");
      }
    });
  }, [isAuthed, token, navigate]);

  if (!token) {
    return (
      <AuthCard title="Invalid invite" subtitle="This link is missing its token.">
        <p className="text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">Go to sign in</Link>
        </p>
      </AuthCard>
    );
  }

  if (isLoading || working) {
    return (
      <AuthCard title="Joining board" subtitle="Checking your invite.">
        <Spinner />
      </AuthCard>
    );
  }

  if (!isAuthed) {
    return (
      <AuthCard title="Accept your invite" subtitle="Sign in or create an account to join this board.">
        <div className="space-y-3">
          <Button asChild className="w-full" size="lg">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild variant="outline" className="w-full" size="lg">
            <Link to="/signup">Create account</Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            After signing in, open the invite link again to finish joining.
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Accepting invite" subtitle="One moment.">
      <Spinner />
    </AuthCard>
  );
}
