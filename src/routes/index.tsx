import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Minus, Plus, Search, ShoppingBag, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";

import heroImage from "@/assets/hero-catering.jpg";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/format";
import { ADDON_OPTIONS, imageForItem } from "@/lib/category-images";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Masala Cafe — South Indian Catering Menu & Ordering" },
      {
        name: "description",
        content:
          "Browse our South Indian catering menu, build your tray-by-tray order and request catering for your event in minutes. Payment arranged after confirmation.",
      },
      { property: "og:title", content: "Masala Cafe — Order South Indian Catering" },
      {
        property: "og:description",
        content:
          "Breakfast, appetizers, biryanis, curries, breads and sweets by the tray. Request your event catering online.",
      },
    ],
  }),
  component: MenuPage,
});

type Category = { id: string; slug: string; name: string; description: string | null };
type MenuItem = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  serving_size: string | null;
  image_url: string | null;
  is_available: boolean;
};

function useMenu() {
  return useQuery({
    queryKey: ["menu"],
    queryFn: async () => {
      const [cats, items] = await Promise.all([
        supabase
          .from("categories")
          .select("id, slug, name, description")
          .order("sort_order"),
        supabase
          .from("menu_items")
          .select("id, category_id, name, description, price, serving_size, image_url, is_available")
          .order("sort_order"),
      ]);
      if (cats.error) throw cats.error;
      if (items.error) throw items.error;
      return {
        categories: (cats.data ?? []) as Category[],
        items: (items.data ?? []).map((i) => ({ ...i, price: Number(i.price) })) as MenuItem[],
      };
    },
  });
}

