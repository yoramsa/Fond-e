import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseServiceRoleKey, supabaseUrl } from "./env";

/**
 * Client « clé de service » : contourne entièrement RLS. Jamais importé
 * depuis un composant client ni envoyé au navigateur — le mot-clé
 * `server-only` fait échouer le build si c'est le cas.
 *
 * Réservé aux opérations serveur de confiance : écrire le journal
 * d'audit des pièces, le journal du dossier, générer des liens signés,
 * traiter les webhooks Stripe (phase 7), etc.
 */
export function createAdminClient() {
  return createSupabaseClient(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
