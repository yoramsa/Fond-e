"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TYPES, TypeKey } from "@/lib/data";
import { submitDossier } from "@/app/questionnaire/actions";

function storageKey(type: TypeKey) {
  return `fondee:questionnaire:${type}`;
}

type Outcome = { type: TypeKey; ref: string } | { error: string } | null;

/**
 * Le questionnaire se remplit avant la connexion (lien magique) : le
 * brouillon reste alors dans le localStorage du navigateur, en attente
 * que l'utilisateur revienne authentifié pour que le dossier soit créé
 * côté serveur (la RLS exige client_id = auth.uid()).
 */
export default function DraftSync() {
  const router = useRouter();
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      for (const type of Object.keys(TYPES) as TypeKey[]) {
        const raw = window.localStorage.getItem(storageKey(type));
        if (!raw) continue;
        try {
          const draft = JSON.parse(raw);
          if (!draft?.data?.consent || !draft?.data?.email) continue;

          const result = await submitDossier({
            type,
            forme: draft.forme,
            data: draft.data,
            associes: draft.associes ?? [],
          });

          if (cancelled) return;
          if (result.ok) {
            window.localStorage.removeItem(storageKey(type));
            setOutcome({ type, ref: result.ref });
            router.refresh();
          } else if (!result.needsAuth) {
            setOutcome({ error: result.message });
          }
          return;
        } catch {
          window.localStorage.removeItem(storageKey(type));
        }
      }
      if (!cancelled) setChecked(true);
    }

    sync();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!outcome) {
    return checked ? null : null;
  }

  if ("error" in outcome) {
    return (
      <p className="stepErr" role="alert">
        Votre dossier n’a pas pu être enregistré : {outcome.error}
      </p>
    );
  }

  return (
    <div className="sumline" role="status" style={{ marginBottom: 24 }}>
      <span>Dossier {outcome.ref} reçu — {TYPES[outcome.type].verb.toLowerCase()}</span>
    </div>
  );
}
