-- Fondée — Row Level Security (Phase 2)
--
-- Principe : un client ne voit que son propre dossier ; le cabinet a des
-- droits nominatifs et limités, et doit avoir validé une authentification
-- à deux facteurs (niveau d'assurance aal2) pour accéder à quoi que ce
-- soit. Le pattern aal2 restrictif suit la documentation officielle
-- Supabase (politique "as restrictive" sur le rôle authenticated).

-- ---------------------------------------------------------------------
-- fonctions utilitaires (security definer pour éviter toute récursion
-- de RLS en interrogeant cabinet_members depuis une politique)
-- ---------------------------------------------------------------------
create function public.is_cabinet_member()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.cabinet_members
    where user_id = auth.uid() and active
  );
$$;

create function public.is_cabinet_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.cabinet_members
    where user_id = auth.uid() and active and role = 'admin'
  );
$$;

create function public.has_aal2()
returns boolean
language sql
stable
as $$
  select coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2';
$$;

-- ---------------------------------------------------------------------
-- cabinet_members
-- ---------------------------------------------------------------------
alter table public.cabinet_members enable row level security;

create policy cabinet_members_select on public.cabinet_members
  for select to authenticated
  using (public.is_cabinet_member());

create policy cabinet_members_admin_write on public.cabinet_members
  for all to authenticated
  using (public.is_cabinet_admin())
  with check (public.is_cabinet_admin());

create policy cabinet_members_require_aal2 on public.cabinet_members
  as restrictive
  for all to authenticated
  using (public.has_aal2());

-- ---------------------------------------------------------------------
-- dossiers
-- ---------------------------------------------------------------------
alter table public.dossiers enable row level security;

create policy dossiers_client_select on public.dossiers
  for select to authenticated
  using (client_id = auth.uid());

create policy dossiers_cabinet_select on public.dossiers
  for select to authenticated
  using (public.is_cabinet_member());

create policy dossiers_client_insert on public.dossiers
  for insert to authenticated
  with check (client_id = auth.uid());

create policy dossiers_client_update_draft on public.dossiers
  for update to authenticated
  using (client_id = auth.uid() and submitted_at is null)
  with check (client_id = auth.uid());

create policy dossiers_cabinet_update on public.dossiers
  for update to authenticated
  using (public.is_cabinet_member())
  with check (public.is_cabinet_member());

create policy dossiers_require_aal2_for_cabinet on public.dossiers
  as restrictive
  for all to authenticated
  using (not public.is_cabinet_member() or public.has_aal2());

-- ---------------------------------------------------------------------
-- associes (suivent les droits du dossier parent)
-- ---------------------------------------------------------------------
alter table public.associes enable row level security;

create policy associes_client_access on public.associes
  for all to authenticated
  using (
    exists (
      select 1 from public.dossiers d
      where d.id = associes.dossier_id
        and d.client_id = auth.uid()
        and d.submitted_at is null
    )
  )
  with check (
    exists (
      select 1 from public.dossiers d
      where d.id = associes.dossier_id
        and d.client_id = auth.uid()
        and d.submitted_at is null
    )
  );

create policy associes_cabinet_access on public.associes
  for all to authenticated
  using (public.is_cabinet_member())
  with check (public.is_cabinet_member());

create policy associes_require_aal2_for_cabinet on public.associes
  as restrictive
  for all to authenticated
  using (not public.is_cabinet_member() or public.has_aal2());

-- ---------------------------------------------------------------------
-- pieces
-- ---------------------------------------------------------------------
alter table public.pieces enable row level security;

create policy pieces_client_select on public.pieces
  for select to authenticated
  using (
    exists (
      select 1 from public.dossiers d
      where d.id = pieces.dossier_id and d.client_id = auth.uid()
    )
  );

create policy pieces_client_insert on public.pieces
  for insert to authenticated
  with check (
    exists (
      select 1 from public.dossiers d
      where d.id = pieces.dossier_id and d.client_id = auth.uid()
    )
  );

create policy pieces_cabinet_access on public.pieces
  for all to authenticated
  using (public.is_cabinet_member())
  with check (public.is_cabinet_member());

create policy pieces_require_aal2_for_cabinet on public.pieces
  as restrictive
  for all to authenticated
  using (not public.is_cabinet_member() or public.has_aal2());

