import "server-only";
import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import type { Associe, DraftData } from "./questionnaire";
import { dirigeantNomCalcule } from "./questionnaire";
import { nombreEnLettres } from "./nombreEnLettres";

const TEMPLATE_PATH = path.join(process.cwd(), "src/lib/templates/statuts-sasu.docx");

function montant(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n);
}

function euros(n: number): string {
  return `${montant(n)} euro${n === 1 ? "" : "s"}`;
}

// Mapping fixe entre la date de clôture (liste fermée du questionnaire)
// et la date de début de l'exercice suivant.
const DEBUT_EXERCICE: Record<string, string> = {
  "31 décembre": "1er janvier",
  "30 juin": "1er juillet",
  "31 mars": "1er avril",
  "30 septembre": "1er octobre",
};

function identiteComplete(a: {
  civilite: "M" | "Mme";
  prenom: string;
  nom: string;
  dateNaissance: string;
  lieuNaissance: string;
  adresse: string;
  codePostal: string;
  ville: string;
  nationalite: string;
}): string {
  const civilite = a.civilite === "Mme" ? "Madame" : "Monsieur";
  const ne = a.civilite === "Mme" ? "née" : "né";
  const dateNaissance = a.dateNaissance
    ? new Date(a.dateNaissance).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : "[date de naissance]";
  return (
    `${civilite} ${a.prenom} ${a.nom}, ${ne} le ${dateNaissance} à ${a.lieuNaissance || "[lieu de naissance]"}, ` +
    `demeurant au ${a.adresse}, ${a.codePostal} ${a.ville} et de nationalité ${a.nationalite || "[nationalité]"}`
  );
}

export type StatutsSasuData = Record<string, string>;

/** Construit les valeurs à injecter dans le modèle à partir d'un dossier de création SASU. */
export function buildStatutsSasuData(data: DraftData, associes: Associe[]): StatutsSasuData {
  const associeUnique = associes[0];
  const capital = Number(data.capital) || 0;
  const valeurNominale = Number(data.valeurNominale) || 1;
  const nbActions = valeurNominale > 0 ? Math.round(capital / valeurNominale) : 0;

  const siegeAdresse = `${data.adresse}, ${data.codePostal} ${data.ville}`;

  const presidentEstAssocie = data.dirigeantIdx !== "x";
  const presidentIdentite = presidentEstAssocie
    ? identiteComplete(associeUnique)
    : `[identité complète de ${data.dirigeantNom || "[nom du président]"} à compléter]`;
  const presidentNomCourt = presidentEstAssocie
    ? `${associeUnique.civilite === "Mme" ? "Madame" : "Monsieur"} ${associeUnique.prenom} ${associeUnique.nom}`
    : dirigeantNomCalcule(data, associes) || data.dirigeantNom;

  const debutExercice = DEBUT_EXERCICE[data.cloture] ?? "1er janvier";

  return {
    nomSociete: data.nom,
    capitalChiffres: montant(capital),
    siegeAdresse,
    associeIdentite: identiteComplete(associeUnique),
    objetLigne1: data.activite,
    capitalEnLettresEtChiffres: `${nombreEnLettres(capital)} euro${capital === 1 ? "" : "s"} (${euros(capital)})`,
    nbActions: montant(nbActions),
    valeurNominaleEnLettresEtChiffres: `${nombreEnLettres(valeurNominale)} euro${valeurNominale === 1 ? "" : "s"} (${euros(valeurNominale)})`,
    capitalDepot: euros(capital),
    capitalEnLettresMajEtChiffres: `${nombreEnLettres(capital).toUpperCase()} EURO${capital === 1 ? "" : "S"} (${euros(capital)})`,
    valeurNominaleChiffres: euros(valeurNominale),
    numerotationActions: `1 à ${montant(nbActions)}`,
    exerciceSocial: `${debutExercice} et finit le ${data.cloture}`,
    presidentIdentite,
    presidentNomCourt,
    villeSignature: data.ville || data.adresse,
    dateSignature: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
  };
}

/** Génère les statuts SASU remplis, en Buffer .docx. */
export function generateStatutsSasuBuffer(data: DraftData, associes: Associe[]): Buffer {
  const content = fs.readFileSync(TEMPLATE_PATH, "binary");
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.render(buildStatutsSasuData(data, associes));
  return doc.getZip().generate({ type: "nodebuffer" });
}
