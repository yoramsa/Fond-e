import "server-only";

const API_BASE = "https://recherche-entreprises.api.gouv.fr/search";

type ApiResult = {
  siren: string;
  nom_complet: string;
  nom_raison_sociale: string | null;
  etat_administratif: "A" | "C"; // actif / cessé
};

type ApiResponse = { results: ApiResult[] };

async function searchEntreprises(q: string, perPage: number): Promise<ApiResult[]> {
  const url = `${API_BASE}?q=${encodeURIComponent(q)}&page=1&per_page=${perPage}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`recherche-entreprises : ${res.status}`);
  const body = (await res.json()) as ApiResponse;
  return body.results ?? [];
}

export type SirenLookup =
  | { status: "ok"; nom: string }
  | { status: "not_found" }
  | { status: "error" };

/** Vérifie qu'un SIREN correspond à une société réellement immatriculée. */
export async function lookupSiren(siren: string): Promise<SirenLookup> {
  try {
    const results = await searchEntreprises(siren, 1);
    const match = results.find((r) => r.siren === siren);
    if (!match) return { status: "not_found" };
    return { status: "ok", nom: match.nom_complet || match.nom_raison_sociale || siren };
  } catch (err) {
    console.error("lookupSiren a échoué :", err);
    return { status: "error" };
  }
}

/** Sociétés existantes dont le nom ressemble fortement à celui proposé. */
export async function findSimilarNames(nom: string): Promise<string[]> {
  const needle = nom.trim().toLowerCase();
  if (needle.length < 3) return [];
  try {
    const results = await searchEntreprises(nom, 5);
    return results
      .filter((r) => r.etat_administratif === "A")
      .map((r) => r.nom_complet || r.nom_raison_sociale || "")
      .filter((n) => n && n.toLowerCase() === needle);
  } catch (err) {
    console.error("findSimilarNames a échoué :", err);
    return [];
  }
}
