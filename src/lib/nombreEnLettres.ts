const UNITES = [
  "zéro",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
  "dix-sept",
  "dix-huit",
  "dix-neuf",
];

const DIZAINES = [
  "",
  "",
  "vingt",
  "trente",
  "quarante",
  "cinquante",
  "soixante",
  "soixante-dix",
  "quatre-vingt",
  "quatre-vingt-dix",
];

function deuxChiffres(n: number, suivi: boolean): string {
  if (n < 20) return UNITES[n];
  const d = Math.floor(n / 10);
  const u = n % 10;
  if (d === 7 || d === 9) {
    // soixante-dix / quatre-vingt-dix : la dizaine "de base" (60 / 80) + 10..19
    const base = DIZAINES[d - 1];
    const reste = 10 + u;
    const liaison = u === 1 && d === 7 ? "-et-" : "-";
    return reste === 10 ? `${base}-dix` : `${base}${liaison}${UNITES[reste]}`;
  }
  if (u === 0) return d === 8 && !suivi ? `${DIZAINES[d]}s` : DIZAINES[d];
  if (u === 1 && d !== 8) return `${DIZAINES[d]}-et-un`;
  return `${DIZAINES[d]}-${UNITES[u]}`;
}

// "cent" et "quatre-vingts" ne prennent un "s" que s'ils ne sont suivis
// d'aucun autre mot-nombre — ni dans le même groupe de 3 chiffres
// (ex. "deux cents" mais "deux cent un"), ni par "mille"/"million(s)".
function troisChiffres(n: number, suiviParAutreChose: boolean): string {
  const c = Math.floor(n / 100);
  const reste = n % 100;
  const parts: string[] = [];
  if (c > 0) {
    const pluriel = c > 1 && reste === 0 && !suiviParAutreChose;
    parts.push(c === 1 ? "cent" : `${UNITES[c]} cent${pluriel ? "s" : ""}`);
  }
  if (reste > 0) parts.push(deuxChiffres(reste, suiviParAutreChose));
  return parts.join(" ");
}

/** Nombre entier en toutes lettres, en français (ex. 2000 → "deux mille"). */
export function nombreEnLettres(n: number): string {
  if (!Number.isFinite(n)) return "";
  if (n === 0) return "zéro";
  if (n < 0) return `moins ${nombreEnLettres(-n)}`;

  const millions = Math.floor(n / 1_000_000);
  const milliers = Math.floor((n % 1_000_000) / 1000);
  const reste = n % 1000;

  const parts: string[] = [];
  if (millions > 0) {
    parts.push(millions === 1 ? "un million" : `${troisChiffres(millions, true)} millions`);
  }
  if (milliers > 0) {
    parts.push(milliers === 1 ? "mille" : `${troisChiffres(milliers, true)} mille`);
  }
  if (reste > 0 || parts.length === 0) {
    parts.push(troisChiffres(reste, false));
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}
