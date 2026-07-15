-- Migration : une ligne par séance (remplace le blob user_data.sessions).
-- À exécuter UNE FOIS dans le SQL Editor du dashboard Supabase (projet kwest),
-- AVANT de déployer le code qui s'en sert. Inoffensif pour l'ancien code.
--
-- Le blob historique user_data.sessions est migré automatiquement par
-- l'application au premier lancement, puis remis à null.

create table public.sessions (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.sessions enable row level security;

create policy "Users manage own sessions"
  on public.sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- La colonne blob historique doit accepter null : c'est ainsi que l'app marque
-- la migration comme terminée (sinon le SET sessions = null viole le NOT NULL
-- d'origine et échoue en silence).
alter table public.user_data alter column sessions drop not null;
