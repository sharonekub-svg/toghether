-- ============================================================
-- תוגדאו (Togdao) — initial schema
-- Safe face-value ticket resale marketplace for Israel.
-- Mirrors the data model from the game plan: users, events,
-- venues, listings, tickets (vault), orders (escrow), disputes,
-- waitlists, audit log.
-- ============================================================

-- ---------- profiles (extends auth.users) ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  phone text,
  kyc_status text not null default 'none'
    check (kyc_status in ('none', 'phone', 'id_verified', 'bank_verified')),
  id_number_hash text,
  trust_score numeric(2,1) not null default 0 check (trust_score between 0 and 5),
  sales_count int not null default 0,
  banned_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- venues ----------
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  lat double precision,
  lng double precision
);

-- ---------- events (catalog) ----------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  emoji text default '🎫',
  category text not null default 'concert'
    check (category in ('concert', 'festival', 'sport', 'theater', 'standup', 'other')),
  venue_id uuid references public.venues (id),
  venue_name text,
  starts_at timestamptz not null,
  source text not null default 'manual'
    check (source in ('eventim', 'leaan', 'tm', 'eventer', 'manual')),
  face_price_min int not null check (face_price_min >= 0),
  face_price_max int not null check (face_price_max >= face_price_min),
  status text not null default 'on_sale'
    check (status in ('on_sale', 'sold_out', 'cancelled')),
  waitlist_count int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- listings ----------
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id),
  event_id uuid not null references public.events (id),
  seat_info text,
  quantity int not null default 1 check (quantity between 1 and 10),
  face_value int not null check (face_value > 0),
  price int not null check (price > 0),
  level text not null default 'safe' check (level in ('safe', 'verified')),
  status text not null default 'draft'
    check (status in ('draft', 'live', 'sold', 'delisted', 'flagged')),
  created_at timestamptz not null default now(),
  -- §194a: the platform physically prevents pricing above face value.
  constraint price_at_most_face check (price <= face_value)
);

-- ---------- tickets (vault metadata; files live in private storage) ----------
create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  barcode_hash text not null,
  vault_path text not null,
  issuer text,
  transferred_at timestamptz,
  -- duplicate detection: the same barcode can never be listed twice.
  constraint barcode_unique unique (barcode_hash)
);

-- ---------- orders (escrow) ----------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id),
  buyer_id uuid not null references public.profiles (id),
  ticket_price int not null,
  service_fee int not null,
  psp_ref text,
  escrow_status text not null default 'held'
    check (escrow_status in ('held', 'released', 'refunded')),
  payout_ref text,
  created_at timestamptz not null default now()
);

-- ---------- disputes ----------
create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id),
  type text not null default 'gate_refusal'
    check (type in ('gate_refusal', 'not_received', 'other')),
  lat double precision,
  lng double precision,
  resolution text check (resolution in ('refund', 'rejected')),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------- waitlists ----------
create table public.waitlists (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

-- ---------- append-only audit log ----------
create table public.audit_log (
  id bigint generated always as identity primary key,
  entity text not null,
  entity_id uuid,
  event text not null,
  actor uuid,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.venues enable row level security;
alter table public.events enable row level security;
alter table public.listings enable row level security;
alter table public.tickets enable row level security;
alter table public.orders enable row level security;
alter table public.disputes enable row level security;
alter table public.waitlists enable row level security;
alter table public.audit_log enable row level security;

-- Public catalog: anyone can browse events, venues and live listings.
create policy "events are public" on public.events for select using (true);
create policy "venues are public" on public.venues for select using (true);
create policy "live listings are public" on public.listings
  for select using (status = 'live' or seller_id = auth.uid());

-- Profiles: users see and edit their own profile.
create policy "own profile read" on public.profiles for select using (id = auth.uid());
create policy "own profile update" on public.profiles for update using (id = auth.uid());
create policy "own profile insert" on public.profiles for insert with check (id = auth.uid());

-- Listings: sellers manage their own listings.
create policy "insert own listing" on public.listings
  for insert with check (seller_id = auth.uid());
create policy "update own listing" on public.listings
  for update using (seller_id = auth.uid());

-- Tickets: the vault is invisible to clients. Only the seller pre-sale
-- and the buyer post-transfer (via signed URLs issued by an edge
-- function) touch files; row metadata is service-role only.
-- (no client policies on purpose)

-- Orders: buyer and the listing's seller can read their orders.
create policy "buyer reads own orders" on public.orders
  for select using (buyer_id = auth.uid());
create policy "seller reads orders on own listings" on public.orders
  for select using (exists (
    select 1 from public.listings l
    where l.id = listing_id and l.seller_id = auth.uid()
  ));

-- Disputes: the buyer on the order can open and read a dispute.
create policy "buyer opens dispute" on public.disputes
  for insert with check (exists (
    select 1 from public.orders o
    where o.id = order_id and o.buyer_id = auth.uid()
  ));
create policy "buyer reads own dispute" on public.disputes
  for select using (exists (
    select 1 from public.orders o
    where o.id = order_id and o.buyer_id = auth.uid()
  ));

-- Waitlists: users manage their own spot.
create policy "join waitlist" on public.waitlists
  for insert with check (user_id = auth.uid());
create policy "read own waitlist" on public.waitlists
  for select using (user_id = auth.uid());
create policy "leave waitlist" on public.waitlists
  for delete using (user_id = auth.uid());

-- ============================================================
-- Seed: demo catalog (matches the app's demo data)
-- ============================================================

insert into public.events
  (slug, title, emoji, category, venue_name, starts_at, face_price_min, face_price_max, status, waitlist_count)
values
  ('omer-adam', 'עומר אדם', '🎤', 'concert', 'פארק הירקון, תל אביב', '2026-08-15 21:00+03', 350, 480, 'sold_out', 347),
  ('noa-kirel', 'נועה קירל', '⭐', 'concert', 'היכל מנורה מבטחים, תל אביב', '2026-09-02 20:30+03', 280, 390, 'sold_out', 212),
  ('shlomo-artzi', 'שלמה ארצי', '🎸', 'concert', 'האמפי קיסריה', '2026-08-25 20:00+03', 420, 420, 'sold_out', 158),
  ('derby', 'מכבי ת"א – הפועל ת"א (דרבי)', '🏀', 'sport', 'היכל מנורה מבטחים', '2026-08-22 19:00+03', 120, 350, 'sold_out', 96),
  ('tamar', 'פסטיבל תמר', '🌵', 'festival', 'מצדה, ים המלח', '2026-09-28 22:00+03', 260, 260, 'on_sale', 0),
  ('infected', 'Infected Mushroom', '🍄', 'concert', 'לייב פארק, ראשון לציון', '2026-09-12 21:30+03', 290, 290, 'sold_out', 74),
  ('hasson', 'שחר חסון', '🎙️', 'standup', 'זאפה, תל אביב', '2026-08-08 21:00+03', 160, 160, 'sold_out', 41),
  ('cameri', 'מקבת — הקאמרי', '🎭', 'theater', 'תיאטרון הקאמרי, תל אביב', '2026-09-01 20:00+03', 190, 240, 'on_sale', 0);
