import { FORMES, FormeKey, OPTS, PLANS, PRIX, TypeKey, eur } from "./data";

export type Siege = "dirigeant" | "local" | "domiciliation";

export type Associe = {
  prenom: string;
  nom: string;
  dateNaissance: string;
  nationalite: string;
  adresse: string;
  apportEur: string;
};

export type DraftData = {
  nom: string;
  nomCommercial: string;
  activite: string;
  capital: string;
  siege: Siege;
  adresse: string;
  cloture: string;
  dirigeantIdx: string;
  dirigeantNom: string;
  mandat: string;
  nonCondamnation: boolean;
  siren: string;
  nature: string;
  details: string;
  motif: string;
  dateEffet: string;
  plan: string;
  contact: string;
  telephone: string;
  email: string;
  consent: boolean;
  opts: Record<(typeof OPTS)[number]["k"], boolean>;
};

export type QuestionnaireDraft = {
  forme: FormeKey;
  step: number;
  data: DraftData;
  associes: Associe[];
};

export function freshAssocie(): Associe {
  return { prenom: "", nom: "", dateNaissance: "", nationalite: "", adresse: "", apportEur: "" };
}

export function freshDraft(): DraftData {
  return {
    nom: "",
    nomCommercial: "",
    activite: "",
    capital: "1000",
    siege: "dirigeant",
    adresse: "",
    cloture: "31 décembre",
    dirigeantIdx: "0",
    dirigeantNom: "",
    mandat: "Durée illimitée",
    nonCondamnation: false,
    siren: "",
    nature: "Transfert de siège",
    details: "",
    motif: "Cessation d’activité",
    dateEffet: "",
    plan: "1",
    contact: "",
    telephone: "",
    email: "",
    consent: false,
    opts: { dom: false, marque: false, compta: false },
  };
}

export type PieceNeeded = { kind: string; label: string };

/** Pièces à demander au client une fois son dossier reçu (Phase 4). */
export function piecesNeeded(type: TypeKey, associes: Associe[]): PieceNeeded[] {
  if (type === "creation") {
    return [
      ...associes.map((a, i) => ({
        kind: `identite_associe_${i}`,
        label: `Pièce d'identité de ${(a.prenom + " " + a.nom).trim() || `l'associé ${i + 1}`}`,
      })),
      { kind: "justificatif_siege", label: "Justificatif du siège" },
    ];
  }
  return [
    { kind: "kbis", label: "Extrait Kbis de moins de 3 mois" },
    { kind: "identite_dirigeant", label: "Pièce d'identité du dirigeant" },
    { kind: "statuts", label: "Statuts à jour" },
  ];
}

const KNOWN_PIECE_LABELS: Record<string, string> = {
  justificatif_siege: "Justificatif du siège",
  kbis: "Extrait Kbis de moins de 3 mois",
  identite_dirigeant: "Pièce d'identité du dirigeant",
  statuts: "Statuts à jour",
};

/** Libellé lisible pour une pièce déjà enregistrée en base (colonne `kind`). */
export function pieceLabel(kind: string): string {
  if (kind.startsWith("identite_associe_")) {
    const n = Number(kind.slice("identite_associe_".length)) + 1;
    return Number.isFinite(n) ? `Pièce d'identité — associé ${n}` : kind;
  }
  return KNOWN_PIECE_LABELS[kind] ?? kind;
}

export function recapLines(type: TypeKey, data: DraftData): { label: string; value: string }[] {
  const plan = Number(data.plan) || 0;
  const base = PRIX[type][plan];
  const lines = [{ label: `Formule ${PLANS[plan].n}`, value: base === 0 ? "0 €" : `${eur(base)} HT` }];
  for (const o of OPTS) {
    if (data.opts[o.k]) lines.push({ label: o.n, value: o.p });
  }
  lines.push({
    label: "Frais officiels (greffe, annonce légale)",
    value: type === "creation" ? "environ 200 €" : "calculés avant paiement",
  });
  return lines;
}

