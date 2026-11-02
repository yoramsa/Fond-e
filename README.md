# Fondée

Plateforme en ligne pour créer, modifier et fermer une société en France (SASU, SAS, EURL, SARL, SCI), avec relecture et dépôt par un expert-comptable. Nom provisoire.

Le cahier des charges complet est dans [`docs/Cahier_des_charges_Fondee.docx`](docs/Cahier_des_charges_Fondee.docx). Le prototype visuel de référence (statique, données simulées) est dans [`prototype/index.html`](prototype/index.html).

## Stack

Next.js (TypeScript, App Router) — Supabase (région UE) — Stripe — Yousign, à brancher dans les phases suivantes.

## Démarrer

```bash
npm install
npm run dev
```

## Avancement (par phases, voir le cahier des charges)

- [x] Phase 1 — Initialisation : dépôt, Next.js, design tokens, polices, pages publiques (accueil, introduction) fidèles au prototype.
- [ ] Phase 2 — Schéma de base de données, RLS, authentification client et cabinet avec 2FA.
- [ ] Phase 3 — Questionnaire complet, brouillon serveur, validations, aperçu des statuts.
- [ ] Phase 4 — Dépôt sécurisé des pièces.
- [ ] Phase 5 — E-mails et page de suivi client.
- [ ] Phase 6 — Back-office cabinet.
- [ ] Phase 7 — Paiement Stripe et webhooks.
- [ ] Phase 8 — Signature Yousign, dépôt guichet unique et annonce légale.
- [ ] Phase 9 — Durcissement sécurité et RGPD.

Les pages `/questionnaire/[type]`, `/suivi` et `/cabinet` sont pour l'instant des pages d'attente (phases suivantes).
