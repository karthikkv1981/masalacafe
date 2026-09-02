import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin-shell";
import { supabase } from "@/integrations/supabase/client";
import { claimAdminAccess } from "@/lib/orders.functions";
import { formatDate, money } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

const STATUSES: OrderStatus[] = [
  "new",
  "confirmed",
  "payment_pending",
  "paid",
  "preparing",
  "completed",
  "cancelled",
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  payment_pending: "Payment pending",
  paid: "Paid",
  preparing: "Preparing",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Catering Orders — Masala Cafe Admin" },
      { name: "description", content: "Review, filter and update incoming catering orders." },
      { property: "og:title", content: "Catering Orders — Masala Cafe Admin" },
      { property: "og:description", content: "Internal order management dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminOrders,
});

function AdminOrders() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [fulfillment, setFulfillment] = useState<"all" | "pickup" | "delivery">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    claimAdminAccess({ data: undefined })
      .then((r) => {
        if (r.granted) queryClient.invalidateQueries();
      })
      .catch(() => undefined);
  }, [queryClient]);

  const ordersQuery = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Order updated");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const term = query.trim().toLowerCase();
  const digits = term.replace(/\D/g, "");
  const orders = (ordersQuery.data ?? []).filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (fulfillment !== "all" && o.fulfillment !== fulfillment) return false;
    if (dateFrom && o.event_date < dateFrom) return false;
    if (dateTo && o.event_date > dateTo) return false;
    if (!term) return true;
    const phoneDigits = o.phone.replace(/\D/g, "");
    return (
      o.order_number.toLowerCase().includes(term) ||
      o.customer_name.toLowerCase().includes(term) ||
      o.email.toLowerCase().includes(term) ||
      o.phone.toLowerCase().includes(term) ||
      (digits.length >= 3 && phoneDigits.includes(digits))
    );
  });

  const filtersActive =
    Boolean(term) || fulfillment !== "all" || Boolean(dateFrom) || Boolean(dateTo) || filter !== "all";

  return (
    <AdminShell>
      <h1 className="text-3xl">Orders</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Payment is collected manually — update the status as you confirm and collect.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {(["all", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              filter === s
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {s === "all" ? "All" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="surface-card mt-4 grid gap-3 rounded-2xl p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label htmlFor="order-search" className="text-xs font-semibold text-muted-foreground">
            Search
          </label>
          <input
            id="order-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Order ID, name, phone or email"
            className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="fulfillment" className="text-xs font-semibold text-muted-foreground">
            Fulfillment
          </label>
          <select
            id="fulfillment"
            value={fulfillment}
            onChange={(e) => setFulfillment(e.target.value as typeof fulfillment)}
            className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="pickup">Pickup</option>
            <option value="delivery">Delivery</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="date-from" className="text-xs font-semibold text-muted-foreground">
              Event from
            </label>
            <input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-secondary px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="date-to" className="text-xs font-semibold text-muted-foreground">
              Event to
            </label>
            <input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-secondary px-2 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span>
          {orders.length} {orders.length === 1 ? "order" : "orders"}
          {ordersQuery.isSuccess ? ` of ${ordersQuery.data.length}` : ""}
        </span>
        {filtersActive && (
          <button
            onClick={() => {
              setQuery("");
              setFulfillment("all");
              setDateFrom("");
              setDateTo("");
              setFilter("all");
            }}
            className="font-semibold text-accent hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>


      {ordersQuery.isLoading && <p className="mt-8 text-muted-foreground">Loading orders…</p>}
      {ordersQuery.isError && (
        <p className="mt-8 text-destructive">
          Could not load orders. Your account may not have admin access yet.
        </p>
      )}
      {ordersQuery.isSuccess && orders.length === 0 && (
        <p className="mt-8 text-muted-foreground">No orders in this view yet.</p>
      )}

      <div className="mt-5 space-y-3">
        {orders.map((order) => {
          const open = openId === order.id;
          return (
            <article key={order.id} className="surface-card rounded-2xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-semibold text-primary">
                    {order.order_number}
                  </p>
                  <p className="text-sm font-semibold">{order.customer_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(order.event_date)} · {order.event_time} · {order.guest_count} guests
                    · {order.fulfillment}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl font-semibold">{money(Number(order.total))}</p>
                  <select
                    value={order.status}
                    onChange={(e) =>
                      updateStatus.mutate({
                        id: order.id,
                        status: e.target.value as OrderStatus,
                      })
                    }
                    className="mt-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-semibold"
                    aria-label={`Status for ${order.order_number}`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={() => setOpenId(open ? null : order.id)}
                className="mt-3 text-sm font-semibold text-accent hover:underline"
              >
                {open ? "Hide details" : `View ${order.order_items.length} items & contact`}
              </button>

              {open && (
                <div className="mt-3 space-y-3 border-t border-border pt-3 text-sm">
                  <p className="text-muted-foreground">
                    {order.phone} · {order.email}
                  </p>
                  {order.delivery_address && (
                    <p className="text-muted-foreground">Deliver to: {order.delivery_address}</p>
                  )}
                  {order.special_instructions && (
                    <p className="text-muted-foreground">
                      <span className="font-semibold text-foreground">Requests: </span>
                      {order.special_instructions}
                    </p>
                  )}
                  {order.order_notes && (
                    <p className="text-muted-foreground">
                      <span className="font-semibold text-foreground">Notes: </span>
                      {order.order_notes}
                    </p>
                  )}
                  <ul className="divide-y divide-border">
                    {order.order_items.map((item) => (
                      <li key={item.id} className="flex justify-between gap-4 py-2">
                        <span>
                          {item.quantity} × {item.name}
                          {item.addons && (
                            <span className="block text-xs text-accent">{item.addons}</span>
                          )}
                          {item.notes && (
                            <span className="block text-xs italic text-muted-foreground">
                              {item.notes}
                            </span>
                          )}
                        </span>
                        <span className="font-semibold">
                          {money(Number(item.unit_price) * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-end gap-6 text-xs text-muted-foreground">
                    <span>Subtotal {money(Number(order.subtotal))}</span>
                    <span>Tax {money(Number(order.tax))}</span>
                    <span>Fee {money(Number(order.service_fee))}</span>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </AdminShell>
  );
}
