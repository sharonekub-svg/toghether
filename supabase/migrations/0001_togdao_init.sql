-- ============================================================
-- תוגדאו (Togdao) — initial schema
-- Group ordering for a building's neighbors: one shared cart per
-- store, split delivery, escrow (manual-capture) payments.
-- Mirrors the app's data model: buildings, profiles, stores,
-- products, orders, participants, order_items, invites, payments.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- enums ----------
do $$ begin
  create type order_status as enum
    ('collecting', 'accepted', 'packing', 'ready', 'shipped', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type participant_status as enum ('joined', 'paid', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('authorized', 'captured', 'refunded', 'failed');
exception when duplicate_object then null; end $$;

-- ---------- buildings: aggregate neighbors by physical address ----------
create table public.buildings (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  street text not null,
  building_number text not null,
  created_at timestamptz not null default now(),
  unique (city, street, building_number)
);

-- ---------- profiles (extends auth.users) ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  phone text,
  building_id uuid references public.buildings (id) on delete set null,
  apt text,
  created_at timestamptz not null default now()
);
create index profiles_building_idx on public.profiles (building_id);

-- ---------- stores (merchant catalog owners) ----------
create table public.stores (
  id text primary key,           -- 'hm' | 'zara' | 'amazon' | 'shufersal'
  name text not null,
  logo text not null,
  accent text not null,
  tagline text,
  eta text,
  delivery_fee int not null default 25,
  free_shipping_goal int not null default 400
);

-- ---------- products ----------
create table public.products (
  id text primary key,
  store_id text not null references public.stores (id) on delete cascade,
  name text not null,
  emoji text default '🛍️',
  category text,
  price int not null check (price >= 0),
  compare_at_price int,
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  stock_status text not null default 'ok' check (stock_status in ('ok', 'low', 'last')),
  created_at timestamptz not null default now()
);
create index products_store_idx on public.products (store_id);

-- ---------- orders: one shared group cart ----------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                 -- 4-digit join code
  store_id text not null references public.stores (id),
  building_id uuid references public.buildings (id),
  created_by uuid not null references public.profiles (id),
  status order_status not null default 'collecting',
  delivery_address text not null default '',
  closes_at timestamptz not null,            -- cart timer
  delivery_confirmed_at timestamptz,         -- founder confirms receipt -> escrow release
  created_at timestamptz not null default now()
);
create index orders_store_idx on public.orders (store_id);
create index orders_building_idx on public.orders (building_id);
create index orders_status_idx on public.orders (status);

-- ---------- participants: membership per order ----------
create table public.participants (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status participant_status not null default 'joined',
  joined_at timestamptz not null default now(),
  unique (order_id, user_id)
);
create index participants_order_idx on public.participants (order_id);

-- ---------- order_items: each neighbor's picks in the shared cart ----------
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  participant_id uuid not null references public.participants (id) on delete cascade,
  product_id text not null references public.products (id),
  size text,
  color text,
  quantity int not null default 1 check (quantity between 1 and 20),
  is_private boolean not null default false,  -- neighbors see "a private item", not what
  created_at timestamptz not null default now()
);
create index order_items_order_idx on public.order_items (order_id);

-- ---------- invites: shareable join tokens with TTL ----------
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  token text not null unique,
  created_by uuid not null references public.profiles (id),
  expires_at timestamptz not null,
  max_uses int not null default 20,
  uses_count int not null default 0,
  created_at timestamptz not null default now()
);
create index invites_order_idx on public.invites (order_id);

