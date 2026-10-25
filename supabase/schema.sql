-- Joe's Garage starter schema. Run in Supabase SQL Editor.
-- Important: public sign-up always creates a customer profile. Do not allow users to set their own role.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer','staff','admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name',''), 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  registration text,
  make_model text not null,
  year integer,
  vin text,
  mileage integer,
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  email text not null,
  phone text not null,
  vehicle_registration text,
  vehicle_make_model text,
  service_name text not null,
  preferred_date date,
  description text,
  status text not null default 'requested' check (status in ('requested','pending','confirmed','in_progress','completed','cancelled')),
  staff_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  email text not null,
  phone text not null,
  vehicle_registration text,
  vehicle_make_model text,
  service_name text not null,
  budget text,
  description text not null,
  status text not null default 'new' check (status in ('new','reviewing','quoted','accepted','declined','closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.job_cards (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete set null,
  customer_id uuid references auth.users(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  job_number text unique not null,
  complaint text,
  diagnosis text,
  status text not null default 'inspection',
  assigned_to uuid references public.profiles(id) on delete set null,
  estimated_completion date,
  created_at timestamptz not null default now()
);

create table if not exists public.parts (
  id uuid primary key default gen_random_uuid(),
  sku text unique,
  name text not null,
  description text,
  quantity_on_hand integer not null default 0 check (quantity_on_hand >= 0),
  reorder_level integer not null default 0,
  cost_kes numeric(12,2),
  selling_price_kes numeric(12,2),
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete restrict,
  job_card_id uuid references public.job_cards(id) on delete set null,
  invoice_number text unique not null,
  subtotal_kes numeric(12,2) not null default 0,
  tax_kes numeric(12,2) not null default 0,
  total_kes numeric(12,2) not null default 0,
  status text not null default 'unpaid' check (status in ('draft','unpaid','part_paid','paid','void')),
  issued_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete restrict,
  amount_kes numeric(12,2) not null check (amount_kes > 0),
  method text not null,
  provider_reference text,
  status text not null default 'pending' check (status in ('pending','confirmed','failed','refunded')),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  table_name text not null,
  record_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.bookings enable row level security;
alter table public.quote_requests enable row level security;
alter table public.job_cards enable row level security;
alter table public.parts enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles: user can read/update their own non-role fields; staff can read profiles.
drop policy if exists "profile read own or staff" on public.profiles;
create policy "profile read own or staff" on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.current_user_role() in ('admin','staff'));
drop policy if exists "profile update own" on public.profiles;
create policy "profile update own" on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));
-- Prevent role escalation with column-level privileges: clients cannot update role.
revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

drop policy if exists "vehicles customer access" on public.vehicles;
create policy "vehicles customer access" on public.vehicles for select to authenticated
using (customer_id = (select auth.uid()) or public.current_user_role() in ('admin','staff'));
drop policy if exists "vehicles customer insert" on public.vehicles;
create policy "vehicles customer insert" on public.vehicles for insert to authenticated
with check (customer_id = (select auth.uid()));
drop policy if exists "vehicles customer update" on public.vehicles;
create policy "vehicles customer update" on public.vehicles for update to authenticated
using (customer_id = (select auth.uid()) or public.current_user_role() in ('admin','staff'))
with check (customer_id = (select auth.uid()) or public.current_user_role() in ('admin','staff'));
drop policy if exists "vehicles customer delete" on public.vehicles;
create policy "vehicles customer delete" on public.vehicles for delete to authenticated
using (customer_id = (select auth.uid()) or public.current_user_role() = 'admin');

drop policy if exists "bookings insert public" on public.bookings;
create policy "bookings insert public" on public.bookings for insert to anon, authenticated with check (customer_id is null or customer_id = (select auth.uid()));
drop policy if exists "bookings read customer or staff" on public.bookings;
create policy "bookings read customer or staff" on public.bookings for select to authenticated
using (customer_id = (select auth.uid()) or public.current_user_role() in ('admin','staff'));
drop policy if exists "bookings update staff" on public.bookings;
create policy "bookings update staff" on public.bookings for update to authenticated
using (public.current_user_role() in ('admin','staff')) with check (public.current_user_role() in ('admin','staff'));

drop policy if exists "quotes insert public" on public.quote_requests;
create policy "quotes insert public" on public.quote_requests for insert to anon, authenticated
with check (customer_id is null or customer_id = (select auth.uid()));
drop policy if exists "quotes read customer or staff" on public.quote_requests;
create policy "quotes read customer or staff" on public.quote_requests for select to authenticated
using (customer_id = (select auth.uid()) or public.current_user_role() in ('admin','staff'));
drop policy if exists "quotes update staff" on public.quote_requests;
create policy "quotes update staff" on public.quote_requests for update to authenticated
using (public.current_user_role() in ('admin','staff')) with check (public.current_user_role() in ('admin','staff'));

drop policy if exists "job cards customer or staff read" on public.job_cards;
create policy "job cards customer or staff read" on public.job_cards for select to authenticated
using (customer_id = (select auth.uid()) or public.current_user_role() in ('admin','staff'));
drop policy if exists "job cards staff manage" on public.job_cards;
create policy "job cards staff manage" on public.job_cards for all to authenticated
using (public.current_user_role() in ('admin','staff')) with check (public.current_user_role() in ('admin','staff'));

drop policy if exists "parts staff only" on public.parts;
create policy "parts staff only" on public.parts for all to authenticated
using (public.current_user_role() in ('admin','staff')) with check (public.current_user_role() in ('admin','staff'));

drop policy if exists "invoices customer or staff read" on public.invoices;
create policy "invoices customer or staff read" on public.invoices for select to authenticated
using (customer_id = (select auth.uid()) or public.current_user_role() in ('admin','staff'));
drop policy if exists "invoices staff manage" on public.invoices;
create policy "invoices staff manage" on public.invoices for all to authenticated
using (public.current_user_role() in ('admin','staff')) with check (public.current_user_role() in ('admin','staff'));

drop policy if exists "payments customer or staff read" on public.payments;
create policy "payments customer or staff read" on public.payments for select to authenticated
using (exists (select 1 from public.invoices i where i.id = invoice_id and (i.customer_id = (select auth.uid()) or public.current_user_role() in ('admin','staff'))));
drop policy if exists "payments staff manage" on public.payments;
create policy "payments staff manage" on public.payments for all to authenticated
using (public.current_user_role() in ('admin','staff')) with check (public.current_user_role() in ('admin','staff'));

drop policy if exists "audit logs admin read" on public.audit_logs;
create policy "audit logs admin read" on public.audit_logs for select to authenticated
using (public.current_user_role() = 'admin');
drop policy if exists "audit logs staff insert" on public.audit_logs;
create policy "audit logs staff insert" on public.audit_logs for insert to authenticated
with check (actor_id = (select auth.uid()) and public.current_user_role() in ('admin','staff'));

grant select, insert, update, delete on public.vehicles to authenticated;
grant select, insert, update on public.bookings to authenticated;
grant insert, select, update on public.quote_requests to authenticated;
grant select, insert, update, delete on public.job_cards, public.parts, public.invoices, public.payments to authenticated;
grant select, insert on public.audit_logs to authenticated;
grant insert on public.bookings, public.quote_requests to anon;

-- Promote a trusted staff account manually after registering it:
-- update public.profiles set role = 'admin' where id = 'AUTH_USER_UUID';
-- Run that statement only as the project owner in the Supabase SQL Editor.
