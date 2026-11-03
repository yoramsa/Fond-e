import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MagicLinkForm from "@/components/auth/MagicLinkForm";

// Rend un client Supabase (variables NEXT_PUBLIC_*) : jamais prérendu
// statiquement, pour ne jamais figer des identifiants de build.
export const dynamic = "force-dynamic";

export default function ConnexionPage() {
  return (
    <>
      <Header />
      <main>
        <div className="wrap">
          <section className="intro" style={{ gridTemplateColumns: "1fr", maxWidth: 480 }}>
            <div className="introL">
              <h1 style={{ fontSize: "clamp(2rem,5vw,2.8rem)" }}>Suivre mon dossier</h1>
              <p className="lead">
                Recevez un lien de connexion par e-mail, sans mot de passe. Aucune donnée de carte,
                aucune information sensible n’y transite.
              </p>
              <MagicLinkForm />
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
