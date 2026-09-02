import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin-shell";
import { MenuItemDialog, type MenuItemDraft } from "@/components/menu-item-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/menu")({
  head: () => ({
    meta: [
      { title: "Menu Management — Masala Cafe Admin" },
      { name: "description", content: "Add, edit and remove dishes across the catering menu." },
      { property: "og:title", content: "Menu Management — Masala Cafe Admin" },
      { property: "og:description", content: "Internal menu management." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminMenu,
});

function emptyDraft(categoryId: string, nextSort: number): MenuItemDraft {
  return {
    category_id: categoryId,
    name: "",
    description: "",
    price: "0",
    serving_size: "",
    sort_order: String(nextSort),
    is_available: true,
  };
}

function AdminMenu() {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDraft, setDialogDraft] = useState<MenuItemDraft | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null);

  const menuQuery = useQuery({
    queryKey: ["admin-menu"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select(
          "id, name, sort_order, menu_items(id, name, description, price, serving_size, is_available, sort_order, category_id)",
        )
        .order("sort_order");
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const categories = (menuQuery.data ?? []).map((c) => ({ id: c.id, name: c.name }));

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["admin-menu"] });
    queryClient.invalidateQueries({ queryKey: ["menu"] });
  }

  const updateItem = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: { price?: number; is_available?: boolean };
    }) => {
      const { error } = await supabase.from("menu_items").update(values).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Menu updated");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveItem = useMutation({
    mutationFn: async (draft: MenuItemDraft) => {
      const values = {
        category_id: draft.category_id,
        name: draft.name,
        description: draft.description.trim() || null,
        price: Number(draft.price),
        serving_size: draft.serving_size.trim() || null,
        sort_order: Number(draft.sort_order) || 0,
        is_available: draft.is_available,
      };
      const { error } = draft.id
        ? await supabase.from("menu_items").update(values).eq("id", draft.id)
        : await supabase.from("menu_items").insert(values);
      if (error) throw new Error(error.message);
      return Boolean(draft.id);
    },
    onSuccess: (wasEdit) => {
      toast.success(wasEdit ? "Dish updated" : "Dish added");
      setDialogOpen(false);
      setDrafts({});
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Dish deleted");
      setDeleting(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openAdd(categoryId?: string) {
    const cat = categoryId ?? categories[0]?.id;
    if (!cat) return;
    const group = (menuQuery.data ?? []).find((c) => c.id === cat);
    const nextSort =
      Math.max(0, ...(group?.menu_items ?? []).map((i) => i.sort_order)) + 1;
    setDialogDraft(emptyDraft(cat, nextSort));
    setDialogOpen(true);
  }

  return (
    <AdminShell>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl">Menu</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add dishes, edit details, adjust pricing and hide anything off the board today.
          </p>
        </div>
        <Button
          className="rounded-full"
          onClick={() => openAdd()}
          disabled={categories.length === 0}
        >
          Add dish
        </Button>
      </div>

      {menuQuery.isLoading && <p className="mt-8 text-muted-foreground">Loading menu…</p>}
      {menuQuery.isError && (
        <p className="mt-8 text-destructive">
          Could not load the menu. Your account may not have admin access yet.
        </p>
      )}

      <div className="mt-6 space-y-6">
        {(menuQuery.data ?? []).map((category) => (
          <section key={category.id} className="surface-card rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl">{category.name}</h2>
              <button
                onClick={() => openAdd(category.id)}
                className="text-sm font-semibold text-accent hover:underline"
              >
                + Add dish
              </button>
            </div>
            <ul className="mt-3 divide-y divide-border">
              {[...category.menu_items]
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((item) => {
                  const draft = drafts[item.id];
                  const dirty = draft !== undefined && Number(draft) !== Number(item.price);
                  return (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-40 flex-1">
                        <p className="text-sm font-semibold">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Current {money(Number(item.price))}
                          {item.serving_size ? ` · ${item.serving_size}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={draft ?? String(item.price)}
                          onChange={(e) =>
                            setDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          className="h-10 w-28 rounded-xl bg-secondary"
                          aria-label={`Price for ${item.name}`}
                        />
                        <Button
                          size="sm"
                          className="rounded-full"
                          disabled={!dirty || updateItem.isPending}
                          onClick={() =>
                            updateItem.mutate({
                              id: item.id,
                              values: { price: Number(draft) },
                            })
                          }
                        >
                          Save
                        </Button>
                        <button
                          onClick={() =>
                            updateItem.mutate({
                              id: item.id,
                              values: { is_available: !item.is_available },
                            })
                          }
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                            item.is_available
                              ? "border-accent/50 bg-accent/15 text-accent"
                              : "border-border bg-secondary text-muted-foreground",
                          )}
                        >
                          {item.is_available ? "Available" : "Hidden"}
                        </button>
                        <button
                          onClick={() => {
                            setDialogDraft({
                              id: item.id,
                              category_id: item.category_id,
                              name: item.name,
                              description: item.description ?? "",
                              price: String(item.price),
                              serving_size: item.serving_size ?? "",
                              sort_order: String(item.sort_order),
                              is_available: item.is_available,
                            });
                            setDialogOpen(true);
                          }}
                          className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleting({ id: item.id, name: item.name })}
                          className="rounded-full border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  );
                })}
              {category.menu_items.length === 0 && (
                <li className="py-3 text-sm text-muted-foreground">No dishes in this category.</li>
              )}
            </ul>
          </section>
        ))}
      </div>

      {dialogDraft && (
        <MenuItemDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          categories={categories}
          initial={dialogDraft}
          pending={saveItem.isPending}
          onSubmit={(d) => saveItem.mutate(d)}
        />
      )}

      <AlertDialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              It will disappear from the public menu. Past orders keep their saved item names and
              prices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteItem.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deleting) deleteItem.mutate(deleting.id);
              }}
              disabled={deleteItem.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
