import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CabinetLoginForm from "@/components/auth/CabinetLoginForm";

export const dynamic = "force-dynamic";

export default function CabinetConnexionPage() {
  return (
    <>
      <Header />
      <main>
        <div className="wrap">
          <section className="intro" style={{ gridTemplateColumns: "1fr", maxWidth: 420 }}>
            <div className="introL">
              <h1 style={{ fontSize: "clamp(2rem,5vw,2.8rem)" }}>Espace cabinet</h1>
              <p className="lead">Accès réservé aux comptes nominatifs du cabinet.</p>
              <CabinetLoginForm />
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
