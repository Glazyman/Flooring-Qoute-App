-- Recreate email_connections with the per-company schema used by the
-- Gmail OAuth integration. The previous 006_email_connections schema was
-- never populated (0 rows in production), so a clean recreate is safe and
-- gives us the columns the app now expects (token_expires_at, scope,
-- updated_at, NOT NULL refresh_token, unique on company_id).
DROP TABLE IF EXISTS email_connections CASCADE;

CREATE TABLE IF NOT EXISTS email_connections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade not null unique,
  provider text not null check (provider in ('gmail','outlook')),
  email_address text not null,
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz,
  scope text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index email_connections_company_id_idx on email_connections (company_id);

alter table email_connections enable row level security;

create policy "Members read own company email connection"
on email_connections for select
using (
  exists (
    select 1 from public.company_members cm
    where cm.company_id = email_connections.company_id
    and cm.user_id = auth.uid()
  )
);

create policy "Members manage own company email connection"
on email_connections for all
using (
  exists (
    select 1 from public.company_members cm
    where cm.company_id = email_connections.company_id
    and cm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.company_members cm
    where cm.company_id = email_connections.company_id
    and cm.user_id = auth.uid()
  )
);
