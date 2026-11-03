import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SignOutButton from "@/components/auth/SignOutButton";
import DraftSync from "@/components/mon-dossier/DraftSync";
import PieceUploader from "@/components/mon-dossier/PieceUploader";
import { pieceLabel } from "@/lib/questionnaire";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MonDossierPage() {
  const supabase = await createClient();
  const { data: dossiers } = await supabase
    .from("dossiers")
    .select("id, ref, type, status, societe_nom, created_at, submitted_at")
    .not("submitted_at", "is", null)
    .order("created_at", { ascending: false });

  const { data: pieces } = await supabase
    .from("pieces")
    .select("id, dossier_id, kind, status, original_filename")
    .in("dossier_id", (dossiers ?? []).map((d) => d.id));

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
              dossiers.map((d) => {
                const dossierPieces = (pieces ?? []).filter((p) => p.dossier_id === d.id);
                return (
                  <div key={d.id} className="cardx" style={{ marginTop: 24 }}>
                    <h3>
                      {d.societe_nom || "Société sans nom"}
                      <span style={{ fontWeight: 400, fontSize: 14, color: "var(--ink2)" }}>
                        {d.ref} · {d.status}
                      </span>
                    </h3>
                    {dossierPieces.length > 0 && (
                      <>
                        <p className="sub" style={{ marginTop: 0 }}>
                          Déposez vos pièces (PDF, JPG ou PNG) :
                        </p>
                        {dossierPieces.map((p) => (
                          <PieceUploader
                            key={p.id}
                            piece={{
                              id: p.id,
                              dossier_id: p.dossier_id,
                              kind: p.kind,
                              label: pieceLabel(p.kind),
                              status: p.status,
                              original_filename: p.original_filename,
                            }}
                          />
                        ))}
                      </>
                    )}
                  </div>
                );
              })
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
