export type FormeKey = "SASU" | "SAS" | "EURL" | "SARL" | "SCI";

export const FORMES: Record<
  FormeKey,
  { long: string; uni: boolean; dir: "Président" | "Gérant"; hint: string }
> = {
  SASU: {
    long: "société par actions simplifiée unipersonnelle",
    uni: true,
    dir: "Président",
    hint: "Un seul associé, dirigée par un président.",
  },
  SAS: {
    long: "société par actions simplifiée",
    uni: false,
    dir: "Président",
    hint: "Plusieurs associés et une grande liberté dans les statuts.",
  },
  EURL: {
    long: "entreprise unipersonnelle à responsabilité limitée",
    uni: true,
    dir: "Gérant",
    hint: "Un seul associé, dirigée par un gérant.",
  },
  SARL: {
    long: "société à responsabilité limitée",
    uni: false,
    dir: "Gérant",
    hint: "Plusieurs associés, dirigée par un gérant.",
  },
  SCI: {
    long: "société civile immobilière",
    uni: false,
    dir: "Gérant",
    hint: "Pour détenir ou gérer un bien immobilier à plusieurs.",
  },
};

export type TypeKey = "creation" | "modification" | "fermeture";

export const TYPES: Record<
  TypeKey,
  { label: string; verb: string; steps: string[]; desc: string }
> = {
  creation: {
    label: "Création",
    verb: "Créer ma société",
    steps: ["Société", "Associés", "Dirigeant", "Pièces", "Formule"],
    desc: "Nouvelle société, de zéro.",
  },
  modification: {
    label: "Modification",
    verb: "Modifier ma société",
    steps: ["Votre société", "Pièces", "Formule"],
    desc: "Une société existante change.",
  },
  fermeture: {
    label: "Fermeture",
    verb: "Fermer ma société",
    steps: ["Votre société", "Pièces", "Formule"],
    desc: "Dissolution, liquidation, radiation.",
  },
};

export const PRIX: Record<TypeKey, [number, number, number]> = {
  creation: [0, 79, 149],
  modification: [0, 99, 179],
  fermeture: [0, 149, 249],
};

export type Plan = { n: string; rec?: boolean; f: string[] };

export const PLANS: Plan[] = [
  {
    n: "Essentiel",
    f: [
      "Questionnaire guidé et documents générés",
      "Liste des pièces à fournir",
      "Suivi de votre dossier en ligne",
      "Vous déposez le dossier vous-même",
    ],
  },
  {
    n: "Sérénité",
    rec: true,
    f: [
      "Tout Essentiel, plus :",
      "Relecture par un expert-comptable",
      "Dépôt au guichet unique par nos soins",
      "Annonce légale publiée",
      "Reprise gratuite si le greffe demande une correction",
    ],
  },
  {
    n: "Express",
    f: [
      "Tout Sérénité, plus :",
      "Traitement prioritaire sous 24 h",
      "Rendez-vous avec le comptable",
      "Dépôt du capital et compte pro",
      "Premier mois de comptabilité offert",
    ],
  },
];

export const OPTS = [
  { k: "dom", n: "Domiciliation du siège", p: "dès 15 €/mois" },
  { k: "marque", n: "Dépôt de marque", p: "dès 190 €" },
  { k: "compta", n: "Comptabilité avec notre cabinet", p: "sur devis" },
] as const;

export const NEED_BEFORE: Record<TypeKey, string[]> = {
  creation: [
    "Une pièce d’identité par associé",
    "L’adresse du siège, ou l’envie d’être domicilié",
    "Le capital que vous visez, 1 € au minimum",
  ],
  modification: [
    "Le SIREN de votre société",
    "Un extrait Kbis de moins de 3 mois",
    "La pièce d’identité du dirigeant",
  ],
  fermeture: [
    "Le SIREN de votre société",
    "Un extrait Kbis de moins de 3 mois",
    "La date à laquelle la société doit s’arrêter",
  ],
};

export function eur(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " €";
}
