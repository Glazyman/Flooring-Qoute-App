-- FloorQuote Pro — Initial Schema
-- Run this in your Supabase SQL Editor or via `supabase db push`

-- ----------------------------------------------------------------
-- Profiles (mirrors auth.users)
-- ----------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------
-- Companies
-- ----------------------------------------------------------------
create table if not exists public.companies (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null,
  created_by              uuid references auth.users(id) on delete set null,
  stripe_customer_id      text unique,
  stripe_subscription_id  text,
  subscription_status     text default 'inactive',
  current_period_end      timestamptz,
  created_at              timestamptz default now()
);

alter table public.companies enable row level security;

-- ----------------------------------------------------------------
-- Company Members
-- ----------------------------------------------------------------
create table if not exists public.company_members (
  company_id  uuid not null references public.companies(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'member',
  primary key (company_id, user_id)
);

alter table public.company_members enable row level security;

-- Members can read their own membership rows
create policy "Members can view own memberships"
  on public.company_members for select
  using (user_id = auth.uid());

-- Members can read the company they belong to
create policy "Members can view their company"
  on public.companies for select
  using (
    exists (
      select 1 from public.company_members
      where company_id = id and user_id = auth.uid()
    )
  );

-- Only the service role updates company (stripe webhooks use service role)
-- Owners can update company name
create policy "Owners can update company"
  on public.companies for update
  using (
    exists (
      select 1 from public.company_members
      where company_id = id and user_id = auth.uid() and role = 'owner'
    )
  );

-- ----------------------------------------------------------------
-- Company Settings
-- ----------------------------------------------------------------
create table if not exists public.company_settings (
  company_id              uuid primary key references public.companies(id) on delete cascade,
  company_name            text not null default '',
  phone                   text,
  email                   text,
  logo_url                text,
  default_material_cost   numeric(10,2) default 5.00,
  default_labor_cost      numeric(10,2) default 3.00,
  default_waste_pct       numeric(5,2)  default 10.00,
  default_markup_pct      numeric(5,2)  default 0.00,
  default_deposit_pct     numeric(5,2)  default 50.00,
  updated_at              timestamptz default now()
);

alter table public.company_settings enable row level security;

create policy "Members can view company settings"
  on public.company_settings for select
  using (
    exists (
      select 1 from public.company_members
      where company_id = company_settings.company_id and user_id = auth.uid()
    )
  );

create policy "Members can upsert company settings"
  on public.company_settings for insert
  with check (
    exists (
      select 1 from public.company_members
      where company_id = company_settings.company_id and user_id = auth.uid()
    )
  );

create policy "Members can update company settings"
  on public.company_settings for update
  using (
    exists (
      select 1 from public.company_members
      where company_id = company_settings.company_id and user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------
-- Quotes
-- ----------------------------------------------------------------
create table if not exists public.quotes (
  id                      uuid primary key default gen_random_uuid(),
  company_id              uuid not null references public.companies(id) on delete cascade,

  -- Customer
  customer_name           text not null,
  customer_phone          text,
  customer_email          text,
  job_address             text,

  -- Project
  flooring_type           text not null,
  measurement_type        text not null default 'manual',

  -- Measurements
  base_sqft               numeric(10,2) not null default 0,
  waste_pct               numeric(5,2)  not null default 10,
  adjusted_sqft           numeric(10,2) not null default 0,

  -- Pricing
  material_cost_per_sqft  numeric(10,2) not null default 0,
  labor_cost_per_sqft     numeric(10,2) not null default 0,

  -- Extras
  removal_fee             numeric(10,2) not null default 0,
  furniture_fee           numeric(10,2) not null default 0,
  stairs_fee              numeric(10,2) not null default 0,
  delivery_fee            numeric(10,2) not null default 0,
  custom_fee_label        text,
  custom_fee_amount       numeric(10,2) not null default 0,

  -- Tax
  tax_enabled             boolean not null default false,
  tax_pct                 numeric(5,2)  not null default 0,

  -- Financial
  markup_pct              numeric(5,2)  not null default 0,
  deposit_pct             numeric(5,2)  not null default 50,

  -- Computed totals (stored for fast display)
  material_total          numeric(12,2) not null default 0,
  labor_total             numeric(12,2) not null default 0,
  extras_total            numeric(12,2) not null default 0,
  subtotal                numeric(12,2) not null default 0,
  tax_amount              numeric(12,2) not null default 0,
  markup_amount           numeric(12,2) not null default 0,
  final_total             numeric(12,2) not null default 0,
  deposit_amount          numeric(12,2) not null default 0,

  -- Meta
  status                  text not null default 'pending',
  notes                   text,
  valid_days              int  not null default 30,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

alter table public.quotes enable row level security;

create policy "Members can view quotes"
  on public.quotes for select
  using (
    exists (
      select 1 from public.company_members
      where company_id = quotes.company_id and user_id = auth.uid()
    )
  );

create policy "Members can insert quotes"
  on public.quotes for insert
  with check (
    exists (
      select 1 from public.company_members
      where company_id = quotes.company_id and user_id = auth.uid()
    )
  );

create policy "Members can update quotes"
  on public.quotes for update
  using (
    exists (
      select 1 from public.company_members
      where company_id = quotes.company_id and user_id = auth.uid()
    )
  );

create policy "Members can delete quotes"
  on public.quotes for delete
  using (
    exists (
      select 1 from public.company_members
      where company_id = quotes.company_id and user_id = auth.uid()
    )
  );

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists quotes_updated_at on public.quotes;
create trigger quotes_updated_at
  before update on public.quotes
  for each row execute procedure public.set_updated_at();

-- ----------------------------------------------------------------
-- Quote Rooms
-- ----------------------------------------------------------------
create table if not exists public.quote_rooms (
  id        uuid primary key default gen_random_uuid(),
  quote_id  uuid not null references public.quotes(id) on delete cascade,
  name      text,
  length    numeric(10,2) not null,
  width     numeric(10,2) not null,
  sqft      numeric(10,2) not null
);

alter table public.quote_rooms enable row level security;

create policy "Members can access quote rooms"
  on public.quote_rooms for all
  using (
    exists (
      select 1
      from public.quotes q
      join public.company_members cm on cm.company_id = q.company_id
      where q.id = quote_rooms.quote_id and cm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.quotes q
      join public.company_members cm on cm.company_id = q.company_id
      where q.id = quote_rooms.quote_id and cm.user_id = auth.uid()
    )
  );
