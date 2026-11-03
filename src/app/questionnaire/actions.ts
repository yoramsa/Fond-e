"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { piecesNeeded, type Associe, type DraftData } from "@/lib/questionnaire";
import type { FormeKey, TypeKey } from "@/lib/data";
import { sendDossierReceivedEmail } from "@/lib/email";

type DossierPayload = {
  type: TypeKey;
  forme: FormeKey;
  data: DraftData;
};

function natureFor(type: TypeKey, data: DraftData): string | null {
  return type === "creation" ? null : type === "modification" ? data.nature : data.motif;
}

/**
 * Trouve le brouillon en cours de l'utilisateur pour ce type de démarche
 * (un seul dossier non soumis à la fois par type et par client), ou en
 * crée un. Ne touche jamais aux associés : ils ne sont écrits qu'à la
 * soumission finale.
 */
async function upsertDraft(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  userEmail: string | undefined,
  { type, forme, data }: DossierPayload
) {
  const { data: existing } = await supabase
    .from("dossiers")
    .select("id, ref")
    .eq("client_id", userId)
    .eq("type", type)
    .is("submitted_at", null)
    .limit(1)
    .maybeSingle();

  const fields = {
    client_email: userEmail ?? data.email,
    forme,
    nature: natureFor(type, data),
    societe_nom: data.nom,
    siren: type === "creation" ? null : data.siren,
    plan: Number(data.plan) || null,
    options: data.opts,
    draft: { data },
  };

  if (existing) {
    const { data: updated, error } = await supabase
      .from("dossiers")
      .update(fields)
      .eq("id", existing.id)
      .select("id, ref")
      .single();
    return { dossier: updated, error };
  }

  const { data: created, error } = await supabase
    .from("dossiers")
    .insert({ client_id: userId, type, ...fields })
    .select("id, ref")
    .single();
  return { dossier: created, error };
}

export type SaveDraftResult =
  | { ok: true; ref: string }
  | { ok: false; needsAuth: true }
  | { ok: false; needsAuth: false; message: string };

/** Enregistrement incrémental du brouillon, pour un client déjà connecté. */
export async function saveDraftDossier(input: DossierPayload): Promise<SaveDraftResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return { ok: false, needsAuth: true };

  const { dossier, error } = await upsertDraft(supabase, user.id, user.email, input);
  if (error || !dossier) {
    return { ok: false, needsAuth: false, message: error?.message ?? "Échec de l’enregistrement du brouillon." };
  }
  return { ok: true, ref: dossier.ref as string };
}

export type LoadedDraft = { forme: FormeKey; data: DraftData } | null;

/** Reprend le brouillon serveur existant (dossier non soumis) pour ce type, s'il y en a un. */
export async function loadDraftDossier(type: TypeKey): Promise<LoadedDraft> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const { data: dossier } = await supabase
    .from("dossiers")
    .select("forme, draft")
    .eq("client_id", user.id)
    .eq("type", type)
    .is("submitted_at", null)
    .limit(1)
    .maybeSingle();

  if (!dossier?.draft) return null;
  const draft = dossier.draft as { data?: DraftData };
  if (!draft.data) return null;
  return { forme: (dossier.forme as FormeKey) ?? "SASU", data: draft.data };
}

export type SubmitDossierInput = DossierPayload & { associes: Associe[] };

export type SubmitDossierResult =
  | { ok: true; ref: string }
  | { ok: false; needsAuth: true }
  | { ok: false; needsAuth: false; message: string };

export async function submitDossier(input: SubmitDossierInput): Promise<SubmitDossierResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return { ok: false, needsAuth: true };

  const { type, data, associes } = input;

  const { dossier, error: dossierError } = await upsertDraft(supabase, user.id, user.email, input);
  if (dossierError || !dossier) {
    return { ok: false, needsAuth: false, message: dossierError?.message ?? "Échec de l’enregistrement du dossier." };
  }

  // Les associés sont (ré)écrits avant la soumission : la politique RLS
  // d'écriture client sur `associes` exige que le dossier parent ne soit
  // pas encore soumis (submitted_at is null). On repart de zéro à chaque
  // soumission pour éviter les doublons si un essai précédent a échoué.
  if (type === "creation") {
    const { error: deleteError } = await supabase.from("associes").delete().eq("dossier_id", dossier.id);
    if (deleteError) {
      return { ok: false, needsAuth: false, message: deleteError.message };
    }
    if (associes.length > 0) {
      const { error: associesError } = await supabase.from("associes").insert(
        associes.map((a, position) => ({
          dossier_id: dossier.id,
          position,
          prenom: a.prenom,
          nom: a.nom,
          date_naissance: a.dateNaissance || null,
          nationalite: a.nationalite || null,
          adresse: a.adresse
            ? `${a.adresse}${a.codePostal || a.ville ? `, ${[a.codePostal, a.ville].filter(Boolean).join(" ")}` : ""}`
            : null,
          apport_eur: Number(a.apportEur) || null,
          est_dirigeant: String(position) === data.dirigeantIdx,
        }))
      );
      if (associesError) {
        return { ok: false, needsAuth: false, message: associesError.message };
      }
    }
  }

  // Idem pour les pièces à demander : on repart de zéro pour refléter la
  // liste à jour (ex. un associé ajouté ou retiré depuis un essai précédent).
  const { error: deletePiecesError } = await supabase.from("pieces").delete().eq("dossier_id", dossier.id);
  if (deletePiecesError) {
    return { ok: false, needsAuth: false, message: deletePiecesError.message };
  }
  const needed = piecesNeeded(type, associes);
  if (needed.length > 0) {
    const { error: piecesError } = await supabase.from("pieces").insert(
      needed.map((p) => ({ dossier_id: dossier.id, kind: p.kind }))
    );
    if (piecesError) {
      return { ok: false, needsAuth: false, message: piecesError.message };
    }
  }

  const { error: submitError } = await supabase
    .from("dossiers")
    .update({ submitted_at: new Date().toISOString() })
    .eq("id", dossier.id);

  if (submitError) {
    return { ok: false, needsAuth: false, message: submitError.message };
  }

  // Journal visible au client (l'écriture passe par la clé de service :
  // `dossier_log` n'accepte aucune écriture directe côté authentifié,
  // voir migration 0002_rls.sql) et e-mail de confirmation. Ni l'un ni
  // l'autre ne doit faire échouer la soumission si ça rate.
  const admin = createAdminClient();
  const { error: logError } = await admin.from("dossier_log").insert({
    dossier_id: dossier.id,
    actor_id: user.id,
    label: "Dossier reçu",
    detail: "E-mail de confirmation envoyé au client.",
    visible_to_client: true,
  });
  if (logError) {
    console.error("Échec de l'écriture du journal de dossier :", logError.message);
  }
  await sendDossierReceivedEmail({
    to: user.email ?? data.email,
    ref: dossier.ref as string,
    societeNom: data.nom,
  });

  return { ok: true, ref: dossier.ref as string };
}
