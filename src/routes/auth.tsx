import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChefHat } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Staff Login — Masala Cafe" },
      {
        name: "description",
        content: "Secure login for Masala Cafe staff to manage orders and the menu.",
      },
      { property: "og:title", content: "Staff Login — Masala Cafe" },
      { property: "og:description", content: "Catering team access." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (error) throw error;
        toast.success("Account created. Check your email to confirm, then sign in.");
        setMode("signin");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/admin" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="surface-card w-full max-w-sm rounded-2xl p-7">
        <span className="grid size-12 place-items-center rounded-xl bg-[image:var(--gradient-warm)] text-primary-foreground">
          <ChefHat className="size-6" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl">Staff access</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage catering orders and the menu. Customers don't need an account.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email" className="mb-2 block text-sm font-semibold">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl bg-secondary"
            />
          </div>
          <div>
            <Label htmlFor="password" className="mb-2 block text-sm font-semibold">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl bg-secondary"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={busy}
            className="h-12 w-full rounded-full font-semibold"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create staff account"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {mode === "signin"
            ? "First time? Create the staff account"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
