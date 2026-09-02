create type public.app_role as enum ('admin','user');
create type public.order_status as enum ('new','confirmed','payment_pending','paid','preparing','completed','cancelled');
create type public.fulfillment_type as enum ('pickup','delivery');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users can read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "Anyone can view active categories" on public.categories for select to anon, authenticated using (is_active);
create policy "Admins manage categories" on public.categories for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  serving_size text,
  image_url text,
  is_available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.menu_items to anon, authenticated;
grant all on public.menu_items to service_role;
alter table public.menu_items enable row level security;
create policy "Anyone can view menu items" on public.menu_items for select to anon, authenticated using (true);
create policy "Admins manage menu items" on public.menu_items for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create sequence public.order_number_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('CAT-' || nextval('public.order_number_seq')::text),
  status public.order_status not null default 'new',
  customer_name text not null,
  phone text not null,
  email text not null,
  event_date date not null,
  event_time text not null,
  guest_count int not null default 0,
  fulfillment public.fulfillment_type not null default 'pickup',
  delivery_address text,
  special_instructions text,
  order_notes text,
  subtotal numeric(10,2) not null default 0,
  tax numeric(10,2) not null default 0,
  service_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  internal_notes text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant all on public.orders to service_role;
grant select, update on public.orders to authenticated;
alter table public.orders enable row level security;
create policy "Admins view orders" on public.orders for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "Admins update orders" on public.orders for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name text not null,
  unit_price numeric(10,2) not null default 0,
  quantity int not null default 1,
  serving_size text,
  addons text,
  notes text,
  created_at timestamptz not null default now()
);
grant all on public.order_items to service_role;
grant select on public.order_items to authenticated;
alter table public.order_items enable row level security;
create policy "Admins view order items" on public.order_items for select to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();
create trigger menu_items_updated_at before update on public.menu_items for each row execute function public.set_updated_at();

insert into public.categories (slug, name, description, sort_order) values
  ('breakfast','Breakfast','Traditional South Indian morning classics',1),
  ('appetizers','Appetizers','Crispy, savory starters to open the meal',2),
  ('rice','Rice','Fragrant rice preparations and biryanis',3),
  ('curries','Curries & Entrées','Slow-simmered gravies, dals and vegetables',4),
  ('breads','Breads','Fresh griddled and tandoor breads',5),
  ('indo-chinese','Indo-Chinese','Wok-tossed favorites with a spicy kick',6),
  ('desserts','Desserts','Sweets to finish the celebration',7),
  ('drinks','Drinks','Traditional coolers and hot brews',8);