-- ---------------------------------------------------------------------
-- piece_access_log : lecture réservée au cabinet, écriture réservée au
-- service (clé de service), jamais de update/delete (trigger dédié).
-- ---------------------------------------------------------------------
alter table public.piece_access_log enable row level security;

create policy piece_access_log_cabinet_select on public.piece_access_log
  for select to authenticated
  using (public.is_cabinet_member());

create policy piece_access_log_require_aal2 on public.piece_access_log
  as restrictive
  for select to authenticated
  using (public.has_aal2());

-- aucune politique insert/update/delete pour authenticated : seule la
-- clé de service (qui contourne RLS) écrit dans cette table.

-- ---------------------------------------------------------------------
-- dossier_log : le client voit les entrées marquées visible_to_client ;
-- le cabinet voit tout. L'écriture se fait côté serveur (clé de service).
-- ---------------------------------------------------------------------
alter table public.dossier_log enable row level security;

create policy dossier_log_client_select on public.dossier_log
  for select to authenticated
  using (
    visible_to_client
    and exists (
      select 1 from public.dossiers d
      where d.id = dossier_log.dossier_id and d.client_id = auth.uid()
    )
  );

create policy dossier_log_cabinet_select on public.dossier_log
  for select to authenticated
  using (public.is_cabinet_member());

create policy dossier_log_require_aal2_for_cabinet on public.dossier_log
  as restrictive
  for select to authenticated
  using (not public.is_cabinet_member() or public.has_aal2());

-- ---------------------------------------------------------------------
-- dossier_notes : strictement réservées au cabinet
-- ---------------------------------------------------------------------
alter table public.dossier_notes enable row level security;

create policy dossier_notes_cabinet_select on public.dossier_notes
  for select to authenticated
  using (public.is_cabinet_member());

create policy dossier_notes_cabinet_insert on public.dossier_notes
  for insert to authenticated
  with check (public.is_cabinet_member() and author_id = auth.uid());

create policy dossier_notes_author_update on public.dossier_notes
  for update to authenticated
  using (public.is_cabinet_member() and author_id = auth.uid())
  with check (public.is_cabinet_member() and author_id = auth.uid());

create policy dossier_notes_author_delete on public.dossier_notes
  for delete to authenticated
  using (public.is_cabinet_member() and author_id = auth.uid());

create policy dossier_notes_require_aal2 on public.dossier_notes
  as restrictive
  for all to authenticated
  using (public.has_aal2());

-- ---------------------------------------------------------------------
-- messages : client ↔ cabinet sur un dossier. Historique en ajout seul :
-- select + insert uniquement, jamais de update/delete pour personne.
-- ---------------------------------------------------------------------
alter table public.messages enable row level security;

create policy messages_client_select on public.messages
  for select to authenticated
  using (
    exists (
      select 1 from public.dossiers d
      where d.id = messages.dossier_id and d.client_id = auth.uid()
    )
  );

create policy messages_cabinet_select on public.messages
  for select to authenticated
  using (public.is_cabinet_member());

create policy messages_client_insert on public.messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and sender_role = 'client'
    and exists (
      select 1 from public.dossiers d
      where d.id = messages.dossier_id and d.client_id = auth.uid()
    )
  );

create policy messages_cabinet_insert on public.messages
  for insert to authenticated
  with check (
    public.is_cabinet_member()
    and sender_id = auth.uid()
    and sender_role = 'cabinet'
  );

create policy messages_require_aal2_for_cabinet on public.messages
  as restrictive
  for all to authenticated
  using (not public.is_cabinet_member() or public.has_aal2());

-- ---------------------------------------------------------------------
-- droits d'exécution des fonctions utilitaires : appelables par les
-- utilisateurs authentifiés (le middleware les utilise via RPC pour
-- savoir si l'utilisateur courant est membre du cabinet et a validé
-- sa 2FA), jamais par le rôle anonyme.
-- ---------------------------------------------------------------------
revoke execute on function public.is_cabinet_member() from public;
revoke execute on function public.is_cabinet_admin() from public;
revoke execute on function public.has_aal2() from public;
grant execute on function public.is_cabinet_member() to authenticated;
grant execute on function public.is_cabinet_admin() to authenticated;
grant execute on function public.has_aal2() to authenticated;
