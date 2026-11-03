# Fondée

Plateforme en ligne pour créer, modifier et fermer une société en France (SASU, SAS, EURL, SARL, SCI), avec relecture et dépôt par un expert-comptable. Nom provisoire.

Le cahier des charges complet est dans [`docs/Cahier_des_charges_Fondee.docx`](docs/Cahier_des_charges_Fondee.docx). Le prototype visuel de référence (statique, données simulées) est dans [`prototype/index.html`](prototype/index.html).

## Stack

Next.js (TypeScript, App Router) — Supabase (région UE) — Stripe — Yousign, à brancher dans les phases suivantes.

## Démarrer

```bash
npm install
cp .env.example .env.local   # puis remplir les variables (voir ci-dessous)
npm run dev
```

## Configuration Supabase

Projet Supabase **région UE**, distinct de la plateforme Legaltech existante.

1. Dans les paramètres du projet, récupérer l'URL, la clé `anon`, la clé `service_role` et la chaîne de connexion Postgres directe (Database → Connection string → URI, mode "session" ou "transaction" selon le pooler). Reporter ces valeurs dans `.env.local` (jamais commité) :
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `SUPABASE_PROJECT_REF`.
2. Appliquer le schéma et les politiques RLS (`supabase/migrations/`) :
   ```bash
   npm run db:migrate:dry-run   # vérifier ce qui sera appliqué
   npm run db:migrate
   ```
3. Créer le premier compte administrateur du cabinet (les suivants se créent ensuite depuis le back-office, phase 6) :
   ```bash
   CABINET_ADMIN_EMAIL="prenom.nom@cabinet.example" CABINET_ADMIN_NAME="Prénom Nom" npm run db:seed:cabinet
   ```
   Le mot de passe temporaire ne s'affiche qu'une fois dans le terminal : à transmettre hors chat/e-mail non chiffré, et à changer à la première connexion. La double authentification (TOTP) est demandée dès la première connexion sur `/cabinet/connexion`.
4. Tester les règles d'accès (RLS) avec la stack Supabase locale (nécessite Docker) :
   ```bash
   npx supabase start
   npx supabase test db
   ```
   `supabase/tests/0001_rls.test.sql` vérifie notamment : un client ne voit que son dossier, le cabinet sans 2FA validée (aal2) ne voit rien, le cabinet avec 2FA voit tout, les notes internes et le journal d'audit restent hors de portée du client, et les tables en ajout seul (`dossier_log`, `piece_access_log`) refusent toute modification.

### Authentification

- **Client** : connexion par lien magique (`/connexion`, e-mail uniquement, sans mot de passe), session courte gérée par Supabase Auth.
- **Cabinet** : comptes nominatifs e-mail + mot de passe (`/cabinet/connexion`), double authentification TOTP **obligatoire** (`/cabinet/verification`) avant tout accès à `/cabinet/*` — appliqué à la fois par `src/proxy.ts` (redirection) et par des politiques RLS restrictives (`aal2`) côté base de données, donc même un appel direct à l'API ne contourne pas la règle.

## Avancement (par phases, voir le cahier des charges)

- [x] Phase 1 — Initialisation : dépôt, Next.js, design tokens, polices, pages publiques (accueil, introduction) fidèles au prototype.
- [x] Phase 2 — Schéma de base de données, RLS, authentification client et cabinet avec 2FA, tests des règles d'accès.
- [x] Phase 3 — Questionnaire complet, brouillon serveur, validations, aperçu des statuts.
- [x] Phase 4 — Dépôt sécurisé des pièces (reste à câbler la purge automatique via `purge_at`).
- [x] Phase 5 — E-mails et page de suivi client (e-mail de confirmation + timeline sur `/mon-dossier`). La timeline ne s'enrichira qu'avec la phase 6, aucune action cabinet ne fait encore avancer le statut d'un dossier.
- [ ] Phase 6 — Back-office cabinet.
- [ ] Phase 7 — Paiement Stripe et webhooks.
- [ ] Phase 8 — Signature Yousign, dépôt guichet unique et annonce légale.
- [ ] Phase 9 — Durcissement sécurité et RGPD.

Le tableau de bord de `/cabinet` est pour l'instant une page d'attente (phase 6). Pages légales (`/mentions-legales`, `/confidentialite`, `/cgu`) : brouillons à faire valider par un juriste avant mise en production réelle — voir le bandeau sur chaque page.
