-- Tests des règles d'accès (RLS) — Phase 2
--
-- À exécuter avec la stack Supabase locale :
--   supabase start
--   supabase test db
--
-- Simule les JWT de auth.uid() / auth.jwt() via request.jwt.claims, comme
-- le fait Supabase en local et en production (GoTrue signe le JWT, PostgREST
-- le transmet comme paramètre de session).

begin;
select plan(12);

-- ---------------------------------------------------------------------
-- fixtures
-- ---------------------------------------------------------------------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'client.a@example.com'),
  ('00000000-0000-0000-0000-000000000002', 'client.b@example.com'),
  ('00000000-0000-0000-0000-000000000003', 'agent@fondee.example'),
  ('00000000-0000-0000-0000-000000000004', 'admin@fondee.example');

insert into public.cabinet_members (user_id, full_name, role) values
  ('00000000-0000-0000-0000-000000000003', 'Agent Test', 'agent'),
  ('00000000-0000-0000-0000-000000000004', 'Admin Test', 'admin');

set local role postgres;
insert into public.dossiers (id, client_id, client_email, type, forme, societe_nom)
values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'client.a@example.com', 'creation', 'SASU', 'Studio Alba');

insert into public.dossier_notes (dossier_id, author_id, body)
values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Note interne de test');

-- ---------------------------------------------------------------------
-- helpers de session
-- ---------------------------------------------------------------------
create or replace function test_as(p_uid text, p_aal text default 'aal1')
returns void language plpgsql as $$
begin
  execute format(
    'set local role authenticated; set local request.jwt.claims = %L;',
    json_build_object('sub', p_uid, 'aal', p_aal)::text
  );
end;
$$;

-- ---------------------------------------------------------------------
-- 1) le client A voit son propre dossier
-- ---------------------------------------------------------------------
select test_as('00000000-0000-0000-0000-000000000001');
select is(
  (select count(*) from public.dossiers)::int,
  1,
  'Le client propriétaire voit son dossier'
);

-- 2) le client B ne voit pas le dossier du client A
select test_as('00000000-0000-0000-0000-000000000002');
select is(
  (select count(*) from public.dossiers)::int,
  0,
  'Un autre client ne voit pas le dossier d''autrui'
);

-- 3) un client ne voit jamais les notes internes
select test_as('00000000-0000-0000-0000-000000000001');
select is(
  (select count(*) from public.dossier_notes)::int,
  0,
  'Le client ne voit jamais les notes internes du cabinet'
);

-- 4) un membre du cabinet sans 2FA (aal1) ne voit aucun dossier
select test_as('00000000-0000-0000-0000-000000000003', 'aal1');
select is(
  (select count(*) from public.dossiers)::int,
  0,
  'Le cabinet sans 2FA validée (aal1) ne voit aucun dossier'
);

select is(
  (select count(*) from public.dossier_notes)::int,
  0,
  'Le cabinet sans 2FA validée (aal1) ne voit aucune note interne'
);

-- 5) un membre du cabinet avec 2FA validée (aal2) voit tout
select test_as('00000000-0000-0000-0000-000000000003', 'aal2');
select is(
  (select count(*) from public.dossiers)::int,
  1,
  'Le cabinet avec 2FA validée (aal2) voit les dossiers'
);

select is(
  (select count(*) from public.dossier_notes)::int,
  1,
  'Le cabinet avec 2FA validée (aal2) voit les notes internes'
);

-- 6) un client ne peut pas changer le statut de son dossier
select test_as('00000000-0000-0000-0000-000000000001', 'aal1');
update public.dossiers set status = 'immatricule' where id = '10000000-0000-0000-0000-000000000001';
select is(
  (select status from public.dossiers where id = '10000000-0000-0000-0000-000000000001'),
  'recu',
  'Un client ne peut pas modifier le statut de son dossier'
);

-- 7) un client ne peut pas créer un dossier au nom d'un autre
select throws_ok(
  $$ insert into public.dossiers (client_id, client_email, type)
     values ('00000000-0000-0000-0000-000000000002', 'x@example.com', 'creation') $$,
  '42501',
  null,
  'Un client ne peut pas créer un dossier pour un autre client_id'
);

-- 8) un membre du cabinet (aal2) peut faire avancer le statut
select test_as('00000000-0000-0000-0000-000000000003', 'aal2');
update public.dossiers set status = 'verification' where id = '10000000-0000-0000-0000-000000000001';
select is(
  (select status from public.dossiers where id = '10000000-0000-0000-0000-000000000001'),
  'verification',
  'Le cabinet (aal2) peut faire avancer le statut du dossier'
);

-- 9) dossier_log et piece_access_log sont en ajout seul, même pour le
--    cabinet authentifié en aal2
set local role postgres;
insert into public.dossier_log (dossier_id, actor_id, label, visible_to_client)
values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Dossier reçu', true);

select test_as('00000000-0000-0000-0000-000000000003', 'aal2');
select throws_ok(
  $$ update public.dossier_log set label = 'modifié' $$,
  'P0001',
  null,
  'dossier_log est en ajout seul : update interdit, même pour le cabinet'
);

-- 10) le client ne voit que les entrées de journal marquées visibles
select test_as('00000000-0000-0000-0000-000000000001', 'aal1');
select is(
  (select count(*) from public.dossier_log)::int,
  1,
  'Le client voit les entrées de journal marquées visible_to_client'
);

select * from finish();
rollback;