export function freshQuestionnaire(forme: FormeKey = "SASU"): QuestionnaireDraft {
  return { forme, step: 0, data: freshDraft(), associes: [freshAssocie()] };
}

export function apportSum(associes: Associe[]): number {
  return associes.reduce((sum, a) => sum + (Number(a.apportEur) || 0), 0);
}

export function dirigeantNomCalcule(data: DraftData, associes: Associe[]): string {
  if (data.dirigeantIdx === "x") return data.dirigeantNom.trim();
  const a = associes[Number(data.dirigeantIdx)];
  return a ? `${a.prenom} ${a.nom}`.trim() : "";
}

export function siegeTexte(data: DraftData): string {
  if (data.siege === "dirigeant") return "au domicile du dirigeant";
  if (data.siege === "local") return data.adresse.trim() ? `au ${data.adresse.trim()}` : "";
  return "chez un domiciliataire (adresse communiquée après la validation de la formule)";
}

export function progressPct(type: TypeKey, data: DraftData, associes: Associe[]): number {
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
  const checks =
    type === "creation"
      ? [
          !!data.nom.trim(),
          !!data.activite.trim(),
          data.siege === "domiciliation" || !!data.adresse.trim(),
          Number(data.capital) > 0,
          associes.every((a) => a.prenom && a.nom && a.dateNaissance && Number(a.apportEur) > 0),
          !!dirigeantNomCalcule(data, associes),
          emailOk,
          data.nonCondamnation,
        ]
      : [
          /^\d{9}$/.test(data.siren),
          !!data.nom.trim(),
          type === "modification" ? !!data.details.trim() : !!data.dateEffet,
          !!data.dateEffet,
          emailOk,
        ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function validateStep(
  type: TypeKey,
  stepKey: string,
  forme: FormeKey,
  data: DraftData,
  associes: Associe[]
): string | null {
  const f = FORMES[forme];

  if (stepKey === "Société") {
    if (!data.nom.trim()) return "Le nom de la société est requis.";
    if (!data.activite.trim()) return "Décrivez l’activité de la société.";
    if (!(Number(data.capital) > 0)) return "Le capital doit être supérieur à 0 €.";
    if (data.siege !== "domiciliation" && !data.adresse.trim()) {
      return "L’adresse du siège est requise.";
    }
    return null;
  }

  if (stepKey === "Associés") {
    const min = f.uni ? 1 : 2;
    if (associes.length < min) {
      return `Une ${forme} compte ${min > 1 ? "au moins " + min + " associés" : "un associé unique"}.`;
    }
    for (const a of associes) {
      if (!a.prenom.trim() || !a.nom.trim() || !a.dateNaissance || !(Number(a.apportEur) > 0)) {
        return "Complétez l’identité et l’apport de chaque associé.";
      }
    }
    if (apportSum(associes) !== (Number(data.capital) || 0)) {
      return "Le total des apports doit être égal au capital social.";
    }
    return null;
  }

  if (stepKey === "Dirigeant") {
    if (data.dirigeantIdx === "x" && !data.dirigeantNom.trim()) {
      return "Indiquez le nom complet du dirigeant.";
    }
    if (!data.nonCondamnation) {
      return "Cette déclaration est obligatoire pour continuer.";
    }
    return null;
  }

  if (stepKey === "Votre société") {
    if (!/^\d{9}$/.test(data.siren)) return "Le SIREN doit comporter 9 chiffres.";
    if (!data.nom.trim()) return "Le nom de la société est requis.";
    if (type === "modification" && !data.details.trim()) {
      return "Décrivez la modification souhaitée.";
    }
    if (type === "fermeture" && !data.dateEffet) {
      return "La date d’effet souhaitée est requise.";
    }
    return null;
  }

  if (stepKey === "Pièces") {
    return null;
  }

  if (stepKey === "Formule") {
    if (!data.contact.trim()) return "Votre nom complet est requis.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return "Une adresse e-mail valide est requise.";
    }
    if (!data.consent) return "Vous devez accepter le traitement de votre dossier pour continuer.";
    return null;
  }

  return null;
}
