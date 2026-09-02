import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export type MenuItemDraft = {
  id?: string;
  category_id: string;
  name: string;
  description: string;
  price: string;
  serving_size: string;
  sort_order: string;
  is_available: boolean;
};

type CategoryOption = { id: string; name: string };

export function MenuItemDialog({
  open,
  onOpenChange,
  categories,
  initial,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryOption[];
  initial: MenuItemDraft;
  pending: boolean;
  onSubmit: (draft: MenuItemDraft) => void;
}) {
  const [draft, setDraft] = useState<MenuItemDraft>(initial);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(initial);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const editing = Boolean(initial.id);

  function submit() {
    if (!draft.name.trim()) return setError("Give the dish a name.");
    if (!draft.category_id) return setError("Pick a category.");
    const price = Number(draft.price);
    if (!Number.isFinite(price) || price < 0) return setError("Enter a valid price.");
    setError(null);
    onSubmit({ ...draft, name: draft.name.trim() });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {editing ? "Edit dish" : "Add dish"}
          </DialogTitle>
          <DialogDescription>
            Changes appear on the public menu as soon as you save.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="dish-name">Name</Label>
            <Input
              id="dish-name"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Masala Dosa"
              className="bg-secondary"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dish-category">Category</Label>
            <select
              id="dish-category"
              value={draft.category_id}
              onChange={(e) => setDraft((d) => ({ ...d, category_id: e.target.value }))}
              className="h-10 w-full rounded-md border border-input bg-secondary px-3 text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dish-description">Description</Label>
            <Textarea
              id="dish-description"
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="Crisp rice crepe with spiced potato masala."
              className="bg-secondary"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dish-price">Price</Label>
              <Input
                id="dish-price"
                type="number"
                min={0}
                step="0.01"
                value={draft.price}
                onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
                className="bg-secondary"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dish-serving">Serving size</Label>
              <Input
                id="dish-serving"
                value={draft.serving_size}
                onChange={(e) => setDraft((d) => ({ ...d, serving_size: e.target.value }))}
                placeholder="Serves 10"
                className="bg-secondary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 items-end gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dish-sort">Sort order</Label>
              <Input
                id="dish-sort"
                type="number"
                step="1"
                value={draft.sort_order}
                onChange={(e) => setDraft((d) => ({ ...d, sort_order: e.target.value }))}
                className="bg-secondary"
              />
            </div>
            <div className="flex items-center gap-3 pb-2">
              <Switch
                id="dish-available"
                checked={draft.is_available}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, is_available: v }))}
              />
              <Label htmlFor="dish-available">Available</Label>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending} className="rounded-full">
            {pending ? "Saving…" : editing ? "Save changes" : "Add dish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
