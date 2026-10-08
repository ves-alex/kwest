-- Étape 3 de l'audit : routines sauvegardées en ligne, suppressions respectées
-- entre appareils, vraie suppression de compte.
-- À exécuter UNE FOIS dans le SQL Editor du dashboard Supabase (projet kwest),
-- AVANT de déployer le code qui s'en sert. Rejouable sans risque.

-- 1. Routines : une ligne par routine, comme les séances
create table if not exists public.routines (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.routines enable row level security;

drop policy if exists "Users manage own routines" on public.routines;
create policy "Users manage own routines"
  on public.routines
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. Trace des suppressions : une séance ou une routine supprimée sur un
--    appareil n'est plus renvoyée au cloud par un autre qui l'a encore.
create table if not exists public.deletions (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('session', 'routine')),
  id text not null,
  deleted_at timestamptz not null default now(),
  primary key (user_id, kind, id)
);

alter table public.deletions enable row level security;

drop policy if exists "Users manage own deletions" on public.deletions;
create policy "Users manage own deletions"
  on public.deletions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. Suppression du compte par l'utilisateur lui-même : ses données ET son
--    identité (auth.users : email, compte Google). security definer donne à la
--    fonction le droit de supprimer un utilisateur, mais elle ne touche qu'à
--    celui qui l'appelle (auth.uid()). Une erreur annule tout : rien n'est
--    supprimé à moitié.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Non authentifié';
  end if;
  delete from public.sessions where user_id = uid;
  delete from public.routines where user_id = uid;
  delete from public.deletions where user_id = uid;
  delete from public.user_data where id::text = uid::text;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
