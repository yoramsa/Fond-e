import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DraftNotice from "@/components/legal/DraftNotice";

export default function MentionsLegalesPage() {
  return (
    <>
      <Header />
      <main>
        <div className="wrap">
          <section className="sec" style={{ maxWidth: 760 }}>
            <h1 style={{ fontSize: "clamp(2rem,5vw,2.8rem)" }}>Mentions légales</h1>
            <DraftNotice />

            <h2>Éditeur du site</h2>
            <p>
              Le site fondée (ce nom est provisoire) est édité par [RAISON SOCIALE], [FORME
              JURIDIQUE] au capital de [MONTANT] €, immatriculée au Registre du commerce et des
              sociétés de [VILLE] sous le numéro [SIREN], dont le siège social est situé [ADRESSE
              COMPLÈTE].
            </p>
            <p>
              Numéro de TVA intracommunautaire : [NUMÉRO TVA].
              <br />
              Directeur de la publication : [NOM, QUALITÉ].
              <br />
              Contact : [ADRESSE E-MAIL DE CONTACT].
            </p>

            <h2>Activité réglementée</h2>
            <p>
              Le site propose un service d'accompagnement technique aux formalités de création,
              modification et fermeture de sociétés. La relecture et le dépôt des dossiers sont
              assurés par [NOM DU CABINET], cabinet d'expertise comptable inscrit à l'Ordre des
              experts-comptables sous le numéro [NUMÉRO D'INSCRIPTION], [RÉGION]. [RAISON SOCIALE]
              n'exerce pas elle-même la profession d'expert-comptable et agit en tant qu'éditeur
              de la plateforme technique.
            </p>

            <h2>Hébergement</h2>
            <p>
              Hébergement de l'application : Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789,
              États-Unis.
              <br />
              Hébergement de la base de données et des fichiers (pièces jointes) : Supabase Inc.,
              région Union européenne.
            </p>

            <h2>Propriété intellectuelle</h2>
            <p>
              L'ensemble des contenus présents sur le site (textes, graphismes, logo, structure)
              sont la propriété de [RAISON SOCIALE] ou de ses partenaires, sauf mention contraire,
              et ne peuvent être reproduits sans autorisation préalable.
            </p>

            <h2>Médiation de la consommation</h2>
            <p>
              Conformément aux articles L.616-1 et R.616-1 du Code de la consommation, [RAISON
              SOCIALE] propose un dispositif de médiation de la consommation. L'entité de
              médiation retenue est : [NOM DU MÉDIATEUR]. [ADRESSE / SITE DU MÉDIATEUR].
            </p>

            <h2>Contact</h2>
            <p>Pour toute question relative au site : [ADRESSE E-MAIL DE CONTACT].</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
