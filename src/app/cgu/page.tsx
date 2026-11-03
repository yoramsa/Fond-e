import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DraftNotice from "@/components/legal/DraftNotice";

export default function CguPage() {
  return (
    <>
      <Header />
      <main>
        <div className="wrap">
          <section className="sec" style={{ maxWidth: 760 }}>
            <h1 style={{ fontSize: "clamp(2rem,5vw,2.8rem)" }}>
              Conditions générales d'utilisation et de vente
            </h1>
            <DraftNotice />

            <h2>Article 1 — Objet</h2>
            <p>
              Les présentes conditions régissent l'utilisation du site [NOM DU SITE] et la
              fourniture des services de formalités juridiques (création, modification, fermeture
              de société) proposés par [RAISON SOCIALE]. Toute utilisation du site implique
              l'acceptation pleine et entière des présentes conditions.
            </p>

            <h2>Article 2 — Description du service</h2>
            <p>
              Le site permet de répondre à un questionnaire guidé, de générer les documents
              nécessaires à la formalité choisie, puis de faire relire et déposer le dossier par
              [NOM DU CABINET], cabinet d'expertise comptable partenaire. Trois formules sont
              proposées (Essentiel, Sérénité, Express), détaillées sur le site, dont le contenu
              exact peut évoluer.
            </p>

            <h2>Article 3 — Compte et accès</h2>
            <p>
              L'accès à votre espace se fait par connexion sans mot de passe (lien envoyé par
              e-mail). Vous êtes responsable de la confidentialité de l'accès à votre messagerie.
            </p>

            <h2>Article 4 — Prix et paiement</h2>
            <p>
              Les prix affichés sont exprimés en euros [HT/TTC à préciser]. Le règlement s'effectue
              [MODALITÉS À PRÉCISER une fois le paiement en ligne activé]. Des frais officiels
              (greffe, annonce légale) s'ajoutent au prix de la formule et sont dus séparément,
              directement aux organismes concernés ou par notre intermédiaire selon la formule
              choisie.
            </p>

            <h2>Article 5 — Droit de rétractation</h2>
            <p>
              Conformément à l'article L.221-18 du Code de la consommation, vous disposez d'un
              délai de 14 jours pour exercer votre droit de rétractation à compter de la
              validation de votre commande. Si vous demandez expressément le commencement de
              l'exécution du service avant la fin de ce délai (ce que la validation du
              questionnaire et la demande de relecture emportent), vous reconnaissez que votre
              droit de rétractation ne pourra plus être exercé une fois le service pleinement
              exécuté, conformément à l'article L.221-28 du même code. [À FAIRE VALIDER
              PRÉCISÉMENT PAR UN JURISTE : formulation exacte du recueil de cet accord exprès dans
              le parcours.]
            </p>

            <h2>Article 6 — Obligations et responsabilités</h2>
            <p>
              [RAISON SOCIALE] édite une plateforme technique facilitant la préparation et la
              transmission des dossiers. Elle n'exerce pas elle-même la profession d'expert-
              comptable. La relecture, le conseil et le dépôt des dossiers relèvent de la
              responsabilité de [NOM DU CABINET], professionnel inscrit à l'Ordre des experts-
              comptables. Les informations saisies par le client engagent sa responsabilité quant
              à leur exactitude.
            </p>

            <h2>Article 7 — Propriété intellectuelle</h2>
            <p>
              Les documents générés pour votre dossier vous appartiennent une fois la prestation
              réalisée. Le site, sa structure et son contenu restent la propriété de [RAISON
              SOCIALE].
            </p>

            <h2>Article 8 — Données personnelles</h2>
            <p>
              Le traitement de vos données personnelles est détaillé dans notre{" "}
              <a href="/confidentialite">politique de confidentialité</a>.
            </p>

            <h2>Article 9 — Résiliation</h2>
            <p>
              Vous pouvez à tout moment demander l'arrêt du traitement de votre dossier tant qu'il
              n'a pas été transmis aux organismes officiels, en écrivant à [ADRESSE E-MAIL DE
              CONTACT].
            </p>

            <h2>Article 10 — Droit applicable et litiges</h2>
            <p>
              Les présentes conditions sont soumises au droit français. En cas de litige, et après
              recherche d'une solution amiable, les tribunaux français compétents seront saisis,
              sans préjudice du dispositif de médiation de la consommation mentionné dans nos{" "}
              <a href="/mentions-legales">mentions légales</a>.
            </p>

            <h2>Article 11 — Contact</h2>
            <p>Pour toute question : [ADRESSE E-MAIL DE CONTACT].</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
