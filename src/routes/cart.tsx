import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Minus, Plus, Trash2, UtensilsCrossed } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { OrderProgress } from "@/components/order-progress";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { money, totals } from "@/lib/format";
import { imageForItem } from "@/lib/category-images";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Catering Cart — Masala Cafe" },
      {
        name: "description",
        content: "Review the dishes and tray quantities in your catering order before checkout.",
      },
      { property: "og:title", content: "Your Catering Cart — Masala Cafe" },
      {
        property: "og:description",
        content: "Adjust quantities and see your estimated catering total.",
      },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, setQuantity, removeLine, subtotal, hydrated } = useCart();
  const t = totals(subtotal);

  return (
    <div className="min-h-screen pb-32">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pt-6">
        <OrderProgress current={1} />
        <h1 className="mt-4 text-3xl sm:text-4xl">Your cart</h1>

        {hydrated && lines.length === 0 && (
          <div className="surface-card mt-8 rounded-2xl p-10 text-center">
            <UtensilsCrossed className="mx-auto size-8 text-muted-foreground" aria-hidden />
            <p className="mt-3 font-display text-xl">Nothing here yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse the menu and add trays for your event.
            </p>
            <Button asChild className="mt-6 h-12 rounded-full px-6 font-semibold">
              <Link to="/">Browse the menu</Link>
            </Button>
          </div>
        )}

        <ul className="mt-6 space-y-3">
          {lines.map((line) => (
            <li key={line.key} className="surface-card flex gap-3 rounded-2xl p-3">
              <img
                src={imageForItem(line.name, line.categorySlug)}
                alt={line.name}
                loading="lazy"
                width={1024}
                height={768}
                className="size-20 shrink-0 rounded-xl object-cover sm:size-24"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold">{line.name}</h2>
                    {line.servingSize && (
                      <p className="text-xs text-muted-foreground">{line.servingSize}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(line.key)}
                    className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                    aria-label={`Remove ${line.name}`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
                {line.addons.length > 0 && (
                  <p className="mt-1 text-xs text-accent">{line.addons.join(" · ")}</p>
                )}
                {line.notes && (
                  <p className="mt-1 line-clamp-2 text-xs italic text-muted-foreground">
                    “{line.notes}”
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-9 rounded-full"
                      onClick={() => setQuantity(line.key, line.quantity - 1)}
                      aria-label={`Decrease ${line.name}`}
                    >
                      <Minus className="size-3.5" aria-hidden />
                    </Button>
                    <span className="w-7 text-center font-semibold">{line.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-9 rounded-full"
                      onClick={() => setQuantity(line.key, line.quantity + 1)}
                      aria-label={`Increase ${line.name}`}
                    >
                      <Plus className="size-3.5" aria-hidden />
                    </Button>
                  </div>
                  <span className="font-display text-lg font-semibold text-primary">
                    {money(line.unitPrice * line.quantity)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {lines.length > 0 && (
          <>
            <div className="surface-card mt-6 space-y-2 rounded-2xl p-5 text-sm">
              <Row label="Subtotal" value={money(t.subtotal)} />
              <Row label="Estimated tax (8.25%)" value={money(t.tax)} />
              <Row label="Service fee (5%)" value={money(t.serviceFee)} />
              <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
                <span className="font-display text-lg">Estimated total</span>
                <span className="font-display text-2xl font-semibold text-primary">
                  {money(t.total)}
                </span>
              </div>
              <p className="pt-1 text-xs text-muted-foreground">
                This is an estimate. Final pricing is confirmed by our team before payment.
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row-reverse">
              <Button asChild size="lg" className="h-13 flex-1 rounded-full text-base font-semibold">
                <Link to="/checkout">
                  Continue to event details <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-13 rounded-full">
                <Link to="/">Add more dishes</Link>
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
