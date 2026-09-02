import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Info } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { OrderProgress } from "@/components/order-progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/lib/cart";
import { money, totals } from "@/lib/format";
import {
  emptyDetails,
  eventDetailsSchema,
  loadDetails,
  saveDetails,
  type EventDetails,
} from "@/lib/event-details";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Event Details — Masala Cafe" },
      {
        name: "description",
        content:
          "Tell us your event date, guest count and pickup or delivery preference to request catering.",
      },
      { property: "og:title", content: "Event Details — Masala Cafe" },
      {
        property: "og:description",
        content: "Share your event details so our team can confirm your catering order.",
      },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { lines, subtotal, hydrated } = useCart();
  const [values, setValues] = useState<EventDetails>(emptyDetails);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const t = totals(subtotal);

  useEffect(() => {
    const stored = loadDetails();
    if (stored) setValues(stored);
  }, []);

  useEffect(() => {
    if (hydrated && lines.length === 0) navigate({ to: "/cart", replace: true });
  }, [hydrated, lines.length, navigate]);

  const set = <K extends keyof EventDetails>(key: K, value: EventDetails[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = eventDetailsSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    saveDetails(parsed.data);
    navigate({ to: "/review" });
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen pb-16">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 pt-6">
        <OrderProgress current={2} />
        <h1 className="mt-4 text-3xl sm:text-4xl">Event details</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A few details so we can confirm availability and staffing.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
          <div className="surface-card space-y-4 rounded-2xl p-5">
            <Field label="Full name" error={errors["customerName"]} htmlFor="customerName">
              <Input
                id="customerName"
                value={values.customerName}
                maxLength={100}
                autoComplete="name"
                onChange={(e) => set("customerName", e.target.value)}
                className="h-12 rounded-xl bg-secondary"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone number" error={errors["phone"]} htmlFor="phone">
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={30}
                  value={values.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className="h-12 rounded-xl bg-secondary"
                />
              </Field>
              <Field label="Email" error={errors["email"]} htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  maxLength={255}
                  value={values.email}
                  onChange={(e) => set("email", e.target.value)}
                  className="h-12 rounded-xl bg-secondary"
                />
              </Field>
            </div>
          </div>

          <div className="surface-card space-y-4 rounded-2xl p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Event date" error={errors["eventDate"]} htmlFor="eventDate">
                <Input
                  id="eventDate"
                  type="date"
                  min={today}
                  value={values.eventDate}
                  onChange={(e) => set("eventDate", e.target.value)}
                  className="h-12 rounded-xl bg-secondary"
                />
              </Field>
              <Field
                label="Preferred pickup / delivery time"
                error={errors["eventTime"]}
                htmlFor="eventTime"
              >
                <Input
                  id="eventTime"
                  type="time"
                  value={values.eventTime}
                  onChange={(e) => set("eventTime", e.target.value)}
                  className="h-12 rounded-xl bg-secondary"
                />
              </Field>
            </div>
            <Field label="Number of guests" error={errors["guestCount"]} htmlFor="guestCount">
              <Input
                id="guestCount"
                type="number"
                min={1}
                max={5000}
                inputMode="numeric"
                value={values.guestCount}
                onChange={(e) => set("guestCount", Number(e.target.value))}
                className="h-12 rounded-xl bg-secondary"
              />
            </Field>

            <div>
              <p className="mb-2 text-sm font-semibold">How would you like it served?</p>
              <div className="grid grid-cols-2 gap-3">
                {(["pickup", "delivery"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => set("fulfillment", option)}
                    className={cn(
                      "rounded-xl border px-4 py-4 text-sm font-semibold capitalize transition-colors",
                      values.fulfillment === option
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-secondary text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {values.fulfillment === "delivery" && (
              <Field
                label="Delivery address"
                error={errors["deliveryAddress"]}
                htmlFor="deliveryAddress"
              >
                <Textarea
                  id="deliveryAddress"
                  value={values.deliveryAddress ?? ""}
                  maxLength={400}
                  onChange={(e) => set("deliveryAddress", e.target.value)}
                  placeholder="Street, city, state, ZIP + venue name"
                  className="min-h-20 rounded-xl bg-secondary"
                />
              </Field>
            )}
          </div>

          <div className="surface-card space-y-4 rounded-2xl p-5">
            <Field
              label="Special instructions / dietary requests"
              htmlFor="specialInstructions"
              error={errors["specialInstructions"]}
            >
              <Textarea
                id="specialInstructions"
                value={values.specialInstructions ?? ""}
                maxLength={1000}
                onChange={(e) => set("specialInstructions", e.target.value)}
                placeholder="Allergies, Jain preparation, spice level, serving staff needs…"
                className="min-h-24 rounded-xl bg-secondary"
              />
            </Field>
            <Field label="Order notes" htmlFor="orderNotes" error={errors["orderNotes"]}>
              <Textarea
                id="orderNotes"
                value={values.orderNotes ?? ""}
                maxLength={1000}
                onChange={(e) => set("orderNotes", e.target.value)}
                placeholder="Parking, setup time, contact on site…"
                className="min-h-20 rounded-xl bg-secondary"
              />
            </Field>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">No payment today.</span> Payment will
              be arranged separately after your catering order is reviewed and confirmed.
            </p>
          </div>

          <div className="surface-card flex items-center justify-between rounded-2xl p-5">
            <span className="text-sm text-muted-foreground">Estimated total</span>
            <span className="font-display text-2xl font-semibold text-primary">
              {money(t.total)}
            </span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row-reverse">
            <Button type="submit" size="lg" className="h-13 flex-1 rounded-full text-base font-semibold">
              Review order <ArrowRight className="size-4" aria-hidden />
            </Button>
            <Button asChild variant="outline" size="lg" className="h-13 rounded-full">
              <Link to="/cart">Back to cart</Link>
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold">
        {label}
      </Label>
      {children}
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}
