#!/usr/bin/env node
// Crée le tout premier compte administrateur du cabinet.
// Les comptes suivants se créent depuis le back-office (phase 6) ou en
// relançant ce script avec d'autres variables.
//
// Usage :
//   CABINET_ADMIN_EMAIL=... CABINET_ADMIN_NAME="..." npm run db:seed:cabinet
//
// Nécessite NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans
// l'environnement. Le mot de passe temporaire est affiché une seule
// fois : à changer dès la première connexion.

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.CABINET_ADMIN_EMAIL;
const fullName = process.env.CABINET_ADMIN_NAME ?? email;

if (!url || !serviceRoleKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");
  process.exit(1);
}
if (!email) {
  console.error("CABINET_ADMIN_EMAIL est requis.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const tempPassword = randomBytes(12).toString("base64url");

const { data: created, error: createError } = await supabase.auth.admin.createUser({
  email,
  password: tempPassword,
  email_confirm: true,
});

if (createError) {
  console.error("Échec de création du compte :", createError.message);
  process.exit(1);
}

const { error: memberError } = await supabase
  .from("cabinet_members")
  .insert({ user_id: created.user.id, full_name: fullName, role: "admin" });

if (memberError) {
  console.error("Compte créé mais échec de l'ajout à cabinet_members :", memberError.message);
  process.exit(1);
}

console.log(`Compte administrateur créé pour ${email}.`);
console.log(`Mot de passe temporaire (à ne communiquer qu'une fois, en dehors de ce terminal) : ${tempPassword}`);
console.log("La double authentification sera demandée à la première connexion sur /cabinet/connexion.");
