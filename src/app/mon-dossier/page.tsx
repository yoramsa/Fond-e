import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SignOutButton from "@/components/auth/SignOutButton";
import DraftSync from "@/components/mon-dossier/DraftSync";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MonDossierPage() {
  const supabase = await createClient();
  const { data: dossiers } = await supabase
    .from("dossiers")
    .select("ref, type, status, societe_nom, created_at")
    .order("created_at", { ascending: false });

  return (
    <>
      <Header />
      <main>
        <div className="wrap">
          <section className="sec">
            <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)" }}>Votre espace</h1>
            <p className="sub">Le suivi détaillé arrive dans les phases suivantes.</p>

            <DraftSync />

            {dossiers && dossiers.length > 0 ? (
              <ul className="ck" style={{ marginTop: 24 }}>
                {dossiers.map((d) => (
                  <li key={d.ref}>
                    <b>{d.societe_nom || "Société sans nom"}</b> — {d.ref} · {d.status}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="sub">Aucun dossier pour l’instant.</p>
            )}

            <div style={{ marginTop: 24 }}>
              <SignOutButton />
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
