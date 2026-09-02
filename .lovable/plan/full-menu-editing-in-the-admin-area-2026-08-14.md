# Full menu editing in the admin area

Today the Menu admin page can only change price and availability. This adds full create, edit and delete for dishes.

## What you'll be able to do

- **Add a dish**: an "Add dish" button on each category (and a top-level one where you pick the category) opens a form with name, description, price, serving size, category and availability.
- **Edit a dish**: an "Edit" button per row opens the same form pre-filled, so you can fix the name, description, serving size, price, category or ordering — not just the price.
- **Delete a dish**: a "Delete" button with a confirmation step. Past orders keep their item names and prices, so deleting a dish never changes order history.
- Inline price editing and the Available/Hidden toggle stay exactly as they are today.
- Changes show up on the public menu right away; dish photos keep being matched automatically from the dish name.

## Access rules

Only staff accounts with the Admin role can add, edit or delete. Everyone else keeps read-only access to the menu.

## Technical notes

- **Database migration (required first)**: `public.menu_items` currently grants only `SELECT` to `authenticated`, so writes fail even though the admin policy exists. Add `GRANT INSERT, UPDATE, DELETE ON public.menu_items TO authenticated`. The existing "Admins manage menu items" RLS policy (`has_role(auth.uid(),'admin')`) remains the actual gate. No schema change is needed — `order_items.menu_item_id` is already `ON DELETE SET NULL`, and the item name/price are copied onto each order line.
- **UI**: extend `src/routes/_authenticated/admin.menu.tsx`; extract the dish form into `src/components/menu-item-dialog.tsx` (shadcn Dialog + Input/Textarea/Select) and a small delete confirmation (AlertDialog).
- **Data**: keep using the browser Supabase client with react-query mutations (insert / update / delete on `menu_items`), invalidating `["admin-menu"]` and the public menu query on success; toast on success and error.
- New dishes default `sort_order` to the current max in the category + 1, and `is_available` to true.
