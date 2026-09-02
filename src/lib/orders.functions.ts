import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { orderPayloadSchema, type OrderPayload } from "./order-payload";
import { TAX_RATE, SERVICE_FEE_RATE } from "./format";

export const submitOrder = createServerFn({ method: "POST" })
  .inputValidator((input: OrderPayload) => orderPayloadSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ids = data.items.map((i) => i.menuItemId);

    const { data: menuItems, error: menuError } = await supabaseAdmin
      .from("menu_items")
      .select("id, name, price, serving_size, is_available")
      .in("id", ids);
    if (menuError) throw new Error(menuError.message);

    const priced = data.items.map((line) => {
      const item = menuItems?.find((m) => m.id === line.menuItemId);
      if (!item) throw new Error("A selected item is no longer on the menu.");
      if (!item.is_available) throw new Error(`${item.name} is currently unavailable.`);
      return {
        menu_item_id: item.id,
        name: item.name,
        unit_price: Number(item.price),
        quantity: line.quantity,
        serving_size: item.serving_size,
        addons: line.addons.join(", ") || null,
        notes: line.notes || null,
      };
    });

    const subtotal =
      Math.round(priced.reduce((n, i) => n + i.unit_price * i.quantity, 0) * 100) / 100;
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE * 100) / 100;
    const total = Math.round((subtotal + tax + serviceFee) * 100) / 100;
    const d = data.details;

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name: d.customerName,
        phone: d.phone,
        email: d.email,
        event_date: d.eventDate,
        event_time: d.eventTime,
        guest_count: d.guestCount,
        fulfillment: d.fulfillment,
        delivery_address: d.fulfillment === "delivery" ? (d.deliveryAddress ?? null) : null,
        special_instructions: d.specialInstructions || null,
        order_notes: d.orderNotes || null,
        subtotal,
        tax,
        service_fee: serviceFee,
        total,
      })
      .select("id, order_number, total")
      .single();
    if (error || !order) throw new Error(error?.message ?? "Could not save your order.");

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(priced.map((i) => ({ ...i, order_id: order.id })));
    if (itemsError) {
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      throw new Error(itemsError.message);
    }

    return { orderNumber: order.order_number, total: Number(order.total) };
  });

/**
 * Bootstraps the very first staff account as admin. Once an admin exists this
 * becomes a no-op, so it cannot be used to escalate privileges later.
 */
export const claimAdminAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (error) throw new Error(error.message);
    if ((count ?? 0) > 0) return { granted: false };

    const { error: insertError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: context.userId, role: "admin" }, {
        onConflict: "user_id,role",
        ignoreDuplicates: true,
      });
    if (insertError) throw new Error(insertError.message);
    return { granted: true };
  });

