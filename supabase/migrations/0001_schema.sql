-- Legalgo — schéma de base (Phase 2)
-- Tables principales : dossiers de formalités, associés, pièces, journal,
-- notes internes, messages, et les comptes du cabinet.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- cabinet_members : comptes nominatifs du cabinet (liés à auth.users)
-- ---------------------------------------------------------------------
create table public.cabinet_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('admin', 'agent')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.cabinet_members is
  'Comptes nominatifs du cabinet. La présence d''une ligne active fait qu''un utilisateur est traité comme membre du cabinet dans les politiques RLS.';

-- ---------------------------------------------------------------------
-- dossiers
-- ---------------------------------------------------------------------
create table public.dossiers (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  client_id uuid not null references auth.users (id) on delete restrict,
  client_email text not null,

  type text not null check (type in ('creation', 'modification', 'fermeture')),
  forme text check (forme in ('SASU', 'SAS', 'EURL', 'SARL', 'SCI')),
  nature text,

  status text not null default 'recu' check (
    status in (
      'recu',
      'verification',
      'annonce_publiee',
      'depose_guichet',
      'immatricule',
      'modification_enregistree',
      'societe_radiee'
    )
  ),
  blocked boolean not null default false,
  missing_pieces text,

  societe_nom text,
  siren text check (siren is null or siren ~ '^[0-9]{9}$'),

  plan smallint check (plan in (0, 1, 2)),
  options jsonb not null default '{}'::jsonb,

  -- brouillon du questionnaire (phase 3) : stocké en jsonb, enregistrement
  -- automatique côté serveur, structure détaillée dans le code applicatif.
  draft jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.dossiers.ref is 'Référence publique, format FD-AAMM-0nnn, générée par generate_dossier_ref().';
comment on column public.dossiers.draft is 'Brouillon du questionnaire tant que submitted_at est nul.';

create index dossiers_client_id_idx on public.dossiers (client_id);
create index dossiers_status_idx on public.dossiers (status);

-- ---------------------------------------------------------------------
-- associes
-- ---------------------------------------------------------------------
create table public.associes (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers (id) on delete cascade,
  position smallint not null default 0,
  prenom text,
  nom text,
  date_naissance date,
  nationalite text,
  adresse text,
  apport_eur numeric(12, 2) check (apport_eur is null or apport_eur >= 0),
  est_dirigeant boolean not null default false,
  created_at timestamptz not null default now()
);

create index associes_dossier_id_idx on public.associes (dossier_id);

-- ---------------------------------------------------------------------
-- pieces (métadonnées ; le contenu chiffré vit dans Supabase Storage,
-- câblé en phase 4)
-- ---------------------------------------------------------------------
create table public.pieces (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers (id) on delete cascade,
  kind text not null,
  storage_path text,
  original_filename text,
  content_type text check (content_type in ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes integer check (size_bytes is null or size_bytes >= 0),
  status text not null default 'manquante' check (status in ('manquante', 'recue', 'a_remplacer')),
  uploaded_by uuid references auth.users (id),
  uploaded_at timestamptz,
  purge_at timestamptz,
  created_at timestamptz not null default now()
);

create index pieces_dossier_id_idx on public.pieces (dossier_id);

-- ---------------------------------------------------------------------
-- piece_access_log : journal d'audit non modifiable de chaque accès
-- ---------------------------------------------------------------------
create table public.piece_access_log (
  id bigint generated always as identity primary key,
  piece_id uuid not null references public.pieces (id) on delete cascade,
  accessed_by uuid not null references auth.users (id),
  action text not null check (action in ('lecture', 'depot', 'suppression')),
  accessed_at timestamptz not null default now()
);

create index piece_access_log_piece_id_idx on public.piece_access_log (piece_id);

-- ---------------------------------------------------------------------
-- dossier_log : journal horodaté des actions sur un dossier
-- ---------------------------------------------------------------------
create table public.dossier_log (
  id bigint generated always as identity primary key,
  dossier_id uuid not null references public.dossiers (id) on delete cascade,
  actor_id uuid references auth.users (id),
  label text not null,
  detail text,
  visible_to_client boolean not null default false,
  created_at timestamptz not null default now()
);

create index dossier_log_dossier_id_idx on public.dossier_log (dossier_id);

-- ---------------------------------------------------------------------
-- dossier_notes : notes internes du cabinet (jamais visibles au client)
-- ---------------------------------------------------------------------
create table public.dossier_notes (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers (id) on delete cascade,
  author_id uuid not null references auth.users (id),
  body text not null,
  created_at timestamptz not null default now()
);

create index dossier_notes_dossier_id_idx on public.dossier_notes (dossier_id);

-- ---------------------------------------------------------------------
-- messages : échanges client ↔ cabinet sur un dossier
-- ---------------------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers (id) on delete cascade,
  sender_id uuid not null references auth.users (id),
  sender_role text not null check (sender_role in ('client', 'cabinet')),
  body text not null,
  created_at timestamptz not null default now()
);

create index messages_dossier_id_idx on public.messages (dossier_id);

-- ---------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger dossiers_set_updated_at
  before update on public.dossiers
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- référence publique du dossier : FD-AAMM-0nnn (numérotation mensuelle)
-- ---------------------------------------------------------------------
create sequence public.dossier_ref_seq;

create function public.generate_dossier_ref()
returns text
language plpgsql
as $$
declare
  prefix text := 'FD-' || to_char(now(), 'YYMM') || '-';
  next_n int;
  candidate text;
begin
  loop
    next_n := nextval('public.dossier_ref_seq');
    candidate := prefix || lpad(next_n::text, 4, '0');
    exit when not exists (select 1 from public.dossiers where ref = candidate);
  end loop;
  return candidate;
end;
$$;

alter table public.dossiers
  alter column ref set default public.generate_dossier_ref();

-- ---------------------------------------------------------------------
-- append-only : piece_access_log et dossier_log ne peuvent être modifiés
-- ni supprimés, par personne (y compris le cabinet).
-- ---------------------------------------------------------------------
create function public.forbid_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Cette table est en ajout seul (append-only) : % interdit sur %', tg_op, tg_table_name;
end;
$$;

create trigger piece_access_log_append_only
  before update or delete on public.piece_access_log
  for each row
  execute function public.forbid_mutation();

create trigger dossier_log_append_only
  before update or delete on public.dossier_log
  for each row
  execute function public.forbid_mutation();
