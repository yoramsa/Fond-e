import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroDemo from "@/components/HeroDemo";
import PlansTabs from "@/components/PlansTabs";
import { ArrowIcon, DocIcon, CalcIcon, CardIcon, ChatIcon } from "@/components/icons";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <div className="wrap">
          <section className="hero heroPanel">
            <div>
              <h1>Votre société prend forme ici.</h1>
              <p className="lead">
                Création, modification, fermeture : vous répondez à quelques questions, un expert-comptable
                relit tout, vous suivez chaque étape en ligne.
              </p>
              <div className="cta">
                <Link className="btn" href="/demarrer/creation">
                  Créer ma société <ArrowIcon />
                </Link>
                <a className="btn alt" href="#services">
                  Tous nos services
                </a>
              </div>
              <ul className="ck trust">
                <li>Relu par un expert-comptable</li>
                <li>100 % en ligne, environ dix minutes</li>
                <li>Dès 0 €, plus les frais officiels</li>
              </ul>
            </div>
            <HeroDemo />
          </section>
        </div>

        <div className="wrap">
          <section className="sec" id="services">
            <h2>La solution complète pour lancer et piloter votre société</h2>
            <div className="solu">
              <div>
                <span className="ic">
                  <DocIcon />
                </span>
                <h3>Formalités juridiques</h3>
                <p>
                  Statuts, annonce légale, dépôt au guichet unique. Un expert-comptable vérifie votre dossier
                  avant tout envoi.
                </p>
              </div>
              <div>
                <span className="ic">
                  <CalcIcon />
                </span>
                <h3>Expertise comptable</h3>
                <p>Déléguez votre comptabilité à notre cabinet : bilan, TVA et liasse fiscale.</p>
              </div>
              <div>
                <span className="ic">
                  <CardIcon />
                </span>
                <h3>Compte pro et domiciliation</h3>
                <p>Un compte pour déposer votre capital et une adresse pour votre siège, sans paperasse.</p>
              </div>
              <div>
                <span className="ic">
                  <ChatIcon />
                </span>
                <h3>Accompagnement</h3>
                <p>Une équipe qui répond à vos questions pendant tout votre dossier.</p>
              </div>
            </div>
          </section>
        </div>

        <div className="wrap">
          <section className="sec">
            <div className="panel peri">
              <h2>Créez votre société en 3 étapes</h2>
              <div className="big3">
                <div className="b3">
                  <span className="num">01</span>
                  <h3>Vous répondez à quelques questions</h3>
                  <p>Forme juridique, siège, associés : le questionnaire vous guide, avec une aide à chaque étape.</p>
                </div>
                <div className="b3">
                  <span className="num">02</span>
                  <h3>Nous constituons votre dossier</h3>
                  <p>Statuts et documents sont générés à partir de vos réponses, puis relus par un expert-comptable.</p>
                </div>
                <div className="b3">
                  <span className="num">03</span>
                  <h3>Nous déposons, vous suivez</h3>
                  <p>Annonce légale, dépôt au guichet unique, puis suivi en ligne jusqu’à votre Kbis.</p>
                </div>
              </div>
              <Link className="btn" href="/demarrer/creation" style={{ marginTop: 28 }}>
                Créer ma société <ArrowIcon />
              </Link>
            </div>
          </section>
        </div>

        <div className="wrap">
          <section className="sec" style={{ paddingBottom: 24 }}>
            <h2>Légalgo, la solution tout-en-un pour les entrepreneurs</h2>

            <div className="show">
              <div className="vis v1">
                <div className="mock" aria-hidden="true">
                  <h4>Atelier Pivoine</h4>
                  <ul className="tl">
                    <li className="ok">
                      <b>Reçu</b>
                      <span>Dossier reçu</span>
                    </li>
                    <li className="ok">
                      <b>En vérification</b>
                      <span>Relu par le cabinet</span>
                    </li>
                    <li className="ok">
                      <b>Annonce légale publiée</b>
                      <span>Annonce parue</span>
                    </li>
                    <li className="ok">
                      <b>Déposé au guichet unique</b>
                      <span>Transmis au greffe</span>
                    </li>
                  </ul>
                  <div className="stamp">Immatriculé</div>
                </div>
              </div>
              <div>
                <h3>Un dossier qu’on peut suivre</h3>
                <p>
                  Chaque étape est visible en ligne, de la relecture au Kbis. Une pièce manque ? On vous le dit
                  tout de suite et vous l’envoyez depuis votre téléphone. Le lien vers votre espace vous est
                  envoyé par e-mail dès que votre dossier est reçu.
                </p>
              </div>
            </div>

            <div className="show rev">
              <div className="vis v2">
                <div className="mock" aria-hidden="true">
                  <h4>Votre comptabilité</h4>
                  <div className="mrow">
                    <span>Déclaration de TVA</span>
                    <span className="pill d">Pris en charge</span>
                  </div>
                  <div className="mrow">
                    <span>Bilan annuel</span>
                    <span className="pill d">Pris en charge</span>
                  </div>
                  <div className="mrow">
                    <span>Liasse fiscale</span>
                    <span className="pill d">Pris en charge</span>
                  </div>
                  <div className="mrow">
                    <span>Factures et justificatifs</span>
                    <span className="pill">Vous envoyez</span>
                  </div>
                </div>
              </div>
              <div>
                <h3>Une comptabilité qui suit votre société</h3>
                <p>
                  Notre cabinet d’expertise comptable peut prendre le relais après l’immatriculation. Vous restez
                  concentré sur votre activité.
                </p>
                <Link className="btn alt" href="/demarrer/creation">
                  Ajouter la comptabilité
                </Link>
              </div>
            </div>

            <div className="show">
              <div className="vis v3">
                <div className="mock" aria-hidden="true">
                  <h4>Que souhaitez-vous modifier ?</h4>
                  <div className="msel on">Transfert de siège</div>
                  <div className="msel">Changement de dirigeant</div>
                  <div className="msel">Modification des statuts</div>
                  <div className="msel">Cession de parts</div>
                  <div className="msel">Dissolution</div>
                </div>
              </div>
              <div>
                <h3>Votre société évolue, vos statuts aussi</h3>
                <p>
                  Transfert de siège, changement de dirigeant, cession de parts, fermeture : les mêmes questions
                  simples et le même suivi que pour une création.
                </p>
                <Link className="btn alt" href="/demarrer/modification">
                  Modifier ma société
                </Link>
              </div>
            </div>
          </section>
        </div>

        <div className="wrap">
          <section className="sec" id="plans">
            <h2>Trois formules, un seul principe</h2>
            <p className="sub">Plus vous nous confiez, plus nous faisons à votre place.</p>
            <PlansTabs />
          </section>
        </div>

        <div className="wrap">
          <section className="sec">
            <h2>Questions fréquentes</h2>
            <div className="faq">
              <details>
                <summary>Que comprend la formule à 0 € ?</summary>
                <p>
                  Le questionnaire guidé, vos documents générés et la liste des pièces. Vous déposez ensuite le
                  dossier vous-même et vous payez seulement les frais officiels.
                </p>
              </details>
              <details>
                <summary>Que sont les frais officiels ?</summary>
                <p>
                  Ce sont les frais du greffe et de l’annonce légale. Ils sont fixés par l’administration et
                  s’ajoutent à nos honoraires, quelle que soit la plateforme.
                </p>
              </details>
              <details>
                <summary>Combien de temps pour obtenir mon Kbis ?</summary>
                <p>
                  Cela dépend du greffe et de la qualité du dossier. Nous vous prévenons à chaque étape, et la
                  formule Express donne la priorité à votre dossier.
                </p>
              </details>
              <details>
                <summary>Qui voit mes documents ?</summary>
                <p>Vous, et l’équipe qui traite votre dossier. [Politique de confidentialité à rédiger]</p>
              </details>
            </div>
          </section>
        </div>

        <div className="wrap">
          <div className="band">
            <h2>Prêt à lancer votre société ?</h2>
            <Link className="btn" href="/demarrer">
              Commencer mon dossier <ArrowIcon />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
