DELETE FROM public.order_items WHERE order_id IN (SELECT id FROM public.orders WHERE email = 't@example.com');
DELETE FROM public.orders WHERE email = 't@example.com';