import type { NextConfig } from "next";

// Fondée est une application largement dynamique et personnalisée
// (dossiers, authentification, espace cabinet) : on reste sur le rendu
// dynamique classique plutôt que Cache Components, pour éviter la
// cérémonie Suspense/`use cache: private` sur la quasi-totalité des
// pages protégées.
const nextConfig: NextConfig = {};

export default nextConfig;
