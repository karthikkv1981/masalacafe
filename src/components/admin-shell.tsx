import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function AdminShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <span className="font-display text-lg font-semibold">Masala Cafe Admin</span>
          <nav className="flex flex-1 gap-1 text-sm">
            <Link
              to="/admin"
              activeOptions={{ exact: true }}
              activeProps={{ className: "bg-secondary text-foreground" }}
              className="rounded-full px-3 py-2 font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Orders
            </Link>
            <Link
              to="/admin/menu"
              activeProps={{ className: "bg-secondary text-foreground" }}
              className="rounded-full px-3 py-2 font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Menu
            </Link>
          </nav>
          <Button variant="ghost" size="sm" onClick={signOut} className="rounded-full">
            <LogOut className="size-4" aria-hidden />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
