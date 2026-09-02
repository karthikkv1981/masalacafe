import { z } from "zod";

export const eventDetailsSchema = z
  .object({
    customerName: z.string().trim().min(2, "Please enter your name").max(100),
    phone: z.string().trim().min(7, "Please enter a phone number").max(30),
    email: z.string().trim().email("Enter a valid email").max(255),
    eventDate: z.string().trim().min(1, "Pick your event date"),
    eventTime: z.string().trim().min(1, "Pick a preferred time"),
    guestCount: z.coerce.number().int().min(1, "At least 1 guest").max(5000),
    fulfillment: z.enum(["pickup", "delivery"]),
    deliveryAddress: z.string().trim().max(400).optional().or(z.literal("")),
    specialInstructions: z.string().trim().max(1000).optional().or(z.literal("")),
    orderNotes: z.string().trim().max(1000).optional().or(z.literal("")),
  })
  .refine((d) => d.fulfillment !== "delivery" || (d.deliveryAddress ?? "").trim().length > 5, {
    message: "Delivery address is required for delivery",
    path: ["deliveryAddress"],
  });

export type EventDetails = z.infer<typeof eventDetailsSchema>;

const STORAGE_KEY = "saffron-event-details-v1";

export const emptyDetails: EventDetails = {
  customerName: "",
  phone: "",
  email: "",
  eventDate: "",
  eventTime: "",
  guestCount: 25,
  fulfillment: "pickup",
  deliveryAddress: "",
  specialInstructions: "",
  orderNotes: "",
};

export function loadDetails(): EventDetails | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? ({ ...emptyDetails, ...JSON.parse(raw) } as EventDetails) : null;
  } catch {
    return null;
  }
}

export function saveDetails(details: EventDetails) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(details));
}

export function clearDetails() {
  window.localStorage.removeItem(STORAGE_KEY);
}
