import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Mail, PhoneCall } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

type ConfirmationSearch = { order?: string | undefined };

export const Route = createFileRoute("/confirmation")({
  validateSearch: (search: Record<string, unknown>): ConfirmationSearch => ({
    order: typeof search["order"] === "string" ? search["order"] : undefined,
  }),

  head: () => ({
    meta: [
      { title: "Order Received — Masala Cafe" },
      {
        name: "description",
        content:
          "Your catering request has been received. Our team will confirm availability, final pricing and payment.",
      },
      { property: "og:title", content: "Order Received — Masala Cafe" },
      {
        property: "og:description",
        content: "Thanks for your catering request. We'll be in touch shortly.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const { order } = Route.useSearch();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-4 pt-12 text-center">
        <div className="animate-rise">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-accent/15 text-accent">
            <CheckCircle2 className="size-9" aria-hidden />
          </span>
          <h1 className="mt-5 text-3xl sm:text-4xl">Order received</h1>
          <p className="mt-2 text-muted-foreground">
            Thank you — your catering request is in our queue.
          </p>

          {order && (
            <div className="surface-card mx-auto mt-6 rounded-2xl p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Order number
              </p>
              <p className="mt-1 font-display text-3xl font-semibold text-primary">{order}</p>
            </div>
          )}

          <div className="surface-card mt-4 space-y-3 rounded-2xl p-6 text-left text-sm">
            <p className="text-muted-foreground">
              Our catering team will contact you shortly to confirm{" "}
              <span className="font-semibold text-foreground">availability</span>,{" "}
              <span className="font-semibold text-foreground">final pricing</span> and{" "}
              <span className="font-semibold text-foreground">payment</span>. Nothing has been
              charged — payment is arranged separately once your order is confirmed.
            </p>
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <PhoneCall className="size-4 text-primary" aria-hidden /> Expect a call within one
              business day
            </div>
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Mail className="size-4 text-primary" aria-hidden /> A written confirmation follows by
              email
            </div>
          </div>

          <Button asChild size="lg" className="mt-6 h-13 rounded-full px-8 font-semibold">
            <Link to="/">Back to the menu</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
