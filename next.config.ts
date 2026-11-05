import type { NextConfig } from "next";

// Legalgo est une application largement dynamique et personnalisée
// (dossiers, authentification, espace cabinet) : on reste sur le rendu
// dynamique classique plutôt que Cache Components, pour éviter la
// cérémonie Suspense/`use cache: private` sur la quasi-totalité des
// pages protégées.
const nextConfig: NextConfig = {
  // Le modèle Word des statuts SASU (src/lib/statutsSasu.ts) est lu avec
  // fs.readFileSync à l'exécution : un chemin dynamique, donc invisible
  // au traçage de fichiers de Next.js sans cette inclusion explicite.
  outputFileTracingIncludes: {
    "/**": ["./src/lib/templates/**"],
  },
};

export default nextConfig;
