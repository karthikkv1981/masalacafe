import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";

export function SiteHeader() {
  const { itemCount, hydrated } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[image:var(--gradient-warm)] font-display text-lg font-bold text-primary-foreground">
            M
          </span>
          <span className="leading-tight">
            <span className="block font-display text-base font-semibold">Masala Cafe</span>
            <span className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Catering
            </span>
          </span>
        </Link>

        <Link
          to="/cart"
          className="relative inline-flex h-11 items-center gap-2 rounded-full border border-border bg-secondary px-4 text-sm font-semibold transition-colors hover:bg-muted"
          aria-label="View cart"
        >
          <ShoppingBag className="size-4" aria-hidden />
          <span className="hidden sm:inline">Cart</span>
          {hydrated && itemCount > 0 && (
            <span className="grid min-w-6 place-items-center rounded-full bg-primary px-1.5 py-0.5 text-xs font-bold text-primary-foreground">
              {itemCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