-- ---------- payments: authoritative escrow ledger (webhook-owned) ----------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  participant_id uuid not null references public.participants (id) on delete cascade,
  items_total int not null,                  -- this neighbor's items
  delivery_share int not null,               -- their split of the delivery fee
  amount int not null,                       -- total held
  status payment_status not null default 'authorized',
  stripe_payment_intent_id text,
  authorized_at timestamptz not null default now(),
  captured_at timestamptz,
  refunded_at timestamptz,
  unique (order_id, participant_id)
);
create index payments_order_idx on public.payments (order_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.buildings enable row level security;
alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.participants enable row level security;
alter table public.order_items enable row level security;
alter table public.invites enable row level security;
alter table public.payments enable row level security;

-- Catalog is public: anyone can browse stores + products.
create policy "stores are public" on public.stores for select using (true);
create policy "products are public" on public.products for select using (true);

-- Profiles: users read/edit their own.
create policy "own profile read" on public.profiles for select using (id = auth.uid());
create policy "own profile write" on public.profiles for insert with check (id = auth.uid());
create policy "own profile update" on public.profiles for update using (id = auth.uid());

-- Buildings: neighbors in a building can see it.
create policy "read own building" on public.buildings for select using (
  exists (select 1 from public.profiles p where p.building_id = buildings.id and p.id = auth.uid())
);

-- Helper: is the current user a participant in this order?
create or replace function public.is_participant(o uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.participants
    where order_id = o and user_id = auth.uid()
  );
$$;

-- Orders: participants (and the creator) can read; creator can update.
create policy "participants read order" on public.orders
  for select using (created_by = auth.uid() or public.is_participant(id));
create policy "create order" on public.orders
  for insert with check (created_by = auth.uid());
create policy "creator updates order" on public.orders
  for update using (created_by = auth.uid());

-- Participants: you manage your own membership; co-members can read the roster.
create policy "read co-participants" on public.participants
  for select using (user_id = auth.uid() or public.is_participant(order_id));
create policy "join order" on public.participants
  for insert with check (user_id = auth.uid());

-- Order items: participants of the order can read; you write your own.
create policy "participants read items" on public.order_items
  for select using (public.is_participant(order_id));
create policy "add own item" on public.order_items
  for insert with check (
    exists (select 1 from public.participants pt
            where pt.id = participant_id and pt.user_id = auth.uid())
  );
create policy "remove own item" on public.order_items
  for delete using (
    exists (select 1 from public.participants pt
            where pt.id = participant_id and pt.user_id = auth.uid())
  );

-- Invites: order participants can read; creator can create.
create policy "participants read invites" on public.invites
  for select using (public.is_participant(order_id));
create policy "creator makes invite" on public.invites
  for insert with check (created_by = auth.uid());

-- Payments: a neighbor sees only their own payment row.
-- Mutations happen only via the Stripe webhook (service role) — no client write policy.
create policy "read own payment" on public.payments
  for select using (
    exists (select 1 from public.participants pt
            where pt.id = participant_id and pt.user_id = auth.uid())
  );

-- ============================================================
-- Seed: demo stores + products (match the app's demo catalog)
-- ============================================================

insert into public.stores (id, name, logo, accent, tagline, eta) values
  ('hm',        'H&M',            'H&M', '#d4001a', 'אופנה יומיומית לכל הבניין',   'טיפול חנות 35–50 דק׳'),
  ('zara',      'ZARA',           'ZARA','#16161a', 'ארון עירוני, משלוח אחד משותף', 'טיפול חנות 40–55 דק׳'),
  ('amazon',    'Amazon',         'a',   '#ff9900', 'בסיסיים ומוצרי בית בלינק אחד', 'שילוח מהיר בסגנון Prime'),
  ('shufersal', 'שופרסל Online',  'שופ', '#e4002b', 'הקניות של כולם, נהג אחד',      'חלון משלוח 60–90 דק׳');

insert into public.products (id, store_id, name, emoji, category, price, compare_at_price, sizes, colors, stock_status) values
  ('hm-linen', 'hm', 'חולצת פשתן מכופתרת', '👔', 'חולצות', 119, 139, '{XS,S,M,L,XL}', '{לבן,מרווה,תכלת}', 'ok'),
  ('hm-jeans', 'hm', 'ג׳ינס Wide High', '👖', 'מכנסיים', 159, 189, '{34,36,38,40}', '{כחול,"שחור שטוף"}', 'low'),
  ('hm-dress', 'hm', 'שמלת ריב מידי', '👗', 'שמלות', 129, 149, '{XS,S,M,L}', '{שחור,קרם,חום}', 'ok'),
  ('hm-tee', 'hm', 'טי-שירט כותנה פרימיום', '👕', 'חולצות', 49, 59, '{S,M,L,XL}', '{לבן,שחור,נייבי}', 'ok'),
  ('hm-bag', 'hm', 'תיק קרוסבודי מרופד', '👜', 'אקססוריז', 99, 119, '{"One size"}', '{שחור,בז׳,בורדו}', 'last'),
  ('za-tee', 'zara', 'טי-שירט Heavy בייסיק', '👕', 'חולצות', 89, 109, '{S,M,L,XL}', '{שחור,לבן,טופ}', 'ok'),
  ('za-pants', 'zara', 'מכנסיים מחויטים ישרים', '👖', 'מכנסיים', 229, 259, '{36,38,40,42}', '{שחור,פחם,חול}', 'low'),
  ('za-slip', 'zara', 'שמלת סאטן סליפ', '👗', 'שמלות', 249, 279, '{XS,S,M,L}', '{שנהב,שחור,"ירוק עמוק"}', 'ok'),
  ('za-jacket', 'zara', 'ז׳קט ג׳ינס קרופ', '🧥', 'חדש', 299, 329, '{S,M,L,XL}', '{"כחול ביניים",אקרו}', 'last'),
  ('am-tee', 'amazon', 'טי יומיומי Essential', '👕', 'חולצות', 69, 79, '{S,M,L,XL}', '{שחור,לבן,אפור}', 'ok'),
  ('am-hoodie', 'amazon', 'קפוצ׳ון פליז רך', '🧥', 'חדש', 129, 149, '{S,M,L,XL}', '{שחור,שיבולת,נייבי}', 'low'),
  ('am-socks', 'amazon', 'שלישיית גרביים', '🧦', 'אקססוריז', 39, 49, '{"One size"}', '{לבן,שחור}', 'ok'),
  ('sh-milk', 'shufersal', 'חלב 3% · שישייה', '🥛', 'חלב וביצים', 38, 42, '{שישייה}', '{רגיל}', 'ok'),
  ('sh-eggs', 'shufersal', 'ביצים L · תבנית 12', '🥚', 'חלב וביצים', 16, 18, '{"12 יח׳"}', '{חופש}', 'ok'),
  ('sh-veg', 'shufersal', 'סלסלת ירקות השבוע', '🥦', 'פירות וירקות', 74, 89, '{סלסלה}', '{עונתי}', 'low'),
  ('sh-clean', 'shufersal', 'ערכת ניקוי לבית', '🧼', 'ניקיון', 59, 72, '{ערכה}', '{רגיל}', 'ok');
