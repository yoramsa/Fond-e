"use server";

import { createClient } from "@/lib/supabase/server";
import type { Associe, DraftData } from "@/lib/questionnaire";
import type { FormeKey, TypeKey } from "@/lib/data";

export type SubmitDossierInput = {
  type: TypeKey;
  forme: FormeKey;
  data: DraftData;
  associes: Associe[];
};

export type SubmitDossierResult =
  | { ok: true; ref: string }
  | { ok: false; needsAuth: true }
  | { ok: false; needsAuth: false; message: string };

export async function submitDossier(input: SubmitDossierInput): Promise<SubmitDossierResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return { ok: false, needsAuth: true };
  }

  const { type, forme, data } = input;
  const nature = type === "creation" ? null : type === "modification" ? data.nature : data.motif;

  const { data: dossier, error: dossierError } = await supabase
    .from("dossiers")
    .insert({
      client_id: user.id,
      client_email: user.email ?? data.email,
      type,
      forme,
      nature,
      societe_nom: data.nom,
      siren: type === "creation" ? null : data.siren,
      plan: Number(data.plan),
      draft: { data, associes: input.associes },
    })
    .select("id, ref")
    .single();

  if (dossierError || !dossier) {
    return { ok: false, needsAuth: false, message: dossierError?.message ?? "Échec de l’enregistrement du dossier." };
  }

  // Les associés sont insérés avant la soumission : la politique RLS
  // d'écriture client sur `associes` exige que le dossier parent ne soit
  // pas encore soumis (submitted_at is null).
  if (type === "creation" && input.associes.length > 0) {
    const { error: associesError } = await supabase.from("associes").insert(
      input.associes.map((a, position) => ({
        dossier_id: dossier.id,
        position,
        prenom: a.prenom,
        nom: a.nom,
        date_naissance: a.dateNaissance || null,
        nationalite: a.nationalite || null,
        adresse: a.adresse || null,
        apport_eur: Number(a.apportEur) || null,
        est_dirigeant: String(position) === data.dirigeantIdx,
      }))
    );
    if (associesError) {
      return { ok: false, needsAuth: false, message: associesError.message };
    }
  }

  const { error: submitError } = await supabase
    .from("dossiers")
    .update({ submitted_at: new Date().toISOString() })
    .eq("id", dossier.id);

  if (submitError) {
    return { ok: false, needsAuth: false, message: submitError.message };
  }

  return { ok: true, ref: dossier.ref as string };
}
