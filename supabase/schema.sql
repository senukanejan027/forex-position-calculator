-- SNFX Cloud: run this once in Supabase > SQL Editor.
-- Safe to re-run. It never drops data and never disables Row Level Security.

-- 1. Table (skip the create if public.trades already exists; the ALTERs below still apply).
create table if not exists public.trades (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade default auth.uid(),
  trade_date  timestamptz not null,
  pair        text not null,
  direction   text not null,
  session     text,
  strategy    text,
  timeframe   text,
  entry       numeric,
  stop_loss   numeric,
  take_profit numeric,
  lot_size    numeric,
  risk_percent numeric,
  risk_amount numeric,
  result      text,
  exit_price  numeric,
  pnl         numeric,
  r_multiple  numeric,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. Extra columns the existing journal already has (so no feature is lost) plus an id for safe imports.
alter table public.trades add column if not exists rr         numeric;
alter table public.trades add column if not exists duration   text;
alter table public.trades add column if not exists reason     text;
alter table public.trades add column if not exists went_well  text;
alter table public.trades add column if not exists went_wrong text;
alter table public.trades add column if not exists lessons    text;
alter table public.trades add column if not exists client_id  text;

-- Stops the same imported trade being stored twice, even if an upload is retried.
create unique index if not exists trades_user_client_id_key on public.trades (user_id, client_id);
create index if not exists trades_user_date_idx on public.trades (user_id, trade_date desc);

-- 3. Row Level Security: each user can only touch their own rows.
alter table public.trades enable row level security;

drop policy if exists "trades_select_own" on public.trades;
drop policy if exists "trades_insert_own" on public.trades;
drop policy if exists "trades_update_own" on public.trades;
drop policy if exists "trades_delete_own" on public.trades;

create policy "trades_select_own" on public.trades for select to authenticated using (auth.uid() = user_id);
create policy "trades_insert_own" on public.trades for insert to authenticated with check (auth.uid() = user_id);
create policy "trades_update_own" on public.trades for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "trades_delete_own" on public.trades for delete to authenticated using (auth.uid() = user_id);