function MenuPage() {
  const { data, isLoading } = useMenu();
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ item: MenuItem; slug: string } | null>(null);
  const { itemCount, subtotal, hydrated } = useCart();

  const categories = data?.categories ?? [];
  const grouped = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.categories
      .filter((c) => !active || c.slug === active)
      .map((c) => ({
        category: c,
        items: data.items.filter(
          (i) =>
            i.category_id === c.id &&
            (!q || i.name.toLowerCase().includes(q) || (i.description ?? "").toLowerCase().includes(q)),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [data, search, active]);

  return (
    <div className="min-h-screen pb-28">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <img
          src={heroImage}
          alt="South Indian catering buffet with biryani, curries, dosa and sweets"
          width={1920}
          height={1088}
          className="h-[52vh] min-h-[340px] w-full object-cover sm:h-[60vh]"
        />
        <div
          className="absolute inset-0"
          style={{ backgroundImage: "var(--gradient-veil)" }}
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-8">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary backdrop-blur">
            <Sparkles className="size-3" aria-hidden /> Trays for 10–500 guests
          </p>
          <h1 className="max-w-2xl text-4xl leading-[1.05] sm:text-6xl">
            South Indian catering,
            <span className="text-gradient-warm"> ordered in minutes.</span>
          </h1>
          <p className="mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
            Pick your dishes, tell us about your event, and our team confirms availability, final
            pricing and payment with you directly.
          </p>
        </div>
      </section>

      <div className="sticky top-16 z-30 border-b border-border/70 bg-background/90 py-3 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes — biryani, dosa, gulab jamun…"
              className="h-12 rounded-full border-border bg-secondary pl-10 text-base"
              aria-label="Search the catering menu"
            />
          </div>
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            <CategoryChip label="All" isActive={!active} onClick={() => setActive(null)} />
            {categories.map((c) => (
              <CategoryChip
                key={c.id}
                label={c.name}
                isActive={active === c.slug}
                onClick={() => setActive(active === c.slug ? null : c.slug)}
              />
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4">
        {isLoading && (
          <div className="grid gap-4 pt-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))}
          </div>
        )}

        {!isLoading && grouped.length === 0 && (
          <p className="py-16 text-center text-muted-foreground">
            No dishes match “{search}”. Try another search.
          </p>
        )}

        {grouped.map(({ category, items }) => (
          <section key={category.id} className="pt-10" id={category.slug}>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-2xl sm:text-3xl">{category.name}</h2>
              <span className="text-xs text-muted-foreground">{items.length} dishes</span>
            </div>
            {category.description && (
              <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
            )}
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  slug={category.slug}
                  onCustomize={() => setSelected({ item, slug: category.slug })}
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      <SiteFooter />

      {hydrated && itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 p-3 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </p>
              <p className="text-xs text-muted-foreground">Subtotal {money(subtotal)}</p>
            </div>
            <Button asChild size="lg" className="h-12 rounded-full px-6 font-semibold">
              <Link to="/cart">
                <ShoppingBag className="size-4" aria-hidden /> View cart
              </Link>
            </Button>
          </div>
        </div>
      )}

      <CustomizeDialog selected={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function CategoryChip({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
        isActive
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-secondary text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function MenuCard({
  item,
  slug,
  onCustomize,
}: {
  item: MenuItem;
  slug: string;
  onCustomize: () => void;
}) {
  const { addLine, quantityFor } = useCart();
  const inCart = quantityFor(item.id);

  return (
    <article className="surface-card group animate-rise overflow-hidden rounded-2xl transition-transform duration-300 hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={item.image_url ?? imageForItem(item.name, slug)}
          alt={item.name}
          loading="lazy"
          width={1024}
          height={768}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {!item.is_available && (
          <div className="absolute inset-0 grid place-items-center bg-background/75 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Unavailable
          </div>
        )}
        {inCart > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground shadow-[var(--shadow-glow)]">
            {inCart} in cart
          </span>
        )}
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div>
          <h3 className="text-lg leading-snug">{item.name}</h3>
          {item.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
          )}
        </div>
        {item.serving_size && (
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-3.5" aria-hidden /> {item.serving_size}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="font-display text-xl font-semibold text-primary">
            {money(item.price)}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-10 rounded-full"
              disabled={!item.is_available}
              onClick={onCustomize}
            >
              Customize
            </Button>
            <Button
              size="sm"
              className="h-10 rounded-full px-4 font-semibold"
              disabled={!item.is_available}
              onClick={() => {
                addLine({
                  menuItemId: item.id,
                  name: item.name,
                  unitPrice: item.price,
                  servingSize: item.serving_size,
                  categorySlug: slug,
                  quantity: 1,
                  addons: [],
                  notes: "",
                });
                toast.success(`${item.name} added to cart`);
              }}
            >
              <Plus className="size-4" aria-hidden /> Add
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function CustomizeDialog({
  selected,
  onClose,
}: {
  selected: { item: MenuItem; slug: string } | null;
  onClose: () => void;
}) {
  const { addLine } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [addons, setAddons] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const item = selected?.item;

  return (
    <Dialog
      open={Boolean(selected)}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          setQuantity(1);
          setAddons([]);
          setNotes("");
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-md">
        {item && selected && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">{item.name}</DialogTitle>
              <DialogDescription>
                {item.serving_size ?? "Catering tray"} · {money(item.price)} each
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div>
                <p className="mb-2 text-sm font-semibold">Quantity</p>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-11 rounded-full"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="size-4" aria-hidden />
                  </Button>
                  <span className="w-10 text-center font-display text-2xl">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-11 rounded-full"
                    onClick={() => setQuantity((q) => Math.min(500, q + 1))}
                    aria-label="Increase quantity"
                  >
                    <Plus className="size-4" aria-hidden />
                  </Button>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">Add-ons & preferences</p>
                <div className="flex flex-wrap gap-2">
                  {ADDON_OPTIONS.map((option) => {
                    const on = addons.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          setAddons((prev) =>
                            on ? prev.filter((a) => a !== option) : [...prev, option],
                          )
                        }
                        className={cn(
                          "rounded-full border px-3 py-2 text-sm transition-colors",
                          on
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-border bg-secondary text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="item-notes" className="mb-2 block text-sm font-semibold">
                  Notes for the kitchen
                </label>
                <Textarea
                  id="item-notes"
                  value={notes}
                  maxLength={500}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. keep the sambar on the side"
                  className="min-h-20 rounded-xl bg-secondary"
                />
              </div>

              <Button
                size="lg"
                className="h-13 w-full rounded-full text-base font-semibold"
                onClick={() => {
                  addLine({
                    menuItemId: item.id,
                    name: item.name,
                    unitPrice: item.price,
                    servingSize: item.serving_size,
                    categorySlug: selected.slug,
                    quantity,
                    addons,
                    notes,
                  });
                  toast.success(`${quantity} × ${item.name} added`);
                  onClose();
                  setQuantity(1);
                  setAddons([]);
                  setNotes("");
                }}
              >
                Add {quantity} · {money(item.price * quantity)}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
