import Header from "@/components/Header";
import Footer from "@/components/Footer";
import IntroForm from "@/components/IntroForm";
import { NEED_BEFORE, TypeKey } from "@/lib/data";

export default function IntroView({ type }: { type: TypeKey }) {
  const need = NEED_BEFORE[type];

  return (
    <>
      <Header />
      <main>
        <div className="wrap">
          <section className="intro">
            <div className="introL">
              <h1>Parlons de votre projet</h1>
              <p className="lead">
                Quelques questions, environ dix minutes. Un expert-comptable relit ensuite votre dossier avant
                tout dépôt.
              </p>
              <IntroForm initialType={type} />
            </div>
            <aside className="introR" aria-label="Avant de commencer">
              <div>
                <h2>Avant de commencer</h2>
                <h3 style={{ marginTop: 18 }}>À avoir sous la main</h3>
                <ul className="ck">
                  {need.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <p className="note" style={{ marginTop: 14 }}>
                  Il vous manque quelque chose ? Vous pourrez l’ajouter plus tard.
                </p>
              </div>
              <hr />
              <div>
                <h3>Ensuite</h3>
                <ul className="ck">
                  <li>Un e-mail de confirmation arrive tout de suite</li>
                  <li>Un expert-comptable relit votre dossier</li>
                  <li>Vous suivez chaque étape en ligne</li>
                </ul>
              </div>
            </aside>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
