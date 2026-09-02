import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/70 bg-card/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-display text-base text-foreground">Masala Cafe</span>
          <br />
          South Indian catering for weddings, offices and celebrations.
        </p>
        <div className="flex gap-5">
          <Link to="/" className="transition-colors hover:text-foreground">
            Menu
          </Link>
          <Link to="/cart" className="transition-colors hover:text-foreground">
            Cart
          </Link>
          <Link to="/auth" className="transition-colors hover:text-foreground">
            Staff login
          </Link>
        </div>
      </div>
    </footer>
  );
}
