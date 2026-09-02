import { z } from "zod";
import { eventDetailsSchema } from "./event-details";

export const orderPayloadSchema = z.object({
  details: eventDetailsSchema,
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid(),
        quantity: z.number().int().min(1).max(500),
        addons: z.array(z.string().max(60)).max(10),
        notes: z.string().max(500),
      }),
    )
    .min(1, "Add at least one item")
    .max(100),
});

export type OrderPayload = z.infer<typeof orderPayloadSchema>;
