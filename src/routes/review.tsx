import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CalendarDays, Info, MapPin, Users } from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { OrderProgress } from "@/components/order-progress";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatDate, money, totals } from "@/lib/format";
import { clearDetails, loadDetails, type EventDetails } from "@/lib/event-details";
import { submitOrder } from "@/lib/orders.functions";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Review Your Catering Order — Masala Cafe" },
      {
        name: "description",
        content: "Check your dishes, event details and estimated total before submitting.",
      },
      { property: "og:title", content: "Review Your Catering Order" },
      {
        property: "og:description",
        content: "Confirm your catering request before our team reaches out.",
      },
    ],
  }),
  component: ReviewPage,
});

function ReviewPage() {
  const navigate = useNavigate();
  const { lines, subtotal, clear, hydrated } = useCart();
  const [details, setDetails] = useState<EventDetails | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const t = totals(subtotal);
  const submit = useServerFn(submitOrder);

  useEffect(() => {
    if (submitted) return;
    const stored = loadDetails();
    if (!stored) {
      navigate({ to: "/checkout", replace: true });
      return;
    }
    setDetails(stored);
  }, [navigate, submitted]);

  useEffect(() => {
    if (submitted) return;
    if (hydrated && lines.length === 0) navigate({ to: "/cart", replace: true });
  }, [hydrated, lines.length, navigate, submitted]);


  const mutation = useMutation({
    mutationFn: async () => {
      if (!details) throw new Error("Missing event details");
      return submit({
        data: {
          details,
          items: lines.map((l) => ({
            menuItemId: l.menuItemId,
            quantity: l.quantity,
            addons: l.addons,
            notes: l.notes,
          })),
        },
      });
    },
    onSuccess: (result) => {
      setSubmitted(true);
      clear();
      clearDetails();
      navigate({ to: "/confirmation", search: { order: result.orderNumber } });
    },

    onError: (error: Error) =>
      toast.error(error.message || "We couldn't submit your order. Please try again."),
  });

  if (!details) return null;

  return (
    <div className="min-h-screen pb-16">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 pt-6">
        <OrderProgress current={3} />
        <h1 className="mt-4 text-3xl sm:text-4xl">Review your order</h1>

        <section className="surface-card mt-6 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg">Event</h2>
            <Link to="/checkout" className="text-sm font-semibold text-primary hover:underline">
              Edit
            </Link>
          </div>
          <dl className="mt-3 space-y-2 text-sm">
            <InfoRow icon={<CalendarDays className="size-4" aria-hidden />}>
              {formatDate(details.eventDate)} at {details.eventTime}
            </InfoRow>
            <InfoRow icon={<Users className="size-4" aria-hidden />}>
              {details.guestCount} guests
            </InfoRow>
            <InfoRow icon={<MapPin className="size-4" aria-hidden />}>
              {details.fulfillment === "delivery"
                ? `Delivery — ${details.deliveryAddress}`
                : "Pickup at our kitchen"}
            </InfoRow>
          </dl>
          <div className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">{details.customerName}</p>
            <p>
              {details.phone} · {details.email}
            </p>
            {details.specialInstructions && (
              <p className="mt-2">
                <span className="font-semibold text-foreground">Special requests: </span>
                {details.specialInstructions}
              </p>
            )}
            {details.orderNotes && (
              <p className="mt-1">
                <span className="font-semibold text-foreground">Notes: </span>
                {details.orderNotes}
              </p>
            )}
          </div>
        </section>

        <section className="surface-card mt-4 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg">Items ({lines.length})</h2>
            <Link to="/cart" className="text-sm font-semibold text-primary hover:underline">
              Edit
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-border">
            {lines.map((line) => (
              <li key={line.key} className="flex justify-between gap-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {line.quantity} × {line.name}
                  </p>
                  {line.servingSize && (
                    <p className="text-xs text-muted-foreground">{line.servingSize}</p>
                  )}
                  {line.addons.length > 0 && (
                    <p className="text-xs text-accent">{line.addons.join(" · ")}</p>
                  )}
                  {line.notes && (
                    <p className="text-xs italic text-muted-foreground">“{line.notes}”</p>
                  )}
                </div>
                <span className="shrink-0 font-semibold">
                  {money(line.unitPrice * line.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
            <Row label="Subtotal" value={money(t.subtotal)} />
            <Row label="Estimated tax (8.25%)" value={money(t.tax)} />
            <Row label="Service fee (5%)" value={money(t.serviceFee)} />
            <div className="flex items-center justify-between pt-2">
              <span className="font-display text-lg">Estimated total</span>
              <span className="font-display text-2xl font-semibold text-primary">
                {money(t.total)}
              </span>
            </div>
          </div>
        </section>

        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">
              Payment will be arranged separately
            </span>{" "}
            after your catering order is reviewed and confirmed. No card is charged now.
          </p>
        </div>

        <Button
          size="lg"
          className="mt-5 h-14 w-full rounded-full text-base font-semibold"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? "Submitting…" : "Submit catering request"}
        </Button>
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

function InfoRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-muted-foreground">
      <span className="mt-0.5 text-primary">{icon}</span>
      <span className="text-foreground">{children}</span>
    </div>
  );
}
