export const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

export const TAX_RATE = 0.0825;
export const SERVICE_FEE_RATE = 0.05;

export function totals(subtotal: number) {
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE * 100) / 100;
  return { subtotal, tax, serviceFee, total: Math.round((subtotal + tax + serviceFee) * 100) / 100 };
}

export const STATUS_LABELS: Record<string, string> = {
  new: "New",
  confirmed: "Confirmed",
  payment_pending: "Payment Pending",
  paid: "Paid",
  preparing: "Preparing",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const STATUS_FLOW = [
  "new",
  "confirmed",
  "payment_pending",
  "paid",
  "preparing",
  "completed",
  "cancelled",
] as const;

export function formatDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return value;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
