-- Fondée — Dépôt des pièces (Phase 4)
--
-- Bucket de stockage privé pour les pièces jointes, et droits d'écriture
-- du client sur ses propres pièces. Convention de chemin des objets :
-- "<dossier_id>/<piece_id>/<nom de fichier>" — le premier segment sert
-- à relier l'objet au dossier dans les politiques ci-dessous.

insert into storage.buckets (id, name, public)
values ('pieces', 'pieces', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- pieces : le client peut mettre à jour ses propres pièces (dépôt d'un
-- fichier) ; seul le cabinet (déjà couvert par pieces_cabinet_access,
-- migration 0002) a par ailleurs tous les droits.
-- ---------------------------------------------------------------------
create policy pieces_client_update on public.pieces
  for update to authenticated
  using (
    exists (
      select 1 from public.dossiers d
      where d.id = pieces.dossier_id and d.client_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.dossiers d
      where d.id = pieces.dossier_id and d.client_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- storage.objects (bucket "pieces")
-- ---------------------------------------------------------------------
create policy pieces_bucket_client_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'pieces'
    and exists (
      select 1 from public.dossiers d
      where d.id::text = (storage.foldername(name))[1]
        and d.client_id = auth.uid()
    )
  );

create policy pieces_bucket_client_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'pieces'
    and exists (
      select 1 from public.dossiers d
      where d.id::text = (storage.foldername(name))[1]
        and d.client_id = auth.uid()
    )
  );

create policy pieces_bucket_cabinet_select on storage.objects
  for select to authenticated
  using (bucket_id = 'pieces' and public.is_cabinet_member());

create policy pieces_bucket_require_aal2_for_cabinet on storage.objects
  as restrictive
  for all to authenticated
  using (
    bucket_id <> 'pieces'
    or not public.is_cabinet_member()
    or public.has_aal2()
  );
