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
    .select("id, ref, type, status, societe_nom, created_at, submitted_at, draft")
    .not("submitted_at", "is", null)
    .order("created_at", { ascending: false });

  const dossierIds = (dossiers ?? []).map((d) => d.id);

  const { data: pieces } = await supabase
    .from("pieces")
    .select("id, dossier_id, kind, status, original_filename")
    .in("dossier_id", dossierIds);

  const { data: logs } = await supabase
    .from("dossier_log")
    .select("id, dossier_id, label, detail, created_at")
    .in("dossier_id", dossierIds)
    .order("created_at", { ascending: true });

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
                const dossierLogs = (logs ?? []).filter((l) => l.dossier_id === d.id);
                const draft = d.draft as { statutsBase64?: string; statutsFilename?: string } | null;
                return (
                  <div key={d.id} className="cardx" style={{ marginTop: 24 }}>
                    <h3>
                      {d.societe_nom || "Société sans nom"}
                      <span style={{ fontWeight: 400, fontSize: 14, color: "var(--ink2)" }}>
                        {d.ref} · {d.status}
                      </span>
                    </h3>

                    {dossierLogs.length > 0 && (
                      <ol className="tl">
                        {dossierLogs.map((l) => (
                          <li key={l.id} className="ok">
                            <b>{l.label}</b>
                            <span>
                              {new Date(l.created_at).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                              {l.detail ? ` — ${l.detail}` : ""}
                            </span>
                          </li>
                        ))}
                      </ol>
                    )}

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

                    {draft?.statutsBase64 && draft?.statutsFilename && (
                      <p className="sub">
                        <a
                          href={`data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${draft.statutsBase64}`}
                          download={draft.statutsFilename}
                        >
                          Télécharger les statuts générés
                        </a>{" "}
                        (lien temporaire, pour les tests uniquement)
                      </p>
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
