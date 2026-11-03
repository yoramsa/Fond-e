"use server";

import { findSimilarNames, lookupSiren, type SirenLookup } from "@/lib/entreprises";

export async function checkSiren(siren: string): Promise<SirenLookup> {
  return lookupSiren(siren);
}

export async function checkNomSociete(nom: string): Promise<{ matches: string[] }> {
  return { matches: await findSimilarNames(nom) };
}