insert into public.menu_items (category_id, name, description, price, serving_size, sort_order) values
  ((select id from public.categories where slug='breakfast'),'Idli','Steamed rice-and-lentil cakes, soft and pillowy.',45,'Serves 10-12 (30 pcs)',1),
  ((select id from public.categories where slug='breakfast'),'Mini Idli with Sambar','Bite-size idlis soaked in fragrant sambar.',55,'Serves 10-12',2),
  ((select id from public.categories where slug='breakfast'),'Medu Vada','Crisp urad dal donuts, golden outside and fluffy inside.',50,'Serves 10-12 (25 pcs)',3),
  ((select id from public.categories where slug='breakfast'),'Pongal','Creamy rice and moong dal with pepper, cumin and ghee.',55,'Serves 10-12',4),
  ((select id from public.categories where slug='breakfast'),'Upma','Savory semolina with curry leaves, cashews and ginger.',45,'Serves 10-12',5),
  ((select id from public.categories where slug='breakfast'),'Rava Kichadi','Semolina cooked with vegetables and warm spices.',50,'Serves 10-12',6),
  ((select id from public.categories where slug='breakfast'),'Poori with Potato Masala','Puffed fried bread with spiced potato masala.',65,'Serves 10-12 (30 pcs)',7),
  ((select id from public.categories where slug='breakfast'),'Dosa / Masala Dosa','Crisp fermented crepes, plain or potato-filled.',70,'Serves 10-12 (20 pcs)',8),
  ((select id from public.categories where slug='breakfast'),'Rava Dosa','Lacy semolina crepes with onion, chili and cumin.',70,'Serves 10-12 (20 pcs)',9),
  ((select id from public.categories where slug='breakfast'),'Pesarattu','Green moong dal crepes with ginger and green chili.',65,'Serves 10-12 (20 pcs)',10),
  ((select id from public.categories where slug='breakfast'),'Appam with Vegetable Stew','Lacy coconut hoppers with a mild coconut-milk stew.',80,'Serves 10-12',11),
  ((select id from public.categories where slug='breakfast'),'Idiyappam with Kurma','Steamed string hoppers with vegetable kurma.',75,'Serves 10-12',12),
  ((select id from public.categories where slug='breakfast'),'Sambar','Tamarind-lentil stew with vegetables and fresh masala.',40,'Serves 10-12 (half tray)',13),
  ((select id from public.categories where slug='breakfast'),'Coconut Chutney','Fresh coconut ground with green chili and ginger.',25,'Serves 10-12 (quart)',14),
  ((select id from public.categories where slug='breakfast'),'Tomato Chutney','Tangy roasted tomato chutney with garlic.',25,'Serves 10-12 (quart)',15),
  ((select id from public.categories where slug='breakfast'),'Mint Chutney','Bright mint-cilantro chutney.',25,'Serves 10-12 (quart)',16),
  ((select id from public.categories where slug='appetizers'),'Vegetable Samosa','Flaky pastry filled with spiced potatoes and peas.',48,'25 pieces',1),
  ((select id from public.categories where slug='appetizers'),'Medu Vada','Crisp urad dal donuts served with chutney.',50,'25 pieces',2),
  ((select id from public.categories where slug='appetizers'),'Masala Vada','Crunchy chana dal fritters with fennel and curry leaf.',45,'25 pieces',3),
  ((select id from public.categories where slug='appetizers'),'Onion Pakoda','Shredded onion fritters, crisp and peppery.',42,'Serves 10-12',4),
  ((select id from public.categories where slug='appetizers'),'Vegetable Pakoda','Mixed vegetable fritters in spiced chickpea batter.',42,'Serves 10-12',5),
  ((select id from public.categories where slug='appetizers'),'Gobi 65','Fiery batter-fried cauliflower with curry leaves.',55,'Serves 10-12',6),
  ((select id from public.categories where slug='appetizers'),'Gobi Manchurian','Crisp cauliflower tossed in tangy Manchurian sauce.',58,'Serves 10-12',7),
  ((select id from public.categories where slug='appetizers'),'Chilli Paneer','Paneer wok-tossed with peppers and chili sauce.',68,'Serves 10-12',8),
  ((select id from public.categories where slug='appetizers'),'Paneer 65','Spiced fried paneer with yogurt-chili marinade.',68,'Serves 10-12',9),
  ((select id from public.categories where slug='appetizers'),'Baby Corn 65','Crunchy baby corn in a bold south-Indian spice coat.',60,'Serves 10-12',10),
  ((select id from public.categories where slug='appetizers'),'Cutlet','Golden vegetable patties with breadcrumb crust.',50,'25 pieces',11),
  ((select id from public.categories where slug='appetizers'),'Mini Masala Dosa','Cocktail-size masala dosas, perfect for passing.',65,'30 pieces',12),
  ((select id from public.categories where slug='rice'),'Steamed Rice','Fluffy long-grain basmati.',30,'Serves 10-12 (half tray)',1),
  ((select id from public.categories where slug='rice'),'Jeera Rice','Basmati tempered with cumin and ghee.',38,'Serves 10-12 (half tray)',2),
  ((select id from public.categories where slug='rice'),'Lemon Rice','Turmeric rice with lemon, peanuts and curry leaf.',42,'Serves 10-12 (half tray)',3),
  ((select id from public.categories where slug='rice'),'Tamarind Rice / Puliyodarai','Tangy tamarind rice with roasted spices.',45,'Serves 10-12 (half tray)',4),
  ((select id from public.categories where slug='rice'),'Coconut Rice','Rice tossed with fresh coconut and cashews.',45,'Serves 10-12 (half tray)',5),
  ((select id from public.categories where slug='rice'),'Tomato Rice','Rice simmered with tomato and garam masala.',44,'Serves 10-12 (half tray)',6),
  ((select id from public.categories where slug='rice'),'Curd Rice','Cooling yogurt rice with tempering and pomegranate.',40,'Serves 10-12 (half tray)',7),
  ((select id from public.categories where slug='rice'),'Vegetable Biryani','Layered basmati with vegetables, saffron and fried onion.',75,'Serves 10-12 (half tray)',8),
  ((select id from public.categories where slug='rice'),'Mushroom Biryani','Aromatic biryani with earthy mushrooms.',82,'Serves 10-12 (half tray)',9),
  ((select id from public.categories where slug='rice'),'Paneer Biryani','Rich biryani with marinated paneer cubes.',88,'Serves 10-12 (half tray)',10),
  ((select id from public.categories where slug='curries'),'Vegetable Kurma','Coconut-cashew gravy with mixed vegetables.',58,'Serves 10-12 (half tray)',1),
  ((select id from public.categories where slug='curries'),'Mixed Vegetable Curry','Seasonal vegetables in a light spiced gravy.',55,'Serves 10-12 (half tray)',2),
  ((select id from public.categories where slug='curries'),'Potato Peas Curry','Homestyle potato and pea masala.',50,'Serves 10-12 (half tray)',3),
  ((select id from public.categories where slug='curries'),'Chana Masala','Chickpeas simmered in onion-tomato masala.',52,'Serves 10-12 (half tray)',4),
  ((select id from public.categories where slug='curries'),'Dal Tadka','Yellow lentils finished with ghee-garlic tempering.',48,'Serves 10-12 (half tray)',5),
  ((select id from public.categories where slug='curries'),'Dal Fry','Creamy lentils with onion, tomato and cumin.',48,'Serves 10-12 (half tray)',6),
  ((select id from public.categories where slug='curries'),'Sambar','Classic lentil-tamarind stew with vegetables.',42,'Serves 10-12 (half tray)',7),
  ((select id from public.categories where slug='curries'),'Rasam','Peppery tamarind broth with tomato and garlic.',38,'Serves 10-12 (half tray)',8),
  ((select id from public.categories where slug='curries'),'Kara Kuzhambu','Bold tamarind gravy with roasted spice blend.',52,'Serves 10-12 (half tray)',9),
  ((select id from public.categories where slug='curries'),'Mor Kuzhambu','Gentle yogurt curry with coconut and cumin.',48,'Serves 10-12 (half tray)',10),
  ((select id from public.categories where slug='curries'),'Avial','Kerala mixed vegetables in coconut and yogurt.',58,'Serves 10-12 (half tray)',11),
  ((select id from public.categories where slug='curries'),'Kootu','Lentil and vegetable stew with fresh coconut.',50,'Serves 10-12 (half tray)',12),
  ((select id from public.categories where slug='curries'),'Poriyal','Dry-sautéed vegetables with mustard and coconut.',45,'Serves 10-12 (half tray)',13),
  ((select id from public.categories where slug='curries'),'Paneer Butter Masala','Paneer in a silky tomato-butter gravy.',78,'Serves 10-12 (half tray)',14),
  ((select id from public.categories where slug='curries'),'Palak Paneer','Paneer folded into creamy spinach.',75,'Serves 10-12 (half tray)',15),
  ((select id from public.categories where slug='curries'),'Kadai Paneer','Paneer and peppers in freshly ground kadai masala.',78,'Serves 10-12 (half tray)',16),
  ((select id from public.categories where slug='breads'),'Chapati','Soft whole-wheat flatbread.',30,'25 pieces',1),
  ((select id from public.categories where slug='breads'),'Poori','Puffed golden fried bread.',35,'30 pieces',2),
  ((select id from public.categories where slug='breads'),'Parotta','Flaky layered Malabar parotta.',40,'25 pieces',3),
  ((select id from public.categories where slug='breads'),'Naan','Pillowy tandoor-style naan.',38,'25 pieces',4),
  ((select id from public.categories where slug='breads'),'Garlic Naan','Naan brushed with garlic and cilantro.',44,'25 pieces',5),
  ((select id from public.categories where slug='indo-chinese'),'Vegetable Fried Rice','Wok-tossed rice with crisp vegetables.',52,'Serves 10-12 (half tray)',1),
  ((select id from public.categories where slug='indo-chinese'),'Schezwan Fried Rice','Fiery Schezwan-spiced fried rice.',56,'Serves 10-12 (half tray)',2),
  ((select id from public.categories where slug='indo-chinese'),'Hakka Noodles','Stir-fried noodles with julienned vegetables.',54,'Serves 10-12 (half tray)',3),
  ((select id from public.categories where slug='indo-chinese'),'Gobi Manchurian','Cauliflower in glossy Manchurian sauce.',58,'Serves 10-12 (half tray)',4),
  ((select id from public.categories where slug='indo-chinese'),'Chilli Paneer','Paneer, onion and pepper in chili sauce.',68,'Serves 10-12 (half tray)',5),
  ((select id from public.categories where slug='indo-chinese'),'Chilli Baby Corn','Baby corn tossed with garlic and chili.',62,'Serves 10-12 (half tray)',6),
  ((select id from public.categories where slug='desserts'),'Gulab Jamun','Warm milk dumplings soaked in rose syrup.',45,'30 pieces',1),
  ((select id from public.categories where slug='desserts'),'Rasmalai','Soft cheese discs in saffron-cardamom milk.',55,'24 pieces',2),
  ((select id from public.categories where slug='desserts'),'Carrot Halwa','Slow-cooked carrots with milk, ghee and nuts.',50,'Serves 10-12',3),
  ((select id from public.categories where slug='desserts'),'Badam Halwa','Rich almond halwa with saffron.',65,'Serves 10-12',4),
  ((select id from public.categories where slug='desserts'),'Kesari','Saffron semolina pudding with ghee-fried cashews.',40,'Serves 10-12',5),
  ((select id from public.categories where slug='desserts'),'Payasam','Classic milk pudding with cardamom.',45,'Serves 10-12',6),
  ((select id from public.categories where slug='desserts'),'Semiya Payasam','Vermicelli payasam with raisins and cashews.',45,'Serves 10-12',7),
  ((select id from public.categories where slug='desserts'),'Paal Payasam','Creamy slow-simmered rice and milk pudding.',50,'Serves 10-12',8),
  ((select id from public.categories where slug='desserts'),'Sweet Pongal','Jaggery rice pudding with ghee and cashews.',48,'Serves 10-12',9),
  ((select id from public.categories where slug='desserts'),'Mysore Pak','Melt-in-mouth gram flour and ghee fudge.',42,'2 lb tray',10),
  ((select id from public.categories where slug='desserts'),'Laddu','Golden boondi laddus.',40,'30 pieces',11),
  ((select id from public.categories where slug='drinks'),'Filter Coffee','Strong South Indian decoction coffee with milk.',35,'Serves 10-12 (1 gallon)',1),
  ((select id from public.categories where slug='drinks'),'Masala Tea','Spiced chai brewed with ginger and cardamom.',32,'Serves 10-12 (1 gallon)',2),
  ((select id from public.categories where slug='drinks'),'Mango Lassi','Sweet mango yogurt drink.',45,'Serves 10-12 (1 gallon)',3),
  ((select id from public.categories where slug='drinks'),'Rose Milk','Chilled rose-flavored milk.',38,'Serves 10-12 (1 gallon)',4),
  ((select id from public.categories where slug='drinks'),'Badam Milk','Almond-saffron milk, served warm or chilled.',42,'Serves 10-12 (1 gallon)',5),
  ((select id from public.categories where slug='drinks'),'Buttermilk','Spiced chaas with curry leaf and ginger.',30,'Serves 10-12 (1 gallon)',6),
  ((select id from public.categories where slug='drinks'),'Fresh Lime Juice','Fresh-squeezed limeade, sweet or salted.',30,'Serves 10-12 (1 gallon)',7);