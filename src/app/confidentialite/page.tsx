import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DraftNotice from "@/components/legal/DraftNotice";

export default function ConfidentialitePage() {
  return (
    <>
      <Header />
      <main>
        <div className="wrap">
          <section className="sec" style={{ maxWidth: 760 }}>
            <h1 style={{ fontSize: "clamp(2rem,5vw,2.8rem)" }}>Politique de confidentialité</h1>
            <DraftNotice />

            <h2>1. Responsable de traitement</h2>
            <p>
              [RAISON SOCIALE], [FORME JURIDIQUE], [ADRESSE], est responsable du traitement des
              données personnelles collectées via ce site, au sens du Règlement général sur la
              protection des données (RGPD).
            </p>

            <h2>2. Données que nous collectons</h2>
            <ul className="ck">
              <li>Identité et contact : nom, prénom, date de naissance, nationalité, adresse, e-mail, téléphone.</li>
              <li>Données de la société : dénomination, forme juridique, activité, capital, siège, SIREN.</li>
              <li>Pièces justificatives : pièce d'identité, justificatif de domicile, Kbis, statuts.</li>
              <li>Données de connexion : adresse e-mail utilisée pour la connexion sans mot de passe.</li>
              <li>Journal des actions sur votre dossier (horodatage, type d'action), à des fins de preuve et de sécurité.</li>
            </ul>

            <h2>3. Pourquoi nous les utilisons</h2>
            <ul className="ck">
              <li>Exécuter la prestation de formalité que vous nous confiez (base légale : exécution du contrat).</li>
              <li>Transmettre votre dossier au cabinet d'expertise comptable partenaire et, le cas échéant, au guichet unique (INPI) et au service des annonces légales (base légale : exécution du contrat / obligation légale).</li>
              <li>Vous informer de l'avancement de votre dossier (base légale : exécution du contrat).</li>
              <li>Sécuriser le service et prévenir la fraude (base légale : intérêt légitime).</li>
            </ul>

            <h2>4. Qui y a accès</h2>
            <p>
              Seuls vous-même et les membres du cabinet ayant validé une double authentification
              peuvent consulter votre dossier — c'est imposé techniquement par des règles d'accès
              strictes sur notre base de données (Row Level Security), pas seulement par une
              politique interne. Les notes internes du cabinet et le journal d'audit ne sont
              jamais visibles côté client.
            </p>
            <p>
              Nous faisons appel aux sous-traitants techniques suivants, chacun encadré par un
              contrat de sous-traitance conforme au RGPD :
            </p>
            <ul className="ck">
              <li>Supabase (base de données et fichiers), hébergement en Union européenne.</li>
              <li>Vercel (hébergement de l'application web).</li>
              <li>[PRESTATAIRE D'ENVOI D'E-MAILS] (envoi des e-mails de connexion et de notification) — situé hors Union européenne ; ce transfert est encadré par des clauses contractuelles types.</li>
              <li>[STRIPE, une fois le paiement activé] (traitement des paiements).</li>
              <li>[YOUSIGN, une fois activé] (signature électronique des statuts).</li>
            </ul>

            <h2>5. Combien de temps nous les conservons</h2>
            <p>
              Les pièces justificatives sont supprimées [DÉLAI À DÉFINIR, ex. 90 jours] après la
              clôture de votre dossier, sauf obligation légale de conservation plus longue. Les
              données du dossier sont conservées [DÉLAI À DÉFINIR] à des fins de preuve et
              d'obligations comptables/fiscales, conformément aux durées légales applicables à la
              profession d'expert-comptable.
            </p>

            <h2>6. Vos droits</h2>
            <p>
              Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, de
              portabilité et d'opposition sur vos données, ainsi que du droit de définir des
              directives relatives à leur sort après votre décès. Pour les exercer, écrivez à
              [ADRESSE E-MAIL DE CONTACT DPO/RGPD]. Vous pouvez aussi introduire une réclamation
              auprès de la CNIL (www.cnil.fr).
            </p>

            <h2>7. Sécurité</h2>
            <p>
              Votre dossier n'est accessible qu'à vous et au cabinet, après une authentification
              sans mot de passe par e-mail (client) ou par e-mail, mot de passe et double
              authentification (cabinet). Les communications avec le site sont chiffrées (HTTPS).
            </p>

            <h2>8. Cookies</h2>
            <p>
              Ce site n'utilise pas de cookies de mesure d'audience ou de publicité à ce jour.
              Seuls des cookies strictement nécessaires au fonctionnement du service (maintien de
              votre session de connexion) sont déposés. [À METTRE À JOUR SI UN OUTIL D'ANALYTICS
              EST AJOUTÉ.]
            </p>

            <h2>9. Contact</h2>
            <p>Pour toute question relative à vos données : [ADRESSE E-MAIL DE CONTACT].</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
